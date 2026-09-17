// The one place a search binary is spawned. Stdout is delivered line by line to
// a callback that can stop the process early — that is how a result limit ends
// a ripgrep or fd walk after N hits instead of after the whole tree. The tools
// receive a `Runner`, so the contract tests script one and never spawn.

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export interface RunRequest {
  bin: string;
  args: string[];
  cwd: string;
  signal?: AbortSignal;
  /** One stdout line; return false to stop the process. */
  onLine: (line: string) => boolean;
}

export interface RunOutcome {
  /** Exit code, or null when the process was stopped early or aborted. */
  code: number | null;
  stderr: string;
  /** `onLine` asked to stop. */
  stopped: boolean;
  /** The signal fired. */
  aborted: boolean;
}

export type Runner = (request: RunRequest) => Promise<RunOutcome>;

export const spawnRunner: Runner = (request) =>
  new Promise((resolve, reject) => {
    const { bin, args, cwd, signal, onLine } = request;
    if (signal?.aborted) {
      reject(new Error("Operation aborted"));
      return;
    }
    let stderr = "";
    let stopped = false;
    let aborted = false;
    let settled = false;

    const child = spawn(bin, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    const lines = createInterface({ input: child.stdout });

    const stop = () => {
      if (!child.killed) child.kill();
    };
    const onAbort = () => {
      aborted = true;
      stop();
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    lines.on("line", (line) => {
      if (stopped || aborted) return;
      if (!onLine(line)) {
        stopped = true;
        stop();
      }
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      reject(new Error(`Failed to run ${bin}: ${error.message}`));
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      lines.close();
      signal?.removeEventListener("abort", onAbort);
      if (aborted) {
        reject(new Error("Operation aborted"));
        return;
      }
      resolve({ code: stopped ? null : code, stderr, stopped, aborted });
    });
  });
