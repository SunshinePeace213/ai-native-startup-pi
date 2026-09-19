// The artifacts extension: Claude Code's Artifact tool, hosted locally by a
// Bun server process this extension starts and talks to over HTTP.
//
//   artifact            the tool — publish, ask, read, read_page_data, open,
//                       list, status, watch/unwatch, comments/reply/resolve,
//                       delete — over pages served from 127.0.0.1
//   session_start       when the project already has artifacts: finds or
//                       starts the server, opens this session's event stream,
//                       and (once per conversation) queues a summary of sends
//                       that arrived while no session was listening
//   session_shutdown    closes the stream; stops the server only when
//                       keepAlive is off
//   /artifacts          lists the pages, opens one; `/artifacts stop` ends
//                       the server process
//   artifact-feedback   the custom message a page send becomes; delivered as a
//                       followUp that triggers a turn ("wake") or queued for
//                       the next prompt ("notify"), per .pi/artifacts.json
//
// The pi side runs under whatever hosts pi (Node today) and imports nothing
// that references Bun: serve.ts and server.ts belong to the server process.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

import type { Locator } from "./client";
import { readConfig } from "./config";
import { FEEDBACK_TYPE } from "./feedback";
import { Host, type HostDeps } from "./host";
import { locateServer, stopServer } from "./launch";
import { makeOpener } from "./opener";
import { hasArtifacts, readServerRecord, readToken } from "./store";
import { createArtifactTool } from "./tool";
import type { Config } from "./types";

export const STORE_DIR = ".pi/artifacts";
const STATUS_KEY = "artifacts";

export interface Deps {
  /** Everything a Host needs except what Pi supplies; tests inject a locator and a clock. */
  hostDeps: (cwd: string, config: Config) => Omit<HostDeps, "send" | "notify" | "config">;
  config?: (cwd: string) => Config;
}

export function register(pi: ExtensionAPI, deps: Deps): { hostFor: (cwd: string) => Host } {
  const hosts = new Map<string, Host>();
  let notify: HostDeps["notify"] = () => {};
  let config: Config | null = null;
  const configFor = (cwd: string) => (config ??= (deps.config ?? readConfig)(cwd));

  const hostFor = (cwd: string): Host => {
    const existing = hosts.get(cwd);
    if (existing) return existing;
    const cfg = configFor(cwd);
    const host = new Host({
      ...deps.hostDeps(cwd, cfg),
      config: cfg,
      send: (content, options, details) =>
        pi.sendMessage({ customType: FEEDBACK_TYPE, content, display: true, details }, options),
      notify: (message, type) => notify(message, type),
    });
    hosts.set(cwd, host);
    return host;
  };

  pi.registerTool(
    createArtifactTool({
      hostFor,
      get config() {
        return config ?? configFor(process.cwd());
      },
    }),
  );

  pi.on("session_start", async (event, ctx) => {
    if (ctx.hasUI) notify = (message, type) => ctx.ui.notify(message, type);
    // Only a project that already has artifacts (or a server record) pays for
    // a server at start; otherwise the first publish starts it.
    const root = join(ctx.cwd, STORE_DIR);
    if (!readServerRecord(root) && !hasArtifacts(root)) return;
    const host = hostFor(ctx.cwd);
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
    const host = hosts.get(ctx.cwd);
    if (!host) return;
    await host.shutdown(!configFor(ctx.cwd).keepAlive);
    hosts.delete(ctx.cwd);
  });

  pi.registerCommand("artifacts", {
    description: "List this project's artifact pages and open one; `stop` ends the server",
    handler: async (args, ctx) => {
      const host = hostFor(ctx.cwd);
      const wanted = args?.trim();
      if (wanted === "stop") {
        await host.shutdown(true);
        hosts.delete(ctx.cwd);
        ctx.ui.notify("Artifact server stopped; the next publish starts it again.", "info");
        return;
      }
      let all;
      try {
        await host.start();
        all = await host.client.list();
      } catch (e) {
        ctx.ui.notify(`artifacts: ${(e as Error).message}`, "warning");
        return;
      }
      if (!all.length) {
        ctx.ui.notify("No artifacts yet — ask the agent to publish one.", "info");
        return;
      }
      if (wanted) {
        const slug = await host.resolveSlug(wanted);
        if (!slug) return ctx.ui.notify(`No artifact matches "${wanted}".`, "warning");
        const error = await host.open(slug);
        return ctx.ui.notify(
          error ? `Could not open the browser: ${error}` : `Opened ${host.url(slug, false)}`,
          error ? "warning" : "info",
        );
      }
      const rows = all.map(
        (m) =>
          `${m.slug} — ${m.title} (v${m.current}${m.pending.length ? `, ${m.pending.length} pending` : ""})`,
      );
      if (!ctx.hasUI) {
        ctx.ui.notify(rows.join("\n"), "info");
        return;
      }
      const picked = await ctx.ui.select("Artifacts — pick one to open", rows);
      if (!picked) return;
      const slug = picked.split(" — ")[0] ?? "";
      const error = await host.open(slug);
      ctx.ui.notify(
        error ? `Could not open the browser: ${error}` : `Opened ${host.url(slug, false)}`,
        error ? "warning" : "info",
      );
    },
  });

  return { hostFor };
}

/** The production locator: the record's server when it answers, else a fresh process. */
export function productionLocator(cwd: string, config: Config): Locator {
  const root = join(cwd, STORE_DIR);
  return async () => {
    const { record } = await locateServer({
      root,
      seed: cwd,
      port: config.port,
      trashDir: join(homedir(), ".Trash"),
      bun: config.bun,
    });
    const token = readToken(root);
    if (!token) throw new Error("the artifact server started but wrote no token");
    return { origin: record.origin, port: record.port, requestedPort: record.requestedPort, token };
  };
}

export default function (pi: ExtensionAPI) {
  const session = process.env.PI_SESSION_ID || `pi-${randomUUID()}`;
  register(pi, {
    hostDeps: (cwd, config) => ({
      session,
      locate: productionLocator(cwd, config),
      open: makeOpener((command, args, options) => pi.exec(command, args, options)),
      stop: () => stopServer(join(cwd, STORE_DIR)),
    }),
  });
}
