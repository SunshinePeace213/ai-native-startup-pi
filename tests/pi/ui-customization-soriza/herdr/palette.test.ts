// Contract — the Herdr palette derived from a Pi theme, over every bundled theme
//
// P1: panel_bg and sidebar_bg are the background the terminal receives (OSC 11)
//     and text is the foreground it receives (OSC 10) — pane and chrome share
//     one surface and one type colour.
// P2: overlay0 (unfocused borders, muted text) sits inside 3.5–5:1 against
//     panel_bg: a border Pi draws fainter is raised, a louder one dimmed, one
//     already in the band kept as the designer chose it.
// P3: the row surfaces rise strictly in contrast from panel_bg —
//     active_row_bg < surface0 < selection_bg < surface1 — with the active
//     row at least 1.2:1 and the navigate cursor at least 1.5:1, so hover,
//     active, and cursor rows stay tellable apart on every theme.
// P4: everything painted is legible: text ≥ 7:1; the label colours subtext0,
//     overlay1, mauve ≥ 4.5:1; the state marks green, yellow, red, peach ≥ 4:1
//     (they are Pi's own colours verbatim, see P5, painted as marks and short
//     labels); accent, blue, teal ≥ 3:1.
// P5: state colours are Pi's own: green is Pi's success, red its error,
//     yellow its warning — what Pi shows as an error is what Herdr marks as
//     blocked.
// P6: every token is a six-digit hex colour, the one form Herdr's parser and
//     Pi's schema both accept; a colour a theme names by 256-colour index
//     still resolves.
// P7: a theme with no background of its own (Pi's built-ins) yields no
//     palette.
// P8: the lines Herdr draws form a visible hierarchy: the separators it paints
//     with surface_dim (sidebar edge, section divider, scrollbar track) stand
//     at least 2.2:1 off panel_bg — above every row surface, so the sidebar
//     is always bounded — and below overlay0, which stays below accent, the
//     focused frame.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CATALOG } from "@ext/ui-customization-soriza/theme/catalog";
import {
  HERDR_TOKENS,
  herdrPalette,
  type HerdrPalette,
} from "@ext/ui-customization-soriza/theme/herdr";

const ROOT = join(import.meta.dir, "../../../..");
const HEX = /^#[0-9a-f]{6}$/;

interface ThemeFile {
  name: string;
  vars?: Record<string, string | number>;
  colors: Record<string, string | number>;
}

const bundled = [...CATALOG.entries()].map(([name, entry]) => {
  const file = JSON.parse(
    readFileSync(join(ROOT, ".pi/themes", `${name}.json`), "utf8"),
  ) as ThemeFile;
  return [name, file, entry.terminal, herdrPalette(file, entry.terminal)!] as const;
});

/** WCAG 2 contrast, written out here so a slip in the extension's own maths is caught. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** A theme file's colour token resolved the way Pi does, for comparing against the palette. */
function piColor(file: ThemeFile, token: string): string | undefined {
  const value = file.colors[token];
  if (typeof value !== "string") return undefined;
  return HEX.test(value) ? value : (file.vars?.[value] as string | undefined);
}

describe("P1 one surface", () => {
  test.each(bundled)(
    "P1 %s: chrome background and text are the terminal's",
    (_n, _f, terminal, p) => {
      expect(p.panel_bg).toBe(terminal.bg);
      expect(p.sidebar_bg).toBe(terminal.bg);
      expect(p.text).toBe(terminal.fg);
    },
  );
});

describe("P2 quiet borders", () => {
  test.each(bundled)("P2 %s: overlay0 within 3.5–5:1 of the background", (_n, _f, _t, p) => {
    const ratio = contrast(p.overlay0, p.panel_bg);
    expect(ratio).toBeGreaterThanOrEqual(3.5);
    expect(ratio).toBeLessThanOrEqual(5);
  });

  test("P2 catppuccin's near-invisible border is raised, not copied", () => {
    const [, file, , p] = bundled.find(([n]) => n === "catppuccin-mocha")!;
    expect(contrast(piColor(file, "border")!, p.panel_bg)).toBeLessThan(3.5);
    expect(p.overlay0).not.toBe(piColor(file, "border"));
  });

  test("P2 cyberpunk's neon border is dimmed, not copied", () => {
    const [, file, , p] = bundled.find(([n]) => n === "cyberpunk")!;
    expect(contrast(piColor(file, "border")!, p.panel_bg)).toBeGreaterThan(5);
    expect(p.overlay0).not.toBe(piColor(file, "border"));
  });

  test("P2 a border already in the band is kept as designed", () => {
    const p = herdrPalette({
      name: "quiet",
      vars: { bg: "#1a1b26" },
      colors: { text: "#ffffff", accent: "#7eaaff", border: "#7d84a6" },
    })!;
    expect(contrast("#7d84a6", "#1a1b26")).toBeGreaterThan(3.5);
    expect(contrast("#7d84a6", "#1a1b26")).toBeLessThan(5);
    expect(p.overlay0).toBe("#7d84a6");
  });
});

