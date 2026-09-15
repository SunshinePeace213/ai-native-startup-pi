// ui-customization-soriza — the S/Z header, the theme picker, and terminal sync.
//
// Header: replaces Pi's startup header with the S/Z monogram (S in `accent`,
// Z in `muted`, so every theme recolours it) and a centred `owner/repo · branch`
// line. Installed on session_start in TUI mode only (setHeader is a no-op
// elsewhere); the repo line is probed asynchronously and re-probed after each
// agent run so a branch switch shows up. session_shutdown restores the
// built-in header.
//
// Themes: `/theme` or alt+t opens a live-preview picker with a swatch per theme;
// `/theme <name>` applies directly; alt+= / alt+- cycle (on macOS also cmd+= /
// cmd+-, once the terminal's own font-size bindings are released). After every switch the
// footer status shows the theme, a swatch flashes under the editor for three
// seconds, and the terminal's own background/foreground follow the theme
// (OSC 11/10; reset at shutdown). Theme files live in .pi/themes/.

import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { monogram } from "./logo";
import {
  cycleTheme,
  openPicker,
  showThemeStatus,
  SWATCH_WIDGET_KEY,
  swatchWidget,
  themeCommand,
  themeName,
} from "./picker";
import { equalRepo, probeRepo, type RepoInfo } from "./repo";
import { oscReset, oscSet, terminalColorsFor } from "./terminal";

export const SWATCH_MS = 3000;

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

function center(line: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - visibleWidth(line)) / 2));
  return truncateToWidth(" ".repeat(pad) + line, width);
}

function repoLine(theme: Theme, repo: RepoInfo): string {
  const slug = theme.bold(theme.fg("text", repo.slug));
  if (!repo.branch) return slug;
  return `${slug}${theme.fg("dim", " · ")}${theme.fg("success", repo.branch)}`;
}

export default function uiCustomizationSoriza(pi: ExtensionAPI) {
  let repo: RepoInfo | undefined;
  let requestRender: (() => void) | undefined;
  let terminalWrite: ((data: string) => void) | undefined;
  let syncedTheme: string | undefined;
  let swatchTimer: ReturnType<typeof setTimeout> | undefined;

  // ── header ────────────────────────────────────────────────────────────────

  async function refreshRepo(ctx: ExtensionContext): Promise<void> {
    const next = await probeRepo(ctx.cwd, (command, args, options) =>
      pi.exec(command, args, options),
    );
    if (repo && equalRepo(repo, next)) return;
    repo = next;
    requestRender?.();
  }

  function installHeader(ctx: ExtensionContext): void {
    ctx.ui.setHeader((tui, theme) => {
      requestRender = () => tui.requestRender();
      terminalWrite = (data) => tui.terminal.write(data);
      return {
        render(width: number): string[] {
          const logo = monogram({
            s: (text) => theme.fg("accent", text),
            z: (text) => theme.fg("muted", text),
          });
          const lines = ["", ...logo.map((l) => center(l, width)), ""];
          if (repo) lines.push(center(repoLine(theme, repo), width), "");
          return lines;
        },
        invalidate() {},
        dispose() {
          requestRender = undefined;
        },
      };
    });
  }

  // ── terminal + swatch ─────────────────────────────────────────────────────

  function write(data: string): void {
    (terminalWrite ?? ((d: string) => process.stdout.write(d)))(data);
  }

  function syncTerminal(ctx: ExtensionContext): void {
    if (ctx.mode !== "tui") return;
    const name = themeName(ctx.ui.theme);
    const path = ctx.ui.getAllThemes().find((t) => t.name === name)?.path;
    const colors = terminalColorsFor(name, path);
    write(colors ? oscSet(colors) : oscReset());
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

  function applied(ctx: ExtensionContext): void {
    showThemeStatus(ctx);
    flashSwatch(ctx);
    syncTerminal(ctx);
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode === "tui") {
      installHeader(ctx);
      syncTerminal(ctx);
      await refreshRepo(ctx);
    }
    showThemeStatus(ctx);
  });

  pi.on("agent_end", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    if (themeName(ctx.ui.theme) !== syncedTheme) {
      // switched through /settings, which the extension cannot observe directly
      showThemeStatus(ctx);
      syncTerminal(ctx);
    }
    await refreshRepo(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    if (swatchTimer) {
      clearTimeout(swatchTimer);
      swatchTimer = undefined;
    }
    if (ctx.mode !== "tui") return;
    ctx.ui.setWidget(SWATCH_WIDGET_KEY, undefined);
    ctx.ui.setHeader(undefined);
    write(oscReset());
  });

  // ── commands + shortcuts ──────────────────────────────────────────────────

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
}
