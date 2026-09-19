// The artifacts extension wired to the fake Pi on a scratch project: a real
// Bun server started in this process (the same startServer serve.ts runs), the
// pi side pointed at it through a fixed locator, a recording opener instead of
// the browser, a scratch trash directory, and an injectable clock. Tests drive
// the tool as the model would, the HTTP routes as the page would, and read
// what the session was sent and what landed on disk.

import { Core } from "@ext/artifacts/server/core";
import type { Host } from "@ext/artifacts/session/host";
import { type Deps, register, STORE_DIR } from "@ext/artifacts/index";
import { type ArtifactServer, startServer } from "@ext/artifacts/server/http";
import { COOKIE, HEADER, PREFIX } from "@ext/artifacts/shared/protocol";
import { ensureToken } from "@ext/artifacts/shared/record";
import { Store } from "@ext/artifacts/server/store";
import { type Config, DEFAULT_CONFIG } from "@ext/artifacts/shared/types";
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
  /** The port the server asks for; default any free one. */
  port?: number;
  /** Reuse another fixture's project and server: a second session on the same store. */
  share?: Shared;
  session?: string;
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

/** A server over a scratch store, in this process. */
export function serve(options: {
  root: string;
  seed: string;
  trashDir: string;
  port?: number;
  now?: () => Date;
}) {
  const store = new Store(options.root, options.now);
  const core = new Core(store, PREFIX, options.trashDir, options.now);
  const server: ArtifactServer = startServer(core, {
    token: ensureToken(options.root),
    port: options.port ?? -1,
    seed: options.seed,
  });
  return { store, core, server, token: ensureToken(options.root) };
}

export function wire(options: Options = {}) {
  const cwd = options.share?.cwd ?? mkdtempSync(join(tmpdir(), "artifacts-cwd-"));
  const trashDir = options.share?.trashDir ?? mkdtempSync(join(tmpdir(), "artifacts-trash-"));
  const storeRoot = join(cwd, STORE_DIR);
  const opened: string[] = [];
  const config: Config = { ...DEFAULT_CONFIG, ...options.config };
  const backend: Backend =
    options.share?.backend ??
    serve({ root: storeRoot, seed: cwd, trashDir, port: options.port, now: options.now });
  const session = options.session ?? `session-${Math.random().toString(16).slice(2, 8)}`;
  let stopped = false;

  const deps: Deps = {
    config: () => config,
    hostDeps: () => ({
      session,
      locate: async () => ({
        origin: backend.server.origin,
        port: backend.server.port,
        requestedPort: backend.server.requestedPort,
        token: backend.token,
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
  });
  const host: Host = hostFor(cwd);
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
  const token = () => backend.token;
  const origin = () => backend.server.origin;

  /** A request the way the page's runtime makes it: cookie plus header. */
  const page = (path: string, init: RequestInit = {}) =>
    fetch(`${origin()}${path}`, {
      ...init,
      redirect: "manual",
      headers: {
        cookie: `${COOKIE}=${token()}`,
        [HEADER]: token(),
        origin: origin(),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  const pagePublish = (slug: string, base: number, data: Record<string, unknown>) =>
    page(`/a/${slug}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ base_version: base, data }),
    });
  const pageComment = (slug: string, body: Record<string, unknown>) =>
    page(`/a/${slug}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  const feedback = () => fake.sent.filter((s) => s.message.customType === "artifact-feedback");
  /** Waits until the session has received `n` feedback messages, or the timeout passes. */
  const feedbackCount = async (n: number, timeoutMs = 2000) => {
    const deadline = Date.now() + timeoutMs;
    while (feedback().length < n && Date.now() < deadline)
      await new Promise((r) => setTimeout(r, 10));
    return feedback().length;
  };

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
    token,
    origin,
    page,
    pagePublish,
    pageComment,
    feedback,
    feedbackCount,
  };
}

export const QUESTIONS = [
  {
    id: "tiering",
    header: "Pricing",
    question: "Which pricing model first?",
    options: [
      { label: "Usage-based (Recommended)", description: "Matches metering" },
      { label: "Seat-based", description: "Simpler billing" },
    ],
    recommended: 0,
  },
  {
    id: "region",
    question: "Which region bills first?",
    options: [{ label: "EU" }, { label: "US" }],
    dependsOn: { tiering: "Usage-based (Recommended)" },
  },
  { id: "notes", question: "Anything else?", required: false },
];

export const QUESTIONS_ISLAND = { schema: "questions/v1", questions: QUESTIONS, answers: {} };

export const islandScript = (island: unknown) =>
  `<script type="application/json" id="artifact-data">${JSON.stringify(island)}</script>`;

export const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));

/** Reads a fetch body as SSE lines until one `data:` line arrives or the timeout passes. */
export async function firstSseData(response: Response, timeoutMs = 3000): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const chunk = await Promise.race([
      reader.read(),
      new Promise<{ done: true; value: undefined }>((r) =>
        setTimeout(() => r({ done: true, value: undefined }), deadline - Date.now()),
      ),
    ]);
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const m = /^data: (.*)$/m.exec(buffer);
    if (m) {
      await reader.cancel();
      return m[1] ?? null;
    }
  }
  await reader.cancel().catch(() => {});
  return null;
}
