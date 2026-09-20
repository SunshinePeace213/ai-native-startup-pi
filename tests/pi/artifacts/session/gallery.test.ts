// Contract — the /artifacts panel (src/ui/gallery.ts, wired by src/ui/command.ts):
// Claude Code's Artifacts dialog, plus a Status tab. The tab labels and the guide
// strings mirror Claude Code's and are matched exactly; everything else asserts facts.
//
// G1: the tabs are `All N`, `⧉ This session N`, `↳ Other sessions N`, then `★ Pinned N`
//     only while a page is pinned or that tab is the current one, then `◍ Status`,
//     always last and uncounted; the counts follow the search; the current tab is the
//     highlighted one; too narrow for one line, the bar runs on to the next, no tab cut
// G2: tab / → and shift+tab / ← cycle the tabs and wrap, and put the selection back on
//     the first row; in the search box they stay the box's; on pi's fullscreen screen a
//     left click on a tab selects it, on the bar's second line too, a click anywhere
//     else selects nothing, and a double click on a tab starts no text selection
// G3: rows run pinned first, then most recently updated; a row carries the relation
//     icon, ★ in the warning colour when pinned, the name — the title, else the slug, at
//     most 50 characters — and the facts attached · N replies waiting · unwatched ·
//     version · age, in that order; the selection follows a page that pinning re-sorts;
//     no control character from a title reaches a line
// G4: the list shows clamp(min(terminal rows − 12, 20), 3, max(3, rows)) rows with the
//     selection inside, `↑ N more above` and `↓ N more below` around them; ↓ stops at
//     the last row
// G5: `/`, or ↑ on the first row, focuses the search box; typing keeps the pages whose
//     title, slug or description contains the text, whatever its case; enter or ↓ goes
//     back to the first row; esc empties the box, and on an empty box esc or backspace
//     leaves it, without closing the panel; an empty tab says what it has none of, and
//     echoes the query
// G6: the guide names only what applies: `x to dismiss` on an attached page only,
//     `p to pin` or `p to unpin` by the row, no artifact hints on the Status tab, on an
//     empty tab or before there is a list, and its own strings while searching,
//     renaming and confirming; too narrow for one line, it wraps without cutting an entry
// G7: enter attaches: this session owns the page, gains its pill, the model is told,
//     and the panel closes; an attach that fails leaves the panel open and says to
//     retry; while one is on its way the panel says so and starts no other action
// G8: o, c, x, p and w act on the selected row and the panel stays open: o opens the
//     tokened URL and names the bare one, or says no browser opened and to press c; c
//     names the URL it copied; x drops an attached page from this session's strip and
//     leaves it published, and does nothing to a page that is not attached; p pins and
//     unpins on the server; w turns wakes off and on
// G9: ctrl+r renames through the server: the field holds the current title, enter
//     saves what was typed, an unchanged or empty name and esc change nothing, and a
//     title the server refuses shows its reason
// G10: d asks first, and only y after it moves the folder to the trash; n and esc
//      keep the page, any other key leaves the question standing, and a y that no d
//      came before deletes nothing
// G11: loading, a failed load with its reason — r reads again — and an empty store each
//      stand where the list would, and the Status tab stays reachable from them
// G12: the Status tab reads the live server: its origin, pid and uptime, whether its
//      code is current, the store (under ~ when it is in the home directory), the
//      isolation, how many sessions are connected and whether this one is, the counts,
//      delivery, retention, settings and logs; a problem is in the warning colour; r
//      reads again; no line carries the session token, the viewer secret, or a tokened
//      URL; a server that does not answer is one warning row with the reason, over
//      what starts it
// G13: `/artifacts status` opens the panel on the Status tab; without a UI it prints
//      the same rows, as a warning when the server does not answer, and `/artifacts`
//      prints the list: no panel opens

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { type Component, stripTerminalSequences } from "@earendil-works/pi-tui";
import { DEFAULT_CONFIG, type Manifest, type ServerStatus } from "@ext/artifacts/src/domain/types";
import { Gallery, type GalleryAction, type StatusFacts } from "@ext/artifacts/src/ui/gallery";
import { STRIP_KEY } from "@ext/artifacts/src/ui/strip";
import { mountFullscreen } from "@harness/fullscreen";

import { sleep, stopAll, wire } from "../fixture";

afterEach(stopAll);

type Wired = ReturnType<typeof wire>;
type Panel = Component & { handleInput(data: string): void };

const PAGE = "<h1>Plan</h1><p>body</p>";
const WIDTH = 200;
const KEYS = {
  up: "\x1b[A",
  down: "\x1b[B",
  right: "\x1b[C",
  left: "\x1b[D",
  tab: "\t",
  shiftTab: "\x1b[Z",
  enter: "\r",
  esc: "\x1b",
  backspace: "\x7f",
  ctrlR: "\x12",
} as const;
const STATUS_LABELS = [
  "Server",
  "Code",
  "Store",
  "Isolation",
  "Sessions",
  "Artifacts",
  "Delivery",
  "Retention",
  "Settings",
  "Logs",
];
const GUIDE = {
  search: "Type to filter · Enter/↓ to list · Esc to clear",
  rename: "Enter to save · Esc to cancel",
  confirm: "y to delete · n to keep",
  status: "Tab to switch · r to refresh",
};
/** The list guide, as Claude Code words it, for a row that is or is not attached and pinned. */
const listGuide = (row: { attached: boolean; pinned: boolean }) =>
  [
    "Enter to attach",
    ...(row.attached ? ["x to dismiss"] : []),
    "c to copy url",
    "Ctrl+R to rename",
    "d to delete",
    row.pinned ? "p to unpin" : "p to pin",
    "/ to search",
    "r to refresh",
  ].join(" · ");

async function until(condition: () => boolean, what: string, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(5);
  }
}

