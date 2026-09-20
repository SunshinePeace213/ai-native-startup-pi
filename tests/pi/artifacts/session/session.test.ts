// Contract — the pi side (src/ui): the tool, the hooks, the strip, the selector
//
// S1: publish makes v1, opens the browser once, and the result tells the model the
//     strip shows the page and not to paste the URL; the strip gains one badge
// S2: ask blocks until the page replies; the answers come back as the result, the
//     version is still 1, and the pending event is acknowledged; a timeout tells the
//     model to end its turn
// S3: a republish (same file_path, no url) is v2 in place; the strip badge follows; a
//     republish over a version another session wrote is refused with the current one,
//     and `force` overwrites it
// S4: a page reply wakes only the session that owns the page: session A's page never
//     produces a feedback message in session B, and B is told the reply is held
// S5: session_start fills the strip with this session's pages and summarises replies
//     that arrived on them while away; other sessions' replies are not summarised
// S6: the strip is one status row, as Claude Code draws it: `⧉`, then a pill per page
//     this session holds, oldest → newest so the newest is rightmost, each named after
//     the file it was published from without its extension — its slug when it came
//     from no file — with ● first while a reply waits; at most five show, the five
//     newest, older ones folded into a leading +N, and the window follows the
//     selection; no control character from a file name reaches the row; with focus
//     the row leads with `❯`, fills the selected pill, and ends with
//     `←/→ to navigate · Enter to open · x to dismiss`, without focus it has neither;
//     every pill is an OSC 8 link to its tokened URL, so on pi's fullscreen screen a
//     plain click on a pill's cells opens that page and a click elsewhere opens nothing
// S7: `down` on an empty prompt selects the newest pill — on a prompt with text, or
//     with no pills, the key stays the editor's; there ←/→ move and wrap, enter
//     opens, c copies, x dismisses, esc and ↑ hand focus back, any other key hands it
//     back and is typed; alt+a opens the newest page (ctrl+] is left to pi's editor);
//     session_start installs
//     the editor that shares its focus
// S10: a page the model authors at .pi/artifacts/<slug>/<file> publishes to that slug,
//      beside the server's .store, and the same path republishes it
// S11: restart ends the server and locates it again; the session keeps its badges
//      and is still woken by its pages afterwards
// S8: delete asks in the terminal, moves the folder to the trash, and drops the badge;
//     verify without viewers says it is not evidence of a clean render
// S13: a page deleted where this session cannot see it — from the viewer shell, or by
//      another session — drops out of this session's strip; every other page stays
// S12: the tool speaks Claude Code's names: `label` names the version and `note` is no
//      parameter; `icon` is a generic word and anything else is refused with the rule;
//      the page's own <title> beats `title`; `pin: true` also pins, and the result says
//      so; the description tells the model a viewer shell frames the page and never
//      mentions what the platform no longer has
// S14: `files` publishes supporting files beside the page — a map of published path →
//      source path, {from, contentType} or null, or a list published at its own
//      spelling — with relative sources resolved against `root`; the page's frame serves
//      them and the result counts and names them; a republish keeps the paths it does
//      not name, replaces the ones it does, and null removes one. A source outside the
//      project (directly or through a symlink), a missing source, a reserved or
//      escaping published path, an unknown type, an oversized file, and `root` without
//      `files` are each refused with the reason, and nothing is published
// S15: `list` with scope "files" and url names each supporting file of the current
//      version with its type and size, and says so when there are none; `read` with
//      `path` hands back a small text file inline and any other file by size and type,
//      `paths` reads several, `index.html` is the page itself, and a path the version
//      does not hold is reported, not thrown
// S16: `capabilities` declares what the page may use: the result names what is served,
//      and in one line of its own every declared capability this host cannot serve, so
//      the model never believes a connector works here; a republish that omits it
//      keeps the declaration and {} clears it; an unknown name is refused with the name,
//      and nothing is published
// S17: a version the viewer published from the page is one this session has not read:
//      its next republish is refused naming that version, `read` says the viewer made it
//      and shows their source, and after that read the republish goes through; the
//      tool's description names `files` and `capabilities` and no longer forbids
//      relative links
// S18: `db` and `assets` are served here: declared, the result names them among the
//      capabilities the page reaches and never among those it cannot; the description
//      sends the model to `artifact_data` for a page's documents
// S19: `publish` with `type` and `title`, and no file_path, makes an artifact from the
//      folder .pi/artifact-types/<name>/ — type.json, its page index.html, its files —
//      named by `title`, and the result says how to give it content; publishing `files`
//      to its url with no file_path does that and keeps the type's page; naming one of
//      the type's paths, or passing file_path, is refused as read_only_path and publishes
//      nothing; type without title, beside file_path or url, a type that is not there,
//      a folder with no page, a type file that leaves the project, and a publish
//      with no file_path to an ordinary artifact are each refused with the reason
// S20: `list` with scope "types" names each type with its title and description, and
//      says what a type is when the project has none; `quickstart` needs an intent,
//      lists the same types, tells the model to load `artifact-design` for a plain page,
//      and publishes nothing

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { FooterComponent, initTheme } from "@earendil-works/pi-coding-agent";
import { Selector } from "@ext/artifacts/src/ui/selector";
import { Strip, STRIP_KEY } from "@ext/artifacts/src/ui/strip";

