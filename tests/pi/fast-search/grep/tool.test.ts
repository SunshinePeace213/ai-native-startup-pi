// grep — the ripgrep-backed tool of .pi/extensions/fast-search.
//
// G1  a plain search → rg gets --json --line-number --hidden --glob !.git, the
//     pattern behind -e and the path behind --, run in the session cwd; rows are
//     `path:line: text` with a `./` prefix dropped
// G2  each option maps to its ripgrep flag; hidden=false drops --hidden and the
//     .git exclusion; a path inside .git keeps .git searchable; a leading `@` is
//     stripped from the path
// G3  mode 'files' and 'count' run --files-with-matches / --count and return the
//     plain rows
// G4  the (limit+1)th match stops the run, the notice names the limit and how to
//     widen it, details carry matchLimitReached, and the untaken match's leading
//     context is dropped while the last taken match keeps its trailing context
// G5  exit 1 → "No matches found" with no details
// G6  exit 2 with no rows → the tool throws ripgrep's first stderr line; exit 2
//     with rows → the rows plus a "ripgrep warned" notice
// G7  no ripgrep on the machine → the tool throws the install hint and never spawns
// G8  a line over 500 chars is cut, with the notice and details.linesTruncated
// G9  a pattern beginning with `-` still travels behind -e

import { describe, expect, test } from "bun:test";

import { wire } from "../fixture";

const match = (path: string, line: number, text: string) =>
  JSON.stringify({
    type: "match",
    data: { path: { text: path }, lines: { text: `${text}\n` }, line_number: line },
  });
const context = (path: string, line: number, text: string) =>
  JSON.stringify({
    type: "context",
    data: { path: { text: path }, lines: { text: `${text}\n` }, line_number: line },
  });
const begin = (path: string) => JSON.stringify({ type: "begin", data: { path: { text: path } } });
const summary = JSON.stringify({ type: "summary", data: {} });