describe("P3 the surface ladder", () => {
  test.each(bundled)("P3 %s: surfaces rise strictly and clear their floors", (_n, _f, _t, p) => {
    const steps = ["active_row_bg", "surface0", "selection_bg", "surface1"] as const;
    const ratios = steps.map((s) => contrast(p[s], p.panel_bg));
    for (let i = 1; i < ratios.length; i += 1) expect(ratios[i]!).toBeGreaterThan(ratios[i - 1]!);
    expect(contrast(p.active_row_bg, p.panel_bg)).toBeGreaterThanOrEqual(1.2);
    expect(contrast(p.selection_bg, p.panel_bg)).toBeGreaterThanOrEqual(1.5);
  });
});

describe("P4 legibility", () => {
  const floors: Array<[keyof HerdrPalette, number]> = [
    ["text", 7],
    ["subtext0", 4.5],
    ["overlay1", 4.5],
    ["mauve", 4.5],
    ["green", 4],
    ["yellow", 4],
    ["red", 4],
    ["peach", 4],
    ["accent", 3],
    ["blue", 3],
    ["teal", 3],
  ];
  test.each(bundled)("P4 %s: every painted colour clears its floor", (_n, _f, _t, p) => {
    for (const [token, floor] of floors)
      expect(contrast(p[token], p.panel_bg), token).toBeGreaterThanOrEqual(floor);
  });
});

describe("P5 state colours are Pi's", () => {
  test.each(bundled)("P5 %s: success → green, error → red, warning → yellow", (_n, file, _t, p) => {
    expect(p.green).toBe(piColor(file, "success")!.toLowerCase());
    expect(p.red).toBe(piColor(file, "error")!.toLowerCase());
    expect(p.yellow).toBe(piColor(file, "warning")!.toLowerCase());
  });
});

describe("P6 forms Herdr accepts", () => {
  test.each(bundled)("P6 %s: nineteen six-digit hex tokens", (_n, _f, _t, p) => {
    expect(Object.keys(p).sort()).toEqual([...HERDR_TOKENS].sort());
    for (const token of HERDR_TOKENS) expect(p[token]).toMatch(HEX);
  });

  test("P6 a 256-colour index resolves to hex", () => {
    const p = herdrPalette({
      name: "indexed",
      vars: { bg: "#000000" },
      colors: { text: 231, muted: 244, border: 240 },
    })!;
    expect(p.text).toBe("#ffffff");
    expect(p.subtext0).toMatch(HEX);
    expect(p.overlay0).toMatch(HEX);
  });
});

describe("P8 line hierarchy", () => {
  test.each(bundled)(
    "P8 %s: surfaces < separators < pane borders < focused frame",
    (_n, _f, _t, p) => {
      const at = (token: keyof HerdrPalette) => contrast(p[token], p.panel_bg);
      expect(at("surface_dim")).toBeGreaterThanOrEqual(2.2);
      expect(at("surface_dim")).toBeGreaterThan(at("surface1"));
      expect(at("overlay0")).toBeGreaterThan(at("surface_dim"));
      expect(at("accent")).toBeGreaterThan(at("overlay0"));
    },
  );
});

describe("P7 no background, no palette", () => {
  test("P7 a theme without vars.bg and outside the catalogue yields nothing", () => {
    expect(herdrPalette({ name: "dark", colors: { text: "#ffffff" } })).toBeUndefined();
  });

  test("P7 a catalogued background is enough even when the file has none", () => {
    expect(
      herdrPalette({ name: "x", colors: {} }, { bg: "#101010", fg: "#eeeeee" })?.panel_bg,
    ).toBe("#101010");
  });
});
