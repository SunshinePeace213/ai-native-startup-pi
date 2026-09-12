// T1 existing tracked and non-ignored new paths → described, deterministic tree; absent paths disappear.
// T2 ignored, sensitive, external and symlinked paths → excluded; legitimate hidden project folders remain.
// T3 --write semantics → only the marked block changes, byte-idempotently; check/print never write.
// T4 malformed markers/config or a concurrent writer → refusal without document damage.
// T5 depth/collapse apply recursively; an empty projection is valid; unknown purposes are explicit.
import { describe, expect, test } from "bun:test";
import { mkdirSync, renameSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { architecture, capture, exec, findRoot } from "@ext/architecture-sync/tree";
import { CONFIG, DOCUMENT, fixture } from "../fixture";

describe("architecture tree", () => {
  test("T1 additions, tracked deletions and renames reflect the working tree without staging", async () => {
    const f = fixture();
    f.put("src/api/routes/new.ts");
    f.put("tests/new.test.ts");
    renameSync(join(f.root, "src/api/handler.ts"), join(f.root, "renamed.ts"));
    const staged = f.git("diff", "--cached", "--name-only");
    const first = await architecture(f.root, "write");
    expect(first.tree).toContain("routes/ — HTTP routes");
    expect(first.tree).toContain("tests/ — Verification");
    expect(f.git("diff", "--cached", "--name-only")).toBe(staged);
    renameSync(join(f.root, "src"), join(f.root, "elsewhere"));
    const next = await architecture(f.root, "write");
    expect(next.tree).not.toContain("src/");
    expect(next.tree).toContain("elsewhere/");
    expect(next.missingDescriptions).toContain("elsewhere");
  });

  test("T2 exclusions apply even to accidentally tracked secrets; symlinks are not traversed", async () => {
    const f = fixture();
    f.put("node_modules/leak/file.ts");
    f.put(".env", "DO NOT READ");
    f.put("llm-wiki/private/customer/file.md", "DO NOT READ");
    f.put(".pi/subagents/runtime/file.json");
    f.git("add", "-f", ".env", "node_modules", "llm-wiki/private", ".pi/subagents");
    const outside = fixture();
    symlinkSync(outside.root, join(f.root, "external"));
    const result = await capture(f.root);
    expect(result.tree).toContain(".pi/ — Pi resources");
    for (const name of ["node_modules", ".env", "private", "customer", "subagents", "external"])
      expect(result.tree).not.toContain(name);
  });

  test("T3 prose, CRLF and file mtime survive no-op writes; check and print do not repair", async () => {
    const f = fixture();
    f.put("ARCHITECTURE.md", DOCUMENT.replaceAll("\n", "\r\n"));
    const before = f.read();
    expect((await architecture(f.root, "check")).changed).toBe(true);
    await architecture(f.root, "print");
    expect(f.read()).toBe(before);
    await architecture(f.root, "write");
    const updated = f.read();
    expect(updated.split("<!-- architecture-tree:start -->")[0]).toBe(
      before.split("<!-- architecture-tree:start -->")[0],
    );
    expect(updated.split("<!-- architecture-tree:end -->")[1]).toBe(
      before.split("<!-- architecture-tree:end -->")[1],
    );
    const mtime = statSync(join(f.root, "ARCHITECTURE.md")).mtimeMs;
    expect((await architecture(f.root, "write")).changed).toBe(false);
    expect(f.read()).toBe(updated);
    expect(statSync(join(f.root, "ARCHITECTURE.md")).mtimeMs).toBe(mtime);
  });

  for (const [name, text] of [
    ["missing", "# Architecture\n"],
    ["duplicate", DOCUMENT + "<!-- architecture-tree:start -->\n"],
    ["reversed", "<!-- architecture-tree:end -->\n<!-- architecture-tree:start -->\n"],
    ["merge conflict", "<<<<<<< ours\n" + DOCUMENT],
  ] as const)
    test(`T4 ${name} markers refuse a write`, async () => {
      const f = fixture();
      f.put("ARCHITECTURE.md", text!);
      await expect(architecture(f.root, "write")).rejects.toThrow();
      expect(f.read()).toBe(text);
    });

  test("T4 symlinked document and held lock refuse a write", async () => {
    const f = fixture();
    const lock = f.git("rev-parse", "--git-path", "architecture-sync.lock").trim();
    mkdirSync(join(f.root, lock));
    await expect(architecture(f.root, "write")).rejects.toThrow("lock");
    expect(f.read()).toBe(DOCUMENT);
    const g = fixture();
    const target = join(g.root, "outside.md");
    renameSync(join(g.root, "ARCHITECTURE.md"), target);
    symlinkSync(target, join(g.root, "ARCHITECTURE.md"));
    await expect(architecture(g.root, "write")).rejects.toThrow("symlink");
    expect(g.read("outside.md")).toBe(DOCUMENT);
  });

  test("T4 invalid config fails without touching the document", async () => {
    const f = fixture();
    f.put(CONFIG, JSON.stringify({ name: "x", depth: 0, descriptions: {} }));
    await expect(architecture(f.root, "write")).rejects.toThrow();
    expect(f.read()).toBe(DOCUMENT);
  });

  test("T5 deep paths and collapsed archives; descriptions update from configuration", async () => {
    const f = fixture();
    f.put("src/api/routes/v1/handler.ts");
    f.put("llm-wiki/raw/articles/topic/source.md");
    let result = await capture(f.root);
    expect(result.tree).toContain("routes/ — HTTP routes");
    expect(result.tree).not.toContain("v1/");
    expect(result.tree).toContain("raw/ — Source archives");
    expect(result.tree).not.toContain("articles/");
    const config = JSON.parse(f.read(CONFIG));
    config.depth = 4;
    config.descriptions["src/api/routes/v1"] = "Version one API";
    writeFileSync(join(f.root, CONFIG), JSON.stringify(config));
    result = await architecture(f.root, "write");
    expect(result.tree).toContain("v1/ — Version one API");
  });

  test("T5 empty projection still renders and unknown descriptions are not invented", async () => {
    const f = fixture();
    // A valid Git repository with only ignored metadata has a root-only projection.
    f.git("rm", "--cached", "-r", "--quiet", ".");
    f.put(".gitignore", "*\n");
    const result = await capture(f.root);
    expect(result.tree).toBe("```text\nfixture/\n```");
    expect(result.missingDescriptions).toEqual([]);
  });

  test("T1 replacing a tracked directory with a file does not retain its old subtree", async () => {
    const f = fixture();
    renameSync(join(f.root, "src"), join(f.root, "moved"));
    f.put("src", "now a file\n");
    const result = await capture(f.root);
    expect(result.tree).not.toContain("src/");
    expect(result.tree).toContain("moved/");
  });

  test("T2/T5 unsafe names are omitted and prototype names get honest missing descriptions", async () => {
    const f = fixture();
    f.put("bad\nfolder/file.ts");
    f.put("constructor/file.ts");
    const result = await capture(f.root);
    expect(result.tree).not.toContain("bad");
    expect(result.tree).toContain("constructor/ — Purpose not documented yet");
    expect(result.tree).not.toContain("function");
    expect(result.missingDescriptions).toContain("constructor");
  });

  test("T4 cancelled writes release the lock and cooperating writers leave a valid map", async () => {
    const f = fixture();
    await expect(architecture(f.root, "write", undefined, () => false)).rejects.toThrow(
      "cancelled",
    );
    expect(f.read()).toBe(DOCUMENT);
    const results = await Promise.allSettled([
      architecture(f.root, "write"),
      architecture(f.root, "write"),
    ]);
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    for (const result of results)
      if (result.status === "rejected") expect(String(result.reason)).toContain("lock");
    expect((await architecture(f.root, "check")).changed).toBe(false);
    expect(f.read()).toContain("Keep this explanation.");
    expect(f.read()).toContain("Keep this ending.");
  });

  test("T4 truncated Git output cannot silently replace the tree with a partial inventory", async () => {
    const f = fixture();
    await expect(
      architecture(f.root, "write", async (command, args) =>
        args.includes("ls-files") ? "src/api/handler.ts" : exec(command, args),
      ),
    ).rejects.toThrow("Incomplete Git");
    expect(f.read()).toBe(DOCUMENT);
  });

  test("T1 nested cwd and a linked worktree resolve to their own checkout", async () => {
    const f = fixture();
    expect(await findRoot(join(f.root, "src/api"))).toBe(f.root);
    f.git(
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "--quiet",
      "-m",
      "fixture",
    );
    const worktree = `${f.root}-worktree`;
    f.git("worktree", "add", "--quiet", "-b", "test-worktree", worktree);
    await architecture(worktree, "write");
    expect(f.read()).toBe(DOCUMENT);
    expect(await findRoot(worktree)).toBe(worktree);
  });
});
