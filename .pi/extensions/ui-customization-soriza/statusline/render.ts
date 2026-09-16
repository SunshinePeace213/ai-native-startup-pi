// The statusline's lines, from a snapshot and a width — pure, so every layout
// is testable. Icons carry the meaning, theme tokens carry the state: labels
// and units `dim`, values `text`, the model bold, thinking `accent`; bars and
// percentages go success → warning → error by threshold. Each line is a list
// of prioritised segments that `layout` fits to the width: full forms, then
// compact forms (bars off) from the least important segment up, then drops.
//
//   📁 cwd  🌿 branch ✓|+s ~m ?u ⇡a ⇣b  🔖 session  🤖 model · 🧠 thinking  🕐 clock ⏱️ elapsed
//   🧮 ⛁ ⛁ ⛁ … pct (used/window) auto   📥 in · 📤 out · ⚡ cached   💰 cost sub ($/h)
//   🟠 5h ⛁ ⛁ … pct ⏳reset   7d ⛁ ⛁ … pct ⏳reset (fable · opus · sonnet)   🟢 codex 5h · 7d
//   🏗️ architecture …   📚 wiki …   🎨 theme ██ ██ …

import type { Theme } from "@earendil-works/pi-coding-agent";
import { basename } from "node:path";
import { THEME_STATUS_KEY } from "../theme/status";
import {
  bar,
  CONTEXT_THRESHOLDS,
  fmtCost,
  fmtDuration,
  fmtPercent,
  fmtTokens,
  layout,
  level,
  type Level,
  QUOTA_THRESHOLDS,
  type Segment,
} from "./format";
import { type GitState, isClean } from "./git";
import { modelWindowFor, PROVIDER_META, type ProviderId, type QuotaWindow } from "./quota";
import type { QuotaEntry } from "./quota-store";
import type { UsageTotals } from "./stats";

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
  elapsed: "⏱️",
  context: "🧮",
  input: "📥",
  output: "📤",
  cache: "⚡",
  cost: "💰",
  reset: "⏳",
  stale: "⚠️",
  auth: "🔒",
} as const;

/** Icons for other extensions' statuses, by status key; order is display order. */
export const STATUS_ICONS: ReadonlyArray<[key: string, icon: string]> = [
  ["architecture-sync", "🏗️"],
  ["llm-wiki", "📚"],
];

const CONTEXT_CELLS = 16;
const QUOTA_CELLS = 10;
/** Values older than this without an error are flagged too: the idle poll should have replaced them. */
const STALE_AFTER_MS = 15 * 60_000;

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
  bar = (percent: number, cells: number, thresholds = QUOTA_THRESHOLDS) =>
    bar(
      percent,
      cells,
      { fill: (lvl, s) => this.byLevel(lvl, s), empty: (s) => this.muted(s) },
      "⛁",
      thresholds,
    );
}

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
  const clock = `${ICON.clock} ${p.dim(snap.clock)}`;
  const elapsed =
    snap.elapsedMs !== undefined
      ? ` ${p.dim("·")} ${ICON.elapsed} ${p.dim(fmtDuration(snap.elapsedMs))}`
      : "";
  segments.push({ full: `${clock}${elapsed}`, compact: clock, priority: 30 });
  return segments;
}

// ── line 2: this session ────────────────────────────────────────────────────

