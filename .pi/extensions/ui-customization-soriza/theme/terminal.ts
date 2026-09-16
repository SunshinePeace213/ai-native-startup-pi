// Terminal-side colour sync. A Pi theme cannot change the terminal's own
// default background/foreground, so on every switch the extension emits the
// OSC 11 (background) and OSC 10 (foreground) sequences for the theme, and
// OSC 111/110 to hand the defaults back when the theme has no entry or the
// session ends. Inside tmux the sequences are wrapped in a DCS passthrough,
// which still needs `allow-passthrough on` in tmux.conf.

import { readFileSync } from "node:fs";
import { CATALOG, type TerminalColors } from "./catalog";

const BEL = "\x07";

function passthrough(sequence: string, env: NodeJS.ProcessEnv): string {
  if (!env.TMUX) return sequence;
  return `\x1bPtmux;${sequence.replaceAll("\x1b", "\x1b\x1b")}\x1b\\`;
}

export function oscSet(colors: TerminalColors, env: NodeJS.ProcessEnv = process.env): string {
  return passthrough(`\x1b]11;${colors.bg}${BEL}\x1b]10;${colors.fg}${BEL}`, env);
}

export function oscReset(env: NodeJS.ProcessEnv = process.env): string {
  return passthrough(`\x1b]111${BEL}\x1b]110${BEL}`, env);
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Colours for a theme: the catalogue first, else the theme file's own `vars.bg` and text colour. */
export function terminalColorsFor(name: string, path?: string): TerminalColors | undefined {
  const entry = CATALOG.get(name);
  if (entry) return entry.terminal;
  if (!path) return undefined;
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as {
      vars?: Record<string, unknown>;
      colors?: Record<string, unknown>;
    };
    const vars = json.vars ?? {};
    const resolve = (value: unknown): string | undefined => {
      if (typeof value !== "string") return undefined;
      const hex = HEX.test(value) ? value : vars[value];
      return typeof hex === "string" && HEX.test(hex) ? hex : undefined;
    };
    const bg = resolve(vars.bg);
    if (!bg) return undefined;
    return { bg, fg: resolve(json.colors?.text) ?? "#ffffff" };
  } catch {
    return undefined;
  }
}
