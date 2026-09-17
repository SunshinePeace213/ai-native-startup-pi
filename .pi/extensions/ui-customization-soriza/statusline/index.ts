// The statusline feature: Pi's footer replaced by the emoji statusline (see
// render.ts for the lines). Render is synchronous and reads only cached
// state; the asynchronous parts — the git probe, the two quota polls — run on
// session start, after turns, on model switches, on branch changes and on an
// idle timer, and ask the TUI to redraw only when something changed. Quota
// tokens come from Pi's own auth resolution for the providers the session is
// logged into by OAuth; nothing is read from disk and nothing is persisted.
//
//   /statusline            show the mode
//   /statusline full       where · session · a line per provider (· statuses)
//   /statusline compact    two lines, bars off, every provider terse
//   /statusline verbose    toggle cache read/write totals and the provider id
//   /statusline off | on   restore Pi's footer / bring the statusline back
//   /statusline refresh    poll the quotas now

import type { Api, Model } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import type { TuiHandle } from "../tui";
import { fmtClock } from "./format";
import { equalGit, type GitState, probeGit } from "./git";
import { fromAnthropicHeaders, PROVIDER_META, type ProviderId } from "./quota";
import { FETCHERS, type FetchFn } from "./quota-fetch";
import { IDLE_POLL_MS, QuotaStore } from "./quota-store";
import { type RenderOptions, renderStatusline, type Snapshot, type StatuslineMode } from "./render";
import { sessionStartedAt, usageTotals } from "./stats";

export interface StatuslineDeps {
  fetch?: FetchFn;
  now?: () => number;
  env?: NodeJS.ProcessEnv;
  home?: string;
  agentDir?: string;
}

export interface StatuslineFeature {
  start(ctx: ExtensionContext): Promise<void>;
  afterTurn(ctx: ExtensionContext): Promise<void>;
  afterAgent(ctx: ExtensionContext): Promise<void>;
  onModelSelect(ctx: ExtensionContext): Promise<void>;
  onProviderResponse(headers: Record<string, string>, ctx: ExtensionContext): void;
  shutdown(ctx: ExtensionContext): void;
  register(): void;
}

const PROVIDERS = Object.keys(PROVIDER_META) as ProviderId[];

/** `~`-collapse a directory the way Pi's footer does. */
export function collapseHome(cwd: string, home: string | undefined): string {
  if (!home) return cwd;
  const rel = relative(resolve(home), resolve(cwd));
  const inside = rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
  if (!inside) return cwd;
  return rel === "" ? "~" : `~${sep}${rel}`;
}

/** `compaction.enabled` from the global then the project settings file; absent means on. */
export function autoCompactEnabled(paths: string[]): boolean {
  let enabled = true;
  for (const path of paths) {
    try {
      const json = JSON.parse(readFileSync(path, "utf8")) as {
        compaction?: { enabled?: unknown };
      };
      if (typeof json.compaction?.enabled === "boolean") enabled = json.compaction.enabled;
    } catch {
      // no file, or not JSON: keep what we have
    }
  }
  return enabled;
}