import { DEFAULT_CONFIG } from "@ext/artifacts/src/domain/types";
import { Host } from "@ext/artifacts/src/ui/host";
import { mountFullscreen } from "@harness/fullscreen";

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
  test("S3 force republishes over the version this session has not read", async () => {
    const a = wire({ session: "session-A" });
    const b = wire({
      session: "session-B",
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    const path = a.file("docs/plan.html", PAGE);
    await a.run({ file_path: path });
    await b.run({ action: "watch", url: "plan" });
    await b.run({ file_path: path });
    await expect(a.run({ file_path: path, force: false })).rejects.toThrow(/force/);
    expect((await a.run({ file_path: path, force: true })).details).toMatchObject({
      slug: "plan",
      version: 3,
    });
    // Having written v3, the session holds it: the next republish needs no force.
    expect((await a.run({ file_path: path })).details).toMatchObject({ version: 4 });
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
    expect(existsSync(join(w.storeRoot, "tide-table", ".store", "versions", "v1.html"))).toBe(true);
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
    // A pill is named after its file; its link names the page it opens.
    expect(again.ctx.status.get(STRIP_KEY)).toContain("/a/mine?");
    expect(again.ctx.status.get(STRIP_KEY)).not.toContain("/a/theirs?");
    const summary = again.fake.sent.find((s) => s.message.customType === "artifact-feedback");
    expect(summary?.message.content).toContain("mine");
    expect(summary?.message.content).not.toContain("theirs");
    expect(summary?.options?.deliverAs).toBe("nextTurn");
  });
});

// S6 and S7 drive the footer as its user does: pages published through the tool on a
// clock that ticks between them, keys pressed on the editor session_start installed,
// and the row read back from what ctx.ui.setStatus was given.
const KEYS = {
  down: "\x1b[B",
  up: "\x1b[A",
  left: "\x1b[D",
  right: "\x1b[C",
  tab: "\t",
  enter: "\r",
  esc: "\x1b",
} as const;
const HINT = "←/→ to navigate · Enter to open · x to dismiss";
const LINK_CLOSE = "\x1b]8;;\x1b\\";
const linkOpen = (url: string) => `\x1b]8;;${url}\x1b\\`;

interface PromptEditor {
  handleInput(data: string): void;
  getText(): string;
  onEscape?: () => void;
}
type EditorFactory = (tui: unknown, theme: unknown, keybindings: unknown) => PromptEditor;

async function footer(files: string[] = [], options: Parameters<typeof wire>[0] = {}) {
  let tick = Date.parse("2026-01-01T00:00:00.000Z");
  const w = wire({ now: () => new Date((tick += 1000)), ...options });
  const ui = w.ctx.ctx.ui as unknown as {
    theme: object;
    setEditorComponent(factory?: EditorFactory): void;
  };
  // The harness theme paints nothing; marking the fill alone makes a row read as it looks.
  Object.assign(ui.theme, { inverse: (text: string) => `[${text.trim()}]` });
  let factory: EditorFactory | undefined;
  const install = ui.setEditorComponent;
  ui.setEditorComponent = (next) => {
    factory = next;
    install(next);
  };
  await w.sessionStart();
  if (!factory) throw new Error("session_start installed no editor");
  let interrupts = 0;
  const editor = factory(
    { requestRender() {}, terminal: { rows: 24, columns: 120 } },
    { borderColor: (text: string) => text, selectList: {} },
    // esc is pi's interrupt: the one app binding the editor has to know here.
    { matches: (data: string, id: string) => id === "app.interrupt" && data === KEYS.esc },
  );
  editor.onEscape = () => void (interrupts += 1);
  const publish = async (file: string, title = `Page ${file}`) =>
    (await w.run({ file_path: w.file(file, PAGE), title })).details?.slug as string;
  const slugs: string[] = [];
  for (const file of files) slugs.push(await publish(file));
  const status = () => w.ctx.status.get(STRIP_KEY) ?? "";
  return {
    w,
    editor,
    publish,
    slugs,
    status,
    /** The row as it reads on screen: the status text without the links around its pills. */
    row: () =>
      w.host
        .badges()
        .reduce((text, badge) => text.replaceAll(linkOpen(badge.url), ""), status())
        .replaceAll(LINK_CLOSE, ""),
    press: (...keys: string[]) => {
      for (const key of keys) editor.handleInput(key);
    },
    interrupts: () => interrupts,
  };
}

