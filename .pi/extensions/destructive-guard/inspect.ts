// The recovery line on an rm approval card: how many of the files under the
// targets git can restore, and how many it cannot. Read-only, bounded by a
// timeout, and any failure is simply no line — the dialog never waits on git.

import { isAbsolute, relative } from "node:path";

import type { Recovery } from "./prompt";

export type ExecFn = (
  command: string,
  args: string[],
  options?: { timeout?: number; signal?: AbortSignal },
) => Promise<{ stdout: string; stderr: string; code: number; killed?: boolean }>;

function count(output: string): number {
  return output.split("\0").filter((entry) => entry.length > 0).length;
}

/** Tracked / untracked counts under the targets, or undefined when git cannot say. */
export async function recovery(
  exec: ExecFn,
  workspace: string,
  targets: string[],
  timeout: number,
): Promise<Recovery | undefined> {
  const inside = targets.filter((target) => {
    if (!isAbsolute(target)) return false;
    const rel = relative(workspace, target);
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  });
  if (!inside.length || inside.length !== targets.length) return undefined;
  try {
    const base = ["-C", workspace, "ls-files", "-z"];
    const [tracked, untracked] = await Promise.all([
      exec("git", [...base, "--", ...inside], { timeout }),
      exec("git", [...base, "--others", "--exclude-standard", "--", ...inside], { timeout }),
    ]);
    if (tracked.code !== 0 || untracked.code !== 0) return undefined;
    return { tracked: count(tracked.stdout), untracked: count(untracked.stdout) };
  } catch {
    return undefined;
  }
}