export function createStatusline(
  pi: ExtensionAPI,
  tui: TuiHandle,
  deps: StatuslineDeps = {},
): StatuslineFeature {
  const fetchFn: FetchFn = deps.fetch ?? ((input, init) => fetch(input, init));
  const now = deps.now ?? Date.now;
  const env = deps.env ?? process.env;
  const home = deps.home ?? env.HOME ?? env.USERPROFILE;

  const options: RenderOptions = { mode: "full", verbose: false };
  let enabled = true;
  let installed = false;
  let git: GitState | null = null;
  let autoCompact = true;
  let timer: ReturnType<typeof setInterval> | undefined;
  let latest: ExtensionContext | undefined;

  // ── quota ────────────────────────────────────────────────────────────────

  function oauthModel(ctx: ExtensionContext, provider: ProviderId): Model<Api> | undefined {
    const model = ctx.modelRegistry.getAvailable().find((m) => m.provider === provider);
    return model && ctx.modelRegistry.isUsingOAuth(model) ? model : undefined;
  }

  const store = new QuotaStore({
    now,
    onChange: () => tui.requestRender(),
    fetch: async (provider) => {
      const ctx = latest;
      if (!ctx) return undefined;
      const model = oauthModel(ctx, provider);
      if (!model) return undefined;
      const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
      if (!auth.ok || !auth.apiKey) return { ok: false, reason: "auth" };
      return FETCHERS[provider](auth.apiKey, fetchFn);
    },
  });

  function oauthProviders(ctx: ExtensionContext): ProviderId[] {
    return PROVIDERS.filter((p) => oauthModel(ctx, p) !== undefined);
  }

  async function refreshQuotas(
    ctx: ExtensionContext,
    reason: "start" | "turn" | "timer" | "manual",
    only?: ProviderId,
  ): Promise<void> {
    latest = ctx;
    const providers = oauthProviders(ctx).filter((p) => !only || p === only);
    await Promise.all(providers.map((p) => store.refresh(p, reason)));
  }

  function activeProvider(ctx: ExtensionContext): ProviderId | undefined {
    const provider = ctx.model?.provider;
    return PROVIDERS.includes(provider as ProviderId) ? (provider as ProviderId) : undefined;
  }

  // ── git ──────────────────────────────────────────────────────────────────

  async function refreshGit(ctx: ExtensionContext): Promise<void> {
    const next = await probeGit(ctx.cwd, (command, args, options) =>
      pi.exec(command, args, options),
    );
    if (equalGit(git, next)) return;
    git = next;
    tui.requestRender();
  }

  // ── footer ───────────────────────────────────────────────────────────────

  function snapshot(
    ctx: ExtensionContext,
    footerData: {
      getGitBranch(): string | null;
      getExtensionStatuses(): ReadonlyMap<string, string>;
    },
  ): Snapshot {
    const at = now();
    const entries = ctx.sessionManager.getEntries();
    const started = sessionStartedAt(ctx.sessionManager.getHeader(), entries);
    const usage = ctx.getContextUsage();
    const model = ctx.model;
    const subscription =
      model !== undefined &&
      (model.provider === "kimi-coding" || ctx.modelRegistry.isUsingOAuth(model));
    return {
      cwd: collapseHome(ctx.sessionManager.getCwd(), home),
      git,
      branch: footerData.getGitBranch(),
      sessionName: ctx.sessionManager.getSessionName(),
      model: model
        ? {
            id: model.id,
            provider: model.provider,
            thinking: model.reasoning ? (ctx.thinkingLevel ?? "off") : undefined,
          }
        : undefined,
      clock: fmtClock(new Date(at)),
      // not shown itself; the cost line's burn rate is derived from it
      elapsedMs: started === undefined ? undefined : Math.max(0, at - started),
      context: {
        percent: usage?.percent ?? null,
        tokens: usage?.tokens ?? null,
        window: usage?.contextWindow ?? model?.contextWindow ?? 0,
        auto: autoCompact,
      },
      usage: usageTotals(entries),
      subscription,
      experimental: env.PI_EXPERIMENTAL === "1",
      quotas: store.all(),
      statuses: footerData.getExtensionStatuses(),
      now: at,
    };
  }

  function install(ctx: ExtensionContext): void {
    if (ctx.mode !== "tui" || installed) return;
    installed = true;
    ctx.ui.setFooter((mounted, theme, footerData) => {
      tui.bind(mounted);
      const unsubscribe = footerData.onBranchChange(() => {
        void refreshGit(ctx);
        mounted.requestRender();
      });
      return {
        render: (width: number) =>
          renderStatusline(theme, width, snapshot(ctx, footerData), options),
        invalidate() {},
        dispose() {
          unsubscribe();
          tui.unbind(mounted);
        },
      };
    });
  }

  function restore(ctx: ExtensionContext): void {
    if (!installed) return;
    installed = false;
    ctx.ui.setFooter(undefined);
  }

  function stopTimer(): void {
    if (timer) clearInterval(timer);
    timer = undefined;
  }

  // ── command ──────────────────────────────────────────────────────────────

  async function command(args: string, ctx: ExtensionContext): Promise<void> {
    const word = args.trim().toLowerCase();
    const describe = () =>
      `Statusline: ${enabled ? options.mode : "off"}${options.verbose ? " · verbose" : ""}`;
    switch (word) {
      case "":
        ctx.ui.notify(`${describe()} — /statusline full|compact|verbose|off|on|refresh`, "info");
        return;
      case "full":
      case "compact":
        options.mode = word as StatuslineMode;
        enabled = true;
        install(ctx);
        break;
      case "verbose":
        options.verbose = !options.verbose;
        break;
      case "off":
        enabled = false;
        restore(ctx);
        break;
      case "on":
        enabled = true;
        install(ctx);
        break;
      case "refresh":
        await refreshQuotas(ctx, "manual");
        break;
      default:
        ctx.ui.notify(
          `Unknown option "${word}" — /statusline full|compact|verbose|off|on|refresh`,
          "error",
        );
        return;
    }
    tui.requestRender();
    ctx.ui.notify(describe(), "info");
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  return {
    async start(ctx) {
      latest = ctx;
      if (ctx.mode !== "tui") return;
      autoCompact = autoCompactEnabled([
        join(deps.agentDir ?? getAgentDir(), "settings.json"),
        join(ctx.cwd, ".pi", "settings.json"),
      ]);
      if (enabled) install(ctx);
      stopTimer();
      timer = setInterval(() => {
        if (latest) void refreshQuotas(latest, "timer");
      }, IDLE_POLL_MS);
      timer.unref?.();
      await Promise.all([refreshGit(ctx), refreshQuotas(ctx, "start")]);
    },

    async afterTurn(ctx) {
      latest = ctx;
      if (ctx.mode !== "tui") return;
      await refreshGit(ctx);
    },

    async afterAgent(ctx) {
      latest = ctx;
      if (ctx.mode !== "tui") return;
      await Promise.all([refreshGit(ctx), refreshQuotas(ctx, "turn", activeProvider(ctx))]);
    },

    async onModelSelect(ctx) {
      latest = ctx;
      if (ctx.mode !== "tui") return;
      await refreshQuotas(ctx, "turn", activeProvider(ctx));
    },

    onProviderResponse(headers, ctx) {
      latest = ctx;
      if (activeProvider(ctx) !== "anthropic") return;
      store.mergeWindows("anthropic", fromAnthropicHeaders(headers));
    },

    shutdown(ctx) {
      stopTimer();
      if (ctx.mode !== "tui") return;
      restore(ctx);
    },

    register() {
      pi.registerCommand("statusline", {
        description: "Statusline: full | compact | verbose | off | on | refresh",
        handler: (args, ctx) => command(args, ctx),
      });
    },
  };
}
