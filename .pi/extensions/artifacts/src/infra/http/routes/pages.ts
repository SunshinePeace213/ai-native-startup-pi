// What the browser reaches on the shell host, all under /a:
//
//   GET  /a/[?t=viewer]           the gallery: every artifact, pinned first
//   GET  /a/_shell.js|_shell.css  the viewer shell's script and stylesheet
//   GET  /a/<slug>[?t=viewer]     the viewer shell, following the latest version;
//                                 the token sets the cookie once
//   GET  /a/<slug>/v/<n>          the viewer shell pinned to version n, read-only
//   GET  /a/<slug>/state          ViewerState: what the shell's header draws
//   GET  /a/<slug>/data[?v=<n>]   FrameData: the island and capabilities of a version
//   GET  /a/<slug>/comments       the comment threads
//   GET  /a/<slug>/events         SSE: {type:"hello",version} first, then
//                                 {type:"version"|"response"|"comment"|"state"|"db", …}
//   POST /a/<slug>/publish        {base_version, data, gesture?} — the page's reply
//   POST /a/<slug>/self-publish   {base_version, html} or {base_version, files: {path:
//                                 {text | base64, contentType?, ifMatch?} | {delete, ifMatch?} |
//                                 null}} — the page's `artifact` capability: a new version,
//                                 the viewer's; refusals carry Claude Code's {code, message}
//   POST /a/<slug>/db             {op, …} — the page's `db` capability (routes/db.ts)
//   POST /a/<slug>/assets         {op: "upload", base64, contentType} | {op: "list"} |
//                                 {op: "delete", ref} — the page's `assets` capability;
//                                 an upload is then served at /_blob/<id> (routes/frame.ts)
//   POST /a/<slug>/comments       {text, toAgent, anchor?, threadId?}
//   POST /a/<slug>/diagnostics    {version, rows:[{level, message}]}
//   POST /a/<slug>/rename         {title}
//   POST /a/<slug>/duplicate      → {slug} of the copy
//   POST /a/<slug>/pin            {pinned}
//   POST /a/<slug>/delete         the folder moves to the trash
//
// A GET presents the viewer token in the query or the cookie. Every POST is
// the shell acting — for the user, or on the framed page's behalf — and needs
// the cookie and the shell's own Origin. The page's document is never served
// here: it lives on its frame host (routes/frame.ts).

import { frameHost, FRAME_PREFIX, PREFIX, SLUG_PATTERN } from "../../../domain/protocol";
import {
  type Island,
  type Isolation,
  type Manifest,
  MAX_API_BYTES,
  MAX_POST_BYTES,
  type ViewerState,
} from "../../../domain/types";
import {
  type AssetsRequest,
  type Core,
  PublishError,
  type SelfFile,
  type SelfPublishInput,
} from "../../../app/core";
import { asset } from "../assets";
import type { Auth } from "../auth";
import type { EventHub } from "../events";
import { frameSandbox, shellCsp } from "../policy";
import { fromBase64, html, json, readJsonBody, str } from "../respond";
import { handleDb } from "./db";
import { galleryPage, notFoundPage, unauthorizedPage } from "./gallery";
import { SHELL_SCRIPT, SHELL_STYLES, viewerPage } from "./shell";

const ROUTE = new RegExp(
  `^${PREFIX}/(${SLUG_PATTERN})(?:/(v/(\\d+)|state|data|comments|events|publish|self-publish|db|assets|diagnostics|rename|duplicate|pin|delete))?/?$`,
);

/** What a capability's route answers a body over its limit: the code its page knows for that. */
const OVERSIZED: Record<string, { code: string; message: string }> = {
  "self-publish": { code: "too_large", message: "the publish is over the size limit" },
  db: { code: "invalid_argument", message: "the document is over the size limit" },
  assets: { code: "too_large", message: "the file is over the size limit" },
};
/** The routes whose bodies carry files, in base64. */
const LARGE: readonly string[] = ["self-publish", "assets"];

export interface PageRoutes {
  core: Core;
  hub: EventHub;
  auth: Auth;
  port: number;
  isolation: Isolation;
}

