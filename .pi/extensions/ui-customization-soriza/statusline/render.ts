// The statusline's lines, from a snapshot and a width — pure, so every layout
// is testable. Icons carry the meaning, theme tokens carry the state: labels
// and units `dim`, values `text`, the model bold, thinking `accent`; bars and
// percentages go success → warning → error by threshold. Each line is a list
// of prioritised segments that `layout` fits to the width: full forms, then
// compact forms (bars off) from the least important segment up, then drops.
//
//   📁 cwd  🌿 branch ✓|+s ~m ?u ⇡a ⇣b  🔖 session  🤖 model · 🧠 thinking  🕐 clock
//   🧮 Context    ⛁ …  pct (used/window) auto   📥 in · 📤 out · ⚡ cached   💰 cost sub ($/h)
//   🟠 Claude  5h ⛁ …  pct ↻ left · at         7d ⛁ …  pct ↻ left · at      (fable pct)
//   🟢 OpenAI  5h ⛁ …  pct ↻ left · at         7d ⛁ …  pct ↻ left · at
//   🏗️ architecture …   📚 wiki …   🎨 theme ██ …                       114k Tokens
//
// The middle lines are a grid: one row for the context, one per provider,
// their names padded into a shared column so the bars, the percentages and
// everything after them line up (see `layoutGrid`). The last line carries the
// other extensions' statuses on the left and the context's token count flush
// right.
// Compact mode drops the grid: two content lines, bars off, providers terse.

import type { Theme } from "@earendil-works/pi-coding-agent";
import { basename } from "node:path";
import { THEME_STATUS_KEY } from "../theme/status";
import {
  bar,
  CONTEXT_THRESHOLDS,
  fmtCost,
  fmtCountdown,
  fmtDuration,
  fmtPercent,
  fmtResetAt,
  fmtTokens,
  layout,
  layoutGrid,
  layoutRight,
  level,
  type Level,
  QUOTA_THRESHOLDS,
  type Segment,
} from "./format";
import { type GitState, isClean } from "./git";
import {
  extraLimitWindows,
  modelWindowFor,
  PROVIDER_META,
  type ProviderId,
  type QuotaWindow,
} from "./quota";
import type { QuotaEntry, QuotaError } from "./quota-store";
import type { UsageTotals } from "./stats";
import { tokenBadge } from "../tokens";

export interface Snapshot {
  /** Already `~`-collapsed. */
  cwd: string;
  git: GitState | null;
  /** Pi's own branch, shown when the git probe has nothing. */
  branch: string | null;
  sessionName?: string;
  model?: { id: string; provider: string; thinking?: string };
  clock: string;
  elapsedMs?: number;
  context: { percent: number | null; tokens: number | null; window: number; auto: boolean };
  usage: UsageTotals;
  subscription: boolean;
  experimental: boolean;
  /** Every provider with a stored entry; the active one is looked up by id. */
  quotas: QuotaEntry[];
  statuses: ReadonlyMap<string, string>;
  now: number;
}

export type StatuslineMode = "full" | "compact";

export interface RenderOptions {
  mode: StatuslineMode;
  /** Show the cache read/write totals and the provider id. */
  verbose: boolean;
}

export const ICON = {
  dir: "📁",
  branch: "🌿",
  session: "🔖",
  model: "🤖",
  thinking: "🧠",
  clock: "🕐",
  context: "🧮",
  input: "📥",
  output: "📤",
  cache: "⚡",
  cost: "💰",
  reset: "↻",
  stale: "⚠️",
  auth: "🔒",
} as const;

/** Icons for other extensions' statuses, by status key; order is display order. */
export const STATUS_ICONS: ReadonlyArray<[key: string, icon: string]> = [
  ["architecture-sync", "🏗️"],
  ["llm-wiki", "📚"],
];

const CONTEXT_CELLS = 10;
const QUOTA_CELLS = 10;
/** The context row's name in the grid's shared label column. */
const CONTEXT_LABEL = "Context";
/** Width of the `5h` / `7d` tag the provider rows carry and the context row does not. */
const TAG_WIDTH = 2;
/** Two spaces separate every bar from its percentage. */
const BAR_GAP = "  ";
/** Percentages are padded to this width so the countdowns line up in a column. */
const PERCENT_WIDTH = 3;
/** Values older than this without an error are flagged too: the idle poll should have replaced them. */
const STALE_AFTER_MS = 15 * 60_000;

/**
 * What a failed poll is called on the line. A meter that has no values owes
 * the reader the reason it is empty — a bare ⚠️ could be a 429, a dead link
 * or a payload the parser no longer recognises, and each wants a different
 * response from the user.
 */
