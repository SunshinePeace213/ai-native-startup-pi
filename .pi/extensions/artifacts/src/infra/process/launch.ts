// Finding or starting the server process from the pi side. Plain Node APIs
// only: this file runs inside pi. The port policy is fixed: the configured
// port (5834) is the only one ever bound. What answers there decides:
//
//   our server (same root)        attach — whichever session started it
//   an artifact server, other root refuse, naming the root and pid
//   another program               refuse, naming the port
//   nothing                       spawn, under a lock so two sessions starting
//                                 together start one server
//
// The server is spawned detached with its output in .server/server.log, so
// it survives the session.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DISPLAY } from "../../domain/protocol";
import type { Health, ServerRecord } from "../../domain/types";
import {
  acquireLock,
  clearServerRecord,
  ensureToken,
  ensureViewer,
  pidAlive,
  readServerRecord,
  releaseLock,
  serverLogPath,
} from "../store/control";

const SPAWN_WAIT_MS = 8_000;
const POLL_MS = 60;

/** The bun binary: configured path, then PATH, then ~/.bun/bin. */
export function findBun(configured?: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const names = process.platform === "win32" ? ["bun.exe", "bun"] : ["bun"];
  const candidates: string[] = [];
  if (configured) candidates.push(configured);
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    if (dir) for (const name of names) candidates.push(join(dir, name));
  }
  const bunInstall = env.BUN_INSTALL ?? join(homedir(), ".bun");
  for (const name of names) candidates.push(join(bunInstall, "bin", name));
  return candidates.find((c) => existsSync(c)) ?? null;
}

/** The server entry, resolved from this file so it follows the extension wherever it is loaded from. */
export function serveScriptPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..", "server.ts");
}

export type Probe =
  | { kind: "ours"; health: Health }
  | { kind: "other-root"; health: Health }
  | { kind: "foreign" }
  | { kind: "free" };

/**
 * What is listening on the port, if anything. A refused connection is a free
 * port; so is a connect that nobody answers within the timeout (some hosts —
 * WSL2 among them — drop the SYN to a closed loopback port instead of
 * refusing it). Anything that answers but is not an artifact server is foreign.
 */
export async function probe(port: number, root: string, timeoutMs = 1200): Promise<Probe> {
  let res: Response;
  try {
    res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const err = e as Error & { code?: string; cause?: { code?: string } };
    const code = err.cause?.code ?? err.code ?? "";
    const text = `${err.name} ${code} ${err.message} ${err.cause?.code ?? ""}`;
    if (
      /ECONNREFUSED|ConnectionRefused|TimeoutError|AbortError|CONNECT_TIMEOUT|ETIMEDOUT/i.test(text)
    ) {
      return { kind: "free" };
    }
    return { kind: "foreign" };
  }
  let body: Partial<Health> = {};
  try {
    body = (await res.json()) as Partial<Health>;
  } catch {
    return { kind: "foreign" };
  }
  if (
    !res.ok ||
    body.ok !== true ||
    typeof body.root !== "string" ||
    typeof body.pid !== "number"
  ) {
    return { kind: "foreign" };
  }
  const health = body as Health;
  return health.root === root ? { kind: "ours", health } : { kind: "other-root", health };
}

export interface Located {
  record: ServerRecord;
  /** True when this call started the process. */
  spawned: boolean;
}

export interface LaunchOptions {
  root: string;
  port: number;
  trashDir: string;
  retentionDays: number;
  bun?: string;
  /** Overrides for tests. */
  serveScript?: string;
  waitMs?: number;
  environment?: NodeJS.ProcessEnv;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const recordFrom = (health: Health): ServerRecord => ({
  pid: health.pid,
  port: health.port,
  origin: `http://${DISPLAY}:${health.port}`,
  root: health.root,
  startedAt: health.startedAt,
});

/** Returns the running server for `root` on the port, starting one when the port is free. */
export async function locateServer(options: LaunchOptions): Promise<Located> {
  const first = await probe(options.port, options.root);
  if (first.kind === "ours") return { record: recordFrom(first.health), spawned: false };
  if (first.kind === "other-root") {
    throw new Error(
      `port ${options.port} is serving another project's artifacts (${first.health.root}, pid ${first.health.pid}); ` +
        `run /artifacts stop there, or set "port" in .pi/artifacts.json for this project`,
    );
  }
  if (first.kind === "foreign") {
    throw new Error(
      `port ${options.port} is in use by another program; artifacts need exactly this port — free it, or set "port" in .pi/artifacts.json`,
    );
  }
  const stale = readServerRecord(options.root);
  if (stale && !pidAlive(stale.pid)) clearServerRecord(options.root);

  mkdirSync(options.root, { recursive: true });
  ensureToken(options.root);
  ensureViewer(options.root);
  const deadline = Date.now() + (options.waitMs ?? SPAWN_WAIT_MS);

  if (!acquireLock(options.root)) {
    // Another session is spawning it right now; wait for it to answer.
    while (Date.now() < deadline) {
      await sleep(POLL_MS);
      const p = await probe(options.port, options.root, 500);
      if (p.kind === "ours") return { record: recordFrom(p.health), spawned: false };
    }
    throw new Error(
      `another session is starting the artifact server on port ${options.port} but it has not answered`,
    );
  }
  try {
    const bun = findBun(options.bun, options.environment);
    if (!bun) {
      throw new Error(
        "the artifact server runs on bun, which was not found on PATH or in ~/.bun/bin; install it (https://bun.sh) or set `bun` in .pi/artifacts.json",
      );
    }
    const script = options.serveScript ?? serveScriptPath();
    if (!existsSync(script)) throw new Error(`the artifact server script is missing: ${script}`);
    const log = openSync(serverLogPath(options.root), "a");
    const child = spawn(
      bun,
      [
        script,
        "--root",
        options.root,
        "--port",
        String(options.port),
        "--trash",
        options.trashDir,
        "--retention",
        String(options.retentionDays),
      ],
      {
        detached: true,
        stdio: ["ignore", log, log],
        env: { ...process.env, ARTIFACTS_SERVER: "1" },
      },
    );
    child.unref();
    let exited: number | null = null;
    child.on("exit", (code) => (exited = code ?? -1));

    while (Date.now() < deadline) {
      await sleep(POLL_MS);
      if (exited !== null) break;
      const p = await probe(options.port, options.root, 500);
      if (p.kind === "ours" && p.health.pid === child.pid)
        return { record: recordFrom(p.health), spawned: true };
    }
    throw new Error(
      `the artifact server did not come up on port ${options.port}${exited !== null ? ` (bun exited with ${exited})` : ""}; see ${serverLogPath(options.root)}`,
    );
  } finally {
    releaseLock(options.root);
  }
}

/** Asks a running server to exit; resolves when it no longer answers, or after the grace period. */
export async function stopServer(
  root: string,
  port: number,
  token: string | null,
  graceMs = 3000,
): Promise<boolean> {
  const p = await probe(port, root, 800);
  if (p.kind !== "ours" || !token) return false;
  try {
    await fetch(`http://127.0.0.1:${port}/api/stop`, {
      method: "POST",
      headers: { "x-artifact-token": token, "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // it may already be gone
  }
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline) {
    if ((await probe(port, root, 300)).kind !== "ours") return true;
    await sleep(POLL_MS);
  }
  return false;
}