/** What a test reads off the panel and does to it: the lines it draws, the keys it is sent. */
function reading(panel: Panel, width = WIDTH) {
  const lines = () => panel.render(width).map(stripTerminalSequences);
  const text = () => lines().join("\n");
  const rowLines = () => lines().filter((line) => /^(❯ | {2})[⧉↳] /.test(line));
  const nameOf = (row: string) => row.replace(/^(❯ | {2})[⧉↳] (★ )?/, "").split("  ")[0] ?? "";
  return {
    panel,
    lines,
    text,
    tabLine: () => lines().find((line) => line.includes("◍ Status")) ?? "",
    guide: () => lines().at(-1) ?? "",
    rowLines,
    names: () => rowLines().map(nameOf),
    selected: () => nameOf(rowLines().find((row) => row.startsWith("❯ ")) ?? ""),
    /** The dim facts after a row's name, in the order they are drawn. */
    facts: (name: string) =>
      (rowLines().find((row) => nameOf(row) === name) ?? "").split("  ").at(-1)?.split(" · ") ?? [],
    /** The labels of the Status rows drawn, top to bottom. */
    statusLabels: () =>
      lines().flatMap((line) => /^ ([A-Z][a-z]+) {2,}\S/.exec(line)?.slice(1) ?? []),
    /** A Status row's value, by its label. */
    status: (label: string) =>
      lines()
        .find((line) => line.startsWith(` ${label} `))
        ?.slice(13) ?? "",
    press: (...keys: string[]) => {
      for (const key of keys) panel.handleInput(key);
    },
    shows: (fragment: string) => until(() => text().includes(fragment), `"${fragment}"`),
  };
}

type Factory = (
  tui: { requestRender(): void; terminal: { rows: number; columns: number } },
  theme: unknown,
  keybindings: unknown,
  done: (result: unknown) => void,
) => Panel;

/**
 * The panel the wired `/artifacts` command opens, on a stand-in for pi's ui.custom: the
 * component is built by the command's own factory and the promise resolves when it is done.
 */
async function open(w: Wired, args = "", options: { theme?: Record<string, unknown> } = {}) {
  const ui = w.ctx.ctx.ui as unknown as { theme: Record<string, unknown>; custom: unknown };
  // The harness theme paints nothing; marking reverse video alone makes the current tab read as it looks.
  Object.assign(ui.theme, {
    italic: (text: string) => text,
    inverse: (text: string) => `[${text.trim()}]`,
    ...options.theme,
  });
  let mounted: Panel | undefined;
  let closed = false;
  ui.custom = (factory: Factory) =>
    new Promise((resolve) => {
      mounted = factory(
        { requestRender() {}, terminal: { rows: 40, columns: WIDTH } },
        ui.theme,
        {},
        (result) => {
          closed = true;
          resolve(result);
        },
      );
    });
  const command = w.fake.commands.get("artifacts");
  if (!command) throw new Error("/artifacts was not registered");
  const finished = command.handler(args, w.ctx.ctx);
  await until(() => mounted !== undefined, "the panel to open");
  const read = reading(mounted as Panel);
  await until(() => !read.text().includes("Loading"), "the panel to load");
  return { ...read, finished, closed: () => closed };
}

/** Marks the warning colour, so a line reads as it is painted. */
const WARN = {
  fg: (color: string, text: string) => (color === "warning" ? `<warn>${text}</warn>` : text),
};

/** One session with a clock that ticks between publishes, so "most recently updated" is decided. */
function ticking(options: Parameters<typeof wire>[0] = {}): Wired {
  let tick = Date.parse("2026-01-01T00:00:00.000Z");
  return wire({ now: () => new Date((tick += 1000)), ...options });
}

/** Two sessions on one server: what one publishes is the other's "other sessions". */
function twoSessions(): { a: Wired; b: Wired } {
  const a = ticking({ session: "session-A" });
  const b = wire({
    session: "session-B",
    share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
  });
  return { a, b };
}

const publish = async (w: Wired, file: string, title: string, extra = {}) =>
  (await w.run({ file_path: w.file(file, PAGE), title, ...extra })).details?.slug as string;

const manifestOf = async (w: Wired, slug: string) =>
  ((await (await w.api(`/artifacts/${slug}`)).json()) as { manifest: Manifest }).manifest;

/** Opens this session's event stream and waits until the server lists it as connected. */
async function connect(w: Wired): Promise<void> {
  await w.host.start();
  await until(() => w.backend.server.sessions().includes(w.session), "the session to connect");
}

