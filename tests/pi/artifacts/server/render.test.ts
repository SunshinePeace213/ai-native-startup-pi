// shell — buildPage of .pi/extensions/artifacts, the file → page contract.
//
// S1  an HTML fragment → one full document: CSP meta, viewport, <title> from
//     the first <h1>, favicon, meta and data islands in <head>, the runtime
//     before </body>, base styles on <body>
// S2  a complete HTML document → injected, not wrapped: one <html>, one doctype,
//     its own <title> kept, the runtime before its </body>; a source with its
//     own CSP keeps it and gets no second one
// S3  Markdown → rendered HTML (headings with ids, lists, escaped fenced code,
//     pipe tables), title from the first `# `, raw HTML escaped
// S4  an artifact-data island in the source → parsed, re-emitted once with `<`
//     escaped so a value holding `</script>` cannot end the element; the same
//     for an `island` parameter; malformed island JSON → throws naming the island
// S5  the `island` parameter overrides the source's island; `null` publishes an
//     empty island
// S6  title precedence: parameter > <title> > <h1> > slug; <title> is found
//     only in the first 8 KB
// S7  a page over 16 MiB → throws naming the limit
// S8  the meta island carries slug, version, and endpoint
// S9  the inlined runtime is syntactically valid JavaScript and uses no template
//     literal (a backtick would end the string it is shipped in)

import { describe, expect, test } from "bun:test";

import { RUNTIME_SCRIPT } from "@ext/artifacts/server/render/shell";
import { buildPage, CSP } from "@ext/artifacts/server/render/shell";

const base = { slug: "demo", version: 3, endpoint: "/a/demo" };
const island = (html: string) =>
  JSON.parse(
    /<script id="artifact-data" type="application\/json">([\s\S]*?)<\/script>/.exec(html)?.[1] ||
      "null",
  );
const meta = (html: string) =>
  JSON.parse(
    /<script id="artifact-meta" type="application\/json">([\s\S]*?)<\/script>/.exec(html)?.[1] ||
      "null",
  );
