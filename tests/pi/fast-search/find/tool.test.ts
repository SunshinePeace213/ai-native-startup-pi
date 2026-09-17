// find — the fd-backed tool of .pi/extensions/fast-search.
//
// F1  a plain glob → fd gets --glob --hidden --exclude .git --case-sensitive and
//     --max-results one past the limit, the pattern behind --, then the path;
//     rows lose a `./` prefix and keep the trailing `/` on directories
// F2  each option maps to its fd flag: type, extension (dot tolerated), exclude,
//     ignoreCase, regex (no --glob), maxDepth, changedWithin, noIgnore;
//     hidden=false drops --hidden and the .git exclusion; a path inside .git keeps it
// F3  a glob containing `/` is matched on the full path with the `**/` prefix fd
//     needs; a rooted or `**/` glob and a regex are left as written; an empty
//     glob lists everything
// F4  outside a Git work tree fd gets --no-require-git; inside it does not
// F5  the row after the limit stops the run, the notice names the limit, and
//     details carry resultLimitReached
// F6  no output → "No files found" with no details
// F7  a non-zero exit with no rows throws fd's first stderr line; no fd on the
//     machine throws the install hint and never spawns

import { describe, expect, test } from "bun:test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { wire } from "../fixture";

describe("fast-search find", () => {
  test("F1 a plain glob spawns fd with the built-in defaults and tidy rows", async () => {
    const w = wire({ run: { stdout: ["./src/", "./src/a.ts"] } });
    const result = await w.run("find", { pattern: "*.ts", path: ".", limit: 10 });
    expect(w.requests[0]?.bin).toBe("fd");
    expect(w.requests[0]?.cwd).toBe(w.cwd);
    expect(w.lastArgs()).toEqual([
      "--color=never",
      "--max-results",
      "11",
      "--hidden",
      "--exclude",
      ".git",
      "--no-require-git",
      "--case-sensitive",
      "--glob",
      "--",
      "*.ts",
      ".",
    ]);
    expect(result.text).toBe("src/\nsrc/a.ts");
    expect(result.details).toBeUndefined();
  });

  test("F2 every option maps to its fd flag", async () => {
    const w = wire({ run: { stdout: [] } });
    await w.run("find", {
      pattern: "x",
      path: "@src",
      type: "file",
      extension: ".ts",
      exclude: "dist",
      ignoreCase: true,
      maxDepth: 2,
      changedWithin: "1d",
      noIgnore: true,
    });
    const args = w.lastArgs();
    const pair = (flag: string) => args[args.indexOf(flag) + 1];
    expect(pair("--type")).toBe("f");
    expect(pair("--extension")).toBe("ts");
    expect(pair("--exclude")).toBe(".git");
    expect(args.lastIndexOf("--exclude")).toBeGreaterThan(args.indexOf("--exclude"));
    expect(args[args.lastIndexOf("--exclude") + 1]).toBe("dist");
    expect(pair("--max-depth")).toBe("2");
    expect(pair("--changed-within")).toBe("1d");
    expect(args).toContain("--ignore-case");
    expect(args).not.toContain("--case-sensitive");
    expect(args).toContain("--no-ignore");
    expect(args.at(-1)).toBe("src");

    await w.run("find", { pattern: "x", type: "dir" });
    expect(w.lastArgs()).toContain("d");
    await w.run("find", { pattern: "x", type: "symlink" });
    expect(w.lastArgs()).toContain("l");
    await w.run("find", { pattern: "x", type: "any" });
    expect(w.lastArgs()).not.toContain("--type");

    await w.run("find", { pattern: "^a\\.", regex: true });
    expect(w.lastArgs()).not.toContain("--glob");

    await w.run("find", { pattern: "x", hidden: false });
    expect(w.lastArgs()).not.toContain("--hidden");
    expect(w.lastArgs()).not.toContain(".git");

    await w.run("find", { pattern: "*", path: ".git/hooks" });
    expect(w.lastArgs()).toContain("--hidden");
    expect(w.lastArgs()).not.toContain("--exclude");
  });

  test("F3 a glob with a slash matches the full path; rooted, `**/`, regex, and empty patterns are handled", async () => {
    const w = wire({ run: { stdout: [] } });
    const patternOf = () => {
      const args = w.lastArgs();
      return { full: args.includes("--full-path"), pattern: args[args.indexOf("--") + 1] };
    };
    await w.run("find", { pattern: "src/**/*.spec.ts" });
    expect(patternOf()).toEqual({ full: true, pattern: "**/src/**/*.spec.ts" });
    await w.run("find", { pattern: "**/x.ts" });
    expect(patternOf()).toEqual({ full: true, pattern: "**/x.ts" });
    await w.run("find", { pattern: "/abs/**" });
    expect(patternOf()).toEqual({ full: true, pattern: "/abs/**" });
    await w.run("find", { pattern: "src/.*\\.ts$", regex: true });
    expect(patternOf()).toEqual({ full: true, pattern: "src/.*\\.ts$" });
    await w.run("find", { pattern: "*.ts" });
    expect(patternOf()).toEqual({ full: false, pattern: "*.ts" });
    await w.run("find", { pattern: "  " });
    expect(patternOf()).toEqual({ full: false, pattern: "*" });
  });

  test("F4 --no-require-git only outside a Git work tree", async () => {
    const outside = wire({ run: { stdout: [] } });
    await outside.run("find", { pattern: "*" });
    expect(outside.lastArgs()).toContain("--no-require-git");

    const inside = wire({ run: { stdout: [] } });
    mkdirSync(join(inside.cwd, ".git"));
    mkdirSync(join(inside.cwd, "src"));
    await inside.run("find", { pattern: "*", path: "src" });
    expect(inside.lastArgs()).not.toContain("--no-require-git");
  });

  test("F5 the row after the limit stops the run and is reported", async () => {
    const w = wire({ run: { stdout: ["a", "b", "c"] } });
    const result = await w.run("find", { pattern: "*", limit: 2 });
    expect(result.text).toBe(
      "a\nb\n\n[2 results limit reached. Use limit=4 for more, or narrow the pattern]",
    );
    expect(result.details).toEqual({ resultLimitReached: 2 });
  });

  test("F6 nothing found is an empty result", async () => {
    const w = wire({ run: { stdout: [] } });
    const result = await w.run("find", { pattern: "*.nothing" });
    expect(result.text).toBe("No files found");
    expect(result.details).toBeUndefined();
  });

  test("F7 fd failures and a missing fd surface as errors, not empty results", async () => {
    const failed = wire({ run: { stdout: [], code: 1, stderr: "[fd error]: bad pattern\nmore" } });
    await expect(failed.run("find", { pattern: "[" })).rejects.toThrow("[fd error]: bad pattern");

    const missing = wire({ versions: { rg: "ripgrep 15.1.0" } });
    await expect(missing.run("find", { pattern: "*" })).rejects.toThrow(
      /fd.*sudo apt install fd-find/,
    );
    expect(missing.requests).toHaveLength(0);
  });
});