// Below the wire: what the fixture cannot arrange — a fixed clock, a list too long to
// publish, a load that fails or never ends, a status the live server never reports —
// and the one key that must not run for real: there the copy lands on the developer's
// own clipboard.
const NOW = new Date("2026-02-01T00:00:00.000Z");
const DAY = 86_400_000;
const page = (n: number, over: Partial<Manifest> = {}): Manifest => ({
  slug: `s${n}`,
  title: `Page ${n}`,
  source: "html",
  createdAt: NOW.toISOString(),
  updatedAt: new Date(NOW.getTime() - n * DAY).toISOString(),
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
const statusFacts = (
  over: Partial<StatusFacts> = {},
  server: Partial<ServerStatus> = {},
): StatusFacts => ({
  server: {
    origin: "http://localhost:5834",
    pid: 8387,
    port: 5834,
    root: "/Users/someone/project/.pi/artifacts",
    startedAt: new Date(NOW.getTime() - (2 * 60 + 14) * 60_000).toISOString(),
    isolation: "origin",
    retentionDays: 14,
    sessions: ["me"],
    artifacts: { total: 7, pinned: 1, pending: 1 },
    ...server,
  },
  mine: 2,
  session: "me",
  config: DEFAULT_CONFIG,
  codeChangedAt: 0,
  logs: ".pi/artifacts/logs/2026-02-01/",
  home: "/Users/someone",
  ...over,
});
const mark = (name: string) => (text: string) => `<${name}>${text}</${name}>`;
const plain = (text: string) => text;

function mount(
  load: Manifest[] | (() => Promise<Manifest[]>),
  options: {
    rows?: number;
    width?: number;
    attached?: string[];
    /** How long an action takes; default: no time at all. */
    acting?: () => Promise<void>;
    status?: () => Promise<StatusFacts>;
    warn?: (text: string) => string;
  } = {},
) {
  const acts: Array<[GalleryAction, string]> = [];
  let closed = false;
  const gallery = new Gallery({
    session: "me",
    load: typeof load === "function" ? load : async () => load,
    status: options.status ?? (async () => statusFacts()),
    attached: (slug) => (options.attached ?? []).includes(slug),
    url: (slug) => `http://localhost:5834/a/${slug}`,
    act: async (action, m) => {
      acts.push([action, m.slug]);
      await options.acting?.();
    },
    done: () => (closed = true),
    requestRender: () => {},
    paint: {
      accent: plain,
      dim: plain,
      warn: options.warn ?? plain,
      bold: plain,
      italic: plain,
      selected: (text) => `[${text.trim()}]`,
    },
    terminalRows: () => options.rows ?? 40,
    now: () => NOW,
  });
  return { gallery, acts, closed: () => closed, ...reading(gallery, options.width) };
}

describe("G1 the tabs", () => {
  test("G1 All, This session, Other sessions and Status, in that order; Status has no count", async () => {
    const { a, b } = twoSessions();
    await publish(a, "plan.html", "Plan");
    await publish(a, "roadmap.html", "Roadmap");
    await publish(b, "notes.html", "Notes");
    const p = await open(b);
    const tabs = p.tabLine();
    const at = ["[All 3]", "⧉ This session 1", "↳ Other sessions 2", "◍ Status"].map((label) =>
      tabs.indexOf(label),
    );
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
    expect(tabs).not.toMatch(/◍ Status \d/);
  });
  test("G1 Pinned appears with the first pin, before Status, and goes with the last", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    expect(p.tabLine()).not.toContain("★ Pinned");
    p.press("p");
    await p.shows("★ Pinned 1");
    expect(p.tabLine().indexOf("★ Pinned 1")).toBeLessThan(p.tabLine().indexOf("◍ Status"));
    p.press("p");
    await p.shows("Unpinned");
    expect(p.tabLine()).not.toContain("★ Pinned");
  });
  test("G1 the Pinned tab stays while it is the current one, even at zero", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    p.press("p");
    await p.shows("★ Pinned 1");
    p.press(KEYS.tab, KEYS.tab, KEYS.tab);
    expect(p.tabLine()).toContain("[★ Pinned 1]");
    p.press("p");
    await p.shows("[★ Pinned 0]");
    expect(p.text()).toMatch(/pinned/i);
    p.press(KEYS.tab);
    expect(p.tabLine()).not.toContain("★ Pinned");
  });
  test("G1 the counts follow the search", async () => {
    const { a, b } = twoSessions();
    await publish(a, "plan.html", "Plan");
    await publish(b, "notes.html", "Notes");
    const p = await open(b);
    p.press("/", ..."plan");
    expect(p.tabLine()).toContain("[All 1]");
    expect(p.tabLine()).toContain("⧉ This session 0");
    expect(p.tabLine()).toContain("↳ Other sessions 1");
  });
  test("G1 a bar wider than the terminal runs on to the next line; one that fits stays on one", async () => {
    const labels = ["[All 1]", "⧉ This session 0", "↳ Other sessions 1", "★ Pinned 1", "◍ Status"];
    const holding = (lines: string[]) =>
      lines.filter((line) => labels.some((label) => line.includes(label)));
    const narrow = mount([page(1, { pinned: true })], { width: 50 });
    const wide = mount([page(1, { pinned: true })]);
    for (const g of [narrow, wide]) await g.gallery.refresh();
    expect(holding(wide.lines())).toHaveLength(1);
    expect(holding(narrow.lines()).length).toBeGreaterThan(1);
    expect(narrow.lines().every((line) => line.length <= 50)).toBe(true);
    for (const label of labels) expect(narrow.text()).toContain(label);
  });
});

describe("G2 moving between tabs", () => {
  const current = (tabs: string) => /\[([^\]]+)\]/.exec(tabs)?.[1] ?? "";
  test.each([
    ["tab", KEYS.tab, KEYS.shiftTab],
    ["→ and ←", KEYS.right, KEYS.left],
  ])("G2 %s cycle forward and back, and wrap", async (_name, forward, back) => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    const seen = [current(p.tabLine())];
    for (let i = 0; i < 4; i++) {
      p.press(forward);
      seen.push(current(p.tabLine()));
    }
    expect(seen).toEqual(["All 1", "⧉ This session 1", "↳ Other sessions 0", "◍ Status", "All 1"]);
    p.press(back);
    expect(current(p.tabLine())).toBe("◍ Status");
    p.press(back);
    expect(current(p.tabLine())).toBe("↳ Other sessions 0");
  });
  test("G2 a tab switch puts the selection back on the first row", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    await publish(w, "roadmap.html", "Roadmap");
    const p = await open(w);
    p.press(KEYS.down);
    expect(p.selected()).toBe("Plan");
    p.press(KEYS.tab);
    expect(p.selected()).toBe("Roadmap");
  });
  test("G2 in the search box, tab is not a tab switch", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    p.press("/", KEYS.tab, KEYS.shiftTab);
    expect(current(p.tabLine())).toBe("All 1");
  });
  test("G2 on pi's fullscreen screen a click on a tab selects it; a click elsewhere selects nothing", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    const screen = mountFullscreen(p.panel);
    screen.click("↳ Other sessions");
    expect(current(p.tabLine())).toBe("↳ Other sessions 0");
    screen.click("◍ Status");
    expect(current(p.tabLine())).toBe("◍ Status");
    await p.shows("Server");
    for (const elsewhere of ["Artifacts", "Search artifacts…", "Server", "r to refresh"])
      screen.click(elsewhere);
    expect(current(p.tabLine())).toBe("◍ Status");
    screen.click("All 1");
    expect(current(p.tabLine())).toBe("All 1");
    // A tab's press is the panel's own: a double click there starts no word selection of pi's.
    screen.click("All 1");
    screen.click("All 1");
    expect(screen.selecting()).toBe(false);
    expect(screen.opened).toEqual([]);
    screen.stop();
  });
  test("G2 a click finds a tab on the bar's second line too", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    const screen = mountFullscreen(p.panel, 40);
    screen.click("◍ Status");
    expect(current(p.tabLine())).toBe("◍ Status");
    screen.click("This session");
    expect(current(p.tabLine())).toBe("⧉ This session 1");
    screen.stop();
  });
});

