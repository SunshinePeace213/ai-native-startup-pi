// A Herdr palette derived from a Pi theme. Herdr paints its chrome — sidebar,
// tab bar, pane borders, overlays, agent-state marks — from nineteen colour
// tokens; this maps each onto the Pi theme's *semantic* colours (text, muted,
// accent, border, success…) rather than its var names, since the twelve
// bundled files do not share a vocabulary. Three rules keep the result
// coherent across all of them:
//
//   • background and text are the colours Pi already gives the terminal, so the
//     pane and the chrome around it read as one surface;
//   • lines form a hierarchy: the focused frame takes Pi's own focused-border
//     colour and is the loudest; unfocused pane borders (Herdr's `overlay0`,
//     also its muted text) sit at a clear 3.5–5:1 against the background —
//     Pi's `border` ranges from invisible to neon across the set — and the
//     separators Herdr draws with `surface_dim` (the sidebar edge, the
//     Spaces/Agents divider, scrollbar tracks) take the same hue one step
//     quieter, so the sidebar is always visibly bounded;
//   • row surfaces are the background lifted toward the accent in four fixed
//     steps, so hover, active row, and navigate cursor stay distinguishable and
//     carry the theme's hue.

import {
  contrast,
  dimToContrast,
  fitContrast,
  isHex,
  mix,
  raiseToContrast,
  xterm256,
} from "./color";

export const HERDR_TOKENS = [
  "accent",
  "panel_bg",
  "sidebar_bg",
  "active_row_bg",
  "selection_bg",
  "surface0",
  "surface1",
  "surface_dim",
  "overlay0",
  "overlay1",
  "text",
  "subtext0",
  "mauve",
  "green",
  "yellow",
  "red",
  "blue",
  "teal",
  "peach",
] as const;

export type HerdrToken = (typeof HERDR_TOKENS)[number];
export type HerdrPalette = Record<HerdrToken, string>;

export interface PiThemeFile {
  name?: string;
  vars?: Record<string, unknown>;
  colors?: Record<string, unknown>;
}

/** Contrast band for unfocused borders and muted text against the background. */
export const BORDER_BAND = { min: 3.5, max: 5, target: 4 } as const;
/** Separator lines: the border hue, a step quieter than the borders. */
const SEPARATOR_TARGET = 2.6;
/** Secondary muted text sits a step above the border band. */
const OVERLAY1_TARGET = 5;
/** Dim labels must still be readable. */
const SUBTEXT_MIN = 5;
/** The focused frame and the accent must stand out from the background. */
const ACCENT_MIN = 3;
/** Labels (branch names) must read at body-text contrast. */
const LABEL_MIN = 4.5;
/** Row surfaces: how far the background moves toward the accent, and the least each step may stand out. */
const LADDER = {
  active_row_bg: { toward: 0.1, min: 1.2 },
  surface0: { toward: 0.14, min: 1.3 },
  selection_bg: { toward: 0.2, min: 1.5 },
  surface1: { toward: 0.28, min: 1.75 },
} as const;

/** Every colour token of a Pi theme file resolved to hex; indexes go through the 256-colour table, `""` and unknown vars are dropped. */
export function resolveColors(file: PiThemeFile): Record<string, string> {
  const vars = file.vars ?? {};
  const resolve = (value: unknown): string | undefined => {
    if (typeof value === "number") return xterm256(value);
    if (typeof value !== "string" || value === "") return undefined;
    if (isHex(value)) return value.toLowerCase();
    const named = vars[value];
    if (typeof named === "number") return xterm256(named);
    return isHex(named) ? named.toLowerCase() : undefined;
  };
  const out: Record<string, string> = {};
  for (const [token, value] of Object.entries(file.colors ?? {})) {
    const hex = resolve(value);
    if (hex) out[token] = hex;
  }
  return out;
}

/** Terminal background/foreground to build on, when the catalogue knows them. */
export interface TerminalColors {
  bg: string;
  fg: string;
}

