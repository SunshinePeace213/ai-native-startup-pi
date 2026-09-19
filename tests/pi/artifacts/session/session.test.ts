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
// S6: the strip renders at most five badges newest first, folds the rest into +N,
//     wraps each badge in an OSC 8 link to the tokened URL, marks pending with ●,
//     and never emits a control character from a title
// S7: the selector answers ←/→, enter, c, x, digits and esc with the right choice
// S8: delete asks in the terminal, moves the folder to the trash, and drops the badge;
//     verify without viewers says it is not evidence of a clean render

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { Selector, type Choice } from "@ext/artifacts/src/ui/overlay";
import { type Badge, renderStrip, STRIP_KEY } from "@ext/artifacts/src/ui/strip";

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
    expect(existsSync(join(w.storeRoot, "plan", "versions", "v1.html"))).toBe(true);
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
  test("S6 five badges, +N, OSC 8 links, ● for pending", () => {
    const row = renderStrip(
      [1, 2, 3, 4, 5, 6, 7].map((n) => badge(n, { pending: n === 2 ? 1 : 0 })),
    );
    expect(row).toContain("\x1b]8;;http://localhost:5834/a/s1?t=tok\x1b\\");
    expect(row).toContain("+2");
    expect(row).not.toContain("Title 6");
    expect(row).toContain("● Title 2");
    expect(row.split(" · ")).toHaveLength(6);
  });
  test("S6 a hostile title cannot break out of the line", () => {
    const row = renderStrip([badge(1, { title: "x\x1b[2J\x1b]0;pwned\x07y" })], { links: false });
    expect(row).toBe("1 xy v1");
  });
});

describe("S7 the selector", () => {
  const badges: Badge[] = [1, 2, 3].map((n) => ({
    slug: `s${n}`,
    title: `T${n}`,
    version: "v1",
    url: `u${n}`,
    pending: 0,
    at: "",
  }));
  const matches = (data: string, key: string) => data === key;
  const drive = (keys: string[]): Choice => {
    let out: Choice = null;
    const sel = new Selector({
      badges,
      paint: { accent: (t) => t, dim: (t) => t, warn: (t) => t, selected: (t) => `<${t}>` },
      matches,
      done: (c) => (out = c),
    });
    for (const k of keys) sel.handleInput(k);
    return out;
  };
  const rows: Array<[string, string[], Choice]> = [
    ["right, enter", ["right", "return"], { action: "open", slug: "s2" }],
    ["left wraps, enter", ["left", "return"], { action: "open", slug: "s3" }],
    ["digit 3", ["3"], { action: "open", slug: "s3" }],
    ["c copies", ["right", "c"], { action: "copy", slug: "s2" }],
    ["x dismisses", ["x"], { action: "dismiss", slug: "s1" }],
    ["esc", ["right", "escape"], null],
  ];
  test.each(rows)("S7 %s", (_name, keys, expected) => {
    expect(drive(keys)).toEqual(expected);
  });
  test("S7 the highlighted badge is painted as selected", () => {
    const sel = new Selector({
      badges,
      paint: { accent: (t) => t, dim: (t) => t, warn: (t) => t, selected: (t) => `<${t}>` },
      matches,
      done: () => {},
    });
    sel.handleInput("right");
    expect(sel.render(200)[0]).toContain("<2 T2 v1>");
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
    expect(existsSync(join(w.storeRoot, "keep", "manifest.json"))).toBe(true);
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
