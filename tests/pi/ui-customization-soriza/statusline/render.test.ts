// Contract — the statusline's lines from a snapshot (pure)
//
// R1: every line fits the width it is given, at every width; as the width
//     shrinks, bars go before numbers and the least important segment goes
//     before the more important — the cwd, the context figure, and the
//     active 5h window are never dropped.
// R2: the where line carries cwd, branch with its dirty marks (✓ clean, else
//     +staged ~modified ?untracked ⇡ahead ⇣behind), the session name, the
//     model with its thinking level, the clock and the elapsed time; Pi's own
//     branch stands in when the probe has nothing, and a session with no name
//     shows no 🔖.
// R3: the session line carries the context bar and percentage in Pi's own
//     thresholds (warning above 70, error above 90), the used/window figures,
//     `auto` only when auto-compaction is on, tokens in and out, the latest
//     cache-hit rate (warning below 50 %), and the cost with `sub` only on a
//     subscription and a burn rate only once a minute has elapsed; an unknown
//     context (after compaction) shows — rather than 0.
// R4: the quota line puts the active provider first with bars and countdowns,
//     the per-model weekly windows in parentheses with the one gating the
//     active model highlighted and the rest dim, and every other provider
//     after it without bars; no quota at all → no quota line.
// R5: a failed poll keeps the last values and marks them, after the numbers,
//     ⚠️ stale with their age; a re-login need shows 🔒; a first fetch still
//     pending shows …; values older than the idle poll are marked stale too.
//     Every icon is followed by a space; sibling icon groups are separated by ·.
// R6: the status line lists other extensions' statuses with their icons in the
//     fixed order (architecture-sync, llm-wiki, then unknown keys), the theme
//     status last, and is absent when there are none; control characters in a
//     status never break the line.
// R7: compact mode is two content lines with no bars; verbose adds the cache
//     read/write totals and the provider id.
// F1: the bar fills in proportion and bands green → amber → red by position,
//     never by the total; durations read 4d6h · 2h14m · 18m · 45s and never
//     negative; token counts abbreviate exactly as Pi's footer does.
// G1: porcelain v2 parses branch, ahead/behind, staged, modified (including
//     conflicts), untracked; ignored files are not counted; a detached HEAD
//     reads "detached".

import { describe, expect, test } from "bun:test";
import { visibleWidth } from "@earendil-works/pi-tui";
import {
  bar,
  fmtDuration,
  fmtTokens,
  layout,
} from "@ext/ui-customization-soriza/statusline/format";
import { parsePorcelain } from "@ext/ui-customization-soriza/statusline/git";
import type { QuotaEntry } from "@ext/ui-customization-soriza/statusline/quota-store";
import { renderStatusline, type Snapshot } from "@ext/ui-customization-soriza/statusline/render";
import { themeStatus } from "@ext/ui-customization-soriza/theme/status";
import { strip, tagTheme } from "../fixture";

const NOW = Date.parse("2026-09-16T06:32:00Z");
const H = 3_600_000;
const theme = tagTheme("nord");
/** `n` bar cells as they read once stripped: a space between every glyph. */
const cells = (n: number) => Array.from({ length: n }, () => "⛁").join(" ");

const anthropic: QuotaEntry = {
  provider: "anthropic",
  fetchedAt: NOW - 30_000,
  nextAllowedAt: 0,
  quota: {
    provider: "anthropic",
    session: { percent: 58, resetsAt: NOW + 2 * H + 14 * 60_000 },
    weekly: { percent: 21, resetsAt: NOW + 4 * 24 * H + 6 * H },
    models: [
      { label: "fable", percent: 21, resetsAt: null },
      { label: "opus", percent: 12, resetsAt: null },
      { label: "sonnet", percent: 5, resetsAt: null },
    ],
  },
};
const codex: QuotaEntry = {
  provider: "openai-codex",
  fetchedAt: NOW - 30_000,
  nextAllowedAt: 0,
  quota: {
    provider: "openai-codex",
    session: { percent: 3, resetsAt: NOW + 4 * H },
    weekly: { percent: 17, resetsAt: NOW + 5 * 24 * H },
    models: [],
  },
};

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    cwd: "~/ai-native-startup-pi",
    git: { branch: "main", staged: 0, modified: 0, untracked: 0, ahead: 0, behind: 0 },
    branch: "main",
    sessionName: "statusline redesign",
    model: { id: "claude-fable-5-1", provider: "anthropic", thinking: "xhigh" },
    clock: "14:32",
    elapsedMs: 72 * 60_000,
    context: { percent: 42, tokens: 84_000, window: 200_000, auto: true },
    usage: {
      input: 1_200_000,
      output: 48_000,
      cacheRead: 1_100_000,
      cacheWrite: 96_000,
      cost: 4.31,
      cacheHit: 92,
    },
    subscription: true,
    experimental: false,
    quotas: [anthropic, codex],
    statuses: new Map(),
    now: NOW,
    ...overrides,
  };
}

