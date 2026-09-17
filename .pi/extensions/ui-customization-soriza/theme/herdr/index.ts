// The Herdr side of a theme switch. Herdr — the terminal workspace Pi runs
// in — paints its own chrome from its config.toml and never forwards a pane's
// OSC colour sequences to the host terminal, so Pi's terminal sync recolours
// only Pi's pane. This module gives the chrome the same colours: on every
// switch (and once at start, idempotently) it derives Herdr's palette from
// the active theme, rewrites the managed `[theme]` block in Herdr's config,
// and asks a running Herdr to reload, which repaints every attached client.
// Herdr keeps that config per user, so any later `herdr` launch on the
// machine comes up in the same theme. Nothing happens outside TUI mode or on
// a machine without Herdr; a failed reload (no server running) is not an
// error — the file is what the next launch reads.

import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { CATALOG } from "../catalog";
import { themeName } from "../status";
import { herdrConfigPath, renderThemeBlock, spliceThemeBlock } from "./config";
import { herdrBase, herdrPalette, type PiThemeFile } from "./palette";

export { BLOCK_END, BLOCK_START, herdrConfigPath } from "./config";
export { HERDR_TOKENS, herdrBase, herdrPalette, type HerdrPalette } from "./palette";

/** The one-time copy of config.toml taken before the sync first rewrites it. */
export const BACKUP_SUFFIX = ".pi-backup";

export type HerdrSyncResult =
  | { status: "skipped"; reason: "not-tui" | "no-herdr" | "unchanged" }
  | { status: "written"; path: string; reloaded: boolean };

export interface HerdrSync {
  /** Bring Herdr's config (and a running Herdr) to the active theme. */
  sync(ctx: ExtensionContext): Promise<HerdrSyncResult>;
}

/** The managed block for a theme, from its file on disk and the catalogue. */
export function themeBlock(name: string, path: string | undefined): string {
  let file: PiThemeFile = {};
  if (path) {
    try {
      file = JSON.parse(readFileSync(path, "utf8")) as PiThemeFile;
    } catch {
      file = {};
    }
  }
  return renderThemeBlock(name, herdrBase(name), herdrPalette(file, CATALOG.get(name)?.terminal));
}

export function createHerdrSync(pi: ExtensionAPI, env: NodeJS.ProcessEnv = process.env): HerdrSync {
  return {
    async sync(ctx) {
      if (ctx.mode !== "tui") return { status: "skipped", reason: "not-tui" };
      const path = herdrConfigPath(env);
      if (!path || !existsSync(dirname(path))) return { status: "skipped", reason: "no-herdr" };

      const name = themeName(ctx.ui.theme);
      const block = themeBlock(name, ctx.ui.getAllThemes().find((t) => t.name === name)?.path);
      const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
      const next = spliceThemeBlock(existing, block);
      if (next === existing) return { status: "skipped", reason: "unchanged" };

      if (existing && !existsSync(path + BACKUP_SUFFIX)) copyFileSync(path, path + BACKUP_SUFFIX);
      const staging = `${path}.pi-${process.pid}.tmp`;
      writeFileSync(staging, next);
      renameSync(staging, path);

      let reloaded = false;
      try {
        const result = await pi.exec(env.HERDR_BIN_PATH || "herdr", ["server", "reload-config"], {
          timeout: 5000,
        });
        reloaded = result.code === 0;
      } catch {
        reloaded = false;
      }
      return { status: "written", path, reloaded };
    },
  };
}
