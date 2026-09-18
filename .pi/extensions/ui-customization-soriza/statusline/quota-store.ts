// Stale-while-revalidate for the quota meters. The footer only ever reads
// the last good values; refreshes run on events and a timer, throttled per
// provider: at most one poll a minute after a turn, one every five minutes
// while idle, and on failure a backoff — a 429 waits for retry-after or five
// minutes doubling to thirty, a network fault one minute doubling to ten, an
// auth failure fifteen minutes (the token needs a re-login, polling will not
// fix it). The last good values survive every failure, stamped with when they
// were fetched so the footer can show how stale they are.
//
// Two rules keep a meter from going blank and staying blank:
//
//   * a poll writes back the entry as it stands when the response lands, not
//     the snapshot it started from, so windows that arrived from response
//     headers mid-flight are never overwritten by a failure that raced them;
//   * a provider that has no values at all backs off on a short ladder
//     (15 s doubling to two minutes) — waiting protects nothing while the
//     meter is empty, and the first poll of a session is the one most likely
//     to hit a cold edge.
//
// Every failure is also kept verbatim (reason, HTTP status, when) for
// `/statusline debug`, even after later values recover the meter.

import type { ProviderId, ProviderQuota, QuotaWindow } from "./quota";
import type { QuotaResult } from "./quota-fetch";

export type QuotaError = "auth" | "throttled" | "network" | "invalid";

/** The last poll that failed, kept for `/statusline debug`. */
export interface QuotaFailure {
  reason: QuotaError;
  /** The HTTP status, when the request got a response at all. */
  status?: number;
  at: number;
}

export interface QuotaEntry {
  provider: ProviderId;
  quota?: ProviderQuota;
  fetchedAt?: number;
  error?: QuotaError;
  /** The last failure, whether or not the meter has recovered since. */
  failure?: QuotaFailure;
  /** Earliest time another poll may run. */
  nextAllowedAt: number;
}

export type RefreshReason = "start" | "turn" | "timer" | "manual";

export interface QuotaStoreOptions {
  now: () => number;
  fetch: (provider: ProviderId) => Promise<QuotaResult | undefined>;
  onChange: () => void;
}

export const MIN_POLL_MS = 60_000;
export const IDLE_POLL_MS = 5 * 60_000;
const THROTTLE_BASE_MS = 5 * 60_000;
const THROTTLE_MAX_MS = 30 * 60_000;
const NETWORK_BASE_MS = 60_000;
const NETWORK_MAX_MS = 10 * 60_000;
const AUTH_WAIT_MS = 15 * 60_000;
/** A meter with no values yet retries on this ladder instead of the full backoff. */
export const COLD_BASE_MS = 15_000;
export const COLD_MAX_MS = 2 * 60_000;

export class QuotaStore {
  private readonly entries = new Map<ProviderId, QuotaEntry>();
  private readonly backoff = new Map<ProviderId, number>();
  private readonly inFlight = new Map<ProviderId, Promise<void>>();

  constructor(private readonly options: QuotaStoreOptions) {}

  get(provider: ProviderId): QuotaEntry | undefined {
    return this.entries.get(provider);
  }

  /** Every provider that has been refreshed at least once, in insertion order. */
  all(): QuotaEntry[] {
    return [...this.entries.values()];
  }

  /**
   * Fold the windows a response's headers carried into the stored quota.
   * Free data — no poll — so it never touches the backoff or the timestamps'
   * meaning beyond marking the values fresh.
   */
  mergeWindows(
    provider: ProviderId,
    windows: { session?: QuotaWindow; weekly?: QuotaWindow },
  ): void {
    if (!windows.session && !windows.weekly) return;
    const entry = this.entries.get(provider) ?? { provider, nextAllowedAt: 0 };
    const quota: ProviderQuota = entry.quota ?? { provider, models: [] };
    if (windows.session) quota.session = windows.session;
    if (windows.weekly) quota.weekly = windows.weekly;
    entry.quota = quota;
    entry.fetchedAt = this.options.now();
    entry.error = undefined;
    this.entries.set(provider, entry);
    this.options.onChange();
  }

  /** Poll when allowed; a manual refresh ignores the poll interval but not a backoff. */
  async refresh(provider: ProviderId, reason: RefreshReason): Promise<void> {
    const pending = this.inFlight.get(provider);
    if (pending) return pending;
    const now = this.options.now();
    const entry = this.entries.get(provider) ?? { provider, nextAllowedAt: 0 };
    if (now < entry.nextAllowedAt) {
      const inBackoff = entry.error !== undefined;
      if (reason !== "manual" || inBackoff) return;
    }
    const run = this.poll(provider, now).finally(() => this.inFlight.delete(provider));
    this.inFlight.set(provider, run);
    return run;
  }

  private async poll(provider: ProviderId, startedAt: number): Promise<void> {
    const result = await this.options.fetch(provider);
    const now = this.options.now();
    if (result === undefined) return; // provider not usable (no credentials)
    // Re-read: response headers may have merged windows while this was in flight.
    const entry = this.entries.get(provider) ?? { provider, nextAllowedAt: 0 };
    if (result.ok) {
      entry.quota = result.quota;
      entry.fetchedAt = now;
      entry.error = undefined;
      entry.nextAllowedAt = now + MIN_POLL_MS;
      this.backoff.delete(provider);
    } else {
      const overtaken = entry.fetchedAt !== undefined && entry.fetchedAt >= startedAt;
      entry.failure = { reason: result.reason, status: result.status, at: now };
      // Fresher values landed while this poll was out: they, not the failure, are the state.
      if (!overtaken) entry.error = result.reason;
      entry.nextAllowedAt = now + this.nextBackoff(provider, result, entry.quota === undefined);
    }
    this.entries.set(provider, entry);
    this.options.onChange();
  }

  private nextBackoff(
    provider: ProviderId,
    failure: QuotaResult & { ok: false },
    cold: boolean,
  ): number {
    const previous = this.backoff.get(provider);
    let wait: number;
    switch (failure.reason) {
      case "auth":
        wait = AUTH_WAIT_MS;
        break;
      case "throttled":
        wait = Math.min(THROTTLE_MAX_MS, previous ? previous * 2 : THROTTLE_BASE_MS);
        if (failure.retryAfterMs !== undefined) wait = Math.max(wait, failure.retryAfterMs);
        break;
      default:
        wait = Math.min(NETWORK_MAX_MS, previous ? previous * 2 : NETWORK_BASE_MS);
    }
    // Nothing is being protected while the meter is empty, so retry soon —
    // except after an auth failure, which only a re-login fixes, and never
    // sooner than a 429's own retry-after.
    if (cold && failure.reason !== "auth") {
      const ladder = Math.min(COLD_MAX_MS, previous ? previous * 2 : COLD_BASE_MS);
      wait = Math.max(Math.min(wait, ladder), failure.retryAfterMs ?? 0);
    }
    this.backoff.set(provider, wait);
    return wait;
  }
}