describe("S6 the strip", () => {
  test("S6 a pill is named after its file without the extension, not its title or slug", async () => {
    const f = await footer();
    expect(await f.publish("notes/q3-plan.html", "Pricing Plan")).toBe("pricing-plan");
    expect(f.row()).toBe("⧉ q3-plan");
  });
  test("S6 a page that came from no file is named after its slug", async () => {
    const f = await footer();
    await f.w.run({ action: "ask", title: "Pricing", questions: QUESTIONS, timeout: 0.05 });
    expect(f.row()).toBe("⧉ pricing");
  });
  test("S6 oldest → newest: the newest is rightmost, and a republish moves its pill there", async () => {
    const f = await footer(["a/first.html", "b/second.md", "third.html"]);
    expect(f.row()).toBe("⧉ first · second · third");
    await f.w.run({ file_path: "a/first.html" });
    expect(f.row()).toBe("⧉ second · third · first");
  });
  test("S6 five pages all show; from the sixth on the older ones fold into a leading +N", async () => {
    const f = await footer(["p1.html", "p2.html", "p3.html", "p4.html", "p5.html"]);
    expect(f.row()).toBe("⧉ p1 · p2 · p3 · p4 · p5");
    await f.publish("p6.html");
    await f.publish("p7.html");
    expect(f.row()).toBe("⧉ +2 · p3 · p4 · p5 · p6 · p7");
  });
  test("S6 the window of five follows the selection, folding newer pages into a trailing +N", async () => {
    const f = await footer([1, 2, 3, 4, 5, 6, 7].map((n) => `p${n}.html`));
    f.press(KEYS.down);
    expect(f.row()).toBe(`❯ ⧉ +2 · p3 · p4 · p5 · p6 · [p7] · ${HINT}`);
    f.press(KEYS.left, KEYS.left, KEYS.left, KEYS.left, KEYS.left);
    expect(f.row()).toBe(`❯ ⧉ +1 · [p2] · p3 · p4 · p5 · p6 · +1 · ${HINT}`);
    f.press(KEYS.left);
    expect(f.row()).toBe(`❯ ⧉ [p1] · p2 · p3 · p4 · p5 · +2 · ${HINT}`);
  });
  test("S6 ● leads a pill while a reply waits on it", async () => {
    const f = await footer(["plan.html"], { config: { wakesPerHour: 0 } });
    expect(f.row()).toBe("⧉ plan");
    expect((await f.w.pageRespond(f.slugs[0]!, 1, { x: 1 })).status).toBe(200);
    const deadline = Date.now() + 2000;
    while (!f.row().includes("●") && Date.now() < deadline) await sleep(10);
    expect(f.row()).toBe("⧉ ● plan");
  });
  test("S6 a hostile file name cannot break out of the row; one with nothing drawable falls back to the slug", async () => {
    const f = await footer();
    await f.publish("x\x1b[2J\x1b]0;pwned\x07y.html", "Hostile");
    await f.publish("\x1b[2J\x07.html", "Wiped");
    // Only the links around the session's own pills are taken out of a row, so a
    // sequence smuggled in by a name would still be in it here.
    expect(f.row()).toBe("⧉ xy · wiped");
  });
  test("S6 the focused row is Claude Code's; the unfocused row has no mark and no hint", async () => {
    const f = await footer([
      "sunny-sixteen.html",
      "bare-fragment.html",
      "contract-probe.html",
      "parity-audit.html",
    ]);
    expect(f.row()).toBe("⧉ sunny-sixteen · bare-fragment · contract-probe · parity-audit");
    f.press(KEYS.down);
    expect(f.row()).toBe(
      "❯ ⧉ sunny-sixteen · bare-fragment · contract-probe · [parity-audit] · ←/→ to navigate · Enter to open · x to dismiss",
    );
    f.press(KEYS.esc);
    expect(f.row()).toBe("⧉ sunny-sixteen · bare-fragment · contract-probe · parity-audit");
  });
  test("S6 on pi's fullscreen screen a click on a pill's cells opens that page; a click elsewhere opens nothing", async () => {
    const f = await footer(["sunny-sixteen.html", "parity-audit.html"]);
    initTheme("dark");
    // Pi's own footer, as it is mounted when no extension replaces it.
    const piFooter = new FooterComponent(
      {
        state: {},
        sessionManager: {
          getEntries: () => [],
          getCwd: () => f.w.cwd,
          getSessionName: () => undefined,
        },
        getContextUsage: () => undefined,
      } as unknown as ConstructorParameters<typeof FooterComponent>[0],
      {
        getGitBranch: () => null,
        getExtensionStatuses: () => new Map([[STRIP_KEY, f.status()]]),
        getAvailableProviderCount: () => 1,
      } as unknown as ConstructorParameters<typeof FooterComponent>[1],
    );
    const screen = mountFullscreen(piFooter);
    screen.click("sunny-sixteen");
    f.press(KEYS.down);
    screen.click("[parity-audit]");
    screen.click("[");
    const sunny = f.w.host.url(f.slugs[0]!);
    const parity = f.w.host.url(f.slugs[1]!);
    expect(screen.opened).toEqual([sunny, parity, parity]);
    // The tokened URL, so the browser pi opens is let in: never the bare one.
    expect(parity).not.toBe(f.w.host.url(f.slugs[1]!, false));
    for (const elsewhere of ["❯", "⧉", " · ", "Enter to open"]) screen.click(elsewhere);
    expect(screen.opened).toHaveLength(3);
    screen.stop();
  });
});

