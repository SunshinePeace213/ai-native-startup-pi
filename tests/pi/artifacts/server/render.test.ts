// Contract — the stored document (src/infra/render/document.ts)
//
// R1: a fragment is stored in Claude Code's skeleton, byte for byte, with the
//     source between `<body>\n` and `\n</body></html>` and one addition — the
//     runtime tag right after the viewport meta. Nothing else is added: no policy
//     <meta>, no icon, no title, no island, no id, no body class, no wrapper
// R2: the author's artifact-data island stays in the document untouched and is
//     read out of it; a `data` island given beside the source wins without
//     rewriting the document; an island that is not a JSON object is refused
// R3: a full document — one with an html, head or body tag, or that leads with a
//     doctype — is injected into, never wrapped: the runtime tag goes ahead of every
//     script the document has, a missing doctype is supplied, and the rest is the
//     author's bytes
// R4: a Markdown table needs only a delimiter row of one dash or more per cell, and
//     takes its alignment from the colons; pipes without that row stay a paragraph
// R5: a Markdown file is the skeleton around one <style> and the rendered body in
//     `main.md`; every rule of that style hangs off `.md` and it has a dark variant
//     that follows the stamped theme before the system; a ```mermaid fence becomes
//     <pre class="mermaid"> with its text escaped, any other fence a code block;
//     raw HTML never passes through
// R6: what a source offers for a title: an HTML <title> only within its first 8 KB,
//     and the first heading; Markdown declares none

import { describe, expect, test } from "bun:test";

import { buildDocument, sourceTitle } from "@ext/artifacts/src/infra/render/document";

const build = (source: string, kind: "html" | "md" = "html") =>
  buildDocument({ source, kind }).html;

/** Claude Code's stored document, as measured, with the one tag this platform adds. */
const NATIVE_HEAD =
  '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">';
const RUNTIME = '<script src="/_rt/claude.js"></script>';
const NATIVE_STYLE =
  "<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>";
const skeleton = (body: string) =>
  `${NATIVE_HEAD}${RUNTIME}${NATIVE_STYLE}</head><body>\n${body}\n</body></html>`;

describe("R1 the native skeleton", () => {
  test.each([
    ["a bare fragment", "<h1>Plan</h1><p>body</p>"],
    [
      "a fragment with its own stylesheet",
      "<style>h1 { font-size: 3rem }</style><h1>Beaufort</h1>",
    ],
    [
      "a fragment with a title and an island",
      '<title>T</title><script type="application/json" id="artifact-data">{"a":1}</script><p>x</p>',
    ],
  ])("R1 %s is the skeleton around the source and nothing else", (_name, source) => {
    expect(build(source)).toBe(skeleton(source));
  });
  test("R1 the document names no policy, icon or platform id", () => {
    const html = build("<p>x</p>");
    expect(html).not.toMatch(/http-equiv|rel="?icon|\sid=|<body[^>]+class/i);
  });
});

describe("R2 the island", () => {
  const source =
    '<p>x</p><script type="application/json" id="artifact-data">{"schema":"x","a":1}</script>';
  test("R2 the author's island is read and left where it is", () => {
    const page = buildDocument({ source, kind: "html" });
    expect(page.island).toEqual({ schema: "x", a: 1 });
    expect(page.html).toBe(skeleton(source));
  });
  test("R2 a data island beside the source wins, and the document is still the author's", () => {
    const page = buildDocument({ source, kind: "html", island: { b: 2 } });
    expect(page.island).toEqual({ b: 2 });
    expect(page.html).toBe(skeleton(source));
    expect(buildDocument({ source, kind: "html", island: null }).island).toBeNull();
    expect(buildDocument({ source: "<p>none</p>", kind: "html" }).island).toBeNull();
  });
  test.each([
    ["not JSON", "{oops"],
    ["an array", "[1,2]"],
  ])("R2 an island that is %s is refused", (_name, body) => {
    expect(() =>
      buildDocument({
        source: `<script type="application/json" id="artifact-data">${body}</script>`,
        kind: "html",
      }),
    ).toThrow(/artifact-data/);
  });
});

describe("R3 a full document", () => {
  test("R3 injected into, not wrapped: the runtime tag precedes the document's scripts", () => {
    const source =
      "<!doctype html><html><head><title>T</title><script>first()</script></head><body><h1>x</h1></body></html>";
    const html = build(source);
    expect(html).toBe(source.replace("<head>", `<head>${RUNTIME}`));
    expect(html.indexOf(RUNTIME)).toBeLessThan(html.indexOf("first()"));
  });
  test.each([
    ["no head", "<html><body><script>first()</script></body></html>"],
    ["only a body", "<body><script>first()</script><p>x</p></body>"],
    ["a doctype and a body", "<!DOCTYPE html>\n<body><script>first()</script></body>"],
    ["a doctype and no tag around it", "<!doctype html><title>T</title><script>first()</script>"],
  ])("R3 %s: one runtime tag, ahead of the scripts, under a doctype", (_name, source) => {
    const html = build(source);
    expect(html.split(RUNTIME)).toHaveLength(2);
    expect(html.indexOf(RUNTIME)).toBeLessThan(html.indexOf("first()"));
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html.replace(RUNTIME, "").replace(/^<!doctype html>\n(?=<(html|body))/, "")).toBe(
      source,
    );
    expect(html).not.toContain(NATIVE_STYLE);
  });
});