// The tag theme's markup is visible text (real themes emit zero-width ANSI),
// so content tests render very wide; R1 measures stripped lines and a bare theme.
const WIDE = 4000;
const render = (snap: Snapshot, width = WIDE, opts?: Parameters<typeof renderStatusline>[3]) =>
  renderStatusline(theme, width, snap, opts);
const plain = (snap: Snapshot, width = WIDE, opts?: Parameters<typeof renderStatusline>[3]) =>
  render(snap, width, opts).map(strip);

describe("R1 width", () => {
  // The tag theme's markup is visible text, so widths here are generous; the
  // stripped lines are what must fit.
  test.each([[200], [140], [100], [80], [60], [30]])(
    "R1 every stripped line fits width %d",
    (width) => {
      const lines = renderStatusline(tagTheme("x"), width * 3, snapshot()).map(strip);
      for (const line of lines) expect(visibleWidth(line)).toBeLessThanOrEqual(width * 3);
    },
  );

  test("R1 a plain theme (no markup) fits exactly at narrow widths", () => {
    const bare = {
      name: "bare",
      fg: (_t: string, s: string) => s,
      bg: (_t: string, s: string) => s,
      bold: (s: string) => s,
      italic: (s: string) => s,
    } as unknown as ReturnType<typeof tagTheme>;
    for (const width of [130, 100, 80, 60, 40, 24]) {
      const lines = renderStatusline(bare, width, snapshot());
      // an icon is never glued to what follows it
      for (const line of lines)
        expect(line).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?[^\s\uFE0F]/u);
      for (const line of lines) expect(visibleWidth(line)).toBeLessThanOrEqual(width);
      // the never-dropped segments survive
      expect(lines[0]).toContain("📁");
      expect(lines[1]).toContain("🧮");
      expect(lines[1]).toContain("42%");
      expect(lines[2]).toContain("🟠");
      expect(lines[2]).toContain("58%");
    }
  });

  test("R1 shrinking drops the bars before the numbers and the clock before the model", () => {
    const bare = {
      name: "bare",
      fg: (_t: string, s: string) => s,
      bg: (_t: string, s: string) => s,
      bold: (s: string) => s,
      italic: (s: string) => s,
    } as unknown as ReturnType<typeof tagTheme>;
    const wide = renderStatusline(bare, 200, snapshot());
    const narrow = renderStatusline(bare, 80, snapshot());
    expect(wide[1]).toContain("⛁");
    expect(narrow[1]).not.toContain("⛁");
    expect(narrow[1]).toContain("42%");
    expect(narrow[0]).toContain("claude-fable-5-1");
    expect(narrow[0]).not.toContain("🕐");
  });
});

describe("R2 where line", () => {
  test("R2 clean tree: cwd, branch ✓, session, model · thinking, clock, elapsed", () => {
    const [line] = plain(snapshot());
    expect(line).toContain("📁 ~/ai-native-startup-pi");
    expect(line).toContain("🌿 main ✓");
    expect(line).toContain("🔖 statusline redesign");
    expect(line).toContain("🤖 claude-fable-5-1 · 🧠 xhigh");
    expect(line).toContain("🕐 14:32");
    expect(line).toContain("🕐 14:32 · ⏱️ 1h12m");
  });

  test("R2 dirty tree: the marks with their signs, branch painted warning", () => {
    const [raw] = render(
      snapshot({
        git: { branch: "main", staged: 2, modified: 3, untracked: 1, ahead: 1, behind: 4 },
      }),
    );
    const line = strip(raw!);
    expect(line).toContain("🌿 main +2 ~3 ?1 ⇡1 ⇣4");
    expect(line).not.toContain("✓");
    expect(raw).toContain("<warning:nord>main</warning:nord>");
    expect(raw).toContain("<success:nord>+2</success:nord>");
    expect(raw).toContain("<error:nord>?1</error:nord>");
  });

  test("R2 no probe result → Pi's own branch; no branch anywhere → no 🌿", () => {
    expect(plain(snapshot({ git: null, branch: "feature/x" }))[0]).toContain("🌿 feature/x");
    expect(plain(snapshot({ git: null, branch: null }))[0]).not.toContain("🌿");
  });

  test("R2 no session name → no 🔖; no thinking → no 🧠; no elapsed → no ⏱️", () => {
    const [line] = plain(
      snapshot({
        sessionName: undefined,
        model: { id: "gpt-5.5", provider: "openai-codex" },
        elapsedMs: undefined,
      }),
    );
    expect(line).not.toContain("🔖");
    expect(line).toContain("🤖 gpt-5.5");
    expect(line).not.toContain("🧠");
    expect(line).not.toContain("⏱️");
  });
});

