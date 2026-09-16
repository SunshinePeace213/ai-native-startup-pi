// What the session itself tells the statusline: the cumulative token and cost
// totals the way Pi's own footer sums them (every assistant message, tool
// results that report usage, compaction and branch summaries), the latest
// turn's cache-hit rate, and when the session began.

import type { Usage } from "@earendil-works/pi-ai";
import type { SessionEntry, SessionHeader } from "@earendil-works/pi-coding-agent";

export interface UsageTotals {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  /** Cache-read share of the latest assistant turn's prompt, 0–100; undefined before the first turn. */
  cacheHit?: number;
}

function add(totals: UsageTotals, usage: Usage): void {
  totals.input += usage.input;
  totals.output += usage.output;
  totals.cacheRead += usage.cacheRead;
  totals.cacheWrite += usage.cacheWrite;
  totals.cost += usage.cost.total;
}

export function usageTotals(entries: readonly SessionEntry[]): UsageTotals {
  const totals: UsageTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
  for (const entry of entries) {
    if (entry.type === "message") {
      const message = entry.message;
      if (message.role === "assistant") {
        add(totals, message.usage);
        const prompt = message.usage.input + message.usage.cacheRead + message.usage.cacheWrite;
        totals.cacheHit = prompt > 0 ? (message.usage.cacheRead / prompt) * 100 : undefined;
      } else if (message.role === "toolResult" && message.usage) {
        add(totals, message.usage);
      }
    } else if ((entry.type === "compaction" || entry.type === "branch_summary") && entry.usage) {
      add(totals, entry.usage);
    }
  }
  return totals;
}

/** Epoch ms of the session's first record, or undefined for an empty session. */
export function sessionStartedAt(
  header: SessionHeader | null,
  entries: readonly SessionEntry[],
): number | undefined {
  const stamp = header?.timestamp ?? entries[0]?.timestamp;
  if (!stamp) return undefined;
  const ms = Date.parse(stamp);
  return Number.isNaN(ms) ? undefined : ms;
}
