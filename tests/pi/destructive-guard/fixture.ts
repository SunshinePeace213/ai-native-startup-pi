// A scratch workspace and the wired extension for the destructive-guard tests.
// The workspace is a real directory under tmpdir with a .git marker, a source
// tree, a regenerable node_modules, a symlink that escapes the workspace, and
// an optional .pi/destructive-guard.json — so the path classifier follows real
// symlinks and the config loader reads a real file. Every test gets its own.

import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import destructiveGuard from "@ext/destructive-guard/index";
import type { GuardEnv } from "@ext/destructive-guard/types";
import { type ExecScript, createFakePi } from "@harness/fake-pi";

export interface Workspace {
  root: string;
  home: string;
  outside: string;
  env: GuardEnv;
}

/** A project with src/, node_modules/, a .git marker, and `escape` → a directory outside it. */
export function scratchWorkspace(options: { config?: string } = {}): Workspace {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "destructive-guard-")));
  const root = join(base, "proj");
  const home = join(base, "home");
  const outside = join(base, "elsewhere");
  for (const dir of [
    join(root, ".git"),
    join(root, "src", "migrations"),
    join(root, "node_modules", ".cache"),
    join(root, "dist"),
    join(home, ".ssh"),
    join(home, ".Trash"),
    outside,
  ]) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(join(root, "src", "a.ts"), "export {};\n");
  writeFileSync(join(home, ".ssh", "id_rsa"), "not a real key\n");
  writeFileSync(join(home, ".bashrc"), "# rc\n");
  symlinkSync(outside, join(root, "escape"));
  if (options.config !== undefined) {
    mkdirSync(join(root, ".pi"), { recursive: true });
    writeFileSync(join(root, ".pi", "destructive-guard.json"), options.config);
  }
  return {
    root,
    home,
    outside,
    env: { cwd: root, workspace: root, home, platform: "linux" },
  };
}

export interface GuardCtx {
  ctx: ExtensionCommandContext;
  notifications: Array<{ message: string; type: string }>;
  status: Map<string, string | undefined>;
  /** Every select dialog shown: its title and the options offered. */
  dialogs: Array<{ title: string; options: string[] }>;
}

/**
 * The ExtensionContext the guard sees. `answer` scripts the select dialog: a
 * string picks that option, undefined dismisses, a function decides per dialog.
 */
export function guardCtx(options: {
  cwd: string;
  hasUI?: boolean;
  answer?: string | undefined | ((title: string, choices: string[]) => string | undefined);
}): GuardCtx {
  const notifications: Array<{ message: string; type: string }> = [];
  const status = new Map<string, string | undefined>();
  const dialogs: Array<{ title: string; options: string[] }> = [];
  const ctx = {
    cwd: options.cwd,
    hasUI: options.hasUI ?? true,
    ui: {
      notify(message: string, type: string) {
        notifications.push({ message, type });
      },
      setStatus(key: string, text: string | undefined) {
        status.set(key, text);
      },
      async select(title: string, choices: string[]) {
        dialogs.push({ title, options: choices });
        const answer = options.answer;
        return typeof answer === "function" ? answer(title, choices) : answer;
      },
    },
  } as unknown as ExtensionCommandContext;
  return { ctx, notifications, status, dialogs };
}

type Block = { block: true; reason: string; terminate?: boolean };

/** The extension wired to a fake Pi; `bash()` and `write()` fire tool_call. */
export function wire(exec: ExecScript = () => ({ stdout: "", stderr: "", code: 0 })) {
  const fake = createFakePi(exec);
  destructiveGuard(fake.pi);
  return {
    fake,
    bash: (command: string, ctx: ExtensionCommandContext) =>
      fake.emit(
        "tool_call",
        { toolName: "bash", toolCallId: "t1", input: { command } },
        ctx,
      ) as Promise<Block | undefined>,
    write: (tool: "write" | "edit", path: string, ctx: ExtensionCommandContext) =>
      fake.emit(
        "tool_call",
        { toolName: tool, toolCallId: "t2", input: { path, content: "" } },
        ctx,
      ) as Promise<Block | undefined>,
  };
}

/** The git exec double for the recovery line: N tracked, M untracked under any target. */
export function gitExec(tracked: number, untracked: number): ExecScript {
  return ({ args }) => {
    const others = args.includes("--others");
    const n = others ? untracked : tracked;
    return { stdout: Array.from({ length: n }, (_, i) => `f${i}\0`).join(""), stderr: "", code: 0 };
  };
}
