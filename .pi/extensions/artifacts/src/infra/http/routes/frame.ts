// What a page's own origin reaches — its frame host, or the shell host under
// `sandbox` isolation — and nothing else:
//
//   GET /_f/<cap>/<n>/         the stored document of version n, under the page policy
//   GET /_f/<cap>/<n>/<path>   one of version n's supporting files, under the same policy,
//                              with the media type it was stored under and never sniffed
//   GET /_blob/<id>            an asset the page uploaded, whatever the version: the one
//                              root-relative address a page is served
//   GET /_rt/claude.js         the page runtime
//   GET /_rt/mermaid.js        mermaid, which the runtime loads when a page draws a diagram
//
// No cookie is read here: the cap in the path is the capability, and it is
// the cap of the slug the Host names; an asset's id, 128 random bits only its
// own page was ever told, is one too. Under `sandbox` there is no such Host,
// so the artifact is found by the cap, or by the id, itself. A file sits under
// its version's path, so a page reaches it by a relative URL and an old
// version keeps its own.

import type { Core } from "../../../app/core";
import { isTextAsset } from "../../../domain/assets";
import { isTextType } from "../../../domain/files";
import { BLOB_PREFIX, FRAME_PREFIX, RUNTIME_PREFIX } from "../../../domain/protocol";
import type { Isolation } from "../../../domain/types";
import { asset } from "../assets";
import type { Auth } from "../auth";
import { frameCsp, IMAGE_CSP } from "../policy";
import { html, json } from "../respond";

const VERSIONED = new RegExp(`^${FRAME_PREFIX}/([a-f0-9]{32})/(\\d+)/(.*)$`);
const UPLOADED = new RegExp(`^${BLOB_PREFIX}/([a-f0-9]{32})$`);

export interface FrameRoutes {
  core: Core;
  auth: Auth;
  port: number;
  isolation: Isolation;
}

export const isFramePath = (pathname: string): boolean =>
  [FRAME_PREFIX, RUNTIME_PREFIX, BLOB_PREFIX].some((prefix) => pathname.startsWith(`${prefix}/`));

/** The published path a request names; null when its escapes do not decode. */
function publishedPath(encoded: string): string | null {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/** Bytes a page stored, served as what they were stored as: typed, never sniffed, never cached. */
const stored = (bytes: Uint8Array, type: string, text: boolean, policy: string): Response =>
  new Response(bytes, {
    status: 200,
    headers: {
      "content-type": text ? `${type}; charset=utf-8` : type,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "content-security-policy": policy,
    },
  });

/** `slug` is the artifact the Host names; null when the shell host serves frames by cap. */
export function handleFrame(req: Request, url: URL, slug: string | null, r: FrameRoutes): Response {
  const missing = () => json(404, { error: "not found" });
  // Whatever the method: to a frame origin nothing but its own files exists.
  if (!isFramePath(url.pathname)) return missing();
  if (req.method !== "GET") return json(405, { error: "method not allowed" });
  if (url.pathname === `${RUNTIME_PREFIX}/claude.js`) return asset("claude.js");
  if (url.pathname === `${RUNTIME_PREFIX}/mermaid.js`) return asset("mermaid.js");
  const policy = frameCsp(r.port, r.isolation);
  const uploaded = UPLOADED.exec(url.pathname);
  if (uploaded) {
    const id = uploaded[1] as string;
    const holder = slug ?? r.core.list().find((a) => r.core.asset(a.slug, id))?.slug;
    const found = holder ? r.core.asset(holder, id) : null;
    if (!found) return missing();
    const type = found.record.contentType;
    return stored(
      found.bytes,
      type,
      isTextAsset(type),
      type === "image/svg+xml" ? IMAGE_CSP : policy,
    );
  }
  const m = VERSIONED.exec(url.pathname);
  if (!m) return missing();
  const cap = m[1] as string;
  const owner = slug ?? r.core.list().find((a) => r.auth.capMatches(a.slug, cap))?.slug;
  if (!owner || !r.auth.capMatches(owner, cap)) return missing();
  const version = Number(m[2]);
  if (m[3] === "") {
    const page = r.core.page(owner, version);
    return page === null ? missing() : html(200, page, { "content-security-policy": policy });
  }
  const path = publishedPath(m[3] as string);
  const file = path === null ? null : r.core.file(owner, version, path);
  if (!file) return missing();
  const type = file.record.contentType;
  return stored(file.bytes, type, isTextType(type), policy);
}
