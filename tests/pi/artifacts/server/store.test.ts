// Contract — the store on disk (src/infra/store) through the core
//
// T1: a publish writes <slug>/.store/source, versions/v1.html+json, and a manifest
//     owned by the publishing session; a republish appends v2 and every version
//     stays readable as it was published
// T2: a page reply writes .store/responses/v<N>-r<K>.json and nothing else: `current`
//     stays, no version's document changes, and the current island is the version
//     with the reply over it; a second reply is r2
// T3: a republish or watch from another session makes it the owner and lists it
//     among the sessions; pin flips the flag; a view moves lastActivityAt
// T4: delete moves the folder under <trash>/pi-artifacts/<date>/; the slug is gone
//     from the store; nothing is unlinked
// T5: the sweep trashes only unpinned artifacts idle past retention and removes only
//     log folders dated past it
// T6: the same source path republishes in place for a session that published or
//     attached it; a different path, or a session that never saw it, is a new slug
// T7: the artifact is its folder: a page authored at .pi/artifacts/<slug>/<file>
//     publishes to that slug whatever its title, and republishes it; the server's
//     files live under <slug>/.store and the authored page is never written to;
//     delete moves the whole folder, authored page included; a slug another session
//     owns is refused
// T8: a folder whose manifest lacks a field the code reads is not an artifact: list
//     and get skip it and the store names it as unreadable; a healthy store names
//     nothing
// T9: the agent replies to and resolves only a thread the user sent to it; a second
//     reply with nothing new from the user is refused unless acknowledged
// T10: the file names the artifact: an HTML <title> beats the `title` parameter, which
//      is only the fallback; a Markdown file keeps its own name; a republish that
//      names nothing keeps the name, and only a new artifact falls back to a heading
// T11: an icon is one generic word: it is stored, kept when a republish omits it and
//      replaced when one passes another; an emoji or any other shape is refused
//      with the rule, and nothing is published
// T12: a label names the version it was published with; over 60 characters is refused
// T13: a rename is the user's: it sticks across republishes, whatever they are titled
// T14: a duplicate is a new artifact whose v1 is the source's current document and the
//      island a reader sees now, owned by the caller or else the source's owner; the
//      source is untouched and keeps its replies; the copy holds the source's
//      supporting files in a blob folder of its own
// T15: a publish's supporting files land as .store/blobs/<sha256> — one blob however
//      many paths or versions hold the same bytes — and .store/versions/v<N>.files.json,
//      path → {sha256, contentType, bytes}; the version record counts them. A republish
//      keeps every path it does not name, replaces the ones it does, and drops a path
//      given as null, while an older version's map stays as it was; an artifact without
//      files writes neither a map nor a blob folder
// T16: a publish whose files break a rule — a path that leaves the artifact, a reserved
//      name, an unknown or unservable type, a file or a version over its limit — is
//      refused with the reason and writes nothing: no artifact, no version, no blob
// T17: a capability declaration is stored on the manifest and on the version it was
//      published with; a republish that names none carries it forward, {} clears it, and
//      a non-empty one replaces it whole, while older versions keep what they declared;
//      a duplicate carries it; an unknown name refuses the publish and nothing is written
// T18: the viewer's own publish is a version attributed to `viewer`: the owner, the
//      sessions and the watch stay as they were, the stored source becomes what the
//      viewer published, and the owning session's next republish is refused as stale
//      until it has read that version; a refused viewer publish leaves the store's
//      files exactly as they were
// T19: a page's database is one file, .store/db.json — collection path → document id →
//      {data, version, updatedAt} — written by the first write and not before, rewritten
//      whole with no temporary file left behind; a refused write leaves it byte for
//      byte; an artifact that does not declare `db` has none; a duplicate starts with
//      the source's documents and the two then move apart; delete takes it along with
//      the folder
// T20: what a page uploads lands as .store/assets/<id> — an id of 32 hex characters the
//      server mints — beside assets/index.json, [{id, contentType, sizeBytes, createdAt}]
//      oldest first; a refused upload stores nothing; a deleted asset leaves the index
//      and its bytes move to the trash, never unlinked; a duplicate holds the same assets
//      under the same ids in a folder of its own; an artifact that does not declare
//      `assets` stores none
// T21: an artifact made from a type records the type and the paths that are the type's —
//      its page and the files it came with — and is named by its `title`, whatever the
//      type's own <title> says; a republish without a page carries the page as it
//      stands and lays its files over; a republish that brings a page or names a type's
//      path, and the viewer's own publish of a page or of a type's path, are refused as
//      `read_only_path` and write nothing; an artifact made from no type cannot
//      republish without a page; a duplicate is of the same type

import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { serve, stopAll } from "../fixture";

afterEach(stopAll);

function scratch(now?: () => Date, retentionDays?: number) {
  const root = mkdtempSync(join(tmpdir(), "artifacts-store-"));
  const trashDir = mkdtempSync(join(tmpdir(), "artifacts-trash-"));
  const b = serve({ root, trashDir, now, retentionDays });
  return { root, trashDir, ...b };
}

const html = (body: string) => `<h1>Plan</h1>${body}`;
/** A supporting file as the core takes it, and the name its blob gets. */
const content = (text: string, contentType?: string) => ({
  bytes: new TextEncoder().encode(text),
  contentType,
});
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const MIB = 1024 * 1024;

describe("T1 versions on disk", () => {
  test("T1 publish then republish: v1 and v2 files, index follows, owner set", () => {
    const s = scratch();
    const first = s.core.publish({
      kind: "html",
      source: html("one"),
      session: "A",
      sourcePath: "plan.html",
    });
    const dir = join(s.root, first.manifest.slug, ".store");
    expect(existsSync(join(dir, "source.html"))).toBe(true);
    expect(existsSync(join(dir, "versions", "v1.html"))).toBe(true);
    expect(existsSync(join(dir, "versions", "v1.json"))).toBe(true);
    expect(first.manifest.owner).toBe("A");
    expect(first.version).toBe(1);

    const second = s.core.publish({
      kind: "html",
      source: html("two"),
      update: first.manifest.slug,
      session: "A",
    });
    expect(second.version).toBe(2);
    expect(s.store.readPage(first.manifest.slug, 2)).toContain("two");
    expect(s.store.readPage(first.manifest.slug, 1)).toContain("one");
    expect(s.store.readPage(first.manifest.slug, 3)).toBeNull();
    s.server.stop();
  });
});