describe("fast-search grep", () => {
  test("G1 a plain search spawns ripgrep in the cwd and formats rows like the built-in", async () => {
    const w = wire({
      run: { stdout: [begin("./src/a.ts"), match("./src/a.ts", 3, "hello world"), summary] },
    });
    const result = await w.run("grep", { pattern: "hello", path: "." });
    expect(w.requests[0]?.bin).toBe("rg");
    expect(w.requests[0]?.cwd).toBe(w.cwd);
    expect(w.lastArgs()).toEqual([
      "--color=never",
      "--json",
      "--line-number",
      "--hidden",
      "--glob",
      "!.git",
      "-e",
      "hello",
      "--",
      ".",
    ]);
    expect(result.text).toBe("src/a.ts:3: hello world");
    expect(result.details).toBeUndefined();
  });

  test("G2 every option maps to its ripgrep flag", async () => {
    const w = wire({ run: { stdout: [] } });
    await w.run("grep", {
      pattern: "x",
      path: "@src",
      glob: "*.ts",
      exclude: "*.test.ts",
      type: "ts",
      ignoreCase: true,
      literal: true,
      wordMatch: true,
      multiline: true,
      invert: true,
      context: 2,
      noIgnore: true,
      maxDepth: 3,
    });
    const args = w.lastArgs();
    for (const flag of [
      "--hidden",
      "--no-ignore",
      "--ignore-case",
      "--fixed-strings",
      "--word-regexp",
      "--multiline",
      "--invert-match",
    ]) {
      expect(args).toContain(flag);
    }
    const pair = (flag: string) => args[args.indexOf(flag) + 1];
    expect(pair("--context")).toBe("2");
    expect(pair("--type")).toBe("ts");
    expect(pair("--max-depth")).toBe("3");
    expect(args.filter((a) => a === "--glob").length).toBe(3); // !.git, *.ts, !*.test.ts
    expect(args).toContain("!*.test.ts");
    expect(args.at(-1)).toBe("src");

    await w.run("grep", { pattern: "x", hidden: false });
    expect(w.lastArgs()).not.toContain("--hidden");
    expect(w.lastArgs()).not.toContain("!.git");

    await w.run("grep", { pattern: "x", path: ".git/hooks" });
    expect(w.lastArgs()).toContain("--hidden");
    expect(w.lastArgs()).not.toContain("!.git");
  });

  test("G3 files and count modes use ripgrep's own listing flags", async () => {
    const w = wire({ run: { stdout: ["./src/a.ts", "./src/b.ts"] } });
    const files = await w.run("grep", { pattern: "x", mode: "files" });
    expect(w.lastArgs()).toContain("--files-with-matches");
    expect(w.lastArgs()).not.toContain("--json");
    expect(files.text).toBe("src/a.ts\nsrc/b.ts");

    const counted = wire({ run: { stdout: ["src/a.ts:4"] } });
    const count = await counted.run("grep", { pattern: "x", mode: "count", context: 3 });
    expect(counted.lastArgs()).toContain("--count");
    expect(counted.lastArgs()).not.toContain("--context");
    expect(count.text).toBe("src/a.ts:4");
  });

  test("G4 the match after the limit stops the run and trims the dangling context", async () => {
    const w = wire({
      run: {
        stdout: [
          context("a.ts", 1, "before"),
          match("a.ts", 2, "hit one"),
          context("a.ts", 3, "after"),
          context("b.ts", 9, "lead-in"),
          match("b.ts", 10, "hit two"),
          match("c.ts", 1, "never reached"),
        ],
      },
    });
    const result = await w.run("grep", { pattern: "hit", limit: 1, context: 1 });
    expect(result.text).toBe(
      "a.ts-1- before\na.ts:2: hit one\na.ts-3- after\n\n" +
        "[1 matches limit reached. Use limit=2 for more, or refine pattern]",
    );
    expect(result.details).toEqual({ matchLimitReached: 1 });

    const files = wire({ run: { stdout: ["a", "b", "c"] } });
    const listed = await files.run("grep", { pattern: "x", mode: "files", limit: 2 });
    expect(listed.text).toMatch(/^a\nb\n\n\[2 files limit reached/);
  });

  test("G5 exit 1 is an empty result, not an error", async () => {
    const w = wire({ run: { stdout: [], code: 1 } });
    const result = await w.run("grep", { pattern: "nothing" });
    expect(result.text).toBe("No matches found");
    expect(result.details).toBeUndefined();
  });

  test("G6 exit 2 throws when nothing was found and warns when something was", async () => {
    const failed = wire({ run: { stdout: [], code: 2, stderr: "rg: regex parse error:\n  (\n" } });
    await expect(failed.run("grep", { pattern: "(" })).rejects.toThrow("rg: regex parse error:");

    const partial = wire({
      run: { stdout: [match("a.ts", 1, "hit")], code: 2, stderr: "rg: secret/: Permission denied" },
    });
    const result = await partial.run("grep", { pattern: "hit" });
    expect(result.text).toBe("a.ts:1: hit\n\n[ripgrep warned: rg: secret/: Permission denied]");
  });

  test("G7 a missing ripgrep is reported with the install hint, never spawned", async () => {
    const w = wire({ versions: { fd: "fd 10.5.0" } });
    await expect(w.run("grep", { pattern: "x" })).rejects.toThrow(
      /ripgrep.*sudo apt install ripgrep/,
    );
    expect(w.requests).toHaveLength(0);
  });

  test("G8 an over-long line is cut and the result says so", async () => {
    const w = wire({ run: { stdout: [match("min.js", 1, "x".repeat(600))] } });
    const result = await w.run("grep", { pattern: "x" });
    expect(result.text).toMatch(/^min\.js:1: x{400,}/);
    expect(result.text).toMatch(/Some lines truncated to 500 chars/);
    expect(result.details).toMatchObject({ linesTruncated: true });
  });

  test("G9 a pattern that looks like a flag is passed as a pattern", async () => {
    const w = wire({ run: { stdout: [] } });
    await w.run("grep", { pattern: "--help", path: "-weird-dir" });
    const args = w.lastArgs();
    expect(args.slice(-4)).toEqual(["-e", "--help", "--", "-weird-dir"]);
  });
});
