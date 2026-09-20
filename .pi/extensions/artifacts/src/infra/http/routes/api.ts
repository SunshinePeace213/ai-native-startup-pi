// What a session reaches, all under /api. Health answers anyone on loopback
// (it says whose server this is, never a secret); everything else needs the
// session token header, which a browser cannot send cross-site.
//
//   GET  /api/health              Health: pid, port, root, startedAt, tokenId
//   GET  /api/status              ServerStatus: origin, pid, root, startedAt, isolation, retention,
//                                 the connected sessions, the store's counts — never a secret
//   GET  /api/artifacts           every manifest
//   GET  /api/artifacts/<slug>    {manifest, island, source}
//   GET  /api/artifacts/<slug>/comments
//   GET  /api/artifacts/<slug>/diagnostics
//   GET  /api/artifacts/<slug>/files[?path=<published path>]
//                                 the current version's supporting files; with a path, that
//                                 file's record and — when it is a small text file — its text
//   GET  /api/pending            every unacknowledged page event, oldest first
//   GET  /api/events?session=<id> SSE, routed by owner
//   POST /api/publish             PublishRequest → PublishResponse (409 when stale; 403
//                                 {code: "read_only_path"} for a type's page or paths)
//   POST /api/artifacts/<slug>/watch    {watched}
//   POST /api/artifacts/<slug>/ack      {ids[]}
//   POST /api/artifacts/<slug>/pin      {pinned}
//   POST /api/artifacts/<slug>/rename   {title}
//   POST /api/artifacts/<slug>/reply    {threadId, text}
//   POST /api/artifacts/<slug>/resolve  {threadId}
//   POST /api/artifacts/<slug>/db       {op, …} — the page's database, for `artifact_data`
//                                       (routes/db.ts); open views hear what it wrote
//   POST /api/artifacts/<slug>/delete   → {trash}
//   POST /api/sweep               retention now → {artifacts[], logs[]}
//   POST /api/detach              this session's streams are dropped now
//   POST /api/stop                the process exits once the response is sent

import { INLINE_TEXT_BYTES, isTextType } from "../../../domain/files";
import { SESSION_ID_HEADER, SLUG_PATTERN } from "../../../domain/protocol";
import {
  type Capabilities,
  type Health,
  type Island,
  type Isolation,
  MAX_API_BYTES,
  MAX_POST_BYTES,
  type ServerStatus,
  type TypeRef,
} from "../../../domain/types";
import { type Core, PublishError, type PublishInput } from "../../../app/core";
import type { FileContent, Logger } from "../../../app/ports";
import type { Auth } from "../auth";
import type { EventHub } from "../events";
import { tokenId } from "../../store/control";
import { fromBase64, json, readJsonBody, str } from "../respond";
import { handleDb } from "./db";

const ROUTE = new RegExp(
  `^/api/(health|status|pending|events|publish|sweep|detach|stop|artifacts(?:/(${SLUG_PATTERN})(?:/(comments|diagnostics|files|watch|ack|pin|rename|reply|resolve|db|delete))?)?)/?$`,
);

export interface ApiRoutes {
  core: Core;
  hub: EventHub;
  auth: Auth;
  port: number;
  origin: string;
  isolation: Isolation;
  startedAt: string;
  log: Logger;
  onStop?: () => void;
}