describe("G3 the rows", () => {
  const pages = [
    page(1),
    page(2, { owner: "me", sessions: ["me"], watched: false }),
    page(3, { pinned: true, sessions: ["other", "me"], pending: [{ id: "e" } as never] }),
  ];
  test("G3 pinned first, then most recently updated", async () => {
    const g = mount(pages);
    await g.gallery.refresh();
    expect(g.names()).toEqual(["Page 3", "Page 1", "Page 2"]);
  });
  test("G3 a row carries its relation, its pin and its facts, in order", async () => {
    const g = mount(pages, { attached: ["s3"], warn: mark("warn") });
    await g.gallery.refresh();
    const [pinned, theirs, mine] = g.rowLines();
    expect(pinned).toStartWith("❯ ⧉ <warn>★ </warn>Page 3");
    expect(theirs).toStartWith("  ↳ Page 1");
    expect(mine).toStartWith("  ⧉ Page 2");
    expect(g.facts("<warn>★ </warn>Page 3")).toEqual([
      "attached",
      "1 reply waiting",
      "v1",
      "3d ago",
    ]);
    expect(g.facts("Page 1")).toEqual(["v1", "1d ago"]);
    expect(g.facts("Page 2")).toEqual(["unwatched", "v1", "2d ago"]);
  });
  test("G3 an age reads now, then minutes, hours, weeks, months", async () => {
    const at = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
    const g = mount(
      [5_000, 5 * 60_000, 3 * 3_600_000, 15 * DAY, 40 * DAY].map((ms, n) =>
        page(n, { updatedAt: at(ms) }),
      ),
    );
    await g.gallery.refresh();
    expect(g.rowLines().map((row) => row.split(" · ").at(-1))).toEqual([
      "now",
      "5m ago",
      "3h ago",
      "2w ago",
      "1mo ago",
    ]);
  });
  test("G3 a name is the title cut to 50 characters, or the slug; nothing hostile reaches a line", async () => {
    const g = mount([
      page(1, { title: "T".repeat(60) }),
      page(2, { title: "" }),
      page(3, { title: "x\x1b[2J\x1b]0;pwned\x07y" }),
    ]);
    await g.gallery.refresh();
    expect(g.names()).toEqual([`${"T".repeat(49)}…`, "s2", "xy"]);
    // eslint-disable-next-line no-control-regex
    expect(g.gallery.render(WIDTH).join("\n")).not.toMatch(/\x1b\[2J|\x07|pwned/);
  });
  test("G3 the selection follows a page as pinning re-sorts it", async () => {
    const w = ticking();
    await publish(w, "first.html", "First");
    await publish(w, "second.html", "Second");
    await publish(w, "third.html", "Third");
    const p = await open(w);
    expect(p.names()).toEqual(["Third", "Second", "First"]);
    p.press(KEYS.down, KEYS.down, "p");
    await p.shows("Pinned First");
    expect(p.names()).toEqual(["First", "Third", "Second"]);
    expect(p.selected()).toBe("First");
  });
});

describe("G4 the window", () => {
  const list = (n: number) => Array.from({ length: n }, (_, i) => page(i + 1));
  test.each([
    [40, 30, 20],
    [20, 30, 8],
    [16, 30, 4],
    [10, 30, 3],
    [40, 2, 2],
  ])("G4 a terminal of %i rows shows %i pages as %i rows", async (rows, pages, shown) => {
    const g = mount(list(pages), { rows });
    await g.gallery.refresh();
    expect(g.rowLines()).toHaveLength(shown);
    if (pages > shown) expect(g.text()).toContain(`↓ ${pages - shown} more below`);
    else expect(g.text()).not.toContain("more below");
    expect(g.text()).not.toContain("more above");
  });
  test("G4 the window follows the selection, which stops at the last row", async () => {
    const g = mount(list(6), { rows: 15 });
    await g.gallery.refresh();
    g.press(KEYS.down, KEYS.down, KEYS.down);
    expect(g.selected()).toBe("Page 4");
    expect(g.names()).toEqual(["Page 2", "Page 3", "Page 4"]);
    expect(g.text()).toContain("↑ 1 more above");
    expect(g.text()).toContain("↓ 2 more below");
    g.press(...Array<string>(10).fill(KEYS.down));
    expect(g.selected()).toBe("Page 6");
    expect(g.text()).toContain("↑ 3 more above");
    expect(g.text()).not.toContain("more below");
  });
});

describe("G5 search", () => {
  const searchable = async () => {
    const { a, b } = twoSessions();
    // Each page is findable by one field only, so a field the search skipped shows.
    await publish(a, "plan.html", "Pricing plan", { slug: "q3-offer" });
    await publish(a, "numbers.html", "Quarterly", { slug: "numbers-2026" });
    await publish(b, "roadmap.html", "Roadmap", { description: "What ships before the launch" });
    return { a, b };
  };
  test.each([
    ["the title, whatever the case", "PRICING", ["Pricing plan"]],
    ["the slug", "numbers", ["Quarterly"]],
    ["the description", "launch", ["Roadmap"]],
    ["a substring, not a fuzzy match", "prcng", []],
  ])("G5 typing keeps what matches %s", async (_name, query, names) => {
    const { b } = await searchable();
    const p = await open(b);
    p.press("/", ...query);
    expect(p.guide()).toBe(GUIDE.search);
    expect(p.names()).toEqual(names);
  });
  test("G5 enter goes back to the first row of what is left", async () => {
    const { b } = await searchable();
    const p = await open(b);
    p.press("/", ..."r", KEYS.enter);
    expect(p.names()).toEqual(["Roadmap", "Quarterly", "Pricing plan"]);
    expect(p.selected()).toBe("Roadmap");
    expect(p.guide()).toBe(listGuide({ attached: true, pinned: false }));
  });
  test("G5 ↑ on the first row moves into the box, ↓ back out; ↑ further down only moves up", async () => {
    const { b } = await searchable();
    const p = await open(b);
    p.press(KEYS.down, KEYS.up);
    expect(p.guide()).not.toBe(GUIDE.search);
    expect(p.selected()).toBe("Roadmap");
    p.press(KEYS.up);
    expect(p.guide()).toBe(GUIDE.search);
    expect(p.selected()).toBe("");
    p.press(KEYS.down);
    expect(p.guide()).not.toBe(GUIDE.search);
    expect(p.selected()).toBe("Roadmap");
  });
  test("G5 esc empties the box, then leaves it; the panel is still open", async () => {
    const { b } = await searchable();
    const p = await open(b);
    p.press("/", ..."road");
    expect(p.names()).toEqual(["Roadmap"]);
    p.press(KEYS.esc);
    expect(p.names()).toHaveLength(3);
    expect(p.guide()).toBe(GUIDE.search);
    p.press(KEYS.esc);
    expect(p.guide()).not.toBe(GUIDE.search);
    expect(p.closed()).toBe(false);
    p.press(KEYS.esc);
    expect(p.closed()).toBe(true);
  });
  test("G5 backspace deletes what was typed, and on an empty box leaves it", async () => {
    const { b } = await searchable();
    const p = await open(b);
    p.press("/", ..."ro", KEYS.backspace, KEYS.backspace);
    expect(p.names()).toHaveLength(3);
    expect(p.guide()).toBe(GUIDE.search);
    p.press(KEYS.backspace);
    expect(p.guide()).not.toBe(GUIDE.search);
    expect(p.closed()).toBe(false);
  });
  test("G5 a tab with no match echoes the query and names what it searched", async () => {
    const { b } = await searchable();
    const p = await open(b);
    p.press("p");
    await p.shows("★ Pinned 1");
    p.press("/", ..."zzz", KEYS.enter);
    const said: string[] = [];
    for (let i = 0; i < 4; i++) {
      said.push(p.lines().find((line) => line.includes('"zzz"')) ?? "");
      p.press(KEYS.tab);
    }
    expect(said.every((line) => /^No .*match "zzz"$/.test(line))).toBe(true);
    expect(said[1]).toMatch(/this session/);
    expect(said[2]).toMatch(/other sessions/);
    expect(said[3]).toMatch(/pinned/);
  });
  test("G5 a tab with nothing in it says what it has none of", async () => {
    const { a, b } = twoSessions();
    await publish(a, "plan.html", "Plan");
    const theirs = await open(b);
    theirs.press(KEYS.tab);
    expect(theirs.text()).toMatch(/Nothing from this session/);
    const mine = await open(a);
    mine.press(KEYS.tab, KEYS.tab);
    expect(mine.text()).toMatch(/Nothing from other sessions/);
    expect(mine.text()).not.toMatch(/Nothing from this session/);
  });
});

describe("G6 the guide", () => {
  test("G6 x to dismiss is offered on an attached page only; p names what it would do", async () => {
    const { a, b } = twoSessions();
    await publish(a, "plan.html", "Plan");
    await publish(b, "notes.html", "Notes");
    const p = await open(b);
    expect(p.selected()).toBe("Notes");
    expect(p.guide()).toBe(listGuide({ attached: true, pinned: false }));
    p.press(KEYS.down);
    expect(p.selected()).toBe("Plan");
    expect(p.guide()).toBe(listGuide({ attached: false, pinned: false }));
    p.press("p");
    await p.shows("Pinned Plan");
    expect(p.guide()).toBe(listGuide({ attached: false, pinned: true }));
  });
  test("G6 the Status tab, an empty tab and an empty store offer nothing to do to a page", async () => {
    const w = ticking();
    const empty = await open(w);
    expect(empty.guide()).toBe("r to refresh");
    empty.press(KEYS.esc);
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    p.press(KEYS.tab, KEYS.tab);
    expect(p.guide()).toBe("/ to search · r to refresh");
    p.press(KEYS.tab);
    expect(p.guide()).toBe(GUIDE.status);
  });
  test("G6 renaming and confirming have their own guides", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    p.press(KEYS.ctrlR);
    expect(p.guide()).toBe(GUIDE.rename);
    p.press(KEYS.esc, "d");
    expect(p.guide()).toBe(GUIDE.confirm);
  });
  test("G6 a narrow terminal wraps the guide between entries", async () => {
    const g = mount([page(1)], { attached: ["s1"], width: 60 });
    await g.gallery.refresh();
    const wrapped = g.lines().slice(g.lines().findIndex((line) => line.startsWith("Enter to")));
    expect(wrapped.length).toBeGreaterThan(1);
    expect(wrapped.every((line) => line.length <= 60)).toBe(true);
    expect(wrapped.join(" · ")).toBe(listGuide({ attached: true, pinned: false }));
  });
});