describe("S7 the footer's keys", () => {
  const FILES = ["first.html", "second.html", "third.html"];
  const unfocused = "⧉ first · second · third";
  const focused = (pills: string) => `❯ ⧉ ${pills} · ${HINT}`;
  const cases: Array<[name: string, keys: string[], row: string, typed: string]> = [
    ["down selects the newest pill", [KEYS.down], focused("first · second · [third]"), ""],
    ["← moves to the older pill", [KEYS.down, KEYS.left], focused("first · [second] · third"), ""],
    [
      "→ wraps from the newest to the oldest",
      [KEYS.down, KEYS.right],
      focused("[first] · second · third"),
      "",
    ],
    [
      "← wraps from the oldest to the newest",
      [KEYS.down, KEYS.right, KEYS.left],
      focused("first · second · [third]"),
      "",
    ],
    ["tab moves as → does", [KEYS.down, KEYS.tab], focused("[first] · second · third"), ""],
    ["down again stays put", [KEYS.down, KEYS.down], focused("first · second · [third]"), ""],
    [
      "x dismisses the selected pill and focus stays",
      [KEYS.down, "x"],
      focused("first · [second]"),
      "",
    ],
    ["esc hands focus back", [KEYS.down, KEYS.left, KEYS.esc], unfocused, ""],
    ["↑ hands focus back", [KEYS.down, KEYS.up], unfocused, ""],
    ["any other key hands focus back and is typed", [KEYS.down, "h"], unfocused, "h"],
    ["down on a prompt with text stays the editor's", ["h", KEYS.down], unfocused, "h"],
  ];
  test.each(cases)("S7 %s", async (_name, keys, row, typed) => {
    const f = await footer(FILES);
    f.press(...keys);
    expect(f.row()).toBe(row);
    expect(f.editor.getText()).toBe(typed);
  });
  test("S7 enter opens the selected page and hands focus back", async () => {
    const f = await footer(FILES);
    const before = f.w.opened.length;
    f.press(KEYS.down, KEYS.left, KEYS.enter);
    await sleep(1);
    expect(f.w.opened.slice(before)).toEqual([f.w.host.url(f.slugs[1]!)]);
    expect(f.row()).toBe(unfocused);
  });
  test("S7 esc in the footer is not pi's interrupt; esc in the prompt still is", async () => {
    const f = await footer(FILES);
    f.press(KEYS.down, KEYS.esc);
    expect(f.interrupts()).toBe(0);
    f.press(KEYS.esc);
    expect(f.interrupts()).toBe(1);
  });
  test("S7 with no pills down stays the editor's; dismissing the last pill hands focus back", async () => {
    const f = await footer();
    f.press(KEYS.down);
    expect(f.status()).toBe("");
    await f.publish("only.html");
    f.press(KEYS.down, "x");
    expect(f.status()).toBe("");
    f.press("h");
    expect(f.editor.getText()).toBe("h");
  });
  test("S7 c asks for the selected page's link and hands focus back", () => {
    // Below the wire on purpose: there the copy lands on the developer's real clipboard.
    const strip = new Strip();
    for (const [slug, at] of [
      ["old", "2026-01-01T00:00:00.000Z"],
      ["new", "2026-01-02T00:00:00.000Z"],
    ] as const)
      strip.upsert({ slug, name: slug, title: slug, version: "v1", url: slug, pending: 0, at });
    const selector = new Selector(strip, (data, key) => data === key);
    expect(selector.enter()).toBe(true);
    expect(selector.handleInput("c")).toEqual({
      kind: "handled",
      choice: { action: "copy", slug: "new" },
    });
    expect(selector.active).toBe(false);
  });
  test.each([["alt+a"]])("S7 %s opens the newest page", async (key) => {
    const f = await footer(["old.html", "new.html"]);
    const before = f.w.opened.length;
    await f.w.fake.shortcuts.get(key)?.handler(f.w.ctx.ctx);
    expect(f.w.opened.slice(before)).toEqual([f.w.host.url(f.slugs[1]!)]);
  });
  test.each([["alt+a"]])("S7 %s with no pages opens nothing and says so", async (key) => {
    const f = await footer();
    await f.w.fake.shortcuts.get(key)?.handler(f.w.ctx.ctx);
    expect(f.w.opened).toHaveLength(0);
    expect(f.w.ctx.notifications.some((n) => /no artifact/i.test(n.message))).toBe(true);
  });
  test("S7 ctrl+] stays pi's editor shortcut, unclaimed by the extension", async () => {
    const f = await footer(["only.html"]);
    expect(f.w.fake.shortcuts.has("ctrl+]")).toBe(false);
  });
  test("S7 session_start installs the editor that shares its focus", async () => {
    const w = wire();
    expect(w.ctx.customEditor()).toBe(false);
    await w.sessionStart();
    expect(w.ctx.customEditor()).toBe(true);
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
    await w.shellPost("/a/keep/diagnostics", {
      version: 1,
      rows: [{ level: "error", message: "boom" }],
    });
    const after = await w.run({ action: "verify", url: "keep" });
    expect(after.text).toContain("boom");
    expect(after.details?.summary).toContain("1 errors");
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

describe("S12 the tool speaks Claude Code's names", () => {
  const manifestOf = async (w: ReturnType<typeof wire>, slug: string) =>
    (
      (await (await w.api(`/artifacts/${slug}`)).json()) as {
        manifest: {
          title: string;
          icon?: string;
          pinned: boolean;
          versions: Array<{ n: number; label?: string }>;
        };
      }
    ).manifest;

  test("S12 label names the version; note is not a parameter", async () => {
    const w = wire();
    const path = w.file("plan.html", PAGE);
    await w.run({ file_path: path, title: "Plan", label: "Draft to legal" });
    await w.run({ file_path: path });
    expect((await manifestOf(w, "plan")).versions.map((v) => v.label)).toEqual([
      "Draft to legal",
      undefined,
    ]);
    const parameters = Object.keys(
      (w.fake.tools.get("artifact")?.parameters as { properties: Record<string, unknown> })
        .properties,
    );
    expect(parameters).toEqual(expect.arrayContaining(["label", "force", "pin", "icon"]));
    expect(parameters).not.toContain("note");
    await expect(w.run({ file_path: path, label: "x".repeat(61) })).rejects.toThrow(/60/);
  });
  test("S12 an icon word is kept; an emoji is refused with the rule and nothing is published", async () => {
    const w = wire();
    await w.run({ file_path: w.file("chart.html", PAGE), title: "Chart", icon: "chart" });
    expect((await manifestOf(w, "chart")).icon).toBe("chart");
    await expect(
      w.run({ file_path: w.file("emoji.html", PAGE), title: "Emoji", icon: "📊" }),
    ).rejects.toThrow(/generic word/);
    expect((await w.api("/artifacts/emoji")).status).toBe(404);
  });
  test("S12 the page's own <title> beats the title parameter", async () => {
    const w = wire();
    const { details } = await w.run({
      file_path: w.file("tides.html", "<title>Tides at Dover</title><p>x</p>"),
      title: "Passed In",
    });
    expect(details).toMatchObject({ title: "Tides at Dover", slug: "tides-at-dover" });
  });
  test("S12 pin: true also pins and says so; without it nothing is pinned", async () => {
    const w = wire();
    const pinned = await w.run({ file_path: w.file("keep.html", PAGE), title: "Keep", pin: true });
    expect(pinned.text).toMatch(/pinned/i);
    expect((await manifestOf(w, "keep")).pinned).toBe(true);
    const plain = await w.run({ file_path: w.file("loose.html", PAGE), title: "Loose" });
    expect(plain.text).not.toMatch(/pinned/i);
    expect((await manifestOf(w, "loose")).pinned).toBe(false);
  });
  test("S12 the description names the viewer shell and nothing the platform dropped", () => {
    const tool = wire().fake.tools.get("artifact");
    const told = [tool?.description, ...(tool?.promptGuidelines ?? [])].join("\n");
    expect(told).toMatch(/viewer shell/);
    expect(told).toMatch(/never paste/i);
    expect(told).not.toMatch(/window\.artifact|x-artifact-page/);
  });
});

describe("S13 a page deleted elsewhere leaves the strip", () => {
  test("S13 deleted from the viewer shell, or by another session: the badge goes, the others stay", async () => {
    const a = wire({ session: "session-A", confirm: () => true });
    const b = wire({
      session: "session-B",
      confirm: () => true,
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    for (const name of ["one", "two", "three"])
      await a.run({ file_path: a.file(`${name}.html`, PAGE), title: name });
    await sleep(30);
    expect((await a.shellPost("/a/one/delete")).status).toBe(200);
    await b.run({ action: "delete", url: "two" });
    await sleep(60);
    expect(a.host.badges().map((x) => x.slug)).toEqual(["three"]);
  });
});

/** What the page's frame is served for a published path: its text, or the status that refused it. */
const served = async (w: ReturnType<typeof wire>, slug: string, version: number, path: string) => {
  const res = await w.frame(slug, `/_f/${w.cap(slug)}/${version}/${path}`);
  return res.status === 200 ? res.text() : res.status;
};

describe("S14 files publishes beside the page", () => {
  test("S14 a map of sources, a stated type, and root: each is served at its published path", async () => {
    const w = wire();
    w.file("site/css/app.css", "body{margin:0}");
    w.file("site/rows.data", "a,b\n1,2\n");
    w.file("shared/logo.svg", "<svg xmlns='http://www.w3.org/2000/svg'/>");
    const { text, details } = await w.run({
      file_path: w.file("site/index.html", "<title>Site</title><link rel=stylesheet href=app.css>"),
      root: "site",
      files: {
        "app.css": "css/app.css",
        "data/rows.csv": { from: "rows.data", contentType: "text/csv" },
        "img/logo.svg": join(w.cwd, "shared/logo.svg"),
      },
    });
    expect(details).toMatchObject({ slug: "site", version: 1 });
    expect(await served(w, "site", 1, "app.css")).toBe("body{margin:0}");
    expect(await served(w, "site", 1, "data/rows.csv")).toBe("a,b\n1,2\n");
    expect(await served(w, "site", 1, "img/logo.svg")).toContain("<svg");
    expect(await served(w, "site", 1, "css/app.css")).toBe(404);
    const line = text.split("\n").find((l) => l.startsWith("Files:")) ?? "";
    expect(line).toContain("3 ");
    for (const path of ["app.css", "data/rows.csv", "img/logo.svg"]) expect(line).toContain(path);
  });
  test("S14 a list publishes each file at its own spelling; a page without files says nothing of them", async () => {
    const w = wire();
    w.file("assets/app.js", "window.app = 1;");
    await w.run({
      file_path: w.file("listed.html", "<title>Listed</title>"),
      files: [
        { path: "assets/app.js" },
        { path: w.file("rows.tsv", "a\tb"), contentType: "text/tab-separated-values" },
      ],
    });
    expect(await served(w, "listed", 1, "assets/app.js")).toBe("window.app = 1;");
    expect(await served(w, "listed", 1, "rows.tsv")).toBe("a\tb");
    const plain = await w.run({ file_path: w.file("plain.html", "<title>Plain</title>") });
    expect(plain.text).not.toContain("Files:");
  });
  test("S14 a republish keeps what it does not name, replaces what it does, and null removes", async () => {
    const w = wire();
    const page = w.file("kept.html", "<title>Kept</title>");
    await w.run({
      file_path: page,
      files: {
        "a.css": w.file("a.css", "a1"),
        "b.css": w.file("b.css", "b1"),
        "c.css": w.file("c.css", "c1"),
      },
    });
    w.file("b.css", "b2");
    const second = await w.run({ file_path: page, files: { "b.css": "b.css", "c.css": null } });
    expect(second.details).toMatchObject({ slug: "kept", version: 2 });
    expect(await served(w, "kept", 2, "a.css")).toBe("a1");
    expect(await served(w, "kept", 2, "b.css")).toBe("b2");
    expect(await served(w, "kept", 2, "c.css")).toBe(404);
    expect(await served(w, "kept", 1, "c.css")).toBe("c1");
    // A republish of the page alone names no file and loses none.
    expect((await w.run({ file_path: page })).text).toContain("a.css");
    expect(await served(w, "kept", 3, "b.css")).toBe("b2");
  });
  test("S14 what breaks a rule is refused with the reason, and nothing is published", async () => {
    const w = wire();
    const outside = join(tmpdir(), `artifacts-outside-${Date.now()}.css`);
    writeFileSync(outside, "outside");
    mkdirSync(join(w.cwd, "links"), { recursive: true });
    symlinkSync(outside, join(w.cwd, "links", "inside.css"));
    w.file("ok.css", "ok");
    w.file("big.json", "x".repeat(16 * 1024 * 1024 + 1));
    const refused: Array<[string, Record<string, unknown>, RegExp]> = [
      ["a source outside the project", { files: { "a.css": outside } }, /outside the project/],
      [
        "a symlink that leaves it",
        { files: { "a.css": "links/inside.css" } },
        /outside the project/,
      ],
      ["a source that is not there", { files: { "a.css": "ghost.css" } }, /ghost\.css/],
      ["a folder as a source", { files: { "a.css": "links" } }, /links/],
      ["the page's own name", { files: { "index.html": "ok.css" } }, /index\.html/],
      ["a published path that climbs out", { files: { "../a.css": "ok.css" } }, /a\.css/],
      ["a list entry spelled with a leading ./", { files: [{ path: "./ok.css" }] }, /ok\.css/],
      ["an extension with no stated type", { files: { "rows.csv": "ok.css" } }, /contentType/],
      ["a file over its limit", { files: { "big.json": "big.json" } }, /16\.0 MiB/],
      ["root without files", { root: "links" }, /files/],
      ["a root outside the project", { root: tmpdir(), files: { "a.css": "ok.css" } }, /outside/],
    ];
    const page = w.file("refused.html", "<title>Refused</title>");
    for (const [name, params, reason] of refused) {
      const error = await w.run({ file_path: page, ...params }).then(
        () => null,
        (e: Error) => e.message,
      );
      expect([name, reason.test(error ?? "")]).toEqual([name, true]);
    }
    expect((await w.api("/artifacts/refused")).status).toBe(404);
  });
});

describe("S15 reading an artifact's files", () => {
  const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  const published = async () => {
    const w = wire();
    writeFileSync(join(w.cwd, "dot.gif"), GIF);
    await w.run({
      file_path: w.file("atlas.html", "<title>Atlas</title><p>the page's own words</p>"),
      files: {
        "data/places.json": w.file("places.json", '{"places":["Dover"]}'),
        "dot.gif": "dot.gif",
        "big.txt": w.file("big.txt", "x".repeat(70_000)),
      },
    });
    return w;
  };

  test("S15 list with scope files names each file with its type and size; none is said plainly", async () => {
    const w = await published();
    const { text, details } = await w.run({ action: "list", scope: "files", url: "atlas" });
    expect(details).toMatchObject({ slug: "atlas", version: 1 });
    const rows = text.split("\n").filter((l) => l.startsWith("- "));
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.includes("data/places.json"))).toContain("application/json");
    expect(rows.find((r) => r.includes("dot.gif"))).toContain("image/gif");
    await w.run({ file_path: w.file("bare.html", "<title>Bare</title>") });
    const none = await w.run({ action: "list", scope: "files", url: "bare" });
    expect(none.text.split("\n").filter((l) => l.startsWith("- "))).toEqual([]);
    expect(none.text).toMatch(/no supporting files/);
    await expect(w.run({ action: "list", scope: "files" })).rejects.toThrow(/url/);
    // Without a scope, list is still every artifact.
    expect((await w.run({ action: "list" })).text).toContain("atlas");
  });
  test("S15 read with path: small text inline, anything else by size and type, a missing path reported", async () => {
    const w = await published();
    const json = await w.run({ action: "read", url: "atlas", path: "data/places.json" });
    expect(json.text).toContain('{"places":["Dover"]}');
    expect(json.text).toContain("application/json");
    expect(json.text).not.toContain("the page's own words");
    const gif = await w.run({ action: "read", url: "atlas", path: "dot.gif" });
    expect(gif.text).toContain("image/gif");
    expect(gif.text).toMatch(/not shown/);
    const several = await w.run({
      action: "read",
      url: "atlas",
      paths: ["data/places.json", "big.txt", "ghost.txt", "index.html"],
    });
    expect(several.text).toContain('{"places":["Dover"]}');
    expect(several.text).not.toContain("xxxxxxxxxx");
    expect(several.text).toMatch(/big\.txt.*text\/plain.*not shown/);
    expect(several.text).toMatch(/ghost\.txt.*no such file/);
    expect(several.text).toContain("the page's own words");
    expect(several.details?.summary).toBe("2/4 files");
    // A plain read is the page, and says the artifact holds files.
    const page = await w.run({ action: "read", url: "atlas" });
    expect(page.text).toContain("the page's own words");
    expect(page.text.split("\n").find((l) => l.startsWith("Files:"))).toContain("3 ");
  });
});

describe("S16 declaring capabilities", () => {
  const UNSERVED = ["mcp", "room", "sample", "user", "self"];
  const declared = async (w: ReturnType<typeof wire>, slug: string) =>
    ((await (await w.api(`/artifacts/${slug}`)).json()) as { manifest: { capabilities?: unknown } })
      .manifest.capabilities;

  test("S16 the result names the unserved capabilities in one line, and only them", async () => {
    const w = wire();
    const page = w.file("tools.html", "<title>Tools</title>");
    const { text } = await w.run({
      file_path: page,
      capabilities: {
        artifact: {},
        downloads: {},
        ...Object.fromEntries(UNSERVED.map((name) => [name, {}])),
      },
    });
    const naming = text.split("\n").filter((line) => UNSERVED.some((name) => line.includes(name)));
    expect(naming).toHaveLength(1);
    for (const name of UNSERVED) expect(naming[0]).toMatch(new RegExp(`\\b${name}\\b`));
    expect(naming[0]).toMatch(/null/);
    expect(naming[0]).not.toMatch(/\bartifact\b|\bdownloads\b/);
    const served = text.split("\n").find((line) => line.startsWith("Capabilities:")) ?? "";
    expect(served).toMatch(/\bartifact\b.*\bdownloads\b/);
    // Everything it serves, nothing it cannot: no such line at all.
    const clean = await w.run({ file_path: page, capabilities: { downloads: {} } });
    expect(clean.text.split("\n").filter((line) => /not served/i.test(line))).toEqual([]);
  });
  test("S16 omitted keeps the declaration, {} clears it, and read shows it", async () => {
    const w = wire();
    const page = w.file("kept.html", "<title>Kept Caps</title>");
    await w.run({ file_path: page, capabilities: { comments: { composer_only: true }, mcp: {} } });
    const again = await w.run({ file_path: page });
    expect(await declared(w, "kept-caps")).toEqual({ comments: { composer_only: true }, mcp: {} });
    expect(again.text.split("\n").find((line) => /\bmcp\b/.test(line))).toMatch(/null/);
    expect((await w.run({ action: "read", url: "kept-caps" })).text).toMatch(/\bcomments\b/);
    const cleared = await w.run({ file_path: page, capabilities: {} });
    expect(await declared(w, "kept-caps")).toBeUndefined();
    expect(cleared.text).not.toMatch(/Capabilities:|\bmcp\b/);
  });
  test("S16 an unknown capability is refused by name and nothing is published", async () => {
    const w = wire();
    await expect(
      w.run({
        file_path: w.file("psychic.html", "<title>Psychic</title>"),
        capabilities: { downloads: {}, telepathy: {} },
      }),
    ).rejects.toThrow(/telepathy/);
    expect((await w.api("/artifacts/psychic")).status).toBe(404);
  });
});

describe("S17 the viewer's own version", () => {
  const document = (words: string) =>
    `<!doctype html><html><head><title>Shared Draft</title></head><body><p>${words}</p></body></html>`;

  test("S17 a republish over it is refused until the session has read it", async () => {
    const w = wire();
    const page = w.file("draft.html", document("the agent's words"));
    await w.run({ file_path: page, capabilities: { artifact: {} } });
    const saved = await w.shellPost("/a/shared-draft/self-publish", {
      base_version: 1,
      html: document("the viewer's words"),
    });
    expect(saved.status).toBe(200);
    await expect(w.run({ file_path: page })).rejects.toThrow(/v2/);
    const read = await w.run({ action: "read", url: "shared-draft" });
    expect(read.text).toMatch(/v2.*viewer/);
    expect(read.text).toContain("the viewer's words");
    expect((await w.run({ file_path: page })).details).toMatchObject({ version: 3 });
    // A version of the session's own carries no such line.
    expect((await w.run({ action: "read", url: "shared-draft" })).text).not.toMatch(/viewer/);
  });
  test("S17 the description names files and capabilities, and what a page may link to", () => {
    const told = wire().fake.tools.get("artifact")?.description ?? "";
    for (const fact of ["`files`", "`root`", "`capabilities`", "claude.use", "downloads", "scope"])
      expect([fact, told.includes(fact)]).toEqual([fact, true]);
    expect(told).not.toMatch(/no relative links|Versions are yours alone/);
  });
});

describe("S18 db and assets are served", () => {
  test("S18 declared, they are among the capabilities the page reaches, never among those it cannot", async () => {
    const w = wire();
    const { text } = await w.run({
      file_path: w.file("board.html", "<title>Board</title>"),
      capabilities: { db: { rules: [] }, assets: {}, mcp: {} },
    });
    const served = text.split("\n").find((line) => line.startsWith("Capabilities:")) ?? "";
    expect(served).toMatch(/\bassets\b.*\bdb\b/);
    const unserved = text.split("\n").find((line) => /not served/i.test(line)) ?? "";
    expect(unserved).toMatch(/\bmcp\b/);
    expect(unserved).not.toMatch(/\bdb\b|\bassets\b/);
    const told = w.fake.tools.get("artifact")?.description ?? "";
    for (const fact of ["`db`", "`assets`", "artifact_data", "/_blob/"])
      expect([fact, told.includes(fact)]).toEqual([fact, true]);
  });
});

/** A type as a project keeps it: a folder with its descriptor, its page and its files. */
const kanban = (w: ReturnType<typeof wire>) => {
  w.file(
    ".pi/artifact-types/kanban/type.json",
    JSON.stringify({ title: "Kanban board", description: "Columns of cards, read from data/" }),
  );
  w.file(
    ".pi/artifact-types/kanban/index.html",
    "<!doctype html><html><head><title>The Type's Title</title></head><body><script src=app.js></script></body></html>",
  );
  w.file(".pi/artifact-types/kanban/app.js", "window.board = 1;");
  w.file(".pi/artifact-types/kanban/css/board.css", ".col{display:flex}");
  w.file(".pi/artifact-types/kanban/.DS_Store", "not a file of the type");
};

describe("S19 an artifact made from a type", () => {
  test("S19 type and title make it: the type's page and files, named by the title, and the result says how to fill it", async () => {
    const w = wire();
    kanban(w);
    const { text, details } = await w.run({ type: "kanban", title: "Q3 Roadmap" });
    expect(details).toMatchObject({ slug: "q3-roadmap", title: "Q3 Roadmap", version: 1 });
    expect(w.opened).toHaveLength(1);
    expect(await w.document("q3-roadmap", 1)).toContain("The Type's Title");
    expect(await served(w, "q3-roadmap", 1, "app.js")).toBe("window.board = 1;");
    expect(await served(w, "q3-roadmap", 1, "css/board.css")).toBe(".col{display:flex}");
    expect(await served(w, "q3-roadmap", 1, "type.json")).toBe(404);
    expect(await served(w, "q3-roadmap", 1, ".DS_Store")).toBe(404);
    const line = text.split("\n").find((l) => l.includes('type "kanban"')) ?? "";
    expect(line).toMatch(/read-only/);
    expect(line).toMatch(/files/);
    expect(line).toContain('"q3-roadmap"');
    const read = await w.run({ action: "read", url: "q3-roadmap" });
    expect(read.text).toMatch(/type "kanban".*read-only/);
  });
  test("S19 files to its url fill it and keep the page; a file of its own may come with the type", async () => {
    const w = wire();
    kanban(w);
    await w.run({
      type: "kanban",
      title: "Q3 Roadmap",
      files: { "data/cards.json": w.file("cards.json", "[]") },
    });
    expect(await served(w, "q3-roadmap", 1, "data/cards.json")).toBe("[]");
    w.file("cards.json", '[{"id":1}]');
    const filled = await w.run({
      url: "q3-roadmap",
      files: { "data/cards.json": "cards.json", "notes.md": w.file("notes.md", "# plan") },
    });
    expect(filled.details).toMatchObject({ slug: "q3-roadmap", version: 2 });
    expect(await w.document("q3-roadmap", 2)).toBe(await w.document("q3-roadmap", 1));
    expect(await served(w, "q3-roadmap", 2, "data/cards.json")).toBe('[{"id":1}]');
    expect(await served(w, "q3-roadmap", 2, "app.js")).toBe("window.board = 1;");
    expect(w.opened).toHaveLength(1);
  });
  test("S19 a type's path, or a page, is refused as read_only_path and publishes nothing", async () => {
    const w = wire();
    kanban(w);
    await w.run({ type: "kanban", title: "Q3 Roadmap" });
    const evil = w.file("evil.js", "evil()");
    const refused: Array<[string, Record<string, unknown>]> = [
      ["a type's file", { url: "q3-roadmap", files: { "app.js": evil } }],
      ["a type's file, removed", { url: "q3-roadmap", files: { "css/board.css": null } }],
      ["a page", { url: "q3-roadmap", file_path: w.file("mine.html", "<title>Mine</title>") }],
      [
        "a type's path claimed at creation",
        { type: "kanban", title: "Another Board", files: { "app.js": evil } },
      ],
    ];
    for (const [name, params] of refused) {
      const error = await w.run(params).then(
        () => null,
        (e: Error) => e.message,
      );
      expect([name, /read.only/.test(error ?? "")]).toEqual([name, true]);
    }
    const manifest = (
      (await (await w.api("/artifacts/q3-roadmap")).json()) as { manifest: { current: number } }
    ).manifest;
    expect(manifest.current).toBe(1);
    expect((await w.api("/artifacts/another-board")).status).toBe(404);
  });
  test("S19 what the call gets wrong is refused with the reason", async () => {
    const w = wire();
    kanban(w);
    w.file(".pi/artifact-types/pageless/type.json", JSON.stringify({ title: "No page" }));
    w.file(".pi/artifact-types/untitled/type.json", JSON.stringify({ description: "no title" }));
    w.file(".pi/artifact-types/untitled/index.html", "<p>x</p>");
    const outside = join(tmpdir(), `artifact-type-outside-${Date.now()}.js`);
    writeFileSync(outside, "outside()");
    w.file(".pi/artifact-types/leaky/type.json", JSON.stringify({ title: "Leaky" }));
    w.file(".pi/artifact-types/leaky/index.html", "<p>x</p>");
    symlinkSync(outside, join(w.cwd, ".pi/artifact-types/leaky/app.js"));
    await w.run({ file_path: w.file("plain.html", "<title>Plain</title>") });
    const page = w.file("page.html", "<title>Page</title>");
    const mistakes: Array<[string, Record<string, unknown>, RegExp]> = [
      ["no title", { type: "kanban" }, /title/],
      ["file_path beside type", { type: "kanban", title: "B", file_path: page }, /file_path/],
      ["url beside type", { type: "kanban", title: "B", url: "plain" }, /url/],
      ["a type that is not there", { type: "gantt", title: "B" }, /gantt/],
      ["a name that is no name", { type: "../kanban", title: "B" }, /kanban/],
      ["a type with no page", { type: "pageless", title: "B" }, /index\.html/],
      ["a type with no title of its own", { type: "untitled", title: "B" }, /title/],
      ["a type file that leaves the project", { type: "leaky", title: "B" }, /outside the project/],
      [
        "files alone to an artifact made from no type",
        { url: "plain", files: { "a.css": w.file("a.css", "a") } },
        /page/,
      ],
      ["neither file_path nor url and files", { title: "B" }, /file_path/],
    ];
    for (const [name, params, reason] of mistakes) {
      const error = await w.run(params).then(
        () => null,
        (e: Error) => e.message,
      );
      expect([name, reason.test(error ?? "")]).toEqual([name, true]);
    }
    const listed = (await (await w.api("/artifacts")).json()) as { artifacts: unknown[] };
    expect(listed.artifacts).toHaveLength(1);
  });
});

describe("S20 the project's types, and quickstart", () => {
  test("S20 list with scope types names each type; quickstart lists them and points a plain page at artifact-design", async () => {
    const w = wire();
    kanban(w);
    w.file(".pi/artifact-types/not-a-type/readme.txt", "no descriptor");
    const listed = await w.run({ action: "list", scope: "types" });
    const rows = listed.text.split("\n").filter((line) => line.startsWith("- "));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain("kanban");
    expect(rows[0]).toContain("Kanban board");
    expect(rows[0]).toContain("Columns of cards");
    expect(listed.text).toMatch(/type/);
    const quick = await w.run({ action: "quickstart", intent: "design" });
    expect(quick.text.split("\n").filter((line) => line.startsWith("- "))).toEqual(rows);
    expect(quick.text).toContain("artifact-design");
    expect(quick.text).toMatch(/nothing was (written|published)/i);
    expect(quick.details).toMatchObject({ action: "quickstart" });
    expect(await (await w.api("/artifacts")).json()).toEqual({ artifacts: [] });
    expect(w.opened).toHaveLength(0);
  });
  test("S20 with no types both say so; quickstart without an intent is refused", async () => {
    const w = wire();
    const listed = await w.run({ action: "list", scope: "types" });
    expect(listed.text.split("\n").filter((line) => line.startsWith("- "))).toEqual([]);
    expect(listed.text).toContain(".pi/artifact-types");
    const quick = await w.run({ action: "quickstart", intent: "other" });
    expect(quick.text).toMatch(/no artifact types/i);
    expect(quick.text).toContain("artifact-design");
    await expect(w.run({ action: "quickstart" })).rejects.toThrow(/intent/);
    const parameters = (
      w.fake.tools.get("artifact")?.parameters as { properties: Record<string, unknown> }
    ).properties;
    expect(Object.keys(parameters)).toEqual(expect.arrayContaining(["type", "intent"]));
  });
});
