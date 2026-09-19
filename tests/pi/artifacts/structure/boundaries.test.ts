// The deployment boundary of .pi/extensions/artifacts as a contract. The
// layers are directories; a file in the wrong one would load Bun-only code
// into pi's Node process, which is the failure the layout exists to prevent.
//
// B1  session/, shared/, and index.ts import nothing from server/ or page/
// B2  shared/ imports only shared/ and node built-ins — never session/
// B3  no code outside server/ references the Bun global (comments aside)
// B4  page/runtime.js parses as a classic script and carries no `</script`
//     and no template literal, since the shell ships it inside a <script>
// B5  every TypeScript file in the extension is reachable from index.ts or
//     server/serve.ts — nothing is left orphaned by a move

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

const files = walk(ROOT);
const sources = files.filter((f) => f.endsWith(".ts"));
const rel = (f: string) => relative(ROOT, f);
const layer = (f: string) => rel(f).split("/")[0] as string;
const strip = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Relative import targets of a file, resolved to paths under the extension. */
function importsOf(file: string): string[] {
  const code = strip(readFileSync(file, "utf8"));
  const out: string[] = [];
  for (const m of code.matchAll(/from\s+"(\.[^"]+)"/g)) {
    out.push(resolve(dirname(file), m[1] as string));
  }
  return out;
}

describe("artifacts layout", () => {
  test("B1 the pi side never imports the server or the page", () => {
    const piSide = sources.filter((f) => ["session", "shared", "index.ts"].includes(layer(f)));
    const violations = piSide.flatMap((f) =>
      importsOf(f)
        .filter((t) => t.startsWith(join(ROOT, "server")) || t.startsWith(join(ROOT, "page")))
        .map((t) => `${rel(f)} → ${relative(ROOT, t)}`),
    );
    expect(violations).toEqual([]);
    expect(piSide.length).toBeGreaterThan(10);
  });

  test("B2 shared/ depends on nothing outside itself", () => {
    const shared = sources.filter((f) => layer(f) === "shared");
    const violations = shared.flatMap((f) =>
      importsOf(f)
        .filter((t) => !t.startsWith(join(ROOT, "shared")))
        .map((t) => `${rel(f)} → ${relative(ROOT, t)}`),
    );
    expect(violations).toEqual([]);
    expect(shared.length).toBeGreaterThan(3);
  });

  test("B3 only server/ code names the Bun global", () => {
    const offenders = sources
      .filter((f) => layer(f) !== "server")
      .filter((f) => /\bBun\b/.test(strip(readFileSync(f, "utf8"))))
      .map(rel);
    expect(offenders).toEqual([]);
    const users = sources
      .filter((f) => /\bBun\.serve\b/.test(strip(readFileSync(f, "utf8"))))
      .map(rel);
    expect(users).toEqual(["server/http.ts"]);
  });

  test("B4 the page runtime is a classic script the shell can inline", () => {
    const runtime = readFileSync(join(ROOT, "page/runtime.js"), "utf8");
    expect(() => new Function(runtime)).not.toThrow();
    expect(runtime).not.toContain("</script");
    expect(strip(runtime)).not.toContain("`");
    expect(runtime).not.toMatch(/^\s*(import|export)\s/m);
    const styles = readFileSync(join(ROOT, "page/styles.css"), "utf8");
    expect(styles).not.toContain("</style");
  });

  test("B5 every module is reachable from an entry point", () => {
    const seen = new Set<string>();
    const visit = (f: string) => {
      if (seen.has(f)) return;
      seen.add(f);
      for (const t of importsOf(f)) {
        const candidate = [t, `${t}.ts`, join(t, "index.ts")].find((c) => sources.includes(c));
        if (candidate) visit(candidate);
      }
    };
    visit(join(ROOT, "index.ts"));
    visit(join(ROOT, "server/serve.ts"));
    const orphans = sources.filter((f) => !seen.has(f)).map(rel);
    expect(orphans).toEqual([]);
  });
});