function contextSegment(p: Paint, snap: Snapshot): Segment {
  const { percent, tokens, window, auto } = snap.context;
  const pct = percent === null ? p.dim("—") : p.pct(percent, CONTEXT_THRESHOLDS);
  const used = tokens === null ? "—" : fmtTokens(tokens);
  const detail = p.dim(`(${used}/${fmtTokens(window)})`);
  const autoMark = auto ? ` ${p.dim("auto")}` : "";
  const filled = p.bar(percent ?? 0, CONTEXT_CELLS, CONTEXT_THRESHOLDS);
  return {
    full: `${ICON.context} ${filled} ${pct} ${detail}${autoMark}`,
    compact: `${ICON.context} ${pct} ${detail}`,
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

function sessionLine(p: Paint, snap: Snapshot, opts: RenderOptions): Segment[] {
  const segments = [
    contextSegment(p, snap),
    tokensSegment(p, snap.usage, opts.verbose),
    costSegment(p, snap),
  ];
  if (snap.experimental) segments.push({ full: p.bold(p.byLevel("warn", "xp")), priority: 20 });
  return segments;
}

// ── line 3: quota ───────────────────────────────────────────────────────────

function countdown(p: Paint, window: QuotaWindow, now: number): string {
  if (window.resetsAt === null) return "";
  return ` ${ICON.reset} ${p.dim(fmtDuration(window.resetsAt - now))}`;
}

interface Marker {
  full: string;
  compact: string;
}

/**
 * How a provider's values are qualified. With values, the marker trails
 * them (`⚠️ stale 12m`, `🔒`); without, it stands in for them (`🔒 re-login`,
 * `…` while the first fetch is pending). Fresh values carry nothing.
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
  if (entry.error) return entry.quota && age ? stale(age) : same(ICON.stale);
  if (!entry.quota) return same(p.dim("…"));
  if (entry.fetchedAt !== undefined && now - entry.fetchedAt > STALE_AFTER_MS && age)
    return stale(age);
  return same("");
}

function activeQuota(
  p: Paint,
  entry: QuotaEntry,
  modelId: string | undefined,
  now: number,
): Segment[] {
  const { icon } = PROVIDER_META[entry.provider];
  const mark = marker(p, entry, now);
  const quota = entry.quota;
  if (!quota) {
    return [{ full: `${icon} ${mark.full} ${p.dim("5h — · 7d —")}`, priority: Infinity }];
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
    lead: string,
    priority: number,
  ) => {
    if (!window) return;
    const pct = p.pct(window.percent);
    const reset = countdown(p, window, now);
    segments.push({
      full: `${lead}${p.dim(label)} ${p.bar(window.percent, QUOTA_CELLS)} ${pct}${reset}${trail.full}`,
      compact: `${lead}${p.dim(label)} ${pct}${reset}${trail.compact}`,
      priority,
    });
    trail = { full: "", compact: "" };
  };
  windowSegment("5h", quota.session, `${icon} `, Infinity);
  windowSegment("7d", quota.weekly, quota.session ? "" : `${icon} `, 90);
  if (!quota.session && !quota.weekly)
    segments.push({ full: `${icon}${trail.full}`, priority: Infinity });

  if (quota.models.length > 0) {
    const gating = modelWindowFor(quota, modelId);
    const item = (m: (typeof quota.models)[number]) => {
      const own = gating === undefined || m === gating;
      const label = own ? p.text(m.label) : p.dim(m.label);
      const pct = own ? p.pct(m.percent) : p.dim(fmtPercent(m.percent));
      return `${label} ${pct}`;
    };
    const all = quota.models.map(item).join(` ${p.dim("·")} `);
    const first = item(gating ?? quota.models[0]!);
    segments.push({
      full: `${p.dim("(")}${all}${p.dim(")")}`,
      compact: `${p.dim("(")}${first}${p.dim(")")}`,
      priority: 60,
    });
  }
  return segments;
}

function otherQuota(
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
    shortParts.push(pct(quota.session));
  }
  if (quota.weekly) {
    parts.push(`${p.dim("7d")} ${pct(quota.weekly)}`);
    shortParts.push(pct(quota.weekly));
  }
  const gating = modelWindowFor(quota, modelId) ?? quota.models[0];
  if (gating) parts.push(`${p.dim(gating.label)} ${pct(gating)}`);
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

function quotaLine(p: Paint, snap: Snapshot): Segment[] {
  if (snap.quotas.length === 0) return [];
  const activeId = snap.model?.provider as ProviderId | undefined;
  const active = snap.quotas.find((q) => q.provider === activeId) ?? snap.quotas[0]!;
  const segments = activeQuota(p, active, snap.model?.id, snap.now);
  for (const entry of snap.quotas) {
    if (entry === active) continue;
    segments.push(otherQuota(p, entry, snap.model?.id, snap.now));
  }
  return segments;
}

// ── line 4: extension statuses ──────────────────────────────────────────────

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

  const lines: string[] = [layout(compact(whereLine(p, snap, opts)), width)];
  const session = sessionLine(p, snap, opts);
  const quota = quotaLine(p, snap);
  if (opts.mode === "compact") {
    lines.push(layout(compact([...session, ...quota]), width));
  } else {
    lines.push(layout(session, width));
    if (quota.length > 0) lines.push(layout(quota, width));
  }
  const statuses = statusLine(snap.statuses);
  if (statuses.length > 0) lines.push(layout(statuses, width));
  return lines.filter((line, i) => i === 0 || line.length > 0);
}
