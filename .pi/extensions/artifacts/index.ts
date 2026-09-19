// The artifacts extension: Claude Code's Artifact tool, hosted locally by a
// Bun server process this extension starts and talks to over HTTP.
//
//   shared/    the contract both processes and the page agree on
//   session/   runs inside pi (Node today): the tool, /artifacts, the session
//              hooks, the HTTP client, and the delivery decision
//   server/    the Bun process: routes, rendering, the store's only writer
//   page/      the script and styles inside every published page
//
// The factory registers and wires; it starts nothing. The server is found or
// spawned on session_start when the project already has artifacts, or by the
// first publish; a page send reaches the model as an `artifact-feedback`
// message, labelled as the user's answer and never as an instruction.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

import type { Locator } from "./session/client";
import { registerCommand } from "./session/command";
import { FEEDBACK_TYPE } from "./session/feedback";
import { registerHooks, STORE_DIR } from "./session/hooks";
import { Host, type HostDeps } from "./session/host";
import { locateServer, stopServer } from "./session/launch";
import { makeOpener } from "./session/opener";
import { createArtifactTool } from "./session/tool";
import { readConfig } from "./shared/config";
import { readToken } from "./shared/record";
import type { Config } from "./shared/types";

export { STORE_DIR };

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
  const forgetHost = (cwd: string) => void hosts.delete(cwd);

  pi.registerTool(
    createArtifactTool({
      hostFor,
      get config() {
        return config ?? configFor(process.cwd());
      },
    }),
  );
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