describe("G7 enter attaches", () => {
  test("G7 this session owns the page, gains its pill, the model is told, and the panel closes", async () => {
    const { a, b } = twoSessions();
    await publish(a, "plan.html", "Plan");
    await b.sessionStart();
    const p = await open(b);
    p.press(KEYS.enter);
    await p.finished;
    expect(p.closed()).toBe(true);
    expect((await manifestOf(b, "plan")).owner).toBe("session-B");
    expect(b.host.badges().map((badge) => badge.slug)).toEqual(["plan"]);
    expect(b.ctx.status.get(STRIP_KEY)).toContain("plan");
    const note = b.feedback().at(-1);
    expect(note?.message.content).toMatch(/attached .*"Plan" \(plan\)/);
    expect(note?.options?.triggerTurn).toBeUndefined();
    expect(b.ctx.notifications.some((n) => /Attached "Plan"/.test(n.message))).toBe(true);
  });
  test("G7 an attach that fails leaves the panel open, the session untouched, and says to retry", async () => {
    const { a, b } = twoSessions();
    await publish(a, "plan.html", "Plan");
    const p = await open(b);
    await a.api("/artifacts/plan/delete", { method: "POST", body: "{}" });
    p.press(KEYS.enter);
    await p.shows("could not be attached");
    expect(p.text()).toMatch(/press Enter to try again/i);
    expect(p.closed()).toBe(false);
    expect(b.host.badges()).toEqual([]);
    expect(b.feedback()).toEqual([]);
  });
  test("G7 while an attach is on its way the panel says so, and a second enter or a d starts nothing", async () => {
    let arrive = () => {};
    const g = mount([page(1)], { acting: () => new Promise<void>((done) => (arrive = done)) });
    await g.gallery.refresh();
    g.press(KEYS.enter);
    await g.shows("Attaching Page 1");
    g.press(KEYS.enter, "d");
    expect(g.acts).toEqual([["attach", "s1"]]);
    expect(g.guide()).not.toBe(GUIDE.confirm);
    expect(g.closed()).toBe(false);
    arrive();
    await until(g.closed, "the panel to close");
  });
});

