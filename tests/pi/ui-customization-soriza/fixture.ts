// Doubles for the header, picker, and terminal contracts. The theme tags its
// output with the token *and the theme's name* (`<accent:nord>…</accent:nord>`,
// `<b>…</b>`) so a test reads which theme painted what; the UI records every
// setHeader / setTheme / setStatus / setWidget call, mounts the header the way
// Pi does (factory invoked at once), captures the escape sequences written to
// the terminal, and hands the picker's component back so a test can press keys.

import type { ExtensionCommandContext, Theme } from "@earendil-works/pi-coding-agent";
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

export interface UiCtx {
  ctx: ExtensionCommandContext;
  /** Every setHeader argument in order; `undefined` = restore built-in. */
  headers: Array<Factory | undefined>;
  /** The mounted header, as Pi mounts it when setHeader is called. */
  header?: Component & { dispose?(): void };
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
  press(key: string): void;
}

export function createUiCtx(options: {
  cwd: string;
  mode?: "tui" | "rpc" | "print" | "json";
  themes?: Array<{ name: string; path?: string }>;
  active?: string;
}): UiCtx {
  const themes = options.themes ?? [{ name: "dark" }, { name: "light" }];
  const known = new Set(themes.map((t) => t.name));
  let active = tagTheme(options.active ?? themes[0]?.name ?? "dark");
  const mode = options.mode ?? "tui";
  const state: UiCtx = {
    ctx: undefined as unknown as ExtensionCommandContext,
    headers: [],
    status: new Map(),
    notifications: [],
    themeCalls: [],
    widgets: new Map(),
    writes: [],
    renders: 0,
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

  state.ctx = { cwd: options.cwd, mode, hasUI: true, ui } as unknown as ExtensionCommandContext;
  return state;
}

/** A git double answered per subcommand; unknown subcommands exit 1. */
export function gitExec(answers: {
  toplevel?: string;
  origin?: string;
  head?: string;
}): ExecScript {
  const ok = (stdout: string): ExecResult => ({ stdout: `${stdout}\n`, stderr: "", code: 0 });
  const fail: ExecResult = { stdout: "", stderr: "fatal: not a git repository", code: 128 };
  return ({ command, args }: ExecCall) => {
    if (command !== "git") return fail;
    const key = args.join(" ");
    if (key === "rev-parse --show-toplevel") return answers.toplevel ? ok(answers.toplevel) : fail;
    if (key === "remote get-url origin") return answers.origin ? ok(answers.origin) : fail;
    if (key === "rev-parse --abbrev-ref HEAD") return answers.head ? ok(answers.head) : fail;
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
