// find parameters → fd argv. Pure. Globs match the entry name; a glob with a
// `/` is matched against the full path and gets the leading `**/` fd needs
// there. One result more than the limit is requested so "limit reached" means
// something was left out, not that the count happened to land on the limit.

import { cleanPath, insideGitDir } from "../output";
import { FIND_DEFAULT_LIMIT, type FindInput } from "./schema";

export interface FindPlan {
  args: string[];
  limit: number;
  path: string | undefined;
}

const TYPE_FLAG = { file: "f", dir: "d", symlink: "l" } as const;

export function planFind(input: FindInput, options: { insideGitRepo: boolean }): FindPlan {
  const limit = Math.max(1, Math.floor(input.limit ?? FIND_DEFAULT_LIMIT));
  const path = cleanPath(input.path);
  const args = ["--color=never", "--max-results", String(limit + 1)];

  if (input.hidden !== false) {
    args.push("--hidden");
    if (!insideGitDir(path)) args.push("--exclude", ".git");
  }
  if (input.noIgnore) args.push("--no-ignore");
  // fd only honours .gitignore inside a repository unless told otherwise.
  if (!options.insideGitRepo) args.push("--no-require-git");
  args.push(input.ignoreCase ? "--ignore-case" : "--case-sensitive");
  if (input.type && input.type !== "any") args.push("--type", TYPE_FLAG[input.type]);
  if (input.extension) args.push("--extension", input.extension.replace(/^\./, ""));
  if (input.exclude) args.push("--exclude", input.exclude);
  if (input.maxDepth !== undefined && input.maxDepth >= 0) {
    args.push("--max-depth", String(Math.floor(input.maxDepth)));
  }
  if (input.changedWithin) args.push("--changed-within", input.changedWithin);

  let pattern = input.pattern.trim();
  if (!input.regex) {
    args.push("--glob");
    if (pattern === "") pattern = "*";
  }
  if (pattern.includes("/")) {
    args.push("--full-path");
    if (
      !input.regex &&
      !pattern.startsWith("/") &&
      !pattern.startsWith("**/") &&
      pattern !== "**"
    ) {
      pattern = `**/${pattern}`;
    }
  }

  args.push("--", pattern);
  if (path !== undefined) args.push(path);
  return { args, limit, path };
}
