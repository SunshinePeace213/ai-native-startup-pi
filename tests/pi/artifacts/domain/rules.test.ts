// Contract — the artifact rules (src/domain), pure functions
//
// D1: a version is a publish, never a reply → the next version of nothing is 1, of v2 is 3;
//     a page reply is stale unless it names the current version, and the island a
//     reader sees is the version with the newest reply laid over it
// D2: an artifact expires only when unpinned and idle past retention; log folders
//     expire by their date; a malformed name never expires; a log line's time is
//     the local wall clock with its offset, the same instant as the UTC reading
// D3: config keeps the port fixed at 5834 unless the file names one; pages are
//     isolated by origin unless the file says sandbox; bad values fall back per
//     key, never as a whole
// D4: a questions island is validated against itself: answers naming real options
//     pass, unknown options or ids and over-selection fail, hidden questions are not
//     required
// D5: the feedback envelope names the reply and the version it answers, says the
//     version did not move, and marks a send made without a user gesture
// D6: text drawn into the terminal carries no control or escape sequence
// D7: a slug is a DNS label — lowercase letters, digits and inner hyphens, at most 63
//     characters — because a page's origin is <slug>.localhost; a Host names a slug
//     only as <slug>.localhost on this server's port; a version's frame path carries
//     the cap and the version
// D8: an icon is one generic word of 2–24 lowercase letters, digits or hyphens,
//     starting with a letter; the shell draws a known word's glyph and one neutral
//     glyph for any other
// D9: a supporting file's published path is relative and stays inside the artifact,
//     and `index.html` and `preflight.js` at its root are the platform's; its media
//     type comes from the extension for the common web types and must otherwise be
//     stated, bare and servable; a text file holds 16 MiB, a binary one 15 MiB, a
//     version 255 files and 64 MiB; a publish is laid over the files there: a named
//     path is added or replaced, null removes one, every other path is kept
// D10: a capability declaration is an object of name → config (an object, or `true`
//      as Claude Code writes one with nothing to say, stored as {}): the names this
//      host serves and Claude Code's names it cannot serve are accepted, any other name
//      — `permissions` and `reply` included, which are never declared — is refused;
//      omitted keeps the stored declaration, {} clears it, anything else replaces it
//      whole; a page is served `permissions` always, `reply` with an island, and of
//      what it declared only what this host runs, with its config
// D11: a page pins a write to the hash of the copy it replaces, or to null when it
//      creates the file: a pin fails when the file's hash now differs, the file is
//      gone, or a file stands where none was expected, and the failure says what is
//      there; what other writers changed between two versions is every path outside
//      the named ones whose hash differs, with null for one that is gone
// D12: a database path is slash-separated segments of letters, digits and _ - . ~ : @ +,
//      never `.`, `..` or a reserved `__name__`, at most 200 bytes a segment and 1000
//      bytes and 16 segments a path; a document path has an even number of segments, a
//      collection path an odd one; `data/users/me/…` is the one viewer's own subtree,
//      `data/users/owner/…`
// D13: a document body is a plain JSON object of at most 256 KiB and 32 levels; an
//      update merges nested objects, replaces anything else — arrays included — whole,
//      and removes a field given as {"__delete__": true}, which a set refuses and an
//      array never holds
// D14: a write moves its document's version on by one, from 1; pinned to a version the
//      document is not at, it writes nothing and says where the document is; update and
//      str_replace need the document, and str_replace its text exactly once unless
//      replace_all; a batch lands whole or not at all, naming the entry that refused,
//      and addresses a document once; document 5,001 is quota_exceeded; deleting what is
//      not there changes nothing
// D15: a query reads one collection: filters on top-level fields (==, !=, <, <=, >, >=,
//      in, not-in, array-contains; eq, ne, lt, lte, gt, gte mean the same), one orderBy
//      with a document missing the field last, else the id's order, a limit of 1–1000,
//      and a cursor where the next page starts; a range never matches across types; at
//      most ten filters and thirty `in` values
// D16: a lease is set-if-not-busy: granted on a free document — created when absent, its
//      `data` merged in — and again to its own holder; anyone else is told only when it
//      ends; its length is clamped to 1 s – 10 min around a default of 30 s; an expired
//      lease is free, a renewal without data leaves the version, and a plain write
//      leaves the lease standing
// D17: an upload is one of eighteen exact media types — a parameter, an alias, or no
//      type at all is refused — never empty, at most 20 MiB, 16 MiB for CSS and
//      JavaScript, 2 MiB for SVG; a text type is UTF-8, byte-order mark allowed, and the
//      four data types are otherwise stored as given, while a stylesheet or a script may
//      not open with markup or carry binary content, and no binary type opens with
//      markup; an artifact holds 1,000 assets and 256 MiB; a delete names an id or the
//      url it was handed, and nothing else
// D18: an SVG is stored sanitised: script, foreignObject, style, link and animation
//      elements go with all they hold, as do event handlers, javascript: and data: URLs
//      however they are spelled, a <use> that points out of the file, comments,
//      instructions and the doctype; the drawing, its text and its local references
//      stay; a body that is no SVG document is refused
// D19: on an artifact made from a type the paths it came with are read-only: a publish
//      naming one — to replace it or to remove it, the page `index.html` included — is
//      refused whole as `read_only_path`, naming the paths, before any other rule
//      speaks; every other path is laid over as ever, and without a type nothing is
//      read-only

import { describe, expect, test } from "bun:test";

