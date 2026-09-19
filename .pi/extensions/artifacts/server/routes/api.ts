// What a session reaches, all under /api, header token only (a browser cannot
// send that header cross-site, so no cookie or query form is accepted):
//
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

import {
  type Island,
  MAX_API_BYTES,
  MAX_POST_BYTES,
  type PublishRequest,
} from "../../shared/types";
import type { Auth } from "../auth";
import type { Core } from "../core";
import type { EventHub } from "../events";
import { json, readJsonBody, str } from "../respond";

const ROUTE =
  /^\/api\/(health|pending|events|publish|stop|artifacts(?:\/([a-z0-9][a-z0-9-]{0,63})(?:\/(comments|watch|ack|reply|resolve|delete))?)?)\/?$/;

export interface ApiRoutes {
  core: Core;
  hub: EventHub;
  auth: Auth;
  port: number;
  startedAt: string;
  onStop?: () => void;
}

export async function handleApi(req: Request, url: URL, r: ApiRoutes): Promise<Response> {
  const m = ROUTE.exec(url.pathname);
  if (!m) return json(404, { error: "not found" });
  if (!r.auth.header(req)) return json(401, { error: "unauthorized" });
  const head = (m[1] as string).split("/")[0] as string;
  const slug = m[2];
  const sub = m[3] ?? "";

  if (req.method === "GET") {
    if (head === "health") {
      return json(200, {
        ok: true,
        pid: process.pid,
        port: r.port,
        startedAt: r.startedAt,
        root: r.core.store.root,
        subscribers: r.hub.subscriberCount(),
      });
    }
    if (head === "pending") return json(200, { events: r.core.pending() });
    if (head === "events")
      return r.hub.sessionStream(url.searchParams.get("session") ?? `anon-${Date.now()}`);
    if (head === "artifacts" && !slug) return json(200, { artifacts: r.core.list() });
    if (head === "artifacts" && slug) {
      const manifest = r.core.get(slug);
      if (!manifest) return json(404, { error: "no such artifact" });
      if (sub === "")
        return json(200, { manifest, island: r.core.island(slug), source: r.core.source(slug) });
      if (sub === "comments") return json(200, { threads: r.core.comments(slug) });
    }
    return json(405, { error: "method not allowed" });
  }
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  if (head === "stop") {
    setTimeout(() => r.onStop?.(), 20);
    return json(200, { ok: true, stopping: true });
  }
  const body = await readJsonBody(req, head === "publish" ? MAX_API_BYTES : MAX_POST_BYTES);
  if (body instanceof Response) return body;
  try {
    if (head === "publish") return publish(body, r);
    if (head === "artifacts" && slug) {
      if (!r.core.get(slug)) return json(404, { error: "no such artifact" });
      if (sub === "watch") {
        return json(200, {
          manifest: r.core.setWatched(slug, body.watched !== false, str(body.owner)),
        });
      }
      if (sub === "ack") {
        const ids = Array.isArray(body.ids)
          ? body.ids.filter((x): x is string => typeof x === "string")
          : [];
        return json(200, { acked: r.core.ack(slug, ids, str(body.owner)) });
      }
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
    return json(400, { error: (e as Error).message });
  }
}

function publish(body: Record<string, unknown>, r: ApiRoutes): Response {
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
  const result = r.core.publish(request);
  if (!result.created) {
    r.hub.broadcastPage(result.manifest.slug, {
      type: "version",
      version: result.version,
      by: "agent",
    });
  }
  return json(200, result);
}
