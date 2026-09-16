// Contract — subscription quota: payloads in, windows out, and when to poll
//
// Q1: Anthropic's usage payload → 5h from `five_hour`, 7d from `seven_day`,
//     per-model weekly windows from `limits[]` (kind weekly_scoped, named by
//     the model's display name, percent 0–100) and from any non-null legacy
//     `seven_day_<model>` key; null buckets yield no window; a family present
//     in both is taken once; `seven_day_oauth_apps` is not a model.
// Q2: Anthropic's response headers → 5h/7d from the unified utilization
//     (a 0–1 fraction) and reset (epoch seconds) headers, case-insensitively;
//     a response without them yields nothing.
// Q3: Codex's usage payload → the window under a day is the session and the
//     one of a day or more the week, whichever slot they sit in; `reset_at`
//     (epoch seconds) or `reset_after_seconds` gives the reset; a
//     model-specific limit in `additional_rate_limits` becomes a per-model
//     window; the plan is carried.
// Q4: the fetchers send the vendor's own request — Anthropic with the OAuth
//     beta header, Codex with the account id read from the token's JWT — and
//     classify every failure: 401/403 → auth, 429 → throttled (retry-after
//     honoured), other non-2xx or a thrown fetch → network, a body that is
//     not the payload → invalid; a Codex token without an account id → auth
//     without any request.
// Q5: the store polls at most once a minute per provider on turns and keeps
//     the last good values through every failure; after a 429 it waits five
//     minutes (doubling to thirty, or retry-after if longer) before polling
//     again; after an auth failure fifteen minutes; a manual refresh skips the
//     minute but not a backoff; a provider without credentials is never
//     stored; concurrent refreshes share one poll; every change notifies once.
// Q6: header-carried windows merge into the stored quota without a poll and
//     clear a previous error.

import { describe, expect, test } from "bun:test";
import {
  fromAnthropicHeaders,
  fromAnthropicUsage,
  fromCodexUsage,
  modelWindowFor,
} from "@ext/ui-customization-soriza/statusline/quota";
import {
  ANTHROPIC_USAGE_URL,
  CODEX_USAGE_URL,
  fetchAnthropicQuota,
  fetchCodexQuota,
  type FetchFn,
} from "@ext/ui-customization-soriza/statusline/quota-fetch";
import { QuotaStore } from "@ext/ui-customization-soriza/statusline/quota-store";

const NOW = Date.parse("2026-09-16T06:32:00Z");
const MIN = 60_000;

const ANTHROPIC_BODY = {
  five_hour: { utilization: 58, resets_at: "2026-09-16T08:46:00Z" },
  seven_day: { utilization: 21, resets_at: "2026-09-20T12:32:00Z" },
  seven_day_opus: null,
  seven_day_sonnet: { utilization: 5, resets_at: "2026-09-20T12:32:00Z" },
  seven_day_oauth_apps: { utilization: 1, resets_at: null },
  limits: [
    {
      kind: "weekly_scoped",
      scope: { model: { display_name: "Fable" } },
      percent: 21,
      resets_at: "2026-09-20T12:32:00Z",
    },
    {
      kind: "weekly_scoped",
      scope: { model: { display_name: "Sonnet" } },
      percent: 6,
      resets_at: "2026-09-20T12:32:00Z",
    },
    { kind: "something_else", percent: 99 },
  ],
};

