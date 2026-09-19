// Contract — the artifact rules (src/domain), pure functions
//
// D1: a version is an agent publish → the next version of nothing is 1, of v2 is 3;
//     a page reply is stale unless it names the current version, and the island a
//     reader sees is the version with the newest reply laid over it
// D2: an artifact expires only when unpinned and idle past retention; log folders
//     expire by their date; a malformed name never expires
// D3: config keeps the port fixed at 5834 unless the file names one; bad values fall
//     back per key, never as a whole
// D4: a questions island is validated against itself: answers naming real options
//     pass, unknown options or ids and over-selection fail, hidden questions are not
//     required
// D5: the feedback envelope names the reply and the version it answers, says the
//     version did not move, and marks a send made without a user gesture
// D6: text drawn into the terminal carries no control or escape sequence

import { describe, expect, test } from "bun:test";

import { parseConfig } from "@ext/artifacts/src/domain/config";
import { envelope } from "@ext/artifacts/src/domain/envelope";
import { expiredLogDates, isExpired } from "@ext/artifacts/src/domain/retention";
import { validateAnswers } from "@ext/artifacts/src/domain/schemas";
import { terminalSafe } from "@ext/artifacts/src/domain/text";
import type { Manifest, PageEvent } from "@ext/artifacts/src/domain/types";
import {
  isStale,
  mergedIsland,
  nextVersion,
  versionLabel,
} from "@ext/artifacts/src/domain/versioning";

const manifest = (over: Partial<Manifest> = {}): Manifest => ({
  slug: "p",
  title: "Plan",
  source: "html",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  lastActivityAt: "2026-01-01T00:00:00.000Z",
  current: 2,
  versions: [],
  responses: [],
  watched: true,
  owner: "s",
  sessions: ["s"],
  pinned: false,
  pending: [],
  ...over,
});

describe("D1 versions are agent publishes; replies answer a version", () => {
  test("D1 next version: none → 1, v2 → 3", () => {
    expect(nextVersion(null)).toBe(1);
    expect(nextVersion(manifest({ current: 2 }))).toBe(3);
  });
  test.each([
    [1, 1, false],
    [1, 2, true],
    [3, 2, true],
  ])("D1 reply to v%d when current is v%d → stale %p", (base, current, stale) => {
    expect(isStale(base, current)).toBe(stale);
  });
  test("D1 the reader's island is the version with the reply over it", () => {
    expect(mergedIsland({ a: 1, b: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    expect(mergedIsland(null, { b: 2 })).toEqual({ b: 2 });
    expect(mergedIsland({ a: 1 }, null)).toEqual({ a: 1 });
  });
  test("D1 the label counts replies to the current version only", () => {
    const m = manifest({
      current: 2,
      responses: [
        { r: 1, version: 1, at: "", gesture: true, bytes: 1 },
        { r: 1, version: 2, at: "", gesture: true, bytes: 1 },
      ],
    });
    expect(versionLabel(m)).toBe("v2 · 1 reply");
    expect(versionLabel(manifest({ current: 2 }))).toBe("v2");
  });
});

describe("D2 retention", () => {
  const now = new Date("2026-01-20T00:00:00.000Z");
  test.each([
    ["idle 19 days, unpinned", { lastActivityAt: "2026-01-01T00:00:00.000Z" }, true],
    ["idle 19 days, pinned", { lastActivityAt: "2026-01-01T00:00:00.000Z", pinned: true }, false],
    ["active 3 days ago", { lastActivityAt: "2026-01-17T00:00:00.000Z" }, false],
    ["unparsable activity", { lastActivityAt: "never" }, false],
  ])("D2 %s → expired %p", (_name, over, expired) => {
    expect(isExpired(manifest(over as Partial<Manifest>), now, 14)).toBe(expired);
  });
  test("D2 log folders expire by date; other names are left alone", () => {
    expect(expiredLogDates(["2026-01-01", "2026-01-19", "notes", "2026-1-1"], now, 14)).toEqual([
      "2026-01-01",
    ]);
  });
});

describe("D3 config", () => {
  test("D3 defaults: port 5834, 14 days, wake delivery", () => {
    const c = parseConfig(undefined);
    expect(c.port).toBe(5834);
    expect(c.retentionDays).toBe(14);
    expect(c.delivery).toBe("wake");
  });
  test("D3 a bad key falls back alone; a good one beside it is kept", () => {
    const c = parseConfig({ port: 0, retentionDays: 30, delivery: "email" });
    expect(c.port).toBe(5834);
    expect(c.retentionDays).toBe(30);
    expect(c.delivery).toBe("wake");
  });
});

describe("D4 questions/v1 answers", () => {
  const island = {
    schema: "questions/v1",
    questions: [
      { id: "a", question: "A?", options: [{ label: "x" }, { label: "y" }] },
      { id: "b", question: "B?", options: [{ label: "p" }], dependsOn: { a: "y" } },
    ],
    answers: {},
  };
  test("D4 a real option answers; a hidden dependent question is not required", () => {
    const v = validateAnswers({ ...island, answers: { a: { selected: ["x"] } } });
    expect(v.ok).toBe(true);
    expect(v.unanswered).toEqual([]);
    expect(v.total).toBe(1);
  });
  test("D4 a visible dependent question becomes required", () => {
    const v = validateAnswers({ ...island, answers: { a: { selected: ["y"] } } });
    expect(v.ok).toBe(true);
    expect(v.unanswered).toEqual(["b"]);
  });
  test.each([
    ["an unknown option", { a: { selected: ["z"] } }],
    ["an unknown id", { a: { selected: ["x"] }, zz: { text: "?" } }],
    ["two picks on single-select", { a: { selected: ["x", "y"] } }],
  ])("D4 %s fails", (_name, answers) => {
    expect(validateAnswers({ ...island, answers }).ok).toBe(false);
  });
});

describe("D5 the envelope", () => {
  const event = (over: Partial<PageEvent> = {}): PageEvent => ({
    pendingId: "e1",
    slug: "p",
    title: "Plan",
    owner: "s",
    watched: true,
    kind: "response",
    version: 2,
    response: 3,
    gesture: true,
    at: "2026-01-01T00:00:00.000Z",
    island: { answers: { a: { selected: ["x"] } } },
    validation: null,
    ...over,
  });
  test("D5 names reply 3 to v2 and says the version stays v2", () => {
    const text = envelope({ event: event(), url: "u" });
    expect(text).toContain("reply 3 to v2");
    expect(text).toContain("still v2");
    expect(text).not.toContain("no user gesture");
  });
  test("D5 a send without a gesture is marked page-generated", () => {
    expect(envelope({ event: event({ gesture: false }), url: "u" })).toContain("no user gesture");
  });
});

describe("D6 terminal-safe text", () => {
  test.each([
    ["Plain title", "Plain title"],
    ["Bad\x1b[31m red\x1b[0m", "Bad red"],
    ["osc\x1b]8;;http://x\x07link\x1b]8;;\x07", "osclink"],
    ["tabs\tand\nnewlines", "tabs and newlines"],
  ])("D6 %j → %j", (input, expected) => {
    expect(terminalSafe(input)).toBe(expected);
  });
  test("D6 long titles are cut with an ellipsis", () => {
    expect(terminalSafe("a".repeat(50), 10)).toBe("aaaaaaaaa…");
  });
});
