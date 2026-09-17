// The grep tool: ripgrep spawned directly, streamed, and stopped at the limit.
// Its name overrides Pi's built-in grep so the model, the subagent allowlists,
// and the meta-agent vocabulary keep one word for content search; the result
// details keep the built-in's shape, so its renderer is inherited unchanged.

import type { GrepToolDetails, ToolDefinition } from "@earendil-works/pi-coding-agent";

import { type Binary, installHint } from "../binaries";
import { finish, tidyPath } from "../output";
import type { Runner } from "../run";
import { planGrep } from "./args";
import { parseRow } from "./rows";
import { GREP_DEFAULT_LIMIT, grepSchema } from "./schema";

export interface ToolDeps {
  runner: Runner;
  /** The binary to spawn, or null when none is installed. */
  binary: () => Promise<Binary | null>;
}

const NOUN = { matches: "matches", files: "files", count: "counted files" } as const;

export function createGrepTool(
  deps: ToolDeps,
): ToolDefinition<typeof grepSchema, GrepToolDetails | undefined> {
  return {
    name: "grep",
    label: "grep",
    description:
      "Search file contents with ripgrep. Returns `path:line: text` rows, context lines as " +
      "`path-line- text`; mode 'files' lists only the matching paths and mode 'count' the " +
      "per-file match counts. Respects .gitignore and searches hidden files, never .git/. " +
      `Output is truncated to ${GREP_DEFAULT_LIMIT} matches or 50KB (whichever is hit first); ` +
      "long lines are cut to 500 chars.",
    promptSnippet:
      "Search file contents with ripgrep: regex or literal, file types, globs, context, files/count modes (respects .gitignore)",
    promptGuidelines: [
      "Use grep for content search instead of `grep -r` or `rg` in bash; set noIgnore=true only when the match may live in an ignored tree such as node_modules or .venv.",
    ],
    parameters: grepSchema,

    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const binary = await deps.binary();
      if (!binary) {
        throw new Error(
          `grep needs ripgrep, which is not installed — ${installHint("rg")}, then /reload`,
        );
      }
      const plan = planGrep(params);
      const contextLines = Math.max(0, Math.floor(params.context ?? 0));
      const rows: string[] = [];
      let matches = 0;
      let lastMatchAt = -1;
      let limitReached = false;
      let linesTruncated = false;

      const outcome = await deps.runner({
        bin: binary.path,
        args: plan.args,
        cwd: ctx.cwd,
        signal,
        onLine: (line) => {
          if (plan.mode !== "matches") {
            if (rows.length >= plan.limit) {
              limitReached = true;
              return false;
            }
            rows.push(tidyPath(line));
            return true;
          }
          const row = parseRow(line);
          if (!row) return true;
          if (row.kind === "match") {
            if (matches >= plan.limit) {
              limitReached = true;
              // Drop the leading context of the match that was not taken.
              rows.length = Math.min(rows.length, lastMatchAt + 1 + contextLines);
              return false;
            }
            matches += 1;
            lastMatchAt = rows.length;
          }
          if (row.cut) linesTruncated = true;
          rows.push(row.text);
          return true;
        },
      });

      const warning = outcome.stderr.trim().split("\n")[0] ?? "";
      if (!outcome.stopped && outcome.code !== 0 && outcome.code !== 1 && rows.length === 0) {
        throw new Error(warning || `ripgrep exited with code ${outcome.code}`);
      }
      if (rows.length === 0) {
        return { content: [{ type: "text", text: "No matches found" }], details: undefined };
      }

      const notices: string[] = [];
      const details: GrepToolDetails = {};
      if (limitReached) {
        notices.push(
          `${plan.limit} ${NOUN[plan.mode]} limit reached. Use limit=${plan.limit * 2} for more, or refine pattern`,
        );
        details.matchLimitReached = plan.limit;
      }
      if (linesTruncated) {
        notices.push("Some lines truncated to 500 chars. Use read tool to see full lines");
        details.linesTruncated = true;
      }
      if (!outcome.stopped && outcome.code !== 0 && outcome.code !== 1 && warning) {
        notices.push(`ripgrep warned: ${warning}`);
      }
      const finished = finish(rows, notices);
      if (finished.truncation) details.truncation = finished.truncation;
      return {
        content: [{ type: "text", text: finished.text }],
        details: Object.keys(details).length ? details : undefined,
      };
    },
  };
}
