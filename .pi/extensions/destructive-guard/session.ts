// What this session has already approved. "Approve for this session" remembers
// the rule together with the exact targets (or the exact normalized command
// when a rule names none), so a later identical call runs without a second
// dialog — and a call aimed anywhere else asks again. Memory lives in the
// process only; a new session starts empty.

import type { Match, Verdict } from "./types";

export interface Approvals {
  remember(verdict: Verdict): void;
  covers(verdict: Verdict): boolean;
  clear(): void;
  size(): number;
}

function keyOf(match: Match, normalized: string): string {
  const targets = match.targets?.length
    ? [...match.targets].sort().join("\u0000")
    : normalized.trim().replace(/\s+/g, " ");
  return `${match.rule.id}\u0001${targets}`;
}

export function createApprovals(): Approvals {
  const keys = new Set<string>();
  return {
    remember(verdict) {
      for (const match of verdict.matches) keys.add(keyOf(match, verdict.normalized));
    },
    covers(verdict) {
      if (!verdict.matches.length) return false;
      return verdict.matches.every((match) => keys.has(keyOf(match, verdict.normalized)));
    },
    clear() {
      keys.clear();
    },
    size() {
      return keys.size;
    },
  };
}
