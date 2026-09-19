// Contract — the pi side (src/ui): the tool, the hooks, the strip, the selector
//
// S1: publish makes v1, opens the browser once, and the result tells the model the
//     strip shows the page and not to paste the URL; the strip gains one badge
// S2: ask blocks until the page replies; the answers come back as the result, the
//     version is still 1, and the pending event is acknowledged; a timeout tells the
//     model to end its turn
// S3: a republish (same file_path, no url) is v2 in place; the strip badge follows
// S4: a page reply wakes only the session that owns the page: session A's page never
//     produces a feedback message in session B, and B is told the reply is held
// S5: session_start fills the strip with this session's pages and summarises replies
//     that arrived on them while away; other sessions' replies are not summarised
// S6: the strip renders at most five titles newest first, folds the rest into +N,
//     wraps each badge in an OSC 8 link to the tokened URL, marks pending with ●,
//     never emits a control character from a title, and draws the selected badge
//     as a pill with its keys named after the row
// S7: with focus in the footer ←/→ move, enter opens, c copies, x dismisses, esc and
//     ↑ hand focus back, any other key hands it back and is typed; alt+a opens the
//     newest page; session_start installs the editor that shares its focus
// S9: the /artifacts gallery lists every page under All / This session / Other
//     sessions, pinned first then newest, windows a long list, filters by search,
//     and maps enter → attach (then closes), o, c, p, w, and d-then-y → delete;
//     attaching makes this session the owner, adds the badge, and tells the model
// S10: a page the model authors at .pi/artifacts/<slug>/<file> publishes to that slug,
//      beside the server's .store, and the same path republishes it
// S11: restart ends the server and locates it again; the session keeps its badges
//      and is still woken by its pages afterwards
// S8: delete asks in the terminal, moves the folder to the trash, and drops the badge;
//     verify without viewers says it is not evidence of a clean render

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { ago, Gallery, type GalleryAction } from "@ext/artifacts/src/ui/gallery";
import { type KeyResult, Selector } from "@ext/artifacts/src/ui/selector";
import { type Badge, renderStrip, Strip, STRIP_KEY } from "@ext/artifacts/src/ui/strip";

import { DEFAULT_CONFIG, type Manifest } from "@ext/artifacts/src/domain/types";
import { Host } from "@ext/artifacts/src/ui/host";

import { QUESTIONS, sleep, stopAll, wire } from "../fixture";

afterEach(stopAll);

const PAGE = "<h1>Plan</h1><p>body</p>";

describe("S1 publish", () => {
  test("S1 v1, opened once, no URL pasting, one badge", async () => {
    const w = wire();
    const path = w.file("docs/plan.html", PAGE);
    const { text, details } = await w.run({ file_path: path });
    expect(details).toMatchObject({ version: 1, slug: "plan" });
    expect(w.opened).toHaveLength(1);
    expect(text).toMatch(/do not paste the URL/i);
    expect(text).not.toMatch(/^Opened http/m);
    expect(w.host.badges().map((b) => b.slug)).toEqual(["plan"]);
    expect(existsSync(join(w.storeRoot, "plan", ".store", "versions", "v1.html"))).toBe(true);
  });
});

describe("S2 ask", () => {
  test("S2 the page's reply is the result; v1 stays; pending is acknowledged", async () => {
    const w = wire();
    const pending = w.run({ action: "ask", title: "Pricing", questions: QUESTIONS, timeout: 5 });
    await sleep(50);
    const island = (await (await w.api("/artifacts/pricing")).json()) as {
      island: Record<string, unknown>;
    };
    const res = await w.pageRespond("pricing", 1, {
      ...island.island,
      answers: { tiering: { selected: ["Seat-based"] } },
    });
    expect(res.status).toBe(200);
    const { text, details } = await pending;
    expect(text).toContain("Seat-based");
    expect(text).toContain("reply 1 to v1");
    expect(details?.version).toBe(1);
    await sleep(30);
    const m = (await (await w.api("/artifacts/pricing")).json()) as {
      manifest: { current: number; pending: unknown[] };
    };
    expect(m.manifest.current).toBe(1);
    expect(m.manifest.pending).toHaveLength(0);
    expect(w.feedback()).toHaveLength(0);
  });
  test("S2 a timeout tells the model to end its turn and wait", async () => {
    const w = wire();
    const { text } = await w.run({
      action: "ask",
      title: "Slow",
      questions: QUESTIONS,
      timeout: 0.05,
    });
    expect(text).toMatch(/end your turn/i);
  });
});

