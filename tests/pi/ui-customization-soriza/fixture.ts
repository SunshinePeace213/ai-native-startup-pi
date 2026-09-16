// Doubles for the header, picker, terminal, and statusline contracts. The
// theme tags its output with the token *and the theme's name*
// (`<accent:nord>…</accent:nord>`, `<b>…</b>`) so a test reads which theme
// painted what; the UI records every setHeader / setFooter / setTheme /
// setStatus / setWidget call, mounts header and footer the way Pi does
// (factory invoked at once), captures the escape sequences written to the
// terminal, and hands the picker's component back so a test can press keys.
// The context carries a session (entries, name, cwd), a model with its auth
// mode, and a context-usage reading — everything the statusline snapshots.

import type { Api, AssistantMessage, Model } from "@earendil-works/pi-ai";
import type {
  ContextUsage,
  ExtensionCommandContext,
  SessionEntry,
  Theme,
} from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";
import type { ExecCall, ExecResult, ExecScript } from "@harness/fake-pi";

export type TagTheme = Theme & { readonly name: string };

export function tagTheme(name: string): TagTheme {
  return {
    name,
    fg: (token: string, text: string) => `<${token}:${name}>${text}</${token}:${name}>`,
    bg: (token: string, text: string) => `<bg-${token}:${name}>${text}</bg-${token}:${name}>`,
    bold: (text: string) => `<b>${text}</b>`,
    italic: (text: string) => `<i>${text}</i>`,
  } as unknown as TagTheme;
}

export const strip = (s: string) => s.replace(/<\/?[a-zA-Z:.-]+>/g, "");

type Factory = (tui: unknown, theme: Theme) => Component & { dispose?(): void };
type FooterFactory = (
  tui: unknown,
  theme: Theme,
  footerData: FooterData,
) => Component & { dispose?(): void };

interface FooterData {
  getGitBranch(): string | null;
  getExtensionStatuses(): ReadonlyMap<string, string>;
  getAvailableProviderCount(): number;
  onBranchChange(cb: () => void): () => void;
}

export interface UiModel {
  id: string;
  provider: string;
  reasoning?: boolean;
  contextWindow?: number;
  /** Logged in by OAuth (subscription) rather than an API key. */
  oauth?: boolean;
  /** The access token Pi's auth resolution hands back. */
  token?: string;
}

export interface UiCtxOptions {
  cwd: string;
  mode?: "tui" | "rpc" | "print" | "json";
  themes?: Array<{ name: string; path?: string }>;
  active?: string;
  entries?: SessionEntry[];
  /** ISO timestamp of the session header. */
  startedAt?: string;
  sessionName?: string;
  model?: UiModel;
  /** Other models the registry knows, so a provider can be OAuth-backed without being active. */
  models?: UiModel[];
  thinkingLevel?: string;
  contextUsage?: ContextUsage;
  branch?: string | null;
}

export interface UiCtx {
  ctx: ExtensionCommandContext;
  /** Every setHeader argument in order; `undefined` = restore built-in. */
  headers: Array<Factory | undefined>;
  /** The mounted header, as Pi mounts it when setHeader is called. */
  header?: Component & { dispose?(): void };
  /** Every setFooter argument in order; `undefined` = restore built-in. */
  footers: Array<FooterFactory | undefined>;
  /** The mounted footer. */
  footer?: Component & { dispose?(): void };
  status: Map<string, string | undefined>;
  notifications: Array<{ message: string; type: string }>;
  /** Every setTheme call: a name persists, an instance is a preview. */
  themeCalls: Array<{ kind: "name" | "instance"; name: string }>;
  /** Widgets by key: the rendered lines, or undefined once cleared. */
  widgets: Map<string, string[] | undefined>;
  /** Raw bytes written to tui.terminal, one entry per write. */
  writes: string[];
  /** Number of tui.requestRender() calls. */
  renders: number;
  /** The picker component, once `/theme` has opened it. */
  picker?: Component;
  /** Mutable session state the context reads live. */
  session: { entries: SessionEntry[]; name?: string; startedAt?: string };
  model?: UiModel;
  contextUsage?: ContextUsage;
  /** Pi's own branch reading; `fireBranchChange` notifies footer subscribers. */
  branch: string | null;
  fireBranchChange(): void;
  press(key: string): void;
}

