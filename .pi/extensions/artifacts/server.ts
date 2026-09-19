// The HTTP surface, served by Bun.serve on the loopback interface inside the
// server process (serve.ts). Two audiences:
//
// Pages, for the browser (cookie or header token; a POST needs the header and
// the page's own Origin):
//   GET  /                        redirects to the gallery
//   GET  /a/[?t=token]            the gallery: every artifact, newest first
//   GET  /a/<slug>[?t=token]      the current page; the token sets a cookie once
//   GET  /a/<slug>/v/<n>          one version, read-only
//   GET  /a/<slug>/data           the current island
//   GET  /a/<slug>/comments       the comment threads
//   GET  /a/<slug>/events         SSE: {type:"version",version} · {type:"comment"}
//   POST /a/<slug>/publish        {base_version, data} — the page republishes itself
//   POST /a/<slug>/comments       {text, toAgent, anchor?, threadId?}
//
// The API, for sessions (header token only; browsers cannot send it cross-site):
//   GET  /api/health              {ok, pid, port, startedAt, root, subscribers}
//   GET  /api/artifacts           every manifest
//   GET  /api/artifacts/<slug>    {manifest, island, source}
//   GET  /api/artifacts/<slug>/comments
//   GET  /api/pending             every unacknowledged page event, oldest first
//   GET  /api/events?session=<id> SSE: one PageEvent per message, routed by owner
//   POST /api/publish             PublishRequest → PublishResponse
//   POST /api/artifacts/<slug>/watch    {watched, owner?}
//   POST /api/artifacts/<slug>/ack      {ids[], owner?}
//   POST /api/artifacts/<slug>/reply    {threadId, text}
//   POST /api/artifacts/<slug>/resolve  {threadId}
//   POST /api/artifacts/<slug>/delete   → {trash}
//   POST /api/stop                the process exits once the response is sent
//
// A page event goes to its artifact's owner when that session is connected,
// else to the longest-connected session, and stays pending until acknowledged.
// The configured port is tried first and any free port second.

import type { Server } from "bun";
import { createHash } from "node:crypto";

import type { Core } from "./core";
import { COOKIE, HEADER, PREFIX } from "./server-const";
import { CSP_HEADER } from "./shell";
import type { Island, Manifest, PageEvent, PublishRequest } from "./types";
import { MAX_API_BYTES, MAX_POST_BYTES } from "./types";

export { COOKIE, HEADER, PREFIX };
/** Bound address; printed URLs say `localhost`, which every browser maps to loopback. */
const BIND = "127.0.0.1";
const DISPLAY = "localhost";
const PORT_BASE = 41000;
const PORT_SPAN = 1000;
const COOKIE_MAX_AGE = 365 * 24 * 3600;

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

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });

const html = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...headers,
    },
  });

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const PAGE_ROUTE =
  /^\/a\/([a-z0-9][a-z0-9-]{0,63})(?:\/(v\/(\d+)|data|comments|events|publish))?\/?$/;
const API_ROUTE =
  /^\/api\/(health|pending|events|publish|stop|artifacts(?:\/([a-z0-9][a-z0-9-]{0,63})(?:\/(comments|watch|ack|reply|resolve|delete))?)?)\/?$/;

