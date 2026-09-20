// The HTTP surface: Bun.serve bound to the loopback interface inside the
// server process (server.ts at the extension root). Binds one port and
// only that port — a taken port is an error the caller reports, never a
// fallback — and dispatches by Host: a frame host (<slug>.localhost) reaches
// that page's files, what it uploaded and the runtime, and nothing else; the
// shell host reaches the viewer shell and gallery (for the browser) and the
// API (for sessions). Under `sandbox` isolation there are no frame hosts to
// rely on, so the shell host serves the frames too, by cap.

import type { Server } from "bun";

import type { Core } from "../../app/core";
import { type Logger, silentLogger } from "../../app/ports";
import { BIND, DISPLAY, galleryUrl, pageUrl, PREFIX } from "../../domain/protocol";
import type { Isolation } from "../../domain/types";
import { createAuth } from "./auth";
import { EventHub } from "./events";
import { json } from "./respond";
import { handleApi } from "./routes/api";
import { handleFrame, isFramePath } from "./routes/frame";
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
  isolation?: Isolation;
  startedAt?: string;
  log?: Logger;
  /** Called after the /api/stop response is sent. */
  onStop?: () => void;
}

export function startServer(core: Core, options: ServerOptions): ArtifactServer {
  const hub = new EventHub();
  const log = options.log ?? silentLogger;
  const startedAt = options.startedAt ?? new Date().toISOString();
  const isolation = options.isolation ?? "origin";

  // Tabs are told by the route that took the request; this listener only finds the session.
  core.onEvent((event, manifest) => {
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
    const host = auth.host(req);
    if (!host) return json(421, { error: "misdirected request" });
    const frames = { core, auth, port: boundPort, isolation };
    if (host.kind === "frame") return handleFrame(req, url, host.slug, frames);
    if (isolation === "sandbox" && isFramePath(url.pathname))
      return handleFrame(req, url, null, frames);
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
        origin,
        isolation,
        startedAt,
        log,
        onStop: options.onStop,
      });
    }
    return handlePage(req, url, { core, hub, auth, port: boundPort, isolation });
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