import {
  acceptUpload,
  assetIdOf,
  type AssetRecord,
  assetUsage,
  sanitizeSvg,
} from "@ext/artifacts/src/domain/assets";
import {
  declarationProblem,
  nextDeclaration,
  servedCapabilities,
  unservedCapabilities,
} from "@ext/artifacts/src/domain/capabilities";
import { parseConfig } from "@ext/artifacts/src/domain/config";
import {
  acquireLease,
  applyWrites,
  bodyProblem,
  type DbFile,
  dbPathProblem,
  type DbRefusal,
  type DbWrite,
  mergeBody,
  readDocument,
  resolveDbPath,
  runQuery,
} from "@ext/artifacts/src/domain/db";
import { envelope } from "@ext/artifacts/src/domain/envelope";
import {
  changedFiles,
  failedPreconditions,
  isRefusal,
  pathProblem,
  planFiles,
  typeFromPath,
} from "@ext/artifacts/src/domain/files";
import { ICON_RE, iconGlyph } from "@ext/artifacts/src/domain/icons";
import {
  frameHost,
  framePath,
  SLUG_RE,
  slugForSourcePath,
  slugFromFrameHost,
  slugFromRef,
} from "@ext/artifacts/src/domain/protocol";
import { expiredLogDates, isExpired, localIso } from "@ext/artifacts/src/domain/retention";
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
  test("D2 log time is local wall clock with its offset", () => {
    const at = new Date("2026-09-19T23:22:36.062Z");
    expect(localIso(at, 480)).toBe("2026-09-20T07:22:36.062+08:00");
    expect(localIso(at, -210)).toBe("2026-09-19T19:52:36.062-03:30");
    expect(localIso(at, 0)).toBe("2026-09-19T23:22:36.062+00:00");
    for (const offset of [480, -210, 0, 345])
      expect(Date.parse(localIso(at, offset))).toBe(at.getTime());
    // the default is this process's own zone
    expect(Date.parse(localIso(at))).toBe(at.getTime());
  });
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
  test("D3 defaults: port 5834, 14 days, wake delivery, an origin per page", () => {
    const c = parseConfig(undefined);
    expect(c.port).toBe(5834);
    expect(c.retentionDays).toBe(14);
    expect(c.delivery).toBe("wake");
    expect(c.isolation).toBe("origin");
  });
  test.each([
    ["sandbox", "sandbox"],
    ["origin", "origin"],
    ["none", "origin"],
    [true, "origin"],
  ])("D3 isolation %j → %s", (value, expected) => {
    expect(parseConfig({ isolation: value }).isolation).toBe(expected as "origin" | "sandbox");
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

describe("D7 a slug is a DNS label", () => {
  test.each([
    ["plan", true],
    ["tide-table-2", true],
    ["7", true],
    ["a".repeat(63), true],
    ["a".repeat(64), false],
    ["-plan", false],
    ["plan-", false],
    ["Plan", false],
    ["tide_table", false],
    ["a.b", false],
    ["", false],
  ])("D7 %j is a slug: %p", (candidate, valid) => {
    expect(SLUG_RE.test(candidate)).toBe(valid);
  });
  test("D7 what is not a label names no artifact, as a path or as a reference", () => {
    expect(slugForSourcePath(".pi/artifacts/tide-table/page.html")).toBe("tide-table");
    expect(slugForSourcePath(".pi/artifacts/tide-table-/page.html")).toBeNull();
    expect(slugFromRef("http://localhost:5834/a/tide-table?t=abc")).toBe("tide-table");
    expect(slugFromRef(`/a/${"a".repeat(64)}`)).toBeNull();
  });
  test.each([
    ["plan.localhost:5834", "plan"],
    ["localhost:5834", null],
    ["plan.localhost:9999", null],
    ["plan.localhost", null],
    ["plan.example:5834", null],
    ["a.b.localhost:5834", null],
    ["-plan.localhost:5834", null],
    [".localhost:5834", null],
  ])("D7 Host %j names the slug %j", (host, slug) => {
    expect(slugFromFrameHost(host, 5834)).toBe(slug);
  });
  test("D7 a frame lives at <slug>.localhost:<port>/_f/<cap>/<version>/", () => {
    expect(frameHost("plan", 5834)).toBe("plan.localhost:5834");
    expect(slugFromFrameHost(frameHost("plan", 5834), 5834)).toBe("plan");
    expect(framePath("c".repeat(32), 3)).toBe(`/_f/${"c".repeat(32)}/3/`);
  });
});

describe("D8 an icon is one generic word", () => {
  test.each([
    ["chart", true],
    ["line-chart2", true],
    ["ab", true],
    ["a".repeat(24), true],
    ["a".repeat(25), false],
    ["a", false],
    ["Chart", false],
    ["2d", false],
    ["bar chart", false],
    ["📊", false],
    ["", false],
  ])("D8 %j is an icon: %p", (candidate, valid) => {
    expect(ICON_RE.test(candidate)).toBe(valid);
  });
  test("D8 a known word has its glyph; any other word, and none, share the neutral one", () => {
    const neutral = iconGlyph(undefined);
    expect(iconGlyph("chart")).not.toBe(neutral);
    expect(iconGlyph("camera")).not.toBe(iconGlyph("chart"));
    expect(iconGlyph("zeppelin")).toBe(neutral);
    expect(iconGlyph("🖼️")).toBe(neutral);
    // Never a lookup into what every object inherits.
    expect(iconGlyph("constructor")).toBe(neutral);
  });
});

describe("D9 supporting files", () => {
  const MIB = 1024 * 1024;
  const record = (bytes: number) => ({ sha256: "0".repeat(64), contentType: "text/css", bytes });

  test.each([
    ["style.css", true],
    ["data/2026/rows.json", true],
    ["docs/index.html", true],
    ["a b/ünï.png", true],
    ["", false],
    ["/style.css", false],
    ["..\\style.css", false],
    ["../style.css", false],
    ["data/../../style.css", false],
    ["./style.css", false],
    ["data//rows.json", false],
    ["data/", false],
    ["tab\there.css", false],
    ["index.html", false],
    ["preflight.js", false],
    ["a".repeat(513), false],
  ])("D9 %j is a published path: %p", (path, valid) => {
    expect(pathProblem(path) === null).toBe(valid);
  });
  test.each([
    ["app.mjs", "text/javascript"],
    ["Photo.JPG", "image/jpeg"],
    ["fonts/inter.woff2", "font/woff2"],
    ["site.webmanifest", "application/manifest+json"],
    ["rows.csv", null],
    ["Makefile", null],
    [".htaccess", null],
  ])("D9 the type of %j is %j", (path, type) => {
    expect(typeFromPath(path)).toBe(type);
  });
  test("D9 named paths replace, null removes, the rest are kept; removing what is not there is nothing", () => {
    const current = { "a.css": record(10), "b.css": record(20), "c.css": record(30) };
    const plan = planFiles(current, {
      "b.css": { bytes: 5 },
      "c.css": null,
      "ghost.css": null,
      "rows.csv": { bytes: 7, contentType: "text/csv" },
    });
    expect(plan).toEqual({
      kept: { "a.css": record(10) },
      written: { "b.css": "text/css", "rows.csv": "text/csv" },
      removed: ["c.css"],
    });
  });
  test.each([
    ["an extension nobody knows, with no type", { "rows.csv": { bytes: 1 } }, "invalid_content"],
    [
      "a type with parameters",
      { "a.txt": { bytes: 1, contentType: "text/plain; charset=utf-8" } },
      "invalid_content",
    ],
    [
      "a type no browser is served",
      { "a.bin": { bytes: 1, contentType: "multipart/form-data" } },
      "invalid_content",
    ],
    ["a reserved path", { "index.html": { bytes: 1 } }, "invalid_content"],
    ["a text file over 16 MiB", { "a.json": { bytes: 16 * MIB + 1 } }, "too_large"],
    ["a binary file over 15 MiB", { "a.png": { bytes: 15 * MIB + 1 } }, "too_large"],
  ])("D9 %s is refused", (_name, changes, code) => {
    const plan = planFiles({}, changes);
    expect(isRefusal(plan) && plan.code).toBe(code as "invalid_content" | "too_large");
  });
  test("D9 the limits admit their own edge: 16 MiB of text, 15 MiB of binary, 255 files, 64 MiB", () => {
    expect(isRefusal(planFiles({}, { "a.json": { bytes: 16 * MIB } }))).toBe(false);
    expect(isRefusal(planFiles({}, { "a.png": { bytes: 15 * MIB } }))).toBe(false);
    const many = (n: number) =>
      Object.fromEntries(Array.from({ length: n }, (_, k) => [`f${k}.css`, { bytes: 1 }]));
    expect(isRefusal(planFiles({}, many(255)))).toBe(false);
    expect(planFiles({}, many(256))).toMatchObject({ code: "too_large" });
    // What is kept counts too: four 16 MiB files fill a version, one more byte overflows it.
    const full = Object.fromEntries([1, 2, 3, 4].map((k) => [`k${k}.css`, record(16 * MIB)]));
    expect(planFiles(full, { "one.css": { bytes: 1 } })).toMatchObject({ code: "too_large" });
    expect(isRefusal(planFiles(full, { "k1.css": { bytes: 16 * MIB } }))).toBe(false);
    expect(isRefusal(planFiles(full, { "k1.css": null, "one.css": { bytes: 1 } }))).toBe(false);
  });
});

describe("D10 declaring capabilities", () => {
  test.each([
    ["nothing", {}, true],
    ["what this host serves", { artifact: {}, comments: { composer_only: true } }, true],
    ["Claude Code's services it cannot serve", { mcp: {}, room: {}, sample: {}, user: {} }, true],
    ["the capability's former name", { self: {} }, true],
    ["a name nobody knows", { telepathy: {} }, false],
    ["the built-in", { permissions: {} }, false],
    ["this platform's own reply", { reply: {} }, false],
    ["a name every object inherits", { constructor: {} }, false],
    ["Claude Code's `true` for a config with nothing to say", { downloads: true }, true],
    ["a config that is neither an object nor true", { downloads: false }, false],
    ["a config that is a word", { downloads: "yes" }, false],
    ["a list", ["downloads"], false],
    ["null", null, false],
  ])("D10 declaring %s is accepted: %p", (_name, declaration, accepted) => {
    expect(declarationProblem(declaration) === null).toBe(accepted);
  });
  test("D10 a refusal names the capability it refuses", () => {
    expect(declarationProblem({ downloads: {}, telepathy: {} })).toContain("telepathy");
  });
  test("D10 omitted keeps, {} clears, anything else replaces the whole declaration", () => {
    const stored = { artifact: {}, downloads: {} };
    expect(nextDeclaration(stored, undefined)).toEqual(stored);
    expect(nextDeclaration(stored, {})).toEqual({});
    expect(nextDeclaration(stored, { comments: {} })).toEqual({ comments: {} });
    expect(nextDeclaration(stored, { downloads: true, db: { rules: {} } })).toEqual({
      downloads: {},
      db: { rules: {} },
    });
    expect(nextDeclaration(undefined, undefined)).toEqual({});
  });
  test("D10 a page is served the built-in, reply with an island, and what it declared that runs here", () => {
    const declared = { comments: { composer_only: true }, mcp: { servers: ["x"] }, user: {} };
    expect(servedCapabilities(declared, true)).toEqual({
      permissions: {},
      reply: {},
      comments: { composer_only: true },
    });
    expect(servedCapabilities({}, false)).toEqual({ permissions: {} });
    expect(unservedCapabilities(declared)).toEqual(["mcp", "user"]);
    expect(unservedCapabilities({ artifact: {}, downloads: {} })).toEqual([]);
  });
});

describe("D11 per-file preconditions", () => {
  const file = (sha256: string) => ({ sha256, contentType: "text/plain", bytes: 1 });
  const current = { "a.txt": file("aa"), "b.txt": file("bb") };

  test("D11 a pin holds on the same hash, and on null where no file stands", () => {
    expect(failedPreconditions(current, { "a.txt": "aa", "new.txt": null })).toEqual([]);
  });
  test("D11 a pin fails on another hash, a missing file, or a file where none was expected", () => {
    expect(
      failedPreconditions(current, { "a.txt": "old", "gone.txt": "gg", "b.txt": null }),
    ).toEqual([
      { path: "a.txt", expected: "old", actual: "aa" },
      { path: "gone.txt", expected: "gg", actual: null },
      { path: "b.txt", expected: null, actual: "bb" },
    ]);
  });
  test("D11 what others changed: differing, added and removed paths, outside the named ones", () => {
    const base = { "a.txt": file("aa"), "b.txt": file("bb"), "c.txt": file("cc") };
    const now = {
      "a.txt": file("aa"),
      "b.txt": file("b2"),
      "d.txt": file("dd"),
      "e.txt": file("ee"),
    };
    expect(changedFiles(base, now, ["e.txt"])).toEqual([
      { path: "b.txt", sha256: "b2" },
      { path: "c.txt", sha256: null },
      { path: "d.txt", sha256: "dd" },
    ]);
    expect(changedFiles(base, base, [])).toEqual([]);
  });
});

const AT = "2026-01-01T00:00:00.000Z";
const set = (path: string, data: unknown, ifVersion?: unknown): DbWrite => ({
  op: "set",
  path,
  data,
  ifVersion,
});
/** Writes that must land, and the database they leave. */
const landed = (file: DbFile, writes: DbWrite[], at = AT) => {
  const out = applyWrites(file, writes, at);
  if ("code" in out) throw new Error(out.message);
  return out;
};
const refusedBy = (file: DbFile, writes: DbWrite[]) => applyWrites(file, writes, AT) as DbRefusal;
const bodyAt = (file: DbFile, path: string) => {
  const doc = readDocument(file, path);
  return "code" in doc ? doc.code : doc.exists ? { data: doc.data, version: doc.version } : null;
};

describe("D12 database paths", () => {
  const deep = (segments: number) => Array.from({ length: segments }, (_, k) => `s${k}`).join("/");
  test.each([
    ["tasks/t1", "document", true],
    ["boards/b1/columns/c2", "document", true],
    ["a_b-c.d~e:f@g+h/x.y", "document", true],
    ["tasks", "collection", true],
    ["boards/b1/columns", "collection", true],
    ["data/users/owner", "collection", true],
    [`tasks/${"a".repeat(200)}`, "document", true],
    [deep(16), "document", true],
    ["tasks", "document", false],
    ["tasks/t1", "collection", false],
    ["data/users/owner/decks", "collection", false],
    ["", "collection", false],
    ["tasks//t1", "collection", false],
    ["tasks/t1/", "collection", false],
    ["tasks/./x/y", "document", false],
    ["tasks/../x/y", "document", false],
    ["tasks/t 1", "document", false],
    ["tâsks/t1", "document", false],
    ["tasks/t1?x", "document", false],
    ["tasks/__name__", "document", false],
    ["__proto__/x", "document", false],
    [`tasks/${"a".repeat(201)}`, "document", false],
    [deep(18), "document", false],
    [Array.from({ length: 6 }, () => "a".repeat(199)).join("/"), "document", false],
    [7, "document", false],
  ])("D12 %j is a %s path: %p", (path, kind, valid) => {
    expect(dbPathProblem(path, kind as "document" | "collection") === null).toBe(valid);
  });
  test("D12 a parity refusal says how many segments the path has", () => {
    expect(dbPathProblem("data/users/owner/decks", "collection")).toMatch(/\b4 segments/);
    expect(dbPathProblem("tasks", "document")).toMatch(/\b1 segments/);
  });
  test("D12 data/users/me is the one viewer's subtree, and nothing else is rewritten", () => {
    expect(resolveDbPath("data/users/me/profile")).toBe("data/users/owner/profile");
    expect(resolveDbPath("data/users/me")).toBe("data/users/owner");
    for (const path of ["data/users/meg/profile", "teams/users/me/x", "data/me/users/x"])
      expect(resolveDbPath(path)).toBe(path);
    const { file, changed } = landed({}, [set("data/users/me/profile", { theme: "dark" })]);
    expect(changed).toEqual(["data/users/owner/profile"]);
    expect(bodyAt(file, "data/users/owner/profile")).toEqual({
      data: { theme: "dark" },
      version: 1,
    });
    expect(bodyAt(file, "data/users/me/profile")).toMatchObject({ version: 1 });
  });
});

describe("D13 document bodies", () => {
  const gone = { __delete__: true };
  const nested = (levels: number) => {
    let value: unknown = 1;
    for (let k = 0; k < levels; k += 1) value = { n: value };
    return value;
  };
  test.each([
    ["a plain object", { a: 1, b: [1, { c: null }], d: { e: "x" } }, true],
    ["an empty object", {}, true],
    ["32 levels", nested(32), true],
    ["exactly 256 KiB", { t: "x".repeat(256 * 1024 - 8) }, true],
    ["an array", [1], false],
    ["a string", "x", false],
    ["null", null, false],
    ["33 levels", nested(33), false],
    ["one byte over 256 KiB", { t: "x".repeat(256 * 1024 - 7) }, false],
    ["a __proto__ field", JSON.parse('{"a": {"__proto__": {"x": 1}}}'), false],
  ])("D13 %s is a body: %p", (_name, data, valid) => {
    expect(bodyProblem(data, false) === null).toBe(valid);
  });
  test("D13 the sentinel is an update's, at any depth; a set and an array refuse it", () => {
    expect(bodyProblem({ a: gone, b: { c: gone } }, true)).toBeNull();
    expect(bodyProblem({ a: gone }, false)).toMatch(/update/);
    expect(bodyProblem({ list: [gone] }, true)).toMatch(/array/);
    expect(bodyProblem({ list: [{ deep: gone }] }, true)).toMatch(/array/);
    // Only that exact object is the sentinel: anything else with the key is data.
    expect(bodyProblem({ a: { __delete__: true, b: 1 }, c: { __delete__: false } }, false)).toBe(
      null,
    );
  });
  test("D13 an update merges objects, replaces everything else whole, and removes what the sentinel names", () => {
    const current = { a: 1, o: { x: 1, y: { z: 1 } }, list: [1, 2], old: 1 };
    const patch = { o: { y: { w: 2 }, x: gone }, list: [3], old: gone, fresh: { k: gone, v: 1 } };
    expect(mergeBody(current, patch)).toEqual({
      a: 1,
      o: { y: { z: 1, w: 2 } },
      list: [3],
      fresh: { v: 1 },
    });
    expect(mergeBody({ a: 1, b: { c: 1 } }, { a: { d: 1 }, b: 2 })).toEqual({ a: { d: 1 }, b: 2 });
    expect(current).toEqual({ a: 1, o: { x: 1, y: { z: 1 } }, list: [1, 2], old: 1 });
  });
});

describe("D14 writes", () => {
  test("D14 each write moves the version on by one; a deleted document starts again at 1", () => {
    let file = landed({}, [set("tasks/t1", { title: "draft the plan", done: false })]).file;
    expect(bodyAt(file, "tasks/t1")).toEqual({
      data: { title: "draft the plan", done: false },
      version: 1,
    });
    file = landed(file, [set("tasks/t1", { title: "draft the plan" })]).file;
    expect(bodyAt(file, "tasks/t1")).toEqual({ data: { title: "draft the plan" }, version: 2 });
    file = landed(file, [{ op: "update", path: "tasks/t1", data: { done: true } }]).file;
    expect(bodyAt(file, "tasks/t1")).toEqual({
      data: { title: "draft the plan", done: true },
      version: 3,
    });
    const edited = landed(file, [
      { op: "str_replace", path: "tasks/t1", field: "title", oldStr: "draft", newStr: "ship" },
    ]);
    expect(edited.written).toEqual([{ path: "tasks/t1", version: 4 }]);
    expect(bodyAt(edited.file, "tasks/t1")).toMatchObject({ data: { title: "ship the plan" } });
    const removed = landed(edited.file, [{ op: "delete", path: "tasks/t1" }]);
    expect(removed.written).toEqual([{ path: "tasks/t1", version: null }]);
    expect(removed.file).toEqual({});
    expect(bodyAt(landed(removed.file, [set("tasks/t1", {})]).file, "tasks/t1")).toEqual({
      data: {},
      version: 1,
    });
  });
  test("D14 a pinned write lands on its version and nowhere else", () => {
    const file = landed(landed({}, [set("tasks/t1", { n: 1 })]).file, [
      set("tasks/t1", { n: 2 }),
    ]).file;
    expect(landed(file, [set("tasks/t1", { n: 3 }, 2)]).written[0]?.version).toBe(3);
    expect(landed(file, [{ op: "delete", path: "tasks/t1", ifVersion: 2 }]).file).toEqual({});
    const moved = refusedBy(file, [set("tasks/t1", { n: 3 }, 1)]);
    expect(moved).toMatchObject({ code: "conflict", current: 2, path: "tasks/t1" });
    expect(moved.message).toMatch(/version 2\b/);
    expect(refusedBy(file, [set("tasks/new", {}, 1)])).toMatchObject({
      code: "conflict",
      current: null,
    });
    for (const pin of [0, -1, 1.5, "2", null])
      expect([pin, refusedBy(file, [set("tasks/t1", {}, pin)]).code]).toEqual([
        pin,
        "invalid_argument",
      ]);
  });
  test("D14 update and str_replace need the document; str_replace needs its text exactly once", () => {
    const file = landed({}, [set("notes/n1", { html: "<p>a</p><p>a</p><p>b</p>", count: 2 })]).file;
    const edit = (over: Record<string, unknown>, path = "notes/n1") =>
      applyWrites(
        file,
        [{ op: "str_replace", path, field: "html", oldStr: "<p>b</p>", newStr: "", ...over }],
        AT,
      );
    const html = (out: ReturnType<typeof edit>) => {
      if ("code" in out) return out.code;
      const doc = readDocument(out.file, "notes/n1");
      return "code" in doc ? doc.code : doc.data?.html;
    };
    expect(html(edit({}))).toBe("<p>a</p><p>a</p>");
    expect(html(edit({ oldStr: "<p>a</p>", newStr: "<p>c</p>", replaceAll: true }))).toBe(
      "<p>c</p><p>c</p><p>b</p>",
    );
    const twice = edit({ oldStr: "<p>a</p>" }) as DbRefusal;
    expect([twice.code, /not unique/.test(twice.message)]).toEqual(["invalid_argument", true]);
    const absent = edit({ oldStr: "<p>z</p>", replaceAll: true }) as DbRefusal;
    expect([absent.code, /does not occur/.test(absent.message)]).toEqual([
      "invalid_argument",
      true,
    ]);
    for (const over of [
      { field: "count" },
      { field: "ghost" },
      { field: "a.b" },
      { field: "__name__" },
      { field: 7 },
      { oldStr: "" },
      { newStr: 7 },
    ])
      expect([over, html(edit(over))]).toEqual([over, "invalid_argument"]);
    expect(html(edit({}, "notes/ghost"))).toBe("invalid_argument");
    expect(refusedBy(file, [{ op: "update", path: "notes/ghost", data: { a: 1 } }]).code).toBe(
      "invalid_argument",
    );
    expect(refusedBy(file, [set("notes/n1", [1])]).code).toBe("invalid_argument");
  });
  test("D14 a batch lands whole or not at all, and names the entry that refused", () => {
    const file = landed({}, [set("tasks/t1", { n: 1 }), set("tasks/t2", { n: 1 })]).file;
    const before = JSON.stringify(file);
    const out = landed(file, [
      set("tasks/t3", { n: 1 }),
      { op: "update", path: "tasks/t1", data: { n: 2 }, ifVersion: 1 },
      { op: "delete", path: "tasks/t2" },
      { op: "delete", path: "tasks/ghost" },
    ]);
    expect(out.written).toEqual([
      { path: "tasks/t3", version: 1 },
      { path: "tasks/t1", version: 2 },
      { path: "tasks/t2", version: null },
      { path: "tasks/ghost", version: null },
    ]);
    expect(out.changed).toEqual(["tasks/t3", "tasks/t1", "tasks/t2"]);
    expect(Object.keys(out.file.tasks ?? {}).sort()).toEqual(["t1", "t3"]);
    const refused: Array<[string, DbWrite[], Partial<DbRefusal>]> = [
      [
        "a pin that no longer holds",
        [set("tasks/t9", {}), set("tasks/t1", {}, 7)],
        { code: "conflict", entry: 1, current: 1 },
      ],
      [
        "a body that is no object",
        [set("tasks/t9", {}), set("tasks/t8", "x")],
        { code: "invalid_argument", entry: 1 },
      ],
      [
        "a path that is no document",
        [set("tasks", {}), set("tasks/t9", {})],
        { code: "invalid_argument", entry: 0 },
      ],
      [
        "a document addressed twice",
        [set("tasks/t9", {}), { op: "delete", path: "tasks/t9" }],
        { code: "invalid_argument", entry: 1 },
      ],
      [
        "one document under both its names",
        [set("data/users/me/p", {}), set("data/users/owner/p", {})],
        { code: "invalid_argument", entry: 1 },
      ],
    ];
    for (const [name, writes, refusal] of refused)
      expect([name, refusedBy(file, writes)]).toEqual([name, expect.objectContaining(refusal)]);
    expect(JSON.stringify(file)).toBe(before);
    const many = (n: number) => Array.from({ length: n }, (_, k) => set(`bulk/d${k}`, {}));
    expect(landed(file, many(50)).written).toHaveLength(50);
    expect(refusedBy(file, many(51)).code).toBe("invalid_argument");
    expect(refusedBy(file, []).code).toBe("invalid_argument");
  });
  test("D14 document 5,001 is refused; a full database still takes writes to what it holds", () => {
    const docs = Object.fromEntries(
      Array.from({ length: 2500 }, (_, k) => [`d${k}`, { data: {}, version: 1, updatedAt: AT }]),
    );
    const fullFile: DbFile = { a: docs, "a/d0/b": docs };
    expect(refusedBy(fullFile, [set("a/new", {})]).code).toBe("quota_exceeded");
    expect(landed(fullFile, [set("a/d1", { n: 1 })]).written).toEqual([
      { path: "a/d1", version: 2 },
    ]);
    expect(
      landed(fullFile, [{ op: "delete", path: "a/d1" }, set("a/new", {})]).written,
    ).toHaveLength(2);
  });
});

describe("D15 queries", () => {
  const people = landed({}, [
    set("people/ann", { age: 31, team: "red", tags: ["a", "b"], meta: { b: 2, a: 1 } }),
    set("people/bob", { age: 25, team: "blue", tags: ["b"] }),
    set("people/cy", { age: 40, team: "red", tags: [], nick: "c" }),
    set("people/di", { team: "blue" }),
    set("people/ed", { age: "old", team: "blue" }),
    set("people/ann/pets/rex", { kind: "dog" }),
  ]).file;
  const ids = (query?: unknown, collection = "people"): string | string[] => {
    const out = runQuery(people, collection, query);
    return "code" in out ? out.code : out.docs.map((doc) => doc.id);
  };

  test.each([
    ["no query: the id's order", undefined, ["ann", "bob", "cy", "di", "ed"]],
    ["==", { where: [["team", "==", "red"]] }, ["ann", "cy"]],
    ["eq, the same", { where: [["team", "eq", "red"]] }, ["ann", "cy"]],
    [
      "== on an object, whatever its key order",
      { where: [["meta", "==", { a: 1, b: 2 }]] },
      ["ann"],
    ],
    ["!=", { where: [["team", "ne", "blue"]] }, ["ann", "cy"]],
    ["!= never matches a document without the field", { where: [["nick", "!=", "x"]] }, ["cy"]],
    ["> on numbers leaves the string out", { where: [["age", ">", 25]] }, ["ann", "cy"]],
    [">=", { where: [["age", "gte", 25]] }, ["ann", "bob", "cy"]],
    ["<", { where: [["age", "<", 31]] }, ["bob"]],
    ["<=", { where: [["age", "lte", 31]] }, ["ann", "bob"]],
    ["a range on strings leaves the numbers out", { where: [["age", ">", "a"]] }, ["ed"]],
    ["in", { where: [["age", "in", [25, 40, "young"]]] }, ["bob", "cy"]],
    ["not-in", { where: [["team", "not-in", ["red"]]] }, ["bob", "di", "ed"]],
    ["array-contains", { where: [["tags", "array-contains", "b"]] }, ["ann", "bob"]],
    [
      "two filters",
      {
        where: [
          ["team", "==", "red"],
          ["age", ">", 35],
        ],
      },
      ["cy"],
    ],
    ["a name every object inherits is no field", { where: [["constructor", "!=", 1]] }, []],
    ["orderBy, missing last", { orderBy: { field: "age" } }, ["bob", "ann", "cy", "ed", "di"]],
    [
      "orderBy desc, missing still last",
      { orderBy: { field: "age", direction: "desc" } },
      ["ed", "cy", "ann", "bob", "di"],
    ],
    ["a limit", { orderBy: { field: "age" }, limit: 2 }, ["bob", "ann"]],
  ])("D15 %s", (_name, query, expected) => {
    expect(ids(query)).toEqual(expected);
  });
  test("D15 a subcollection is its own collection", () => {
    expect(ids(undefined, "people/ann/pets")).toEqual(["rex"]);
    expect(ids(undefined, "people/nobody/pets")).toEqual([]);
  });
  test("D15 a cursor walks the whole order once, and the last page has none", () => {
    for (const orderBy of [undefined, { field: "age" }, { field: "team", direction: "desc" }]) {
      const seen: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 10; page += 1) {
        const out = runQuery(people, "people", { orderBy, limit: 2, cursor });
        if ("code" in out) throw new Error(out.message);
        seen.push(...out.docs.map((doc) => doc.id));
        if (out.nextCursor === null) break;
        cursor = out.nextCursor;
      }
      expect({ orderBy, seen }).toEqual({ orderBy, seen: ids({ orderBy }) as string[] });
    }
    const whole = runQuery(people, "people", { limit: 5 });
    expect("code" in whole ? whole.code : whole.nextCursor).toBeNull();
  });
  test.each([
    ["eleven filters", { where: Array.from({ length: 11 }, () => ["age", ">", 1]) }],
    ["thirty-one in values", { where: [["age", "in", Array.from({ length: 31 }, (_, k) => k)]] }],
    ["an empty in", { where: [["age", "in", []]] }],
    ["an in that is no list", { where: [["age", "not-in", 25]] }],
    ["an unknown operator", { where: [["age", "~=", 25]] }],
    ["a filter that is no triple", { where: [["age", ">"]] }],
    ["two orders", { orderBy: [{ field: "age" }, { field: "team" }] }],
    ["a direction that is neither", { orderBy: { field: "age", direction: "up" } }],
    ["limit 0", { limit: 0 }],
    ["limit 1001", { limit: 1001 }],
    ["a fractional limit", { limit: 1.5 }],
    ["a cursor nobody issued", { cursor: "garbage" }],
    ["a query that is a list", [["age", ">", 1]]],
  ])("D15 %s is invalid_argument", (_name, query) => {
    expect(ids(query)).toBe("invalid_argument");
  });
  test("D15 a document path is no collection", () => {
    expect(ids(undefined, "people/ann")).toBe("invalid_argument");
  });
});

describe("D16 leases", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const after = (ms: number) => new Date(now.getTime() + ms);
  const iso = (ms: number) => after(ms).toISOString();
  const acquire = (
    file: DbFile,
    options: { holder: unknown; ttlMs?: unknown; data?: unknown },
    at = now,
    path: unknown = "locks/editor",
  ) => {
    const out = acquireLease(file, path, options, at);
    if ("code" in out) throw new Error(out.message);
    return out;
  };

  test("D16 a free document is granted: created when absent, data merged in", () => {
    const first = acquire({}, { holder: "tab-a" });
    expect(first.result).toEqual({
      acquired: true,
      version: 1,
      expiresAt: iso(30_000),
      holder: "tab-a",
    });
    expect(first.changed).toEqual(["locks/editor"]);
    expect(bodyAt(first.file, "locks/editor")).toEqual({ data: {}, version: 1 });
    const seeded = landed({}, [set("locks/editor", { doc: "plan", by: null })]).file;
    const claimed = acquire(seeded, { holder: "tab-a", data: { by: "ann" } });
    expect(claimed.result).toMatchObject({ acquired: true, version: 2 });
    expect(bodyAt(claimed.file, "locks/editor")).toEqual({
      data: { doc: "plan", by: "ann" },
      version: 2,
    });
  });
  test("D16 anyone else is busy and learns only when; the holder renews; an expired lease is free", () => {
    const held = acquire({}, { holder: "tab-a", ttlMs: 60_000 }).file;
    const busy = acquire(held, { holder: "tab-b", data: { by: "bob" } }, after(59_999));
    expect(busy.result).toEqual({ acquired: false, expiresAt: iso(60_000) });
    expect([busy.file, busy.changed]).toEqual([held, []]);
    const renewed = acquire(held, { holder: "tab-a", ttlMs: 60_000 }, after(30_000));
    expect(renewed.result).toEqual({
      acquired: true,
      version: 1,
      expiresAt: iso(90_000),
      holder: "tab-a",
    });
    expect(renewed.changed).toEqual([]);
    const taken = acquire(held, { holder: "tab-b" }, after(60_000));
    expect(taken.result).toMatchObject({ acquired: true, holder: "tab-b" });
  });
  test.each([
    [undefined, 30_000],
    [0, 30_000],
    [-5, 30_000],
    ["60000", 30_000],
    [5, 1000],
    [45_000, 45_000],
    [9e9, 600_000],
  ])("D16 ttlMs %j is a lease of %d ms", (ttlMs, length) => {
    expect(acquire({}, { holder: "tab-a", ttlMs }).result.expiresAt).toBe(iso(length));
  });
  test("D16 a plain write leaves the lease standing", () => {
    const held = acquire({}, { holder: "tab-a" }).file;
    const written = landed(held, [set("locks/editor", { by: "someone else" })]).file;
    expect(acquire(written, { holder: "tab-b" }, after(1000)).result.acquired).toBe(false);
    expect(bodyAt(written, "locks/editor")).toEqual({ data: { by: "someone else" }, version: 2 });
  });
  test.each([
    ["no holder", { holder: undefined }, "locks/editor"],
    ["an empty holder", { holder: "" }, "locks/editor"],
    ["a holder that is no string", { holder: 7 }, "locks/editor"],
    ["data that is no object", { holder: "tab-a", data: [1] }, "locks/editor"],
    ["a collection path", { holder: "tab-a" }, "locks"],
  ])("D16 %s is invalid_argument and leases nothing", (_name, options, path) => {
    expect(acquireLease({}, path, options, now)).toMatchObject({ code: "invalid_argument" });
  });
});

