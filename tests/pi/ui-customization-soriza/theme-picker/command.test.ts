// Contract — /theme, the shortcuts, and what follows a switch
//
// T1: `/theme` (or alt+t) with themes available → a picker lists every
//     discovered theme, cursor on the active one, each row carrying a swatch
//     painted in that theme's own colours and the catalogue description.
// T2: moving the cursor previews the highlighted theme as an instance (nothing
//     persisted); Enter applies it by name (persisted).
// T3: Esc → the original theme instance is restored and nothing is persisted.
// T4: `/theme <name>` applies by name; an unknown name → an error notification
//     and no theme change.
// T5: no themes discoverable (RPC) → a warning, no picker, no theme change.
// C1: alt+= applies the next theme file, alt+- the previous, wrapping at both
//     ends, and raises no notification — the swatch widget of A1 is the only
//     feedback, so nothing repeats it. Pi's built-ins `dark` and
//     `light` are never cycled into: from one of them, forward lands on the
//     first file and backward on the last. With no theme files at all, the
//     built-ins are cycled instead of doing nothing.
// K1: the cycle is bound to alt+= / alt+- on every platform; on macOS
//     super+= / super+- (Cmd) are bound as well, to the same handlers.
// R1: the picker lists themes in Pi's own (alphabetical) order, except the
//     built-ins go last — identified by name, since Pi 0.85 gives them a
//     path into its package like any theme file.
// A1: after every successful switch the footer status carries the 🎨 icon and
//     the theme's name in accent followed by its swatch in the new theme's
//     colours, and a swatch widget in those colours sits below the editor;
//     shutdown clears the widget.

import { describe, expect, test } from "bun:test";
import extension from "@ext/ui-customization-soriza/index";
import { createFakePi } from "@harness/fake-pi";
import { createUiCtx, KEY, strip } from "../fixture";

// As Pi 0.85 lists them: the built-in carries a path into the Pi package like any file.
const THEMES = [
  {
    name: "dark",
    path: "/p/node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/dark.json",
  },
  { name: "tokyo-night", path: "/p/.pi/themes/tokyo-night.json" },
  { name: "nord", path: "/p/.pi/themes/nord.json" },
];

async function setup(options: { mode?: "tui" | "rpc"; active?: string } = {}) {
  const fake = createFakePi(() => ({ stdout: "", stderr: "", code: 1 }));
  extension(fake.pi);
  const ui = createUiCtx({
    cwd: "/p",
    mode: options.mode,
    themes: THEMES,
    active: options.active ?? "tokyo-night",
  });
  await fake.emit("session_start", {}, ui.ctx);
  const run = (args: string) => fake.commands.get("theme")!.handler(args, ui.ctx);
  const shortcut = (key: string) => fake.shortcuts.get(key)!.handler(ui.ctx);
  return { fake, ui, run, shortcut };
}

// The tag theme's markup counts as visible text (real themes emit zero-width
// ANSI), so the picker renders wide here to keep rows untruncated.
const pickerLines = (ui: ReturnType<typeof createUiCtx>) => ui.picker!.render(600);

describe("T1 open", () => {
  test("T1 /theme lists every theme, marks the active one, and paints each row in its own colours", async () => {
    const { ui, run } = await setup();
    const pending = run("");
    expect(ui.picker).toBeDefined();
    const lines = pickerLines(ui);
    const text = lines.map(strip).join("\n");
    for (const t of THEMES) expect(text).toContain(t.name);
    expect(text).toContain("Neon blue"); // catalogue description
    const darkRow = lines.find((l) => strip(l).includes("dark"))!;
    expect(strip(darkRow)).toContain("built-in"); // no catalogue entry, and not "custom" despite its path
    const nordRow = lines.find((l) => strip(l).includes("nord"))!;
    expect(nordRow).toContain("<accent:nord>██</accent:nord>");
    expect(nordRow).toContain("<error:nord>██</error:nord>");
    const activeRow = lines.find((l) => strip(l).includes("tokyo-night"))!;
    expect(strip(activeRow)).toMatch(/^→/);
    ui.press(KEY.esc);
    await pending;
  });

  test("T1 alt+t opens the same picker", async () => {
    const { ui, shortcut } = await setup();
    const pending = shortcut("alt+t");
    expect(ui.picker).toBeDefined();
    ui.press(KEY.esc);
    await pending;
  });
});

