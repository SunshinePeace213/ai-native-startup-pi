// The document shell: what turns the file the agent wrote into the page the
// browser gets. It finds the title and the data island in the source, renders
// Markdown, and injects the CSP, the favicon, the normalized island, the page
// meta (slug, version, endpoint) and the runtime. A complete HTML document is
// injected into, never wrapped twice; a fragment or a Markdown body is wrapped.
// Pure: no filesystem, no network.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { type Island, MAX_PAGE_BYTES, type SourceKind } from "../../shared/types";
import { markdownTitle, renderMarkdown } from "./markdown";

/** The page layer, read once: what every published page carries. */
const pageFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../../page/${name}`, import.meta.url)), "utf8");
export const RUNTIME_SCRIPT = pageFile("runtime.js");
export const RUNTIME_STYLES = pageFile("styles.css");

/** The page policy, as a <meta> for a file opened from disk; the server also sends it as a header. */
export const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src data: blob:; " +
  "connect-src 'self'; base-uri 'none'; form-action 'none'";
/** The header form adds what a <meta> cannot carry. */
export const CSP_HEADER = `${CSP}; frame-ancestors 'none'`;

export interface PageInput {
  source: string;
  kind: SourceKind;
  /** Overrides whatever the island in the source says. */
  island?: Island | null;
  title?: string;
  icon?: string;
  slug: string;
  version: number;
  /** The path the runtime posts to, e.g. `/a/<slug>`. */
  endpoint: string;
}

export interface Page {
  html: string;
  title: string;
  island: Island | null;
}

const ISLAND_RE =
  /<script\b[^>]*\bid\s*=\s*["']artifact-data["'][^>]*>([\s\S]*?)<\/script\s*>|<script\b[^>]*\btype\s*=\s*["']application\/json["'][^>]*\bid\s*=\s*["']artifact-data["'][^>]*>([\s\S]*?)<\/script\s*>/i;
const TITLE_RE = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i;
const H1_RE = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i;

/** JSON safe to place inside a <script> element. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

export function extractTitle(source: string, kind: SourceKind): string | null {
  if (kind === "md") return markdownTitle(source);
  const head = source.slice(0, 8192);
  const t = TITLE_RE.exec(head);
  if (t?.[1] && stripTags(t[1])) return stripTags(t[1]);
  const h = H1_RE.exec(source);
  if (h?.[1] && stripTags(h[1])) return stripTags(h[1]);
  return null;
}

function favicon(icon: string | undefined): string {
  const glyph = (icon ?? "🖼️").trim() || "🖼️";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${glyph}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function headInjection(
  input: PageInput,
  title: string,
  island: Island | null,
  hasTitle: boolean,
): string {
  const meta = { slug: input.slug, version: input.version, title, endpoint: input.endpoint };
  return [
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    hasTitle ? "" : `<title>${escapeHtml(title)}</title>`,
    `<link rel="icon" href="${favicon(input.icon)}">`,
    `<script id="artifact-meta" type="application/json">${scriptJson(meta)}</script>`,
    `<script id="artifact-data" type="application/json">${island ? scriptJson(island) : ""}</script>`,
    `<style id="artifact-styles">${RUNTIME_STYLES}</style>`,
  ]
    .filter(Boolean)
    .join("\n");
}

const runtimeTag = () => `<script id="artifact-runtime">${RUNTIME_SCRIPT}</script>`;

/** Builds the page. Throws when the island in the source is malformed or the page is too large. */
export function buildPage(input: PageInput): Page {
  let source = input.source.replace(/^\uFEFF/, "");
  let island: Island | null;
  if (input.island !== undefined) {
    island = input.island;
    if (input.kind === "html") source = source.replace(ISLAND_RE, "");
  } else if (input.kind === "html") {
    const found = extractIsland(source);
    if (found.error) throw new Error(found.error);
    island = found.island ?? null;
    source = source.replace(ISLAND_RE, "");
  } else {
    island = null;
  }
  const title = (input.title?.trim() || extractTitle(source, input.kind) || input.slug).slice(
    0,
    200,
  );

  let html: string;
  if (input.kind === "md") {
    const body = `<main class="af-md">${renderMarkdown(source)}</main>`;
    html = wrap(input, title, island, body, true);
  } else if (
    /<html[\s>]/i.test(source) ||
    /<head[\s>]/i.test(source) ||
    /<body[\s>]/i.test(source)
  ) {
    html = inject(input, title, island, source);
  } else {
    html = wrap(input, title, island, `<div class="af-wrap">${source}</div>`, true);
  }
  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > MAX_PAGE_BYTES) {
    throw new Error(
      `the rendered page is ${(bytes / 1024 / 1024).toFixed(1)} MiB; the limit is 16 MiB — embedded images are the usual cause`,
    );
  }
  return { html, title, island };
}

function wrap(
  input: PageInput,
  title: string,
  island: Island | null,
  body: string,
  baseStyles: boolean,
): string {
  return [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8">`,
    headInjection(input, title, island, false),
    "</head>",
    `<body class="${baseStyles ? "af-base" : ""}">`,
    body,
    runtimeTag(),
    "</body>",
    "</html>",
  ].join("\n");
}

function inject(input: PageInput, title: string, island: Island | null, source: string): string {
  const hasTitle = TITLE_RE.test(source.slice(0, 8192));
  const hasCsp = /http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(source);
  let head = headInjection(input, title, island, hasTitle);
  if (hasCsp) head = head.replace(/^<meta http-equiv="Content-Security-Policy"[^\n]*\n/, "");
  let html = source;
  if (/<\/head\s*>/i.test(html)) html = html.replace(/<\/head\s*>/i, `${head}\n</head>`);
  else if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${head}`);
  else if (/<html[^>]*>/i.test(html))
    html = html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n${head}\n</head>`);
  else html = `${head}\n${html}`;
  if (/<\/body\s*>/i.test(html)) html = html.replace(/<\/body\s*>/i, `${runtimeTag()}\n</body>`);
  else html = `${html}\n${runtimeTag()}`;
  if (!/<!doctype/i.test(html)) html = `<!doctype html>\n${html}`;
  return html;
}
