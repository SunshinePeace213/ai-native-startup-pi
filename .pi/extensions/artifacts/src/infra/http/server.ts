// The HTTP surface: Bun.serve bound to the loopback interface inside the
// server process (server.ts at the extension root). Binds one port and
// only that port — a taken port is an error the caller reports, never a
// fallback — checks the Host, and dispatches to the page routes (for the
// browser) or the API routes (for sessions).

import type { Server } from "bun";

import type { Core } from "../../app/core";
import { type Logger, silentLogger } from "../../app/ports";
import { BIND, DISPLAY, galleryUrl, pageUrl, PREFIX } from "../../domain/protocol";
import { createAuth } from "./auth";
import { EventHub } from "./events";
import { json } from "./respond";
import { handleApi } from "./routes/api";
import { handlePage } from "./routes/pages";

export interface ArtifactServer {
  port: number;
  origin: string;
  pageUrl(slug: string, withToken?: boolean): string;
  galleryUrl(): string;
  /** Connected session ids, longest-connected first. */
  sessions(): string[];
  stop(): void;
}

export interface ServerOptions {
  root: string;
  token: string;
  viewer: string;
  /** The port to bind; 0 lets the OS pick (tests). */
  port: number;
  startedAt?: string;
  log?: Logger;
  /** Called after the /api/stop response is sent. */
  onStop?: () => void;
}

export function startServer(core: Core, options: ServerOptions): ArtifactServer {
  const hub = new EventHub();
  const log = options.log ?? silentLogger;
  const startedAt = options.startedAt ?? new Date().toISOString();

  core.onEvent((event, manifest) => {
    hub.broadcastPage(
      event.slug,
      event.kind === "response"
        ? { type: "response", version: event.version, response: event.response }
        : { type: "comment", threadId: event.thread?.id },
    );
    const outcome = hub.routeToSession(event, manifest);
    log.info(
      { action: "route", slug: event.slug, kind: event.kind, owner: manifest.owner, outcome },
      "page event routed",
    );
  });

  let server: Server<undefined>;
  try {
    // idleTimeout 0: the event streams stay open for as long as their readers do.
    server = Bun.serve({
      hostname: BIND,
      port: options.port,
      idleTimeout: 0,
      fetch: (req) => dispatch(req),
    });
  } catch (e) {
    throw new Error(`could not bind ${BIND}:${options.port}: ${(e as Error).message}`);
  }
  const boundPort = server.port ?? 0;
  const origin = `http://${DISPLAY}:${boundPort}`;
  const auth = createAuth({
    root: options.root,
    port: boundPort,
    token: options.token,
    viewer: options.viewer,
  });

  async function dispatch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (!auth.ownHost(req)) return json(421, { error: "misdirected request" });
    if (url.pathname === "/") {
      return new Response(null, {
        status: 303,
        headers: { location: `${PREFIX}/${url.search}`, "cache-control": "no-store" },
      });
    }
    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, url, {
        core,
        hub,
        auth,
        port: boundPort,
        startedAt,
        log,
        onStop: options.onStop,
      });
    }
    return handlePage(req, url, { core, hub, auth });
  }

  return {
    port: boundPort,
    origin,
    pageUrl: (slug, withToken = true) =>
      pageUrl(origin, slug, withToken ? auth.viewerToken() : undefined),
    galleryUrl: () => galleryUrl(origin, auth.viewerToken()),
    sessions: () => hub.sessions(),
    stop() {
      hub.closeAll();
      server.stop(true);
    },
  };
}
