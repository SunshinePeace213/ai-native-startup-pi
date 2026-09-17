// The fast-search extension wired to the fake Pi with both seams scripted: the
// probe answers `--version` per binary path, and the runner replays a scripted
// stdout line by line, honouring the early stop the tool asks for. Every spawn
// the tools would make is recorded, so a test asserts on argv and on output.

import { type Deps, register } from "@ext/fast-search/index";
import type { RunOutcome, RunRequest } from "@ext/fast-search/run";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi } from "@harness/fake-pi";
import { scriptedExec } from "@harness/scripted-exec";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface Scripted {
  stdout?: string[];
  stderr?: string;
  code?: number;
}

export interface Options {
  /** `--version` output per probe path; absent or null means "cannot run". */
  versions?: Record<string, string | null>;
  /** What the binary prints; a function sees the request. */
  run?: Scripted | ((request: RunRequest) => Scripted);
  cwd?: string;
  hasUI?: boolean;
}

/** Both tools present on PATH, plain versions. */
export const BOTH: Record<string, string | null> = { rg: "ripgrep 15.1.0", fd: "fd 10.5.0" };

export function wire(options: Options = {}) {
  const managedBinDir = mkdtempSync(join(tmpdir(), "fast-search-managed-"));
  const cwd = options.cwd ?? mkdtempSync(join(tmpdir(), "fast-search-cwd-"));
  const versions = options.versions ?? BOTH;
  const requests: RunRequest[] = [];
  let probes = 0;

  const deps: Deps = {
    managedBinDir,
    probe: async (path) => {
      probes += 1;
      const answer = versions[path];
      if (answer === undefined) return null;
      if (answer === "throw") throw new Error("spawn EACCES");
      return answer;
    },
    runner: async (request) => {
      requests.push(request);
      const script = typeof options.run === "function" ? options.run(request) : (options.run ?? {});
      let stopped = false;
      for (const line of script.stdout ?? []) {
        if (!request.onLine(line)) {
          stopped = true;
          break;
        }
      }
      const outcome: RunOutcome = {
        code: stopped ? null : (script.code ?? 0),
        stderr: script.stderr ?? "",
        stopped,
        aborted: false,
      };
      return outcome;
    },
  };

  const fake = createFakePi(scriptedExec({}));
  register(fake.pi, deps);
  const made = createCtx({ cwd, hasUI: options.hasUI });

  const tool = (name: "grep" | "find") => {
    const definition = fake.tools.get(name);
    if (!definition) throw new Error(`${name} was not registered`);
    return definition;
  };
  const run = async (name: "grep" | "find", params: Record<string, unknown>) => {
    const result = await tool(name).execute("call-1", params, undefined, undefined, made.ctx);
    const text = result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
    return { text, details: result.details as Record<string, unknown> | undefined };
  };
  const sessionStart = () =>
    fake.emit("session_start", { reason: "startup" }, made.ctx) as Promise<void>;
  const command = async (args = "") => {
    const handler = fake.commands.get("fast-search");
    if (!handler) throw new Error("fast-search command not registered");
    await handler.handler(args, made.ctx);
  };
  const lastArgs = () => requests.at(-1)?.args ?? [];

  return {
    fake,
    ctx: made,
    cwd,
    managedBinDir,
    requests,
    probes: () => probes,
    tool,
    run,
    sessionStart,
    command,
    lastArgs,
  };
}