describe("T2 replies", () => {
  test("T2 a reply is r1 under v1; current stays 1; the island merges; a second reply is r2", () => {
    const s = scratch();
    const p = s.core.publish({
      kind: "html",
      source: html(""),
      island: { schema: "x", a: 1 },
      session: "A",
    });
    const slug = p.manifest.slug;
    const out = s.core.respondFromPage(slug, {
      base_version: 1,
      data: { schema: "x", a: 1, b: 2 },
      gesture: true,
    });
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ version: 1, response: 1 });
    expect(existsSync(join(s.root, slug, ".store", "responses", "v1-r1.json"))).toBe(true);
    expect(s.store.get(slug)?.current).toBe(1);
    expect(s.store.readIsland(slug)).toEqual({ schema: "x", a: 1, b: 2 });
    expect(s.store.readVersionIsland(slug, 1)).toEqual({ schema: "x", a: 1 });
    const again = s.core.respondFromPage(slug, {
      base_version: 1,
      data: { schema: "x", a: 3 },
      gesture: false,
    });
    expect(again.body).toMatchObject({ version: 1, response: 2 });
    expect(s.store.get(slug)?.responses.map((r) => [r.r, r.gesture])).toEqual([
      [1, true],
      [2, false],
    ]);
    s.server.stop();
  });
  test("T2 a reply changes no document: the store holds the same files, byte for byte, plus the reply", () => {
    const s = scratch();
    const p = s.core.publish({
      kind: "html",
      source: html("<p>asks</p>"),
      island: { a: 1 },
      session: "A",
    });
    const dir = join(s.root, p.manifest.slug, ".store");
    const documents = () =>
      readdirSync(join(dir, "versions"))
        .sort()
        .map((name) => [name, readFileSync(join(dir, "versions", name), "utf8")]);
    const before = documents();
    const entries = readdirSync(dir).sort();
    s.core.respondFromPage(p.manifest.slug, { base_version: 1, data: { a: 2 }, gesture: true });
    expect(documents()).toEqual(before);
    expect(readdirSync(dir).sort()).toEqual([...entries, "events.jsonl"].sort());
    expect(readdirSync(join(dir, "responses"))).toEqual(["v1-r1.json"]);
    s.server.stop();
  });
  test("T2 a reply to a version that moved on is refused", () => {
    const s = scratch();
    const p = s.core.publish({ kind: "html", source: html(""), session: "A" });
    s.core.publish({ kind: "html", source: html("v2"), update: p.manifest.slug, session: "A" });
    expect(s.core.respondFromPage(p.manifest.slug, { base_version: 1, data: {} }).status).toBe(409);
    expect(existsSync(join(s.root, p.manifest.slug, ".store", "responses", "v1-r1.json"))).toBe(
      false,
    );
    s.server.stop();
  });
});

describe("T3 ownership, pin, activity", () => {
  test("T3 a republish from B makes B the owner; both sessions are listed", () => {
    const s = scratch();
    const p = s.core.publish({ kind: "html", source: html(""), session: "A" });
    const m = s.core.publish({
      kind: "html",
      source: html("b"),
      update: p.manifest.slug,
      session: "B",
    }).manifest;
    expect(m.owner).toBe("B");
    expect(m.sessions).toEqual(["A", "B"]);
    expect(s.core.setWatched(p.manifest.slug, true, "A").owner).toBe("A");
    s.server.stop();
  });
  test("T3 pin flips; a view after an hour moves lastActivityAt", () => {
    let t = Date.parse("2026-01-01T00:00:00.000Z");
    const s = scratch(() => new Date(t));
    const p = s.core.publish({ kind: "html", source: html(""), session: "A" });
    expect(s.core.setPinned(p.manifest.slug, true).pinned).toBe(true);
    t += 2 * 3600 * 1000;
    s.core.viewed(p.manifest.slug);
    expect(s.store.get(p.manifest.slug)?.lastActivityAt).toBe(new Date(t).toISOString());
    s.server.stop();
  });
});

describe("T4 delete", () => {
  test("T4 the folder lands in the trash by date; the slug is gone", () => {
    const s = scratch(() => new Date("2026-03-04T10:00:00.000Z"));
    const p = s.core.publish({ kind: "html", source: html(""), session: "A" });
    const dest = s.core.remove(p.manifest.slug);
    expect(dest.startsWith(join(s.trashDir, "pi-artifacts", "2026-03-04"))).toBe(true);
    expect(existsSync(join(dest, ".store", "manifest.json"))).toBe(true);
    expect(s.store.get(p.manifest.slug)).toBeNull();
    s.server.stop();
  });
});

describe("T5 sweep", () => {
  test("T5 idle unpinned artifacts and old log folders go; pinned and fresh stay", () => {
    let t = Date.parse("2026-01-01T00:00:00.000Z");
    const s = scratch(() => new Date(t), 14);
    const old = s.core.publish({ kind: "html", source: html("old"), session: "A" }).manifest.slug;
    const kept = s.core.publish({ kind: "html", source: html("pinned"), session: "A" }).manifest
      .slug;
    s.core.setPinned(kept, true);
    mkdirSync(join(s.root, "logs", "2026-01-01"), { recursive: true });
    t += 20 * 24 * 3600 * 1000;
    const fresh = s.core.publish({ kind: "html", source: html("fresh"), session: "A" }).manifest
      .slug;
    mkdirSync(join(s.root, "logs", "2026-01-21"), { recursive: true });
    const swept = s.core.sweep();
    expect(swept.artifacts).toEqual([old]);
    expect(swept.logs).toEqual(["2026-01-01"]);
    expect(
      s.store
        .list()
        .map((m) => m.slug)
        .sort(),
    ).toEqual([fresh, kept].sort());
    expect(readdirSync(join(s.root, "logs"))).toEqual(["2026-01-21"]);
    s.server.stop();
  });
});

describe("T6 the same file republishes in place", () => {
  test("T6 same sourcePath → same slug, v2; another path → a new slug", () => {
    const s = scratch();
    const a = s.core.publish({
      kind: "html",
      source: html("1"),
      sourcePath: "docs/plan.html",
      session: "A",
    });
    const b = s.core.publish({
      kind: "html",
      source: html("2"),
      sourcePath: "docs/plan.html",
      session: "A",
    });
    const c = s.core.publish({
      kind: "html",
      source: html("3"),
      sourcePath: "docs/other.html",
      session: "A",
    });
    expect(b.manifest.slug).toBe(a.manifest.slug);
    expect(b.version).toBe(2);
    expect(b.created).toBe(false);
    expect(c.manifest.slug).not.toBe(a.manifest.slug);
    s.server.stop();
  });
  test("T6 a session that never published or attached the path gets its own artifact", () => {
    const s = scratch();
    const a = s.core.publish({
      kind: "html",
      source: html("1"),
      sourcePath: "docs/plan.html",
      session: "A",
    });
    const b = s.core.publish({
      kind: "html",
      source: html("2"),
      sourcePath: "docs/plan.html",
      session: "B",
    });
    expect(b.created).toBe(true);
    expect(b.manifest.slug).not.toBe(a.manifest.slug);
    expect(s.store.get(a.manifest.slug)).toMatchObject({ current: 1, owner: "A" });
    // Attaching is how B opts in: the same path then republishes A's page.
    s.core.setWatched(a.manifest.slug, true, "C");
    const c = s.core.publish({
      kind: "html",
      source: html("3"),
      sourcePath: "docs/plan.html",
      session: "C",
    });
    expect(c.manifest.slug).toBe(a.manifest.slug);
    expect(c.version).toBe(2);
    s.server.stop();
  });
  test("T6 a republish carrying a stale baseVersion is refused with the current one", () => {
    const s = scratch();
    const a = s.core.publish({ kind: "html", source: html("1"), session: "A" });
    s.core.publish({ kind: "html", source: html("2"), update: a.manifest.slug, session: "B" });
    expect(() =>
      s.core.publish({
        kind: "html",
        source: html("3"),
        update: a.manifest.slug,
        baseVersion: 1,
        session: "A",
      }),
    ).toThrow(/v2/);
    s.server.stop();
  });
});

