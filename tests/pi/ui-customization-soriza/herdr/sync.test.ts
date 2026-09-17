// Contract — Herdr chrome sync
//
// H1: a theme switch in TUI mode with Herdr present → Herdr's config.toml ends
//     with the managed block (`[theme]` naming the base, `[theme.custom]` with
//     every one of Herdr's nineteen tokens as hex), every other section is
//     carried through byte for byte, the first rewrite leaves the original
//     beside it as `config.toml.pi-backup`, and `herdr server reload-config`
//     is run so a running Herdr repaints.
// H2: an unmarked `[theme]` / `[theme.custom]` the user wrote → replaced, so
//     the file never declares the table twice; nothing else is lost.
// H3: syncing the theme the file already holds (session start, a second Pi
//     session) → the file is byte-identical and no reload is run.
// H4: a theme with no palette of its own (Pi's built-in `dark`) → the block
//     names Herdr's `terminal` theme and carries no `[theme.custom]`.
// H5: outside TUI mode, or without a Herdr config directory → nothing is
//     written or created and no reload is run.
// H6: a theme switched behind the extension's back (via /settings) → the next
//     agent_end rewrites the block; an unchanged theme leaves the file alone.
// H7: a reload that fails (no server, no binary) → the file is still written —
//     the next `herdr` launch reads it — and no error reaches the user.
// H8: the config path follows Herdr's own rules: HERDR_CONFIG_PATH, else
//     $XDG_CONFIG_HOME/herdr/config.toml, else ~/.config/herdr/config.toml.

import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import extension from "@ext/ui-customization-soriza/index";
import { HERDR_TOKENS } from "@ext/ui-customization-soriza/theme/herdr";
import { createFakePi, type ExecCall } from "@harness/fake-pi";
import { createUiCtx, tagTheme } from "../fixture";

const ROOT = join(import.meta.dir, "../../../..");
const THEMES = [
  { name: "dark" },
  { name: "tokyo-night", path: join(ROOT, ".pi/themes/tokyo-night.json") },
  { name: "nord", path: join(ROOT, ".pi/themes/nord.json") },
];

const USER_CONFIG = `onboarding = false
[ui]
agent_panel_sort = "priority"

[keys]
prefix = "ctrl+b"
`;

const HEX = /^#[0-9a-f]{6}$/;

interface Options {
  mode?: "tui" | "rpc";
  active?: string;
  /** The config.toml to start from; `null` = no Herdr directory at all. */
  config?: string | null;
  reloadExit?: number;
  env?: NodeJS.ProcessEnv;
}

async function start(options: Options = {}) {
  const dir = mkdtempSync(join(tmpdir(), "soriza-herdr-"));
  const herdrDir = join(dir, "herdr");
  const path = join(herdrDir, "config.toml");
  if (options.config !== null) {
    mkdirSync(herdrDir);
    writeFileSync(path, options.config ?? USER_CONFIG);
  }
  const reloads: ExecCall[] = [];
  const fake = createFakePi((call) => {
    if (call.command === "herdr" && call.args.join(" ") === "server reload-config") {
      reloads.push(call);
      return { stdout: "", stderr: "", code: options.reloadExit ?? 0 };
    }
    return { stdout: "", stderr: "", code: 1 };
  });
  const env = options.env ?? { HOME: dir, HERDR_CONFIG_PATH: path };
  extension(fake.pi, { env });
  const ui = createUiCtx({
    cwd: "/p",
    mode: options.mode,
    themes: THEMES,
    active: options.active ?? "nord",
  });
  await fake.emit("session_start", {}, ui.ctx);
  const read = () => (existsSync(path) ? readFileSync(path, "utf8") : undefined);
  return {
    fake,
    ui,
    dir,
    path,
    reloads,
    read,
    run: (args: string) => fake.commands.get("theme")!.handler(args, ui.ctx),
    done: () => rmSync(dir, { recursive: true, force: true }),
  };
}

type Table = Record<string, string | boolean>;

