// The find tool: fd spawned directly and stopped one row past the limit. Its
// name overrides Pi's built-in find for the same reason grep's does, and the
// result details keep the built-in's shape so its renderer is inherited.

import type { FindToolDetails, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { installHint } from "../binaries";
import type { ToolDeps } from "../grep/tool";
import { finish, tidyPath } from "../output";
import { planFind } from "./args";
import { FIND_DEFAULT_LIMIT, findSchema } from "./schema";

/** Is `dir` or any parent a Git work tree? fd honours .gitignore only there. */
export function insideGitRepo(
  dir: string,
  exists: (path: string) => boolean = existsSync,
): boolean {
  for (let current = resolve(dir); ;) {
    if (exists(join(current, ".git"))) return true;
    const parent = dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

export function createFindTool(
  deps: ToolDeps,
): ToolDefinition<typeof findSchema, FindToolDetails | undefined> {
  return {
    name: "find",
    label: "find",
    description:
      "Find files and directories with fd. Returns one path per line, relative to the current " +
      "directory, directories with a trailing `/`. Respects .gitignore and includes hidden " +
      `entries, never .git/. Output is truncated to ${FIND_DEFAULT_LIMIT} results or 50KB ` +
      "(whichever is hit first).",
    promptSnippet:
      "Find files and directories with fd: glob or regex, type, extension, recency (respects .gitignore)",
    promptGuidelines: [
      "Use find to locate files instead of `find`, `fd`, or `ls -R` in bash; pattern '*' with a path lists a tree, and extension='ts' is quicker than a glob.",
    ],
    parameters: findSchema,

    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const binary = await deps.binary();
      if (!binary) {
        throw new Error(
          `find needs fd, which is not installed — ${installHint("fd")}, then /reload`,
        );
      }
      const root = params.path ? resolve(ctx.cwd, params.path.replace(/^@/, "")) : ctx.cwd;
      const plan = planFind(params, { insideGitRepo: insideGitRepo(root) });
      const rows: string[] = [];
      let limitReached = false;

      const outcome = await deps.runner({
        bin: binary.path,
        args: plan.args,
        cwd: ctx.cwd,
        signal,
        onLine: (line) => {
          if (rows.length >= plan.limit) {
            limitReached = true;
            return false;
          }
          rows.push(tidyPath(line));
          return true;
        },
      });

      const warning = outcome.stderr.trim().split("\n")[0] ?? "";
      if (!outcome.stopped && outcome.code !== 0 && rows.length === 0) {
        throw new Error(warning || `fd exited with code ${outcome.code}`);
      }
      if (rows.length === 0) {
        return { content: [{ type: "text", text: "No files found" }], details: undefined };
      }

      const notices: string[] = [];
      const details: FindToolDetails = {};
      if (limitReached) {
        notices.push(
          `${plan.limit} results limit reached. Use limit=${plan.limit * 2} for more, or narrow the pattern`,
        );
        details.resultLimitReached = plan.limit;
      }
      if (!outcome.stopped && outcome.code !== 0 && warning) notices.push(`fd warned: ${warning}`);
      const finished = finish(rows, notices);
      if (finished.truncation) details.truncation = finished.truncation;
      return {
        content: [{ type: "text", text: finished.text }],
        details: Object.keys(details).length ? details : undefined,
      };
    },
  };
}