const REASON_LABEL: Record<QuotaError, string> = {
  auth: "re-login",
  throttled: "429",
  network: "network",
  invalid: "payload",
};

const LEVEL_TOKEN: Record<Level, "success" | "warning" | "error"> = {
  ok: "success",
  warn: "warning",
  crit: "error",
};

class Paint {
  constructor(private readonly theme: Theme) {}
  dim = (s: string) => this.theme.fg("dim", s);
  muted = (s: string) => this.theme.fg("muted", s);
  text = (s: string) => this.theme.fg("text", s);
  accent = (s: string) => this.theme.fg("accent", s);
  bold = (s: string) => this.theme.bold(s);
  byLevel = (lvl: Level, s: string) => this.theme.fg(LEVEL_TOKEN[lvl], s);
  pct = (percent: number, thresholds = QUOTA_THRESHOLDS) =>
    this.byLevel(level(percent, thresholds), fmtPercent(percent));
  /** The percentage plus plain padding to `PERCENT_WIDTH` (outside the paint). */
  pctColumn = (percent: number, thresholds = QUOTA_THRESHOLDS) =>
    `${this.pct(percent, thresholds)}${pad(fmtPercent(percent), PERCENT_WIDTH)}`;
  bar = (percent: number, cells: number, thresholds = QUOTA_THRESHOLDS) =>
    bar(
      percent,
      cells,
      { fill: (lvl, s) => this.byLevel(lvl, s), empty: (s) => this.muted(s) },
      "⛁",
      thresholds,
    );
}

/** Spaces that widen `text` to `width`; never negative. */
const pad = (text: string, width: number) => " ".repeat(Math.max(0, width - text.length));

const sanitize = (text: string) =>
  text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();

// ── line 1: where ───────────────────────────────────────────────────────────

function gitSegment(p: Paint, git: GitState | null, branch: string | null): Segment {
  if (!git) {
    if (!branch) return { full: "", priority: 90 };
    return { full: `${ICON.branch} ${p.text(branch)}`, priority: 90 };
  }
  const clean = isClean(git);
  const name = clean ? p.text(git.branch) : p.byLevel("warn", git.branch);
  const marks: string[] = [];
  if (clean) marks.push(p.byLevel("ok", "✓"));
  if (git.staged) marks.push(p.byLevel("ok", `+${git.staged}`));
  if (git.modified) marks.push(p.byLevel("warn", `~${git.modified}`));
  if (git.untracked) marks.push(p.byLevel("crit", `?${git.untracked}`));
  if (git.ahead) marks.push(p.byLevel("ok", `⇡${git.ahead}`));
  if (git.behind) marks.push(p.byLevel("warn", `⇣${git.behind}`));
  return {
    full: `${ICON.branch} ${name} ${marks.join(" ")}`,
    compact: `${ICON.branch} ${name}`,
    priority: 90,
  };
}

function whereLine(p: Paint, snap: Snapshot, opts: RenderOptions): Segment[] {
  const segments: Segment[] = [
    {
      full: `${ICON.dir} ${p.muted(snap.cwd)}`,
      compact: `${ICON.dir} ${p.muted(basename(snap.cwd) || snap.cwd)}`,
      priority: Infinity,
    },
    gitSegment(p, snap.git, snap.branch),
  ];
  if (snap.sessionName)
    segments.push({ full: `${ICON.session} ${p.text(snap.sessionName)}`, priority: 40 });
  if (snap.model) {
    const id = opts.verbose ? `${snap.model.provider}/${snap.model.id}` : snap.model.id;
    const model = `${ICON.model} ${p.bold(p.text(id))}`;
    const thinking = snap.model.thinking
      ? ` ${p.dim("·")} ${ICON.thinking} ${p.accent(snap.model.thinking)}`
      : "";
    segments.push({ full: `${model}${thinking}`, compact: model, priority: 80 });
  }
  segments.push({ full: `${ICON.clock} ${p.dim(snap.clock)}`, priority: 30 });
  return segments;
}

// ── line 2: this session ────────────────────────────────────────────────────

/**
 * The context row of the grid. In the grid its label sits in the same column
 * as the providers' names and the `5h`/`7d` tag slot is left blank, so its bar
 * and percentage start exactly where theirs do — in both the full and the
 * bars-off form. Off the grid (compact mode) it drops the label and stands on
 * its own.
 */
