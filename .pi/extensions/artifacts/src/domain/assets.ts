// The rules for what a page uploads through Claude Code's `assets` capability:
// files people add — an image, a video, a PDF, a font, a data file, a
// stylesheet or a script — stored with the artifact under an opaque id and
// served to every version of its page at /_blob/<id>. They are Claude Code's:
// a closed set of exact media types, no parameters and no aliases; 20 MiB a
// file, 16 MiB for CSS and JavaScript, 2 MiB for SVG; text must be UTF-8; what
// is declared binary may not open with markup, and a stylesheet or script must
// read as text; an SVG is sanitised and re-encoded, so what is stored runs
// nothing. An artifact holds at most 256 MiB of them. Pure: bytes in, the
// bytes to store or the refusal out — not to be confused with the static files
// the server hands a browser (infra/http/assets.ts).

import { BLOB_PREFIX } from "./protocol";

const MIB = 1024 * 1024;

export const MAX_ASSET_BYTES = 20 * MIB;
export const MAX_CODE_ASSET_BYTES = 16 * MIB;
export const MAX_SVG_ASSET_BYTES = 2 * MIB;
/** The per-artifact budget `usage` reports: how many assets, and how many bytes of them. */
export const MAX_ASSET_FILES = 1000;
export const MAX_ASSET_TOTAL_BYTES = 256 * MIB;

const SVG = "image/svg+xml";
const CODE_TYPES: readonly string[] = ["text/css", "text/javascript"];
const TEXT_TYPES: readonly string[] = [
  "text/csv",
  "text/markdown",
  "application/json",
  "text/plain",
  ...CODE_TYPES,
];
/** The closed set: anything else is wrapped in one of these, or kept in `db`. */
export const ASSET_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  SVG,
  "video/mp4",
  "video/webm",
  "application/pdf",
  "font/woff2",
  "font/woff",
  "font/ttf",
  "font/otf",
  ...TEXT_TYPES,
];

