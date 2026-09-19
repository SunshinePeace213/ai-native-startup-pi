// store — the on-disk layout of .pi/extensions/artifacts on a scratch root.
//
// T1  create → <slug>/manifest.json at v1, source.<kind>, data.json, v1.html,
//     v1.json; the slug is the title's kebab-case; a second artifact with the
//     same title gets -2
// T2  addVersion → current increments, one v<N>.html and v<N>.json per version
//     (readIsland(slug, n) reads that version's island), the source is
//     rewritten only when given; `by` and bytes are recorded
// T3  pushPending appends to events.jsonl and the manifest; takePending by id
//     removes only those; without ids it clears all
// T4  setOwner / setWatched with an owner record who wakes for the artifact
// T5  remove → the folder is moved under the trash dir and is gone from the
//     root; the trash copy still holds every version
// T6  token → created once, stable across Store instances, owner-only, hex;
//     readToken never creates one
// T7  the server record round-trips and clears; a malformed one reads as null

import { describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { slugify, Store } from "@ext/artifacts/server/store";
import {
  clearServerRecord,
  readServerRecord,
  readToken,
  writeServerRecord,
} from "@ext/artifacts/shared/record";

const scratch = () => mkdtempSync(join(tmpdir(), "artifacts-store-"));
const input = (title: string) => ({
  title,
  kind: "html" as const,
  source: "<h1>x</h1>",
  html: "<html>v1</html>",
  island: { a: 1 },
});

describe("artifacts store", () => {
  test("T1 create lays out the artifact and derives a unique slug", () => {
    const root = scratch();
    const store = new Store(root);
    const m = store.create(input("Deploy Failures: by service"));
    expect(m.slug).toBe("deploy-failures-by-service");
    expect(m.current).toBe(1);
    expect(m.watched).toBe(true);
    const dir = join(root, m.slug);
    expect(readdirSync(dir).sort()).toEqual([
      "data.json",
      "manifest.json",
      "source.html",
      "v1.html",
      "v1.json",
    ]);
    expect(JSON.parse(readFileSync(join(dir, "data.json"), "utf8"))).toEqual({ a: 1 });
    expect(store.create(input("Deploy Failures: by service")).slug).toBe(
      "deploy-failures-by-service-2",
    );
    expect(slugify("Ünïcödé — Title!!")).toBe("unicode-title");
    expect(slugify("!!!")).toBe("artifact");
  });

  test("T2 addVersion increments, keeps every version and its island, rewrites source only when given", () => {
    const root = scratch();
    const store = new Store(root);
    const { slug } = store.create(input("Plan"));
    store.addVersion(slug, { html: "<html>v2</html>", island: { a: 2 }, by: "page" });
    store.addVersion(slug, {
      html: "<html>v3</html>",
      island: null,
      by: "agent",
      source: "<h1>y</h1>",
    });
    const m = store.get(slug);
    expect(m?.current).toBe(3);
    expect(m?.versions.map((v) => [v.n, v.by])).toEqual([
      [1, "agent"],
      [2, "page"],
      [3, "agent"],
    ]);
    expect(m?.versions[1]?.bytes).toBe(Buffer.byteLength("<html>v2</html>"));
    expect(store.readVersion(slug, 1)).toBe("<html>v1</html>");
    expect(store.readVersion(slug)).toBe("<html>v3</html>");
    expect(store.readSource(slug)?.source).toBe("<h1>y</h1>");
    expect(store.readIsland(slug)).toBeNull();
    expect(store.readIsland(slug, 1)).toEqual({ a: 1 });
    expect(store.readIsland(slug, 2)).toEqual({ a: 2 });
    expect(store.readIsland(slug, 3)).toBeNull();
  });

  test("T3 pending events are appended, taken by id, or cleared", () => {
    const root = scratch();
    const store = new Store(root);
    const { slug } = store.create(input("Plan"));
    store.pushPending(slug, { id: "e1", at: "t", kind: "republish", version: 2 });
    store.pushPending(slug, { id: "e2", at: "t", kind: "comment", version: 2, threadId: "t1" });
    expect(
      readFileSync(join(root, slug, "events.jsonl"), "utf8")
        .trim()
        .split("\n"),
    ).toHaveLength(2);
    expect(store.takePending(slug, ["e1"]).map((e) => e.id)).toEqual(["e1"]);
    expect(store.get(slug)?.pending.map((e) => e.id)).toEqual(["e2"]);
    expect(store.takePending(slug).map((e) => e.id)).toEqual(["e2"]);
    expect(store.get(slug)?.pending).toEqual([]);
  });

  test("T4 the owner is recorded by create, setOwner, and setWatched", () => {
    const root = scratch();
    const store = new Store(root);
    const { slug } = store.create({ ...input("Plan"), owner: "s1" });
    expect(store.get(slug)?.owner).toBe("s1");
    store.setOwner(slug, "s2");
    expect(store.get(slug)?.owner).toBe("s2");
    expect(store.setWatched(slug, false).owner).toBe("s2");
    expect(store.setWatched(slug, true, "s3").owner).toBe("s3");
  });

  test("T5 remove moves the folder to the trash and deletes nothing", () => {
    const root = scratch();
    const trash = scratch();
    const store = new Store(root);
    const { slug } = store.create(input("Plan"));
    store.addVersion(slug, { html: "<html>v2</html>", island: null, by: "agent" });
    const dest = store.remove(slug, trash);
    expect(existsSync(join(root, slug))).toBe(false);
    expect(dest.startsWith(trash)).toBe(true);
    expect(readdirSync(dest).sort()).toEqual([
      "data.json",
      "manifest.json",
      "source.html",
      "v1.html",
      "v1.json",
      "v2.html",
      "v2.json",
    ]);
    expect(store.get(slug)).toBeNull();
  });

  test("T6 the token is created once and read back by any instance", () => {
    const root = scratch();
    expect(readToken(root)).toBeNull();
    const first = new Store(root).token();
    expect(readToken(root)).toBe(first);
    expect(first).toMatch(/^[a-f0-9]{48}$/);
    expect(new Store(root).token()).toBe(first);
    if (process.platform !== "win32") {
      expect(statSync(join(root, ".token")).mode & 0o777).toBe(0o600);
    }
  });

  test("T7 the server record round-trips and clears", () => {
    const root = scratch();
    expect(readServerRecord(root)).toBeNull();
    const record = {
      pid: 123,
      port: 5834,
      requestedPort: 5834,
      origin: "http://localhost:5834",
      root,
      startedAt: "2026-09-19T10:00:00Z",
    };
    writeServerRecord(root, record);
    expect(readServerRecord(root)).toEqual(record);
    clearServerRecord(root);
    expect(readServerRecord(root)).toBeNull();
    writeFileSync(join(root, ".server.json"), "{nope");
    expect(readServerRecord(root)).toBeNull();
  });
});