function contextSegment(p: Paint, snap: Snapshot, labelWidth: number, labelled: boolean): Segment {
  const { percent, tokens, window, auto } = snap.context;
  const plain = percent === null ? "—" : fmtPercent(percent);
  const painted = percent === null ? p.dim("—") : p.pct(percent, CONTEXT_THRESHOLDS);
  const pct = `${painted}${pad(plain, PERCENT_WIDTH)}`;
  const used = tokens === null ? "—" : fmtTokens(tokens);
  const detail = p.dim(`(${used}/${fmtTokens(window)})`);
  const autoMark = auto ? ` ${p.dim("auto")}` : "";
  const filled = p.bar(percent ?? 0, CONTEXT_CELLS, CONTEXT_THRESHOLDS);
  if (!labelled)
    return {
      full: `${ICON.context} ${filled}${BAR_GAP}${pct} ${detail}${autoMark}`,
      compact: `${ICON.context} ${painted} ${detail}`,
      priority: Infinity,
    };
  const label = `${p.text(CONTEXT_LABEL)}${pad(CONTEXT_LABEL, labelWidth)}`;
  const lead = `${ICON.context} ${label}${BAR_GAP}${" ".repeat(TAG_WIDTH)} `;
  return {
    full: `${lead}${filled}${BAR_GAP}${pct} ${detail}${autoMark}`,
    compact: `${lead}${pct} ${detail}${autoMark}`,
    priority: Infinity,
  };
}

function tokensSegment(p: Paint, usage: UsageTotals, verbose: boolean): Segment {
  const input = `${ICON.input} ${p.text(fmtTokens(usage.input))}`;
  const output = `${ICON.output} ${p.text(fmtTokens(usage.output))}`;
  const sep = ` ${p.dim("·")} `;
  let cache = "";
  let cacheCompact = "";
  if (usage.cacheHit !== undefined) {
    const hit = Math.round(usage.cacheHit);
    const painted = hit < 50 ? p.byLevel("warn", `${hit}%`) : p.text(`${hit}%`);
    cache = `${sep}${ICON.cache} ${painted} ${p.dim("cached")}`;
    cacheCompact = `${sep}${ICON.cache} ${painted}`;
    if (verbose)
      cache += ` ${p.dim(`(${fmtTokens(usage.cacheRead)} read · ${fmtTokens(usage.cacheWrite)} write)`)}`;
  }
  return {
    full: `${input} ${p.dim("in")}${sep}${output} ${p.dim("out")}${cache}`,
    compact: `${input}${sep}${output}${cacheCompact}`,
    priority: 70,
  };
}

function costSegment(p: Paint, snap: Snapshot): Segment {
  const { usage, subscription, elapsedMs } = snap;
  if (!usage.cost && !subscription) return { full: "", priority: 80 };
  const cost = `${ICON.cost} ${p.text(fmtCost(usage.cost))}${subscription ? ` ${p.dim("sub")}` : ""}`;
  const perHour =
    elapsedMs && elapsedMs > 60_000
      ? ` ${p.dim(`(${fmtCost((usage.cost * 3_600_000) / elapsedMs)}/h)`)}`
      : "";
  return { full: `${cost}${perHour}`, compact: cost, priority: 80 };
}

function sessionLine(p: Paint, snap: Snapshot, opts: RenderOptions, labelWidth: number): Segment[] {
  const segments = [
    contextSegment(p, snap, labelWidth, opts.mode === "full"),
    tokensSegment(p, snap.usage, opts.verbose),
    costSegment(p, snap),
  ];
  if (snap.experimental) segments.push({ full: p.bold(p.byLevel("warn", "xp")), priority: 20 });
  return segments;
}

// ── line 3+: one line per provider ───────────────────────────────────────────────────────────

/**
 * `↻ 2h14m · 16:46` — how long the window has left and when it turns over.
 * The 5-hour window shows a bare clock while it resets today; the 7-day one
 * always carries its date (`↻ 4d6h · 20 Sep Sun 20:32`).
 */
function countdown(p: Paint, window: QuotaWindow, now: number, dated: boolean): string {
  if (window.resetsAt === null) return "";
  const left = fmtCountdown(window.resetsAt - now);
  const at = fmtResetAt(new Date(window.resetsAt), new Date(now), dated);
  return ` ${ICON.reset} ${p.dim(left)} ${p.dim("·")} ${p.dim(at)}`;
}

interface Marker {
  full: string;
  compact: string;
}

/**
 * How a provider's values are qualified. With values, the marker trails
 * them (`⚠️ stale 12m`, `🔒`); without, it stands in for them — naming the
 * failure and when the next poll runs (`⚠️ network · retry 15s`,
 * `🔒 re-login`), or `…` while the first fetch is pending. Fresh values carry
 * nothing.
 */
