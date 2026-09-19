// The footer strip: the artifacts this session published, as clickable
// badges on the status line — Claude Code's footer links, hosted locally.
//
//   🧩 1 pricing-plan v2 · 2 ● roadmap v1 · +3
//
// A badge is `<n> <icon?> <title> <version>`, `●` when a reply is waiting;
// its text is wrapped in an OSC 8 hyperlink so Ctrl/Cmd+click opens the page
// in terminals that support it. At most five badges show; the rest fold into
// `+N`. Titles pass through terminalSafe first: a title can never rewrite the
// line. Rendering is a pure function of the badges so the overlay draws the
// same row with one badge highlighted.

import { terminalSafe } from "../domain/text";
import type { Manifest } from "../domain/types";
import { versionLabel } from "../domain/versioning";

export interface Badge {
  slug: string;
  title: string;
  icon?: string;
  /** "v2" or "v2 · 1 reply". */
  version: string;
  /** With the viewer token, so a click authenticates. */
  url: string;
  /** Replies or comments waiting on this page. */
  pending: number;
  /** ISO time of the last publish; newest first in the strip. */
  at: string;
}

export const STRIP_KEY = "artifacts";
export const MAX_BADGES = 5;

export interface Paint {
  accent(text: string): string;
  dim(text: string): string;
  warn(text: string): string;
  selected(text: string): string;
}

export const plainPaint: Paint = {
  accent: (t) => t,
  dim: (t) => t,
  warn: (t) => t,
  selected: (t) => `[${t}]`,
};

/** OSC 8: the text becomes a hyperlink; the terminal decides how a click opens it. */
export const hyperlink = (url: string, text: string) => `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;

export function badgeFrom(m: Manifest, url: string): Badge {
  return {
    slug: m.slug,
    title: m.title,
    icon: m.icon,
    version: versionLabel(m),
    url,
    pending: m.pending.length,
    at: m.updatedAt,
  };
}

export function badgeText(b: Badge, index: number): string {
  const icon = b.icon ? `${terminalSafe(b.icon, 4)} ` : "";
  const mark = b.pending ? "● " : "";
  return `${index + 1} ${mark}${icon}${terminalSafe(b.title, 28)} ${terminalSafe(b.version, 16)}`;
}

export interface RenderOptions {
  paint?: Paint;
  /** Index of the highlighted badge (overlay mode). */
  selected?: number;
  /** Wrap badges in OSC 8 links (off when the text is measured or tested). */
  links?: boolean;
  max?: number;
}

/** The strip as one line; empty when there are no badges. */
export function renderStrip(badges: readonly Badge[], options: RenderOptions = {}): string {
  const paint = options.paint ?? plainPaint;
  const max = options.max ?? MAX_BADGES;
  if (!badges.length) return "";
  const shown = badges.slice(0, max);
  const parts = shown.map((b, i) => {
    const text = badgeText(b, i);
    const painted =
      options.selected === i
        ? paint.selected(text)
        : b.pending
          ? paint.warn(text)
          : paint.accent(text);
    return options.links === false ? painted : hyperlink(b.url, painted);
  });
  const more = badges.length - shown.length;
  if (more > 0) parts.push(paint.dim(`+${more}`));
  return parts.join(paint.dim(" · "));
}

/** This session's badges, newest first, with the pending mark kept current. */
export class Strip {
  private readonly badges = new Map<string, Badge>();
  private listeners: Array<() => void> = [];

  onChange(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((l) => l !== fn));
  }

  list(): Badge[] {
    return [...this.badges.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
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
    if (this.badges.delete(slug)) this.emit();
  }

  render(options: RenderOptions = {}): string {
    return renderStrip(this.list(), options);
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}