/** One stored asset, as the artifact's index keeps it. */
export interface AssetRecord {
  /** Opaque, 32 hex characters: the durable pointer a page keeps in its documents. */
  id: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface AssetUsage {
  files: number;
  bytes: number;
  maxFiles: number;
  maxBytes: number;
}

/** Why a call is refused, under the capability's own codes. */
export interface AssetRefusal {
  code: "invalid_request" | "too_large" | "unsupported_type" | "quota_or_state";
  message: string;
}

export const ASSET_ID_RE = /^[a-f0-9]{32}$/;
/** The one root-relative address a page is served: it resolves from every version. */
export const assetUrl = (id: string) => `${BLOB_PREFIX}/${id}`;

export const isAssetRefusal = (result: object): result is AssetRefusal => "code" in result;

/** Whether an asset's type is served with a charset: the text types, and SVG. */
export const isTextAsset = (contentType: string): boolean =>
  TEXT_TYPES.includes(contentType) || contentType === SVG;

export function assetUsage(records: AssetRecord[]): AssetUsage {
  return {
    files: records.length,
    bytes: records.reduce((sum, record) => sum + record.sizeBytes, 0),
    maxFiles: MAX_ASSET_FILES,
    maxBytes: MAX_ASSET_TOTAL_BYTES,
  };
}

/** The id a delete names: the id itself, or the url `upload` and `list` hand out; null for anything else. */
export function assetIdOf(ref: unknown): string | null {
  if (typeof ref !== "string") return null;
  const id = ref.startsWith(`${BLOB_PREFIX}/`) ? ref.slice(BLOB_PREFIX.length + 1) : ref;
  return ASSET_ID_RE.test(id) ? id : null;
}

// ---- what a body may be -------------------------------------------------------

function utf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** Whether the first thing in a body, past a byte-order mark and blanks, is `<`. */
function opensWithMarkup(bytes: Uint8Array): boolean {
  let at = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  while (at < bytes.length && [0x20, 0x09, 0x0a, 0x0d, 0x0c].includes(bytes[at] as number)) at += 1;
  return bytes[at] === 0x3c;
}

// eslint-disable-next-line no-control-regex
const BINARY_RE = /[\x00-\x08\x0e-\x1f]/;

const mib = (bytes: number) => `${(bytes / MIB).toFixed(1)} MiB`;
const refuse = (code: AssetRefusal["code"], message: string): AssetRefusal => ({ code, message });

/**
 * What an upload is stored as: its bytes — an SVG's as sanitised — under the
 * type it is served with; or the refusal. `held` is what the artifact already
 * stores, for the budget.
 */
export function acceptUpload(
  bytes: Uint8Array,
  contentType: unknown,
  held: AssetRecord[],
): { bytes: Uint8Array; contentType: string } | AssetRefusal {
  if (typeof contentType !== "string" || !contentType) {
    return refuse(
      "invalid_request",
      "the blob names no type; pass options.type, chosen from the file's extension",
    );
  }
  if (!ASSET_TYPES.includes(contentType)) {
    return refuse(
      "unsupported_type",
      `${JSON.stringify(contentType)} is not an accepted type: an exact media type with no parameter, one of ${ASSET_TYPES.join(", ")}`,
    );
  }
  if (!bytes.byteLength) return refuse("invalid_request", "the blob is empty");
  const limit =
    contentType === SVG
      ? MAX_SVG_ASSET_BYTES
      : CODE_TYPES.includes(contentType)
        ? MAX_CODE_ASSET_BYTES
        : MAX_ASSET_BYTES;
  if (bytes.byteLength > limit) {
    return refuse(
      "too_large",
      `the file is ${mib(bytes.byteLength)}; ${contentType} is at most ${mib(limit)}`,
    );
  }
  let stored = bytes;
  if (contentType === SVG) {
    const clean = sanitizeSvg(utf8(bytes) ?? "");
    if (clean === null) return refuse("unsupported_type", "the body is not an SVG document");
    stored = new TextEncoder().encode(clean);
  } else if (TEXT_TYPES.includes(contentType)) {
    const text = utf8(bytes);
    if (text === null) {
      return refuse(
        "invalid_request",
        `a ${contentType} file must be UTF-8; re-encode it before uploading`,
      );
    }
    // The four data types are stored as given; a stylesheet or a script must also read as one.
    if (CODE_TYPES.includes(contentType) && (opensWithMarkup(bytes) || BINARY_RE.test(text))) {
      return refuse(
        "unsupported_type",
        `the body does not read as ${contentType}: it opens with markup or carries binary content`,
      );
    }
  } else if (opensWithMarkup(bytes)) {
    return refuse(
      "unsupported_type",
      `the body opens with markup, which ${contentType} never does; markup uploads only as ${SVG}`,
    );
  }
  const usage = assetUsage(held);
  if (usage.files >= usage.maxFiles || usage.bytes + stored.byteLength > usage.maxBytes) {
    return refuse(
      "quota_or_state",
      `the artifact's asset storage is full (${usage.files} of ${usage.maxFiles} files, ${mib(usage.bytes)} of ${mib(usage.maxBytes)}); delete assets no document points at`,
    );
  }
  return { bytes: stored, contentType };
}

// ---- SVG ------------------------------------------------------------------------
// An uploaded SVG is only ever an image, so everything that could make it
// more is taken out: script, event handlers, foreign content, stylesheets,
// animation, references out of the file, and javascript: and data: URLs. No
// DOM exists here, so it is read tag by tag; whatever is not plainly a tag or
// text is dropped, never passed through.

const SVG_ROOT_RE =
  /^﻿?\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*|<!DOCTYPE[^>[]*(?:\[[\s\S]*?\])?[^>]*>\s*)*<(?:[A-Za-z][\w.-]*:)?svg[\s/>]/i;
const TOKEN_RE =
  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>[]*(?:\[[\s\S]*?\])?[^>]*>|<\/?[A-Za-z](?:"[^"]*"|'[^']*'|[^'">])*>|[^<]+|</g;
