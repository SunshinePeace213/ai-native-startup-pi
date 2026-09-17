// The token counter: how long the session's context is right now — the same
// reading the Context row measures its bar against — and the badge the
// statusline pins to its bottom-right corner. Counting lives here, apart from
// the statusline's layout, so what the badge means can change without
// touching how the lines are fitted.
//
//   context 114k of 1.0M → "114k Tokens"

import type { Theme } from "@earendil-works/pi-coding-agent";
import { fmtTokens } from "../statusline/format";

/** Pi's context reading, as the statusline snapshots it. */
export interface ContextReading {
  /** Tokens in the window now; null when Pi has no reading (fresh, or just compacted). */
  tokens: number | null;
  /** The window those tokens sit in. */
  window: number;
}

/** The session's current context length, or null while Pi has no reading. */
export function sessionTokens(context: ContextReading): number | null {
  if (context.tokens === null || !Number.isFinite(context.tokens)) return null;
  return Math.max(0, Math.round(context.tokens));
}

/** The text of the badge, unpainted: `114k Tokens`, or `— Tokens` with no reading. */
export function tokenBadgeText(context: ContextReading): string {
  const tokens = sessionTokens(context);
  return `${tokens === null ? "—" : fmtTokens(tokens)} Tokens`;
}

/** The badge as the statusline shows it: the count in text, the unit dim. */
export function tokenBadge(theme: Theme, context: ContextReading): string {
  const tokens = sessionTokens(context);
  const count =
    tokens === null ? theme.fg("dim", "—") : theme.bold(theme.fg("text", fmtTokens(tokens)));
  return `${count} ${theme.fg("dim", "Tokens")}`;
}
