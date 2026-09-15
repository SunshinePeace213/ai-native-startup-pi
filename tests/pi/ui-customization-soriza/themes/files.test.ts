// Contract — the bundled theme files in .pi/themes/
//
// G1: every file parses, carries every token Pi's schema requires, uses only
//     tokens the schema knows, and every value is a hex colour, a 256-colour
//     index, "", or a declared var.
// G2: the file stem, the theme name, and the catalogue entry agree: each of
//     disler's eleven and deep-purple has a file, and each file is catalogued
//     with terminal colours that are hex.
// G3: deep-purple follows the shared vocabulary of the set (the same var names
//     and token→var mapping shape as tokyo-night) so it reads as one family.

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CATALOG } from "@ext/ui-customization-soriza/catalog";

const ROOT = join(import.meta.dir, "../../../..");
const THEMES_DIR = join(ROOT, ".pi/themes");
const schema = JSON.parse(
  readFileSync(
    join(
      ROOT,
      "node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/theme-schema.json",
    ),
    "utf8",
  ),
) as { properties: { colors: { required: string[]; properties: Record<string, unknown> } } };

interface ThemeFile {
  name: string;
  vars?: Record<string, string | number>;
  colors: Record<string, string | number>;
}

const files = readdirSync(THEMES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => [f, JSON.parse(readFileSync(join(THEMES_DIR, f), "utf8")) as ThemeFile] as const);

const HEX = /^#[0-9a-f]{6}$/i;

describe("G1 validity", () => {
  test.each(files)("G1 %s is a complete, resolvable theme", (_file, theme) => {
    const tokens = Object.keys(theme.colors);
    for (const required of schema.properties.colors.required) expect(tokens).toContain(required);
    for (const token of tokens)
      expect(Object.keys(schema.properties.colors.properties)).toContain(token);
    const vars = theme.vars ?? {};
    for (const [token, value] of Object.entries(theme.colors)) {
      const ok =
        (typeof value === "number" && value >= 0 && value <= 255) ||
        value === "" ||
        (typeof value === "string" && (HEX.test(value) || value in vars));
      if (!ok)
        throw new Error(`${theme.name}.${token} = ${JSON.stringify(value)} is not a valid colour`);
    }
  });
});

describe("G2 catalogue", () => {
  const expected = [
    "tokyo-night",
    "midnight-ocean",
    "deep-purple",
    "catppuccin-mocha",
    "nord",
    "rose-pine",
    "gruvbox",
    "dracula",
    "everforest",
    "synthwave",
    "cyberpunk",
    "ocean-breeze",
  ];

  test("G2 the twelve themes exist as files named after themselves", () => {
    const stems = files.map(([f]) => f.replace(/\.json$/, "")).sort();
    expect(stems).toEqual([...expected].sort());
    for (const [file, theme] of files) expect(theme.name).toBe(file.replace(/\.json$/, ""));
  });

  test("G2 every file is catalogued with hex terminal colours, and nothing else is", () => {
    expect([...CATALOG.keys()].sort()).toEqual([...expected].sort());
    for (const [name, entry] of CATALOG) {
      expect(entry.terminal.bg).toMatch(HEX);
      expect(entry.terminal.fg).toMatch(HEX);
      expect(entry.description.length).toBeGreaterThan(0);
      const theme = files.find(([, t]) => t.name === name)![1];
      const bgVar = theme.vars?.bg ?? theme.vars?.deepBlue;
      expect(entry.terminal.bg).toBe(String(bgVar));
    }
  });
});

describe("G3 family", () => {
  test("G3 deep-purple shares tokyo-night's var vocabulary and mapping shape", () => {
    const tokyo = files.find(([f]) => f === "tokyo-night.json")![1];
    const purple = files.find(([f]) => f === "deep-purple.json")![1];
    expect(Object.keys(purple.colors)).toEqual(Object.keys(tokyo.colors));
    for (const key of [
      "bg",
      "surface",
      "fg",
      "fgSoft",
      "comment",
      "bgRed",
      "bgOrange",
      "bgSky",
      "bgCyan",
      "bgWarm",
      "bgPink",
    ]) {
      expect(purple.vars).toHaveProperty(key);
    }
    expect(purple.vars?.fg).toBe("#ffffff");
  });
});