describe("T2 preview and apply", () => {
  test("T2 moving the cursor previews by instance; Enter applies by name", async () => {
    const { ui, run } = await setup();
    const pending = run("");
    ui.press(KEY.down); // tokyo-night → nord
    expect(ui.themeCalls).toEqual([{ kind: "instance", name: "nord" }]);
    ui.press(KEY.enter);
    await pending;
    expect(ui.themeCalls[ui.themeCalls.length - 1]).toEqual({ kind: "name", name: "nord" });
    expect(ui.ctx.ui.theme.name).toBe("nord");
  });

  test("T2 Enter without moving keeps the active theme and previews nothing", async () => {
    const { ui, run } = await setup();
    const pending = run("");
    ui.press(KEY.enter);
    await pending;
    expect(ui.themeCalls.filter((c) => c.kind === "instance")).toHaveLength(0);
    expect(ui.ctx.ui.theme.name).toBe("tokyo-night");
  });
});

describe("T3 cancel", () => {
  test("T3 Esc after previewing restores the original without persisting", async () => {
    const { ui, run } = await setup();
    const pending = run("");
    ui.press(KEY.down);
    ui.press(KEY.down); // wraps to dark
    ui.press(KEY.esc);
    await pending;
    expect(ui.ctx.ui.theme.name).toBe("tokyo-night");
    expect(ui.themeCalls.filter((c) => c.kind === "name")).toHaveLength(0);
    expect(ui.status.get("soriza-theme")).toContain("tokyo-night");
  });
});

describe("T4 direct", () => {
  test("T4 /theme nord applies by name", async () => {
    const { ui, run } = await setup();
    await run("nord");
    expect(ui.picker).toBeUndefined();
    expect(ui.themeCalls).toEqual([{ kind: "name", name: "nord" }]);
    expect(ui.notifications.at(-1)).toEqual({
      message: expect.stringContaining("nord"),
      type: "info",
    });
  });

  test("T4 /theme unknown → error, no change", async () => {
    const { ui, run } = await setup();
    await run("solarized");
    expect(ui.ctx.ui.theme.name).toBe("tokyo-night");
    expect(ui.notifications.at(-1)?.type).toBe("error");
    expect(ui.notifications.at(-1)?.message).toContain("solarized");
  });
});

describe("T5 no themes", () => {
  test("T5 rpc mode → warning, no picker, no change", async () => {
    const { ui, run } = await setup({ mode: "rpc" });
    await run("");
    expect(ui.picker).toBeUndefined();
    expect(ui.themeCalls).toHaveLength(0);
    expect(ui.notifications.at(-1)?.type).toBe("warning");
  });
});

describe("C1 cycle", () => {
  test("C1 alt+= steps forward and wraps over the files only; alt+- steps back", async () => {
    const { ui, shortcut } = await setup({ active: "nord" }); // last of the two files
    await shortcut("alt+=");
    expect(ui.ctx.ui.theme.name).toBe("tokyo-night"); // wrapped, skipping dark
    await shortcut("alt+-");
    expect(ui.ctx.ui.theme.name).toBe("nord");
    expect(ui.themeCalls.every((c) => c.kind === "name")).toBe(true);
    expect(ui.themeCalls.some((c) => c.name === "dark")).toBe(false);
  });

  test("C1 a cycle notifies nothing; the swatch widget carries the new theme", async () => {
    const { ui, shortcut } = await setup({ active: "nord" });
    await shortcut("alt+=");
    await shortcut("alt+-");
    expect(ui.notifications).toHaveLength(0);
    expect(strip(ui.widgets.get("soriza-swatch")!.join("\n"))).toContain("nord");
  });

  test.each([
    ["alt+=", "tokyo-night"],
    ["alt+-", "nord"],
  ])("C1 from a built-in, %s lands on %s", async (key, expected) => {
    const { ui, shortcut } = await setup({ active: "dark" });
    await shortcut(key);
    expect(ui.ctx.ui.theme.name).toBe(expected);
  });

  test("C1 rpc mode → warning, nothing applied", async () => {
    const { ui, shortcut } = await setup({ mode: "rpc" });
    await shortcut("alt+=");
    expect(ui.themeCalls).toHaveLength(0);
    expect(ui.notifications.at(-1)?.type).toBe("warning");
  });
});

