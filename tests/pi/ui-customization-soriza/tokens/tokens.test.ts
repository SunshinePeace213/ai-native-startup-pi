// Contract — the token counter (the statusline's bottom-right badge)
//
// T1: the count is the session's current context length — the very figure the
//     Context row measures — not cumulative traffic; no reading (a fresh
//     session, or straight after compaction) counts as nothing known, and a
//     negative or non-finite reading never becomes a number.
// T2: the badge reads `<count> Tokens` with the exact count — never rounded or
//     abbreviated — grouped in threes for reading, the number in text and the
//     unit dim; with no reading it reads `— Tokens`, dim.

import { describe, expect, test } from "bun:test";
import { sessionTokens, tokenBadge, tokenBadgeText } from "@ext/ui-customization-soriza/tokens";
import { strip, tagTheme } from "../fixture";

const context = (tokens: number | null, window = 1_000_000) => ({ tokens, window });

describe("T1 the count", () => {
  test("T1 it is the context length, whatever the window is", () => {
    expect(sessionTokens(context(114_000))).toBe(114_000);
    expect(sessionTokens(context(114_000, 200_000))).toBe(114_000);
    expect(sessionTokens(context(0))).toBe(0);
  });

  test("T1 no reading stays unknown; a bad reading never becomes a number", () => {
    expect(sessionTokens(context(null))).toBeNull();
    expect(sessionTokens(context(Number.NaN))).toBeNull();
    expect(sessionTokens(context(Number.POSITIVE_INFINITY))).toBeNull();
    expect(sessionTokens(context(-500))).toBe(0);
  });
});

describe("T2 the badge", () => {
  test.each([
    [0, "0 Tokens"],
    [999, "999 Tokens"],
    [1_234, "1,234 Tokens"],
    [48_321, "48,321 Tokens"],
    [114_325, "114,325 Tokens"],
    [1_240_567, "1,240,567 Tokens"],
  ])("T2 a context of %d reads %s", (tokens, text) => {
    expect(tokenBadgeText(context(tokens))).toBe(text);
  });

  test("T2 the count is exact: neighbours that share an abbreviation still differ", () => {
    expect(tokenBadgeText(context(114_324))).toBe("114,324 Tokens");
    expect(tokenBadgeText(context(114_325))).toBe("114,325 Tokens");
    expect(tokenBadgeText(context(999_999))).toBe("999,999 Tokens");
  });

  test("T2 no reading reads — Tokens", () => {
    expect(tokenBadgeText(context(null))).toBe("— Tokens");
    expect(strip(tokenBadge(tagTheme("nord"), context(null)))).toBe("— Tokens");
    expect(tokenBadge(tagTheme("nord"), context(null))).toContain("<dim:nord>—</dim:nord>");
  });

  test("T2 the count is text and bold, the unit dim", () => {
    const painted = tokenBadge(tagTheme("nord"), context(114_325));
    expect(painted).toContain("<b><text:nord>114,325</text:nord></b>");
    expect(painted).toContain("<dim:nord>Tokens</dim:nord>");
    expect(strip(painted)).toBe("114,325 Tokens");
  });
});
