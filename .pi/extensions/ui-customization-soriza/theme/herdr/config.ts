// Herdr's config.toml, as far as the theme sync touches it: where the file
// lives (Herdr's own resolution order), the marked `[theme]` block the sync
// owns, and how that block is spliced in. Only the marked block and any
// pre-existing `[theme]` tables are replaced; every other section — keys,
// sidebar rows, sounds — is carried through byte for byte. TOML forbids a
// table declared twice, so an unmarked `[theme]` the user wrote cannot be
// left beside the managed one; the first splice backs the file up (see
// index.ts) before the user's block gives way.

import { join } from "node:path";
import { HERDR_TOKENS, type HerdrPalette } from "./palette";

export const BLOCK_START =
  "# >>> pi theme sync — managed by the ui-customization-soriza extension; rewritten on /theme >>>";
export const BLOCK_END = "# <<< pi theme sync <<<";

/**
 * Herdr's config path by Herdr's own rules: `HERDR_CONFIG_PATH`, else
 * `$XDG_CONFIG_HOME/herdr/config.toml`, else `~/.config/herdr/config.toml`.
 * Undefined on Windows, whose layout the sync does not know.
 */
export function herdrConfigPath(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string | undefined {
  if (env.HERDR_CONFIG_PATH) return env.HERDR_CONFIG_PATH;
  if (platform === "win32") return undefined;
  const home = env.HOME;
  if (env.XDG_CONFIG_HOME) return join(env.XDG_CONFIG_HOME, "herdr", "config.toml");
  return home ? join(home, ".config", "herdr", "config.toml") : undefined;
}

/**
 * The managed block: Herdr's base theme with every token overridden from the
 * palette, or — for a theme with no palette of its own, like Pi's built-in
 * `dark` — Herdr's `terminal` theme, which follows the host terminal the way
 * Pi's OSC reset hands the terminal its defaults back.
 */
export function renderThemeBlock(
  piTheme: string,
  base: string,
  palette: HerdrPalette | undefined,
): string {
  const lines = [BLOCK_START, `# Pi theme: ${piTheme}`, "[theme]"];
  if (!palette) {
    lines.push('name = "terminal"', "auto_switch = false", BLOCK_END);
    return lines.join("\n");
  }
  lines.push(`name = ${JSON.stringify(base)}`, "auto_switch = false", "", "[theme.custom]");
  for (const token of HERDR_TOKENS) lines.push(`${token} = ${JSON.stringify(palette[token])}`);
  lines.push(BLOCK_END);
  return lines.join("\n");
}

const HEADER = /^\s*\[\[?\s*([^\]]*?)\s*\]\]?/;

/**
 * `existing` with the managed block and every top-level `[theme…]` table
 * removed, and `block` appended. Idempotent: splicing the same block twice
 * yields the same text.
 */
export function spliceThemeBlock(existing: string, block: string): string {
  const kept: string[] = [];
  let inManaged = false;
  let inTheme = false;
  for (const line of existing.split("\n")) {
    if (line.trim() === BLOCK_START) {
      inManaged = true;
      continue;
    }
    if (inManaged) {
      if (line.trim() === BLOCK_END) inManaged = false;
      continue;
    }
    const header = HEADER.exec(line);
    if (header) {
      const key = header[1] ?? "";
      inTheme = key === "theme" || key.startsWith("theme.");
    }
    if (!inTheme) kept.push(line);
  }
  const body = kept.join("\n").replace(/\s+$/, "");
  return `${body ? `${body}\n\n` : ""}${block}\n`;
}
