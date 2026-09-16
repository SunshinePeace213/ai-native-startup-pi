// The git segment's data: branch, staged / modified / untracked counts and
// ahead / behind from one `git status --porcelain=v2 --branch` call. Probed
// after turns and on branch changes, never inside render. Any git failure
// degrades to null (the footer then shows Pi's own branch, or nothing).

export interface GitState {
  branch: string;
  staged: number;
  modified: number;
  untracked: number;
  ahead: number;
  behind: number;
}

export type ExecFn = (
  command: string,
  args: string[],
  options?: { cwd?: string; timeout?: number },
) => Promise<{ stdout: string; stderr: string; code: number }>;

export const GIT_STATUS_ARGS = ["status", "--porcelain=v2", "--branch", "--untracked-files=normal"];

/**
 * Parse porcelain v2. Header lines carry the branch (`# branch.head`) and the
 * upstream delta (`# branch.ab +A -B`); `1`/`2` entries carry an XY pair where
 * X is the index state and Y the worktree state; `u` is a conflict (counted as
 * modified); `?` is untracked; `!` (ignored) is not counted.
 */
export function parsePorcelain(output: string): GitState {
  const state: GitState = {
    branch: "detached",
    staged: 0,
    modified: 0,
    untracked: 0,
    ahead: 0,
    behind: 0,
  };
  for (const line of output.split("\n")) {
    if (line.startsWith("# branch.head ")) {
      const head = line.slice("# branch.head ".length).trim();
      state.branch = head === "(detached)" ? "detached" : head;
    } else if (line.startsWith("# branch.ab ")) {
      const match = /\+(\d+) -(\d+)/.exec(line);
      if (match) {
        state.ahead = Number(match[1]);
        state.behind = Number(match[2]);
      }
    } else if (line.startsWith("1 ") || line.startsWith("2 ")) {
      const xy = line.slice(2, 4);
      if (xy[0] !== ".") state.staged += 1;
      if (xy[1] !== ".") state.modified += 1;
    } else if (line.startsWith("u ")) {
      state.modified += 1;
    } else if (line.startsWith("? ")) {
      state.untracked += 1;
    }
  }
  return state;
}

export async function probeGit(cwd: string, exec: ExecFn): Promise<GitState | null> {
  try {
    const result = await exec("git", GIT_STATUS_ARGS, { cwd, timeout: 3000 });
    if (result.code !== 0) return null;
    return parsePorcelain(result.stdout);
  } catch {
    return null;
  }
}

export function equalGit(a: GitState | null, b: GitState | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.branch === b.branch &&
    a.staged === b.staged &&
    a.modified === b.modified &&
    a.untracked === b.untracked &&
    a.ahead === b.ahead &&
    a.behind === b.behind
  );
}

export function isClean(git: GitState): boolean {
  return git.staged === 0 && git.modified === 0 && git.untracked === 0;
}