describe("T7 the artifact is its folder", () => {
  const authored = (root: string, slug: string, body: string) => {
    mkdirSync(join(root, slug), { recursive: true });
    writeFileSync(join(root, slug, "page.html"), body);
    return `.pi/artifacts/${slug}/page.html`;
  };
  test("T7 the folder names the slug; the store sits beside the authored page", () => {
    const s = scratch();
    const sourcePath = authored(s.root, "shortwave-dial", "<h1>A Different Title</h1>");
    const first = s.core.publish({
      kind: "html",
      source: "<h1>A Different Title</h1>",
      sourcePath,
      session: "A",
    });
    expect(first.manifest.slug).toBe("shortwave-dial");
    expect(first.manifest.title).toBe("A Different Title");
    expect(readdirSync(join(s.root, "shortwave-dial")).sort()).toEqual([".store", "page.html"]);
    expect(readFileSync(join(s.root, "shortwave-dial", "page.html"), "utf8")).toBe(
      "<h1>A Different Title</h1>",
    );
    const again = s.core.publish({ kind: "html", source: html("2"), sourcePath, session: "A" });
    expect(again).toMatchObject({ version: 2, created: false });
    const dest = s.core.remove("shortwave-dial");
    expect(existsSync(join(dest, "page.html"))).toBe(true);
    expect(existsSync(join(s.root, "shortwave-dial"))).toBe(false);
    s.server.stop();
  });
  test("T7 a folder another session owns, or a slug that disagrees with it, is refused", () => {
    const s = scratch();
    const sourcePath = authored(s.root, "plan", html(""));
    s.core.publish({ kind: "html", source: html(""), sourcePath, session: "A" });
    expect(() =>
      s.core.publish({ kind: "html", source: html("b"), sourcePath, session: "B" }),
    ).toThrow(/already lives at/);
    expect(() =>
      s.core.publish({ kind: "html", source: html(""), sourcePath, slug: "other", session: "A" }),
    ).toThrow(/plan/);
    s.server.stop();
  });
});

describe("T8 a folder the code cannot read is not an artifact", () => {
  /** A manifest as an older server wrote it: no responses, no sessions. */
  const legacy = (root: string, slug: string) => {
    mkdirSync(join(root, slug, ".store"), { recursive: true });
    writeFileSync(
      join(root, slug, ".store", "manifest.json"),
      JSON.stringify({ slug, title: "Old", owner: "agent", current: 3, versions: [], pending: [] }),
    );
  };

  test("T8 a manifest missing fields is skipped by list and get, and named as unreadable", () => {
    const s = scratch();
    const healthy = s.core.publish({ kind: "html", source: html("ok"), session: "A" });
    legacy(s.root, "smoke");
    expect(s.store.list().map((m) => m.slug)).toEqual([healthy.manifest.slug]);
    expect(s.store.get("smoke")).toBeNull();
    expect(s.store.unreadable()).toEqual(["smoke"]);
    s.server.stop();
  });
  test("T8 a healthy store names nothing, and a folder with no manifest is not reported", () => {
    const s = scratch();
    s.core.publish({ kind: "html", source: html("ok"), session: "A" });
    mkdirSync(join(s.root, "drafts"), { recursive: true });
    expect(s.store.unreadable()).toEqual([]);
    s.server.stop();
  });
});

describe("T9 the agent acts only on threads the user sent to it", () => {
  const thread = (s: ReturnType<typeof scratch>, slug: string, toAgent: boolean) =>
    (s.core.addComment(slug, { text: "tighten the intro", toAgent }).body.thread as { id: string })
      .id;

  test("T9 reply and resolve land on a sent thread and are refused on a note", () => {
    const s = scratch();
    const { slug } = s.core.publish({ kind: "html", source: html(""), session: "A" }).manifest;
    const sent = thread(s, slug, true);
    const note = thread(s, slug, false);
    expect(s.core.reply(slug, sent, "done").messages.at(-1)?.author).toBe("agent");
    expect(s.core.resolveThread(slug, sent).resolved).toBe(true);
    expect(() => s.core.reply(slug, note, "done")).toThrow(/not sent to the agent/);
    expect(() => s.core.resolveThread(slug, note)).toThrow(/not sent to the agent/);
    expect(s.store.comments(slug).find((t) => t.id === note)?.resolved).toBe(false);
    s.server.stop();
  });
  test("T9 a second reply with nothing new from the user is refused unless acknowledged", () => {
    const s = scratch();
    const { slug } = s.core.publish({ kind: "html", source: html(""), session: "A" }).manifest;
    const sent = thread(s, slug, true);
    s.core.reply(slug, sent, "done");
    expect(() => s.core.reply(slug, sent, "done again")).toThrow(/acknowledge_duplicate/);
    expect(s.core.reply(slug, sent, "one more thing", true).messages).toHaveLength(3);
    s.core.addComment(slug, { text: "and the outro?", toAgent: true, threadId: sent });
    expect(s.core.reply(slug, sent, "outro too").messages).toHaveLength(5);
    s.server.stop();
  });
});

describe("T10 the file names the artifact", () => {
  const titled = (title: string, body = "") => `<title>${title}</title><h1>A heading</h1>${body}`;

  test("T10 an HTML <title> beats the title parameter; the parameter is the fallback", () => {
    const s = scratch();
    const own = s.core.publish({
      kind: "html",
      source: titled("Tide Table"),
      title: "Passed In",
      session: "A",
    });
    expect(own.manifest.title).toBe("Tide Table");
    const fallback = s.core.publish({
      kind: "html",
      source: "<h1>A heading</h1>",
      title: "Passed In",
      session: "A",
    });
    expect(fallback.manifest.title).toBe("Passed In");
    const late = s.core.publish({
      kind: "html",
      source: `${"<!-- pad -->".repeat(800)}${titled("Beyond 8 KB")}`,
      title: "Passed In Again",
      session: "A",
    });
    expect(late.manifest.title).toBe("Passed In Again");
    s.server.stop();
  });
  test("T10 a Markdown file keeps its own name, then the parameter, then its heading", () => {
    const s = scratch();
    const md = (extra: Record<string, string>) =>
      s.core.publish({ kind: "md", source: "# The Heading\n\nbody", session: "A", ...extra })
        .manifest.title;
    expect(md({ sourcePath: "docs/release-notes.md", title: "Passed In" })).toBe("release-notes");
    expect(md({ title: "Passed In" })).toBe("Passed In");
    expect(md({})).toBe("The Heading");
    s.server.stop();
  });
  test("T10 a republish that names nothing keeps the name; a new <title> renames it", () => {
    const s = scratch();
    const first = s.core.publish({
      kind: "html",
      source: "<h1>First heading</h1>",
      title: "Chosen Name",
      session: "A",
    });
    const slug = first.manifest.slug;
    const again = s.core.publish({
      kind: "html",
      source: "<h1>Another heading</h1>",
      update: slug,
      session: "A",
    });
    expect(again.manifest.title).toBe("Chosen Name");
    const renamed = s.core.publish({
      kind: "html",
      source: titled("Named By The File"),
      update: slug,
      session: "A",
    });
    expect(renamed.manifest.title).toBe("Named By The File");
    expect(
      s.core.publish({ kind: "html", source: "<h1>Only a heading</h1>", session: "A" }).manifest
        .title,
    ).toBe("Only a heading");
    s.server.stop();
  });
});

