// alt+a: the strip becomes a selector. The same row is drawn as an overlay
// anchored bottom-left with one badge highlighted; ←/→ (or tab) move the
// highlight, enter opens the page, c copies its URL, x drops the badge from
// the strip, 1–9 jump, esc leaves. The component is pure over its state, so
// the keys it answers to are testable without a terminal.

import type { Badge, Paint } from "./strip";
import { renderStrip } from "./strip";

export type Choice =
  | { action: "open"; slug: string }
  | { action: "copy"; slug: string }
  | { action: "dismiss"; slug: string }
  | null;

export interface KeyMatcher {
  (data: string, key: string): boolean;
}

export interface SelectorOptions {
  badges: readonly Badge[];
  paint: Paint;
  matches: KeyMatcher;
  done: (choice: Choice) => void;
  hint?: (text: string) => string;
  /** Width-aware truncation (pi-tui's truncateToWidth); default cuts by character. */
  fit?: (text: string, width: number) => string;
}

/** A one-line component: render(width) and handleInput(data). */
export class Selector {
  private index = 0;

  constructor(private readonly options: SelectorOptions) {}

  get selected(): number {
    return this.index;
  }

  render(width: number): string[] {
    const row = renderStrip(this.options.badges, {
      paint: this.options.paint,
      selected: this.index,
      links: false,
      max: this.options.badges.length,
    });
    const hint = this.options.hint ?? ((t) => t);
    const help = hint("  ←/→ move · enter open · c copy · x remove · esc");
    const line = row + help;
    if (width <= 0) return [line];
    return [this.options.fit ? this.options.fit(line, width) : line.slice(0, width)];
  }

  handleInput(data: string): void {
    const { matches, badges, done } = this.options;
    const n = badges.length;
    if (!n) return done(null);
    if (matches(data, "escape") || matches(data, "q")) return done(null);
    if (matches(data, "right") || matches(data, "tab") || matches(data, "down")) {
      this.index = (this.index + 1) % n;
      return;
    }
    if (matches(data, "left") || matches(data, "shift+tab") || matches(data, "up")) {
      this.index = (this.index - 1 + n) % n;
      return;
    }
    const digit = /^[1-9]$/.test(data) ? Number(data) - 1 : -1;
    if (digit >= 0 && digit < n) {
      this.index = digit;
      return done({ action: "open", slug: badges[digit]!.slug });
    }
    const current = badges[this.index]!;
    if (matches(data, "return") || matches(data, "space"))
      return done({ action: "open", slug: current.slug });
    if (matches(data, "c")) return done({ action: "copy", slug: current.slug });
    if (matches(data, "x") || matches(data, "backspace") || matches(data, "delete"))
      return done({ action: "dismiss", slug: current.slug });
  }

  invalidate(): void {}
}
