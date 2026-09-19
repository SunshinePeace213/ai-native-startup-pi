// The retention rule. An artifact expires when nothing has touched it — no
// publish, response, comment, or view — for `retentionDays`, unless it is
// pinned. Log folders are named by date and expire by that date. Both are
// decisions; the sweep that acts on them is infra.

import type { Manifest } from "./types";

const DAY_MS = 24 * 3600 * 1000;

export function isExpired(m: Manifest, now: Date, retentionDays: number): boolean {
  if (m.pinned) return false;
  const last = Date.parse(m.lastActivityAt || m.updatedAt || m.createdAt);
  if (!Number.isFinite(last)) return false;
  return now.getTime() - last > retentionDays * DAY_MS;
}

/** The local calendar date a log folder is named after. */
export function logDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * A log line's time: the local wall clock with its offset
 * (`2026-09-20T07:22:36.062+08:00`), so it reads like the folder it sits in
 * and still parses to the exact instant. `offsetMinutes` is east of UTC.
 */
export function localIso(now: Date, offsetMinutes = -now.getTimezoneOffset()): string {
  const shifted = new Date(now.getTime() + offsetMinutes * 60_000).toISOString().slice(0, -1);
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${shifted}${offsetMinutes < 0 ? "-" : "+"}${hh}:${mm}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Which of the named log folders are older than the retention window. */
export function expiredLogDates(names: string[], now: Date, retentionDays: number): string[] {
  const cutoff = now.getTime() - retentionDays * DAY_MS;
  return names.filter((name) => {
    if (!DATE_RE.test(name)) return false;
    const at = Date.parse(`${name}T23:59:59`);
    return Number.isFinite(at) && at < cutoff;
  });
}
