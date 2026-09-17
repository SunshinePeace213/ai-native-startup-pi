// Pure formatting for the statusline: token counts the way Pi's footer
// abbreviates them, countdowns, reset stamps, the ⛁ bar with its
// green → amber → red banding, the severity of a percentage, and the layout
// step that fits prioritised segments into a width — full forms first, then
// compact forms from the least important segment up, then dropping segments,
// and only then truncating.

import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export type Level = "ok" | "warn" | "crit";

export interface Thresholds {
  warn: number;
  crit: number;
}

/** Pi's own context colouring: warning above 70 %, error above 90 %. */
export const CONTEXT_THRESHOLDS: Thresholds = { warn: 70, crit: 90 };
/** Subscription windows: amber from 60 %, red from 85 %. */
export const QUOTA_THRESHOLDS: Thresholds = { warn: 60, crit: 85 };

export function level(percent: number, thresholds: Thresholds): Level {
  if (percent >= thresholds.crit) return "crit";
  if (percent >= thresholds.warn) return "warn";
  return "ok";
}

/** 999 · 1.2k · 48k · 1.2M · 12M — identical to Pi's footer. */
export function fmtTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
  return `${Math.round(count / 1000000)}M`;
}

/**
 * The count in full, grouped for reading: 999 · 1,234 · 114,325 · 1,240,000.
 * Used where the exact figure matters more than a short column — the token
 * badge — while `fmtTokens` keeps the abbreviated form everywhere else.
 */
export function fmtExactTokens(count: number): string {
  const rounded = Math.round(count);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** Two significant units at most: 4d6h · 2h14m · 18m · 45s; never negative. */
export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return h > 0 ? `${d}d${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/**
 * Quota countdowns, where the columns must hold still across a redraw:
 * 5d0h · 4d6h · 4h00m · 18m · 45s. Unlike `fmtDuration` the smaller unit is
 * always carried, so a window never jumps between `4h` and `4h00m`.
 */
export function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return `${d}d${h}h`;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m`;
  return `${total % 60}s`;
}

export function fmtClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** A dated 24-hour stamp: `20 Sep Sun 20:32`. */
export function fmtStamp(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${WEEKDAYS[date.getDay()]} ${fmtClock(date)}`;
}

/**
 * When a window resets, in wall-clock terms: a bare `16:46` while it lands on
 * today's date, the full `20 Sep Sun 18:32` stamp otherwise. `dated` forces
 * the stamp — the 7-day window always carries its date.
 */
export function fmtResetAt(at: Date, now: Date, dated = false): string {
  const sameDay =
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate();
  return !dated && sameDay ? fmtClock(at) : fmtStamp(at);
}

export function fmtPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

export function fmtCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export interface BarPainter {
  fill(level: Level, text: string): string;
  empty(text: string): string;
}

/**
 * `cells` glyphs separated by `gap` so each reads as its own cell; the filled
 * prefix is proportional to `percent`, each filled cell coloured by where it
 * sits on the bar (the band, not the total), so a full bar reads green →
 * amber → red the way the original statusline did.
 */
export function bar(
  percent: number,
  cells: number,
  paint: BarPainter,
  glyph = "⛁",
  thresholds: Thresholds = QUOTA_THRESHOLDS,
  gap = " ",
): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * cells);
  const runs: Array<{ level: Level | "empty"; glyphs: string[] }> = [];
  for (let i = 0; i < cells; i++) {
    const cellLevel: Level | "empty" =
      i < filled ? level(((i + 1) / cells) * 100, thresholds) : "empty";
    const last = runs[runs.length - 1];
    if (last && last.level === cellLevel) last.glyphs.push(glyph);
    else runs.push({ level: cellLevel, glyphs: [glyph] });
  }
  return runs
    .map((run) => {
      const text = run.glyphs.join(gap);
      return run.level === "empty" ? paint.empty(text) : paint.fill(run.level, text);
    })
    .join(gap);
}

export interface Segment {
  full: string;
  compact?: string;
  /** Higher survives longer; `Infinity` is never dropped. */
  priority: number;
}

/**
 * Join segments with `gap`, fitting `width`: all full forms if they fit;
 * otherwise compact forms are substituted from the lowest priority up, then
 * segments are dropped from the lowest priority up, and finally the line is
 * truncated with an ellipsis. Order on the line is the order given.
 */
export function layout(segments: Segment[], width: number, gap = "   "): string {
  return join(segments, width, gap);
}

function join(segments: Segment[], width: number, gap: string): string {
  const present = segments.filter((s) => s.full.length > 0);
  const forms = present.map((s) => s.full);
  const alive = present.map(() => true);
  const join = () => forms.filter((_, i) => alive[i]).join(gap);
  const fits = () => visibleWidth(join()) <= width;
  if (fits()) return join();

  const byPriority = present
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.priority - b.s.priority || b.i - a.i);
  for (const { s, i } of byPriority) {
    if (!s.compact) continue;
    forms[i] = s.compact;
    if (fits()) return join();
  }
  for (const { s, i } of byPriority) {
    if (s.priority === Infinity) continue;
    alive[i] = false;
    if (fits()) return join();
  }
  return truncateToWidth(join(), width, "…");
}

/**
 * Pad every row's cells to a shared column width, so the bars, percentages
 * and the groups after them start at the same column on every row. A row's
 * last cell is never padded, so no line carries trailing space. `columns`
 * caps how many columns take part.
 */
function align(rows: Segment[][], width: number, gap: string, columns: number): string[] | null {
  const present = rows.map((row) => row.filter((s) => s.full.length > 0));
  const widths: number[] = [];
  for (const row of present)
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, visibleWidth(cell.full));
    });
  const lines = present.map((row) =>
    row
      .map((cell, i) => {
        if (i >= columns || i === row.length - 1) return cell.full;
        return `${cell.full}${" ".repeat(Math.max(0, widths[i]! - visibleWidth(cell.full)))}`;
      })
      .join(gap),
  );
  return lines.every((line) => visibleWidth(line) <= width) ? lines : null;
}

/**
 * Lay rows out as a grid, relaxing in steps that every row takes together —
 * so no row keeps its bars while its neighbour loses them:
 *
 *   full forms, every column aligned → full forms, first column aligned →
 *   compact forms, every column aligned → compact forms, first column →
 *   compact forms flowing, least important segments dropped.
 */
export function layoutGrid(rows: Segment[][], width: number, gap = "   "): string[] {
  if (rows.length === 0) return [];
  const compact = rows.map((row) => row.map((s) => ({ ...s, full: s.compact ?? s.full })));
  return (
    align(rows, width, gap, Infinity) ??
    align(rows, width, gap, 1) ??
    align(compact, width, gap, Infinity) ??
    align(compact, width, gap, 1) ??
    compact.map((row) => join(row, width, gap))
  );
}

/**
 * `segments` from the left, `trailer` flush against the right edge, at least
 * `gap` between them. The trailer always survives; the segments give way to
 * it by their own priorities.
 */
export function layoutRight(
  segments: Segment[],
  trailer: string,
  width: number,
  gap = "   ",
): string {
  const trailerWidth = visibleWidth(trailer);
  if (trailerWidth >= width) return truncateToWidth(trailer, width, "…");
  const left = join(segments, Math.max(0, width - trailerWidth - gap.length), gap);
  const room = width - visibleWidth(left) - trailerWidth;
  if (left.length === 0) return `${" ".repeat(Math.max(0, width - trailerWidth))}${trailer}`;
  return `${left}${" ".repeat(Math.max(gap.length, room))}${trailer}`;
}
