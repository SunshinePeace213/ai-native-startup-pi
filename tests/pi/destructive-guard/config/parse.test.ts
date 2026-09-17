// parseConfig / loadConfig / findWorkspace — the file and the boundary.
//
// C1  every field is optional; an absent file is the defaults with no warning
// C2  rule ids are checked against the catalog (and the two write rules); an unknown id
//     is dropped with a warning naming it; a deny-tier rule under allow or ask is listed
//     as softened
// C3  protectedRoots expand ~ and $HOME and resolve; artifacts are names
// C4  headless accepts only "deny" | "allow"; audit accepts a path or false; a wrong type
//     warns and keeps the default
// C5  invalid JSON, a non-object, or an unreadable file → defaults with a warning; never
//     throws
// C6  findWorkspace climbs to the nearest .git or .pi and falls back to the cwd itself

import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { findWorkspace, loadConfig, parseConfig } from "@ext/destructive-guard/config";
import { DEFAULT_CONFIG } from "@ext/destructive-guard/types";

const HOME = "/h";

describe("C1 defaults", () => {
  test("an empty object is the defaults", () => {
    expect(parseConfig("{}", HOME)).toEqual({ config: DEFAULT_CONFIG, warnings: [], softened: [] });
  });
  test("a missing file is the defaults, silently", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-config-"));
    expect(loadConfig(dir, HOME)).toEqual({ config: DEFAULT_CONFIG, warnings: [], softened: [] });
  });
});

describe("C2 rule ids", () => {
  test("known ids pass, unknown ones warn by name", () => {
    const { config, warnings } = parseConfig(
      '{ "allow": ["sudo", "nope"], "deny": ["git-clean-force"] }',
      HOME,
    );
    expect(config.allow).toEqual(["sudo"]);
    expect(config.deny).toEqual(["git-clean-force"]);
    expect(warnings).toEqual(['allow: no rule named "nope"']);
  });
  test("the write rules are known ids", () => {
    expect(parseConfig('{ "ask": ["write-system-file"] }', HOME).warnings).toEqual([]);
  });
  test("a deny-tier rule under allow or ask is softened", () => {
    const { softened } = parseConfig(
      '{ "allow": ["crontab-wipe", "sudo"], "ask": ["mkfs"] }',
      HOME,
    );
    expect(softened).toEqual(["crontab-wipe", "mkfs"]);
  });
  test("a non-list warns and is ignored", () => {
    const { config, warnings } = parseConfig('{ "allow": "sudo" }', HOME);
    expect(config.allow).toEqual([]);
    expect(warnings[0]).toContain("allow must be a list of strings");
  });
});

describe("C3 paths", () => {
  test("protectedRoots expand and resolve; artifacts are names", () => {
    const { config } = parseConfig(
      '{ "protectedRoots": ["~/data", "$HOME/x/../y", "/srv/db/"], "artifacts": ["out2"] }',
      HOME,
    );
    expect(config.protectedRoots).toEqual(["/h/data", "/h/y", "/srv/db"]);
    expect(config.artifacts).toEqual(["out2"]);
  });
});

describe("C4 headless and audit", () => {
  test.each([
    ['{ "headless": "allow" }', "allow", []],
    ['{ "headless": "deny" }', "deny", []],
    ['{ "headless": "yes" }', "deny", ["headless must be"]],
  ])("%s", (text, headless, warns) => {
    const { config, warnings } = parseConfig(text, HOME);
    expect(config.headless).toBe(headless as "allow" | "deny");
    for (const w of warns) expect(warnings.some((m) => m.includes(w))).toBe(true);
  });
  test("audit: a path, false, or a warning", () => {
    expect(parseConfig('{ "audit": "logs/g.jsonl" }', HOME).config.audit).toBe("logs/g.jsonl");
    expect(parseConfig('{ "audit": false }', HOME).config.audit).toBe(false);
    const wrong = parseConfig('{ "audit": 1 }', HOME);
    expect(wrong.config.audit).toBe(DEFAULT_CONFIG.audit);
    expect(wrong.warnings[0]).toContain("audit must be");
  });
});

describe("C5 malformed", () => {
  test.each(["{ not json", "[]", '"x"', "null"])("%s → defaults with a warning", (text) => {
    const { config, warnings } = parseConfig(text, HOME);
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warnings).toHaveLength(1);
  });
  test("an unreadable file → defaults with a warning", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-config-"));
    mkdirSync(join(dir, ".pi", "destructive-guard.json"), { recursive: true }); // a directory, not a file
    const { config, warnings } = loadConfig(dir, HOME);
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warnings[0]).toContain("could not read");
  });
});

describe("C6 findWorkspace", () => {
  test("climbs to .git or .pi, else the cwd", () => {
    const base = realpathSync(mkdtempSync(join(tmpdir(), "dg-ws-")));
    mkdirSync(join(base, "repo", ".git"), { recursive: true });
    mkdirSync(join(base, "repo", "a", "b"), { recursive: true });
    mkdirSync(join(base, "pi-only", ".pi", "x"), { recursive: true });
    mkdirSync(join(base, "bare"), { recursive: true });
    writeFileSync(join(base, "repo", "a", ".pi"), "not a dir");
    expect(findWorkspace(join(base, "repo", "a", "b"))).toBe(join(base, "repo"));
    expect(findWorkspace(join(base, "pi-only", ".pi", "x"))).toBe(join(base, "pi-only"));
    expect(findWorkspace(join(base, "bare"))).toBe(join(base, "bare"));
  });
});