describe("T11 the icon is one generic word", () => {
  test("T11 a word is stored, kept when omitted, replaced when passed again", () => {
    const s = scratch();
    const first = s.core.publish({ kind: "html", source: html(""), icon: "chart", session: "A" });
    expect(first.manifest.icon).toBe("chart");
    const slug = first.manifest.slug;
    const kept = s.core.publish({ kind: "html", source: html("2"), update: slug, session: "A" });
    expect(kept.manifest.icon).toBe("chart");
    const replaced = s.core.publish({
      kind: "html",
      source: html("3"),
      update: slug,
      icon: "line-chart2",
      session: "A",
    });
    expect(replaced.manifest.icon).toBe("line-chart2");
    s.server.stop();
  });
  test.each([["📊"], ["Chart"], ["c"], ["bar chart"], ["-chart"], ["a".repeat(25)], [""]])(
    "T11 %j is refused with the rule, and nothing is published",
    (icon) => {
      const s = scratch();
      expect(() => s.core.publish({ kind: "html", source: html(""), icon, session: "A" })).toThrow(
        /one short generic word/,
      );
      expect(s.store.list()).toEqual([]);
      s.server.stop();
    },
  );
});

describe("T12 a label names a version", () => {
  test("T12 the label sits on the version it was published with; too long is refused", () => {
    const s = scratch();
    const first = s.core.publish({
      kind: "html",
      source: html(""),
      label: "  Draft to legal ",
      session: "A",
    });
    const slug = first.manifest.slug;
    s.core.publish({ kind: "html", source: html("2"), update: slug, session: "A" });
    expect(s.store.get(slug)?.versions.map((v) => [v.n, v.label])).toEqual([
      [1, "Draft to legal"],
      [2, undefined],
    ]);
    expect(() =>
      s.core.publish({
        kind: "html",
        source: html("3"),
        update: slug,
        label: "x".repeat(61),
        session: "A",
      }),
    ).toThrow(/60/);
    expect(s.store.get(slug)?.current).toBe(2);
    expect(
      s.core.publish({
        kind: "html",
        source: html("3"),
        update: slug,
        label: "x".repeat(60),
        session: "A",
      }).version,
    ).toBe(3);
    s.server.stop();
  });
});

describe("T13 a rename is the user's", () => {
  test("T13 the new title sticks across a republish that carries its own title", () => {
    const s = scratch();
    const slug = s.core.publish({
      kind: "html",
      source: html(""),
      title: "Agent name",
      session: "A",
    }).manifest.slug;
    expect(s.core.rename(slug, "  My   name ").title).toBe("My name");
    const again = s.core.publish({
      kind: "html",
      source: "<title>From the file</title><p>x</p>",
      title: "From the parameter",
      update: slug,
      session: "A",
    });
    expect(again.manifest.title).toBe("My name");
    expect(again.manifest.slug).toBe(slug);
    s.server.stop();
  });
  test.each([
    ["empty", "   "],
    ["over 200 characters", "x".repeat(201)],
  ])("T13 a title that is %s is refused and the old one stays", (_name, title) => {
    const s = scratch();
    const slug = s.core.publish({ kind: "html", source: html(""), title: "Kept", session: "A" })
      .manifest.slug;
    expect(() => s.core.rename(slug, title)).toThrow(/title/);
    expect(s.store.get(slug)?.title).toBe("Kept");
    s.server.stop();
  });
});

describe("T14 duplicate", () => {
  const original = (s: ReturnType<typeof scratch>) => {
    const island = { topic: "pricing", a: 1 };
    const slug = s.core.publish({
      kind: "html",
      source: html("v1"),
      title: "Pricing",
      icon: "chart",
      island,
      sourcePath: "docs/pricing.html",
      session: "A",
    }).manifest.slug;
    s.core.publish({ kind: "html", source: html("v2 words"), island, update: slug, session: "A" });
    s.core.respondFromPage(slug, { base_version: 2, data: { a: 2 }, gesture: true });
    return slug;
  };

  test("T14 the copy is v1 of a new slug: the current document and the island a reader sees now", () => {
    const s = scratch();
    const slug = original(s);
    const copy = s.core.duplicate(slug);
    expect(copy.slug).not.toBe(slug);
    expect(copy).toMatchObject({ current: 1, owner: "A", icon: "chart", responses: [] });
    expect(copy.title).toContain("Pricing");
    expect(copy.sourcePath).toBeUndefined();
    expect(s.store.readPage(copy.slug, 1)).toBe(s.store.readPage(slug, 2) as string);
    expect(s.store.readIsland(copy.slug)).toEqual({ topic: "pricing", a: 2 });
    expect(s.store.readSource(copy.slug)?.source).toBe(html("v2 words"));
    expect(s.store.get(slug)).toMatchObject({ current: 2, title: "Pricing" });
    expect(s.store.get(slug)?.responses).toHaveLength(1);
    s.server.stop();
  });
  test("T14 a caller owns its copy; a second copy gets a slug of its own; no source, no copy", () => {
    const s = scratch();
    const slug = original(s);
    const mine = s.core.duplicate(slug, "B");
    expect(mine.owner).toBe("B");
    expect(s.core.duplicate(slug).slug).not.toBe(mine.slug);
    expect(() => s.core.duplicate("ghost")).toThrow(/ghost/);
    s.server.stop();
  });
  test("T14 the copy holds the source's files itself: they outlive the source", () => {
    const s = scratch();
    const slug = s.core.publish({
      kind: "html",
      source: html(""),
      files: { "style.css": content("body{}"), "old.css": content("gone in v2") },
      session: "A",
    }).manifest.slug;
    s.core.publish({
      kind: "html",
      source: html("2"),
      update: slug,
      files: { "old.css": null },
      session: "A",
    });
    const copy = s.core.duplicate(slug);
    expect(s.store.readFiles(copy.slug, 1)).toEqual(s.store.readFiles(slug, 2));
    expect(copy.versions[0]).toMatchObject({ files: 1, fileBytes: 6 });
    s.core.remove(slug);
    expect(readdirSync(join(s.root, copy.slug, ".store", "blobs"))).toEqual([sha("body{}")]);
    expect(new TextDecoder().decode(s.core.file(copy.slug, 1, "style.css")?.bytes)).toBe("body{}");
    s.server.stop();
  });
});