export function createUiCtx(options: UiCtxOptions): UiCtx {
  const themes = options.themes ?? [{ name: "dark" }, { name: "light" }];
  const known = new Set(themes.map((t) => t.name));
  let active = tagTheme(options.active ?? themes[0]?.name ?? "dark");
  const mode = options.mode ?? "tui";
  const branchListeners: Array<() => void> = [];
  const state: UiCtx = {
    ctx: undefined as unknown as ExtensionCommandContext,
    headers: [],
    footers: [],
    status: new Map(),
    notifications: [],
    themeCalls: [],
    widgets: new Map(),
    writes: [],
    renders: 0,
    session: {
      entries: options.entries ?? [],
      name: options.sessionName,
      startedAt: options.startedAt,
    },
    model: options.model,
    contextUsage: options.contextUsage,
    branch: options.branch ?? null,
    fireBranchChange() {
      for (const cb of branchListeners) cb();
    },
    press(key: string) {
      if (!state.picker?.handleInput) throw new Error("picker is not open");
      state.picker.handleInput(key);
    },
  };
  const tui = {
    requestRender: () => {
      state.renders += 1;
    },
    terminal: {
      write: (data: string) => {
        state.writes.push(data);
      },
    },
  };
  const footerData: FooterData = {
    getGitBranch: () => state.branch,
    getExtensionStatuses: () => {
      const map = new Map<string, string>();
      for (const [key, text] of state.status) if (text !== undefined) map.set(key, text);
      return map;
    },
    getAvailableProviderCount: () => 1,
    onBranchChange(cb) {
      branchListeners.push(cb);
      return () => {
        const i = branchListeners.indexOf(cb);
        if (i >= 0) branchListeners.splice(i, 1);
      };
    },
  };

  const ui = {
    get theme() {
      return active;
    },
    notify(message: string, type = "info") {
      state.notifications.push({ message, type });
    },
    setStatus(key: string, text: string | undefined) {
      state.status.set(key, text);
    },
    setHeader(factory: Factory | undefined) {
      state.headers.push(factory);
      state.header?.dispose?.();
      state.header = factory ? factory(tui, active) : undefined;
    },
    setFooter(factory: FooterFactory | undefined) {
      state.footers.push(factory);
      state.footer?.dispose?.();
      state.footer = factory ? factory(tui, active, footerData) : undefined;
    },
    setWidget(key: string, content: string[] | Factory | undefined) {
      if (content === undefined) state.widgets.set(key, undefined);
      else if (Array.isArray(content)) state.widgets.set(key, content);
      else state.widgets.set(key, content(tui, active).render(400));
    },
    getAllThemes: () => (mode === "rpc" ? [] : themes.map((t) => ({ ...t }))),
    getTheme: (name: string) => (known.has(name) ? tagTheme(name) : undefined),
    setTheme(themeOrName: string | TagTheme) {
      if (typeof themeOrName === "string") {
        if (!known.has(themeOrName))
          return { success: false, error: `Unknown theme: ${themeOrName}` };
        active = tagTheme(themeOrName);
        state.themeCalls.push({ kind: "name", name: themeOrName });
        return { success: true };
      }
      active = themeOrName;
      state.themeCalls.push({ kind: "instance", name: themeOrName.name });
      return { success: true };
    },
    custom<T>(
      factory: (tui: unknown, theme: Theme, kb: unknown, done: (r: T) => void) => Component,
    ): Promise<T> {
      return new Promise<T>((resolve) => {
        state.picker = factory(tui, active, {}, resolve);
      });
    },
  };

  const toModel = (m: UiModel): Model<Api> =>
    ({
      id: m.id,
      provider: m.provider,
      reasoning: m.reasoning ?? false,
      contextWindow: m.contextWindow ?? 200_000,
    }) as unknown as Model<Api>;
  const registryModels = () =>
    [state.model, ...(options.models ?? [])].filter((m): m is UiModel => !!m);
  const modelRegistry = {
    getAvailable: () => registryModels().map(toModel),
    isUsingOAuth: (model: Model<Api>) =>
      registryModels().find((m) => m.provider === model.provider && m.id === model.id)?.oauth ===
      true,
    async getApiKeyAndHeaders(model: Model<Api>) {
      const found = registryModels().find(
        (m) => m.provider === model.provider && m.id === model.id,
      );
      return found?.token ? { ok: true, apiKey: found.token } : { ok: false, error: "no auth" };
    },
  };
  const sessionManager = {
    getCwd: () => options.cwd,
    getEntries: () => [...state.session.entries],
    getHeader: () =>
      state.session.startedAt
        ? { type: "session", id: "s", timestamp: state.session.startedAt, cwd: options.cwd }
        : null,
    getSessionName: () => state.session.name,
  };

  state.ctx = {
    cwd: options.cwd,
    mode,
    hasUI: true,
    ui,
    sessionManager,
    modelRegistry,
    get model() {
      return state.model ? toModel(state.model) : undefined;
    },
    thinkingLevel: options.thinkingLevel,
    getContextUsage: () => state.contextUsage,
  } as unknown as ExtensionCommandContext;
  return state;
}

/** An assistant message entry carrying the given usage. */
export function assistantEntry(
  usage: { input: number; output: number; cacheRead?: number; cacheWrite?: number; cost?: number },
  timestamp = "2026-09-16T06:00:00.000Z",
): SessionEntry {
  const message = {
    role: "assistant",
    content: [],
    usage: {
      input: usage.input,
      output: usage.output,
      cacheRead: usage.cacheRead ?? 0,
      cacheWrite: usage.cacheWrite ?? 0,
      totalTokens: usage.input + usage.output + (usage.cacheRead ?? 0) + (usage.cacheWrite ?? 0),
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: usage.cost ?? 0 },
    },
  } as unknown as AssistantMessage;
  return {
    type: "message",
    id: `m-${timestamp}`,
    parentId: null,
    timestamp,
    message,
  } as SessionEntry;
}

/** A git double answered per subcommand; unknown subcommands exit 1. */
export function gitExec(answers: {
  toplevel?: string;
  origin?: string;
  head?: string;
  /** Raw `git status --porcelain=v2 --branch` output. */
  status?: string;
}): ExecScript {
  const ok = (stdout: string): ExecResult => ({ stdout: `${stdout}\n`, stderr: "", code: 0 });
  const fail: ExecResult = { stdout: "", stderr: "fatal: not a git repository", code: 128 };
  return ({ command, args }: ExecCall) => {
    if (command !== "git") return fail;
    const key = args.join(" ");
    if (key === "rev-parse --show-toplevel") return answers.toplevel ? ok(answers.toplevel) : fail;
    if (key === "remote get-url origin") return answers.origin ? ok(answers.origin) : fail;
    if (key === "rev-parse --abbrev-ref HEAD") return answers.head ? ok(answers.head) : fail;
    if (args[0] === "status") return answers.status !== undefined ? ok(answers.status) : fail;
    return fail;
  };
}

export const KEY = {
  down: "\x1b[B",
  up: "\x1b[A",
  enter: "\r",
  esc: "\x1b",
  altT: "\x1bt",
  altDot: "\x1b.",
  altComma: "\x1b,",
} as const;
