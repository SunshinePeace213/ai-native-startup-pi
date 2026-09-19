// /artifacts with a UI: every page in the project, as Claude Code lists them.
//
//   Artifacts
//   ╭──────────────────────────────────────────────╮
//   │ ⌕ Search artifacts…                          │
//   ╰──────────────────────────────────────────────╯
//    All 7   ⧉ This session 2   ↳ Other sessions 5
//   ❯ ⧉ Pricing plan  v2 · pinned · 1 pending · 3h ago
//     ⧉ Roadmap  v1 · 2w ago
//     ↓ 5 more below
//   Enter to attach · o to open · c to copy url · p to pin · w to watch · …
//
// "This session" is what the session published or attached; attaching is how
// a session takes a page over, so the same file republishes it in place. The
// component is pure over its state: keys in, lines out, and everything that
// touches the server goes through `act`, so it is testable without a terminal.

import { fuzzyFilter, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import { terminalSafe } from "../domain/text";
import type { Manifest } from "../domain/types";
import { versionLabel } from "../domain/versioning";
import type { KeyMatcher } from "./selector";

export type GalleryAction = "attach" | "open" | "copy" | "pin" | "watch" | "delete";

export interface GalleryPaint {
  accent(text: string): string;
  dim(text: string): string;
  warn(text: string): string;
  bold(text: string): string;
  /** The active tab. */
  selected(text: string): string;
}

export interface GalleryOptions {
  session: string;
  load: () => Promise<Manifest[]>;
  /** Runs the action; resolves to the line to show under the list, if any. */
  act: (action: GalleryAction, manifest: Manifest) => Promise<string | void>;
  done: () => void;
  requestRender: () => void;
  paint: GalleryPaint;
  matches: KeyMatcher;
  now?: () => Date;
  /** Rows of the list shown at once. */
  rows?: number;
}

const TABS = ["all", "mine", "others"] as const;
type Tab = (typeof TABS)[number];

const HINT =
  "Enter to attach · o to open · c to copy url · p to pin · w to watch · d to delete · / to search · r to refresh";

const UNITS: Array<[label: string, seconds: number]> = [
  ["y", 365 * 86400],
  ["mo", 30 * 86400],
  ["w", 7 * 86400],
  ["d", 86400],
  ["h", 3600],
  ["m", 60],
];

/** `3h ago`, `2w ago`; `now` under a minute. */
export function ago(iso: string, now: Date): string {
  const seconds = Math.max(0, (now.getTime() - Date.parse(iso)) / 1000);
  for (const [label, size] of UNITS) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "now";
}

export class Gallery {
  private all: Manifest[] = [];
  private tab: Tab = "all";
  private query = "";
  private searching = false;
  private index = 0;
  /** The first row of the list on screen; it follows the selection. */
  private top = 0;
  private confirming: Manifest | null = null;
  private notice = "";
  private readonly now: () => Date;
  private readonly rows: number;

  constructor(private readonly options: GalleryOptions) {
    this.now = options.now ?? (() => new Date());
    this.rows = options.rows ?? 20;
  }

  /** Reads the list again, keeping the selection on the same page when it is still there. */
  async refresh(): Promise<void> {
    const slug = this.current()?.slug;
    this.all = await this.options.load();
    const at = this.visible().findIndex((m) => m.slug === slug);
    this.index = at >= 0 ? at : Math.min(this.index, Math.max(0, this.visible().length - 1));
    this.options.requestRender();
  }

  private mine(m: Manifest): boolean {
    return m.owner === this.options.session || m.sessions.includes(this.options.session);
  }

  private inTab(tab: Tab): Manifest[] {
    if (tab === "all") return this.all;
    return this.all.filter((m) => this.mine(m) === (tab === "mine"));
  }

  /** The tab's pages: best match first while searching, else pinned first then newest. */
  visible(): Manifest[] {
    const rows = this.inTab(this.tab);
    if (this.query.trim()) return fuzzyFilter(rows, this.query, (m) => `${m.title} ${m.slug}`);
    return [...rows].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || (a.updatedAt < b.updatedAt ? 1 : -1),
    );
  }

  current(): Manifest | undefined {
    return this.visible()[this.index];
  }

  private move(delta: number): void {
    const n = this.visible().length;
    if (n) this.index = (this.index + delta + n) % n;
  }

  private setTab(delta: number): void {
    this.tab = TABS[(TABS.indexOf(this.tab) + delta + TABS.length) % TABS.length] as Tab;
    this.index = 0;
  }

  private async run(action: GalleryAction, m: Manifest): Promise<void> {
    try {
      this.notice = (await this.options.act(action, m)) ?? "";
    } catch (e) {
      this.notice = (e as Error).message;
      return this.options.requestRender();
    }
    if (action === "attach") return this.options.done();
    if (action === "pin" || action === "watch" || action === "delete") return this.refresh();
    this.options.requestRender();
  }

  handleInput(data: string): void {
    const { matches } = this.options;
    if (this.confirming) {
      const m = this.confirming;
      this.confirming = null;
      if (matches(data, "y")) void this.run("delete", m);
      return;
    }
    this.notice = "";
    if (this.searching) {
      if (matches(data, "escape")) {
        this.query = "";
        this.searching = false;
      } else if (matches(data, "return") || matches(data, "down") || matches(data, "up")) {
        this.searching = false;
      } else if (matches(data, "backspace")) {
        this.query = this.query.slice(0, -1);
      } else if (data.length === 1 && data >= " " && data !== "\x7f") {
        this.query += data;
      }
      this.index = 0;
      return;
    }
    if (matches(data, "escape") || matches(data, "q")) {
      if (!this.query) return this.options.done();
      this.query = "";
      this.index = 0;
      return;
    }
    if (matches(data, "down") || matches(data, "j")) return this.move(1);
    if (matches(data, "up") || matches(data, "k")) return this.move(-1);
    if (matches(data, "tab") || matches(data, "right")) return this.setTab(1);
    if (matches(data, "shift+tab") || matches(data, "left")) return this.setTab(-1);
    if (matches(data, "/")) {
      this.searching = true;
      return;
    }
    if (matches(data, "r")) return void this.refresh();
    const m = this.current();
    if (!m) return;
    if (matches(data, "return")) return void this.run("attach", m);
    if (matches(data, "o")) return void this.run("open", m);
    if (matches(data, "c")) return void this.run("copy", m);
    if (matches(data, "p")) return void this.run("pin", m);
    if (matches(data, "w")) return void this.run("watch", m);
    if (matches(data, "d")) this.confirming = m;
  }

  private row(m: Manifest, selected: boolean): string {
    const { paint } = this.options;
    const title = terminalSafe(m.title, 48);
    const facts = [
      versionLabel(m),
      m.pinned ? "pinned" : "",
      m.pending.length ? `${m.pending.length} pending` : "",
      m.watched ? "" : "unwatched",
      ago(m.updatedAt, this.now()),
    ].filter(Boolean);
    const mark = m.pending.length ? paint.warn("⧉") : paint.accent("⧉");
    return `${selected ? "❯" : " "} ${mark} ${selected ? paint.accent(title) : title}  ${paint.dim(facts.join(" · "))}`;
  }

  render(width: number): string[] {
    const { paint } = this.options;
    const inner = Math.max(10, width - 4);
    const search = `${this.query}${this.searching ? "▏" : ""}`;
    const text = truncateToWidth(`⌕ ${search || "Search artifacts…"}`, inner);
    const fill = " ".repeat(Math.max(0, inner - visibleWidth(text)));
    const tab = (t: Tab, label: string) => {
      const text = ` ${label} ${this.inTab(t).length} `;
      return this.tab === t ? paint.selected(paint.bold(text)) : text;
    };
    const rows = this.visible();
    if (this.index < this.top) this.top = this.index;
    if (this.index >= this.top + this.rows) this.top = this.index - this.rows + 1;
    const first = Math.max(0, Math.min(this.top, rows.length - this.rows));
    const shown = rows.slice(first, first + this.rows);
    const below = rows.length - first - shown.length;
    const lines = [
      paint.bold(paint.accent("Artifacts")),
      "",
      paint.dim(`╭${"─".repeat(inner + 2)}╮`),
      `${paint.dim("│")} ${search ? text : paint.dim(text)}${fill} ${paint.dim("│")}`,
      paint.dim(`╰${"─".repeat(inner + 2)}╯`),
      "",
      `${tab("all", "All")}  ${tab("mine", "⧉ This session")}  ${tab("others", "↳ Other sessions")}`,
      "",
      ...(first > 0 ? [paint.dim(`  ↑ ${first} more above`)] : []),
      ...shown.map((m, i) => this.row(m, first + i === this.index)),
      ...(rows.length
        ? []
        : [paint.dim(this.query ? "  No artifact matches." : "  Nothing here yet.")]),
      ...(below > 0 ? [paint.dim(`  ↓ ${below} more below`)] : []),
      "",
      this.confirming
        ? paint.warn(
            `Move "${terminalSafe(this.confirming.title, 48)}" to the trash? y to confirm · any other key cancels`,
          )
        : this.notice
          ? paint.accent(terminalSafe(this.notice, 200))
          : paint.dim(HINT),
    ];
    return lines.map((line) => truncateToWidth(line, width));
  }

  invalidate(): void {}
}
