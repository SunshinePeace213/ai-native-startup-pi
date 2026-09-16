// Pure formatting for the statusline: token counts the way Pi's footer
// abbreviates them, countdowns and elapsed times, the ⛁ bar with its
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

export function fmtClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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
