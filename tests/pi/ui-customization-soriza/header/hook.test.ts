// Contract — the S/Z header
//
// H1: session_start in TUI mode → a header is installed; it renders the S/Z
//     monogram with S painted `accent`, Z painted `muted`, and S on top where
//     the letters overlap.
// H2: session_start outside TUI mode → no header is installed; the theme status
//     is still set (it lives in the footer, which RPC clients can read).
// H3: the repo line: an origin remote → `owner/repo · branch`; no remote → the
//     top-level folder · branch; not a repository → the cwd folder and no branch.
// H4: every rendered line fits the width it is given, even below the logo's width.
// H5: agent_end after a branch switch → the header re-renders with the new
//     branch and asks the TUI to redraw; an unchanged branch asks for nothing.
// H6: session_shutdown in TUI mode → the built-in header is restored; outside
//     TUI mode nothing is touched.
// H7: git failing in any way → the header still renders, with the cwd folder.

import { describe, expect, test } from "bun:test";
import extension from "@ext/ui-customization-soriza/index";
import { createFakePi, type ExecScript } from "@harness/fake-pi";
import { visibleWidth } from "@earendil-works/pi-tui";
import { createUiCtx, gitExec, strip } from "../fixture";

const CWD = "/home/someone/work/ai-native-startup-pi";
const REPO = {
  toplevel: CWD,
  origin: "git@github.com:SunshinePeace213/ai-native-startup-pi.git",
  head: "main",
};

async function start(exec: ExecScript, mode: "tui" | "rpc" | "print" = "tui") {
  const fake = createFakePi(exec);
  extension(fake.pi);
  const ui = createUiCtx({ cwd: CWD, mode });
  await fake.emit("session_start", {}, ui.ctx);
  return { fake, ui };
}

// The tag theme's markup is visible text (real themes emit zero-width ANSI), so
// content tests render wide; H4 alone exercises narrow widths on stripped lines.
const rendered = (ui: ReturnType<typeof createUiCtx>, width = 400) => ui.header!.render(width);

describe("H1 monogram", () => {
  test("H1 session_start in TUI installs a header painted from theme tokens", async () => {
    const { ui } = await start(gitExec(REPO));
    expect(ui.headers).toHaveLength(1);
    const lines = rendered(ui);
    const accent = lines.filter((l) => l.includes("<accent:dark>"));
    const muted = lines.filter((l) => l.includes("<muted:dark>"));
    expect(accent.length).toBeGreaterThanOrEqual(6); // S is six rows tall
    expect(muted.length).toBeGreaterThanOrEqual(6); // so is Z
    // The overlap rows carry both letters; S's cells come first (it is on top-left)
    const both = lines.filter((l) => l.includes("<accent:dark>") && l.includes("<muted:dark>"));
    expect(both.length).toBeGreaterThanOrEqual(3);
    for (const line of both) expect(line.indexOf("<accent:")).toBeLessThan(line.indexOf("<muted:"));
  });

  test("H1 no glyph is left unpainted", async () => {
    const { ui } = await start(gitExec(REPO));
    for (const line of rendered(ui)) {
      const outside = line
        .replace(/<(accent|muted):dark>[^<]*<\/\1:dark>/g, "")
        .replace(/<[^>]+>/g, "");
      expect(outside.trim()).toMatch(/^[\s·]*$|ai-native-startup-pi|main/);
    }
  });
});

describe("H2 mode guard", () => {
  test.each([["rpc"], ["print"]] as const)(
    "H2 %s mode installs no header but sets status",
    async (mode) => {
      const { ui } = await start(gitExec(REPO), mode);
      expect(ui.headers).toHaveLength(0);
      expect(ui.status.get("soriza-theme")).toContain("dark");
    },
  );

  test("H2 tui mode sets the status too", async () => {
    const { ui } = await start(gitExec(REPO));
    expect(ui.status.get("soriza-theme")).toContain("dark");
  });
});