/** The `[theme]` and `[theme.custom]` tables of a config as key → value. */
function themeTables(toml: string): { theme: Table; custom?: Table } {
  const out: { theme: Table; custom?: Table } = { theme: {} };
  let table: Table | undefined;
  for (const raw of toml.split("\n")) {
    const line = raw.trim();
    if (line === "[theme]") table = out.theme;
    else if (line === "[theme.custom]") table = out.custom = {};
    else if (line.startsWith("[")) table = undefined;
    else if (table && !line.startsWith("#") && line.includes("=")) {
      const [key, value] = line.split("=", 2).map((s) => s.trim());
      table[key!] = JSON.parse(value!);
    }
  }
  return out;
}

describe("H1 a switch writes the block and reloads", () => {
  test("H1 tokyo-night lands as base + nineteen hex tokens, sections kept, backup taken, reload run", async () => {
    const s = await start();
    try {
      await s.run("tokyo-night");
      const toml = s.read()!;
      const { theme, custom } = themeTables(toml);
      expect(theme.name).toBe("tokyo-night");
      expect(theme.auto_switch).toBe(false);
      expect(Object.keys(custom!).sort()).toEqual([...HERDR_TOKENS].sort());
      for (const token of HERDR_TOKENS) expect(custom![token]).toMatch(HEX);
      expect(custom!.panel_bg).toBe("#1a1b26"); // the background the terminal gets via OSC 11
      expect(custom!.text).toBe("#ffffff"); // the foreground it gets via OSC 10
      expect(toml.startsWith(USER_CONFIG.trimEnd())).toBe(true);
      expect(readFileSync(`${s.path}.pi-backup`, "utf8")).toBe(USER_CONFIG);
      expect(s.reloads.length).toBeGreaterThanOrEqual(1);
    } finally {
      s.done();
    }
  });

  test("H1 a theme with no Herdr namesake still gets a full block on the nearest base", async () => {
    const s = await start({ active: "tokyo-night" });
    try {
      await s.run("nord");
      const { theme, custom } = themeTables(s.read()!);
      expect(theme.name).toBe("nord");
      expect(Object.keys(custom!)).toHaveLength(HERDR_TOKENS.length);
    } finally {
      s.done();
    }
  });
});

describe("H2 the user's own [theme] gives way", () => {
  const withUserTheme = `${USER_CONFIG}
[theme]
name = "catppuccin"
auto_switch = true

[theme.custom]
accent = "#ff0000"

[ui.toast]
delivery = "herdr"
`;

  test("H2 [theme] and [theme.custom] are replaced once; [ui.toast] after them survives", async () => {
    const s = await start({ config: withUserTheme });
    try {
      await s.run("tokyo-night");
      const toml = s.read()!;
      expect(toml.match(/^\[theme\]$/gm)).toHaveLength(1);
      expect(toml.match(/^\[theme\.custom\]$/gm)).toHaveLength(1);
      expect(toml).not.toContain('name = "catppuccin"');
      expect(toml).not.toContain("#ff0000");
      expect(toml).toContain('[ui.toast]\ndelivery = "herdr"');
      expect(toml).toContain('[keys]\nprefix = "ctrl+b"');
      expect(readFileSync(`${s.path}.pi-backup`, "utf8")).toBe(withUserTheme);
    } finally {
      s.done();
    }
  });
});

describe("H3 idempotence", () => {
  test("H3 session start on a file that already holds the theme writes nothing and runs no reload", async () => {
    const first = await start();
    try {
      await first.run("tokyo-night");
      const settled = first.read()!;
      const reloadsAfterSwitch = first.reloads.length;
      // a second Pi session in the same Herdr, same theme
      const fake = createFakePi((call) => {
        if (call.args.join(" ") === "server reload-config") first.reloads.push(call);
        return { stdout: "", stderr: "", code: 0 };
      });
      extension(fake.pi, { env: { HOME: first.dir, HERDR_CONFIG_PATH: first.path } });
      const ui = createUiCtx({ cwd: "/p", themes: THEMES, active: "tokyo-night" });
      await fake.emit("session_start", {}, ui.ctx);
      expect(first.read()).toBe(settled);
      expect(first.reloads).toHaveLength(reloadsAfterSwitch);
      expect(existsSync(`${first.path}.pi-backup`)).toBe(true);
    } finally {
      first.done();
    }
  });

  test("H3 switching to a different theme does write and reload", async () => {
    const s = await start({ active: "tokyo-night" });
    try {
      const before = s.read();
      const reloads = s.reloads.length;
      await s.run("nord");
      expect(s.read()).not.toBe(before);
      expect(s.reloads.length).toBe(reloads + 1);
    } finally {
      s.done();
    }
  });
});

