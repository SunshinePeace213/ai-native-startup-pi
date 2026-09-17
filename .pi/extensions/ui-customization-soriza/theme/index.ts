// The theme feature: `/theme` or alt+t opens a live-preview picker with a
// swatch per theme; `/theme <name>` applies directly; alt+= / alt+- cycle (on
// macOS also cmd+= / cmd+-, once the terminal's own font-size bindings are
// released). After every switch the footer status shows the theme with its
// swatch, a swatch widget flashes under the editor for three seconds, the
// terminal's own background/foreground follow the theme (OSC 11/10; reset at
// shutdown), and Herdr's chrome follows it too (herdr/: its config is
// rewritten and a running Herdr reloaded). Theme files live in .pi/themes/.

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { TuiHandle } from "../tui";
import { createHerdrSync, type HerdrSync } from "./herdr";
import { cycleTheme, openPicker, themeCommand } from "./picker";
import { showThemeStatus, SWATCH_WIDGET_KEY, swatchWidget, themeName } from "./status";
import { oscReset, oscSet, terminalColorsFor } from "./terminal";

export const SWATCH_MS = 3000;

export interface ThemeFeature {
  /** Announce the theme, sync the terminal and Herdr (TUI only). */
  start(ctx: ExtensionContext): Promise<void>;
  /** Catch a switch made behind the extension's back (via /settings). */
  afterAgent(ctx: ExtensionContext): Promise<void>;
  shutdown(ctx: ExtensionContext): void;
  /** Register /theme and the shortcuts. */
  register(): void;
}

/**
 * The cycle keys per platform. `alt+=` / `alt+-` everywhere (the `+` key is
 * `=`; no shift needed). macOS adds `super+=` / `super+-` — Cmd reaches Pi only
 * through the kitty keyboard protocol and only once the terminal's default
 * Cmd+= / Cmd+- font-size bindings are removed, so Alt stays bound alongside.
 */
export function cycleKeys(platform: NodeJS.Platform = process.platform): {
  next: Array<"alt+=" | "super+=">;
  previous: Array<"alt+-" | "super+-">;
} {
  if (platform === "darwin") return { next: ["super+=", "alt+="], previous: ["super+-", "alt+-"] };
  return { next: ["alt+="], previous: ["alt+-"] };
}

export function createThemeFeature(
  pi: ExtensionAPI,
  tui: TuiHandle,
  herdr: HerdrSync = createHerdrSync(pi),
): ThemeFeature {
  let syncedTheme: string | undefined;
  let swatchTimer: ReturnType<typeof setTimeout> | undefined;

  function syncTerminal(ctx: ExtensionContext): void {
    if (ctx.mode !== "tui") return;
    const name = themeName(ctx.ui.theme);
    const path = ctx.ui.getAllThemes().find((t) => t.name === name)?.path;
    const colors = terminalColorsFor(name, path);
    tui.write(colors ? oscSet(colors) : oscReset());
    syncedTheme = name;
  }

  function flashSwatch(ctx: ExtensionContext): void {
    if (ctx.mode !== "tui") return;
    if (swatchTimer) clearTimeout(swatchTimer);
    ctx.ui.setWidget(
      SWATCH_WIDGET_KEY,
      (_tui, theme) => ({ invalidate() {}, render: (width: number) => swatchWidget(theme, width) }),
      { placement: "belowEditor" },
    );
    swatchTimer = setTimeout(() => {
      swatchTimer = undefined;
      ctx.ui.setWidget(SWATCH_WIDGET_KEY, undefined);
    }, SWATCH_MS);
  }

  async function applied(ctx: ExtensionContext): Promise<void> {
    showThemeStatus(ctx);
    flashSwatch(ctx);
    syncTerminal(ctx);
    await herdr.sync(ctx);
  }

  return {
    async start(ctx) {
      if (ctx.mode === "tui") syncTerminal(ctx);
      showThemeStatus(ctx);
      await herdr.sync(ctx);
    },

    async afterAgent(ctx) {
      if (ctx.mode !== "tui") return;
      if (themeName(ctx.ui.theme) === syncedTheme) return;
      showThemeStatus(ctx);
      syncTerminal(ctx);
      await herdr.sync(ctx);
    },

    shutdown(ctx) {
      if (swatchTimer) {
        clearTimeout(swatchTimer);
        swatchTimer = undefined;
      }
      if (ctx.mode !== "tui") return;
      ctx.ui.setWidget(SWATCH_WIDGET_KEY, undefined);
      tui.write(oscReset());
    },

    register() {
      pi.registerCommand("theme", {
        description: "Pick a theme with live preview, or /theme <name>",
        handler: (args, ctx) => themeCommand(args, ctx, applied),
      });
      pi.registerShortcut("alt+t", {
        description: "Open the theme picker",
        handler: (ctx) => openPicker(ctx, applied),
      });
      const keys = cycleKeys();
      for (const key of keys.next) {
        pi.registerShortcut(key, {
          description: "Next theme",
          handler: (ctx) => cycleTheme(ctx, 1, applied),
        });
      }
      for (const key of keys.previous) {
        pi.registerShortcut(key, {
          description: "Previous theme",
          handler: (ctx) => cycleTheme(ctx, -1, applied),
        });
      }
    },
  };
}