export async function handleApi(req: Request, url: URL, r: ApiRoutes): Promise<Response> {
  const m = ROUTE.exec(url.pathname);
  if (!m) return json(404, { error: "not found" });
  const head = (m[1] as string).split("/")[0] as string;
  const slug = m[2];
  const sub = m[3] ?? "";

  if (head === "health" && req.method === "GET") {
    const body: Health = {
      ok: true,
      pid: process.pid,
      port: r.port,
      root: r.core.store.root,
      startedAt: r.startedAt,
      tokenId: tokenId(r.auth.token()),
      subscribers: r.hub.subscriberCount(),
    };
    return json(200, body);
  }
  if (!r.auth.session(req)) return json(401, { error: "unauthorized" });
  const session = req.headers.get(SESSION_ID_HEADER) ?? "";

  if (req.method === "GET") {
    if (head === "status") {
      const body: ServerStatus = {
        origin: r.origin,
        pid: process.pid,
        port: r.port,
        root: r.core.store.root,
        startedAt: r.startedAt,
        isolation: r.isolation,
        sessions: r.hub.sessions(),
        ...r.core.status(),
      };
      return json(200, body);
    }
    if (head === "pending") return json(200, { events: r.core.pending() });
    if (head === "events")
      return r.hub.sessionStream(
        url.searchParams.get("session") ?? session ?? `anon-${Date.now()}`,
      );
    if (head === "artifacts" && !slug) return json(200, { artifacts: r.core.list() });
    if (head === "artifacts" && slug) {
      const manifest = r.core.get(slug);
      if (!manifest) return json(404, { error: "no such artifact" });
      if (sub === "")
        return json(200, { manifest, island: r.core.island(slug), source: r.core.source(slug) });
      if (sub === "comments") return json(200, { threads: r.core.comments(slug) });
      if (sub === "diagnostics") return json(200, { rows: r.core.diagnostics(slug) });
      if (sub === "files") return files(slug, manifest.current, url.searchParams.get("path"), r);
    }
    return json(405, { error: "method not allowed" });
  }
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  if (head === "stop") {
    r.log.info({ action: "stop", session }, "stop requested");
    setTimeout(() => r.onStop?.(), 20);
    return json(200, { ok: true, stopping: true });
  }
  if (head === "sweep") return json(200, r.core.sweep());
  if (head === "detach") return json(200, { detached: r.hub.detach(session) });
  // A publish carries a page and its files, a database batch up to fifty documents.
  const large = head === "publish" || sub === "db";
  const body = await readJsonBody(req, large ? MAX_API_BYTES : MAX_POST_BYTES);
  if (body instanceof Response) return body;
  try {
    if (head === "publish") return publish(body, session, r);
    if (head === "artifacts" && slug) {
      if (!r.core.get(slug)) return json(404, { error: "no such artifact" });
      if (sub === "db") return handleDb(slug, body, r);
      if (sub === "watch") {
        const manifest = r.core.setWatched(slug, body.watched !== false, session || undefined);
        r.hub.broadcastPage(slug, { type: "state" });
        return json(200, { manifest });
      }
      if (sub === "ack") {
        const ids = Array.isArray(body.ids)
          ? body.ids.filter((x): x is string => typeof x === "string")
          : [];
        return json(200, { acked: r.core.ack(slug, ids) });
      }
      if (sub === "pin") {
        const manifest = r.core.setPinned(slug, body.pinned !== false);
        r.hub.broadcastPage(slug, { type: "state" });
        return json(200, { manifest });
      }
      if (sub === "rename") {
        if (typeof body.title !== "string") return json(400, { error: "title is required" });
        const manifest = r.core.rename(slug, body.title);
        r.hub.broadcastPage(slug, { type: "state" });
        return json(200, { manifest });
      }
      if (sub === "reply") {
        if (typeof body.threadId !== "string" || typeof body.text !== "string") {
          return json(400, { error: "threadId and text are required" });
        }
        const thread = r.core.reply(
          slug,
          body.threadId,
          body.text,
          body.acknowledgeDuplicate === true,
        );
        r.hub.broadcastPage(slug, { type: "comment", threadId: thread.id });
        return json(200, { thread });
      }
      if (sub === "resolve") {
        if (typeof body.threadId !== "string") return json(400, { error: "threadId is required" });
        const thread = r.core.resolveThread(slug, body.threadId);
        r.hub.broadcastPage(slug, { type: "comment", threadId: thread.id });
        return json(200, { thread });
      }
      if (sub === "delete") {
        r.hub.closePage(slug);
        const trash = r.core.remove(slug);
        r.hub.tellSessions({ kind: "removed", slug });
        return json(200, { trash });
      }
    }
    return json(404, { error: "not found" });
  } catch (e) {
    if (e instanceof PublishError) return json(e.status, { error: e.message, ...e.extra });
    return json(400, { error: (e as Error).message });
  }
}

/** The type a new artifact is made from, as the wire states it; a string says why it is none. */
function typeRef(raw: unknown): TypeRef | string | undefined {
  if (raw === undefined) return undefined;
  const type = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const paths = Array.isArray(type.paths) ? type.paths : null;
  return typeof type.name === "string" && paths?.every((path) => typeof path === "string")
    ? { name: type.name, paths: paths as string[] }
    : "type must be {name, paths}: the type's name and the published paths that are its own";
}

function publish(body: Record<string, unknown>, session: string, r: ApiRoutes): Response {
  // No page at all is a republish that carries the one the artifact has; the core decides who may.
  const carried = body.kind === undefined && body.source === undefined;
  if (!carried && body.kind !== "html" && body.kind !== "md")
    return json(400, { error: "kind must be html or md" });
  if (!carried && typeof body.source !== "string")
    return json(400, { error: "source must be a string" });
  if (!session) return json(400, { error: `${SESSION_ID_HEADER} is required` });
  const uploaded = uploads(body.files);
  if (typeof uploaded === "string") return json(400, { error: uploaded });
  const type = typeRef(body.type);
  if (typeof type === "string") return json(400, { error: type });
  const request: PublishInput = {
    files: uploaded,
    kind: body.kind as PublishInput["kind"],
    source: body.source as string | undefined,
    type,
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
    baseVersion: typeof body.baseVersion === "number" ? body.baseVersion : undefined,
    slug: str(body.slug),
    sourcePath: str(body.sourcePath),
    label: str(body.label),
    // Whatever was sent: the core refuses a declaration that is not one.
    capabilities: body.capabilities as Capabilities | undefined,
    session,
  };
  const result = r.core.publish(request);
  if (!result.created) {
    r.hub.broadcastPage(result.manifest.slug, { type: "version", version: result.version });
  }
  return json(200, result);
}

/** A publish's supporting files, decoded from the wire; a string says why they are malformed. */
function uploads(raw: unknown): Record<string, FileContent | null> | string | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    return "files must be an object of published path → {base64, contentType?} or null";
  const out: Record<string, FileContent | null> = {};
  for (const [path, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null) {
      out[path] = null;
      continue;
    }
    const file = (typeof value === "object" ? value : {}) as Record<string, unknown>;
    const bytes = fromBase64(file.base64);
    if (!bytes) return `files[${JSON.stringify(path)}].base64 must be the file's bytes in base64`;
    out[path] = { bytes, contentType: str(file.contentType) };
  }
  return out;
}

/** The listing of a version's supporting files, or one of them by its published path. */
function files(slug: string, version: number, path: string | null, r: ApiRoutes): Response {
  if (path === null) return json(200, r.core.files(slug, version));
  const found = r.core.file(slug, version, path);
  if (!found) return json(404, { error: `"${slug}" v${version} has no file ${path}` });
  const inline = isTextType(found.record.contentType) && found.record.bytes <= INLINE_TEXT_BYTES;
  return json(200, {
    version,
    path,
    ...found.record,
    text: inline ? new TextDecoder().decode(found.bytes) : null,
  });
}
