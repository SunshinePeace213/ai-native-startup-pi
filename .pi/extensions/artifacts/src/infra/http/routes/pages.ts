// What the browser reaches, all under /a:
//
//   GET  /a/[?t=viewer]           the gallery: every artifact, pinned first
//   GET  /a/<slug>[?t=viewer]     the current page; the token sets the cookie once
//   GET  /a/<slug>/v/<n>          one agent version, as published, read-only
//   GET  /a/<slug>/data           the current island
//   GET  /a/<slug>/comments       the comment threads
//   GET  /a/<slug>/events         SSE: {type:"hello",version} first, then
//                                 {type:"version"|"response"|"comment", …}
//   POST /a/<slug>/publish        {base_version, data, gesture?} — the page responds
//   POST /a/<slug>/comments       {text, toAgent, anchor?, threadId?}
//   POST /a/<slug>/diagnostics    {version, rows:[{level, message}]}
//
// A GET presents the viewer token in the query or the cookie. A POST is the
// page acting on itself: cookie, own Origin, and the x-artifact-page header.

import { PREFIX } from "../../../domain/protocol";
import { type Island, MAX_POST_BYTES } from "../../../domain/types";
import type { Core } from "../../../app/core";
import type { Auth } from "../auth";
import type { EventHub } from "../events";
import { CSP_HEADER } from "../../render/shell";
import { html, json, readJsonBody } from "../respond";
import { galleryPage, notFoundPage, unauthorizedPage } from "./gallery";

const ROUTE =
  /^\/a\/([a-z0-9][a-z0-9-]{0,63})(?:\/(v\/(\d+)|data|comments|events|publish|diagnostics))?\/?$/;

export interface PageRoutes {
  core: Core;
  hub: EventHub;
  auth: Auth;
}

export async function handlePage(req: Request, url: URL, r: PageRoutes): Promise<Response> {
  if (url.pathname === PREFIX || url.pathname === `${PREFIX}/`) {
    if (req.method !== "GET") return json(405, { error: "method not allowed" });
    if (!r.auth.viewer(req, url)) return html(401, unauthorizedPage());
    if (url.searchParams.has("t")) return r.auth.cookieRedirect(url);
    return html(200, galleryPage(r.core.list()));
  }
  const m = ROUTE.exec(url.pathname);
  if (!m) return json(404, { error: "not found" });
  const slug = m[1] as string;
  const sub = m[2] ?? "";
  const isPage = sub === "" || sub.startsWith("v/");

  if (req.method === "GET") {
    if (!r.auth.viewer(req, url))
      return isPage ? html(401, unauthorizedPage()) : json(401, { error: "unauthorized" });
    if (!r.core.get(slug))
      return isPage ? html(404, notFoundPage()) : json(404, { error: "no such artifact" });
    if (isPage) {
      if (url.searchParams.has("t")) return r.auth.cookieRedirect(url);
      const page = r.core.page(slug, m[3] ? Number(m[3]) : undefined);
      if (page === null) return json(404, { error: "no such version" });
      r.core.viewed(slug);
      return html(200, page, { "content-security-policy": CSP_HEADER });
    }
    if (sub === "data") return json(200, { island: r.core.island(slug) });
    if (sub === "comments") return json(200, { threads: r.core.comments(slug) });
    if (sub === "events") return r.hub.pageStream(slug, r.core.get(slug)?.current ?? 0);
    return json(405, { error: "method not allowed" });
  }
  if (req.method !== "POST") return json(405, { error: "method not allowed" });
  if (!r.auth.page(req, slug)) return json(403, { error: "not this page's own request" });
  if (!r.core.get(slug)) return json(404, { error: "no such artifact" });
  const body = await readJsonBody(req, MAX_POST_BYTES);
  if (body instanceof Response) return body;

  if (sub === "publish") {
    if (typeof body.base_version !== "number" || !Number.isInteger(body.base_version)) {
      return json(400, { error: "base_version must be an integer" });
    }
    if (typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
      return json(400, { error: "data must be an object" });
    }
    const out = r.core.respondFromPage(slug, {
      base_version: body.base_version,
      data: body.data as Island,
      gesture: body.gesture === true,
    });
    if (out.status === 200) {
      r.hub.broadcastPage(slug, {
        type: "response",
        version: out.body.version,
        response: out.body.response,
      });
    }
    return json(out.status, out.body);
  }
  if (sub === "comments") {
    if (typeof body.text !== "string" || !body.text.trim())
      return json(400, { error: "text is required" });
    if (body.text.length > 4096) return json(400, { error: "text is over 4096 characters" });
    const toAgent = body.toAgent !== false;
    const out = r.core.addComment(slug, {
      text: body.text.trim(),
      toAgent,
      anchor:
        typeof body.anchor === "string" && body.anchor.trim()
          ? body.anchor.trim().slice(0, 200)
          : undefined,
      threadId: typeof body.threadId === "string" ? body.threadId : undefined,
    });
    if (out.status === 200) {
      r.hub.broadcastPage(slug, {
        type: "comment",
        threadId: (out.body.thread as { id: string }).id,
      });
    }
    return json(out.status, out.body);
  }
  if (sub === "diagnostics") {
    const version = typeof body.version === "number" ? body.version : 0;
    const rows = Array.isArray(body.rows)
      ? body.rows.filter(
          (x): x is { level: string; message: string } =>
            typeof x === "object" &&
            x !== null &&
            typeof (x as { message?: unknown }).message === "string",
        )
      : [];
    const out = r.core.addDiagnostics(slug, version, rows);
    return json(out.status, out.body);
  }
  return json(404, { error: "not found" });
}