function marker(p: Paint, entry: QuotaEntry, now: number): Marker {
  const age = entry.fetchedAt === undefined ? undefined : fmtDuration(now - entry.fetchedAt);
  const same = (text: string): Marker => ({ full: text, compact: text });
  const stale = (at: string): Marker => ({
    full: `${ICON.stale} ${p.dim(`stale ${at}`)}`,
    compact: `${ICON.stale} ${p.dim(at)}`,
  });
  if (entry.error === "auth")
    return same(entry.quota ? ICON.auth : `${ICON.auth} ${p.dim("re-login")}`);
  if (entry.error) {
    if (entry.quota && age) return stale(age);
    const reason = p.dim(REASON_LABEL[entry.error]);
    const wait = entry.nextAllowedAt - now;
    const retry = wait > 0 ? ` ${p.dim("·")} ${p.dim(`retry ${fmtCountdown(wait)}`)}` : "";
    return { full: `${ICON.stale} ${reason}${retry}`, compact: `${ICON.stale} ${reason}` };
  }
  if (!entry.quota) return same(p.dim("…"));
  if (entry.fetchedAt !== undefined && now - entry.fetchedAt > STALE_AFTER_MS && age)
    return stale(age);
  return same("");
}

/** `🟠 Claude  ` — the icon and the label padded into a column shared by every line. */
function head(p: Paint, entry: QuotaEntry, labelWidth: number): string {
  const { icon, name } = PROVIDER_META[entry.provider];
  return `${icon} ${p.text(name)}${pad(name, labelWidth)}${BAR_GAP}`;
}

/** One provider's own line: `🟠 Claude  5h ⛁…  58% ↻ 2h14m · 16:46   7d …   (fable 21%)`. */
function providerQuota(
  p: Paint,
  entry: QuotaEntry,
  modelId: string | undefined,
  now: number,
  labelWidth: number,
): Segment[] {
  const lead = head(p, entry, labelWidth);
  const mark = marker(p, entry, now);
  const quota = entry.quota;
  if (!quota) {
    const qualifier = mark.full ? `${mark.full} ` : "";
    return [{ full: `${lead}${qualifier}${p.dim("5h — · 7d —")}`, priority: Infinity }];
  }
  const segments: Segment[] = [];
  // The marker trails the first window shown (never dropped), spaced like the countdown.
  let trail: Marker = {
    full: mark.full ? ` ${mark.full}` : "",
    compact: mark.compact ? ` ${mark.compact}` : "",
  };
  const windowSegment = (
    label: string,
    window: QuotaWindow | undefined,
    dated: boolean,
    priority: number,
  ) => {
    if (!window) return;
    // Only the first window shown carries the provider's name column.
    const at = segments.length === 0 ? lead : "";
    const pct = p.pctColumn(window.percent);
    const reset = countdown(p, window, now, dated);
    segments.push({
      full: `${at}${p.dim(label)} ${p.bar(window.percent, QUOTA_CELLS)}${BAR_GAP}${pct}${reset}${trail.full}`,
      compact: `${at}${p.dim(label)} ${pct}${reset}${trail.compact}`,
      priority,
    });
    trail = { full: "", compact: "" };
  };
  windowSegment("5h", quota.session, false, Infinity);
  windowSegment("7d", quota.weekly, true, 90);
  if (!quota.session && !quota.weekly)
    segments.push({ full: `${lead}${trail.full}`.trimEnd(), priority: Infinity });

  // The separately metered families (Fable, Spark) bind from every model, so
  // they stay on the line whichever one the session is using, and outrank the
  // 7-day window when the width runs out.
  const extras = extraLimitWindows(quota);
  if (extras.length > 0) {
    const gating = modelWindowFor(quota, modelId);
    const item = (m: (typeof extras)[number]) => {
      const label = m === gating ? p.bold(p.text(m.label)) : p.text(m.label);
      return `${label} ${p.pct(m.percent)}`;
    };
    const all = extras.map(item);
    segments.push({
      full: `${p.dim("(")}${all.join(` ${p.dim("·")} `)}${p.dim(")")}`,
      compact: `${p.dim("(")}${all.join(p.dim("·"))}${p.dim(")")}`,
      priority: 95,
    });
  }
  return segments;
}