describe("H3 repo line", () => {
  const cases: Array<[string, Parameters<typeof gitExec>[0], string, string | null]> = [
    ["origin ssh remote", REPO, "SunshinePeace213/ai-native-startup-pi", "main"],
    [
      "origin https remote",
      { ...REPO, origin: "https://github.com/acme/widgets.git" },
      "acme/widgets",
      "main",
    ],
    [
      "no remote → folder",
      { toplevel: "/srv/checkouts/harness", head: "feature/x" },
      "harness",
      "feature/x",
    ],
    [
      "detached HEAD",
      { ...REPO, head: "HEAD" },
      "SunshinePeace213/ai-native-startup-pi",
      "detached",
    ],
    ["not a repository → cwd folder, no branch", {}, "ai-native-startup-pi", null],
  ];
  test.each(cases)("H3 %s", async (_name, answers, slug, branch) => {
    const { ui } = await start(gitExec(answers));
    const text = rendered(ui).map(strip).join("\n");
    expect(text).toContain(slug);
    if (branch) expect(text).toContain(`${slug} · ${branch}`);
    else expect(text).not.toContain("·");
  });

  test("H3 the branch is painted success and the slug bold", async () => {
    const { ui } = await start(gitExec(REPO));
    const line = rendered(ui).find((l) => l.includes("<success:dark>"))!;
    expect(line).toContain("<success:dark>main</success:dark>");
    expect(line).toContain("<b><text:dark>SunshinePeace213/ai-native-startup-pi</text:dark></b>");
  });
});

describe("H4 width", () => {
  test.each([[120], [80], [40], [10]])("H4 every line fits width %d", async (width) => {
    const { ui } = await start(gitExec(REPO));
    for (const line of rendered(ui, width))
      expect(visibleWidth(strip(line))).toBeLessThanOrEqual(width);
  });

  test("H4 wide terminals centre the logo instead of left-aligning it", async () => {
    const { ui } = await start(gitExec(REPO));
    const first = strip(rendered(ui, 100).find((l) => l.includes("█"))!);
    expect(first.startsWith("   ")).toBe(true);
  });
});

describe("H5 branch refresh", () => {
  test("H5 a branch switch re-renders and requests a redraw", async () => {
    let head = "main";
    const { fake, ui } = await start(({ command, args }) =>
      gitExec({ ...REPO, head })({ command, args }),
    );
    const before = ui.renders;
    head = "feature/header";
    await fake.emit("agent_end", {}, ui.ctx);
    expect(ui.renders).toBe(before + 1);
    expect(rendered(ui).map(strip).join("\n")).toContain("· feature/header");
  });

  test("H5 an unchanged branch requests nothing", async () => {
    const { fake, ui } = await start(gitExec(REPO));
    const before = ui.renders;
    await fake.emit("agent_end", {}, ui.ctx);
    expect(ui.renders).toBe(before);
  });
});

describe("H6 shutdown", () => {
  test("H6 tui shutdown restores the built-in header", async () => {
    const { fake, ui } = await start(gitExec(REPO));
    await fake.emit("session_shutdown", {}, ui.ctx);
    expect(ui.headers[ui.headers.length - 1]).toBeUndefined();
    expect(ui.header).toBeUndefined();
  });

  test("H6 rpc shutdown touches no header", async () => {
    const { fake, ui } = await start(gitExec(REPO), "rpc");
    await fake.emit("session_shutdown", {}, ui.ctx);
    expect(ui.headers).toHaveLength(0);
  });
});

describe("H7 git failure", () => {
  const failures: Array<[string, ExecScript]> = [
    [
      "git missing (exec throws)",
      () => {
        throw new Error("spawn git ENOENT");
      },
    ],
    ["non-zero exit", () => ({ stdout: "", stderr: "fatal", code: 128 })],
    ["empty stdout", () => ({ stdout: "", stderr: "", code: 0 })],
  ];
  test.each(failures)("H7 %s still renders with the cwd folder", async (_name, exec) => {
    const { ui } = await start(exec);
    const text = rendered(ui).map(strip).join("\n");
    expect(text).toContain("█");
    expect(text).toContain("ai-native-startup-pi");
  });
});
