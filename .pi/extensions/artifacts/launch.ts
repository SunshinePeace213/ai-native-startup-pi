// Finding or starting the server process from the pi side. Plain Node APIs
// only: this file runs inside pi, which may be Node or Bun. The server is
// spawned detached with its output in .server.log, so it survives the session.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HEADER } from "./server-const";
import { readServerRecord, readToken, serverLogPath } from "./store";
import type { ServerRecord } from "./types";

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

/** serve.ts next to this file; the extension directory is where it is loaded from. */
export function serveScriptPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "serve.ts");
}

export interface Located {
  record: ServerRecord;
  /** True when this call started the process. */
  spawned: boolean;
}

export interface LaunchOptions {
  root: string;
  /** The project path, used to derive a port when config says 0. */
  seed: string;
  port: number;
  trashDir: string;
  bun?: string;
  /** Overrides for tests. */
  serveScript?: string;
  waitMs?: number;
  environment?: NodeJS.ProcessEnv;
}

export async function health(
  record: ServerRecord,
  token: string,
  timeoutMs = 1500,
): Promise<boolean> {
  try {
    const res = await fetch(`${record.origin}/api/health`, {
      headers: { [HEADER]: token },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: boolean; root?: string };
    return body.ok === true && body.root === record.root;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Returns the running server for `root`, starting one when none answers. */
export async function locateServer(options: LaunchOptions): Promise<Located> {
  const token = readToken(options.root);
  const existing = readServerRecord(options.root);
  if (existing && token && (await health(existing, token)))
    return { record: existing, spawned: false };

  const bun = findBun(options.bun, options.environment);
  if (!bun) {
    throw new Error(
      "the artifact server runs on bun, which was not found on PATH or in ~/.bun/bin; install it (https://bun.sh) or set `bun` in .pi/artifacts.json",
    );
  }
  const script = options.serveScript ?? serveScriptPath();
  if (!existsSync(script)) throw new Error(`the artifact server script is missing: ${script}`);
  mkdirSync(options.root, { recursive: true });
  const log = openSync(serverLogPath(options.root), "a");
  const child = spawn(
    bun,
    [
      script,
      "--root",
      options.root,
      "--port",
      options.port < 0 ? "any" : String(options.port),
      "--seed",
      options.seed,
      "--trash",
      options.trashDir,
    ],
    { detached: true, stdio: ["ignore", log, log], env: { ...process.env, ARTIFACTS_SERVER: "1" } },
  );
  child.unref();
  let exited: number | null = null;
  child.on("exit", (code) => (exited = code ?? -1));

  const deadline = Date.now() + (options.waitMs ?? SPAWN_WAIT_MS);
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    if (exited !== null) break;
    const record = readServerRecord(options.root);
    const fresh = readToken(options.root);
    if (record && fresh && record.pid === child.pid && (await health(record, fresh, 500))) {
      return { record, spawned: true };
    }
  }
  throw new Error(
    `the artifact server did not come up${exited !== null ? ` (bun exited with ${exited})` : ""}; see ${serverLogPath(options.root)}`,
  );
}

/** Asks a running server to exit; resolves when it no longer answers, or after the grace period. */
export async function stopServer(root: string, graceMs = 3000): Promise<boolean> {
  const record = readServerRecord(root);
  const token = readToken(root);
  if (!record || !token) return false;
  try {
    await fetch(`${record.origin}/api/stop`, {
      method: "POST",
      headers: { [HEADER]: token, "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // it may already be gone
  }
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline) {
    if (!(await health(record, token, 300))) return true;
    await sleep(POLL_MS);
  }
  return false;
}