describe("G8 o c x p w", () => {
  test("G8 o opens the tokened URL and names the bare one", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const before = w.opened.length;
    const p = await open(w);
    p.press("o");
    await p.shows(`Opened ${w.host.url("plan", false)}`);
    expect(w.opened.slice(before)).toEqual([w.host.url("plan")]);
    expect(p.text()).not.toContain("?t=");
    expect(p.closed()).toBe(false);
  });
  test("G8 o without a browser says so, and that c copies the URL", async () => {
    const w = ticking({ openResult: "no opener found", config: { autoOpen: false } });
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    p.press("o");
    await p.shows(`press c to copy ${w.host.url("plan", false)}`);
    expect(p.text()).toMatch(/Couldn't open a browser/);
    expect(p.text()).not.toContain("Opened");
  });
  test("G8 c asks for the selected page's link and names the URL", async () => {
    const g = mount([page(1), page(2)]);
    await g.gallery.refresh();
    g.press(KEYS.down, "c");
    await g.shows("Copied http://localhost:5834/a/s2");
    expect(g.acts).toEqual([["copy", "s2"]]);
    expect(g.closed()).toBe(false);
  });
  test("G8 x drops an attached page from this session's strip and leaves it published", async () => {
    const w = ticking();
    await w.sessionStart();
    await publish(w, "plan.html", "Plan");
    await publish(w, "roadmap.html", "Roadmap");
    const p = await open(w);
    p.press(KEYS.down);
    expect(p.facts("Plan")).toContain("attached");
    p.press("x");
    await p.shows("Dismissed Plan");
    expect(w.host.badges().map((badge) => badge.slug)).toEqual(["roadmap"]);
    expect(w.ctx.status.get(STRIP_KEY)).not.toContain("plan");
    expect((await w.api("/artifacts/plan")).status).toBe(200);
    expect(p.names()).toEqual(["Roadmap", "Plan"]);
    expect(p.facts("Plan")).not.toContain("attached");
    expect(p.guide()).toBe(listGuide({ attached: false, pinned: false }));
  });
  test("G8 x on a page that is not attached does nothing", async () => {
    const { a, b } = twoSessions();
    await publish(a, "plan.html", "Plan");
    await publish(b, "notes.html", "Notes");
    const p = await open(b);
    p.press(KEYS.down, "x");
    await sleep(30);
    expect(p.text()).not.toContain("Dismissed");
    expect(a.host.badges().map((badge) => badge.slug)).toEqual(["plan"]);
    expect(b.host.badges().map((badge) => badge.slug)).toEqual(["notes"]);
  });
  test("G8 p pins and unpins on the server; w turns wakes off and on", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    p.press("p");
    await p.shows("Pinned Plan");
    expect((await manifestOf(w, "plan")).pinned).toBe(true);
    p.press("p");
    await p.shows("Unpinned Plan");
    expect((await manifestOf(w, "plan")).pinned).toBe(false);
    p.press("w");
    await until(() => p.facts("Plan").includes("unwatched"), "the row to say unwatched");
    expect((await manifestOf(w, "plan")).watched).toBe(false);
    p.press("w");
    await until(() => !p.facts("Plan").includes("unwatched"), "the row to drop unwatched");
    expect((await manifestOf(w, "plan")).watched).toBe(true);
    expect(p.closed()).toBe(false);
  });
});

