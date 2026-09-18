// Subscription quota, one shape for every provider: a 5-hour session window,
// a 7-day window, and per-model weekly windows where the plan has them. The
// normalisers below read the two undocumented usage payloads (Anthropic's
// `/api/oauth/usage`, Codex's `/backend-api/wham/usage`) and the rate-limit
// headers Anthropic attaches to every response; unknown or malformed fields
// yield no window rather than a wrong one.

export type ProviderId = "anthropic" | "openai-codex";

export interface QuotaWindow {
  /** 0–100, as the provider reports it. */
  percent: number;
  /** Epoch ms when the window resets; null when the provider gives none. */
  resetsAt: number | null;
}

export interface ModelWindow extends QuotaWindow {
  /** Lower-case model family: fable · opus · sonnet · spark. */
  label: string;
}

export interface ProviderQuota {
  provider: ProviderId;
  session?: QuotaWindow;
  weekly?: QuotaWindow;
  /** Per-model weekly windows, in the provider's order. */
  models: ModelWindow[];
  plan?: string;
}

/** `name` is the display label on the quota lines, padded into a column. */
export const PROVIDER_META: Record<ProviderId, { icon: string; name: string }> = {
  anthropic: { icon: "🟠", name: "Claude" },
  "openai-codex": { icon: "🟢", name: "OpenAI" },
};

/**
 * The families a plan meters on their own, beyond the shared 5h/7d windows:
 * Anthropic's Fable weekly allowance and Codex's Spark. Opus and Sonnet ride
 * the subscription's own 7-day window, so their per-model entries only repeat
 * a figure the line already carries.
 */
export const EXTRA_LIMIT_MODELS: Record<ProviderId, readonly string[]> = {
  anthropic: ["fable"],
  "openai-codex": ["spark"],
};

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const num = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const isoToMs = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
};

// ── Anthropic ───────────────────────────────────────────────────────────────

function anthropicWindow(
  value: unknown,
  percentKey: "utilization" | "percent",
): QuotaWindow | undefined {
  if (!isObject(value)) return undefined;
  const percent = num(value[percentKey]);
  if (percent === undefined) return undefined;
  return { percent, resetsAt: isoToMs(value["resets_at"]) };
}

/**
 * `five_hour` → session, `seven_day` → weekly. Per-model weekly windows come
 * from `limits[]` entries of kind `weekly_scoped` (named by
 * `scope.model.display_name`, percent in `percent`) and, for older payloads,
 * the top-level `seven_day_<model>` keys — which newer payloads return as
 * null. A family present in both is taken once, from `limits`.
 */
export function fromAnthropicUsage(body: unknown): ProviderQuota {
  const quota: ProviderQuota = { provider: "anthropic", models: [] };
  if (!isObject(body)) return quota;
  quota.session = anthropicWindow(body["five_hour"], "utilization");
  quota.weekly = anthropicWindow(body["seven_day"], "utilization");

  const seen = new Set<string>();
  const limits = body["limits"];
  if (Array.isArray(limits)) {
    for (const entry of limits) {
      if (!isObject(entry) || entry["kind"] !== "weekly_scoped") continue;
      const scope = entry["scope"];
      const model = isObject(scope) ? scope["model"] : undefined;
      const name = isObject(model) ? model["display_name"] : undefined;
      if (typeof name !== "string" || name.trim() === "") continue;
      const window = anthropicWindow(entry, "percent");
      if (!window) continue;
      const label = name.trim().toLowerCase();
      if (seen.has(label)) continue;
      seen.add(label);
      quota.models.push({ label, ...window });
    }
  }
  for (const key of Object.keys(body)) {
    const match = /^seven_day_(?!oauth_apps$)([a-z0-9]+)$/.exec(key);
    if (!match) continue;
    const label = match[1]!;
    if (seen.has(label)) continue;
    const window = anthropicWindow(body[key], "utilization");
    if (!window) continue;
    seen.add(label);
    quota.models.push({ label, ...window });
  }
  return quota;
}

/**
 * The `anthropic-ratelimit-unified-{5h,7d}-{utilization,reset}` headers every
 * Anthropic response carries: utilization is a 0–1 fraction, reset an epoch in
 * seconds. Returns only the windows the headers actually name.
 */