describe("R3 session line", () => {
  test("R3 context, tokens, cache hit, cost with sub and burn rate", () => {
    const [, line] = plain(snapshot());
    expect(line).toContain(`🧮 ${cells(16)} 42% (84k/200k) auto`);
    expect(line).toContain("📥 1.2M in · 📤 48k out · ⚡ 92% cached");
    expect(line).toContain("💰 $4.31 sub ($3.59/h)");
  });

  test.each([
    [42, "success"],
    [75, "warning"],
    [95, "error"],
  ] as const)("R3 context %d%% is painted %s", (percent, token) => {
    const [, raw] = render(snapshot({ context: { percent, tokens: 1, window: 100, auto: false } }));
    expect(raw).toContain(`<${token}:nord>${percent}%</${token}:nord>`);
  });

  test("R3 unknown context after compaction shows — not 0; auto off shows no auto", () => {
    const [, line] = plain(
      snapshot({ context: { percent: null, tokens: null, window: 200_000, auto: false } }),
    );
    expect(line).toContain(`🧮 ${cells(16)} — (—/200k)`);
    expect(line).not.toContain("auto");
    expect(line).not.toContain("0%");
  });

  test("R3 a low cache hit is painted warning; none before the first turn", () => {
    const [, low] = render(snapshot({ usage: { ...snapshot().usage, cacheHit: 30 } }));
    expect(low).toContain("<warning:nord>30%</warning:nord>");
    const [, none] = plain(snapshot({ usage: { ...snapshot().usage, cacheHit: undefined } }));
    expect(none).not.toContain("⚡");
  });

  test("R3 API key: no sub; under a minute: no burn rate; no cost and no sub: no 💰", () => {
    expect(plain(snapshot({ subscription: false }))[1]).toContain("💰 $4.31 ($3.59/h)");
    expect(plain(snapshot({ elapsedMs: 30_000 }))[1]).toContain("💰 $4.31 sub");
    expect(plain(snapshot({ elapsedMs: 30_000 }))[1]).not.toContain("/h");
    const none = plain(snapshot({ subscription: false, usage: { ...snapshot().usage, cost: 0 } }));
    expect(none[1]).not.toContain("💰");
  });
});

describe("R4 quota line", () => {
  test("R4 active provider first with bars and countdowns; models in parentheses; codex compact after", () => {
    const [, , line] = plain(snapshot());
    expect(line).toContain(`🟠 5h ${cells(10)} 58% ⏳ 2h14m`);
    expect(line).toContain(`7d ${cells(10)} 21% ⏳ 4d6h`);
    expect(line).toContain("(fable 21% · opus 12% · sonnet 5%)");
    expect(line).toContain("🟢 codex 5h 3% · 7d 17%");
    expect(line!.indexOf("🟠")).toBeLessThan(line!.indexOf("🟢"));
  });

  test("R4 the window gating the active model is text, the others dim", () => {
    const [, , raw] = render(snapshot());
    expect(raw).toContain("<text:nord>fable</text:nord>");
    expect(raw).toContain("<dim:nord>opus</dim:nord>");
    expect(raw).toContain("<dim:nord>sonnet</dim:nord>");
    const [, , sonnet] = render(
      snapshot({ model: { id: "claude-sonnet-5", provider: "anthropic", thinking: "low" } }),
    );
    expect(sonnet).toContain("<text:nord>sonnet</text:nord>");
    expect(sonnet).toContain("<dim:nord>fable</dim:nord>");
  });

  test("R4 switching to codex flips the order; anthropic trails with its gating model only", () => {
    const [, , line] = plain(
      snapshot({ model: { id: "gpt-5.5-codex", provider: "openai-codex", thinking: "high" } }),
    );
    expect(line!.startsWith("🟢 5h ⛁")).toBe(true);
    expect(line).toContain("🟠 anthropic 5h 58% · 7d 21% · fable 21%");
    expect(line).not.toContain("opus");
  });

  test.each([
    [58, "success"],
    [70, "warning"],
    [91, "error"],
  ] as const)("R4 %d%% of a window is painted %s", (percent, token) => {
    const entry: QuotaEntry = {
      ...anthropic,
      quota: { ...anthropic.quota!, session: { percent, resetsAt: null } },
    };
    const [, , raw] = render(snapshot({ quotas: [entry] }));
    expect(raw).toContain(`<${token}:nord>${percent}%</${token}:nord>`);
  });

  test("R4 no quotas → no quota line; statuses follow the session line directly", () => {
    const lines = plain(
      snapshot({ quotas: [], statuses: new Map([["llm-wiki", "wiki queue 1"]]) }),
    );
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain("📚 wiki queue 1");
  });
});

