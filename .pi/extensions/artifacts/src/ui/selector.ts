// The footer's keys. `down` on an empty editor hands focus to the strip,
// starting on the newest pill — the rightmost, as in Claude Code; while it is
// there ←/→ (or tab) move the selection and wrap, enter opens the page, c
// copies its URL, x drops the badge from the strip, esc or ↑ hands focus back,
// and any other key hands it back and is typed. The selection lives on the
// Strip, which draws it; this is only what a key means, so it is testable
// without a terminal.

import type { Strip } from "./strip";

export type Choice =
  | { action: "open"; slug: string }
  | { action: "copy"; slug: string }
  | { action: "dismiss"; slug: string };

export interface KeyMatcher {
  (data: string, key: string): boolean;
}

export type KeyResult =
  /** The key was the footer's; focus stays there unless the selection is gone. */
  | { kind: "handled"; choice?: Choice }
  /** Focus went back to the editor, which should also receive the key when `passthrough`. */
  | { kind: "left"; passthrough: boolean };

export class Selector {
  constructor(
    private readonly strip: Strip,
    private readonly matches: KeyMatcher,
  ) {}

  get active(): boolean {
    return this.strip.selected !== null;
  }

  /** Hands focus to the footer, on the newest pill; false when there is nothing to select. */
  enter(): boolean {
    this.strip.select(this.strip.list().length - 1);
    return this.active;
  }

  handleInput(data: string): KeyResult {
    const { strip, matches } = this;
    const badges = strip.list();
    const index = strip.selected;
    const current = index === null ? undefined : badges[index];
    if (index === null || !current) {
      strip.select(null);
      return { kind: "left", passthrough: true };
    }
    if (matches(data, "escape") || matches(data, "up")) {
      strip.select(null);
      return { kind: "left", passthrough: false };
    }
    if (matches(data, "right") || matches(data, "tab")) {
      strip.select((index + 1) % badges.length);
      return { kind: "handled" };
    }
    if (matches(data, "left") || matches(data, "shift+tab")) {
      strip.select((index - 1 + badges.length) % badges.length);
      return { kind: "handled" };
    }
    if (matches(data, "down")) return { kind: "handled" };
    if (matches(data, "return")) {
      strip.select(null);
      return { kind: "handled", choice: { action: "open", slug: current.slug } };
    }
    if (matches(data, "c")) {
      strip.select(null);
      return { kind: "handled", choice: { action: "copy", slug: current.slug } };
    }
    if (matches(data, "x"))
      return { kind: "handled", choice: { action: "dismiss", slug: current.slug } };
    strip.select(null);
    return { kind: "left", passthrough: true };
  }
}