describe("G9 ctrl+r renames", () => {
  const renaming = async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const p = await open(w);
    p.press(KEYS.ctrlR);
    return { w, p };
  };
  test("G9 the field holds the current title; enter saves what was typed", async () => {
    const { w, p } = await renaming();
    const field = p.lines()[p.lines().findIndex((line) => line === "Rename artifact:") + 1];
    expect(field?.trim()).toBe("Plan");
    p.press(..." for Q3", KEYS.enter);
    await p.shows("Renamed to Plan for Q3");
    expect((await manifestOf(w, "plan")).title).toBe("Plan for Q3");
    expect(p.names()).toEqual(["Plan for Q3"]);
  });
  test.each([
    ["an unchanged name", [KEYS.enter]],
    ["an emptied field", [...Array<string>(4).fill(KEYS.backspace), KEYS.enter]],
    ["esc after typing", [..." v2", KEYS.esc]],
  ])("G9 %s changes nothing", async (_name, keys) => {
    const { w, p } = await renaming();
    p.press(...keys);
    await sleep(30);
    expect(p.text()).not.toContain("Rename artifact:");
    expect(p.text()).not.toMatch(/Renam(ing|ed)/);
    const manifest = await manifestOf(w, "plan");
    expect([manifest.title, manifest.renamed]).toEqual(["Plan", undefined]);
  });
  test("G9 a title the server refuses shows its reason and keeps the old one", async () => {
    const { w, p } = await renaming();
    p.press("x".repeat(201), KEYS.enter);
    await p.shows("at most 200");
    expect((await manifestOf(w, "plan")).title).toBe("Plan");
  });
});

describe("G10 d deletes, after asking", () => {
  const deleting = async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const folder = join(w.storeRoot, "plan");
    return { w, p: await open(w), folder };
  };
  test("G10 y moves the folder to the trash and drops the pill", async () => {
    const { w, p, folder } = await deleting();
    p.press("d");
    expect(p.text()).toMatch(/Plan.*Trash/);
    expect(existsSync(folder)).toBe(true);
    p.press("y");
    await p.shows("Artifact deleted");
    expect(existsSync(folder)).toBe(false);
    expect(readdirSync(w.trashDir)).toHaveLength(1);
    expect(w.host.badges()).toEqual([]);
    expect(p.names()).toEqual([]);
  });
  test.each([
    ["n", ["d", "n"], false],
    ["esc", ["d", KEYS.esc], false],
    ["any other key, which leaves the question standing", ["d", "x", KEYS.enter], true],
    ["y that no d came before", ["y"], false],
  ])("G10 %s keeps the page", async (_name, keys, asking) => {
    const { w, p, folder } = await deleting();
    p.press(...keys);
    await sleep(30);
    expect(existsSync(folder)).toBe(true);
    expect(readdirSync(w.trashDir)).toEqual([]);
    expect(p.guide() === GUIDE.confirm).toBe(asking);
    expect(p.closed()).toBe(false);
  });
});

describe("G11 what stands where the list would", () => {
  test("G11 a load that has not ended says so, and the Status tab is reachable", async () => {
    const g = mount(() => new Promise<Manifest[]>(() => {}));
    void g.gallery.refresh();
    expect(g.text()).toContain("Loading artifacts…");
    expect(g.guide()).toBe("");
    g.press(KEYS.shiftTab);
    await g.shows("pid 8387");
  });
  test("G11 a failed load shows its reason; r reads again", async () => {
    let calls = 0;
    const g = mount(async () => {
      if (calls++ === 0) throw new Error("the artifact server at http://localhost:5834 is gone");
      return [page(1)];
    });
    await g.gallery.refresh();
    expect(g.text()).toContain("the artifact server at http://localhost:5834 is gone");
    expect(g.names()).toEqual([]);
    expect(g.guide()).toBe("r to refresh");
    g.press("r");
    await g.shows("Page 1");
    expect(g.text()).not.toContain("is gone");
  });
  test("G11 an empty store says how a page gets there, and the Status tab is reachable", async () => {
    const w = ticking();
    const p = await open(w);
    expect(p.text()).toMatch(/No artifacts yet.*artifact tool/);
    p.press("/", "d", KEYS.enter);
    expect(p.guide()).toBe("r to refresh");
    p.press(KEYS.shiftTab);
    await p.shows(w.origin());
    expect(p.text()).not.toContain("No artifacts yet");
  });
});

