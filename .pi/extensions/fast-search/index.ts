// The fast-search extension: ripgrep and fd as the agent's grep and find.
//
//   grep · find        registered over Pi's built-in tools of the same name, so
//                      the model keeps the words it knows and gets the binaries'
//                      real options — file types, modes, hidden/ignore toggles,
//                      recency, regex — with the same limits and renderers
//   session_start      probes which rg and fd this machine has (Pi's managed
//                      ~/.pi/agent/bin, then PATH, `fdfind` included) and shows
//                      the footer status; a missing tool is named, never faked
//   /fast-search       paths, versions, and install hints
//
// The binaries are spawned directly and streamed, stopping at the result
// limit. Nothing is probed at load time — an extension factory can run in an
// invocation that never starts a session — and a tool whose binary is missing
// fails with the install hint rather than silently searching nothing.

import { type ExtensionAPI, getAgentDir } from "@earendil-works/pi-coding-agent";
import { join } from "node:path";

import {
  type Binaries,
  type Binary,
  type Probe,
  report,
  resolveBinaries,
  statusText,
  type Tool,
} from "./binaries";
import { createFindTool } from "./find/tool";
import { createGrepTool } from "./grep/tool";
import { type Runner, spawnRunner } from "./run";

const STATUS_KEY = "fast-search";
const PROBE_TIMEOUT_MS = 5_000;

export interface Deps {
  runner: Runner;
  probe: Probe;
  /** Where Pi keeps the rg and fd it downloads itself. */
  managedBinDir: string;
}

export function register(pi: ExtensionAPI, deps: Deps): void {
  let resolving: Promise<Binaries> | null = null;
  const resolve = () => (resolving ??= resolveBinaries(deps.probe, deps.managedBinDir));
  const reprobe = () => {
    resolving = null;
    return resolve();
  };
  // A tool missing at the first probe is looked for once more at call time,
  // so an install made mid-session is picked up without a reload.
  const binary = async (tool: Tool): Promise<Binary | null> =>
    (await resolve())[tool] ?? (await reprobe())[tool] ?? null;

  pi.registerTool(createGrepTool({ runner: deps.runner, binary: () => binary("rg") }));
  pi.registerTool(createFindTool({ runner: deps.runner, binary: () => binary("fd") }));

  pi.on("session_start", async (_event, ctx) => {
    const found = await reprobe();
    if (!ctx.hasUI) return;
    ctx.ui.setStatus(STATUS_KEY, statusText(found));
    if (!found.rg || !found.fd) ctx.ui.notify(report(found), "warning");
  });

  pi.registerCommand("fast-search", {
    description: "Show which ripgrep and fd back the grep and find tools",
    handler: async (_args, ctx) => {
      const found = await reprobe();
      if (ctx.hasUI) ctx.ui.setStatus(STATUS_KEY, statusText(found));
      ctx.ui.notify(report(found), found.rg && found.fd ? "info" : "warning");
    },
  });
}

export default function (pi: ExtensionAPI) {
  const probe: Probe = async (path) => {
    const result = await pi.exec(path, ["--version"], { timeout: PROBE_TIMEOUT_MS });
    return result.code === 0 ? result.stdout : null;
  };
  register(pi, { runner: spawnRunner, probe, managedBinDir: join(getAgentDir(), "bin") });
}
