// Runs the Python engine and retriever through Pi's exec and parses their JSON.
// Every failure — uv missing, a non-zero exit, a timeout, unparsable stdout —
// returns null so the caller fails open.

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

import type { QueueResult } from "./format";

export type ExecResult = { stdout: string; stderr: string; code: number; killed?: boolean };
export type ExecFn = (
  command: string,
  args: string[],
  options?: { timeout?: number; signal?: AbortSignal },
) => Promise<ExecResult>;

const ENGINE = join("scripts", "llm-wiki", "state.py");
const RETRIEVER = join("scripts", "llm-wiki", "retrieve.py");

/** The nearest ancestor of `cwd` (itself included) holding both the layer and its engine. */
export function layerRoot(cwd: string): string | null {
  let dir = cwd;
  for (;;) {
    if (existsSync(join(dir, "llm-wiki")) && existsSync(join(dir, ENGINE))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

async function runJson(
  exec: ExecFn,
  root: string,
  script: string,
  args: string[],
  timeout: number,
): Promise<Record<string, unknown> | null> {
  let result: ExecResult;
  try {
    result = await exec("uv", ["run", join(root, script), "--root", root, ...args], { timeout });
  } catch {
    return null;
  }
  if (result.code !== 0 || result.killed) return null;
  try {
    const parsed = JSON.parse(result.stdout);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** The read-only `queue` verb; null when the engine cannot be trusted. */
export async function queue(
  exec: ExecFn,
  root: string,
  timeout: number,
): Promise<QueueResult | null> {
  const result = await runJson(exec, root, ENGINE, ["queue", "--json"], timeout);
  if (!result) return null;
  const { total, unregistered, unextracted } = result;
  if (typeof total !== "number" || !Array.isArray(unregistered) || !Array.isArray(unextracted)) {
    return null;
  }
  return result as unknown as QueueResult;
}

/**
 * The read-only `search` verb over the bm25 and state streams only — they
 * load no embedding model, so the run lands near a second where the full
 * four-stream fusion takes eight. The vec and graph streams are what the
 * librarian adds once a question turns out to need them.
 */
export function search(
  exec: ExecFn,
  root: string,
  question: string,
  limit: number,
  timeout: number,
): Promise<Record<string, unknown> | null> {
  return runJson(
    exec,
    root,
    RETRIEVER,
    ["search", question, "--streams", "bm25,state", "-n", String(limit), "--json"],
    timeout,
  );
}

/** Proposals waiting in states/inbox/. */
export function inboxCount(root: string): number {
  try {
    return readdirSync(join(root, "llm-wiki", "states", "inbox")).filter((name) =>
      name.endsWith(".jsonl"),
    ).length;
  } catch {
    return 0;
  }
}