describe("R5 stale and failed", () => {
  test("R5 a throttled poll keeps the numbers and marks them ⚠️ with their age", () => {
    const stale: QuotaEntry = { ...anthropic, error: "throttled", fetchedAt: NOW - 12 * 60_000 };
    const [, , line] = plain(snapshot({ quotas: [stale] }));
    expect(line).toContain("🟠 5h");
    expect(line).toContain("58% ⏳ 2h14m ⚠️ stale 12m");
  });

  test("R5 a stale inactive provider carries the marker after its numbers", () => {
    const stale: QuotaEntry = { ...anthropic, error: "network", fetchedAt: NOW - 3 * 60_000 };
    const [, , line] = plain(
      snapshot({
        model: { id: "gpt-5.5-codex", provider: "openai-codex" },
        quotas: [stale, codex],
      }),
    );
    expect(line).toContain("🟠 anthropic 5h 58% · 7d 21% · fable 21% · ⚠️ stale 3m");
  });

  test("R5 an auth failure with no values → 🔒 re-login and dashes", () => {
    const [, , line] = plain(
      snapshot({ quotas: [{ provider: "anthropic", nextAllowedAt: 0, error: "auth" }] }),
    );
    expect(line).toContain("🟠 🔒 re-login 5h — · 7d —");
  });

  test("R5 an auth failure after good values → 🔒 next to the numbers", () => {
    const [, , line] = plain(snapshot({ quotas: [{ ...anthropic, error: "auth" }] }));
    expect(line).toContain("58% ⏳ 2h14m 🔒");
  });

  test("R5 a first fetch still pending → …", () => {
    const [, , line] = plain(
      snapshot({ quotas: [{ provider: "openai-codex", nextAllowedAt: 0 }] }),
    );
    expect(line).toContain("🟢 …");
  });

  test("R5 fresh values carry no marker; values older than the idle poll are marked", () => {
    expect(plain(snapshot())[2]).not.toContain("⚠️");
    const old: QuotaEntry = { ...anthropic, fetchedAt: NOW - 20 * 60_000 };
    expect(plain(snapshot({ quotas: [old] }))[2]).toContain("⚠️ stale 20m");
  });
});

