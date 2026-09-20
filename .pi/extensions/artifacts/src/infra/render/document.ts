// The stored document: what turns the file the agent wrote into the page a
// frame loads. It is Claude Code's skeleton byte for byte, with one addition:
// the runtime tag right after the viewport meta, so window.claude exists
// before any page script runs (the tag then removes itself). Nothing else is
// added — no policy <meta>, no icon, no island, no id, no body class, no
// chrome: the policy is an HTTP header, and the title, icon and island live
// in the viewer shell. A complete HTML document is injected into, never
// wrapped; a Markdown file is rendered and brings its own small look.
//
// The author's artifact-data island stays in the source untouched; it is read
// here so the core can validate it and the shell can hand it to the page.

import {
  PageTooLarge,
  type RenderInput,
  type RenderedPage,
  type Renderer,
  type SourceTitle,
} from "../../app/ports";
import { type Island, MAX_PAGE_BYTES, type SourceKind } from "../../domain/types";
import { MARKDOWN_STYLE, markdownTitle, renderMarkdown } from "./markdown";

export const RUNTIME_TAG = `<script src="/_rt/claude.js"></script>`;

const SKELETON_HEAD = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">`;
const SKELETON_STYLE =
  "<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}" +
  "html{scroll-padding-top:env(safe-area-inset-top,0px)}" +
  "body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}" +
  "img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>";

const ISLAND_RE =
  /<script\b[^>]*\bid\s*=\s*["']artifact-data["'][^>]*>([\s\S]*?)<\/script\s*>|<script\b[^>]*\btype\s*=\s*["']application\/json["'][^>]*\bid\s*=\s*["']artifact-data["'][^>]*>([\s\S]*?)<\/script\s*>/i;
const TITLE_RE = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i;
const H1_RE = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i;
/** Claude Code reads a page's <title> from the first 8 KB of the file. */
const TITLE_WINDOW = 8192;

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Reads the data island out of HTML source; `undefined` when none, `null` when unparsable. */
export function extractIsland(html: string): { island: Island | null | undefined; error?: string } {
  const m = ISLAND_RE.exec(html);
  if (!m) return { island: undefined };
  const body = (m[1] ?? m[2] ?? "").trim();
  if (!body) return { island: undefined };
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { island: null, error: "the artifact-data island must be a JSON object" };
    }
    return { island: parsed as Island };
  } catch (e) {
    return {
      island: null,
      error: `the artifact-data island is not valid JSON: ${(e as Error).message}`,
    };
  }
}

/** The title a source declares (an HTML <title>) and the one its first heading offers. */
export function sourceTitle(source: string, kind: SourceKind): SourceTitle {
  if (kind === "md") return { declared: null, heading: markdownTitle(source) };
  const declared = TITLE_RE.exec(source.slice(0, TITLE_WINDOW))?.[1];
  const heading = H1_RE.exec(source)?.[1];
  return {
    declared: (declared && stripTags(declared)) || null,
    heading: (heading && stripTags(heading)) || null,
  };
}

const wrap = (body: string) =>
  `${SKELETON_HEAD}${RUNTIME_TAG}${SKELETON_STYLE}</head><body>\n${body}\n</body></html>`;

/** A full document keeps its own structure; the runtime tag goes ahead of every script it has. */
function inject(source: string): string {
  const opening = /<head\b[^>]*>/i.exec(source) ?? /<html\b[^>]*>/i.exec(source);
  const at = opening
    ? opening.index + opening[0].length
    : (/^\s*<!doctype[^>]*>/i.exec(source)?.[0].length ?? 0);
  const html = `${source.slice(0, at)}${RUNTIME_TAG}${source.slice(at)}`;
  return /<!doctype/i.test(html) ? html : `<!doctype html>\n${html}`;
}

/** Builds the document. Throws when the island in the source is malformed or the page is too large. */
export function buildDocument(input: RenderInput): RenderedPage {
  const source = input.source.replace(/^\uFEFF/, "");
  let island: Island | null;
  if (input.island !== undefined) {
    island = input.island;
  } else if (input.kind === "html") {
    const found = extractIsland(source);
    if (found.error) throw new Error(found.error);
    island = found.island ?? null;
  } else {
    island = null;
  }

  let html: string;
  if (input.kind === "md") {
    html = wrap(
      `<style>${MARKDOWN_STYLE}</style>\n<main class="md">${renderMarkdown(source)}</main>`,
    );
  } else if (
    /^\s*<!doctype/i.test(source) ||
    /<html[\s>]/i.test(source) ||
    /<head[\s>]/i.test(source) ||
    /<body[\s>]/i.test(source)
  ) {
    // A doctype alone makes a document: the tags may be left out, and a page publishing itself leads with one.
    html = inject(source);
  } else {
    html = wrap(source);
  }
  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > MAX_PAGE_BYTES) {
    throw new PageTooLarge(
      `the rendered page is ${(bytes / 1024 / 1024).toFixed(1)} MiB; the limit is 16 MiB — embedded images are the usual cause`,
    );
  }
  return { html, island };
}

/** The renderer port over this module. */
export const renderer: Renderer = {
  build: buildDocument,
  title: sourceTitle,
};