/** The terse one-line form compact mode folds onto the session line. */
function terseQuota(
  p: Paint,
  entry: QuotaEntry,
  modelId: string | undefined,
  now: number,
): Segment {
  const { icon, name } = PROVIDER_META[entry.provider];
  const head = `${icon} ${p.dim(name)}`;
  const mark = marker(p, entry, now);
  const quota = entry.quota;
  if (!quota) return { full: `${head} ${mark.full} ${p.dim("—")}`, priority: 40 };
  const pct = (w: QuotaWindow) =>
    level(w.percent, QUOTA_THRESHOLDS) === "ok" ? p.dim(fmtPercent(w.percent)) : p.pct(w.percent);
  const parts: string[] = [];
  const shortParts: string[] = [];
  if (quota.session) {
    parts.push(`${p.dim("5h")} ${pct(quota.session)}`);
    shortParts.push(`${p.dim("5h")} ${pct(quota.session)}`);
  }
  if (quota.weekly) {
    parts.push(`${p.dim("7d")} ${pct(quota.weekly)}`);
    shortParts.push(`${p.dim("7d")} ${pct(quota.weekly)}`);
  }
  const gating = modelWindowFor(quota, modelId);
  for (const extra of extraLimitWindows(quota)) {
    const label = extra === gating ? p.text(extra.label) : p.dim(extra.label);
    const text = `${label} ${pct(extra)}`;
    parts.push(text);
    shortParts.push(text);
  }
  if (mark.full) {
    parts.push(mark.full);
    shortParts.push(mark.compact);
  }
  const sep = ` ${p.dim("·")} `;
  return {
    full: `${head} ${parts.join(sep)}`,
    compact: `${head} ${shortParts.join(sep)}`,
    priority: 40,
  };
}

/** Every provider with a stored entry, the one the session is talking to first. */
function orderedQuotas(snap: Snapshot): QuotaEntry[] {
  const activeId = snap.model?.provider as ProviderId | undefined;
  const active = snap.quotas.find((q) => q.provider === activeId);
  if (!active) return [...snap.quotas];
  return [active, ...snap.quotas.filter((q) => q !== active)];
}

/** The grid's shared label column: the widest of `Context` and the provider names. */
function labelColumnWidth(snap: Snapshot): number {
  return Math.max(
    CONTEXT_LABEL.length,
    ...snap.quotas.map((e) => PROVIDER_META[e.provider].name.length),
  );
}

/** Full mode: one row of segments per provider, labels in the shared column. */
function quotaLines(p: Paint, snap: Snapshot, labelWidth: number): Segment[][] {
  return orderedQuotas(snap).map((entry) =>
    providerQuota(p, entry, snap.model?.id, snap.now, labelWidth),
  );
}

/** Compact mode: every provider terse, folded onto the session line. */
function quotaCompact(p: Paint, snap: Snapshot): Segment[] {
  return orderedQuotas(snap).map((entry) => terseQuota(p, entry, snap.model?.id, snap.now));
}

// ── last line: extension statuses, and the token badge flush right ──────────

function statusLine(statuses: ReadonlyMap<string, string>): Segment[] {
  const known = new Map(STATUS_ICONS);
  const keys = [...statuses.keys()].filter((k) => k !== THEME_STATUS_KEY && statuses.get(k));
  const ordered = [
    ...STATUS_ICONS.map(([k]) => k).filter((k) => keys.includes(k)),
    ...keys.filter((k) => !known.has(k)).sort((a, b) => a.localeCompare(b)),
  ];
  const segments: Segment[] = ordered.map((key, i) => {
    const icon = known.get(key);
    const text = sanitize(statuses.get(key)!);
    return { full: icon ? `${icon} ${text}` : text, priority: 50 - i };
  });
  const theme = statuses.get(THEME_STATUS_KEY);
  if (theme) segments.push({ full: sanitize(theme), priority: 10 });
  return segments;
}

// ── the lines ───────────────────────────────────────────────────────────────

export function renderStatusline(
  theme: Theme,
  width: number,
  snap: Snapshot,
  opts: RenderOptions = { mode: "full", verbose: false },
): string[] {
  const p = new Paint(theme);
  const compact = (segments: Segment[]) =>
    opts.mode === "compact" ? segments.map((s) => ({ ...s, full: s.compact ?? s.full })) : segments;

  const labelWidth = labelColumnWidth(snap);
  const lines: string[] = [layout(compact(whereLine(p, snap, opts)), width)];
  const session = sessionLine(p, snap, opts, labelWidth);
  if (opts.mode === "compact") {
    lines.push(layout(compact([...session, ...quotaCompact(p, snap)]), width));
  } else {
    lines.push(...layoutGrid([session, ...quotaLines(p, snap, labelWidth)], width));
  }
  // The badge owns the bottom-right corner whether or not anything shares the line.
  lines.push(layoutRight(statusLine(snap.statuses), tokenBadge(theme, snap.context), width));
  return lines.filter((line, i) => i === 0 || line.trim().length > 0);
}
