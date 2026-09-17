// grep parameters → ripgrep argv. Pure. The pattern always travels behind `-e`
// and the path behind `--`, so a pattern or path beginning with `-` is never
// read as a flag. Match rows come back as JSON events (one per line) so context
// lines and matches can be told apart; files and count modes are plain lines.

import { cleanPath, insideGitDir } from "../output";
import { GREP_DEFAULT_LIMIT, type GrepInput, type GrepMode } from "./schema";

export interface GrepPlan {
  args: string[];
  mode: GrepMode;
  limit: number;
  path: string | undefined;
}

export function planGrep(input: GrepInput): GrepPlan {
  const mode: GrepMode = input.mode ?? "matches";
  const limit = Math.max(1, Math.floor(input.limit ?? GREP_DEFAULT_LIMIT));
  const path = cleanPath(input.path);
  const args = ["--color=never"];

  if (mode === "matches") args.push("--json", "--line-number");
  else if (mode === "files") args.push("--files-with-matches");
  else args.push("--count");

  if (input.hidden !== false) {
    args.push("--hidden");
    if (!insideGitDir(path)) args.push("--glob", "!.git");
  }
  if (input.noIgnore) args.push("--no-ignore");
  if (input.ignoreCase) args.push("--ignore-case");
  if (input.literal) args.push("--fixed-strings");
  if (input.wordMatch) args.push("--word-regexp");
  if (input.multiline) args.push("--multiline");
  if (input.invert) args.push("--invert-match");
  if (input.context && input.context > 0 && mode === "matches") {
    args.push("--context", String(Math.floor(input.context)));
  }
  if (input.glob) args.push("--glob", input.glob);
  if (input.exclude) args.push("--glob", `!${input.exclude}`);
  if (input.type) args.push("--type", input.type);
  if (input.maxDepth !== undefined && input.maxDepth >= 0) {
    args.push("--max-depth", String(Math.floor(input.maxDepth)));
  }

  args.push("-e", input.pattern, "--");
  if (path !== undefined) args.push(path);
  return { args, mode, limit, path };
}
