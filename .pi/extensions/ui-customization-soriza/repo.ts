// What the header's repo line says: `owner/repo` from the origin remote, else
// the git top-level folder, else the working directory; plus the branch when
// there is one. Every git failure degrades to the next fallback — the header
// must never break a session over a missing remote or a non-repo cwd.

import { basename } from "node:path";

export interface RepoInfo {
  /** `owner/repo`, a folder name, or the cwd basename. */
  slug: string;
  /** Branch name, "detached", or null outside a repository. */
  branch: string | null;
}

export type ExecFn = (
  command: string,
  args: string[],
  options?: { cwd?: string; timeout?: number },
) => Promise<{ stdout: string; stderr: string; code: number }>;

const REMOTE_PATTERNS = [
  /^[^@]+@[^:]+:(?<path>.+)$/, // git@github.com:owner/repo.git
  /^[a-z+]+:\/\/[^/]+\/(?<path>.+)$/i, // https://host/owner/repo.git · ssh://git@host/owner/repo
];

/** `owner/repo` from a remote URL, or null when the URL has no such tail. */
export function slugFromRemote(url: string): string | null {
  const trimmed = url.trim();
  for (const pattern of REMOTE_PATTERNS) {
    const path = pattern.exec(trimmed)?.groups?.path;
    if (!path) continue;
    const parts = path
      .replace(/\.git\/?$/, "")
      .split("/")
      .filter(Boolean);
    if (parts.length >= 2) return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return null;
}

export async function probeRepo(cwd: string, exec: ExecFn): Promise<RepoInfo> {
  const git = async (...args: string[]): Promise<string | null> => {
    try {
      const result = await exec("git", args, { cwd, timeout: 3000 });
      return result.code === 0 ? result.stdout.trim() : null;
    } catch {
      return null;
    }
  };

  const toplevel = await git("rev-parse", "--show-toplevel");
  if (!toplevel) return { slug: basename(cwd), branch: null };

  const remote = await git("remote", "get-url", "origin");
  const slug = (remote && slugFromRemote(remote)) || basename(toplevel);
  const head = await git("rev-parse", "--abbrev-ref", "HEAD");
  const branch = head === null ? null : head === "HEAD" ? "detached" : head;
  return { slug, branch };
}

export function equalRepo(a: RepoInfo, b: RepoInfo): boolean {
  return a.slug === b.slug && a.branch === b.branch;
}
