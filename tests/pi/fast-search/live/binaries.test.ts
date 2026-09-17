// live — the real ripgrep and fd through the real runner and a real `--version`
// probe, on a scratch Git repository. Skipped where the binaries are absent;
// the scripted contracts beside this file still run there.
//
// L1  grep finds a match under a hidden directory and not under .git or an
//     ignored tree; rows are cwd-relative `path:line: text`
// L2  noIgnore reaches the ignored tree; hidden=false skips the hidden directory
// L3  find lists by glob and by extension, directories with a trailing `/`,
//     never .git; a limit stops the walk early with the notice
// L4  the runner stops a long stream at the limit instead of draining it
// L5  an aborted signal rejects the call

import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { type Deps, register } from "@ext/fast-search/index";
import { spawnRunner } from "@ext/fast-search/run";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi } from "@harness/fake-pi";
import { scriptedExec } from "@harness/scripted-exec";

const version = (bin: string) => {
  const result = spawnSync(bin, ["--version"], { encoding: "utf8" });
  return result.error || result.status !== 0 ? null : result.stdout;
};
const haveRg = version("rg") !== null;
const haveFd = version("fd") !== null || version("fdfind") !== null;

function repo() {
  const root = mkdtempSync(join(tmpdir(), "fast-search-live-"));
  const at = (rel: string) => join(root, rel);
  for (const dir of ["src", ".hidden", "ignored/deep", "src/sub"])
    mkdirSync(at(dir), { recursive: true });
  spawnSync("git", ["init", "-q", root]);
  writeFileSync(at(".gitignore"), "ignored\n");
  writeFileSync(at("src/a.ts"), "hello world\nsecond line\n");
  writeFileSync(at("src/sub/b.ts"), "no greeting\n");
  writeFileSync(at(".hidden/c.ts"), "hello hidden\n");
  writeFileSync(at("ignored/deep/d.ts"), "hello ignored\n");
  writeFileSync(at("README.md"), "hello readme\n");
  writeFileSync(at("many.txt"), Array.from({ length: 5000 }, (_, i) => `hello ${i}`).join("\n"));
  return root;
}

function live(cwd: string) {
  const deps: Deps = {
    runner: spawnRunner,
    probe: async (path) => version(path),
    managedBinDir: mkdtempSync(join(tmpdir(), "fast-search-live-managed-")),
  };
  const fake = createFakePi(scriptedExec({}));
  register(fake.pi, deps);
  const made = createCtx({ cwd });
  const run = async (
    name: "grep" | "find",
    params: Record<string, unknown>,
    signal?: AbortSignal,
  ) => {
    const tool = fake.tools.get(name);
    if (!tool) throw new Error(`${name} not registered`);
    const result = await tool.execute("call", params, signal, undefined, made.ctx);
    return result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
  };
  return { run };
}

describe.skipIf(!haveRg)("fast-search live ripgrep", () => {
  test("L1 hidden yes, .git and ignored no, rows relative", async () => {
    const { run } = live(repo());
    const text = await run("grep", { pattern: "hello", type: "ts" });
    const rows = text.split("\n").sort();
    expect(rows).toEqual([".hidden/c.ts:1: hello hidden", "src/a.ts:1: hello world"]);
  });

  test("L2 noIgnore and hidden=false change the walk", async () => {
    const { run } = live(repo());
    const ignored = await run("grep", { pattern: "hello ignored", noIgnore: true });
    expect(ignored).toBe("ignored/deep/d.ts:1: hello ignored");
    const visible = await run("grep", { pattern: "hello", hidden: false, mode: "files" });
    expect(visible.split("\n").sort()).toEqual(["README.md", "many.txt", "src/a.ts"]);
  });

  test("L4 a long stream is stopped at the limit", async () => {
    const { run } = live(repo());
    const text = await run("grep", { pattern: "hello", path: "many.txt", limit: 3 });
    expect(text).toBe(
      "many.txt:1: hello 0\nmany.txt:2: hello 1\nmany.txt:3: hello 2\n\n" +
        "[3 matches limit reached. Use limit=6 for more, or refine pattern]",
    );
  });

  test("L5 an aborted signal rejects", async () => {
    const { run } = live(repo());
    const controller = new AbortController();
    controller.abort();
    await expect(run("grep", { pattern: "hello" }, controller.signal)).rejects.toThrow(/aborted/);
  });
});

describe.skipIf(!haveFd)("fast-search live fd", () => {
  test("L3 glob, extension, directories, .git, and the limit", async () => {
    const { run } = live(repo());
    const byGlob = await run("find", { pattern: "*.ts" });
    expect(byGlob.split("\n").sort()).toEqual([".hidden/c.ts", "src/a.ts", "src/sub/b.ts"]);
    const byExtension = await run("find", { pattern: "*", extension: "md" });
    expect(byExtension).toBe("README.md");
    const dirs = await run("find", { pattern: "*", type: "dir", path: "." });
    expect(dirs.split("\n").sort()).toEqual([".hidden/", "src/", "src/sub/"]);
    const capped = await run("find", { pattern: "*", type: "file", limit: 2 });
    expect(capped.split("\n")).toHaveLength(4); // two rows, a blank, the notice
    expect(capped).toMatch(/\[2 results limit reached/);
  });
});
