// The artifacts extension wired to the fake Pi on a scratch project: a real
// Bun server started in this process (the same startServer src/server.ts
// runs), the pi side pointed at it through a fixed locator, a recording
// opener instead of the browser, a scratch trash directory, and an
// injectable clock. Tests drive the tool as the model would, the HTTP routes
// as the page would, and read what the session was sent and what landed on
// disk. A second `wire({ share })` is a second session on the same server.

import { Core } from "@ext/artifacts/src/app/core";
import {
  PAGE_HEADER,
  SESSION_HEADER,
  SESSION_ID_HEADER,
  VIEWER_COOKIE,
} from "@ext/artifacts/src/domain/protocol";
import { type Config, DEFAULT_CONFIG } from "@ext/artifacts/src/domain/types";
import { type ArtifactServer, startServer } from "@ext/artifacts/src/infra/http/server";
import { renderer } from "@ext/artifacts/src/infra/render/shell";
import { ensureToken, ensureViewer } from "@ext/artifacts/src/infra/store/control";
import { Store } from "@ext/artifacts/src/infra/store/store";
import type { Host } from "@ext/artifacts/src/ui/host";
import { type Deps, register, STORE_DIR } from "@ext/artifacts/index";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi } from "@harness/fake-pi";
import { scriptedExec } from "@harness/scripted-exec";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface Options {
  config?: Partial<Config>;
  hasUI?: boolean;
  confirm?: (title: string, message: string) => boolean;
  select?: (title: string, choices: string[]) => string | undefined;
  /** The browser opener's verdict: null opened, a string failed. */
  openResult?: string | null;
  now?: () => Date;
  /** Reuse another fixture's project and server: a second session on the same store. */
  share?: Shared;
  session?: string;
  retentionDays?: number;
}

export type Backend = ReturnType<typeof serve>;

export interface Shared {
  cwd: string;
  trashDir: string;
  backend: Backend;
}

const live: Array<() => void | Promise<void>> = [];

/** Stops every server and stream a test started; call from afterEach. */
export async function stopAll(): Promise<void> {
  while (live.length) await live.pop()?.();
}

/** A server over a scratch store, in this process, on a free port. */
export function serve(options: {
  root: string;
  trashDir: string;
  now?: () => Date;
  retentionDays?: number;
}) {
  const store = new Store(options.root, options.trashDir, options.now);
  const core = new Core(store, renderer, {
    now: options.now,
    retentionDays: options.retentionDays,
  });
  const token = ensureToken(options.root);
  const viewer = ensureViewer(options.root);
  const server: ArtifactServer = startServer(core, { root: options.root, token, viewer, port: 0 });
  return { store, core, server, token, viewer };
}

export function wire(options: Options = {}) {
  const cwd = options.share?.cwd ?? mkdtempSync(join(tmpdir(), "artifacts-cwd-"));
  const trashDir = options.share?.trashDir ?? mkdtempSync(join(tmpdir(), "artifacts-trash-"));
  const storeRoot = join(cwd, STORE_DIR);
  const opened: string[] = [];
  const config: Config = { ...DEFAULT_CONFIG, ...options.config };
  const backend: Backend =
    options.share?.backend ??
    serve({ root: storeRoot, trashDir, now: options.now, retentionDays: options.retentionDays });
  const session = options.session ?? `session-${Math.random().toString(16).slice(2, 8)}`;
  let stopped = false;

  const deps: Deps = {
    config: () => config,
    hostDeps: () => ({
      locate: async () => ({
        origin: backend.server.origin,
        port: backend.server.port,
        token: backend.token,
        viewer: backend.viewer,
      }),
      open: async (url) => {
        opened.push(url);
        return options.openResult ?? null;
      },
      stop: async () => {
        if (!stopped) backend.server.stop();
        stopped = true;
        return true;
      },
      now: options.now,
    }),
  };
  const fake = createFakePi(scriptedExec({}));
  const { hostFor } = register(fake.pi, deps);
  const made = createCtx({
    cwd,
    hasUI: options.hasUI,
    confirm: options.confirm,
    select: options.select,
    session,
  });
  const host: Host = hostFor(cwd, session);
  live.push(async () => {
    await host.shutdown(false);
    if (!options.share && !stopped) backend.server.stop();
  });

  const tool = () => {
    const definition = fake.tools.get("artifact");
    if (!definition) throw new Error("artifact tool was not registered");
    return definition;
  };
  const run = async (params: Record<string, unknown>, signal?: AbortSignal) => {
    const result = await tool().execute("call-1", params, signal, undefined, made.ctx);
    const text = result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
    return { text, details: result.details as Record<string, unknown> | undefined };
  };
  const file = (name: string, content: string) => {
    const path = join(cwd, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content);
    return name;
  };
  const origin = () => backend.server.origin;

  /** A request the way the page's runtime makes it: the viewer cookie, its own origin, its slug. */
  const page = (path: string, slug: string, init: RequestInit = {}) =>
    fetch(`${origin()}${path}`, {
      ...init,
      redirect: "manual",
      headers: {
        cookie: `${VIEWER_COOKIE}=${backend.viewer}`,
        [PAGE_HEADER]: slug,
        origin: origin(),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  const pageRespond = (slug: string, base: number, data: Record<string, unknown>, gesture = true) =>
    page(`/a/${slug}/publish`, slug, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ base_version: base, data, gesture }),
    });
  const pageComment = (slug: string, body: Record<string, unknown>) =>
    page(`/a/${slug}/comments`, slug, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  /** A request the way the pi side makes it: the session token and id. */
  const api = (path: string, init: RequestInit = {}) =>
    fetch(`${origin()}/api${path}`, {
      ...init,
      headers: {
        [SESSION_HEADER]: backend.token,
        [SESSION_ID_HEADER]: session,
        "content-type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      },
    });

  const feedback = () => fake.sent.filter((s) => s.message.customType === "artifact-feedback");
  /** Waits until the session has received `n` feedback messages, or the timeout passes. */
  const feedbackCount = async (n: number, timeoutMs = 2000) => {
    const deadline = Date.now() + timeoutMs;
    while (feedback().length < n && Date.now() < deadline)
      await new Promise((r) => setTimeout(r, 10));
    return feedback().length;
  };
  const sessionStart = (reason = "startup") => fake.emit("session_start", { reason }, made.ctx);

  return {
    cwd,
    trashDir,
    storeRoot,
    config,
    fake,
    ctx: made,
    host,
    backend,
    session,
    opened,
    run,
    file,
    origin,
    page,
    pageRespond,
    pageComment,
    api,
    feedback,
    feedbackCount,
    sessionStart,
  };
}

export const QUESTIONS = [
  {
    id: "tiering",
    header: "Pricing",
    question: "Which pricing model first?",
    options: [
      { label: "Usage-based (Recommended)", description: "Meter and bill" },
      { label: "Seat-based" },
    ],
    recommended: 0,
  },
  { id: "notes", question: "Anything else?", required: false },
];

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
