// Contract — the store on disk (src/infra/store) through the core
//
// T1: a publish writes <slug>/.store/index.html, source, versions/v1.html+json, and
//     a manifest owned by the publishing session; a republish appends v2 and
//     rewrites index.html; the old version stays readable
// T2: a page reply writes .store/responses/v<N>-r<K>.json, leaves `current` alone, and the
//     current island is the version with the reply over it; a second reply is r2
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
//     owns is refused; a flat folder from the old layout is moved under .store

import { afterEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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
    expect(existsSync(join(dir, "index.html"))).toBe(true);
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
    expect(s.store.readPage(first.manifest.slug)).toContain("two");
    expect(s.store.readPage(first.manifest.slug, 1)).toContain("one");
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
  test("T7 an artifact in the old flat layout is moved under .store and still reads", () => {
    const s = scratch();
    const p = s.core.publish({ kind: "html", source: html("old"), session: "A" });
    const dir = join(s.root, p.manifest.slug);
    // undo the layout: what a store written before .store looks like
    for (const name of readdirSync(join(dir, ".store")))
      renameSync(join(dir, ".store", name), join(dir, name));
    rmSync(join(dir, ".store"), { recursive: true });
    expect(s.store.get(p.manifest.slug)).toBeNull();
    expect(s.store.migrate()).toEqual([p.manifest.slug]);
    expect(s.store.get(p.manifest.slug)?.current).toBe(1);
    expect(s.store.readPage(p.manifest.slug)).toContain("old");
    expect(readdirSync(dir)).toEqual([".store"]);
    expect(s.store.migrate()).toEqual([]);
    s.server.stop();
  });
});
