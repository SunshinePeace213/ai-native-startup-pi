// What `/statusline debug` prints: why each provider's meter reads the way it
// does. The statusline itself has room for a reason and a countdown; this is
// the long form — which model the poll authenticates as, when values last
// arrived, the last failure with its HTTP status, when the next poll may run,
// and the endpoint being called — so an empty meter can be told apart from a
// provider the session is not logged into, a re-login, an edge that keeps
// timing out, and a payload the parser no longer recognises.
//
//   statusline quota · 16:32
//   🟠 anthropic · oauth claude-fable-5 · no values · network (HTTP 522) 40s ago
//      · retry in 15s · https://api.anthropic.com/api/oauth/usage
//   🟢 openai-codex · not logged in — not polled

import { fmtCountdown, fmtDuration, fmtPercent } from "./format";
import { PROVIDER_META, type ProviderId } from "./quota";
import type { QuotaEntry } from "./quota-store";

export interface ProviderDiagnostic {
  provider: ProviderId;
  /** The OAuth model the poll authenticates as; null when the session has none. */
  model: string | null;
  /** The stored entry, absent until the provider has been polled at all. */
  entry?: QuotaEntry;
  url: string;
}

/** `5h 58% · 7d 21% · fable 21%` — the windows the entry actually holds. */
function windows(entry: QuotaEntry): string {
  const quota = entry.quota;
  if (!quota) return "no values";
  const parts: string[] = [];
  if (quota.session) parts.push(`5h ${fmtPercent(quota.session.percent)}`);
  if (quota.weekly) parts.push(`7d ${fmtPercent(quota.weekly.percent)}`);
  for (const model of quota.models) parts.push(`${model.label} ${fmtPercent(model.percent)}`);
  return parts.length > 0 ? parts.join(" · ") : "no windows in payload";
}

/** One provider's line: everything known about its last poll. */
function line(row: ProviderDiagnostic, now: number): string {
  const { icon } = PROVIDER_META[row.provider];
  const head = `${icon} ${row.provider}`;
  if (!row.model) return `${head} · not logged in — not polled`;
  const parts = [`oauth ${row.model}`];
  const entry = row.entry;
  if (!entry) parts.push("never polled");
  else {
    parts.push(windows(entry));
    parts.push(
      entry.fetchedAt === undefined
        ? "last ok —"
        : `last ok ${fmtDuration(now - entry.fetchedAt)} ago`,
    );
    if (entry.failure) {
      const status = entry.failure.status === undefined ? "" : ` (HTTP ${entry.failure.status})`;
      const shown = entry.error ? "" : " (recovered)";
      parts.push(
        `last error ${entry.failure.reason}${status} ${fmtDuration(now - entry.failure.at)} ago${shown}`,
      );
    }
    const wait = entry.nextAllowedAt - now;
    parts.push(wait > 0 ? `next poll in ${fmtCountdown(wait)}` : "next poll now");
  }
  parts.push(row.url);
  return `${head} · ${parts.join(" · ")}`;
}

/**
 * The whole report, one line per provider. `rows` carries every provider the
 * statusline knows about, logged in or not — a missing provider is itself the
 * answer to "why is there no Claude line".
 */
export function diagnose(rows: ProviderDiagnostic[], now: number): string {
  if (rows.length === 0) return "statusline quota · no providers known";
  return ["statusline quota", ...rows.map((row) => line(row, now))].join("\n");
}