describe("R1 order", () => {
  // As Pi lists them: alphabetical, and the built-ins carry a path into the Pi package.
  const PKG = "/p/node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme";
  const BOTH_BUILTINS = [
    { name: "dark", path: `${PKG}/dark.json` },
    { name: "light", path: `${PKG}/light.json` },
    { name: "nord", path: "/p/.pi/themes/nord.json" },
    { name: "tokyo-night", path: "/p/.pi/themes/tokyo-night.json" },
  ];

  test("R1 the picker lists theme files first and dark/light last", async () => {
    const fake = createFakePi(() => ({ stdout: "", stderr: "", code: 1 }));
    extension(fake.pi);
    const ui = createUiCtx({ cwd: "/p", themes: BOTH_BUILTINS, active: "tokyo-night" });
    await fake.emit("session_start", {}, ui.ctx);
    const pending = fake.commands.get("theme")!.handler("", ui.ctx);
    const names = pickerLines(ui)
      .map(strip)
      .map((l) => /^(?:→ |  )(\S+)/.exec(l)?.[1])
      .filter((n): n is string => !!n && BOTH_BUILTINS.some((t) => t.name === n));
    expect(names).toEqual(["nord", "tokyo-night", "dark", "light"]);
    ui.press(KEY.esc);
    await pending;
  });

  test("C1 with only the built-ins available, the cycle still moves", async () => {
    const fake = createFakePi(() => ({ stdout: "", stderr: "", code: 1 }));
    extension(fake.pi);
    const ui = createUiCtx({
      cwd: "/p",
      themes: [{ name: "dark" }, { name: "light" }],
      active: "dark",
    });
    await fake.emit("session_start", {}, ui.ctx);
    await fake.shortcuts.get("alt+=")!.handler(ui.ctx);
    expect(ui.ctx.ui.theme.name).toBe("light");
  });
});

describe("K1 keys", () => {
  function onPlatform(platform: NodeJS.Platform, body: () => void) {
    const original = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", { value: platform, configurable: true });
    try {
      body();
    } finally {
      Object.defineProperty(process, "platform", original);
    }
  }

  const registered = (platform: NodeJS.Platform) => {
    const fake = createFakePi(() => ({ stdout: "", stderr: "", code: 1 }));
    onPlatform(platform, () => extension(fake.pi));
    return fake;
  };

  test.each([["linux"], ["win32"]] as const)(
    "K1 %s binds alt+= / alt+- and no Cmd keys",
    (platform) => {
      const keys = [...registered(platform).shortcuts.keys()].sort();
      expect(keys).toEqual(["alt+-", "alt+=", "alt+t"]);
    },
  );

  test("K1 darwin binds Cmd alongside Alt, both directions reaching the same cycle", async () => {
    const fake = registered("darwin");
    expect([...fake.shortcuts.keys()].sort()).toEqual([
      "alt+-",
      "alt+=",
      "alt+t",
      "super+-",
      "super+=",
    ]);
    const ui = createUiCtx({ cwd: "/p", themes: THEMES, active: "tokyo-night" });
    await fake.emit("session_start", {}, ui.ctx);
    await fake.shortcuts.get("super+=")!.handler(ui.ctx);
    expect(ui.ctx.ui.theme.name).toBe("nord");
    await fake.shortcuts.get("super+-")!.handler(ui.ctx);
    expect(ui.ctx.ui.theme.name).toBe("tokyo-night");
  });
});

describe("A1 after a switch", () => {
  test("A1 status: 🎨 name in accent plus the swatch; a swatch widget below the editor", async () => {
    const { ui, run } = await setup();
    await run("nord");
    const status = ui.status.get("soriza-theme")!;
    expect(status).toContain("<accent:nord>🎨 nord</accent:nord>");
    expect(status).toContain("<success:nord>██</success:nord>");
    expect(status).toContain("<error:nord>██</error:nord>");
    const widget = ui.widgets.get("soriza-swatch")!;
    expect(widget).toBeDefined();
    const text = widget.join("\n");
    expect(strip(text)).toContain("nord");
    expect(text).toContain("<success:nord>██</success:nord>");
  });

  test("A1 a failed switch shows no widget", async () => {
    const { ui, run } = await setup();
    await run("solarized");
    expect(ui.widgets.has("soriza-swatch")).toBe(false);
  });

  test("A1 shutdown clears the widget", async () => {
    const { fake, ui, run } = await setup();
    await run("nord");
    await fake.emit("session_shutdown", {}, ui.ctx);
    expect(ui.widgets.get("soriza-swatch")).toBeUndefined();
  });
});
