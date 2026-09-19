// Contract — the document shell (src/infra/render/shell.ts)
//
// R1: a fragment that brings its own <style> is served on a blank ground: the body
//     is `af-ground` (margin, ground, ink and face only, at zero specificity so the
//     page's own `body` rule paints over it), nothing wraps the source,
//     and the stylesheet has no element rule that is loose or hangs off the ground,
//     so none can outrank the page's own
// R2: a bare fragment and a Markdown file get the base look: `af-base`, wrapped in
//     the 860px column
// R3: a full document is injected into, never wrapped, and carries neither class

import { describe, expect, test } from "bun:test";

import { buildPage, RUNTIME_STYLES } from "@ext/artifacts/src/infra/render/shell";

const build = (source: string, kind: "html" | "md" = "html") =>
  buildPage({ source, kind, slug: "p", version: 1, endpoint: "/a/p" }).html;
const bodyTag = (html: string) => /<body[^>]*>/.exec(html)?.[0];

describe("R1 a styled fragment owns its design", () => {
  test("R1 blank ground, no wrapper", () => {
    const html = build("<style>h1 { font-size: 3rem }</style><h1>Beaufort</h1>");
    expect(bodyTag(html)).toBe('<body class="af-ground">');
    expect(html).not.toContain('class="af-wrap"');
  });
  test("R1 the ground styles no element: every base element rule hangs off .af-base", () => {
    const selectors = RUNTIME_STYLES.replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@media[^{]*\{/g, "")
      .split("}")
      .map((rule) => rule.split("{")[0]?.trim() ?? "")
      .filter(Boolean)
      .flatMap((list) => list.split(",").map((s) => s.trim()));
    // zero specificity: the page's own `body { background … }` must win over the ground
    const ground = selectors.filter((s) => s.includes(".af-ground"));
    expect(ground).toEqual([":where(.af-ground)"]);
    // a rule that styles a bare element (h1, p, table…) is scoped to the base look or
    // to the runtime's own controls, never loose and never under the ground
    const bare = selectors.filter((sel) =>
      /(^|\s)(h[1-6]|p|ul|ol|a|code|pre|table|th|td|hr|blockquote)\b/.test(sel),
    );
    expect(bare.some((sel) => sel.startsWith(".af-base "))).toBe(true);
    expect(bare.filter((sel) => !sel.startsWith(".af-") || sel.startsWith(".af-ground"))).toEqual(
      [],
    );
  });
});

describe("R2 the base look", () => {
  test("R2 a bare fragment and Markdown are wrapped in the base column", () => {
    const fragment = build("<h1>Plan</h1><p>body</p>");
    expect(bodyTag(fragment)).toBe('<body class="af-base">');
    expect(fragment).toContain('<div class="af-wrap"><h1>Plan</h1>');
    const md = build("# Plan\n\nbody", "md");
    expect(bodyTag(md)).toBe('<body class="af-base">');
    expect(md).toContain('<main class="af-md">');
  });
});

describe("R3 a full document", () => {
  test("R3 injected into, not wrapped", () => {
    const html = build("<html><head><title>T</title></head><body><h1>x</h1></body></html>");
    expect(bodyTag(html)).toBe("<body>");
    expect(html).not.toContain('class="af-wrap"');
    expect(html).toContain('id="artifact-runtime"');
  });
});
