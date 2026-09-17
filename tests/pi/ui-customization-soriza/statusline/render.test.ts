// Contract — the statusline's lines from a snapshot (pure)
//
// R1: every line fits the width it is given, at every width; as the width
//     shrinks, bars go before numbers and the least important segment goes
//     before the more important — the cwd, the context figure, and the
//     active 5h window are never dropped; the grid relaxes (all columns
//     aligned → the label column only → plain flow) rather than overflowing.
// R2: the where line carries cwd, branch with its dirty marks (✓ clean, else
//     +staged ~modified ?untracked ⇡ahead ⇣behind), the session name, the
//     model with its thinking level and the clock — never an elapsed time;
//     Pi's own branch stands in when the probe has nothing, and a session
//     with no name shows no 🔖.
// R3: the context row is labelled `Context` in the grid's shared label column
//     and carries the ten-cell bar, two spaces, and the percentage in Pi's
//     own thresholds (warning above 70, error above 90), the used/window
//     figures,
//     `auto` only when auto-compaction is on, tokens in and out, the latest
//     cache-hit rate (warning below 50 %), and the cost with `sub` only on a
//     subscription and a burn rate only once a minute has elapsed; an unknown
//     context (after compaction) shows — rather than 0.
// R4: every provider gets its own line — icon, name padded into a shared
//     column, then 5h and 7d as bar, two spaces, percentage padded to three,
//     ↻ time-left · reset stamp — the active provider's line first and
//     carrying the per-model weekly windows in parentheses, the one gating
//     the active model highlighted and the rest dim; no quota at all → no
//     quota lines.
// R4b: a 5h window resetting today shows a bare 24-hour clock and otherwise
//     the dated `20 Sep Sun 18:32` stamp; the 7d window is always dated.
// R5: a failed poll keeps the last values and marks them, after the numbers,
//     ⚠️ stale with their age; a re-login need shows 🔒; a first fetch still
//     pending shows …; values older than the idle poll are marked stale too.
//     Every icon is followed by a space; sibling icon groups are separated by ·.
// R6: the last line lists other extensions' statuses with their icons in the
//     fixed order (architecture-sync, llm-wiki, then unknown keys) and the
//     theme status last on its left, and the session's context length as
//     `<count> Tokens` — the exact count, not the Context row's abbreviation —
//     flush against its right edge; with no statuses the badge still holds the
//     corner, it follows the Context row's own figure, and control characters
//     in a status never break the line.
// R7: compact mode is two content lines with no bars, every provider terse on
//     the second, plus the badge line; verbose adds the cache read/write
//     totals and the provider id.
// R8: lines 2..n are one grid — `Context`, then a row per provider — so the
//     ⛁ bars, the percentages and the group after them all start at the same
//     column on every row, whatever the names and numbers are.
// F1: the bar fills in proportion and bands green → amber → red by position,
//     never by the total; durations read 4d6h · 2h14m · 18m · 45s and never
//     negative; quota countdowns keep their smaller unit (4h00m · 5d0h) so the
//     column holds still; token counts abbreviate exactly as Pi's footer does,
//     and `fmtExactTokens` keeps every digit, grouped in threes.
// F2: `layoutGrid` aligns every column when that fits, falls back to the first
//     column only, then to plain rows, and never leaves trailing space;
//     `layoutRight` pins its trailer to the right edge, keeps a gap, and
//     sacrifices the segments rather than the trailer.
// G1: porcelain v2 parses branch, ahead/behind, staged, modified (including
//     conflicts), untracked; ignored files are not counted; a detached HEAD
//     reads "detached".

import { describe, expect, test } from "bun:test";
import { visibleWidth } from "@earendil-works/pi-tui";
import {
  bar,
  fmtCountdown,
  fmtDuration,
  fmtResetAt,
  fmtStamp,
  fmtExactTokens,
  fmtTokens,
  layout,
  layoutGrid,
  layoutRight,
} from "@ext/ui-customization-soriza/statusline/format";
import { parsePorcelain } from "@ext/ui-customization-soriza/statusline/git";
import type { QuotaEntry } from "@ext/ui-customization-soriza/statusline/quota-store";
import { renderStatusline, type Snapshot } from "@ext/ui-customization-soriza/statusline/render";
import { themeStatus } from "@ext/ui-customization-soriza/theme/status";
import { bareTheme, strip, tagTheme } from "../fixture";

