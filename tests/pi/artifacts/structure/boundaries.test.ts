// Contract — the layer boundary of .pi/extensions/artifacts, as a failing test
//
// B1: src/domain imports nothing outside src/domain
// B2: src/app imports only src/domain and itself
// B3: the pi side — src/ui, src/infra/client, src/infra/process, src/infra/config,
//     src/infra/log, index.ts — never imports the server's modules
//     (src/infra/http, src/infra/store/store, src/infra/render) or names Bun
// B4: only src/infra/http/server.ts names the Bun global
// B5: the two browser scripts — the page runtime and the viewer shell's — are
//     classic scripts the server hands over as they are: no import/export, and
//     they parse
// B6: every module under src/ is reachable from index.ts or src/server.ts
// B7: the browser layers, src/page and src/shell, hold only what a browser loads —
//     no TypeScript — and no module imports from them: they are served, never linked;
//     nothing the old page layer left behind is still in the tree

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../../../../.pi/extensions/artifacts");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sources = walk(ROOT).filter((f) => f.endsWith(".ts"));
const rel = (f: string) => relative(ROOT, f).split("\\").join("/");
const strip = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "");

function imports(file: string): string[] {
  const code = strip(readFileSync(file, "utf8"));
  const out: string[] = [];
  const re = /from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) out.push((m[1] ?? m[2]) as string);
  return out;
}

/** Resolves a relative import to a path inside the extension, or null for a package. */
function local(from: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.js`, join(base, "index.ts")]) {
    if (sources.includes(c)) return c;
  }
  return null;
}

const layerOf = (f: string) =>
  rel(f)
    .replace(/^src\//, "")
    .split("/")
    .slice(0, 2)
    .join("/");
const PI_SIDE = (f: string) =>
  rel(f) === "index.ts" ||
  ["ui", "infra/client", "infra/process", "infra/config.ts", "infra/log"].some((p) =>
    rel(f).startsWith(`src/${p}`),
  );
const SERVER_ONLY = (f: string) =>
  ["src/infra/http", "src/infra/store/store.ts", "src/infra/render", "src/server.ts"].some((p) =>
    rel(f).startsWith(p),
  );

describe("layer boundaries", () => {
  test("B1 domain imports nothing outside domain", () => {
    const bad = sources
      .filter((f) => rel(f).startsWith("src/domain/"))
      .flatMap((f) => imports(f).map((s) => [rel(f), s] as const))
      .filter(([, s]) => !s.startsWith(".") || /\.\.\/(app|infra|ui|page)/.test(s));
    expect(bad).toEqual([]);
  });

  test("B2 app imports only domain and app", () => {
    const bad = sources
      .filter((f) => rel(f).startsWith("src/app/"))
      .flatMap((f) => imports(f).map((s) => [rel(f), local(f, s)] as const))
      .filter(([, t]) => t !== null && !/^src\/(domain|app)\//.test(rel(t)));
    expect(bad).toEqual([]);
  });

  test("B3 the pi side never imports the server's modules", () => {
    const bad = sources
      .filter(PI_SIDE)
      .flatMap((f) => imports(f).map((s) => [rel(f), local(f, s)] as const))
      .filter(([, t]) => t !== null && SERVER_ONLY(t))
      .map(([f, t]) => `${f} → ${rel(t as string)}`);
    expect(bad).toEqual([]);
  });

  test("B4 only the HTTP server names Bun", () => {
    const naming = sources
      .filter((f) => /\bBun\b/.test(strip(readFileSync(f, "utf8"))))
      .map(rel)
      .sort();
    expect(naming).toEqual(["src/infra/http/server.ts"]);
  });

  test.each(["src/page/claude.js", "src/shell/shell.js"])("B5 %s is a classic script", (path) => {
    const code = readFileSync(join(ROOT, path), "utf8");
    expect(code).not.toMatch(/^\s*(import|export)\b/m);
    expect(() => new Function(code)).not.toThrow();
  });

  test("B6 every module is reachable from an entry point", () => {
    const seen = new Set<string>();
    const visit = (f: string) => {
      if (seen.has(f)) return;
      seen.add(f);
      for (const s of imports(f)) {
        const t = local(f, s);
        if (t) visit(t);
      }
    };
    visit(join(ROOT, "index.ts"));
    visit(join(ROOT, "src/server.ts"));
    const orphans = sources.filter((f) => !seen.has(f)).map(rel);
    expect(orphans).toEqual([]);
    expect(layerOf(join(ROOT, "src/ui/host.ts"))).toBe("ui/host.ts");
  });

  test("B7 the browser layers are served, never linked", () => {
    const browser = walk(ROOT)
      .map(rel)
      .filter((f) => /^src\/(page|shell)\//.test(f))
      .sort();
    expect(browser).toEqual(["src/page/claude.js", "src/shell/shell.css", "src/shell/shell.js"]);
    const linked = sources
      .flatMap((f) => imports(f).map((spec) => [rel(f), spec] as const))
      .filter(([, spec]) => /(^|\/)(page|shell)\/[^/]+\.(js|css)$/.test(spec));
    expect(linked).toEqual([]);
  });
});