describe("T15 supporting files on disk", () => {
  const record = (text: string, contentType: string) => ({
    sha256: sha(text),
    contentType,
    bytes: new TextEncoder().encode(text).byteLength,
  });
  const mapOf = (dir: string, n: number) =>
    JSON.parse(readFileSync(join(dir, "versions", `v${n}.files.json`), "utf8")) as unknown;

  test("T15 files are blobs named by their hash and a map per version; the record counts them", () => {
    const s = scratch();
    const p = s.core.publish({
      kind: "html",
      source: html(""),
      files: {
        "style.css": content("body{}"),
        "copy/of/style.css": content("body{}"),
        "data/rows.csv": content("a,b\n1,2\n", "text/csv"),
      },
      session: "A",
    });
    const dir = join(s.root, p.manifest.slug, ".store");
    const expected = {
      "copy/of/style.css": record("body{}", "text/css"),
      "data/rows.csv": record("a,b\n1,2\n", "text/csv"),
      "style.css": record("body{}", "text/css"),
    };
    expect(mapOf(dir, 1)).toEqual(expected);
    expect(p.files).toEqual(expected);
    expect(readdirSync(join(dir, "blobs")).sort()).toEqual(
      [sha("body{}"), sha("a,b\n1,2\n")].sort(),
    );
    expect(readFileSync(join(dir, "blobs", sha("body{}")), "utf8")).toBe("body{}");
    expect(p.manifest.versions[0]).toMatchObject({ files: 3, fileBytes: 20 });
    s.server.stop();
  });
  test("T15 a republish keeps what it leaves out, replaces what it names, drops null; v1 keeps its map", () => {
    const s = scratch();
    const slug = s.core.publish({
      kind: "html",
      source: html(""),
      files: { "a.css": content("a1"), "b.css": content("b1"), "c.css": content("c1") },
      session: "A",
    }).manifest.slug;
    const dir = join(s.root, slug, ".store");
    const v1 = mapOf(dir, 1);
    const second = s.core.publish({
      kind: "html",
      source: html("2"),
      update: slug,
      files: { "b.css": content("b2"), "c.css": null, "d.css": content("d2") },
      session: "A",
    });
    expect(second.files).toEqual({
      "a.css": record("a1", "text/css"),
      "b.css": record("b2", "text/css"),
      "d.css": record("d2", "text/css"),
    });
    expect(mapOf(dir, 1)).toEqual(v1);
    expect(second.manifest.versions.map((v) => [v.n, v.files])).toEqual([
      [1, 3],
      [2, 3],
    ]);
    // A page-only republish names no file and loses none; v1's replaced blob is still v1's.
    const third = s.core.publish({ kind: "html", source: html("3"), update: slug, session: "A" });
    expect(third.files).toEqual(second.files);
    expect(new TextDecoder().decode(s.core.file(slug, 1, "b.css")?.bytes)).toBe("b1");
    expect(new TextDecoder().decode(s.core.file(slug, 3, "b.css")?.bytes)).toBe("b2");
    expect(s.core.file(slug, 3, "c.css")).toBeNull();
    s.server.stop();
  });
  test("T15 an artifact without files writes no map and no blob folder", () => {
    const s = scratch();
    const p = s.core.publish({ kind: "html", source: html(""), session: "A" });
    const dir = join(s.root, p.manifest.slug, ".store");
    expect(readdirSync(join(dir, "versions")).sort()).toEqual(["v1.html", "v1.json"]);
    expect(existsSync(join(dir, "blobs"))).toBe(false);
    expect(p.files).toEqual({});
    expect(p.manifest.versions[0]?.files).toBeUndefined();
    s.server.stop();
  });
});

describe("T16 files that break a rule refuse the whole publish", () => {
  const big = (bytes: number) => ({ bytes: new Uint8Array(bytes) });
  test.each([
    ["a path that climbs out", { "../escape.css": content("x") }, /escape\.css/],
    ["an absolute path", { "/etc/passwd.css": content("x") }, /passwd\.css/],
    ["a backslash path", { "data\\rows.json": content("x") }, /rows\.json/],
    ["the page's own name", { "index.html": content("x") }, /index\.html/],
    ["the platform's hook", { "preflight.js": content("x") }, /preflight\.js/],
    ["an extension with no known type", { "rows.csv": content("x") }, /rows\.csv.*contentType/],
    ["a type no browser is served", { "a.bin": content("x", "message/rfc822") }, /message\/rfc822/],
    ["a text file over 16 MiB", { "big.json": big(16 * MIB + 1) }, /big\.json.*16\.0 MiB/],
    ["a binary file over 15 MiB", { "big.png": big(15 * MIB + 1) }, /big\.png.*15\.0 MiB/],
  ])("T16 %s: refused with the reason, and no artifact is made", (_name, files, reason) => {
    const s = scratch();
    expect(() =>
      s.core.publish({ kind: "html", source: html(""), title: "Refused", files, session: "A" }),
    ).toThrow(reason);
    expect(s.store.list()).toEqual([]);
    expect(existsSync(join(s.root, "refused"))).toBe(false);
    s.server.stop();
  });
  test("T16 refused on a republish: no version, no map and no blob is added", () => {
    const s = scratch();
    const slug = s.core.publish({
      kind: "html",
      source: html(""),
      files: { "a.css": content("a1") },
      session: "A",
    }).manifest.slug;
    const dir = join(s.root, slug, ".store");
    const before = [readdirSync(join(dir, "versions")).sort(), readdirSync(join(dir, "blobs"))];
    expect(() =>
      s.core.publish({
        kind: "html",
        source: html("2"),
        update: slug,
        files: { "fine.css": content("fine"), "../escape.css": content("x") },
        session: "A",
      }),
    ).toThrow(/escape\.css/);
    expect(s.store.get(slug)?.current).toBe(1);
    expect([readdirSync(join(dir, "versions")).sort(), readdirSync(join(dir, "blobs"))]).toEqual(
      before,
    );
    s.server.stop();
  });
  test("T16 a version holds at most 255 files and 64 MiB, counting what it keeps", () => {
    const s = scratch();
    const many = (from: number, to: number) =>
      Object.fromEntries(
        Array.from({ length: to - from }, (_, k) => [`f${from + k}.css`, content(`${from + k}`)]),
      );
    const slug = s.core.publish({
      kind: "html",
      source: html(""),
      files: many(0, 255),
      session: "A",
    }).manifest.slug;
    const republish = (files: Record<string, ReturnType<typeof content> | null>) =>
      s.core.publish({ kind: "html", source: html("2"), update: slug, files, session: "A" });
    expect(() => republish(many(255, 256))).toThrow(/256.*255/);
    expect(republish({ "f0.css": null, ...many(255, 256) }).manifest.versions[1]?.files).toBe(255);
    const heavy = s.core.publish({
      kind: "html",
      source: html(""),
      title: "Heavy",
      files: Object.fromEntries([1, 2, 3, 4].map((k) => [`k${k}.png`, big(15 * MIB)])),
      session: "A",
    }).manifest.slug;
    expect(() =>
      s.core.publish({
        kind: "html",
        source: html("2"),
        update: heavy,
        files: { "k5.png": big(5 * MIB) },
        session: "A",
      }),
    ).toThrow(/65\.0 MiB.*64\.0 MiB/);
    expect(s.store.get(heavy)?.current).toBe(1);
    s.server.stop();
  });
});

