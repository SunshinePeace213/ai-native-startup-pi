// How the active theme announces itself: the footer status (`🎨 name` plus
// the theme's swatch, so the palette is visible without opening the picker)
// and the widget flashed under the editor after a switch. Both paint with the
// theme's own tokens, so they recolour with it.

import type { ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

export const THEME_STATUS_KEY = "soriza-theme";
export const SWATCH_WIDGET_KEY = "soriza-swatch";
export const THEME_ICON = "🎨";

const SWATCH_TOKENS = ["accent", "borderAccent", "success", "warning", "error", "muted"] as const;
const BLOCK = "██";

/** Six blocks in a theme's own accent / border / success / warning / error / muted. */
export function swatch(theme: Theme): string {
  return SWATCH_TOKENS.map((token) => theme.fg(token, BLOCK)).join(" ");
}

export function themeName(theme: Theme): string {
  return theme.name ?? "custom";
}

/** The status text: icon and name in accent, then the swatch. */
export function themeStatus(theme: Theme): string {
  return `${theme.fg("accent", `${THEME_ICON} ${themeName(theme)}`)}  ${swatch(theme)}`;
}

export function showThemeStatus(ctx: ExtensionContext): void {
  if (!ctx.hasUI) return;
  ctx.ui.setStatus(THEME_STATUS_KEY, themeStatus(ctx.ui.theme));
}

/** The widget flashed under the editor after a switch: name plus swatch in the new colours. */
export function swatchWidget(theme: Theme, width: number): string[] {
  const label = `${theme.fg("accent", THEME_ICON)} ${theme.bold(theme.fg("accent", themeName(theme)))}  ${swatch(theme)}`;
  const rule = theme.fg("borderMuted", "─".repeat(Math.max(0, width)));
  return [rule, truncateToWidth(`  ${label}`, width), rule];
}