/**
 * The Herdr palette for a Pi theme, or undefined when no background can be
 * found (Pi's built-in `dark`/`light` carry none — the terminal's own).
 */
export function herdrPalette(
  file: PiThemeFile,
  terminal?: TerminalColors,
): HerdrPalette | undefined {
  const colors = resolveColors(file);
  const ownBg = file.vars?.bg;
  const bg = terminal?.bg ?? (isHex(ownBg) ? ownBg.toLowerCase() : undefined);
  if (!bg) return undefined;

  const text = colors.text ?? terminal?.fg ?? "#ffffff";
  const accent = colors.accent ?? text;
  const focus = colors.borderAccent ?? accent;
  const border = colors.border ?? focus;
  const muted = colors.muted ?? colors.dim ?? mix(text, bg, 0.45);
  const success = colors.success ?? "#a6e3a1";
  const error = colors.error ?? "#f38ba8";
  const warning = colors.warning ?? "#f9e2af";

  const lift = (step: { toward: number; min: number }) =>
    raiseToContrast(bg, mix(bg, accent, step.toward), text, step.min);
  const inBand = contrast(border, bg) >= BORDER_BAND.min && contrast(border, bg) <= BORDER_BAND.max;
  const overlay0 = inBand
    ? border
    : contrast(border, bg) > BORDER_BAND.max
      ? dimToContrast(bg, border, BORDER_BAND.target)
      : raiseToContrast(bg, border, text, BORDER_BAND.target);

  return {
    panel_bg: bg,
    sidebar_bg: bg,
    surface_dim: dimToContrast(bg, overlay0, SEPARATOR_TARGET),
    active_row_bg: lift(LADDER.active_row_bg),
    surface0: lift(LADDER.surface0),
    selection_bg: lift(LADDER.selection_bg),
    surface1: lift(LADDER.surface1),
    text,
    subtext0: raiseToContrast(bg, muted, text, SUBTEXT_MIN),
    overlay0,
    overlay1: fitContrast(bg, muted, text, OVERLAY1_TARGET),
    accent: raiseToContrast(bg, focus, text, ACCENT_MIN),
    blue: raiseToContrast(bg, accent, text, ACCENT_MIN),
    teal: colors.mdLink ?? focus,
    mauve: raiseToContrast(
      bg,
      labelColor(colors, [error, success, accent], border),
      text,
      LABEL_MIN,
    ),
    green: success,
    red: error,
    yellow: warning,
    peach: mix(warning, error, 0.35),
  };
}

/**
 * Herdr's branch-label colour: the theme's keyword colour unless it would be
 * mistaken for a state colour, then its inline-code colour, then the border.
 */
function labelColor(colors: Record<string, string>, taken: string[], fallback: string): string {
  const distinct = (hex: string) => taken.every((other) => distance(hex, other) > 60);
  for (const candidate of [colors.syntaxKeyword, colors.mdCode]) {
    if (candidate && distinct(candidate)) return candidate;
  }
  return fallback;
}

function distance(a: string, b: string): number {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return Math.hypot(pa[0]! - pb[0]!, pa[1]! - pb[1]!, pa[2]! - pb[2]!);
}

/**
 * The Herdr built-in to layer the overrides on: the namesake where one exists,
 * else the nearest family. Every token is overridden, so this only decides
 * what a token Herdr adds later would default to.
 */
export function herdrBase(piTheme: string): string {
  return BASES[piTheme] ?? "catppuccin";
}

const BASES: Record<string, string> = {
  "tokyo-night": "tokyo-night",
  dracula: "dracula",
  nord: "nord",
  gruvbox: "gruvbox",
  "rose-pine": "rose-pine",
  "catppuccin-mocha": "catppuccin",
  cyberpunk: "vesper",
  synthwave: "dracula",
  "deep-purple": "dracula",
  everforest: "gruvbox",
  "midnight-ocean": "tokyo-night",
  "ocean-breeze": "tokyo-night",
};
