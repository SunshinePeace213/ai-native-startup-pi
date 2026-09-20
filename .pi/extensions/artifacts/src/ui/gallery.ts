// /artifacts with a UI: Claude Code's Artifacts dialog, plus a Status tab.
//
//   Artifacts
//
//   ╭──────────────────────────────────────────────────────────────────────────╮
//   │ ⌕ Search artifacts…                                                      │
//   ╰──────────────────────────────────────────────────────────────────────────╯
//
//     All 7   ⧉ This session 2   ↳ Other sessions 5   ★ Pinned 1   ◍ Status
//
//     ↑ 2 more above
//   ❯ ⧉ ★ Pricing plan  attached · v2 · 1 reply · 3h ago
//     ↳ Roadmap  1 reply waiting · v1 · 2w ago
//     ↓ 3 more below
//
//   Copied http://localhost:5834/a/roadmap
//
//   Enter to attach · x to dismiss · c to copy url · Ctrl+R to rename · d to delete
//   p to unpin · / to search · r to refresh
//
// The line under the list is the last notice, or what is being asked: `Move
// **Roadmap** to the Trash? Its URL stops working.` after d, `Rename artifact:`
// over a field after ctrl+r. Loading, a failed load and an empty store each
// stand where the list would. The Status tab stands there too:
//
//    Server      http://localhost:5834 · pid 8387 · up 2h 14m
//    Code        current
//    Store       ~/project/.pi/artifacts
//    …
//
//    /artifacts restart · /artifacts stop · /artifacts sweep
//
// The words and the keys are Claude Code's: the tab labels, the guide (which
// names only what the selected row allows), the notices, ↑ on the first row
// moving into the search box, the window of rows the terminal's height leaves.
// Two nouns differ because they are what is true here: "This session" is what
// this session published or attached (Claude Code: "Created by me"), and a
// delete moves the folder to the Trash. `w` — wakes off and on — is pi's own
// and, like `o`, works without being advertised. The Status tab is the one
// addition: what the server says of itself and this session's settings, never
// a secret. Where the terminal is narrower than the tabs, the guide, a notice
// or a Status value, that line runs on to the next, as Claude Code's does; only
// a row of the list is cut to the width.
//
// Keys in, lines out: whatever touches the server or this session goes
// through `load`, `status` and `act`, so the panel runs without a terminal. On
// pi's fullscreen screen a left click on a tab selects it; in regular mode no
// application sees the mouse.

