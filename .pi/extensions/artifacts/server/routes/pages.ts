// What the browser reaches, all under /a:
//
//   GET  /a/[?t=token]            the gallery: every artifact, newest first
//   GET  /a/<slug>[?t=token]      the current page; the token sets a cookie once
//   GET  /a/<slug>/v/<n>          one version, read-only
//   GET  /a/<slug>/data           the current island
//   GET  /a/<slug>/comments       the comment threads
//   GET  /a/<slug>/events         SSE: {type:"version",version} · {type:"comment"}
//   POST /a/<slug>/publish        {base_version, data} — the page republishes itself
//   POST /a/<slug>/comments       {text, toAgent, anchor?, threadId?}
//
// A GET may present the token in the query, the cookie, or the header; a POST
// needs the header (only the page's own script sends it) and the page's Origin.

import { PREFIX } from "../../shared/protocol";
import { type Island, MAX_POST_BYTES } from "../../shared/types";
import type { Auth } from "../auth";
import type { Core } from "../core";
import type { EventHub } from "../events";
import { CSP_HEADER } from "../render/shell";
import { html, json, readJsonBody } from "../respond";
import { galleryPage, notFoundPage, unauthorizedPage } from "./gallery";

const ROUTE = /^\/a\/([a-z0-9][a-z0-9-]{0,63})(?:\/(v\/(\d+)|data|comments|events|publish))?\/?$/;

export interface PageRoutes {
  core: Core;
  hub: EventHub;
  auth: Auth;
}

export async function handlePage(req: Request, url: URL, r: PageRoutes): Promise<Response> {
  if (url.pathname === PREFIX || url.pathname === `${PREFIX}/`) {
    if (req.method !== "GET") return json(405, { error: "method not allowed" });
    if (!r.auth.any(req, url)) return html(401, unauthorizedPage());
    if (url.searchParams.has("t")) return r.auth.cookieRedirect(url);
    return html(200, galleryPage(r.core.list()));
  }
  const m = ROUTE.exec(url.pathname);
  if (!m) return json(404, { error: "not found" });
  const slug = m[1] as string;
  const sub = m[2] ?? "";
  const isPage = sub === "" || sub.startsWith("v/");
  if (!r.auth.any(req, url))
    return isPage ? html(401, unauthorizedPage()) : json(401, { error: "unauthorized" });
  if (!r.core.get(slug)) {
    return isPage && req.method === "GET"
      ? html(404, notFoundPage())
      : json(404, { error: "no such artifact" });
  }

  if (req.method === "GET") {
    if (isPage) {
      if (url.searchParams.has("t")) return r.auth.cookieRedirect(url);
      const page = r.core.page(slug, m[3] ? Number(m[3]) : undefined);
      return page === null
        ? json(404, { error: "no such version" })
        : html(200, page, { "content-security-policy": CSP_HEADER });
    }
    if (sub === "data") return json(200, { island: r.core.island(slug) });
    if (sub === "comments") return json(200, { threads: r.core.comments(slug) });
    if (sub === "events") return r.hub.pageStream(slug);
    return json(405, { error: "method not allowed" });
  }
  if (req.method !== "POST") return json(405, { error: "method not allowed" });
  if (!r.auth.header(req)) return json(403, { error: "missing token header" });
  if (!r.auth.ownOrigin(req)) return json(403, { error: "cross-origin request refused" });
  const body = await readJsonBody(req, MAX_POST_BYTES);
  if (body instanceof Response) return body;

  if (sub === "publish") {
    if (typeof body.base_version !== "number" || !Number.isInteger(body.base_version)) {
      return json(400, { error: "base_version must be an integer" });
    }
    if (typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
      return json(400, { error: "data must be an object" });
    }
    const out = r.core.republishFromPage(slug, {
      base_version: body.base_version,
      data: body.data as Island,
    });
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
    // A note to the agent is broadcast by the core's event; a plain note only refreshes tabs.
    if (out.status === 200 && !toAgent) {
      r.hub.broadcastPage(slug, {
        type: "comment",
        threadId: (out.body.thread as { id: string }).id,
      });
    }
    return json(out.status, out.body);
  }
  return json(404, { error: "not found" });
}
