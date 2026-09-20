// The artifacts extension: Claude Code's Artifact tool — and ArtifactData, the
// tool for a page's database — hosted locally by a Bun server process this
// extension starts and talks to over HTTP.
//
//   src/domain/   the rules: types, protocol, schemas, versioning, files, capabilities,
//                 the page database, retention, text
//   src/app/      the use-cases over ports: the core, routing and delivery decisions
//   src/infra/    the adapters: fs store and control files, Bun HTTP, renderer,
//                 fetch client, process launch, pino logs
//   src/ui/       inside pi: the tool, /artifacts, the hooks, the footer strip
//   src/page/     the runtime every published page loads: window.claude and the bridge
//   src/shell/    the viewer shell the browser sees around a page
//   src/server.ts the Bun entry
//
// This file is the composition root for the pi process: it wires and
// registers, and starts nothing. The server is found or spawned on
// session_start; a page send reaches the model as an `artifact-feedback`
// message, labelled as the user's answer and never as an instruction.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { homedir } from "node:os";
import { join } from "node:path";

import type { Logger } from "./src/app/ports";
import { FEEDBACK_TYPE } from "./src/domain/envelope";
import type { Config } from "./src/domain/types";
import type { Locator } from "./src/infra/client/client";
import { readConfig } from "./src/infra/config";
import { createLogger } from "./src/infra/log/logger";
import { locateServer, stopServer } from "./src/infra/process/launch";
import { makeOpener } from "./src/infra/process/opener";
import { readToken, readViewer } from "./src/infra/store/control";
import { registerCommand } from "./src/ui/command";
import { registerHooks, STORE_DIR } from "./src/ui/hooks";
import { Host, type HostDeps } from "./src/ui/host";
import { createArtifactTool } from "./src/ui/tool";
import { createArtifactDataTool } from "./src/ui/tool/data";

export { STORE_DIR };

export interface Deps {
  /** Everything a Host needs except what Pi supplies; tests inject a locator and a clock. */
  hostDeps: (
    cwd: string,
    session: string,
    config: Config,
  ) => Omit<HostDeps, "send" | "notify" | "config" | "session">;
  config?: (cwd: string) => Config;
}

export function register(
  pi: ExtensionAPI,
  deps: Deps,
): { hostFor: (cwd: string, session: string) => Host } {
  const hosts = new Map<string, Host>();
  let notify: HostDeps["notify"] = () => {};
  let config: Config | null = null;
  const configFor = (cwd: string) => (config ??= (deps.config ?? readConfig)(cwd));

  const hostFor = (cwd: string, session: string): Host => {
    const existing = hosts.get(cwd);
    if (existing) return existing;
    const cfg = configFor(cwd);
    const host = new Host({
      ...deps.hostDeps(cwd, session, cfg),
      config: cfg,
      session,
      send: (content, options, details) =>
        pi.sendMessage({ customType: FEEDBACK_TYPE, content, display: true, details }, options),
      notify: (message, type) => notify(message, type),
    });
    hosts.set(cwd, host);
    return host;
  };
  const forgetHost = (cwd: string) => void hosts.delete(cwd);

  pi.registerTool(
    createArtifactTool({
      hostFor,
      get config() {
        return config ?? configFor(process.cwd());
      },
    }),
  );
  pi.registerTool(createArtifactDataTool({ hostFor }));
  registerHooks(pi, {
    hostFor,
    existingHost: (cwd) => hosts.get(cwd),
    forgetHost,
    configFor,
    bindNotify: (fn) => (notify = fn),
  });
  registerCommand(pi, { hostFor, forgetHost });

  return { hostFor };
}

/** The production locator: the server on the configured port, started when the port is free. */
export function productionLocator(cwd: string, config: Config): Locator {
  const root = join(cwd, STORE_DIR);
  return async () => {
    const { record } = await locateServer({
      root,
      port: config.port,
      trashDir: join(homedir(), ".Trash"),
      retentionDays: config.retentionDays,
      isolation: config.isolation,
      bun: config.bun,
    });
    const token = readToken(root);
    const viewer = readViewer(root);
    if (!token || !viewer)
      throw new Error("the artifact server is up but its control files are missing");
    return { origin: record.origin, port: record.port, token, viewer };
  };
}

export default function (pi: ExtensionAPI) {
  const loggers = new Map<string, Logger>();
  register(pi, {
    hostDeps: (cwd, session, config) => {
      const root = join(cwd, STORE_DIR);
      const log =
        loggers.get(session) ??
        createLogger({
          root,
          name: session,
          base: { pid: process.pid, component: "session", session },
        });
      loggers.set(session, log);
      return {
        locate: productionLocator(cwd, config),
        open: makeOpener((command, args, options) => pi.exec(command, args, options)),
        stop: () => stopServer(root, config.port, readToken(root)),
        log,
      };
    },
  });
}