describe("G12 the Status tab", () => {
  test("G12 it reads the live server and this session's settings", async () => {
    const { a, b } = twoSessions();
    // A reply nobody is woken by stays pending: that is the reply the tab counts.
    const capped = wire({
      session: "session-C",
      config: { wakesPerHour: 0, autoOpen: false },
      share: { cwd: a.cwd, trashDir: a.trashDir, backend: a.backend },
    });
    await publish(a, "plan.html", "Plan");
    await publish(capped, "survey.html", "Survey");
    await connect(a);
    await connect(capped);
    expect((await capped.pageRespond("survey", 1, { x: 1 })).status).toBe(200);
    await b.api("/artifacts/plan/pin", { method: "POST", body: "{}" });
    const p = await open(capped);
    p.press(KEYS.shiftTab);
    await p.shows("Server");
    expect(p.statusLabels()).toEqual(STATUS_LABELS);
    expect(p.status("Server")).toContain(`${a.origin()} · pid ${process.pid} · up `);
    expect(p.status("Code")).toBe("current");
    expect(p.status("Store")).toBe(a.storeRoot);
    expect(p.status("Isolation")).toMatch(
      new RegExp(`^origin .*<slug>\\.localhost:${a.backend.server.port}$`),
    );
    expect(p.status("Sessions")).toBe("2 connected · this one session- is connected");
    expect(p.status("Artifacts")).toBe("2 · 1 this session · 1 pinned · 1 reply waiting");
    expect(p.status("Delivery")).toMatch(/^wake · cap 0 /);
    expect(p.status("Retention")).toMatch(/^14 days /);
    expect(p.status("Settings")).toBe("autoOpen off · keepAlive on · ask timeout 600 s");
    expect(p.status("Logs")).toMatch(/^\.pi\/artifacts\/logs\/\d{4}-\d{2}-\d{2}\/$/);
  });
  test("G12 sandbox isolation reads as what it is", async () => {
    const w = ticking({ isolation: "sandbox" });
    const p = await open(w, "status");
    expect(p.status("Isolation")).toMatch(/^sandbox /);
    expect(p.status("Isolation")).not.toContain("<slug>");
  });
  test("G12 r reads again", async () => {
    const w = ticking();
    const p = await open(w, "status");
    expect(p.status("Artifacts")).toMatch(/^0 · 0 this session/);
    await publish(w, "plan.html", "Plan");
    p.press("r");
    await until(() => p.status("Artifacts").startsWith("1 · 1 this session"), "the new count");
  });
  test("G12 no line carries the session token, the viewer secret, or a tokened URL", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    await connect(w);
    const p = await open(w, "status");
    const drawn = p.panel.render(WIDTH).join("\n");
    expect(drawn).toContain(w.origin());
    for (const secret of [w.backend.token, w.backend.viewer, "?t="])
      expect(drawn).not.toContain(secret);
  });
  test("G12 a server that does not answer is one warning row with the reason, over what starts it", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    w.backend.server.stop();
    const p = await open(w, "status", { theme: WARN });
    expect(p.statusLabels()).toEqual(["Server"]);
    expect(p.status("Server")).toMatch(/^<warn>not reachable — .*did not answer/);
    expect(p.text()).toMatch(/next publish or session start/);
    expect(p.text()).toContain("/artifacts restart");
    p.press(KEYS.tab);
    expect(p.text()).toMatch(/did not answer/);
  });
  test("G12 code older than its source, and a session that is not connected, are warnings; current and connected are not", async () => {
    const started = Date.parse(statusFacts().server.startedAt);
    const fine = mount([], { warn: mark("warn"), status: async () => statusFacts() });
    const wrong = mount([], {
      warn: mark("warn"),
      status: async () => statusFacts({ codeChangedAt: started + 1 }, { sessions: ["other"] }),
    });
    for (const g of [fine, wrong]) {
      await g.gallery.refresh();
      g.press(KEYS.shiftTab);
      await g.shows("Server");
    }
    expect(fine.text()).not.toContain("<warn>");
    expect(fine.status("Server")).toContain("up 2h 14m");
    expect(wrong.status("Code")).toMatch(/^<warn>older than its source.*next session start/);
    expect(wrong.status("Sessions")).toMatch(/^<warn>1 connected .* is not connected/);
  });
  test("G12 a store in the home directory is shown under ~; any other is shown whole", async () => {
    const home = mount([], { status: async () => statusFacts() });
    const elsewhere = mount([], {
      status: async () => statusFacts({}, { root: "/srv/project/.pi/artifacts" }),
    });
    for (const g of [home, elsewhere]) {
      await g.gallery.refresh();
      g.press(KEYS.shiftTab);
      await g.shows("Server");
    }
    expect(home.status("Store")).toBe("~/project/.pi/artifacts");
    expect(elsewhere.status("Store")).toBe("/srv/project/.pi/artifacts");
  });
});

describe("G13 /artifacts status, and /artifacts without a UI", () => {
  test("G13 /artifacts status opens on the Status tab; /artifacts opens on All", async () => {
    const w = ticking();
    await publish(w, "plan.html", "Plan");
    const status = await open(w, "status");
    expect(status.tabLine()).toContain("[◍ Status]");
    expect(status.status("Server")).toContain(w.origin());
    expect(status.guide()).toBe(GUIDE.status);
    status.press(KEYS.esc);
    const list = await open(w);
    expect(list.tabLine()).toContain("[All 1]");
    expect(list.status("Server")).toBe("");
  });
  test("G13 without a UI the rows are printed, and no secret with them", async () => {
    const w = ticking({ hasUI: false });
    await publish(w, "plan.html", "Plan");
    await connect(w);
    await w.fake.commands.get("artifacts")?.handler("status", w.ctx.ctx);
    const printed = w.ctx.notifications.at(-1);
    expect(printed?.type).toBe("info");
    const rows = printed?.message.split("\n") ?? [];
    expect(rows.map((row) => row.split(/\s+/)[0])).toEqual(STATUS_LABELS);
    expect(rows[0]).toContain(`${w.origin()} · pid ${process.pid}`);
    expect(rows[5]).toMatch(/1 · 1 this session · 0 pinned/);
    for (const secret of [w.backend.token, w.backend.viewer, "?t="])
      expect(printed?.message).not.toContain(secret);
  });
  test("G13 without a UI a server that does not answer is a warning with what starts it", async () => {
    const w = ticking({ hasUI: false });
    w.backend.server.stop();
    await w.fake.commands.get("artifacts")?.handler("status", w.ctx.ctx);
    const printed = w.ctx.notifications.at(-1);
    expect(printed?.type).toBe("warning");
    expect(printed?.message).toMatch(/not reachable — .*did not answer/);
    expect(printed?.message).toContain("/artifacts restart");
  });
  test("G13 without a UI /artifacts prints the list", async () => {
    const w = ticking({ hasUI: false });
    await w.fake.commands.get("artifacts")?.handler("", w.ctx.ctx);
    expect(w.ctx.notifications.at(-1)?.message).toMatch(/No artifacts yet/);
    await publish(w, "plan.html", "Plan");
    await w.fake.commands.get("artifacts")?.handler("", w.ctx.ctx);
    expect(w.ctx.notifications.at(-1)?.message).toMatch(/^plan — Plan \(v1/);
  });
});
