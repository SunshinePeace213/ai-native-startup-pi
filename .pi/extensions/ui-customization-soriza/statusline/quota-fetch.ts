// The two usage requests. Both endpoints are undocumented and both are what
// the vendors' own clients call: Anthropic's needs the OAuth beta header,
// Codex's needs the ChatGPT account id that rides inside the access token's
// JWT claims. Tokens arrive from Pi's own auth resolution and are used only in
// memory. Every failure is classified so the store can back off sensibly:
// `auth` (re-login), `throttled` (429, honour retry-after), `network`
// (timeout, DNS, 5xx), `invalid` (a body that is not the payload).

import { fromAnthropicUsage, fromCodexUsage, type ProviderId, type ProviderQuota } from "./quota";

export type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

export type QuotaResult =
  | { ok: true; quota: ProviderQuota }
  | {
      ok: false;
      reason: "auth" | "throttled" | "network" | "invalid";
      retryAfterMs?: number;
      /** The HTTP status when a response came back at all; absent for a thrown fetch. */
      status?: number;
    };

export const ANTHROPIC_USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
export const CODEX_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
/**
 * Both endpoints answer in well under a second when healthy, but they sit
 * behind the vendors' edges: 5 s was tight enough that an ordinary slow hop
 * read as a network failure and emptied the meter for the whole backoff.
 */
export const USAGE_TIMEOUT_MS = 10_000;

/** Where each provider's usage is read from — shown by `/statusline debug`. */
export const USAGE_URL: Record<ProviderId, string> = {
  anthropic: ANTHROPIC_USAGE_URL,
  "openai-codex": CODEX_USAGE_URL,
};

const JWT_CLAIM = "https://api.openai.com/auth";

/** The `chatgpt_account_id` claim of a Codex access token, or null. */
export function accountIdFromJwt(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as unknown;
    if (typeof payload !== "object" || payload === null) return null;
    const claim = (payload as Record<string, unknown>)[JWT_CLAIM];
    if (typeof claim !== "object" || claim === null) return null;
    const id = (claim as Record<string, unknown>)["chatgpt_account_id"];
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

function retryAfterMs(response: Response): number | undefined {
  const header = response.headers.get("retry-after");
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

async function request(
  fetchFn: FetchFn,
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal | undefined,
  parse: (body: unknown) => ProviderQuota,
): Promise<QuotaResult> {
  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "GET",
      headers: { Accept: "application/json", ...headers },
      signal: signal ?? AbortSignal.timeout(USAGE_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "network" };
  }
  const status = response.status;
  if (status === 401 || status === 403) return { ok: false, reason: "auth", status };
  if (status === 429)
    return { ok: false, reason: "throttled", retryAfterMs: retryAfterMs(response), status };
  if (!response.ok) return { ok: false, reason: "network", status };
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, reason: "invalid", status };
  }
  const quota = parse(body);
  if (!quota.session && !quota.weekly && quota.models.length === 0)
    return { ok: false, reason: "invalid", status };
  return { ok: true, quota };
}

export function fetchAnthropicQuota(
  token: string,
  fetchFn: FetchFn,
  signal?: AbortSignal,
): Promise<QuotaResult> {
  return request(
    fetchFn,
    ANTHROPIC_USAGE_URL,
    { Authorization: `Bearer ${token}`, "anthropic-beta": "oauth-2025-04-20" },
    signal,
    fromAnthropicUsage,
  );
}

export function fetchCodexQuota(
  token: string,
  fetchFn: FetchFn,
  signal?: AbortSignal,
  now: () => number = Date.now,
): Promise<QuotaResult> {
  const accountId = accountIdFromJwt(token);
  if (!accountId) return Promise.resolve({ ok: false, reason: "auth" });
  return request(
    fetchFn,
    CODEX_USAGE_URL,
    { Authorization: `Bearer ${token}`, "ChatGPT-Account-Id": accountId },
    signal,
    (body) => fromCodexUsage(body, now()),
  );
}

export const FETCHERS: Record<
  ProviderId,
  (token: string, fetchFn: FetchFn, signal?: AbortSignal) => Promise<QuotaResult>
> = {
  anthropic: fetchAnthropicQuota,
  "openai-codex": fetchCodexQuota,
};
