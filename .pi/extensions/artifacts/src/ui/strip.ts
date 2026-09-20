// The footer strip: the pages this session published, as clickable pills on
// one status row — Claude Code's footer, hosted locally.
//
//   ⧉ +2 · pricing-plan · ● roadmap · parity-audit
//   ❯ ⧉ +2 · pricing-plan · ● roadmap ·  parity-audit  · ←/→ to navigate · Enter to open · x to dismiss
//
// A pill is named after the file it was published from, without the
// extension, or after its slug when it came from no file; `●` leads it when a
// reply is waiting. Pills run oldest → newest by last publish, so the newest
// is rightmost. At most five show: the five newest, the older ones folded
// into a leading `+N`. When one is selected (the editor handed focus to the
// footer) the row leads with `❯`, the pill is filled, the window of five
// follows it — pages newer than the window fold into a trailing `+N` — and
// the keys are named after the pills.
//
// Every pill, padding included, is wrapped in an OSC 8 hyperlink to the
// tokened page URL. In pi's fullscreen mode the renderer hit-tests a plain
// left click against those links on whatever row it drew
// (TuiAltScreen.handleSelectionMouseEvent) and opens the URL, in pi's own
// footer and in one an extension mounts alike; in regular mode no application
// sees the mouse, and the terminal's own Ctrl/Cmd+click on the link is what
// remains. Names pass through terminalSafe first: a file name can never
// rewrite the line.

import { terminalSafe } from "../domain/text";
import type { Manifest } from "../domain/types";
import { versionLabel } from "../domain/versioning";

export interface Badge {
  slug: string;
  /** What the pill reads; already safe to draw. */
  name: string;
  title: string;
  /** "v2" or "v2 · 1 reply". */
  version: string;
  /** With the viewer token, so a click authenticates. */
  url: string;
  /** Replies or comments waiting on this page. */
  pending: number;
  /** ISO time of the last publish; the strip runs oldest → newest. */
  at: string;
}

export const STRIP_KEY = "artifacts";
const MAX_BADGES = 5;
const NAME_MAX = 28;
const FOCUS_MARK = "❯";
const STRIP_ICON = "⧉";
const FOCUS_HINT = "←/→ to navigate · Enter to open · x to dismiss";

export interface Paint {
  accent(text: string): string;
  dim(text: string): string;
  warn(text: string): string;
  selected(text: string): string;
}

/**
 * A fingerprint of what the active theme paints with: one sample character in
 * each role the row uses, escape codes and all. A status is text pi keeps as
 * it was handed over, so a row painted under one theme keeps that theme's
 * colours until it is drawn again; comparing this tells the drawing apart
 * from the recolouring. `selected` is left out on purpose — it is the accent
 * in reverse video, so the accent already moves with it, and a theme that
 * paints nothing (the tests') has no inverse to call.
 */
export function paintSignature(paint: Paint): string {
  const sample = "·";
  return `${paint.accent(sample)}\u0000${paint.dim(sample)}\u0000${paint.warn(sample)}`;
}

/** OSC 8: the text becomes a hyperlink; the terminal, or pi in fullscreen mode, opens it on a click. */
const hyperlink = (url: string, text: string) => `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;

/**
 * The published file's name without its extension, as Claude Code names a
 * pill; the slug when there is no file, or when nothing drawable is left of
 * its name.
 */
function nameFor(m: Manifest): string {
  const file = m.sourcePath?.split(/[\\/]/).pop() ?? "";
  return terminalSafe(file.replace(/\.[^.]+$/, ""), NAME_MAX) || terminalSafe(m.slug, NAME_MAX);
}

export function badgeFrom(m: Manifest, url: string): Badge {
  return {
    slug: m.slug,
    name: nameFor(m),
    title: m.title,
    version: versionLabel(m),
    url,
    pending: m.pending.length,
    at: m.updatedAt,
  };
}

/** This session's badges, oldest first, with the pending mark kept current. */
export class Strip {
  private readonly badges = new Map<string, Badge>();
  private listeners: Array<() => void> = [];
  private index: number | null = null;

  /** The selected badge's index, or null while the editor has the focus. */
  get selected(): number | null {
    return this.index;
  }

  /** Selects a badge (clamped to the list) or, with null, hands focus back. */
  select(index: number | null): void {
    const n = this.badges.size;
    const next = index === null || n === 0 ? null : Math.min(Math.max(index, 0), n - 1);
    if (next === this.index) return;
    this.index = next;
    this.emit();
  }

  onChange(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((l) => l !== fn));
  }

  list(): Badge[] {
    return [...this.badges.values()].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  }

  get(slug: string): Badge | undefined {
    return this.badges.get(slug);
  }

  upsert(badge: Badge): void {
    this.badges.set(badge.slug, badge);
    this.emit();
  }

  setPending(slug: string, pending: number): void {
    const b = this.badges.get(slug);
    if (!b || b.pending === pending) return;
    b.pending = pending;
    this.emit();
  }

  remove(slug: string): void {
    if (!this.badges.delete(slug)) return;
    if (this.index !== null)
      this.index = this.badges.size ? Math.min(this.index, this.badges.size - 1) : null;
    this.emit();
  }

  /** The strip as one row; empty when there are no badges. */
  render(paint: Paint): string {
    const badges = this.list();
    if (!badges.length) return "";
    const selected = this.index;
    // The window holds the newest five unless the selection sits left of them; then it starts there.
    const tail = Math.max(0, badges.length - MAX_BADGES);
    const start = selected === null ? tail : Math.min(selected, tail);
    const shown = badges.slice(start, start + MAX_BADGES);
    const parts: string[] = [];
    if (start > 0) parts.push(paint.dim(`+${start}`));
    shown.forEach((b, i) => {
      const text = `${b.pending ? "● " : ""}${b.name}`;
      const painted =
        selected === start + i
          ? paint.selected(` ${text} `)
          : b.pending
            ? paint.warn(text)
            : paint.accent(text);
      parts.push(hyperlink(b.url, painted));
    });
    const newer = badges.length - start - shown.length;
    if (newer > 0) parts.push(paint.dim(`+${newer}`));
    if (selected !== null) parts.push(paint.dim(FOCUS_HINT));
    const lead = selected === null ? "" : `${paint.accent(FOCUS_MARK)} `;
    return `${lead}${paint.accent(STRIP_ICON)} ${parts.join(paint.dim(" · "))}`;
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}