// Local time, because the reset stamps are wall-clock: Wed 16 Sep 2026, 14:32.
const NOW = new Date(2026, 8, 16, 14, 32).getTime();
const H = 3_600_000;
const DAY = 24 * H;
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
    weekly: { percent: 21, resetsAt: NOW + 4 * DAY + 6 * H },
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
    weekly: { percent: 2, resetsAt: NOW + 5 * DAY },
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
    const bare = bareTheme();
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
      expect(lines[3]).toContain("🟢");
    }
  });

  test("R1 shrinking drops the bars before the numbers and the clock before the model", () => {
    const bare = bareTheme();
    const wide = renderStatusline(bare, 200, snapshot());
    const narrow = renderStatusline(bare, 80, snapshot());
    expect(wide[1]).toContain("⛁");
    expect(narrow[1]).not.toContain("⛁");
    expect(narrow[1]).toContain("42%");
    expect(narrow[0]).toContain("claude-fable-5-1");
    expect(narrow[0]).not.toContain("🕐");
    // the 5h window survives on every provider line
    expect(narrow[2]).toContain("58%");
    expect(narrow[3]).toContain("3%");
  });
});

describe("R2 where line", () => {
  test("R2 clean tree: cwd, branch ✓, session, model · thinking, clock", () => {
    const [line] = plain(snapshot());
    expect(line).toContain("📁 ~/ai-native-startup-pi");
    expect(line).toContain("🌿 main ✓");
    expect(line).toContain("🔖 statusline redesign");
    expect(line).toContain("🤖 claude-fable-5-1 · 🧠 xhigh");
    expect(line).toContain("🕐 14:32");
  });

  test("R2 the elapsed time is never shown, whatever the session's age", () => {
    for (const elapsedMs of [undefined, 30_000, 72 * 60_000, 9 * H]) {
      const [line] = plain(snapshot({ elapsedMs }));
      expect(line).not.toContain("⏱");
      expect(line).not.toContain("1h12m");
    }
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

  test("R2 no session name → no 🔖; no thinking → no 🧠", () => {
    const [line] = plain(
      snapshot({
        sessionName: undefined,
        model: { id: "gpt-5.5", provider: "openai-codex" },
      }),
    );
    expect(line).not.toContain("🔖");
    expect(line).toContain("🤖 gpt-5.5");
    expect(line).not.toContain("🧠");
  });
});

describe("R3 context row", () => {
  test("R3 labelled Context, ten-cell bar, two spaces, tokens, cache hit, cost", () => {
    const [, line] = plain(snapshot());
    expect(line).toContain(`🧮 Context     ${cells(10)}  42% (84k/200k) auto`);
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
    expect(line).toContain(`🧮 Context     ${cells(10)}  —   (—/200k)`);
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

describe("R4 quota lines", () => {
  test("R4 one line per provider: label column, bars, padded percentages, resets", () => {
    const [, , claude, openai] = plain(snapshot());
    expect(claude).toContain(`🟠 Claude   5h ${cells(10)}  58% ↻ 2h14m · 16:46`);
    expect(claude).toContain(`7d ${cells(10)}  21% ↻ 4d6h · 20 Sep Sun 20:32`);
    expect(claude).toContain("(fable 21% · opus 12% · sonnet 5%)");
    expect(openai).toContain(`🟢 OpenAI   5h ${cells(10)}  3%  ↻ 4h00m · 18:32`);
    expect(openai).toContain(`7d ${cells(10)}  2%  ↻ 5d0h · 21 Sep Mon 14:32`);
  });

  test("R4 the provider is named, never the api id", () => {
    const lines = plain(snapshot()).join("\n");
    expect(lines).toContain("OpenAI");
    expect(lines).not.toContain("Codex ");
    expect(lines).not.toContain("anthropic");
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

  test("R4 switching to codex puts its line first; both keep their bars", () => {
    const lines = plain(
      snapshot({ model: { id: "gpt-5.5-codex", provider: "openai-codex", thinking: "high" } }),
    );
    expect(lines[2]!.startsWith("🟢 OpenAI")).toBe(true);
    expect(lines[3]!.startsWith("🟠 Claude")).toBe(true);
    expect(lines[3]).toContain("(fable 21% · opus 12% · sonnet 5%)");
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

  test("R4 no quotas → no quota lines; statuses follow the session line directly", () => {
    const lines = plain(
      snapshot({ quotas: [], statuses: new Map([["llm-wiki", "wiki queue 1"]]) }),
    );
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain("📚 wiki queue 1");
  });

  test("R4 a window with no reset time carries no ↻ at all", () => {
    const entry: QuotaEntry = {
      ...anthropic,
      quota: { ...anthropic.quota!, session: { percent: 58, resetsAt: null }, models: [] },
    };
    const [, , line] = plain(snapshot({ quotas: [entry] }));
    expect(line).toContain(`🟠 Claude   5h ${cells(10)}  58%`);
    // the 5h group ends at its percentage: nothing between it and the 7d window
    expect(line!.slice(0, line!.indexOf("7d"))).not.toContain("↻");
    expect(line).toContain("21% ↻ 4d6h");
  });
});

describe("R4b reset stamps", () => {
  const session = (resetsAt: number) => ({
    ...anthropic,
    quota: { ...anthropic.quota!, session: { percent: 58, resetsAt } },
  });

  test("R4b a 5h window resetting today shows a bare 24-hour clock", () => {
    const [, , line] = plain(snapshot({ quotas: [session(NOW + 2 * H + 14 * 60_000)] }));
    expect(line).toContain("58% ↻ 2h14m · 16:46");
  });

  test("R4b a 5h window resetting tomorrow shows the dated stamp", () => {
    // 16 Sep 2026 22:32 + 4h → 17 Sep, a Thursday
    const late = new Date(2026, 8, 16, 22, 32).getTime();
    const [, , line] = plain(snapshot({ now: late, quotas: [session(late + 4 * H)] }));
    expect(line).toContain("58% ↻ 4h00m · 17 Sep Thu 02:32");
  });

  test("R4b the 7d window is dated even when it resets today", () => {
    const entry: QuotaEntry = {
      ...anthropic,
      quota: { ...anthropic.quota!, weekly: { percent: 21, resetsAt: NOW + 3 * H } },
    };
    const [, , line] = plain(snapshot({ quotas: [entry] }));
    expect(line).toContain("21% ↻ 3h00m · 16 Sep Wed 17:32");
  });
});

describe("R5 stale and failed", () => {
  test("R5 a throttled poll keeps the numbers and marks them ⚠️ with their age", () => {
    const stale: QuotaEntry = { ...anthropic, error: "throttled", fetchedAt: NOW - 12 * 60_000 };
    const [, , line] = plain(snapshot({ quotas: [stale] }));
    expect(line).toContain("🟠 Claude   5h");
    expect(line).toContain("58% ↻ 2h14m · 16:46 ⚠️ stale 12m");
  });

  test("R5 a stale inactive provider carries the marker on its own line", () => {
    const stale: QuotaEntry = { ...anthropic, error: "network", fetchedAt: NOW - 3 * 60_000 };
    const lines = plain(
      snapshot({
        model: { id: "gpt-5.5-codex", provider: "openai-codex" },
        quotas: [stale, codex],
      }),
    );
    expect(lines[3]).toContain("🟠 Claude");
    expect(lines[3]).toContain("58% ↻ 2h14m · 16:46 ⚠️ stale 3m");
  });

  test("R5 an auth failure with no values → 🔒 re-login and dashes", () => {
    const [, , line] = plain(
      snapshot({ quotas: [{ provider: "anthropic", nextAllowedAt: 0, error: "auth" }] }),
    );
    expect(line).toContain("🟠 Claude   🔒 re-login 5h — · 7d —");
  });

  test("R5 an auth failure after good values → 🔒 next to the numbers", () => {
    const [, , line] = plain(snapshot({ quotas: [{ ...anthropic, error: "auth" }] }));
    expect(line).toContain("58% ↻ 2h14m · 16:46 🔒");
  });

  test("R5 a first fetch still pending → …", () => {
    const [, , line] = plain(
      snapshot({ quotas: [{ provider: "openai-codex", nextAllowedAt: 0 }] }),
    );
    expect(line).toContain("🟢 OpenAI   … 5h — · 7d —");
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
    // where, Context, Claude, OpenAI, then the statuses and the badge
    const lines = plain(snapshot({ statuses }));
    expect(lines).toHaveLength(5);
    const line = lines[4]!;
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

  test("R6 no statuses → the badge still holds the line; newlines stay on one line", () => {
    const bare = renderStatusline(bareTheme(), 120, snapshot());
    expect(bare).toHaveLength(5);
    expect(bare[4]!.trim()).toBe("84,000 Tokens");
    const lines = plain(snapshot({ statuses: new Map([["llm-wiki", "wiki\nqueue\t2"]]) }));
    expect(lines).toHaveLength(5);
    expect(lines[4]).toContain("📚 wiki queue 2");
  });

  test("R6 the token badge sits in the bottom-right corner of the last line", () => {
    const statuses = new Map([["llm-wiki", "wiki queue 2"]]);
    for (const width of [160, 120, 100]) {
      const lines = renderStatusline(bareTheme(), width, snapshot({ statuses }));
      const last = lines.at(-1)!;
      expect(last).toContain("📚 wiki queue 2");
      expect(last.endsWith("84,000 Tokens")).toBe(true);
      expect(visibleWidth(last)).toBe(width);
      // left content, then a run of padding, then the badge — nothing after it
      expect(last).toMatch(/ {2,}84,000 Tokens$/);
    }
  });

  test("R6 the badge is the session's context length, not its cumulative traffic", () => {
    // cumulative traffic is 2.4M; the context holds 84k of the window
    expect(renderStatusline(bareTheme(), 160, snapshot()).at(-1)).toContain("84,000 Tokens");
    const longer = renderStatusline(
      bareTheme(),
      160,
      snapshot({ context: { percent: 11, tokens: 114_325, window: 1_000_000, auto: true } }),
    );
    // the Context row still abbreviates; the badge carries the exact figure
    expect(longer[1]).toContain("11% (114k/1.0M)");
    expect(longer.at(-1)).toContain("114,325 Tokens");
  });

  test("R6 no context reading → the badge reads — Tokens, like the Context row", () => {
    const lines = renderStatusline(
      bareTheme(),
      160,
      snapshot({ context: { percent: null, tokens: null, window: 200_000, auto: false } }),
    );
    expect(lines[1]).toContain("—   (—/200k)");
    expect(lines.at(-1)!.trim()).toBe("— Tokens");
  });
});

describe("R8 the grid", () => {
  /** The display column a marker starts at, counting emoji as their real width. */
  const col = (line: string, marker: string) => {
    const at = line.indexOf(marker);
    expect(at).toBeGreaterThanOrEqual(0);
    return visibleWidth(line.slice(0, at));
  };

  test("R8 bars, percentages and the next group start at the same column on every row", () => {
    const [, context, claude, openai] = renderStatusline(bareTheme(), 200, snapshot());
    expect(col(context!, "⛁")).toBe(col(claude!, "⛁"));
    expect(col(openai!, "⛁")).toBe(col(claude!, "⛁"));
    expect(col(context!, "42%")).toBe(col(claude!, "58%"));
    expect(col(openai!, "3%")).toBe(col(claude!, "58%"));
    // the second column: the tokens group sits where the 7d windows start
    expect(col(context!, "📥")).toBe(col(claude!, "7d"));
    expect(col(openai!, "7d")).toBe(col(claude!, "7d"));
    // the third: cost sits where the per-model windows start
    expect(col(context!, "💰")).toBe(col(claude!, "(fable"));
  });

  test("R8 a longer name moves every row's bar together, never one row alone", () => {
    const [, context, claude] = renderStatusline(
      bareTheme(),
      200,
      snapshot({ quotas: [anthropic] }),
    );
    expect(col(context!, "⛁")).toBe(col(claude!, "⛁"));
    // "Context" is the widest label, so it sets the column
    expect(claude).toContain("🟠 Claude   5h");
  });

  test("R8 no row carries trailing space, and every row still fits", () => {
    for (const width of [200, 160, 140, 120, 90]) {
      for (const line of renderStatusline(bareTheme(), width, snapshot())) {
        expect(line).toBe(line.replace(/\s+$/, ""));
        expect(visibleWidth(line)).toBeLessThanOrEqual(width);
      }
    }
  });

  test("R8 too narrow for the grid → rows flow, but the name column still holds", () => {
    for (const width of [110, 100, 90, 80]) {
      const [, , claude, openai] = renderStatusline(bareTheme(), width, snapshot());
      expect(claude).toContain("🟠 Claude   5h");
      expect(openai).toContain("🟢 OpenAI   5h");
      expect(col(openai!, "3%")).toBe(col(claude!, "58%"));
    }
  });
});

describe("R7 modes", () => {
  test("R7 compact: two content lines, no bars, every provider terse, badge last", () => {
    const lines = plain(snapshot(), WIDE, { mode: "compact", verbose: false });
    expect(lines).toHaveLength(3);
    expect(lines.join("\n")).not.toContain("⛁");
    expect(lines[1]).toContain("🧮 42%");
    expect(lines[1]).toContain("🟠 Claude 5h 58% · 7d 21%");
    expect(lines[1]).toContain("🟢 OpenAI 5h 3% · 7d 2%");
    expect(lines[1]!.indexOf("🟠")).toBeLessThan(lines[1]!.indexOf("🟢"));
    expect(lines[2]!.trim()).toBe("84,000 Tokens");
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
    [45_000, "45s"],
    [18 * 60_000, "18m"],
    [(2 * 60 + 14) * 60_000, "2h14m"],
    [4 * H, "4h00m"],
    [4 * H + 5 * 60_000, "4h05m"],
    [5 * DAY, "5d0h"],
    [(4 * 24 + 6) * H, "4d6h"],
    [-5_000, "0s"],
  ])("F1 %d ms counts down as %s", (ms, text) => {
    expect(fmtCountdown(ms)).toBe(text);
  });

  test("F1 the stamp is `20 Sep Sun 20:32`; a reset today is bare unless dated", () => {
    const now = new Date(2026, 8, 16, 14, 32);
    expect(fmtStamp(new Date(2026, 8, 20, 20, 32))).toBe("20 Sep Sun 20:32");
    expect(fmtResetAt(new Date(2026, 8, 16, 16, 46), now)).toBe("16:46");
    expect(fmtResetAt(new Date(2026, 8, 16, 16, 46), now, true)).toBe("16 Sep Wed 16:46");
    expect(fmtResetAt(new Date(2026, 8, 17, 2, 32), now)).toBe("17 Sep Thu 02:32");
    // same day-of-month a year on is not "today"
    expect(fmtResetAt(new Date(2027, 8, 16, 16, 46), now)).toBe("16 Sep Thu 16:46");
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

  test.each([
    [0, "0"],
    [999, "999"],
    [1_000, "1,000"],
    [48_321, "48,321"],
    [114_325, "114,325"],
    [1_240_567, "1,240,567"],
    [1_240_567.4, "1,240,567"],
  ])("F1 %d tokens read %s in full", (n, text) => {
    expect(fmtExactTokens(n)).toBe(text);
  });

  test("F2 layoutGrid aligns every column, then the first, then gives up", () => {
    const rows = [
      [
        { full: "AAA", priority: Infinity },
        { full: "BB", priority: 50 },
        { full: "CCCCCCCC", priority: 10 },
      ],
      [
        { full: "A", priority: Infinity },
        { full: "BBBB", priority: 50 },
        { full: "CC", priority: 10 },
      ],
    ];
    // every column aligned; the last cell of a row is never padded
    expect(layoutGrid(rows, 40, " ")).toEqual(["AAA BB   CCCCCCCC", "A   BBBB CC"]);
    // 17 wide no longer fits every column → only the first stays aligned
    expect(layoutGrid(rows, 16, " ")).toEqual(["AAA BB CCCCCCCC", "A   BBBB CC"]);
    // nothing fits aligned → rows laid out on their own, least important dropped
    expect(layoutGrid(rows, 14, " ")).toEqual(["AAA BB", "A BBBB CC"]);
    expect(layoutGrid([], 40, " ")).toEqual([]);
  });

  test("F2 layoutRight pins the trailer to the right edge and keeps a gap", () => {
    const segs = [
      { full: "LEFT", priority: 50 },
      { full: "MORE", priority: 10 },
    ];
    const line = layoutRight(segs, "9 Tokens", 30, "  ");
    expect(visibleWidth(line)).toBe(30);
    expect(line).toBe("LEFT  MORE            9 Tokens");
    // no segments → the trailer alone, still flush right
    expect(layoutRight([], "9 Tokens", 12)).toBe("    9 Tokens");
    // too tight → segments give way, the trailer never does
    expect(layoutRight(segs, "9 Tokens", 14, "  ")).toBe("LEFT  9 Tokens");
    expect(layoutRight(segs, "9 Tokens", 8)).toBe("9 Tokens");
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
