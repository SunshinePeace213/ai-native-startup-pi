// Contract — terminal background/foreground sync
//
// O1: session_start in TUI mode with a catalogued theme active → the terminal
//     receives OSC 11 with that theme's background and OSC 10 with its foreground.
// O2: switching to a theme without catalogue colours and without a `bg` var
//     (the built-in dark) → the terminal receives the reset sequences (OSC 111/110).
// O3: a custom theme file outside the catalogue that declares `vars.bg` → its
//     own background is used, its resolved text colour as foreground.
// O4: session_shutdown → the reset sequences are written last.
// O5: outside TUI mode → nothing is ever written to the terminal.
// O6: a theme switched behind the extension's back (via /settings) → the next
//     agent_end re-syncs the terminal and the status.
// O7: inside tmux (TMUX set) → every sequence is wrapped in a DCS passthrough.

import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import extension from "@ext/ui-customization-soriza/index";
import { oscReset, oscSet } from "@ext/ui-customization-soriza/terminal";
import { createFakePi } from "@harness/fake-pi";
import { createUiCtx, tagTheme } from "../fixture";

const THEMES = [{ name: "dark" }, { name: "tokyo-night", path: "/p/.pi/themes/tokyo-night.json" }];

async function start(
  options: { mode?: "tui" | "rpc"; active?: string; themes?: typeof THEMES } = {},
) {
  const fake = createFakePi(() => ({ stdout: "", stderr: "", code: 1 }));
  extension(fake.pi);
  const ui = createUiCtx({
    cwd: "/p",
    mode: options.mode,
    themes: options.themes ?? THEMES,
    active: options.active ?? "tokyo-night",
  });
  await fake.emit("session_start", {}, ui.ctx);
  return { fake, ui, run: (args: string) => fake.commands.get("theme")!.handler(args, ui.ctx) };
}

const NO_TMUX = { ...process.env, TMUX: undefined };

describe("O1 set on start", () => {
  test("O1 tokyo-night's background and foreground reach the terminal", async () => {
    const { ui } = await start();
    expect(ui.writes).toHaveLength(1);
    expect(ui.writes[0]).toContain("\x1b]11;#1a1b26\x07");
    expect(ui.writes[0]).toContain("\x1b]10;#ffffff\x07");
  });
});

describe("O2 reset for uncatalogued themes", () => {
  test("O2 switching to dark resets the terminal defaults", async () => {
    const { ui, run } = await start();
    await run("dark");
    expect(ui.writes.at(-1)).toBe(oscReset(NO_TMUX));
  });
});

describe("O3 custom theme file", () => {
  test("O3 a theme with vars.bg outside the catalogue uses its own colours", async () => {
    const dir = mkdtempSync(join(tmpdir(), "soriza-terminal-"));
    try {
      const path = join(dir, "mine.json");
      writeFileSync(
        path,
        JSON.stringify({
          name: "mine",
          vars: { bg: "#123456", fg: "#abcdef" },
          colors: { text: "fg" },
        }),
      );
      const { ui, run } = await start({ themes: [...THEMES, { name: "mine", path }] });
      await run("mine");
      expect(ui.writes.at(-1)).toBe(oscSet({ bg: "#123456", fg: "#abcdef" }, NO_TMUX));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("O4 shutdown", () => {
  test("O4 the last write is the reset", async () => {
    const { fake, ui } = await start();
    await fake.emit("session_shutdown", {}, ui.ctx);
    expect(ui.writes.at(-1)).toBe(oscReset(NO_TMUX));
  });
});

describe("O5 mode guard", () => {
  test("O5 rpc mode writes nothing on start, switch, or shutdown", async () => {
    const { fake, ui, run } = await start({ mode: "rpc" });
    await run("dark");
    await fake.emit("session_shutdown", {}, ui.ctx);
    expect(ui.writes).toHaveLength(0);
  });
});

describe("O6 external switch", () => {
  test("O6 a theme changed via /settings is re-synced on the next agent_end", async () => {
    const { fake, ui } = await start();
    ui.ctx.ui.setTheme(tagTheme("dark")); // what /settings does, invisible to the extension
    ui.writes.length = 0;
    await fake.emit("agent_end", {}, ui.ctx);
    expect(ui.writes).toEqual([oscReset(NO_TMUX)]);
    expect(ui.status.get("soriza-theme")).toContain("dark");
  });

  test("O6 an unchanged theme is not re-sent", async () => {
    const { fake, ui } = await start();
    ui.writes.length = 0;
    await fake.emit("agent_end", {}, ui.ctx);
    expect(ui.writes).toHaveLength(0);
  });
});

describe("O7 tmux", () => {
  test("O7 sequences are wrapped in a DCS passthrough when TMUX is set", () => {
    const wrapped = oscSet(
      { bg: "#000000", fg: "#ffffff" },
      { TMUX: "/tmp/tmux-1000/default,1,0" },
    );
    expect(wrapped.startsWith("\x1bPtmux;")).toBe(true);
    expect(wrapped.endsWith("\x1b\\")).toBe(true);
    expect(wrapped).toContain("\x1b\x1b]11;#000000\x07");
    expect(oscReset({ TMUX: "x" })).toContain("\x1b\x1b]111\x07");
  });
});