describe("H4 themes without a palette", () => {
  test("H4 dark hands Herdr its terminal theme, no custom table", async () => {
    const s = await start();
    try {
      await s.run("dark");
      const { theme, custom } = themeTables(s.read()!);
      expect(theme.name).toBe("terminal");
      expect(custom).toBeUndefined();
    } finally {
      s.done();
    }
  });
});

describe("H5 guards", () => {
  test("H5 rpc mode never touches the file", async () => {
    const s = await start({ mode: "rpc" });
    try {
      await s.run("tokyo-night");
      expect(s.read()).toBe(USER_CONFIG);
      expect(s.reloads).toHaveLength(0);
    } finally {
      s.done();
    }
  });

  test("H5 no Herdr directory → nothing is created, no reload", async () => {
    const s = await start({ config: null });
    try {
      await s.run("tokyo-night");
      expect(existsSync(s.path)).toBe(false);
      expect(existsSync(join(s.dir, "herdr"))).toBe(false);
      expect(s.reloads).toHaveLength(0);
    } finally {
      s.done();
    }
  });
});

describe("H6 external switch", () => {
  test("H6 a theme changed via /settings is written on the next agent_end", async () => {
    const s = await start({ active: "tokyo-night" });
    try {
      s.ui.ctx.ui.setTheme(tagTheme("nord"));
      await s.fake.emit("agent_end", {}, s.ui.ctx);
      expect(themeTables(s.read()!).theme.name).toBe("nord");
    } finally {
      s.done();
    }
  });

  test("H6 an unchanged theme leaves the file alone", async () => {
    const s = await start({ active: "tokyo-night" });
    try {
      const settled = s.read();
      const reloads = s.reloads.length;
      await s.fake.emit("agent_end", {}, s.ui.ctx);
      expect(s.read()).toBe(settled);
      expect(s.reloads).toHaveLength(reloads);
    } finally {
      s.done();
    }
  });
});

describe("H7 reload failure", () => {
  test("H7 a failed reload keeps the written file and raises no error", async () => {
    const s = await start({ reloadExit: 1 });
    try {
      await s.run("tokyo-night");
      expect(themeTables(s.read()!).theme.name).toBe("tokyo-night");
      expect(s.ui.notifications.filter((n) => n.type === "error")).toHaveLength(0);
    } finally {
      s.done();
    }
  });
});

describe("H8 config path", () => {
  test("H8 XDG_CONFIG_HOME/herdr/config.toml when HERDR_CONFIG_PATH is unset", async () => {
    const xdg = mkdtempSync(join(tmpdir(), "soriza-xdg-"));
    try {
      mkdirSync(join(xdg, "herdr"));
      const s = await start({ env: { HOME: "/nowhere", XDG_CONFIG_HOME: xdg } });
      try {
        await s.run("tokyo-night");
        expect(existsSync(join(xdg, "herdr", "config.toml"))).toBe(true);
        expect(s.read()).toBe(USER_CONFIG); // the other candidate is untouched
      } finally {
        s.done();
      }
    } finally {
      rmSync(xdg, { recursive: true, force: true });
    }
  });

  test("H8 ~/.config/herdr/config.toml as the last resort", async () => {
    const home = mkdtempSync(join(tmpdir(), "soriza-home-"));
    try {
      mkdirSync(join(home, ".config", "herdr"), { recursive: true });
      const s = await start({ env: { HOME: home } });
      try {
        await s.run("tokyo-night");
        expect(existsSync(join(home, ".config", "herdr", "config.toml"))).toBe(true);
      } finally {
        s.done();
      }
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