export async function handlePage(req: Request, url: URL, r: PageRoutes): Promise<Response> {
  const policy = { "content-security-policy": shellCsp(r.port, r.isolation) };
  if (req.method === "GET" && url.pathname === SHELL_SCRIPT) return asset("shell.js");
  if (req.method === "GET" && url.pathname === SHELL_STYLES) return asset("shell.css");
  if (url.pathname === PREFIX || url.pathname === `${PREFIX}/`) {
    if (req.method !== "GET") return json(405, { error: "method not allowed" });
    if (!r.auth.viewer(req, url)) return html(401, unauthorizedPage(), policy);
    if (url.searchParams.has("t")) return r.auth.cookieRedirect(url);
    return html(200, galleryPage(r.core.list()), policy);
  }
  const m = ROUTE.exec(url.pathname);
  if (!m) return json(404, { error: "not found" });
  const slug = m[1] as string;
  const sub = m[2] ?? "";
  const isPage = sub === "" || sub.startsWith("v/");

  if (req.method === "GET") {
    if (!r.auth.viewer(req, url))
      return isPage ? html(401, unauthorizedPage(), policy) : json(401, { error: "unauthorized" });
    const manifest = r.core.get(slug);
    if (!manifest)
      return isPage ? html(404, notFoundPage(), policy) : json(404, { error: "no such artifact" });
    if (isPage) {
      if (url.searchParams.has("t")) return r.auth.cookieRedirect(url);
      const pinned = m[3] ? Number(m[3]) : null;
      if (pinned !== null && !manifest.versions.some((v) => v.n === pinned))
        return json(404, { error: "no such version" });
      r.core.viewed(slug);
      // Under `sandbox` the frame shares this host, so its address is relative and its origin opaque.
      const origin = r.isolation === "origin" ? `http://${frameHost(slug, r.port)}` : "";
      return html(
        200,
        viewerPage({
          state: viewerState(manifest, r.hub),
          pinned,
          frameBase: `${origin}${FRAME_PREFIX}/${r.auth.cap(slug)}/`,
          frameOrigin: origin || "null",
          sandbox: frameSandbox(r.isolation),
        }),
        policy,
      );
    }
    if (sub === "state") return json(200, viewerState(manifest, r.hub));
    if (sub === "data") {
      const wanted = url.searchParams.get("v");
      const data = r.core.frameData(slug, wanted === null ? manifest.current : Number(wanted));
      return data ? json(200, data) : json(404, { error: "no such version" });
    }
    if (sub === "comments") return json(200, { threads: r.core.comments(slug) });
    if (sub === "events") return r.hub.pageStream(slug, manifest.current);
    return json(405, { error: "method not allowed" });
  }
  if (req.method !== "POST") return json(405, { error: "method not allowed" });
  if (!r.auth.shell(req)) return json(403, { error: "not the viewer shell's own request" });
  if (!r.core.get(slug)) return json(404, { error: "no such artifact" });
  const publishing = sub === "self-publish";
  const body = await readJsonBody(req, LARGE.includes(sub) ? MAX_API_BYTES : MAX_POST_BYTES);
  if (body instanceof Response) {
    // A page branches on the code, so even a body over the limit answers in the capability's terms.
    const oversized = body.status === 413 && Object.hasOwn(OVERSIZED, sub) && OVERSIZED[sub];
    return oversized ? json(413, oversized) : body;
  }

  if (publishing) {
    const input = selfPublishInput(body);
    if (typeof input === "string") return json(400, { code: "invalid_content", message: input });
    const out = r.core.selfPublish(slug, input);
    if (out.status === 200) {
      r.hub.broadcastPage(slug, { type: "version", version: Number(out.body.version) });
    }
    return json(out.status, out.body);
  }
  if (sub === "db") return handleDb(slug, body, r);
  if (sub === "assets") {
    const asked = assetsRequest(body);
    if (!asked)
      return json(400, { code: "invalid_request", message: "op is upload, list or delete" });
    const out = r.core.assets(slug, asked);
    return json(out.status, out.body);
  }
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
  try {
    if (sub === "rename") {
      if (typeof body.title !== "string") return json(400, { error: "title is required" });
      const renamed = r.core.rename(slug, body.title);
      r.hub.broadcastPage(slug, { type: "state" });
      return json(200, { state: viewerState(renamed, r.hub) });
    }
    if (sub === "duplicate") return json(200, { slug: r.core.duplicate(slug).slug });
    if (sub === "pin") {
      const pinned = r.core.setPinned(slug, body.pinned !== false);
      r.hub.broadcastPage(slug, { type: "state" });
      return json(200, { state: viewerState(pinned, r.hub) });
    }
    if (sub === "delete") {
      r.hub.closePage(slug);
      r.core.remove(slug);
      r.hub.tellSessions({ kind: "removed", slug });
      return json(200, { ok: true });
    }
  } catch (e) {
    if (e instanceof PublishError) return json(e.status, { error: e.message });
    throw e;
  }
  return json(404, { error: "not found" });
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** What the shell posts for a page's publish, decoded for the core; a string says why it is malformed. */
function selfPublishInput(body: Record<string, unknown>): SelfPublishInput | string {
  const baseVersion = body.base_version;
  if (typeof baseVersion !== "number" || !Number.isInteger(baseVersion))
    return "base_version must be an integer";
  if ((body.html === undefined) === (body.files === undefined))
    return "a publish is a whole page (html) or the files that changed (files)";
  if (body.html !== undefined) {
    return typeof body.html === "string"
      ? { baseVersion, html: body.html }
      : "html must be a string";
  }
  if (!isObject(body.files)) return "files must be an object of path → content";
  const files: Record<string, SelfFile> = {};
  for (const [path, value] of Object.entries(body.files)) {
    if (value === null) {
      files[path] = { delete: true };
      continue;
    }
    if (!isObject(value))
      return `files[${JSON.stringify(path)}] must be content, a delete, or null`;
    const pin = value.ifMatch;
    if (pin !== undefined && pin !== null && typeof pin !== "string")
      return `files[${JSON.stringify(path)}].ifMatch must be a sha256 or null`;
    if (value.delete === true) {
      files[path] = { delete: true, ifMatch: pin };
      continue;
    }
    const text = typeof value.text === "string";
    const bytes = text ? new TextEncoder().encode(value.text as string) : fromBase64(value.base64);
    if (!bytes) return `files[${JSON.stringify(path)}] must carry text, or its bytes in base64`;
    files[path] = { bytes, text, contentType: str(value.contentType), ifMatch: pin };
  }
  return { baseVersion, files };
}

/** What the shell posts for a page's `assets` call; null when it names no such call. */
function assetsRequest(body: Record<string, unknown>): AssetsRequest | null {
  if (body.op === "list") return { op: "list" };
  if (body.op === "delete") return { op: "delete", ref: body.ref };
  if (body.op !== "upload") return null;
  return { op: "upload", bytes: fromBase64(body.base64), contentType: body.contentType };
}

function viewerState(m: Manifest, hub: EventHub): ViewerState {
  return {
    slug: m.slug,
    title: m.title,
    icon: m.icon,
    current: m.current,
    versions: m.versions.map(({ n, at, label }) => ({ n, at, label })),
    pinned: m.pinned,
    connected: hub.sessions().includes(m.owner),
  };
}