import {
  type Component,
  type Focusable,
  Input,
  type KeyId,
  matchesKey,
  truncateToWidth,
  type TuiMouseEvent,
  type TuiMouseEventResult,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";

import { terminalSafe } from "../domain/text";
import { type Config, type Manifest, MAX_TITLE, type ServerStatus } from "../domain/types";
import { versionLabel } from "../domain/versioning";

export type GalleryAction =
  "attach" | "open" | "copy" | "dismiss" | "pin" | "watch" | "rename" | "delete";

export interface GalleryPaint {
  accent(text: string): string;
  dim(text: string): string;
  warn(text: string): string;
  bold(text: string): string;
  italic(text: string): string;
  /** The current tab. */
  selected(text: string): string;
}

export interface GalleryOptions {
  session: string;
  /** The tab the panel opens on; default: all. */
  tab?: "all" | "status";
  load: () => Promise<Manifest[]>;
  /** What the Status tab reports; rejects with the reason when the server cannot be reached. */
  status: () => Promise<StatusFacts>;
  /** Whether this session's footer strip holds the page. */
  attached: (slug: string) => boolean;
  /** The page's address as the panel names it: never the tokened one. */
  url: (slug: string) => string;
  /**
   * Does it, and rejects with the reason when it could not; `title` is the new
   * name of a rename. Resolves to the manifest the server answered with, if any.
   */
  act: (action: GalleryAction, manifest: Manifest, title?: string) => Promise<Manifest | void>;
  done: () => void;
  requestRender: () => void;
  paint: GalleryPaint;
  /** The terminal's height: the list's window is cut to it. */
  terminalRows: () => number;
  now?: () => Date;
}

// ---- the Status tab's report ---------------------------------------------------

export interface StatusFacts {
  server: ServerStatus;
  /** How many of the store's artifacts this session published or attached. */
  mine: number;
  session: string;
  config: Config;
  /** When the server's source last changed (ms): a server started before that runs older code. */
  codeChangedAt: number;
  /** Today's log folder, as it reads from the project. */
  logs: string;
  /** The home directory: a path under it is shown with `~`. */
  home: string;
}

export interface StatusRow {
  label: string;
  value: string;
  /** A problem: the value is drawn in the warning colour. */
  warn?: boolean;
}

export interface StatusReport {
  rows: StatusRow[];
  /** What to do about a problem, under the rows. */
  note?: string;
}

const LABEL_WIDTH = 12;
const STATUS_COMMANDS = "/artifacts restart · /artifacts stop · /artifacts sweep";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const onOff = (flag: boolean) => (flag ? "on" : "off");

function uptime(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function tilde(path: string, home: string): string {
  const rest = home && path.startsWith(home) ? path.slice(home.length) : null;
  return rest !== null && (rest === "" || /^[\\/]/.test(rest)) ? `~${rest}` : path;
}

/** The Status tab's rows; `/artifacts status` without a UI prints the same ones. */
export function statusReport(facts: StatusFacts, now: Date): StatusReport {
  const { server, config } = facts;
  const connected = server.sessions.includes(facts.session);
  const current = facts.codeChangedAt <= Date.parse(server.startedAt);
  return {
    rows: [
      {
        label: "Server",
        value: `${server.origin} · pid ${server.pid} · up ${uptime(now.getTime() - Date.parse(server.startedAt))}`,
      },
      current
        ? { label: "Code", value: "current" }
        : {
            label: "Code",
            value: "older than its source — replaced at the next session start",
            warn: true,
          },
      { label: "Store", value: tilde(server.root, facts.home) },
      {
        label: "Isolation",
        value:
          server.isolation === "origin"
            ? `origin — each page on <slug>.localhost:${server.port}`
            : `sandbox — each page framed on localhost:${server.port} with an opaque origin`,
      },
      {
        label: "Sessions",
        value: `${server.sessions.length} connected · this one ${facts.session.slice(0, 8)} is ${connected ? "connected" : "not connected"}`,
        warn: !connected,
      },
      {
        label: "Artifacts",
        value: [
          server.artifacts.total,
          `${facts.mine} this session`,
          `${server.artifacts.pinned} pinned`,
          `${plural(server.artifacts.pending, "reply", "replies")} waiting`,
        ].join(" · "),
      },
      {
        label: "Delivery",
        value: `${config.delivery} · cap ${config.wakesPerHour} wakes per page per hour`,
      },
      {
        label: "Retention",
        value: `${plural(server.retentionDays, "day", "days")} idle, then the Trash · pinned pages are kept`,
      },
      {
        label: "Settings",
        value: `autoOpen ${onOff(config.autoOpen)} · keepAlive ${onOff(config.keepAlive)} · ask timeout ${config.askTimeoutSeconds} s`,
      },
      { label: "Logs", value: facts.logs },
    ],
  };
}

/** What the Status tab says instead when the server did not answer. */
export function unreachableReport(reason: string): StatusReport {
  return {
    rows: [{ label: "Server", value: `not reachable — ${reason}`, warn: true }],
    note: "It starts with the next publish or session start, or now with /artifacts restart.",
  };
}

export function statusText(report: StatusReport): string {
  return [
    ...report.rows.map((row) => `${row.label.padEnd(LABEL_WIDTH)}${row.value}`),
    ...(report.note ? [report.note] : []),
  ].join("\n");
}

// ---- the panel -----------------------------------------------------------------

const TABS = ["all", "mine", "others", "pinned", "status"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  all: "All",
  mine: "⧉ This session",
  others: "↳ Other sessions",
  pinned: "★ Pinned",
  status: "◍ Status",
};

type Mode =
  | { kind: "list" }
  | { kind: "rename"; manifest: Manifest; title: string; field: Input }
  | { kind: "confirm"; manifest: Manifest };

const LIST: Mode = { kind: "list" };

/** Claude Code's dialog spends twelve lines around its list and never shows more than twenty rows. */
const CHROME_ROWS = 12;
const MAX_ROWS = 20;
const MIN_ROWS = 3;
const NAME_MAX = 50;

const UNITS: Array<[label: string, seconds: number]> = [
  ["y", 365 * 86400],
  ["mo", 30 * 86400],
  ["w", 7 * 86400],
  ["d", 86400],
  ["h", 3600],
  ["m", 60],
];

/** `3h ago`, `2w ago`; `now` under a minute. */
function ago(iso: string, now: Date): string {
  const seconds = Math.max(0, (now.getTime() - Date.parse(iso)) / 1000);
  for (const [label, size] of UNITS) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "now";
}

const clamp = (n: number, low: number, high: number) => Math.min(Math.max(n, low), high);

/** A title is the model's text: nothing of it reaches a line unfiltered. */
const nameOf = (m: Manifest, max = MAX_TITLE) => terminalSafe(m.title, max) || m.slug;

const pinnedThenNewest = (a: Manifest, b: Manifest) =>
  Number(b.pinned) - Number(a.pinned) ||
  (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0);

/** A reason, a path or a notice runs on to the next line: what the panel reports is never cut. */
const wrapped = (text: string, width: number) =>
  wrapTextWithAnsi(terminalSafe(text, 600), Math.max(20, width));

/** The guide's entries on as few lines as the width allows, never cut mid-entry. */
function wrapGuide(entries: string[], width: number): string[] {
  const lines: string[] = [];
  for (const entry of entries) {
    const joined = `${lines.at(-1)} · ${entry}`;
    if (lines.length && visibleWidth(joined) <= width) lines[lines.length - 1] = joined;
    else lines.push(entry);
  }
  return lines;
}

export class Gallery implements Component, Focusable {
  /** Set by pi's TUI: the field being typed in places the hardware cursor while the panel has focus. */
  focused = false;
  private all: Manifest[] = [];
  private loading = true;
  private error: string | null = null;
  private tab: Tab;
  private index = 0;
  private searching = false;
  private mode: Mode = LIST;
  /** An action is on its way to the server: another one waits for it. */
  private busy = false;
  private notice = "";
  private report: StatusReport | null = null;
  private readonly search: Input;
  /** Where each tab was last drawn, for a click to land on. */
  private tabHits: Array<{ tab: Tab; line: number; from: number; to: number }> = [];
  private readonly now: () => Date;

  constructor(private readonly options: GalleryOptions) {
    this.now = options.now ?? (() => new Date());
    this.tab = options.tab ?? "all";
    this.search = new Input({
      prompt: "⌕ ",
      placeholder: "Search artifacts…",
      placeholderStyle: options.paint.dim,
    });
  }

  // ---- data --------------------------------------------------------------------

  /** Reads the list again — and the status, on that tab — showing that it is loading. */
  async refresh(): Promise<void> {
    this.notice = "";
    this.loading = true;
    this.options.requestRender();
    if (this.tab === "status") void this.readStatus();
    await this.reload();
  }

  /** Reads the list again, keeping the selection on the same page when it is still there. */
  private async reload(): Promise<void> {
    const slug = this.current()?.slug;
    try {
      this.all = await this.options.load();
      this.error = null;
    } catch (e) {
      this.error = (e as Error).message;
    }
    this.loading = false;
    const rows = this.visible();
    const at = rows.findIndex((m) => m.slug === slug);
    this.index = at >= 0 ? at : clamp(this.index, 0, Math.max(0, rows.length - 1));
    this.options.requestRender();
  }

  private async readStatus(): Promise<void> {
    this.report = null;
    this.report = await this.options.status().then(
      (facts) => statusReport(facts, this.now()),
      (e: Error) => unreachableReport(e.message),
    );
    this.options.requestRender();
  }

  private mine(m: Manifest): boolean {
    return m.owner === this.options.session || m.sessions.includes(this.options.session);
  }

  /** Every page the search keeps: a case-insensitive substring of its title, slug or description. */
  private filtered(): Manifest[] {
    const query = this.search.getValue().toLowerCase();
    const kept = query
      ? this.all.filter((m) =>
          [m.title, m.slug, m.description ?? ""].some((text) => text.toLowerCase().includes(query)),
        )
      : this.all;
    return [...kept].sort(pinnedThenNewest);
  }

  private inTab(tab: Tab, rows: Manifest[]): Manifest[] {
    if (tab === "all") return rows;
    if (tab === "status") return [];
    if (tab === "pinned") return rows.filter((m) => m.pinned);
    return rows.filter((m) => this.mine(m) === (tab === "mine"));
  }

  /** Pinned is a tab only while something is pinned, or while it is the one being looked at. */
  private tabs(): Tab[] {
    const pinned = this.tab === "pinned" || this.all.some((m) => m.pinned);
    return TABS.filter((tab) => tab !== "pinned" || pinned);
  }

  private visible(): Manifest[] {
    return this.inTab(this.tab, this.filtered());
  }

  /** There is a list to act on: loaded, and not empty. */
  private listed(): boolean {
    return !this.loading && this.error === null && this.all.length > 0;
  }

  private current(): Manifest | undefined {
    return this.listed() ? this.visible()[this.index] : undefined;
  }

  // ---- keys --------------------------------------------------------------------

  handleInput(data: string): void {
    const key = (id: KeyId) => matchesKey(data, id);
    if (this.mode.kind === "confirm") return this.confirmKey(key, this.mode.manifest);
    if (this.mode.kind === "rename") return this.renameKey(data, key, this.mode);
    if (this.searching) return this.searchKey(data, key);
    if (key("escape")) return this.options.done();
    if (key("tab") || key("right")) return this.cycleTab(1);
    if (key("shift+tab") || key("left")) return this.cycleTab(-1);
    if (key("r")) {
      if (!this.loading && !this.busy) void this.refresh();
      return;
    }
    if (this.tab === "status" || !this.listed()) return;
    if (key("/")) return this.focusSearch();
    if (key("up")) return this.index === 0 ? this.focusSearch() : this.select(this.index - 1);
    if (key("down")) return this.select(this.index + 1);
    const m = this.current();
    if (!m || this.busy) return;
    const name = nameOf(m);
    const url = this.options.url(m.slug);
    if (key("enter")) {
      return void this.run("attach", m, {
        during: `Attaching ${name}…`,
        done: () => "",
        failed: "The artifact could not be attached. Select it and press Enter to try again.",
      }).then((attached) => attached && this.options.done());
    }
    if (key("o")) {
      return void this.run("open", m, {
        done: () => `Opened ${url}`,
        failed: `Couldn't open a browser — press c to copy ${url}`,
      });
    }
    if (key("c")) return void this.run("copy", m, { done: () => `Copied ${url}` });
    if (key("x")) {
      if (!this.options.attached(m.slug)) return;
      return void this.run("dismiss", m, {
        done: () => `Dismissed ${name} from this session's list`,
      });
    }
    if (key("p")) {
      return void this.run(
        "pin",
        m,
        { done: () => `${m.pinned ? "Unpinned" : "Pinned"} ${name}` },
        { reload: true },
      );
    }
    if (key("w")) {
      return void this.run(
        "watch",
        m,
        {
          done: () =>
            m.watched
              ? `"${name}" no longer wakes a session; its sends are still stored.`
              : `"${name}" wakes this session again.`,
        },
        { reload: true },
      );
    }
    if (key("ctrl+r")) return this.startRename(m);
    if (key("d")) {
      this.notice = "";
      this.mode = { kind: "confirm", manifest: m };
    }
  }

  private confirmKey(key: (id: KeyId) => boolean, m: Manifest): void {
    if (key("n") || key("escape")) this.mode = LIST;
    if (!key("y")) return;
    this.mode = LIST;
    void this.run(
      "delete",
      m,
      { during: "Deleting…", done: () => "Artifact deleted" },
      { reload: true },
    );
  }

  private startRename(m: Manifest): void {
    const title = terminalSafe(m.title, MAX_TITLE);
    const field = new Input({
      prompt: "",
      placeholder: "New name",
      placeholderStyle: this.options.paint.dim,
    });
    // Typed in rather than set, so the cursor stands after the name, where Claude Code puts it.
    if (title) field.handleInput(title);
    this.notice = "";
    this.mode = { kind: "rename", manifest: m, title, field };
  }

  private renameKey(
    data: string,
    key: (id: KeyId) => boolean,
    mode: Extract<Mode, { kind: "rename" }>,
  ): void {
    if (key("escape")) {
      this.mode = LIST;
      return;
    }
    if (!key("enter")) return mode.field.handleInput(data);
    const title = mode.field.getValue().trim();
    this.mode = LIST;
    if (!title || title === mode.title) return;
    void this.run(
      "rename",
      mode.manifest,
      {
        during: "Renaming…",
        // The server's word for the name: it is the one that trims it.
        done: (renamed) => `Renamed to ${renamed ? nameOf(renamed) : title}`,
      },
      { title, reload: true },
    );
  }

  /** Claude Code's search field: enter or ↓ goes back to the list, esc empties the box before it leaves it. */
  private searchKey(data: string, key: (id: KeyId) => boolean): void {
    const empty = this.search.getValue() === "";
    if (key("enter") || key("down") || ((key("escape") || key("backspace")) && empty)) {
      this.searching = false;
      this.index = 0;
      return;
    }
    if (key("escape")) this.search.setValue("");
    else if (!key("up") && !key("tab") && !key("shift+tab")) this.search.handleInput(data);
    this.index = clamp(this.index, 0, Math.max(0, this.visible().length - 1));
  }

  private focusSearch(): void {
    this.notice = "";
    this.searching = true;
  }

  private select(index: number): void {
    this.notice = "";
    this.index = clamp(index, 0, Math.max(0, this.visible().length - 1));
  }

  private cycleTab(delta: number): void {
    const tabs = this.tabs();
    this.selectTab(tabs[(tabs.indexOf(this.tab) + delta + tabs.length) % tabs.length] as Tab);
  }

  private selectTab(tab: Tab): void {
    this.notice = "";
    this.index = 0;
    this.tab = tab;
    if (tab !== "status") return;
    this.searching = false;
    void this.readStatus();
  }

  /** One action against the server or this session; the notice is its outcome, or why it failed. */
  private async run(
    action: GalleryAction,
    m: Manifest,
    words: { during?: string; done: (result: Manifest | void) => string; failed?: string },
    options: { title?: string; reload?: boolean } = {},
  ): Promise<boolean> {
    this.busy = true;
    this.notice = words.during ?? "";
    this.options.requestRender();
    let ok = true;
    let outcome: string;
    try {
      outcome = words.done(await this.options.act(action, m, options.title));
    } catch (e) {
      ok = false;
      outcome = words.failed ?? (e as Error).message;
    }
    // The outcome is said once the list shows it: never "deleted" beside the row it names.
    if (options.reload) await this.reload();
    this.busy = false;
    this.notice = outcome;
    this.options.requestRender();
    return ok;
  }

  // ---- mouse -------------------------------------------------------------------

  /** Reaches the panel on pi's fullscreen screen only: a left click on a tab selects it. */
  handleMouse(event: TuiMouseEvent): TuiMouseEventResult | undefined {
    if (event.button !== "left" || this.mode.kind !== "list") return undefined;
    if (event.type !== "press" && event.type !== "click") return undefined;
    const hit = this.tabHits.find(
      (span) => span.line === event.y && event.x >= span.from && event.x < span.to,
    );
    if (!hit) return undefined;
    // The press is claimed so pi starts no text selection there; the click is what selects.
    if (event.type === "click") this.selectTab(hit.tab);
    return { handled: true };
  }

  // ---- lines -------------------------------------------------------------------

  private searchBox(width: number): string[] {
    const { paint } = this.options;
    const inner = Math.max(10, width - 4);
    const edge = this.searching ? paint.accent : paint.dim;
    this.search.focused = this.focused && this.searching;
    let text = this.search.render(inner)[0] ?? "";
    if (!this.searching) {
      const shown = truncateToWidth(`⌕ ${this.search.getValue() || "Search artifacts…"}`, inner);
      text = `${paint.dim(shown)}${" ".repeat(Math.max(0, inner - visibleWidth(shown)))}`;
    }
    return [
      edge(`╭${"─".repeat(inner + 2)}╮`),
      `${edge("│")} ${text} ${edge("│")}`,
      edge(`╰${"─".repeat(inner + 2)}╯`),
    ];
  }

  /**
   * The tabs with their counts, from line `top` of the panel: a space before each, and on
   * to a next line where the width ends, so none is cut. Remembers where each was drawn.
   */
  private tabBar(top: number, width: number): string[] {
    const rows = this.filtered();
    const lines: string[] = [];
    let column = 0;
    this.tabHits = [];
    for (const tab of this.tabs()) {
      const label = TAB_LABEL[tab];
      const text = tab === "status" ? ` ${label} ` : ` ${label} ${this.inTab(tab, rows).length} `;
      if (!lines.length || (column > 0 && column + 1 + visibleWidth(text) > width)) {
        lines.push("");
        column = 0;
      }
      const from = column + 1;
      column = from + visibleWidth(text);
      this.tabHits.push({ tab, line: top + lines.length - 1, from, to: column });
      lines[lines.length - 1] += ` ${tab === this.tab ? this.options.paint.selected(text) : text}`;
    }
    return lines;
  }

  private row(m: Manifest, selected: boolean): string {
    const { paint } = this.options;
    const tint = selected ? paint.accent : (text: string) => text;
    const facts = [
      this.options.attached(m.slug) ? "attached" : "",
      m.pending.length ? `${plural(m.pending.length, "reply", "replies")} waiting` : "",
      m.watched ? "" : "unwatched",
      versionLabel(m),
      ago(m.updatedAt, this.now()),
    ].filter(Boolean);
    const icon = this.mine(m) ? paint.accent("⧉") : tint("↳");
    const star = m.pinned ? paint.warn("★ ") : "";
    return `${selected ? "❯ " : "  "}${icon} ${star}${tint(nameOf(m, NAME_MAX))}${paint.dim(`  ${facts.join(" · ")}`)}`;
  }

  private emptyText(): string {
    const query = terminalSafe(this.search.getValue(), 200);
    if (query) {
      if (this.tab === "mine") return `No artifacts from this session match "${query}"`;
      if (this.tab === "others") return `No artifacts from other sessions match "${query}"`;
      if (this.tab === "pinned") return `No pinned artifacts match "${query}"`;
      return `No artifacts match "${query}"`;
    }
    if (this.tab === "others") return "Nothing from other sessions yet.";
    if (this.tab === "pinned") return "Nothing pinned yet. Press p on an artifact to pin it.";
    return "Nothing from this session yet.";
  }

  private listLines(width: number): string[] {
    const { paint } = this.options;
    if (this.loading) return [paint.dim("Loading artifacts…")];
    if (this.error !== null) return wrapped(this.error, width).map(paint.warn);
    if (!this.all.length)
      return [paint.dim("No artifacts yet. Publish one with the artifact tool.")];
    const rows = this.visible();
    if (!rows.length) return [paint.dim(paint.italic(this.emptyText()))];
    const size = clamp(
      Math.min(this.options.terminalRows() - CHROME_ROWS, MAX_ROWS),
      MIN_ROWS,
      Math.max(MIN_ROWS, rows.length),
    );
    // Claude Code's window: the selection is its last row once it has moved past the first screen.
    const first = clamp(this.index - size + 1, 0, Math.max(0, rows.length - size));
    const shown = rows.slice(first, first + size);
    const below = rows.length - first - shown.length;
    return [
      ...(first > 0 ? [paint.dim(`  ↑ ${first} more above`)] : []),
      ...shown.map((m, i) => this.row(m, !this.searching && first + i === this.index)),
      ...(below > 0 ? [paint.dim(`  ↓ ${below} more below`)] : []),
    ];
  }

  private statusLines(width: number): string[] {
    const { paint } = this.options;
    if (!this.report) return [paint.dim("Loading status…")];
    return [
      ...this.report.rows.flatMap((row) =>
        wrapped(row.value, width - LABEL_WIDTH - 1).map((value, i) => {
          const label =
            i === 0 ? paint.dim(row.label.padEnd(LABEL_WIDTH)) : " ".repeat(LABEL_WIDTH);
          return ` ${label}${row.warn ? paint.warn(value) : value}`;
        }),
      ),
      ...(this.report.note
        ? ["", ...wrapped(this.report.note, width - 1).map((line) => paint.dim(` ${line}`))]
        : []),
      "",
      paint.dim(` ${STATUS_COMMANDS}`),
    ];
  }

  /** What is being asked under the list, or the last notice. */
  private promptLines(width: number): string[] {
    const { paint } = this.options;
    if (this.tab === "status") return [];
    if (this.mode.kind === "confirm") {
      const asked = `Move ${paint.bold(nameOf(this.mode.manifest))} to the Trash? Its URL stops working.`;
      return ["", ...wrapTextWithAnsi(asked, Math.max(20, width))];
    }
    if (this.mode.kind === "rename") {
      this.mode.field.focused = this.focused;
      return [
        "",
        paint.bold("Rename artifact:"),
        ...this.mode.field.render(Math.max(20, width - 8)),
      ];
    }
    return this.notice ? ["", ...wrapped(this.notice, width).map(paint.dim)] : [];
  }

  /** Claude Code's guide: only what the selected row allows is named. */
  private guide(): string[] {
    if (this.mode.kind === "confirm") return ["y to delete", "n to keep"];
    if (this.mode.kind === "rename") return ["Enter to save", "Esc to cancel"];
    if (this.searching) return ["Type to filter", "Enter/↓ to list", "Esc to clear"];
    if (this.tab === "status") return ["Tab to switch", "r to refresh"];
    const m = this.current();
    const onRow = m
      ? [
          "Enter to attach",
          ...(this.options.attached(m.slug) ? ["x to dismiss"] : []),
          "c to copy url",
          "Ctrl+R to rename",
          "d to delete",
          m.pinned ? "p to unpin" : "p to pin",
        ]
      : [];
    return [
      ...onRow,
      ...(this.listed() ? ["/ to search"] : []),
      ...(this.loading ? [] : ["r to refresh"]),
    ];
  }

  render(width: number): string[] {
    const { paint } = this.options;
    const head = [paint.bold(paint.accent("Artifacts")), "", ...this.searchBox(width), ""];
    const lines = [
      ...head,
      ...this.tabBar(head.length, width),
      "",
      ...(this.tab === "status" ? this.statusLines(width) : this.listLines(width)),
      ...this.promptLines(width),
      "",
      ...wrapGuide(this.guide(), width).map((line) => paint.dim(paint.italic(line))),
    ];
    return lines.map((line) => truncateToWidth(line, width));
  }

  invalidate(): void {}
}