export function fromAnthropicHeaders(
  headers: Record<string, string>,
): Pick<ProviderQuota, "session" | "weekly"> {
  const lower: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) lower[key.toLowerCase()] = value;
  const read = (claim: "5h" | "7d"): QuotaWindow | undefined => {
    const fraction = num(lower[`anthropic-ratelimit-unified-${claim}-utilization`]);
    if (fraction === undefined) return undefined;
    const reset = num(lower[`anthropic-ratelimit-unified-${claim}-reset`]);
    return {
      percent: fraction <= 1 ? Math.round(fraction * 10_000) / 100 : fraction,
      resetsAt: reset === undefined ? null : reset * 1000,
    };
  };
  const out: Pick<ProviderQuota, "session" | "weekly"> = {};
  const session = read("5h");
  const weekly = read("7d");
  if (session) out.session = session;
  if (weekly) out.weekly = weekly;
  return out;
}

// ── OpenAI Codex ────────────────────────────────────────────────────────────

const HOURS = 3600;
const DAY = 24 * HOURS;

function codexWindow(
  value: unknown,
  now: number,
): (QuotaWindow & { seconds?: number }) | undefined {
  if (!isObject(value)) return undefined;
  const percent = num(value["used_percent"]);
  if (percent === undefined) return undefined;
  const resetAt = num(value["reset_at"]);
  const resetAfter = num(value["reset_after_seconds"]);
  const resetsAt =
    resetAt !== undefined
      ? resetAt * 1000
      : resetAfter !== undefined
        ? now + resetAfter * 1000
        : null;
  return { percent, resetsAt, seconds: num(value["limit_window_seconds"]) };
}

type Kind = "session" | "weekly";

/** A window shorter than a day is the session; a day or longer is weekly. */
function kindOf(seconds: number | undefined, fallback: Kind): Kind {
  if (seconds === undefined) return fallback;
  return seconds < DAY ? "session" : "weekly";
}

/**
 * `rate_limit.primary_window` is normally the 5-hour window and
 * `secondary_window` the weekly one, but Codex can move a lone weekly limit
 * into the primary slot, so each is classified by `limit_window_seconds`
 * when present. Model-specific limits (`additional_rate_limits[]`, e.g.
 * Spark) contribute their weekly window as a per-model entry.
 */
export function fromCodexUsage(body: unknown, now: number): ProviderQuota {
  const quota: ProviderQuota = { provider: "openai-codex", models: [] };
  if (!isObject(body)) return quota;
  const plan = body["plan_type"];
  if (typeof plan === "string" && plan) quota.plan = plan;

  const assign = (rateLimit: unknown, target: { session?: QuotaWindow; weekly?: QuotaWindow }) => {
    if (!isObject(rateLimit)) return;
    const candidates: Array<{ window: QuotaWindow; kind: Kind }> = [];
    const primary = codexWindow(rateLimit["primary_window"], now);
    const secondary = codexWindow(rateLimit["secondary_window"], now);
    if (primary) candidates.push({ window: primary, kind: kindOf(primary.seconds, "session") });
    if (secondary)
      candidates.push({ window: secondary, kind: kindOf(secondary.seconds, "weekly") });
    for (const { window, kind } of candidates) {
      const { percent, resetsAt } = window;
      if (kind === "session" && !target.session) target.session = { percent, resetsAt };
      else if (kind === "weekly" && !target.weekly) target.weekly = { percent, resetsAt };
    }
  };

  assign(body["rate_limit"], quota);

  const extra = body["additional_rate_limits"];
  if (Array.isArray(extra)) {
    for (const entry of extra) {
      if (!isObject(entry)) continue;
      const name = [entry["limit_name"], entry["metered_feature"]].find(
        (v): v is string => typeof v === "string" && v.trim() !== "",
      );
      if (!name) continue;
      const windows: { session?: QuotaWindow; weekly?: QuotaWindow } = {};
      assign(entry["rate_limit"] ?? entry, windows);
      const weekly = windows.weekly ?? windows.session;
      if (!weekly) continue;
      const label = /spark/i.test(name) ? "spark" : name.trim().toLowerCase();
      if (quota.models.some((m) => m.label === label)) continue;
      quota.models.push({ label, ...weekly });
    }
  }
  return quota;
}

/**
 * The per-model windows worth a place on the line: the separately metered
 * families, in the provider's order, whatever model the session is using.
 * A limit that exists is a limit that binds, so it is shown from every model.
 */
export function extraLimitWindows(quota: ProviderQuota): ModelWindow[] {
  const wanted = EXTRA_LIMIT_MODELS[quota.provider] ?? [];
  return quota.models.filter((m) => wanted.some((family) => m.label.includes(family)));
}

/** The per-model window that gates `modelId`, matched by family name. */
export function modelWindowFor(
  quota: ProviderQuota,
  modelId: string | undefined,
): ModelWindow | undefined {
  if (!modelId) return undefined;
  const id = modelId.toLowerCase();
  return quota.models.find((m) => id.includes(m.label));
}