describe("T17 the capability declaration", () => {
  test("T17 stored on the manifest and the version; omitted carries, a new set replaces, {} clears", () => {
    const s = scratch();
    const declared = { artifact: {}, comments: { composer_only: true }, mcp: { servers: ["x"] } };
    const first = s.core.publish({
      kind: "html",
      source: html(""),
      capabilities: declared,
      session: "A",
    });
    const slug = first.manifest.slug;
    expect(first.manifest.capabilities).toEqual(declared);
    const republish = (capabilities?: Record<string, Record<string, unknown>>) =>
      s.core.publish({ kind: "html", source: html("n"), update: slug, capabilities, session: "A" })
        .manifest;
    expect(republish().capabilities).toEqual(declared);
    expect(republish({ downloads: {} }).capabilities).toEqual({ downloads: {} });
    expect(republish({}).capabilities).toBeUndefined();
    expect(republish().capabilities).toBeUndefined();
    expect(s.store.get(slug)?.versions.map((v) => v.capabilities)).toEqual([
      declared,
      declared,
      { downloads: {} },
      undefined,
      undefined,
    ]);
    const manifest = JSON.parse(
      readFileSync(join(s.root, slug, ".store", "manifest.json"), "utf8"),
    ) as { versions: Array<{ capabilities?: unknown }> };
    expect(manifest.versions[0]?.capabilities).toEqual(declared);
    s.server.stop();
  });
  test("T17 a duplicate carries the declaration; an artifact that declares nothing stores none", () => {
    const s = scratch();
    const slug = s.core.publish({
      kind: "html",
      source: html(""),
      capabilities: { downloads: {} },
      session: "A",
    }).manifest.slug;
    expect(s.core.duplicate(slug).capabilities).toEqual({ downloads: {} });
    const bare = s.core.publish({ kind: "html", source: html(""), title: "Bare", session: "A" });
    expect("capabilities" in bare.manifest && bare.manifest.capabilities !== undefined).toBe(false);
    s.server.stop();
  });
  test.each([
    ["a name nobody knows", { telepathy: {} }, /telepathy/],
    ["the built-in", { permissions: {} }, /permissions/],
    ["a config that is no object", { downloads: "yes" }, /downloads/],
  ])("T17 declaring %s refuses the publish and writes nothing", (_name, capabilities, reason) => {
    const s = scratch();
    expect(() =>
      s.core.publish({
        kind: "html",
        source: html(""),
        capabilities: capabilities as never,
        session: "A",
      }),
    ).toThrow(reason);
    expect(s.store.list()).toEqual([]);
    const slug = s.core.publish({
      kind: "html",
      source: html(""),
      capabilities: { artifact: {} },
      session: "A",
    }).manifest.slug;
    expect(() =>
      s.core.publish({
        kind: "html",
        source: html("2"),
        update: slug,
        capabilities: capabilities as never,
        session: "A",
      }),
    ).toThrow(reason);
    expect(s.store.get(slug)).toMatchObject({ current: 1, capabilities: { artifact: {} } });
    s.server.stop();
  });
});