const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("artifacts shell", () => {
  test("S1 a fragment becomes one full document with the shell parts in place", () => {
    const page = buildPage({ ...base, kind: "html", source: "<h1>Deploy failures</h1><p>hi</p>" });
    expect(count(page.html, "<!doctype html>")).toBe(1);
    expect(count(page.html, "<html")).toBe(1);
    expect(page.html).toContain(`content="${CSP}"`);
    expect(page.html).toContain('name="viewport"');
    expect(page.html).toContain("<title>Deploy failures</title>");
    expect(page.html).toContain('<link rel="icon" href="data:image/svg+xml,');
    expect(page.html.indexOf('id="artifact-meta"')).toBeLessThan(page.html.indexOf("</head>"));
    expect(page.html.indexOf('id="artifact-data"')).toBeLessThan(page.html.indexOf("</head>"));
    expect(page.html.indexOf('id="artifact-runtime"')).toBeLessThan(page.html.indexOf("</body>"));
    expect(page.html).toContain('<body class="af-base">');
    expect(page.title).toBe("Deploy failures");
  });

  test("S2 a complete document is injected, not wrapped; its own CSP is kept", () => {
    const source =
      "<!DOCTYPE html><html><head><title>Mine</title></head><body><p>x</p></body></html>";
    const page = buildPage({ ...base, kind: "html", source });
    expect(count(page.html, "<html")).toBe(1);
    expect(count(page.html.toLowerCase(), "<!doctype")).toBe(1);
    expect(count(page.html, "<title>")).toBe(1);
    expect(page.title).toBe("Mine");
    expect(page.html).toMatch(/id="artifact-runtime">[\s\S]*<\/script>\s*<\/body>/);
    expect(count(page.html, "Content-Security-Policy")).toBe(1);

    const own = `<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'self'"></head><body></body></html>`;
    const kept = buildPage({ ...base, kind: "html", source: own });
    expect(count(kept.html, "Content-Security-Policy")).toBe(1);
    expect(kept.html).toContain(`content="default-src 'self'"`);
  });

  test("S3 Markdown renders to HTML with raw HTML escaped", () => {
    const source = [
      "# Plan A",
      "",
      "Some *text* with `code` and <b>raw</b>.",
      "",
      "- one",
      "- two",
      "",
      "```js",
      "if (a < b) {}",
      "```",
      "",
      "| k | v |",
      "| --- | ---: |",
      "| a | 1 |",
    ].join("\n");
    const page = buildPage({ ...base, kind: "md", source });
    expect(page.title).toBe("Plan A");
    expect(page.html).toContain('<h1 id="plan-a">Plan A</h1>');
    expect(page.html).toContain("<em>text</em>");
    expect(page.html).toContain("<code>code</code>");
    expect(page.html).toContain("&lt;b&gt;raw&lt;/b&gt;");
    expect(page.html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(page.html).toContain('<pre><code class="language-js">if (a &lt; b) {}</code></pre>');
    expect(page.html).toContain('<td style="text-align:right">1</td>');
  });

  test("S4 an island in the source is parsed and re-emitted once, escaped", () => {
    // In the source the author must already escape `<` (as a browser would require).
    const source = `<h1>Q</h1><script type="application/json" id="artifact-data">{"schema":"questions/v1","note":"\\u003c/script><b>"}</script>`;
    const page = buildPage({ ...base, kind: "html", source });
    expect(count(page.html, 'id="artifact-data"')).toBe(1);
    expect(page.island).toEqual({ schema: "questions/v1", note: "</script><b>" });
    expect(count(page.html, "</script>")).toBe(3); // meta, data, runtime — the value never closes one
    expect(island(page.html)).toEqual({ schema: "questions/v1", note: "</script><b>" });

    // A raw value handed in as the parameter is escaped on the way out.
    const param = buildPage({
      ...base,
      kind: "html",
      source: "<h1>Q</h1>",
      island: { note: "</script><b>" },
    });
    expect(count(param.html, "</script>")).toBe(3);
    expect(island(param.html)).toEqual({ note: "</script><b>" });

    const bad = `<h1>Q</h1><script type="application/json" id="artifact-data">{nope}</script>`;
    expect(() => buildPage({ ...base, kind: "html", source: bad })).toThrow(/artifact-data island/);
  });

  test("S5 the island parameter overrides the source's; null publishes none", () => {
    const source = `<h1>Q</h1><script type="application/json" id="artifact-data">{"a":1}</script>`;
    const overridden = buildPage({ ...base, kind: "html", source, island: { b: 2 } });
    expect(island(overridden.html)).toEqual({ b: 2 });
    expect(count(overridden.html, '"a":1')).toBe(0);
    const none = buildPage({ ...base, kind: "html", source, island: null });
    expect(none.island).toBeNull();
    expect(none.html).toContain('<script id="artifact-data" type="application/json"></script>');
  });

  test("S6 title precedence and the 8 KB title window", () => {
    const both = "<html><head><title>From title</title></head><body><h1>From h1</h1></body></html>";
    expect(buildPage({ ...base, kind: "html", source: both, title: "Param" }).title).toBe("Param");
    expect(buildPage({ ...base, kind: "html", source: both }).title).toBe("From title");
    expect(buildPage({ ...base, kind: "html", source: "<h1>From h1</h1>" }).title).toBe("From h1");
    expect(buildPage({ ...base, kind: "html", source: "<p>nothing</p>" }).title).toBe("demo");
    const late = `<html><head>${"<!-- x -->".repeat(1000)}<title>Late</title></head><body><h1>Early h1</h1></body></html>`;
    expect(buildPage({ ...base, kind: "html", source: late }).title).toBe("Early h1");
  });

  test("S7 a page over 16 MiB is refused", () => {
    const huge = `<p>${"x".repeat(16 * 1024 * 1024)}</p>`;
    expect(() => buildPage({ ...base, kind: "html", source: huge })).toThrow(/16 MiB/);
  });

  test("S8 the meta island names slug, version, and endpoint", () => {
    const page = buildPage({ ...base, kind: "html", source: "<h1>T</h1>" });
    expect(meta(page.html)).toEqual({ slug: "demo", version: 3, title: "T", endpoint: "/a/demo" });
  });

  test("S9 the runtime parses and carries no template literal", () => {
    expect(() => new Function(RUNTIME_SCRIPT)).not.toThrow();
    expect(RUNTIME_SCRIPT).not.toContain("`");
    expect(RUNTIME_SCRIPT).not.toContain("</script");
  });
});