describe("R4 a Markdown table", () => {
  test("R4 a delimiter row of one dash or more per cell makes a table, aligned by its colons", () => {
    const md = build("| Light | EV |\n| :- | -: |\n| Bright sun | 15 |", "md");
    expect(md).toContain("<table>");
    expect(md).toContain('<th style="text-align:left">Light</th>');
    expect(md).toContain('<td style="text-align:right">15</td>');
  });
  test("R4 rows of pipes with no delimiter row stay a paragraph", () => {
    const md = build("| Light | EV |\n| Bright sun | 15 |", "md");
    expect(md).not.toContain("<table>");
    expect(md).toContain("<p>| Light | EV |");
  });
});

describe("R5 Markdown", () => {
  const html = build(
    '# Plan\n\nbody\n\n```mermaid\ngraph LR; A["<b>"] --> B\n```\n\n```ts\nconst a = 1 < 2;\n```\n\n<script>alert(1)</script>',
    "md",
  );
  const body = html.slice(html.indexOf("<body>\n") + 7, html.indexOf("\n</body></html>"));

  test("R5 the skeleton around one style and the body in main.md", () => {
    expect(html.startsWith(`${NATIVE_HEAD}${RUNTIME}${NATIVE_STYLE}</head><body>\n`)).toBe(true);
    expect(body).toMatch(/^<style>[^<]+<\/style>\n<main class="md">[\s\S]*<\/main>$/);
    expect(body).toContain('<h1 id="plan">Plan</h1>');
  });
  test("R5 every rule hangs off .md, and dark follows the stamped theme before the system", () => {
    const css = /<style>([^<]+)<\/style>/.exec(body)?.[1] ?? "";
    const selectors = css
      .replace(/@media[^{]*\{/g, "")
      .split("}")
      .map((rule) => rule.split("{")[0]?.trim() ?? "")
      .filter(Boolean)
      .flatMap((list) => list.split(",").map((s) => s.trim()));
    expect(selectors.length).toBeGreaterThan(10);
    expect(selectors.filter((s) => !/\.md\b/.test(s))).toEqual([]);
    expect(selectors).toContain(":root[data-theme=dark] .md");
    expect(css).toMatch(
      /@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme=light\]\) \.md\{/,
    );
  });
  test("R5 a mermaid fence is the runtime's <pre>, escaped; another fence is code; raw HTML is text", () => {
    expect(body).toContain(
      '<pre class="mermaid">graph LR; A[&quot;&lt;b&gt;&quot;] --&gt; B</pre>',
    );
    expect(body).toContain('<pre><code class="language-ts">const a = 1 &lt; 2;</code></pre>');
    expect(body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(body).not.toContain("<script>");
  });
});

describe("R6 what a source offers for a title", () => {
  test("R6 an HTML <title> counts only within the first 8 KB; the first heading is offered beside it", () => {
    expect(sourceTitle("<title> Tide  <b>Table</b></title><h1>Dover</h1>", "html")).toEqual({
      declared: "Tide Table",
      heading: "Dover",
    });
    const late = `${"<!-- pad -->".repeat(800)}<title>Too late</title><h1>Heading</h1>`;
    expect(sourceTitle(late, "html")).toEqual({ declared: null, heading: "Heading" });
    expect(sourceTitle("<p>nothing</p>", "html")).toEqual({ declared: null, heading: null });
  });
  test("R6 Markdown declares no title; its first heading is offered", () => {
    expect(sourceTitle("intro\n\n# The Plan\n", "md")).toEqual({
      declared: null,
      heading: "The Plan",
    });
  });
});
