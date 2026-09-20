// The artifacts extension wired to the fake Pi on a scratch project: a real
// Bun server started in this process (the same startServer src/server.ts
// runs), the pi side pointed at it through a fixed locator, a recording
// opener instead of the browser, a scratch trash directory, and an
// injectable clock. Tests drive the two tools as the model would, the HTTP routes
// as the viewer shell and a page's frame would, and read what the session was
// sent and what landed on disk. A second `wire({ share })` is a second
// session on the same server.

import { Core } from "@ext/artifacts/src/app/core";
import {
  BIND,
  frameHost,
  framePath,
  SESSION_HEADER,
  SESSION_ID_HEADER,
  VIEWER_COOKIE,
} from "@ext/artifacts/src/domain/protocol";
import { type Config, DEFAULT_CONFIG, type Isolation } from "@ext/artifacts/src/domain/types";
import { type ArtifactServer, startServer } from "@ext/artifacts/src/infra/http/server";
import { renderer } from "@ext/artifacts/src/infra/render/document";
import { ensureToken, ensureViewer } from "@ext/artifacts/src/infra/store/control";
import { Store } from "@ext/artifacts/src/infra/store/store";
import type { Host } from "@ext/artifacts/src/ui/host";
import { type Deps, register, STORE_DIR } from "@ext/artifacts/index";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi } from "@harness/fake-pi";
import { scriptedExec } from "@harness/scripted-exec";
import { createHmac } from "node:crypto";
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
  isolation?: Isolation;
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
  isolation?: Isolation;
}) {
  const store = new Store(options.root, options.trashDir, options.now);
  const core = new Core(store, renderer, {
    now: options.now,
    retentionDays: options.retentionDays,
  });
  const token = ensureToken(options.root);
  const viewer = ensureViewer(options.root);
  const server: ArtifactServer = startServer(core, {
    root: options.root,
    token,
    viewer,
    port: 0,
    isolation: options.isolation,
  });
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
    serve({
      root: storeRoot,
      trashDir,
      now: options.now,
      retentionDays: options.retentionDays,
      isolation: options.isolation,
    });
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

  /** Runs a registered tool as the model would call it. */
  const runner =
    (name: string) => async (params: Record<string, unknown>, signal?: AbortSignal) => {
      const definition = fake.tools.get(name);
      if (!definition) throw new Error(`the ${name} tool was not registered`);
      const result = await definition.execute("call-1", params, signal, undefined, made.ctx);
      const text = result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
      return { text, details: result.details as Record<string, unknown> | undefined };
    };
  const run = runner("artifact");
  const runData = runner("artifact_data");
  const file = (name: string, content: string) => {
    const path = join(cwd, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content);
    return name;
  };
  const origin = () => backend.server.origin;

  /** A request the way the viewer shell makes it: the viewer cookie and the shell host's own Origin. */
  const shell = (path: string, init: RequestInit = {}) =>
    fetch(`${origin()}${path}`, {
      ...init,
      redirect: "manual",
      headers: {
        cookie: `${VIEWER_COOKIE}=${backend.viewer}`,
        origin: origin(),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  const shellPost = (path: string, body: Record<string, unknown> = {}) =>
    shell(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  /** The reply the shell posts for a page, and a comment from its panel. */
  const pageRespond = (slug: string, base: number, data: Record<string, unknown>, gesture = true) =>
    shellPost(`/a/${slug}/publish`, { base_version: base, data, gesture });
  const pageComment = (slug: string, body: Record<string, unknown>) =>
    shellPost(`/a/${slug}/comments`, body);
  /** The path capability of a slug's frame, as the contract defines it. */
  const cap = (slug: string) =>
    createHmac("sha256", backend.viewer).update(slug).digest("hex").slice(0, 32);
  /**
   * A request to a page's own origin, <slug>.localhost. It goes to the loopback address with
   * that Host, so no test depends on how this machine resolves *.localhost. No cookie: a frame has none.
   */
  const frame = (slug: string, path: string, init: RequestInit = {}) =>
    fetch(`http://${BIND}:${backend.server.port}${path}`, {
      ...init,
      redirect: "manual",
      headers: {
        host: frameHost(slug, backend.server.port),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  /** The stored document of one version, fetched the way the shell's iframe does. */
  const document = async (slug: string, version: number) =>
    (await frame(slug, framePath(cap(slug), version))).text();
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
    runData,
    file,
    origin,
    shell,
    shellPost,
    pageRespond,
    pageComment,
    cap,
    frame,
    document,
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
    options: [{ label: "Usage-based", description: "Meter and bill" }, { label: "Seat-based" }],
    recommended: 0,
  },
  { id: "notes", question: "Anything else?", required: false },
];

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