function cookieValue(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

const PAGE_STYLE =
  "font:16px system-ui,-apple-system,sans-serif;max-width:640px;margin:80px auto;padding:0 24px;color:#1b1f24;line-height:1.5";

const UNAUTHORIZED_PAGE = `<!doctype html><meta charset="utf-8"><title>Artifact — link needed</title>
<body style="${PAGE_STYLE}">
<h1 style="font-size:1.4rem">This artifact needs its link</h1>
<p>Open it from the URL pi printed (it carries a one-time token), or run <code>/artifacts</code> in pi and pick it there.</p>
</body>`;

function galleryPage(rows: Manifest[]): string {
  const items = rows.length
    ? rows
        .map(
          (m) =>
            `<li style="padding:10px 0;border-top:1px solid #e3e6ea"><a href="${PREFIX}/${m.slug}" style="font-weight:600;color:#3b5bdb">${escapeHtml(m.icon ? `${m.icon} ` : "")}${escapeHtml(m.title)}</a>` +
            `<div style="color:#5b6470;font-size:.9rem">${PREFIX}/${m.slug} · v${m.current} · ${escapeHtml(m.updatedAt.slice(0, 16).replace("T", " "))}${m.description ? ` · ${escapeHtml(m.description)}` : ""}</div></li>`,
        )
        .join("")
    : `<li style="color:#5b6470">No artifacts yet.</li>`;
  return `<!doctype html><meta charset="utf-8"><title>Artifacts</title><meta name="viewport" content="width=device-width, initial-scale=1">
<body style="${PAGE_STYLE}"><h1 style="font-size:1.4rem">Artifacts</h1><ul style="list-style:none;padding:0;margin:0">${items}</ul></body>`;
}

type Controller = ReadableStreamDefaultController<Uint8Array>;

interface SessionStream {
  session: string;
  controller: Controller;
  since: number;
}

export function startServer(core: Core, options: ServerOptions): ArtifactServer {
  const pageClients = new Map<string, Set<Controller>>();
  const sessionStreams: SessionStream[] = [];
  const encoder = new TextEncoder();
  const startedAt = options.startedAt ?? new Date().toISOString();
  let server: Server<undefined> | null = null;

  const ownHosts = (port: number) => [`${BIND}:${port}`, `${DISPLAY}:${port}`, `[::1]:${port}`];
  const isOwnHost = (req: Request, port: number) =>
    ownHosts(port).includes((req.headers.get("host") ?? "").toLowerCase());
  const isOwnOrigin = (req: Request, port: number) => {
    const origin = req.headers.get("origin");
    if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
    return ownHosts(port)
      .map((h) => `http://${h}`)
      .includes(origin.toLowerCase());
  };
  const headerToken = (req: Request) => req.headers.get(HEADER) === options.token;
  const hasToken = (req: Request, url: URL) =>
    url.searchParams.get("t") === options.token ||
    cookieValue(req, COOKIE) === options.token ||
    headerToken(req);

  const setCookieRedirect = (url: URL) => {
    url.searchParams.delete("t");
    return new Response(null, {
      status: 303,
      headers: {
        location: url.pathname + (url.search || ""),
        // A year: the token is per project and long-lived, so the clean URL
        // keeps working across browser restarts without a new tokened link.
        "set-cookie": `${COOKIE}=${options.token}; Path=/; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
        "cache-control": "no-store",
      },
    });
  };

  async function readJsonBody(
    req: Request,
    limit: number,
  ): Promise<Record<string, unknown> | Response> {
    const length = Number(req.headers.get("content-length") ?? "0");
    if (length > limit) return json(413, { error: "body too large" });
    const text = await req.text();
    if (Buffer.byteLength(text, "utf8") > limit) return json(413, { error: "body too large" });
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return json(400, { error: "body is not JSON" });
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return json(400, { error: "body must be an object" });
    }
    return parsed as Record<string, unknown>;
  }

  const sseResponse = (
    start: (controller: Controller) => void,
    cancel: (controller: Controller) => void,
  ) => {
    let ref: Controller | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        ref = controller;
        controller.enqueue(encoder.encode(`: connected\n\n`));
        start(controller);
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            if (heartbeat) clearInterval(heartbeat);
          }
        }, 25_000);
      },
      cancel() {
        if (heartbeat) clearInterval(heartbeat);
        if (ref) cancel(ref);
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      },
    });
  };

  const push = (controller: Controller, payload: unknown): boolean => {
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      return true;
    } catch {
      return false;
    }
  };

  function broadcastPage(slug: string, payload: Record<string, unknown>): void {
    const set = pageClients.get(slug);
    if (!set) return;
    for (const controller of set) if (!push(controller, payload)) set.delete(controller);
  }

  function routeToSession(event: PageEvent, manifest: Manifest): void {
    const live = sessionStreams.filter((s) => {
      try {
        return s.controller.desiredSize !== null;
      } catch {
        return false;
      }
    });
    const target = live.find((s) => s.session === manifest.owner) ?? live[0];
    if (target && !push(target.controller, event)) {
      const k = sessionStreams.indexOf(target);
      if (k >= 0) sessionStreams.splice(k, 1);
    }
  }

  core.onEvent((event, manifest) => {
    if (event.kind === "republish")
      broadcastPage(event.slug, { type: "version", version: event.version, by: "page" });
    else broadcastPage(event.slug, { type: "comment", threadId: event.thread?.id });
    routeToSession(event, manifest);
  });

  // ---- pages -----------------------------------------------------------------

  async function handlePage(req: Request, url: URL, port: number): Promise<Response> {
    if (url.pathname === PREFIX || url.pathname === `${PREFIX}/`) {
      if (req.method !== "GET") return json(405, { error: "method not allowed" });
      if (!hasToken(req, url)) return html(401, UNAUTHORIZED_PAGE);
      if (url.searchParams.has("t")) return setCookieRedirect(url);
      return html(200, galleryPage(core.list()));
    }
    const m = PAGE_ROUTE.exec(url.pathname);
    if (!m) return json(404, { error: "not found" });
    const slug = m[1] as string;
    const sub = m[2] ?? "";
    const isPage = sub === "" || sub.startsWith("v/");
    if (!hasToken(req, url))
      return isPage ? html(401, UNAUTHORIZED_PAGE) : json(401, { error: "unauthorized" });
    if (!core.get(slug)) {
      return isPage && req.method === "GET"
        ? html(
            404,
            `<!doctype html><meta charset="utf-8"><body style="${PAGE_STYLE}"><h1 style="font-size:1.4rem">No such artifact</h1><p><a href="${PREFIX}/">All artifacts</a></p></body>`,
          )
        : json(404, { error: "no such artifact" });
    }
    if (req.method === "GET") {
      if (isPage) {
        if (url.searchParams.has("t")) return setCookieRedirect(url);
        const page = core.page(slug, m[3] ? Number(m[3]) : undefined);
        return page === null
          ? json(404, { error: "no such version" })
          : html(200, page, { "content-security-policy": CSP_HEADER });
      }
      if (sub === "data") return json(200, { island: core.island(slug) });
      if (sub === "comments") return json(200, { threads: core.comments(slug) });
      if (sub === "events") {
        return sseResponse(
          (controller) => {
            const set = pageClients.get(slug) ?? new Set();
            set.add(controller);
            pageClients.set(slug, set);
          },
          (controller) => pageClients.get(slug)?.delete(controller),
        );
      }
      return json(405, { error: "method not allowed" });
    }
    if (req.method === "POST") {
      if (!headerToken(req)) return json(403, { error: "missing token header" });
      if (!isOwnOrigin(req, port)) return json(403, { error: "cross-origin request refused" });
      const body = await readJsonBody(req, MAX_POST_BYTES);
      if (body instanceof Response) return body;
      if (sub === "publish") {
        if (typeof body.base_version !== "number" || !Number.isInteger(body.base_version)) {
          return json(400, { error: "base_version must be an integer" });
        }
        if (typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
          return json(400, { error: "data must be an object" });
        }
        const out = core.republishFromPage(slug, {
          base_version: body.base_version,
          data: body.data as Island,
        });
        return json(out.status, out.body);
      }
      if (sub === "comments") {
        if (typeof body.text !== "string" || !body.text.trim())
          return json(400, { error: "text is required" });
        if (body.text.length > 4096) return json(400, { error: "text is over 4096 characters" });
        const out = core.addComment(slug, {
          text: body.text.trim(),
          toAgent: body.toAgent !== false,
          anchor:
            typeof body.anchor === "string" && body.anchor.trim()
              ? body.anchor.trim().slice(0, 200)
              : undefined,
          threadId: typeof body.threadId === "string" ? body.threadId : undefined,
        });
        if (out.status === 200 && !(body.toAgent !== false)) {
          broadcastPage(slug, {
            type: "comment",
            threadId: (out.body.thread as { id: string }).id,
          });
        }
        return json(out.status, out.body);
      }
      return json(404, { error: "not found" });
    }
    return json(405, { error: "method not allowed" });
  }

  // ---- api -------------------------------------------------------------------

  async function handleApi(req: Request, url: URL, port: number): Promise<Response> {
    const m = API_ROUTE.exec(url.pathname);
    if (!m) return json(404, { error: "not found" });
    if (!headerToken(req)) return json(401, { error: "unauthorized" });
    const head = (m[1] as string).split("/")[0] as string;
    const slug = m[2];
    const sub = m[3] ?? "";

    if (req.method === "GET") {
      if (head === "health") {
        return json(200, {
          ok: true,
          pid: process.pid,
          port,
          startedAt,
          root: core.store.root,
          subscribers: sessionStreams.length,
        });
      }
      if (head === "pending") return json(200, { events: core.pending() });
      if (head === "events") {
        const session = url.searchParams.get("session") ?? `anon-${Date.now()}`;
        return sseResponse(
          (controller) => sessionStreams.push({ session, controller, since: Date.now() }),
          (controller) => {
            const k = sessionStreams.findIndex((s) => s.controller === controller);
            if (k >= 0) sessionStreams.splice(k, 1);
          },
        );
      }
      if (head === "artifacts" && !slug) return json(200, { artifacts: core.list() });
      if (head === "artifacts" && slug) {
        const manifest = core.get(slug);
        if (!manifest) return json(404, { error: "no such artifact" });
        if (sub === "")
          return json(200, { manifest, island: core.island(slug), source: core.source(slug) });
        if (sub === "comments") return json(200, { threads: core.comments(slug) });
      }
      return json(405, { error: "method not allowed" });
    }
    if (req.method !== "POST") return json(405, { error: "method not allowed" });

    if (head === "stop") {
      setTimeout(() => options.onStop?.(), 20);
      return json(200, { ok: true, stopping: true });
    }
    const body = await readJsonBody(req, head === "publish" ? MAX_API_BYTES : MAX_POST_BYTES);
    if (body instanceof Response) return body;
    try {
      if (head === "publish") {
        if (body.kind !== "html" && body.kind !== "md")
          return json(400, { error: "kind must be html or md" });
        if (typeof body.source !== "string") return json(400, { error: "source must be a string" });
        const request: PublishRequest = {
          kind: body.kind,
          source: body.source,
          island:
            body.island === null
              ? null
              : typeof body.island === "object" && !Array.isArray(body.island)
                ? (body.island as Island)
                : undefined,
          title: str(body.title),
          description: str(body.description),
          icon: str(body.icon),
          update: str(body.update),
          slug: str(body.slug),
          note: str(body.note),
          owner: str(body.owner),
        };
        const result = core.publish(request);
        if (!result.created)
          broadcastPage(result.manifest.slug, {
            type: "version",
            version: result.version,
            by: "agent",
          });
        return json(200, result);
      }
      if (head === "artifacts" && slug) {
        if (!core.get(slug)) return json(404, { error: "no such artifact" });
        if (sub === "watch") {
          return json(200, {
            manifest: core.setWatched(slug, body.watched !== false, str(body.owner)),
          });
        }
        if (sub === "ack") {
          const ids = Array.isArray(body.ids)
            ? body.ids.filter((x): x is string => typeof x === "string")
            : [];
          return json(200, { acked: core.ack(slug, ids, str(body.owner)) });
        }
        if (sub === "reply") {
          if (typeof body.threadId !== "string" || typeof body.text !== "string") {
            return json(400, { error: "threadId and text are required" });
          }
          const thread = core.reply(slug, body.threadId, body.text);
          broadcastPage(slug, { type: "comment", threadId: thread.id });
          return json(200, { thread });
        }
        if (sub === "resolve") {
          if (typeof body.threadId !== "string")
            return json(400, { error: "threadId is required" });
          const thread = core.resolveThread(slug, body.threadId);
          broadcastPage(slug, { type: "comment", threadId: thread.id });
          return json(200, { thread });
        }
        if (sub === "delete") {
          for (const controller of pageClients.get(slug) ?? []) {
            try {
              controller.close();
            } catch {
              // gone
            }
          }
          pageClients.delete(slug);
          return json(200, { trash: core.remove(slug) });
        }
      }
      return json(404, { error: "not found" });
    } catch (e) {
      return json(400, { error: (e as Error).message });
    }
  }

  async function handle(req: Request, port: number): Promise<Response> {
    const url = new URL(req.url);
    if (!isOwnHost(req, port)) return json(421, { error: "misdirected request" });
    if (url.pathname === "/") {
      return new Response(null, {
        status: 303,
        headers: { location: `${PREFIX}/${url.search}`, "cache-control": "no-store" },
      });
    }
    if (url.pathname.startsWith("/api/")) return handleApi(req, url, port);
    return handlePage(req, url, port);
  }

  const requestedPort =
    options.port > 0 ? options.port : options.port === 0 ? derivedPort(options.seed) : 0;
  const attempts = requestedPort > 0 ? [requestedPort, 0] : [0];
  let lastError: unknown = null;
  for (const port of attempts) {
    try {
      // idleTimeout 0: the event streams stay open for as long as their readers do.
      server = Bun.serve({
        hostname: BIND,
        port,
        idleTimeout: 0,
        fetch: (req, s) => handle(req, s.port ?? 0),
      });
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!server) throw new Error(`could not bind the artifact server: ${String(lastError)}`);
  const bound = server;
  const port = bound.port ?? 0;
  const origin = `http://${DISPLAY}:${port}`;

  return {
    port,
    requestedPort,
    origin,
    pageUrl: (slug, withToken = true) =>
      `${origin}${PREFIX}/${slug}${withToken ? `?t=${encodeURIComponent(options.token)}` : ""}`,
    galleryUrl: () => `${origin}${PREFIX}/?t=${encodeURIComponent(options.token)}`,
    sessions: () =>
      sessionStreams
        .slice()
        .sort((a, b) => a.since - b.since)
        .map((s) => s.session),
    stop() {
      const all = [
        ...sessionStreams.map((s) => s.controller),
        ...[...pageClients.values()].flatMap((s) => [...s]),
      ];
      for (const controller of all) {
        try {
          controller.close();
        } catch {
          // already gone
        }
      }
      sessionStreams.length = 0;
      pageClients.clear();
      bound.stop(true);
    },
  };
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
