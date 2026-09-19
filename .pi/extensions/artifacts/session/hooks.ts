// The session lifecycle:
//
//   session_start     when the project already has artifacts (or a server
//                     record): find or start the server, open this session's
//                     event stream, name the count in the footer, and — once
//                     per conversation — queue a summary of sends that arrived
//                     while no session was listening
//   session_shutdown  close the stream; stop the server only when keepAlive
//                     is off. Idempotent: a second call finds no host.
//
// A project with no artifacts pays nothing at start; the first publish starts
// the server, as the extension docs ask (no background work from the factory).

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { join } from "node:path";

import { hasArtifacts, readServerRecord } from "../shared/record";
import type { Config } from "../shared/types";
import { FEEDBACK_TYPE } from "./feedback";
import type { Host } from "./host";

export const STORE_DIR = ".pi/artifacts";
const STATUS_KEY = "artifacts";

export interface HookDeps {
  hostFor: (cwd: string) => Host;
  /** The host for a cwd, or undefined when this session never created one. */
  existingHost: (cwd: string) => Host | undefined;
  forgetHost: (cwd: string) => void;
  configFor: (cwd: string) => Config;
  /** Binds user notifications to the UI once a context with one appears. */
  bindNotify: (notify: (message: string, type: "info" | "warning" | "error") => void) => void;
}

export function registerHooks(pi: ExtensionAPI, deps: HookDeps): void {
  pi.on("session_start", async (event, ctx) => {
    if (ctx.hasUI) deps.bindNotify((message, type) => ctx.ui.notify(message, type));
    const root = join(ctx.cwd, STORE_DIR);
    if (!readServerRecord(root) && !hasArtifacts(root)) return;
    const host = deps.hostFor(ctx.cwd);
    let origin = "";
    try {
      origin = (await host.start()).origin;
    } catch (e) {
      if (ctx.hasUI) ctx.ui.notify(`artifacts: ${(e as Error).message}`, "warning");
      return;
    }
    if (ctx.hasUI) {
      const count = (await host.client.list().catch(() => [])).length;
      ctx.ui.setStatus(STATUS_KEY, `artifacts ${count} · ${origin.replace("http://", "")}`);
    }
    // A reload replays session_start against the same conversation, which was
    // already told; the pending sends were also acknowledged by that first replay.
    if (event.reason === "reload") return;
    const summary = await host.replayPending().catch(() => null);
    if (summary) {
      pi.sendMessage(
        { customType: FEEDBACK_TYPE, content: summary, display: true },
        { deliverAs: "nextTurn" },
      );
    }
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    const host = deps.existingHost(ctx.cwd);
    if (!host) return;
    await host.shutdown(!deps.configFor(ctx.cwd).keepAlive);
    deps.forgetHost(ctx.cwd);
  });
}