const bytesOf = (text: string) => new TextEncoder().encode(text);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
/** What an upload is accepted as — its type and stored size — or the code that refuses it. */
const accepted = (
  bytes: Uint8Array,
  type: unknown,
  held: AssetRecord[] = [],
): string | [type: string, bytes: number] => {
  const out = acceptUpload(bytes, type, held);
  return "code" in out ? out.code : [out.contentType, out.bytes.byteLength];
};

describe("D17 what an upload may be", () => {
  const MIB = 1024 * 1024;
  test.each([
    ["image/png", PNG],
    ["image/jpeg", PNG],
    ["image/gif", PNG],
    ["image/webp", PNG],
    ["video/mp4", PNG],
    ["video/webm", PNG],
    ["application/pdf", bytesOf("%PDF-1.7")],
    ["font/woff2", PNG],
    ["font/woff", PNG],
    ["font/ttf", PNG],
    ["font/otf", PNG],
    ["text/csv", bytesOf("a,b\n1,2\n")],
    ["text/markdown", bytesOf("<!-- opens with a comment -->\n# Notes")],
    ["application/json", bytesOf('{"a": 1}')],
    ["text/plain", bytesOf("<b>never inspected</b>")],
    ["text/css", bytesOf("body{margin:0}")],
    ["text/javascript", bytesOf("window.ok = 1;")],
  ])("D17 %s is accepted and stored as given", (type, bytes) => {
    expect(accepted(bytes, type)).toEqual([type, bytes.byteLength]);
  });
  test.each([
    ["a parameter", "text/csv;charset=utf-8", "unsupported_type"],
    ["an alias", "application/javascript", "unsupported_type"],
    ["a platform alias", "application/vnd.ms-excel", "unsupported_type"],
    ["a type outside the set", "text/html", "unsupported_type"],
    ["another case", "Image/PNG", "unsupported_type"],
    ["no type", "", "invalid_request"],
    ["a type that is no string", 7, "invalid_request"],
  ])("D17 %s is refused: %j → %s", (_name, type, code) => {
    expect(accepted(PNG, type)).toBe(code);
  });
  test("D17 never empty, and each type's own size limit admits its edge", () => {
    expect(accepted(new Uint8Array(0), "image/png")).toBe("invalid_request");
    const sized = (n: number) => new Uint8Array(n).fill(0x61);
    expect(accepted(sized(20 * MIB), "image/png")).toEqual(["image/png", 20 * MIB]);
    expect(accepted(sized(20 * MIB + 1), "image/png")).toBe("too_large");
    expect(accepted(sized(16 * MIB), "text/css")).toEqual(["text/css", 16 * MIB]);
    expect(accepted(sized(16 * MIB + 1), "text/javascript")).toBe("too_large");
    expect(accepted(sized(16 * MIB + 1), "text/plain")).toEqual(["text/plain", 16 * MIB + 1]);
    expect(accepted(sized(2 * MIB + 1), "image/svg+xml")).toBe("too_large");
  });
  test("D17 text is UTF-8, a byte-order mark allowed; code reads as code; binary never opens with markup", () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytesOf("a,b")]);
    const utf16 = new Uint8Array([0xff, 0xfe, 0x61, 0x00, 0x2c, 0x00]);
    const latin1 = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
    expect(accepted(bom, "text/csv")).toEqual(["text/csv", 6]);
    for (const type of ["text/csv", "text/markdown", "application/json", "text/plain", "text/css"])
      for (const body of [utf16, latin1])
        expect([type, accepted(body, type)]).toEqual([type, "invalid_request"]);
    expect(accepted(bytesOf("  \n<style>body{}</style>"), "text/css")).toBe("unsupported_type");
    expect(accepted(bytesOf("<script>x</script>"), "text/javascript")).toBe("unsupported_type");
    expect(accepted(bytesOf("var a = 1;\u0000\u0001"), "text/javascript")).toBe("unsupported_type");
    expect(accepted(bytesOf("a < b"), "text/javascript")).toEqual(["text/javascript", 5]);
    for (const type of ["image/png", "video/mp4", "application/pdf", "font/woff2"])
      expect([type, accepted(bytesOf("\n <svg/>"), type)]).toEqual([type, "unsupported_type"]);
  });
  test("D17 an artifact holds 1,000 assets and 256 MiB", () => {
    const record = (sizeBytes: number, k = 0): AssetRecord => ({
      id: k.toString(16).padStart(32, "0"),
      contentType: "image/png",
      sizeBytes,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const nearlyFull = [record(256 * MIB - PNG.byteLength)];
    expect(accepted(PNG, "image/png", nearlyFull)).toEqual(["image/png", PNG.byteLength]);
    expect(accepted(PNG, "image/png", [record(256 * MIB - PNG.byteLength + 1)])).toBe(
      "quota_or_state",
    );
    const many = (n: number) => Array.from({ length: n }, (_, k) => record(1, k));
    expect(accepted(PNG, "image/png", many(999))).toEqual(["image/png", PNG.byteLength]);
    expect(accepted(PNG, "image/png", many(1000))).toBe("quota_or_state");
    expect(assetUsage(many(3))).toEqual({
      files: 3,
      bytes: 3,
      maxFiles: 1000,
      maxBytes: 256 * MIB,
    });
  });
  test.each([
    ["0123456789abcdef0123456789abcdef", "0123456789abcdef0123456789abcdef"],
    ["/_blob/0123456789abcdef0123456789abcdef", "0123456789abcdef0123456789abcdef"],
    ["/_blob/0123456789ABCDEF0123456789abcdef", null],
    ["http://x.localhost/_blob/0123456789abcdef0123456789abcdef", null],
    ["/_blob/../manifest.json", null],
    ["0123", null],
    [7, null],
  ])("D17 a delete of %j names the asset %j", (ref, id) => {
    expect(assetIdOf(ref)).toBe(id);
  });
});