describe("Q1 anthropic payload", () => {
  test("Q1 5h, 7d, fable and sonnet from limits, no opus (null), no oauth_apps", () => {
    const quota = fromAnthropicUsage(ANTHROPIC_BODY);
    expect(quota.session).toEqual({ percent: 58, resetsAt: Date.parse("2026-09-16T08:46:00Z") });
    expect(quota.weekly).toEqual({ percent: 21, resetsAt: Date.parse("2026-09-20T12:32:00Z") });
    expect(quota.models.map((m) => [m.label, m.percent])).toEqual([
      ["fable", 21],
      ["sonnet", 6], // limits wins over the legacy key's 5
    ]);
  });

  test("Q1 legacy keys alone still yield per-model windows", () => {
    const quota = fromAnthropicUsage({
      five_hour: { utilization: 1, resets_at: null },
      seven_day_opus: { utilization: 12, resets_at: null },
    });
    expect(quota.models).toEqual([{ label: "opus", percent: 12, resetsAt: null }]);
    expect(quota.session).toEqual({ percent: 1, resetsAt: null });
    expect(quota.weekly).toBeUndefined();
  });

  test("Q1 not an object, or nothing recognisable → no windows", () => {
    expect(fromAnthropicUsage(null)).toEqual({ provider: "anthropic", models: [] });
    expect(fromAnthropicUsage({ five_hour: { utilization: "n/a" } }).session).toBeUndefined();
  });

  test("Q1 the window gating a model is matched by family name", () => {
    const quota = fromAnthropicUsage(ANTHROPIC_BODY);
    expect(modelWindowFor(quota, "claude-fable-5-1")?.label).toBe("fable");
    expect(modelWindowFor(quota, "claude-sonnet-5")?.label).toBe("sonnet");
    expect(modelWindowFor(quota, "claude-haiku-4-5")).toBeUndefined();
    expect(modelWindowFor(quota, undefined)).toBeUndefined();
  });
});

describe("Q2 anthropic headers", () => {
  test("Q2 unified headers give both windows, fraction scaled, epoch seconds to ms", () => {
    const windows = fromAnthropicHeaders({
      "Anthropic-Ratelimit-Unified-5h-Utilization": "0.58",
      "anthropic-ratelimit-unified-5h-reset": String(NOW / 1000 + 7200),
      "anthropic-ratelimit-unified-7d-utilization": "0.21",
    });
    expect(windows.session).toEqual({ percent: 58, resetsAt: NOW + 7_200_000 });
    expect(windows.weekly).toEqual({ percent: 21, resetsAt: null });
  });

  test("Q2 no unified headers → nothing", () => {
    expect(fromAnthropicHeaders({ "content-type": "application/json" })).toEqual({});
  });
});

describe("Q3 codex payload", () => {
  test("Q3 primary 5h and secondary 7d with reset_at / reset_after_seconds, plan carried", () => {
    const quota = fromCodexUsage(
      {
        plan_type: "plus",
        rate_limit: {
          primary_window: {
            used_percent: 3,
            limit_window_seconds: 18_000,
            reset_at: NOW / 1000 + 14_400,
          },
          secondary_window: {
            used_percent: 17,
            limit_window_seconds: 604_800,
            reset_after_seconds: 432_000,
          },
        },
      },
      NOW,
    );
    expect(quota.plan).toBe("plus");
    expect(quota.session).toEqual({ percent: 3, resetsAt: NOW + 14_400_000 });
    expect(quota.weekly).toEqual({ percent: 17, resetsAt: NOW + 432_000_000 });
  });

  test("Q3 a lone weekly window in the primary slot is still the week", () => {
    const quota = fromCodexUsage(
      { rate_limit: { primary_window: { used_percent: 40, limit_window_seconds: 604_800 } } },
      NOW,
    );
    expect(quota.session).toBeUndefined();
    expect(quota.weekly).toEqual({ percent: 40, resetsAt: null });
  });

  test("Q3 no durations → slot order stands", () => {
    const quota = fromCodexUsage(
      {
        rate_limit: { primary_window: { used_percent: 1 }, secondary_window: { used_percent: 2 } },
      },
      NOW,
    );
    expect(quota.session?.percent).toBe(1);
    expect(quota.weekly?.percent).toBe(2);
  });

  test("Q3 a Spark limit becomes a per-model weekly window", () => {
    const quota = fromCodexUsage(
      {
        rate_limit: { primary_window: { used_percent: 1 } },
        additional_rate_limits: [
          {
            limit_name: "gpt-5.3-codex-spark",
            rate_limit: {
              primary_window: { used_percent: 9, limit_window_seconds: 18_000 },
              secondary_window: { used_percent: 33, limit_window_seconds: 604_800 },
            },
          },
        ],
      },
      NOW,
    );
    expect(quota.models).toEqual([{ label: "spark", percent: 33, resetsAt: null }]);
  });
});

// ── fetchers ────────────────────────────────────────────────────────────────

interface Call {
  url: string;
  headers: Record<string, string>;
}

