// Session-local opt-in: a child extension instance never inherits the parent's
// automatic-write permission. agent_settled is an idle signal, not a fleet gate.
import {
  withFileMutationQueue,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { join } from "node:path";
import { architecture, capture, DOCUMENT, type Exec, type Snapshot } from "./tree";

export default function architectureSync(pi: ExtensionAPI) {
  let automatic = false;
  let delegated = false;
  let candidate = false;
  let baseline: Snapshot | undefined;
  let busy = false;
  let epoch = 0;
  const execute: Exec = async (command, args) => {
    const result = await pi.exec(command, args, { timeout: 5_000 });
    if (result.killed || result.code !== 0)
      throw new Error(`Git failed or timed out (${result.code}): ${result.stderr.slice(0, 300)}`);
    return result.stdout;
  };
  pi.registerFlag("architecture-read-only", {
    description: "Disallow architecture document writes in this session",
    type: "boolean",
    default: false,
  });
  const writable = (ctx: ExtensionContext) =>
    ctx.isProjectTrusted() &&
    pi.getFlag("architecture-read-only") !== true &&
    process.env.PI_SUBAGENT_CHILD !== "1" &&
    pi.getActiveTools().some((tool) => ["write", "edit", "bash"].includes(tool));
  function report(ctx: ExtensionContext, message: string, warning = false) {
    pi.appendEntry("architecture-sync", { message, warning });
    if (ctx.hasUI) {
      ctx.ui.setStatus(
        "architecture-sync",
        warning ? "architecture: needs attention" : "architecture: current",
      );
      ctx.ui.notify(message, warning ? "warning" : "info");
    }
    pi.sendMessage(
      { customType: "architecture-sync", content: message, display: true },
      { deliverAs: "nextTurn", triggerTurn: false },
    );
  }
  function failure(ctx: ExtensionContext, error: unknown) {
    report(
      ctx,
      `Architecture sync: ${error instanceof Error ? error.message : String(error)}. Run bun run architecture:check; no automatic retry.`,
      true,
    );
  }
  function changed(ctx: ExtensionContext, missing: string[]) {
    report(
      ctx,
      `Updated ${DOCUMENT}'s tree; re-read it before relying on the project map.${missing.length ? ` Add folder descriptions in tree.config.json: ${missing.join(", ")}.` : ""}`,
      missing.length > 0,
    );
  }

  pi.registerCommand("architecture-sync", {
    description:
      "Architecture map: check (default), sync, auto, or pause. Auto is per-session and pauses on delegation.",
    handler: async (args, ctx) => {
      await ctx.waitForIdle();
      const action = args.trim() || "check";
      try {
        if (action === "pause") {
          automatic = false;
          report(ctx, "Architecture auto-sync paused; checks remain read-only.");
          return;
        }
        if (!["check", "sync", "auto"].includes(action))
          throw new Error("Use check, sync, auto, or pause");
        if (action !== "check" && !writable(ctx))
          throw new Error("This session is not allowed to write the architecture map");
        if (action === "auto") {
          await capture(ctx.cwd, execute); // Validate the target, but baseline the next actual run.
          baseline = undefined;
          automatic = true;
          delegated = false;
          candidate = false;
          report(
            ctx,
            "Architecture auto-sync enabled for this editing session only. Join delegated writers before re-enabling it.",
          );
          return;
        }
        const result =
          action === "sync"
            ? await withFileMutationQueue(
                join((await capture(ctx.cwd, execute)).root, DOCUMENT),
                () => architecture(ctx.cwd, "write", execute),
              )
            : await architecture(ctx.cwd, "check", execute);
        if (action === "check" && result.changed)
          report(ctx, `${DOCUMENT}'s tree is stale; run bun run architecture:sync.`, true);
        else if (result.changed) changed(ctx, result.missingDescriptions);
        else
          report(
            ctx,
            `${DOCUMENT}'s tree is current.${result.missingDescriptions.length ? ` Descriptions needed: ${result.missingDescriptions.join(", ")}.` : ""}`,
            result.missingDescriptions.length > 0,
          );
      } catch (error) {
        failure(ctx, error);
      }
    },
  });

  pi.on("before_agent_start", async (_event, ctx) => {
    // A queued continuation belongs to the same run-to-idle interval.
    if (baseline || !ctx.isProjectTrusted()) return;
    candidate = false;
    const generation = epoch;
    try {
      const snapshot = await capture(ctx.cwd, execute);
      if (generation === epoch) baseline = snapshot;
    } catch (error) {
      if (generation === epoch) failure(ctx, error);
    }
  });
  pi.on("tool_call", (event) => {
    if (event.toolName === "subagent") {
      // No attempt to infer completion/authority from arbitrary tool receipts.
      delegated = true;
      automatic = false;
    }
  });
  pi.on("tool_result", (event) => {
    if (!event.isError && ["write", "edit", "bash", "powershell"].includes(event.toolName))
      candidate = true;
  });
  pi.on("agent_settled", async (_event, ctx) => {
    if (busy || !ctx.isIdle() || !baseline) return;
    busy = true;
    const before = baseline;
    baseline = undefined;
    const generation = epoch;
    try {
      const after = await capture(ctx.cwd, execute);
      if (generation !== epoch || after.root !== before.root || after.tree === before.tree) return;
      if (!automatic || delegated || !candidate || !writable(ctx)) {
        report(
          ctx,
          `Project structure changed; ${DOCUMENT} needs bun run architecture:sync. Automatic writes are not enabled for this run.`,
          true,
        );
        return;
      }
      const allowed = () =>
        generation === epoch && automatic && !delegated && writable(ctx) && ctx.isIdle();
      const result = await withFileMutationQueue(join(after.root, DOCUMENT), () =>
        architecture(after.root, "write", execute, allowed),
      );
      if (generation === epoch && result.changed) changed(ctx, result.missingDescriptions);
    } catch (error) {
      if (generation === epoch) failure(ctx, error);
    } finally {
      busy = false;
    }
  });
  pi.on("session_shutdown", () => {
    epoch++;
    automatic = false;
    delegated = false;
    candidate = false;
    baseline = undefined;
  });
}