const ATTRIBUTE_RE = /([^\s"'<>/=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
const REMOVED_ELEMENTS: readonly string[] = [
  "script",
  "foreignobject",
  "style",
  "link",
  "animate",
  "animatemotion",
  "animatetransform",
  "animatecolor",
  "set",
  "discard",
  "handler",
  "listener",
];
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

const localName = (name: string) => name.slice(name.lastIndexOf(":") + 1).toLowerCase();

const unquoted = (raw: string) => (/^["']/.test(raw) ? raw.slice(1, -1) : raw);

/** An attribute's value as a parser would see it, flattened the way a URL parser flattens it. */
function flatValue(raw: string): string {
  return (
    unquoted(raw)
      .replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));?/gi, (whole, hex, decimal, named) => {
        if (named) return Object.hasOwn(ENTITIES, named) ? (ENTITIES[named] as string) : whole;
        const code = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
      })
      // eslint-disable-next-line no-control-regex
      .replace(/[\s\x00-\x1f]+/g, "")
      .toLowerCase()
  );
}

function keptAttribute(element: string, name: string, raw: string | undefined): boolean {
  const attribute = name.toLowerCase();
  if (attribute.startsWith("on")) return false;
  if (raw === undefined) return true;
  const value = flatValue(raw);
  if (/(?:^|url\(["']?)(?:javascript|data):/.test(value)) return false;
  const reference = localName(attribute) === "href";
  return !(reference && element === "use" && !value.startsWith("#"));
}

/** A kept attribute, written the one way every XML parser reads alike: double-quoted, no raw quote or `<` inside. */
const written = (name: string, raw: string | undefined): string =>
  raw === undefined
    ? name
    : `${name}="${unquoted(raw).replace(/"/g, "&quot;").replace(/</g, "&lt;")}"`;

/** The SVG with everything but the image taken out; null when the source is no SVG document. */
export function sanitizeSvg(source: string): string | null {
  if (!SVG_ROOT_RE.test(source)) return null;
  const out: string[] = [];
  /** The removed element being skipped, and how many of its own name are open inside it. */
  let skipping: { name: string; depth: number } | null = null;
  for (const [token] of source.matchAll(TOKEN_RE)) {
    const tag = /^<(\/?)([A-Za-z][^\s/>]*)/.exec(token);
    if (!tag) {
      // Text and CDATA are content; comments, instructions and declarations carry nothing an image needs.
      if (skipping || (token.startsWith("<") && !token.startsWith("<![CDATA["))) continue;
      out.push(token === "<" ? "&lt;" : token);
      continue;
    }
    const closing = tag[1] === "/";
    const element = localName(tag[2] as string);
    const selfClosing = /\/\s*>$/.test(token);
    if (skipping) {
      if (element !== skipping.name || selfClosing) continue;
      skipping.depth += closing ? -1 : 1;
      if (!skipping.depth) skipping = null;
      continue;
    }
    if (REMOVED_ELEMENTS.includes(element)) {
      if (!closing && !selfClosing) skipping = { name: element, depth: 1 };
      continue;
    }
    if (closing) {
      out.push(`</${tag[2]}>`);
      continue;
    }
    const rest = token.slice(tag[0].length).replace(/\/?\s*>$/, "");
    const attributes = [...rest.matchAll(ATTRIBUTE_RE)]
      .filter(([, name, raw]) => keptAttribute(element, name as string, raw))
      .map(([, name, raw]) => written(name as string, raw));
    out.push(`<${[tag[2], ...attributes].join(" ")}${selfClosing ? "/" : ""}>`);
  }
  // Blanks around the root came with the declarations that were dropped.
  return out.join("").trim();
}