function fakeFetch(respond: (call: Call) => Response | Error): { fetch: FetchFn; calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    fetch: async (url, init) => {
      const headers = Object.fromEntries(
        Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [
          k.toLowerCase(),
          v,
        ]),
      );
      const call = { url, headers };
      calls.push(call);
      const out = respond(call);
      if (out instanceof Error) throw out;
      return out;
    },
  };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const jwt = (claims: Record<string, unknown>) =>
  `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
const CODEX_TOKEN = jwt({ "https://api.openai.com/auth": { chatgpt_account_id: "acct_123" } });
const CODEX_BODY = {
  rate_limit: { primary_window: { used_percent: 3 }, secondary_window: { used_percent: 17 } },
};

describe("Q4 fetchers", () => {
  test("Q4 anthropic: bearer token, the oauth beta header, the vendor URL → quota", async () => {
    const { fetch, calls } = fakeFetch(() => json(ANTHROPIC_BODY));
    const result = await fetchAnthropicQuota("tok-abc", fetch);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe(ANTHROPIC_USAGE_URL);
    expect(calls[0]!.headers["authorization"]).toBe("Bearer tok-abc");
    expect(calls[0]!.headers["anthropic-beta"]).toBe("oauth-2025-04-20");
    expect(result).toEqual({ ok: true, quota: fromAnthropicUsage(ANTHROPIC_BODY) });
  });

  test("Q4 codex: bearer token plus the account id from the JWT", async () => {
    const { fetch, calls } = fakeFetch(() => json(CODEX_BODY));
    const result = await fetchCodexQuota(CODEX_TOKEN, fetch, undefined, () => NOW);
    expect(calls[0]!.url).toBe(CODEX_USAGE_URL);
    expect(calls[0]!.headers["authorization"]).toBe(`Bearer ${CODEX_TOKEN}`);
    expect(calls[0]!.headers["chatgpt-account-id"]).toBe("acct_123");
    expect(result.ok).toBe(true);
  });

  test("Q4 codex: a token without an account id → auth, and no request", async () => {
    const { fetch, calls } = fakeFetch(() => json(CODEX_BODY));
    const result = await fetchCodexQuota("not-a-jwt", fetch);
    expect(result).toEqual({ ok: false, reason: "auth" });
    expect(calls).toHaveLength(0);
  });

  const failures: Array<[string, () => Response | Error, string, number | undefined]> = [
    ["401", () => json({}, 401), "auth", undefined],
    ["403", () => json({}, 403), "auth", undefined],
    ["429 with retry-after", () => json({}, 429, { "retry-after": "120" }), "throttled", 120_000],
    ["429 without retry-after", () => json({}, 429), "throttled", undefined],
    ["500", () => json({}, 500), "network", undefined],
    ["fetch throws (timeout)", () => new Error("aborted"), "network", undefined],
    ["200 but not JSON", () => new Response("<html>", { status: 200 }), "invalid", undefined],
    ["200 but no windows", () => json({ unrelated: true }), "invalid", undefined],
  ];
  test.each(failures)("Q4 %s → %s", async (_name, respond, reason, retryAfterMs) => {
    const { fetch } = fakeFetch(respond);
    const result = await fetchAnthropicQuota("tok", fetch);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe(reason as typeof result.reason);
    if (retryAfterMs !== undefined) expect(result.retryAfterMs).toBe(retryAfterMs);
  });
});

// ── store ───────────────────────────────────────────────────────────────────

function makeStore(script: Array<Awaited<ReturnType<FetchFn>> | "no-creds" | Error>) {
  let clock = NOW;
  let polls = 0;
  let changes = 0;
  const responses = [...script];
  const store = new QuotaStore({
    now: () => clock,
    onChange: () => {
      changes += 1;
    },
    fetch: async () => {
      polls += 1;
      const next = responses.shift();
      if (next === undefined) throw new Error("script exhausted");
      if (next === "no-creds") return undefined;
      if (next instanceof Error) return { ok: false, reason: "network" };
      if (next.status === 401) return { ok: false, reason: "auth" };
      if (next.status === 429) return { ok: false, reason: "throttled" };
      return { ok: true, quota: fromAnthropicUsage(await next.json()) };
    },
  });
  return {
    store,
    advance: (ms: number) => {
      clock += ms;
    },
    polls: () => polls,
    changes: () => changes,
  };
}

describe("Q5 store", () => {
  test("Q5 a good poll stores values and blocks a second poll for a minute", async () => {
    const s = makeStore([json(ANTHROPIC_BODY), json(ANTHROPIC_BODY)]);
    await s.store.refresh("anthropic", "start");
    expect(s.store.get("anthropic")?.quota?.session?.percent).toBe(58);
    expect(s.changes()).toBe(1);
    await s.store.refresh("anthropic", "turn");
    expect(s.polls()).toBe(1);
    s.advance(MIN + 1);
    await s.store.refresh("anthropic", "turn");
    expect(s.polls()).toBe(2);
  });

  test("Q5 a 429 keeps the last values, marks the error, waits five minutes then doubles", async () => {
    const s = makeStore([json(ANTHROPIC_BODY), json({}, 429), json({}, 429), json(ANTHROPIC_BODY)]);
    await s.store.refresh("anthropic", "start");
    s.advance(MIN + 1);
    await s.store.refresh("anthropic", "turn");
    const entry = s.store.get("anthropic")!;
    expect(entry.error).toBe("throttled");
    expect(entry.quota?.session?.percent).toBe(58);
    expect(entry.fetchedAt).toBe(NOW);
    s.advance(4 * MIN);
    await s.store.refresh("anthropic", "turn");
    expect(s.polls()).toBe(2); // still inside the five-minute wait
    s.advance(MIN + 1);
    await s.store.refresh("anthropic", "turn");
    expect(s.polls()).toBe(3); // second 429
    s.advance(6 * MIN);
    await s.store.refresh("anthropic", "turn");
    expect(s.polls()).toBe(3); // doubled to ten
    s.advance(5 * MIN);
    await s.store.refresh("anthropic", "turn");
    expect(s.polls()).toBe(4);
    expect(s.store.get("anthropic")?.error).toBeUndefined();
  });

  test("Q5 an auth failure waits fifteen minutes; a manual refresh does not break a backoff", async () => {
    const s = makeStore([json({}, 401), json(ANTHROPIC_BODY)]);
    await s.store.refresh("anthropic", "start");
    expect(s.store.get("anthropic")?.error).toBe("auth");
    s.advance(14 * MIN);
    await s.store.refresh("anthropic", "manual");
    expect(s.polls()).toBe(1);
    s.advance(2 * MIN);
    await s.store.refresh("anthropic", "manual");
    expect(s.polls()).toBe(2);
  });

  test("Q5 a manual refresh skips the minute after a good poll", async () => {
    const s = makeStore([json(ANTHROPIC_BODY), json(ANTHROPIC_BODY)]);
    await s.store.refresh("anthropic", "start");
    s.advance(5_000);
    await s.store.refresh("anthropic", "manual");
    expect(s.polls()).toBe(2);
  });

  test("Q5 no credentials → nothing stored, nothing notified", async () => {
    const s = makeStore(["no-creds"]);
    await s.store.refresh("anthropic", "start");
    expect(s.store.all()).toEqual([]);
    expect(s.changes()).toBe(0);
  });

  test("Q5 concurrent refreshes share one poll", async () => {
    const s = makeStore([json(ANTHROPIC_BODY)]);
    await Promise.all([
      s.store.refresh("anthropic", "start"),
      s.store.refresh("anthropic", "turn"),
      s.store.refresh("anthropic", "timer"),
    ]);
    expect(s.polls()).toBe(1);
  });
});

describe("Q6 header merge", () => {
  test("Q6 windows from headers land without a poll and clear an error", async () => {
    const s = makeStore([json({}, 429)]);
    await s.store.refresh("anthropic", "start");
    expect(s.store.get("anthropic")?.error).toBe("throttled");
    s.store.mergeWindows("anthropic", { session: { percent: 61, resetsAt: null } });
    const entry = s.store.get("anthropic")!;
    expect(entry.error).toBeUndefined();
    expect(entry.quota?.session?.percent).toBe(61);
    expect(entry.fetchedAt).toBe(NOW);
    expect(s.polls()).toBe(1);
    expect(s.changes()).toBe(2);
  });

  test("Q6 empty headers change nothing", () => {
    const s = makeStore([]);
    s.store.mergeWindows("anthropic", {});
    expect(s.store.all()).toEqual([]);
    expect(s.changes()).toBe(0);
  });
});
