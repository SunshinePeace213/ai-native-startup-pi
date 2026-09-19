// What a session reaches, all under /api. Health answers anyone on loopback
// (it says whose server this is, never a secret); everything else needs the
// session token header, which a browser cannot send cross-site.
//
//   GET  /api/health              Health: pid, port, root, startedAt, tokenId
//   GET  /api/artifacts           every manifest
//   GET  /api/artifacts/<slug>    {manifest, island, source}
//   GET  /api/artifacts/<slug>/comments
//   GET  /api/artifacts/<slug>/diagnostics
//   GET  /api/pending             every unacknowledged page event, oldest first
//   GET  /api/events?session=<id> SSE, routed by owner
//   POST /api/publish             PublishRequest → PublishResponse (409 when stale)
//   POST /api/artifacts/<slug>/watch    {watched}
//   POST /api/artifacts/<slug>/ack      {ids[]}
//   POST /api/artifacts/<slug>/pin      {pinned}
//   POST /api/artifacts/<slug>/reply    {threadId, text}
//   POST /api/artifacts/<slug>/resolve  {threadId}
//   POST /api/artifacts/<slug>/delete   → {trash}
//   POST /api/sweep               retention now → {artifacts[], logs[]}
//   POST /api/detach              this session's streams are dropped now
//   POST /api/stop                the process exits once the response is sent

import { SESSION_ID_HEADER } from "../../../domain/protocol";
import {
  type Health,
  type Island,
  MAX_API_BYTES,
  MAX_POST_BYTES,
  type PublishRequest,
} from "../../../domain/types";
import { type Core, PublishError } from "../../../app/core";
import type { Logger } from "../../../app/ports";
import type { Auth } from "../auth";
import type { EventHub } from "../events";
import { tokenId } from "../../store/control";
import { json, readJsonBody, str } from "../respond";

const ROUTE =
  /^\/api\/(health|pending|events|publish|sweep|detach|stop|artifacts(?:\/([a-z0-9][a-z0-9-]{0,63})(?:\/(comments|diagnostics|watch|ack|pin|reply|resolve|delete))?)?)\/?$/;

export interface ApiRoutes {
  core: Core;
  hub: EventHub;
  auth: Auth;
  port: number;
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
  const body = await readJsonBody(req, head === "publish" ? MAX_API_BYTES : MAX_POST_BYTES);
  if (body instanceof Response) return body;
  try {
    if (head === "publish") return publish(body, session, r);
    if (head === "artifacts" && slug) {
      if (!r.core.get(slug)) return json(404, { error: "no such artifact" });
      if (sub === "watch") {
        return json(200, {
          manifest: r.core.setWatched(slug, body.watched !== false, session || undefined),
        });
      }
      if (sub === "ack") {
        const ids = Array.isArray(body.ids)
          ? body.ids.filter((x): x is string => typeof x === "string")
          : [];
        return json(200, { acked: r.core.ack(slug, ids) });
      }
      if (sub === "pin")
        return json(200, { manifest: r.core.setPinned(slug, body.pinned !== false) });
      if (sub === "reply") {
        if (typeof body.threadId !== "string" || typeof body.text !== "string") {
          return json(400, { error: "threadId and text are required" });
        }
        const thread = r.core.reply(slug, body.threadId, body.text);
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
        return json(200, { trash: r.core.remove(slug) });
      }
    }
    return json(404, { error: "not found" });
  } catch (e) {
    if (e instanceof PublishError) return json(e.status, { error: e.message, ...e.extra });
    return json(400, { error: (e as Error).message });
  }
}

function publish(body: Record<string, unknown>, session: string, r: ApiRoutes): Response {
  if (body.kind !== "html" && body.kind !== "md")
    return json(400, { error: "kind must be html or md" });
  if (typeof body.source !== "string") return json(400, { error: "source must be a string" });
  if (!session) return json(400, { error: `${SESSION_ID_HEADER} is required` });
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
    baseVersion: typeof body.baseVersion === "number" ? body.baseVersion : undefined,
    slug: str(body.slug),
    sourcePath: str(body.sourcePath),
    note: str(body.note),
    session,
  };
  const result = r.core.publish(request);
  if (!result.created) {
    r.hub.broadcastPage(result.manifest.slug, { type: "version", version: result.version });
  }
  return json(200, result);
}