describe("D18 an SVG is stored sanitised", () => {
  const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">';
  const clean = (inner: string) => sanitizeSvg(`${SVG_OPEN}${inner}</svg>`) ?? "REFUSED";

  test("D18 the drawing, its text and its local references stay", () => {
    const drawing =
      '<defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/></linearGradient></defs>' +
      '<g fill="url(#g)" style="opacity:.5"><rect width="10" height="10"/><text x="1" y="5">a &lt; b &amp; c</text>' +
      '<use href="#g"/><a href="https://example.com/">link</a></g>';
    expect(clean(drawing)).toBe(`${SVG_OPEN}${drawing}</svg>`);
  });
  test.each([
    ["a script", "<script>alert(1)</script>"],
    ["a namespaced script", "<svg:script>alert(1)</svg:script>"],
    ["a script in CDATA", "<script><![CDATA[ alert(1) ]]></script>"],
    ["a script nested in its own kind", "<script><script>alert(1)</script>alert(1)</script>"],
    [
      "foreign content",
      '<foreignObject><body xmlns="x"><img src=x onerror="alert(1)"/></body></foreignObject>',
    ],
    ["a style block", "<style>*{fill:url(javascript:alert(1))}</style>"],
    ["a stylesheet link", '<link rel="stylesheet" href="https://example.com/x.css"/>'],
    ["an animation", '<animate attributeName="href" values="javascript:alert(1)"/>'],
    ["a set", '<set attributeName="onmouseover" to="alert(1)"/>'],
    ["a comment", "<!-- alert(1) -->"],
    ["an instruction", '<?xml-stylesheet href="alert(1).css"?>'],
  ])("D18 %s goes, with everything it holds", (_name, hostile) => {
    const out = clean(`<rect width="1" height="1"/>${hostile}<circle r="1"/>`);
    expect(out).toBe(`${SVG_OPEN}<rect width="1" height="1"/><circle r="1"/></svg>`);
  });
  test.each([
    ["an event handler", '<rect onclick="alert(1)" width="1"/>', '<rect width="1"/>'],
    ["a handler in another case", '<rect ONLOAD="alert(1)" width="1"/>', '<rect width="1"/>'],
    ["a javascript: link", '<a href="javascript:alert(1)">x</a>', "<a>x</a>"],
    [
      "one spelled with entities and blanks",
      '<a xlink:href="ja&#118;a&#x73;cript&#9;:alert(1)">x</a>',
      "<a>x</a>",
    ],
    ["a data: image", '<image href="data:image/png;base64,AAAA" width="1"/>', '<image width="1"/>'],
    [
      "a url() in a style attribute",
      '<rect style="fill:url(JavaScript:alert(1))" width="1"/>',
      '<rect width="1"/>',
    ],
    ["a use that points out of the file", '<use href="other.svg#icon"/>', "<use/>"],
    ["an unquoted value", "<rect width=1 />", '<rect width="1"/>'],
  ])("D18 %s is taken off its element", (_name, hostile, kept) => {
    expect(clean(hostile)).toBe(`${SVG_OPEN}${kept}</svg>`);
  });
  test("D18 the doctype and its entities go; a tag that never closes is text, not markup", () => {
    const bomb =
      '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "<script>alert(1)</script>">]>' +
      `${SVG_OPEN}<text>&x;</text></svg>`;
    expect(sanitizeSvg(bomb)).toBe(`${SVG_OPEN}<text>&x;</text></svg>`);
    expect(clean('<script x="never closed>alert(1)</script>')).not.toMatch(/<script/i);
  });
  test.each([
    ["HTML", "<html><body><svg/></body></html>"],
    ["plain text", "just words"],
    ["nothing", ""],
    ["a PNG", "\u0089PNG\r\n"],
  ])("D18 %s is no SVG document", (_name, source) => {
    expect(sanitizeSvg(source)).toBeNull();
    expect(accepted(bytesOf(source || " "), "image/svg+xml")).toBe("unsupported_type");
  });
  test("D18 what is stored is the sanitised file, and its size is the stored size", () => {
    const source = `<?xml version="1.0"?>\n${SVG_OPEN}<script>alert(1)</script><rect width="1"/></svg>`;
    const out = acceptUpload(bytesOf(source), "image/svg+xml", []);
    if ("code" in out) throw new Error(out.message);
    const stored = new TextDecoder().decode(out.bytes);
    expect(stored).toBe(`${SVG_OPEN}<rect width="1"/></svg>`);
    expect(out.bytes.byteLength).toBeLessThan(bytesOf(source).byteLength);
  });
});