describe("S3 republish in place", () => {
  test("S3 same file_path → v2 at the same slug; badge shows v2", async () => {
    const w = wire();
    const path = w.file("docs/plan.html", PAGE);
    await w.run({ file_path: path });
    const { details } = await w.run({ file_path: path });
    expect(details).toMatchObject({ slug: "plan", version: 2 });
    expect(w.opened).toHaveLength(1);
    expect(w.host.badges()[0]?.version).toBe("v2");
  });
  test("S3 same file_path after another session's v2 is refused, not overwritten", async () => {
    const a = wire({ session: "session-A" });
    const b = wire({
      session: "session-B",
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    const path = a.file("docs/plan.html", PAGE);
    await a.run({ file_path: path });
    await b.run({ action: "watch", url: "plan" });
    expect((await b.run({ file_path: path })).details).toMatchObject({ slug: "plan", version: 2 });
    await expect(a.run({ file_path: path })).rejects.toThrow(/v2/);
  });
});

describe("S10 a page authored in the store", () => {
  test("S10 .pi/artifacts/<slug>/<file> publishes to that slug and republishes in place", async () => {
    const w = wire();
    const path = w.file(".pi/artifacts/tide-table/tide-table.html", "<h1>Tides at Dover</h1>");
    const first = await w.run({ file_path: path });
    expect(first.details).toMatchObject({
      slug: "tide-table",
      version: 1,
      title: "Tides at Dover",
    });
    expect(existsSync(join(w.storeRoot, "tide-table", ".store", "index.html"))).toBe(true);
    expect(existsSync(join(w.storeRoot, "tide-table", "tide-table.html"))).toBe(true);
    expect((await w.run({ file_path: path })).details).toMatchObject({
      slug: "tide-table",
      version: 2,
    });
  });
});

describe("S4 owner-only wakes", () => {
  test("S4 A's page wakes A; B hears only that a reply is held", async () => {
    const a = wire({ session: "session-A" });
    const b = wire({
      session: "session-B",
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    await b.sessionStart();
    await a.run({ file_path: a.file("a.html", PAGE), title: "A page" });
    await sleep(30);
    expect((await a.pageRespond("a-page", 1, { x: 1 })).status).toBe(200);
    expect(await a.feedbackCount(1)).toBe(1);
    expect(a.feedback()[0]?.options?.triggerTurn).toBe(true);
    expect(b.feedback()).toHaveLength(0);
    // A goes away; the next reply is held and B is told, never woken.
    await a.host.shutdown(false);
    expect((await a.pageRespond("a-page", 1, { x: 2 })).status).toBe(200);
    await sleep(60);
    expect(b.feedback()).toHaveLength(0);
    expect(b.ctx.notifications.some((n) => /waiting/.test(n.message))).toBe(true);
    const m = (await (await b.api("/artifacts/a-page")).json()) as {
      manifest: { pending: unknown[] };
    };
    expect(m.manifest.pending).toHaveLength(1);
  });
});

describe("S5 session_start", () => {
  test("S5 my pages fill the strip; my held replies are summarised; others' are not", async () => {
    const a = wire({ session: "session-A" });
    await a.run({ file_path: a.file("a.html", PAGE), title: "Mine" });
    await a.host.shutdown(false);
    await a.pageRespond("mine", 1, { x: 1 });
    const other = wire({
      session: "session-C",
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    await other.run({ file_path: other.file("c.html", PAGE), title: "Theirs" });
    await other.host.shutdown(false);
    await other.pageRespond("theirs", 1, { y: 1 });

    const again = wire({
      session: "session-A",
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    await again.sessionStart();
    expect(again.ctx.status.get(STRIP_KEY)).toContain("Mine");
    expect(again.ctx.status.get(STRIP_KEY)).not.toContain("Theirs");
    const summary = again.fake.sent.find((s) => s.message.customType === "artifact-feedback");
    expect(summary?.message.content).toContain("mine");
    expect(summary?.message.content).not.toContain("theirs");
    expect(summary?.options?.deliverAs).toBe("nextTurn");
  });
});

describe("S6 the strip", () => {
  const badge = (n: number, over: Partial<Badge> = {}): Badge => ({
    slug: `s${n}`,
    title: `Title ${n}`,
    version: "v1",
    url: `http://localhost:5834/a/s${n}?t=tok`,
    pending: 0,
    at: `2026-01-0${n}T00:00:00.000Z`,
    ...over,
  });
  test("S6 five titles, +N, OSC 8 links, ● for pending, no index or version", () => {
    const row = renderStrip(
      [1, 2, 3, 4, 5, 6, 7].map((n) => badge(n, { pending: n === 2 ? 1 : 0 })),
    );
    expect(row).toContain("\x1b]8;;http://localhost:5834/a/s1?t=tok\x1b\\");
    expect(row).toContain("+2");
    expect(row).not.toContain("Title 6");
    expect(row).toContain("● Title 2");
    expect(row.split(" · ")).toHaveLength(6);
    expect(renderStrip([badge(1)], { links: false })).toBe("Title 1");
  });
  test("S6 a hostile title cannot break out of the line", () => {
    const row = renderStrip([badge(1, { title: "x\x1b[2J\x1b]0;pwned\x07y" })], { links: false });
    expect(row).toBe("xy");
  });
  test("S6 the selected badge is a filled pill, named keys follow, the window follows it", () => {
    const badges = [1, 2, 3, 4, 5, 6, 7].map((n) => badge(n));
    const paint = {
      accent: (t: string) => t,
      dim: (t: string) => t,
      warn: (t: string) => t,
      selected: (t: string) => `<${t}>`,
    };
    expect(renderStrip(badges.slice(0, 2), { links: false, paint, selected: 0 })).toBe(
      "< Title 1 > · Title 2 · Enter to open · x to dismiss",
    );
    const far = renderStrip(badges, { links: false, paint, selected: 6 });
    expect(far).toContain("< Title 7 >");
    expect(far).not.toContain("Title 2");
  });
});

describe("S7 the footer's keys", () => {
  const matches = (data: string, key: string) => data === key;
  const footer = () => {
    const strip = new Strip();
    for (const n of [1, 2, 3])
      strip.upsert({
        slug: `s${n}`,
        title: `T${n}`,
        version: "v1",
        url: `u${n}`,
        pending: 0,
        at: `${9 - n}`,
      });
    const selector = new Selector(strip, matches);
    expect(selector.enter()).toBe(true);
    return { strip, selector };
  };
  const rows: Array<[string, string[], KeyResult, number | null]> = [
    [
      "right, enter",
      ["right", "return"],
      { kind: "handled", choice: { action: "open", slug: "s2" } },
      null,
    ],
    [
      "left wraps, enter",
      ["left", "return"],
      { kind: "handled", choice: { action: "open", slug: "s3" } },
      null,
    ],
    ["c copies", ["right", "c"], { kind: "handled", choice: { action: "copy", slug: "s2" } }, null],
    [
      "x dismisses and focus stays",
      ["x"],
      { kind: "handled", choice: { action: "dismiss", slug: "s1" } },
      0,
    ],
    ["down stays", ["down"], { kind: "handled" }, 0],
    ["esc hands focus back", ["right", "escape"], { kind: "left", passthrough: false }, null],
    ["up hands focus back", ["up"], { kind: "left", passthrough: false }, null],
    ["a typed key hands focus back and is typed", ["h"], { kind: "left", passthrough: true }, null],
  ];
  test.each(rows)("S7 %s", (_name, keys, expected, selected) => {
    const { strip, selector } = footer();
    let out: KeyResult | undefined;
    for (const k of keys) out = selector.handleInput(k);
    expect(out).toEqual(expected);
    expect(strip.selected).toBe(selected);
  });
  test("S7 nothing to select: focus stays with the editor", () => {
    expect(new Selector(new Strip(), matches).enter()).toBe(false);
  });
  test("S7 dismissing the last badge hands focus back", () => {
    const strip = new Strip();
    strip.upsert({ slug: "s1", title: "T1", version: "v1", url: "u1", pending: 0, at: "1" });
    new Selector(strip, matches).enter();
    strip.remove("s1");
    expect(strip.selected).toBeNull();
  });
  test("S7 alt+a opens the newest page; session_start shares the editor's focus", async () => {
    const w = wire();
    await w.sessionStart();
    expect(w.ctx.customEditor()).toBe(true);
    await w.run({ file_path: w.file("old.html", PAGE), title: "Old" });
    await sleep(5);
    await w.run({ file_path: w.file("new.html", PAGE), title: "New" });
    const before = w.opened.length;
    await w.fake.shortcuts.get("alt+a")?.handler(w.ctx.ctx);
    expect(w.opened.slice(before)).toHaveLength(1);
    expect(w.opened.at(-1)).toContain("/a/new");
  });
});

describe("S8 delete and verify", () => {
  test("S8 delete confirms, trashes, drops the badge", async () => {
    const w = wire({ confirm: () => true });
    await w.run({ file_path: w.file("gone.html", PAGE), title: "Gone" });
    const { text } = await w.run({ action: "delete", url: "gone" });
    expect(text).toContain(w.trashDir);
    expect(w.ctx.dialogs[0]?.kind).toBe("confirm");
    expect(w.host.badges()).toHaveLength(0);
    expect(existsSync(join(w.storeRoot, "gone"))).toBe(false);
  });
  test("S8 delete declined keeps the page; verify with no viewers is not a pass", async () => {
    const w = wire({ confirm: () => false });
    await w.run({ file_path: w.file("keep.html", PAGE), title: "Keep" });
    await w.run({ action: "delete", url: "keep" });
    expect(existsSync(join(w.storeRoot, "keep", ".store", "manifest.json"))).toBe(true);
    const { text } = await w.run({ action: "verify", url: "keep" });
    expect(text).toMatch(/NOT evidence/);
    await w.page("/a/keep/diagnostics", "keep", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: 1, rows: [{ level: "error", message: "boom" }] }),
    });
    const after = await w.run({ action: "verify", url: "keep" });
    expect(after.text).toContain("boom");
    expect(after.details?.summary).toContain("1 errors");
  });
});

describe("S9 the gallery", () => {
  const NOW = new Date("2026-02-01T00:00:00.000Z");
  const manifest = (n: number, over: Partial<Manifest> = {}): Manifest => ({
    slug: `s${n}`,
    title: `Page ${n}`,
    source: "html",
    createdAt: NOW.toISOString(),
    updatedAt: new Date(NOW.getTime() - n * 86_400_000).toISOString(),
    lastActivityAt: NOW.toISOString(),
    current: 1,
    versions: [],
    responses: [],
    watched: true,
    owner: "other",
    sessions: ["other"],
    pinned: false,
    pending: [],
    ...over,
  });
  const paint = {
    accent: (t: string) => t,
    dim: (t: string) => t,
    warn: (t: string) => t,
    bold: (t: string) => t,
    selected: (t: string) => `[${t.trim()}]`,
  };
  const open = async (all: Manifest[], rows = 20) => {
    const acts: Array<[GalleryAction, string]> = [];
    let closed = false;
    const gallery = new Gallery({
      session: "me",
      load: async () => all,
      act: async (action, m) => void acts.push([action, m.slug]),
      done: () => (closed = true),
      requestRender: () => {},
      paint,
      matches: (data, key) => data === key,
      now: () => NOW,
      rows,
    });
    await gallery.refresh();
    const press = async (...keys: string[]) => {
      for (const k of keys) gallery.handleInput(k);
      await sleep(1);
    };
    return {
      gallery,
      acts,
      press,
      closed: () => closed,
      text: () => gallery.render(120).join("\n"),
    };
  };
  const pages = [
    manifest(1),
    manifest(2, { owner: "me", sessions: ["me"] }),
    manifest(3, { pinned: true, sessions: ["other", "me"], pending: [{ id: "e" } as never] }),
  ];

  test("S9 tabs count and filter; pinned first then newest; facts on the row", async () => {
    const g = await open(pages);
    expect(g.text()).toContain("[All 3]");
    expect(g.text()).toContain("⧉ This session 2");
    expect(g.text()).toContain("↳ Other sessions 1");
    expect(g.gallery.visible().map((m) => m.slug)).toEqual(["s3", "s1", "s2"]);
    expect(g.text()).toContain("❯ ⧉ Page 3  v1 · pinned · 1 pending · 3d ago");
    await g.press("tab");
    expect(g.gallery.visible().map((m) => m.slug)).toEqual(["s3", "s2"]);
    await g.press("tab");
    expect(g.gallery.visible().map((m) => m.slug)).toEqual(["s1"]);
  });
  test("S9 search narrows the list; esc clears it before it closes the gallery", async () => {
    const g = await open(pages);
    await g.press("/", "2", "return");
    expect(g.gallery.visible().map((m) => m.slug)).toEqual(["s2"]);
    await g.press("escape");
    expect(g.gallery.visible()).toHaveLength(3);
    expect(g.closed()).toBe(false);
    await g.press("escape");
    expect(g.closed()).toBe(true);
  });
  test("S9 enter attaches and closes; o c p w act on the selected row and stay", async () => {
    const g = await open(pages);
    await g.press("down", "o", "c", "p", "w");
    expect(g.acts).toEqual([
      ["open", "s1"],
      ["copy", "s1"],
      ["pin", "s1"],
      ["watch", "s1"],
    ]);
    expect(g.closed()).toBe(false);
    await g.press("return");
    expect(g.acts.at(-1)).toEqual(["attach", "s1"]);
    expect(g.closed()).toBe(true);
  });
  test("S9 an attach that fails stays open and says why", async () => {
    let closed = false;
    const gallery = new Gallery({
      session: "me",
      load: async () => pages,
      act: async () => {
        throw new Error("the server is gone");
      },
      done: () => (closed = true),
      requestRender: () => {},
      paint,
      matches: (data, key) => data === key,
      now: () => NOW,
    });
    await gallery.refresh();
    gallery.handleInput("return");
    await sleep(1);
    expect(closed).toBe(false);
    expect(gallery.render(120).join("\n")).toContain("the server is gone");
  });
  test("S9 d asks first: y deletes, anything else cancels", async () => {
    const g = await open(pages);
    await g.press("d");
    expect(g.text()).toContain('Move "Page 3" to the trash?');
    await g.press("n");
    expect(g.acts).toHaveLength(0);
    await g.press("d", "y");
    expect(g.acts).toEqual([["delete", "s3"]]);
  });
  test("S9 a long list is windowed around the selection", async () => {
    const g = await open(
      [1, 2, 3, 4, 5, 6].map((n) => manifest(n)),
      3,
    );
    expect(g.text()).toContain("↓ 3 more below");
    await g.press("down", "down", "down");
    expect(g.text()).toContain("↑ 1 more above");
    expect(g.text()).toContain("❯ ⧉ Page 4");
  });
  test("S9 ages", () => {
    const at = (ms: number) => ago(new Date(NOW.getTime() - ms).toISOString(), NOW);
    expect([at(5_000), at(3 * 3_600_000), at(15 * 86_400_000), at(40 * 86_400_000)]).toEqual([
      "now",
      "3h ago",
      "2w ago",
      "1mo ago",
    ]);
  });
  test("S9 attaching makes this session the owner, adds the badge, and tells the model", async () => {
    const a = wire({ session: "session-A" });
    const b = wire({
      session: "session-B",
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    await a.run({ file_path: a.file("plan.html", PAGE), title: "Plan" });
    await b.sessionStart();
    const m = await b.host.attach("plan");
    expect(m.owner).toBe("session-B");
    expect(b.host.badges().map((x) => x.slug)).toEqual(["plan"]);
    const note = b.feedback().at(-1);
    expect(note?.message.content).toMatch(/attached .*"Plan" \(plan\)/);
    expect(note?.message.content).toMatch(/read/);
    expect(note?.options?.triggerTurn).toBeUndefined();
  });
});

describe("S11 restart", () => {
  test("S11 stop, then locate again; badges stay and the page still wakes the session", async () => {
    const w = wire();
    const calls: string[] = [];
    const sent: string[] = [];
    const host = new Host({
      config: DEFAULT_CONFIG,
      session: "session-R",
      locate: async () => {
        calls.push("locate");
        return {
          origin: w.backend.server.origin,
          port: w.backend.server.port,
          token: w.backend.token,
          viewer: w.backend.viewer,
        };
      },
      stop: async () => {
        calls.push("stop");
        return true;
      },
      open: async () => null,
      send: (content) => void sent.push(content),
      notify: () => {},
    });
    await host.publish({ kind: "html", source: PAGE, title: "Kept" });
    expect(calls).toEqual(["locate"]);
    await host.restart();
    expect(calls).toEqual(["locate", "stop", "locate"]);
    expect(host.badges().map((b) => b.slug)).toEqual(["kept"]);
    await sleep(30);
    expect((await w.pageRespond("kept", 1, { x: 1 })).status).toBe(200);
    await sleep(60);
    expect(sent).toHaveLength(1);
    await host.shutdown(false);
  });
});
