// The HTTP surface: Bun.serve bound to the loopback interface inside the
// server process (serve.ts). Binds, checks the Host, and dispatches to the
// page routes (routes/pages.ts, for the browser) or the API routes
// (routes/api.ts, for sessions). The configured port is tried first and any
// free port second, so a taken port never stops a publish; the record says
// which was bound.

import type { Server } from "bun";
import { createHash } from "node:crypto";

import { galleryUrl, pageUrl, PREFIX } from "../shared/protocol";
import { BIND, createAuth, DISPLAY } from "./auth";
import type { Core } from "./core";
import { EventHub } from "./events";
import { json } from "./respond";
import { handleApi } from "./routes/api";
import { handlePage } from "./routes/pages";

const PORT_BASE = 41000;
const PORT_SPAN = 1000;

export interface ArtifactServer {
  port: number;
  /** The port that was asked for; differs from `port` after a fallback. */
  requestedPort: number;
  origin: string;
  pageUrl(slug: string, withToken?: boolean): string;
  galleryUrl(): string;
  /** Connected session ids, longest-connected first. */
  sessions(): string[];
  stop(): void;
}

export interface ServerOptions {
  token: string;
  /** >0 that port then any free one; 0 a port derived from `seed` then any; <0 any. */
  port: number;
  seed: string;
  startedAt?: string;
  /** Called after the /api/stop response is sent. */
  onStop?: () => void;
}

/** A stable port per project, for `port: 0`. */
export function derivedPort(seed: string): number {
  const digest = createHash("sha256").update(seed).digest();
  return PORT_BASE + (digest.readUInt32BE(0) % PORT_SPAN);
}

export function startServer(core: Core, options: ServerOptions): ArtifactServer {
  const hub = new EventHub();
  const startedAt = options.startedAt ?? new Date().toISOString();

  core.onEvent((event, manifest) => {
    if (event.kind === "republish") {
      hub.broadcastPage(event.slug, { type: "version", version: event.version, by: "page" });
    } else {
      hub.broadcastPage(event.slug, { type: "comment", threadId: event.thread?.id });
    }
    hub.routeToSession(event, manifest);
  });

  const requestedPort =
    options.port > 0 ? options.port : options.port === 0 ? derivedPort(options.seed) : 0;
  const attempts = requestedPort > 0 ? [requestedPort, 0] : [0];
  let server: Server<undefined> | null = null;
  let lastError: unknown = null;
  for (const port of attempts) {
    try {
      // idleTimeout 0: the event streams stay open for as long as their readers do.
      server = Bun.serve({
        hostname: BIND,
        port,
        idleTimeout: 0,
        fetch: (req, s) => dispatch(req, s.port ?? 0),
      });
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!server) throw new Error(`could not bind the artifact server: ${String(lastError)}`);
  const bound = server;
  const boundPort = bound.port ?? 0;
  const origin = `http://${DISPLAY}:${boundPort}`;
  const auth = createAuth(options.token, boundPort);

  async function dispatch(req: Request, port: number): Promise<Response> {
    const url = new URL(req.url);
    if (!auth.ownHost(req)) return json(421, { error: "misdirected request" });
    if (url.pathname === "/") {
      return new Response(null, {
        status: 303,
        headers: { location: `${PREFIX}/${url.search}`, "cache-control": "no-store" },
      });
    }
    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, url, { core, hub, auth, port, startedAt, onStop: options.onStop });
    }
    return handlePage(req, url, { core, hub, auth });
  }

  return {
    port: boundPort,
    requestedPort,
    origin,
    pageUrl: (slug, withToken = true) =>
      pageUrl(origin, slug, withToken ? options.token : undefined),
    galleryUrl: () => galleryUrl(origin, options.token),
    sessions: () => hub.sessions(),
    stop() {
      hub.closeAll();
      bound.stop(true);
    },
  };
}
