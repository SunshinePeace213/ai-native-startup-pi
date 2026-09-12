import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { bashTargets, denialFor, protectedPath, shellSplit, spaceBoundaries } from "./guard";

function scratchRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "llm-wiki-guard-"));
  mkdirSync(join(root, "llm-wiki", "states", "inbox"), { recursive: true });
  mkdirSync(join(root, "llm-wiki", "wiki", "concepts"), { recursive: true });
  mkdirSync(join(root, "llm-wiki", "raw", "notes"), { recursive: true });
  writeFileSync(join(root, "llm-wiki", "states", "claims.jsonl"), "");
  writeFileSync(join(root, "llm-wiki", "governance.json"), "{}");
  return root;
}

describe("denialFor", () => {
  test("ledgers and views belong to the engine", () => {
    expect(denialFor("llm-wiki/states/claims.jsonl")).toContain("state.py");
    expect(denialFor("llm-wiki/states/observations/src_1.jsonl")).toContain("state.py");
  });
  test("the inbox is the one open folder under states", () => {
    expect(denialFor("llm-wiki/states/inbox/agent-x.jsonl")).toBeNull();
  });
  test("shelf pages and the index belong to the renderer", () => {
    expect(denialFor("llm-wiki/wiki/concepts/claim.md")).toContain("render.py");
    expect(denialFor("llm-wiki/wiki/index.md")).toContain("render.py");
  });
  test("raw, log, schemas, retrieval, and evals stay open", () => {
    for (const rel of [
      "llm-wiki/raw/notes/x.md",
      "llm-wiki/wiki/log.md",
      "llm-wiki/schemas/claim.schema.json",
      "llm-wiki/retrieval/fusion_config.json",
      "llm-wiki/evals/retrieval_cases.jsonl",
      "docs/llm-wiki/state.md",
    ]) {
      expect(denialFor(rel)).toBeNull();
    }
  });
  test("the policy is the human's", () => {
    expect(denialFor("llm-wiki/governance.json")).toContain("write policy");
  });
});

describe("protectedPath", () => {
  test("resolves a relative path against cwd and a new file lexically", () => {
    const root = scratchRoot();
    expect(protectedPath("llm-wiki/states/claims.jsonl", root, root)).toContain("state.py");
    expect(protectedPath("llm-wiki/wiki/concepts/new-page.md", root, root)).toContain("render.py");
    expect(protectedPath("llm-wiki/raw/notes/new.md", root, root)).toBeNull();
  });
  test("a nested cwd still lands inside the project", () => {
    const root = scratchRoot();
    expect(protectedPath("../states/claims.jsonl", root, join(root, "llm-wiki", "wiki"))).toContain(
      "state.py",
    );
  });
  test("a symlink aimed at a protected file is caught through its real path", () => {
    const root = scratchRoot();
    symlinkSync(join(root, "llm-wiki", "states", "claims.jsonl"), join(root, "alias.jsonl"));
    expect(protectedPath("alias.jsonl", root, root)).toContain("state.py");
  });
  test("a path outside the project is not this guard's authority", () => {
    const root = scratchRoot();
    expect(protectedPath("/tmp/llm-wiki/states/claims.jsonl", root, root)).toBeNull();
    expect(protectedPath("", root, root)).toBeNull();
  });
});

describe("shell parsing", () => {
  test("spaceBoundaries exposes operators outside quotes only", () => {
    expect(spaceBoundaries("a>b")).toBe("a > b");
    expect(spaceBoundaries("a>>b;c")).toBe("a >> b ; c");
    expect(spaceBoundaries("echo '>' > f")).toBe("echo '>'  >  f");
    expect(spaceBoundaries("x\ny")).toBe("x ; y");
  });
  test("shellSplit honours quotes and escapes", () => {
    expect(shellSplit("a 'b c' \"d e\" f\\ g")).toEqual(["a", "b c", "d e", "f g"]);
    expect(shellSplit("unterminated 'quote")).toBeNull();
  });
});

describe("bashTargets", () => {
  test("redirections, glued and spaced", () => {
    expect(bashTargets("echo x > llm-wiki/states/claims.jsonl")).toEqual([
      "llm-wiki/states/claims.jsonl",
    ]);
    expect(bashTargets("echo x >>llm-wiki/wiki/log.md")).toEqual(["llm-wiki/wiki/log.md"]);
  });
  test("documented write verbs", () => {
    expect(bashTargets("tee llm-wiki/wiki/index.md")).toEqual(["llm-wiki/wiki/index.md"]);
    expect(bashTargets("cp a.md llm-wiki/wiki/concepts/a.md")).toEqual([
      "llm-wiki/wiki/concepts/a.md",
    ]);
    expect(bashTargets("sed -i s/a/b/ llm-wiki/states/sources.jsonl")).toEqual([
      "s/a/b/",
      "llm-wiki/states/sources.jsonl",
    ]);
    expect(bashTargets("dd if=x of=llm-wiki/states/snapshot.json")).toEqual([
      "llm-wiki/states/snapshot.json",
    ]);
    expect(bashTargets("mv old new")).toEqual(["old", "new"]);
  });
  test("reads and non-writing verbs yield nothing", () => {
    expect(bashTargets("cat llm-wiki/states/claims.jsonl")).toEqual([]);
    expect(bashTargets("cp llm-wiki/states/claims.jsonl /tmp/copy")).toEqual(["/tmp/copy"]);
    expect(bashTargets("sed s/a/b/ llm-wiki/states/claims.jsonl")).toEqual([]);
    expect(bashTargets("uv run scripts/llm-wiki/state.py apply f.jsonl")).toEqual([]);
  });
  test("a write verb keeps to its own simple command", () => {
    expect(bashTargets("cat a | tee b && rm c")).toEqual(["b", "c"]);
    // A quoted operator is a plain word; it lands as a harmless path token beside the real target.
    expect(bashTargets("echo '>' > f")).toEqual([">", "f"]);
  });
  test("a protected target inside a pipeline is found end to end", () => {
    const root = scratchRoot();
    const denial = bashTargets("cd x && echo 1 >> llm-wiki/states/claims.jsonl")
      .map((target) => protectedPath(target, root, root))
      .find(Boolean);
    expect(denial).toContain("state.py");
  });
});
