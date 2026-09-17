// The access-guard extension: two path policies on every tool call.
//
//   tool_call   sensitive files (.env, keys, credential stores, …) are denied to
//               read · write · edit · grep · find · ls · bash — never toggleable
//               vendored trees (node_modules, .venv, caches, build output,
//               lockfiles, .git) are denied to write · edit and to the paths a
//               bash command rewrites — reads stay open
//   /access-guard          the state of both guards
//   /access-guard vendored off|on   lift or re-arm the vendored guard for this
//               session only; typed by the user, never callable by the model
//
// Pi has no sandbox: tool_call returning { block, reason } is the only choke
// point, and a handler that throws blocks the call. The guard catches its own
// errors and allows, so plumbing failures never wedge a session — only a
// confirmed catalog match denies. Best-effort text matching, not a sandbox.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { SENSITIVE_CATALOG } from "./catalog/sensitive";
import { VENDORED_CATALOG } from "./catalog/vendored";
import { type GuardState, decide } from "./guard";

const STATUS_KEY = "access-guard";
const SENSITIVE_RULE_COUNT = SENSITIVE_CATALOG.reduce(
  (sum, category) => sum + category.basenames.length + category.fragments.length,
  0,
);
const VENDORED_RULE_COUNT = VENDORED_CATALOG.reduce(
  (sum, entry) => sum + entry.dirs.length + entry.files.length,
  0,
);

export function statusLine(state: GuardState): string {
  return (
    `access-guard · sensitive: on (${SENSITIVE_RULE_COUNT} rules, not toggleable) · ` +
    `vendored: ${state.vendored ? "on" : "OFF for this session"} (${VENDORED_RULE_COUNT} rules)`
  );
}

export default function (pi: ExtensionAPI) {
  const state: GuardState = { vendored: true };

  pi.on("tool_call", async (event, ctx) => {
    try {
      const verdict = decide(
        event.toolName,
        event.input as Record<string, unknown>,
        ctx.cwd,
        state,
      );
      if (verdict) return verdict;
    } catch (error) {
      // Fail open, visibly: a bug here must never block unrelated work.
      if (ctx.hasUI) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`access-guard failed open on ${event.toolName}: ${message}`, "warning");
      }
    }
    return undefined;
  });

  pi.registerCommand("access-guard", {
    description:
      "Show the access guards; `vendored off|on` toggles the write guard for this session",
    getArgumentCompletions: (prefix) =>
      ["vendored on", "vendored off"]
        .filter((option) => option.startsWith(prefix))
        .map((option) => ({ value: option, label: option })),
    handler: async (args, ctx) => {
      const [scope, value] = args.trim().split(/\s+/);
      if (scope === "vendored" && (value === "on" || value === "off")) {
        state.vendored = value === "on";
        if (ctx.hasUI) ctx.ui.setStatus(STATUS_KEY, state.vendored ? "" : "🔓 vendored");
      } else if (scope === "sensitive") {
        ctx.ui.notify("The sensitive-files guard cannot be switched off.", "warning");
        return;
      } else if (scope) {
        ctx.ui.notify("Usage: /access-guard [vendored on|off]", "warning");
        return;
      }
      ctx.ui.notify(statusLine(state), "info");
    },
  });
}