describe("T18 the viewer's own publish", () => {
  const document = (words: string) =>
    `<!doctype html><html><head><title>Self Made</title></head><body>${words}</body></html>`;
  const published = (s: ReturnType<typeof scratch>) => {
    const slug = s.core.publish({
      kind: "html",
      source: document("the agent's"),
      capabilities: { artifact: {} },
      files: { "doc.json": content("{}") },
      session: "A",
    }).manifest.slug;
    s.core.setWatched(slug, false);
    return slug;
  };
  /** Every file under the artifact's store, with its bytes. */
  const snapshot = (dir: string): Array<[string, string]> =>
    readdirSync(dir, { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile())
      .map((entry): [string, string] => [
        join(entry.parentPath, entry.name),
        readFileSync(join(entry.parentPath, entry.name), "hex"),
      ])
      .sort(([a], [b]) => (a < b ? -1 : 1));

  test("T18 attributed to the viewer; owner, sessions and watch stay; the source is the viewer's", () => {
    const s = scratch();
    const slug = published(s);
    const out = s.core.selfPublish(slug, { baseVersion: 1, html: document("the viewer's") });
    expect(out.status).toBe(200);
    const after = s.store.get(slug);
    expect(after).toMatchObject({ current: 2, owner: "A", sessions: ["A"], watched: false });
    expect(after?.versions.map((v) => v.by)).toEqual(["A", "viewer"]);
    expect(s.store.readSource(slug)?.source).toBe(document("the viewer's"));
    const files = s.core.selfPublish(slug, {
      baseVersion: 2,
      files: { "doc.json": { bytes: new TextEncoder().encode('{"a":1}'), text: true } },
    });
    expect(files.status).toBe(200);
    expect(s.store.get(slug)?.versions.at(-1)).toMatchObject({ n: 3, by: "viewer", files: 1 });
    expect(s.store.get(slug)?.owner).toBe("A");
    s.server.stop();
  });
  test("T18 the owning session's republish over an unread viewer version is refused until it names it", () => {
    const s = scratch();
    const slug = published(s);
    s.core.selfPublish(slug, { baseVersion: 1, html: document("the viewer's") });
    const republish = (baseVersion: number) =>
      s.core.publish({
        kind: "html",
        source: document("v3"),
        update: slug,
        baseVersion,
        session: "A",
      });
    expect(() => republish(1)).toThrow(/v2/);
    expect(republish(2).version).toBe(3);
    s.server.stop();
  });
  test.each([
    ["a stale base", { baseVersion: 0, html: document("late") }],
    ["a fragment", { baseVersion: 1, html: "<p>no doctype</p>" }],
    [
      "a file that breaks a rule beside one that does not",
      {
        baseVersion: 1,
        files: {
          "fine.txt": { bytes: new Uint8Array(3), text: false },
          "../out.txt": { bytes: new Uint8Array(3), text: false },
        },
      },
    ],
  ])("T18 %s leaves every file of the store as it was", (_name, input) => {
    const s = scratch();
    const slug = published(s);
    const before = snapshot(join(s.root, slug));
    expect(s.core.selfPublish(slug, input).status).not.toBe(200);
    expect(snapshot(join(s.root, slug))).toEqual(before);
    s.server.stop();
  });
});

describe("T19 the database on disk", () => {
  const AT = "2026-03-04T10:00:00.000Z";
  const declaring = (s: ReturnType<typeof scratch>, title = "Tracker") =>
    s.core.publish({
      kind: "html",
      source: html(""),
      title,
      capabilities: { db: {} },
      session: "A",
    }).manifest.slug;
  const set = (s: ReturnType<typeof scratch>, slug: string, path: string, data: unknown) =>
    s.core.db(slug, { op: "write", writes: [{ op: "set", path, data }], batch: false });
  const dataAt = (s: ReturnType<typeof scratch>, slug: string, path: string) =>
    (s.core.db(slug, { op: "get", path }).body.doc as { data?: unknown }).data;
  const dbPath = (s: ReturnType<typeof scratch>, slug: string) =>
    join(s.root, slug, ".store", "db.json");

  test("T19 db.json comes with the first write, in the documented shape, and no temp file stays", () => {
    const s = scratch(() => new Date(AT));
    const slug = declaring(s);
    expect(s.core.db(slug, { op: "get", path: "tasks/t1" }).body).toMatchObject({
      doc: { exists: false },
    });
    expect(existsSync(dbPath(s, slug))).toBe(false);
    expect(set(s, slug, "tasks/t1", { title: "draft" }).status).toBe(200);
    expect(set(s, slug, "boards/b1/columns/c1", { name: "Doing" }).status).toBe(200);
    expect(set(s, slug, "tasks/t1", { title: "ship" }).status).toBe(200);
    expect(JSON.parse(readFileSync(dbPath(s, slug), "utf8"))).toEqual({
      tasks: { t1: { data: { title: "ship" }, version: 2, updatedAt: AT } },
      "boards/b1/columns": { c1: { data: { name: "Doing" }, version: 1, updatedAt: AT } },
    });
    expect(readdirSync(join(s.root, slug, ".store")).filter((n) => n.endsWith(".tmp"))).toEqual([]);
    s.server.stop();
  });
  test("T19 a refused write leaves the file byte for byte", () => {
    const s = scratch();
    const slug = declaring(s);
    set(s, slug, "tasks/t1", { title: "draft" });
    const before = readFileSync(dbPath(s, slug), "hex");
    const refused = [
      s.core.db(slug, {
        op: "write",
        batch: true,
        writes: [
          { op: "set", path: "tasks/t2", data: { title: "fine" } },
          { op: "set", path: "tasks/t1", data: { title: "late" }, ifVersion: 9 },
        ],
      }),
      set(s, slug, "tasks/t3", ["not", "an", "object"]),
      set(s, slug, "tasks", { title: "no document path" }),
    ];
    expect(refused.map((out) => out.status)).toEqual([409, 400, 400]);
    expect(readFileSync(dbPath(s, slug), "hex")).toBe(before);
    s.server.stop();
  });
  test("T19 an artifact that does not declare db has none", () => {
    const s = scratch();
    const slug = s.core.publish({ kind: "html", source: html(""), session: "A" }).manifest.slug;
    const out = set(s, slug, "tasks/t1", { title: "draft" });
    expect([out.status, out.body.code]).toEqual([403, "revoked"]);
    expect(s.core.db(slug, { op: "get", path: "tasks/t1" }).status).toBe(403);
    expect(existsSync(dbPath(s, slug))).toBe(false);
    s.server.stop();
  });
  test("T19 a duplicate starts with the source's documents, and the two then move apart", () => {
    const s = scratch();
    const slug = declaring(s);
    set(s, slug, "tasks/t1", { title: "draft" });
    const copy = s.core.duplicate(slug).slug;
    expect(dataAt(s, copy, "tasks/t1")).toEqual({ title: "draft" });
    set(s, copy, "tasks/t1", { title: "the copy's" });
    set(s, slug, "tasks/t2", { title: "the source's" });
    expect(dataAt(s, slug, "tasks/t1")).toEqual({ title: "draft" });
    expect(dataAt(s, copy, "tasks/t2")).toBeUndefined();
    // Nothing to carry, nothing written.
    const bare = s.core.duplicate(declaring(s, "Empty")).slug;
    expect(existsSync(dbPath(s, bare))).toBe(false);
    s.server.stop();
  });
  test("T19 delete takes the database along with the folder", () => {
    const s = scratch();
    const slug = declaring(s);
    set(s, slug, "tasks/t1", { title: "draft" });
    const dest = s.core.remove(slug);
    expect(existsSync(join(dest, ".store", "db.json"))).toBe(true);
    expect(set(s, slug, "tasks/t1", { title: "late" }).status).toBe(404);
    s.server.stop();
  });
});

describe("T20 uploaded assets on disk", () => {
  const AT = "2026-03-04T10:00:00.000Z";
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  const holding = (s: ReturnType<typeof scratch>, title = "Gallery") =>
    s.core.publish({
      kind: "html",
      source: html(""),
      title,
      capabilities: { assets: {}, db: {} },
      session: "A",
    }).manifest.slug;
  const upload = (s: ReturnType<typeof scratch>, slug: string, bytes: Uint8Array, type: string) =>
    s.core.assets(slug, { op: "upload", bytes, contentType: type });
  const assetsDir = (s: ReturnType<typeof scratch>, slug: string) =>
    join(s.root, slug, ".store", "assets");
  const indexOf = (s: ReturnType<typeof scratch>, slug: string) =>
    JSON.parse(readFileSync(join(assetsDir(s, slug), "index.json"), "utf8")) as unknown;

  test("T20 an upload is a file named by a minted id, and a row in the index, oldest first", () => {
    const s = scratch(() => new Date(AT));
    const slug = holding(s);
    expect(existsSync(assetsDir(s, slug))).toBe(false);
    const first = upload(s, slug, PNG, "image/png").body as { id: string; url: string };
    const second = upload(s, slug, content("a,b\n").bytes, "text/csv").body as { id: string };
    expect(first.id).toMatch(/^[a-f0-9]{32}$/);
    expect(first.url).toBe(`/_blob/${first.id}`);
    expect(second.id).not.toBe(first.id);
    expect(readdirSync(assetsDir(s, slug)).sort()).toEqual(
      [first.id, second.id, "index.json"].sort(),
    );
    expect(new Uint8Array(readFileSync(join(assetsDir(s, slug), first.id)))).toEqual(PNG);
    expect(indexOf(s, slug)).toEqual([
      { id: first.id, contentType: "image/png", sizeBytes: PNG.byteLength, createdAt: AT },
      { id: second.id, contentType: "text/csv", sizeBytes: 4, createdAt: AT },
    ]);
    s.server.stop();
  });
  test("T20 a refused upload stores nothing", () => {
    const s = scratch();
    const slug = holding(s);
    const refused = [
      upload(s, slug, PNG, "application/zip"),
      upload(s, slug, new Uint8Array(0), "image/png"),
      upload(s, slug, content("<html>").bytes, "image/png"),
      s.core.assets(slug, { op: "upload", bytes: null, contentType: "image/png" }),
    ];
    expect(refused.map((out) => [out.status, out.body.code])).toEqual([
      [415, "unsupported_type"],
      [400, "invalid_request"],
      [415, "unsupported_type"],
      [400, "invalid_request"],
    ]);
    expect(existsSync(assetsDir(s, slug))).toBe(false);
    s.server.stop();
  });
  test("T20 a deleted asset leaves the index; its bytes move to the trash", () => {
    const s = scratch(() => new Date(AT));
    const slug = holding(s);
    const { id } = upload(s, slug, PNG, "image/png").body as { id: string };
    const kept = upload(s, slug, PNG, "image/png").body as { id: string };
    expect(s.core.assets(slug, { op: "delete", ref: `/_blob/${id}` }).body).toEqual({
      ok: true,
      deleted: true,
    });
    expect(s.core.assets(slug, { op: "delete", ref: id }).body).toEqual({
      ok: true,
      deleted: false,
    });
    expect(readdirSync(assetsDir(s, slug)).sort()).toEqual([kept.id, "index.json"].sort());
    expect(s.core.asset(slug, id)).toBeNull();
    const trashed = join(s.trashDir, "pi-artifacts", "2026-03-04", `${slug}-asset-${id}`);
    expect(new Uint8Array(readFileSync(trashed))).toEqual(PNG);
    expect(s.core.assets(slug, { op: "delete", ref: "../manifest.json" }).status).toBe(400);
    expect(existsSync(join(s.root, slug, ".store", "manifest.json"))).toBe(true);
    s.server.stop();
  });
  test("T20 a duplicate holds the same assets under the same ids, in a folder of its own", () => {
    const s = scratch();
    const slug = holding(s);
    const { id } = upload(s, slug, PNG, "image/png").body as { id: string };
    s.core.db(slug, {
      op: "write",
      batch: false,
      writes: [{ op: "set", path: "photos/p1", data: { asset: id } }],
    });
    const copy = s.core.duplicate(slug).slug;
    expect(indexOf(s, copy)).toEqual(indexOf(s, slug));
    s.core.remove(slug);
    expect(s.core.asset(copy, id)?.bytes).toEqual(PNG);
    expect(s.core.db(copy, { op: "get", path: "photos/p1" }).body.doc).toMatchObject({
      data: { asset: id },
    });
    s.server.stop();
  });
  test("T20 an artifact that does not declare assets stores none", () => {
    const s = scratch();
    const slug = s.core.publish({ kind: "html", source: html(""), session: "A" }).manifest.slug;
    const out = upload(s, slug, PNG, "image/png");
    expect([out.status, out.body.code]).toEqual([403, "not_granted"]);
    expect(s.core.assets(slug, { op: "list" }).status).toBe(403);
    expect(existsSync(assetsDir(s, slug))).toBe(false);
    s.server.stop();
  });
});

describe("T21 an artifact made from a type", () => {
  const TYPE_PAGE =
    "<!doctype html><html><head><title>The Type's Own Title</title></head><body><script src=app.js></script></body></html>";
  /** A kanban board from the type `kanban`: its page, its script and its stylesheet, plus one file of its own. */
  const board = (s: ReturnType<typeof scratch>) =>
    s.core.publish({
      kind: "html",
      source: TYPE_PAGE,
      title: "  Q3   Roadmap ",
      type: { name: "kanban", paths: ["app.js", "css/board.css"] },
      files: {
        "app.js": content("render()"),
        "css/board.css": content(".col{}"),
        "data/cards.json": content("[]"),
      },
      capabilities: { artifact: {} },
      session: "A",
    });
  const snapshot = (dir: string): Array<[string, string]> =>
    readdirSync(dir, { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile())
      .map((entry): [string, string] => [
        join(entry.parentPath, entry.name),
        readFileSync(join(entry.parentPath, entry.name), "hex"),
      ])
      .sort(([a], [b]) => (a < b ? -1 : 1));
  const errorOf = (fn: () => unknown) => {
    try {
      fn();
      return null;
    } catch (e) {
      return e as Error & { status?: number; extra?: Record<string, unknown> };
    }
  };

  test("T21 the manifest records the type and its paths; the title is the session's", () => {
    const s = scratch();
    const made = board(s);
    expect(made.manifest).toMatchObject({
      title: "Q3 Roadmap",
      slug: "q3-roadmap",
      type: { name: "kanban", paths: ["index.html", "app.js", "css/board.css"] },
    });
    const onDisk = JSON.parse(
      readFileSync(join(s.root, "q3-roadmap", ".store", "manifest.json"), "utf8"),
    ) as { type: unknown };
    expect(onDisk.type).toEqual(made.manifest.type);
    expect(Object.keys(made.files).sort()).toEqual(["app.js", "css/board.css", "data/cards.json"]);
    expect(() =>
      s.core.publish({
        kind: "html",
        source: TYPE_PAGE,
        type: { name: "kanban", paths: [] },
        session: "A",
      }),
    ).toThrow(/title/);
    expect(s.store.list()).toHaveLength(1);
    s.server.stop();
  });
  test("T21 a republish without a page carries the page and lays the files over", () => {
    const s = scratch();
    const slug = board(s).manifest.slug;
    const second = s.core.publish({
      update: slug,
      files: { "data/cards.json": content('[{"id":1}]'), "notes.md": content("# plan") },
      session: "A",
    });
    expect(second).toMatchObject({ version: 2, created: false });
    expect(s.store.readPage(slug, 2)).toBe(s.store.readPage(slug, 1) as string);
    expect(s.store.readSource(slug)?.source).toBe(TYPE_PAGE);
    expect(second.manifest.title).toBe("Q3 Roadmap");
    expect(new TextDecoder().decode(s.core.file(slug, 2, "data/cards.json")?.bytes)).toBe(
      '[{"id":1}]',
    );
    expect(new TextDecoder().decode(s.core.file(slug, 2, "app.js")?.bytes)).toBe("render()");
    expect(s.core.file(slug, 2, "notes.md")).not.toBeNull();
    s.server.stop();
  });
  test("T21 a page, or a type's path, is read_only_path from the session and from the viewer, and writes nothing", () => {
    const s = scratch();
    const slug = board(s).manifest.slug;
    const before = snapshot(join(s.root, slug));
    const sessionTries = [
      () => s.core.publish({ kind: "html", source: html("mine"), update: slug, session: "A" }),
      () =>
        s.core.publish({
          update: slug,
          files: { "data/cards.json": content("[1]"), "app.js": content("evil()") },
          session: "A",
        }),
      () => s.core.publish({ update: slug, files: { "css/board.css": null }, session: "A" }),
      () => s.core.publish({ update: slug, files: { "index.html": content("x") }, session: "A" }),
    ];
    for (const attempt of sessionTries) {
      const error = errorOf(attempt);
      expect([error?.status, error?.extra?.code]).toEqual([403, "read_only_path"]);
    }
    const viewerTries = [
      s.core.selfPublish(slug, { baseVersion: 1, html: `<!doctype html>${html("mine")}` }),
      s.core.selfPublish(slug, {
        baseVersion: 1,
        files: { "app.js": { bytes: new TextEncoder().encode("evil()"), text: true } },
      }),
      s.core.selfPublish(slug, { baseVersion: 1, files: { "css/board.css": { delete: true } } }),
    ];
    expect(viewerTries.map((out) => [out.status, out.body.code])).toEqual([
      [403, "read_only_path"],
      [403, "read_only_path"],
      [403, "read_only_path"],
    ]);
    expect(snapshot(join(s.root, slug))).toEqual(before);
    // Its own files are the viewer's to publish.
    const own = s.core.selfPublish(slug, {
      baseVersion: 1,
      files: { "data/cards.json": { bytes: new TextEncoder().encode("[2]"), text: true } },
    });
    expect([own.status, own.body.version]).toEqual([200, "2"]);
    s.server.stop();
  });
  test("T21 an artifact made from no type cannot republish without a page; a type cannot be laid over one", () => {
    const s = scratch();
    const plain = s.core.publish({ kind: "html", source: html(""), title: "Plain", session: "A" })
      .manifest.slug;
    expect(() =>
      s.core.publish({ update: plain, files: { "a.css": content("a") }, session: "A" }),
    ).toThrow(/page/);
    expect(() => s.core.publish({ files: { "a.css": content("a") }, session: "A" })).toThrow(
      /page/,
    );
    expect(() =>
      s.core.publish({
        kind: "html",
        source: TYPE_PAGE,
        title: "Late",
        update: plain,
        type: { name: "kanban", paths: [] },
        session: "A",
      }),
    ).toThrow(/new artifact/);
    expect(s.store.get(plain)).toMatchObject({ current: 1 });
    expect(s.store.get(plain)?.type).toBeUndefined();
    s.server.stop();
  });
  test("T21 a duplicate is of the same type", () => {
    const s = scratch();
    const slug = board(s).manifest.slug;
    const copy = s.core.duplicate(slug);
    expect(copy.type).toEqual({ name: "kanban", paths: ["index.html", "app.js", "css/board.css"] });
    expect(() =>
      s.core.publish({ update: copy.slug, files: { "app.js": content("x") }, session: "A" }),
    ).toThrow(/read-only/);
    s.server.stop();
  });
});