describe("R6 status line", () => {
  test("R6 icons in the fixed order, unknown keys after, theme last", () => {
    const statuses = new Map([
      ["zeta", "custom status"],
      ["soriza-theme", themeStatus(theme)],
      ["llm-wiki", "wiki queue 2 · inbox 0"],
      ["architecture-sync", "architecture: current"],
    ]);
    const lines = plain(snapshot({ statuses }));
    const line = lines[3]!;
    const order = [
      "🏗️ architecture: current",
      "📚 wiki queue 2 · inbox 0",
      "custom status",
      "🎨 nord",
    ];
    const positions = order.map((s) => line.indexOf(s));
    expect(positions.every((i) => i >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(line).toContain("██");
  });

  test("R6 no statuses → three lines; a status with newlines stays on one line", () => {
    expect(plain(snapshot())).toHaveLength(3);
    const lines = plain(snapshot({ statuses: new Map([["llm-wiki", "wiki\nqueue\t2"]]) }));
    expect(lines).toHaveLength(4);
    expect(lines[3]).toBe("📚 wiki queue 2");
  });
});

describe("R7 modes", () => {
  test("R7 compact: two content lines, no bars, quota on the second", () => {
    const lines = plain(snapshot(), WIDE, { mode: "compact", verbose: false });
    expect(lines).toHaveLength(2);
    expect(lines.join("\n")).not.toContain("⛁");
    expect(lines[1]).toContain("🧮 42%");
    expect(lines[1]).toContain("🟠 5h 58% ⏳ 2h14m");
  });

  test("R7 verbose: cache read/write totals and the provider id", () => {
    const lines = plain(snapshot(), WIDE, { mode: "full", verbose: true });
    expect(lines[0]).toContain("🤖 anthropic/claude-fable-5-1");
    expect(lines[1]).toContain("⚡ 92% cached (1.1M read · 96k write)");
    expect(plain(snapshot())[1]).not.toContain("read");
  });
});

describe("F1 format", () => {
  const paint = {
    fill: (lvl: string, s: string) => `[${lvl}:${s}]`,
    empty: (s: string) => `[_:${s}]`,
  };
  test.each([
    [0, `[_:${cells(10)}]`],
    [50, `[ok:${cells(5)}] [_:${cells(5)}]`],
    // the 6th cell sits at 60 % — the amber threshold — and the 9th at 90 %
    [80, `[ok:${cells(5)}] [warn:${cells(3)}] [_:${cells(2)}]`],
    [100, `[ok:${cells(5)}] [warn:${cells(3)}] [crit:${cells(2)}]`],
    [150, `[ok:${cells(5)}] [warn:${cells(3)}] [crit:${cells(2)}]`],
  ])("F1 bar at %d%% bands by position, one space between cells", (percent, expected) => {
    expect(bar(percent, 10, paint)).toBe(expected);
  });

  test.each([
    [45_000, "45s"],
    [18 * 60_000, "18m"],
    [(2 * 60 + 14) * 60_000, "2h14m"],
    [3 * 3_600_000, "3h"],
    [(4 * 24 + 6) * 3_600_000, "4d6h"],
    [-5_000, "0s"],
  ])("F1 %d ms reads %s", (ms, text) => {
    expect(fmtDuration(ms)).toBe(text);
  });

  test.each([
    [999, "999"],
    [1_234, "1.2k"],
    [48_000, "48k"],
    [1_200_000, "1.2M"],
    [12_000_000, "12M"],
  ])("F1 %d tokens read %s", (n, text) => {
    expect(fmtTokens(n)).toBe(text);
  });

  test("F1 layout: full, then compact from the least important, then drop, then truncate", () => {
    const segs = [
      { full: "AAAAAAAAAA", compact: "AAAA", priority: Infinity },
      { full: "BBBBBBBBBB", compact: "BBBB", priority: 50 },
      { full: "CCCCCCCCCC", priority: 10 },
    ];
    expect(layout(segs, 100, " ")).toBe("AAAAAAAAAA BBBBBBBBBB CCCCCCCCCC");
    expect(layout(segs, 26, " ")).toBe("AAAAAAAAAA BBBB CCCCCCCCCC");
    expect(layout(segs, 20, " ")).toBe("AAAA BBBB CCCCCCCCCC");
    expect(layout(segs, 12, " ")).toBe("AAAA BBBB");
    const truncated = layout(segs, 3, " ");
    expect(truncated.replace(/\x1b\[[0-9;]*m/g, "")).toBe("AA…");
    expect(visibleWidth(truncated)).toBe(3);
  });
});

describe("G1 porcelain v2", () => {
  const OUTPUT = [
    "# branch.oid 0123abcd",
    "# branch.head main",
    "# branch.upstream origin/main",
    "# branch.ab +2 -1",
    "1 M. N... 100644 100644 100644 aaaa bbbb staged.ts",
    "1 .M N... 100644 100644 100644 aaaa bbbb modified.ts",
    "1 MM N... 100644 100644 100644 aaaa bbbb both.ts",
    "2 R. N... 100644 100644 100644 aaaa bbbb R100 new.ts\told.ts",
    "u UU N... 100644 100644 100644 100644 aaaa bbbb cccc conflict.ts",
    "? untracked.ts",
    "? another.ts",
    "! ignored.log",
    "",
  ].join("\n");

  test("G1 counts by column: staged from X, modified from Y, conflicts, untracked; ignored skipped", () => {
    expect(parsePorcelain(OUTPUT)).toEqual({
      branch: "main",
      staged: 3,
      modified: 3,
      untracked: 2,
      ahead: 2,
      behind: 1,
    });
  });

  test("G1 detached HEAD and no upstream", () => {
    expect(parsePorcelain("# branch.oid abc\n# branch.head (detached)\n")).toEqual({
      branch: "detached",
      staged: 0,
      modified: 0,
      untracked: 0,
      ahead: 0,
      behind: 0,
    });
  });
});