describe("D19 a type's paths are read-only", () => {
  const record = { sha256: "0".repeat(64), contentType: "text/javascript", bytes: 10 };
  const current = { "app.js": record, "lib/chart.js": record, "data/rows.json": record };
  const TYPES = ["index.html", "app.js", "lib/chart.js"];

  test.each([
    ["replacing one", { "app.js": { bytes: 5 } }, ["app.js"]],
    ["removing one", { "lib/chart.js": null }, ["lib/chart.js"]],
    ["the page itself", { "index.html": { bytes: 5 } }, ["index.html"]],
    [
      "one beside a path of the artifact's own",
      { "data/rows.json": { bytes: 5 }, "app.js": { bytes: 5 }, "lib/chart.js": null },
      ["app.js", "lib/chart.js"],
    ],
    [
      "one beside a path no rule would admit",
      { "app.js": { bytes: 5 }, "../x.js": null },
      ["app.js"],
    ],
  ])("D19 %s is read_only_path, naming what it named", (_name, changes, named) => {
    const plan = planFiles(current, changes, TYPES);
    expect(isRefusal(plan) && plan.code).toBe("read_only_path");
    for (const path of named) expect((plan as { message: string }).message).toContain(path);
  });
  test("D19 every other path is laid over as ever; without a type nothing is read-only", () => {
    expect(
      planFiles(current, { "data/rows.json": { bytes: 5 }, "notes.md": { bytes: 1 } }, TYPES),
    ).toEqual({
      kept: { "app.js": record, "lib/chart.js": record },
      written: { "data/rows.json": "application/json", "notes.md": "text/markdown" },
      removed: [],
    });
    expect(isRefusal(planFiles(current, { "app.js": { bytes: 5 } }))).toBe(false);
    // The page's name stays reserved for everyone: only its refusal differs.
    expect(planFiles(current, { "index.html": { bytes: 5 } })).toMatchObject({
      code: "invalid_content",
    });
  });
});
