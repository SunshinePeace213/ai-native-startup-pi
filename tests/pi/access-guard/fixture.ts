// A throwaway project for the access-guard contracts: a live secret and its
// template, a vendored tree, build output, a lockfile, a `.git/`, a script named
// like an output directory, and symlinks to a secret and to the vendored tree.
// Never the repo's own checkout and never the developer's home.

import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import accessGuard from "@ext/access-guard/index";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi } from "@harness/fake-pi";
import { scriptedExec } from "@harness/scripted-exec";

export type Verdict = { block: true; reason: string } | undefined;

export interface Project {
  root: string;
  at(rel: string): string;
}

export function scratchProject(): Project {
  const root = mkdtempSync(join(tmpdir(), "access-guard-test-"));
  const at = (rel: string) => join(root, rel);
  for (const dir of [
    "src",
    "notes",
    "node_modules/pkg",
    ".venv/lib/python3.12/site-packages",
    "src/__pycache__",
    "dist",
    ".git/hooks",
    "config",
  ]) {
    mkdirSync(at(dir), { recursive: true });
  }
  writeFileSync(at(".env"), "SECRET=1\n");
  writeFileSync(at(".env.sample"), "SECRET=\n");
  writeFileSync(at("src/app.ts"), "");
  writeFileSync(at("src/build.ts"), "");
  writeFileSync(at("build"), "#!/bin/sh\n"); // a script, not the output dir
  writeFileSync(at("node_modules/pkg/index.js"), "");
  writeFileSync(at(".venv/lib/python3.12/site-packages/x.py"), "");
  writeFileSync(at("dist/out.js"), "");
  writeFileSync(at("bun.lock"), "");
  writeFileSync(at(".git/config"), "");
  writeFileSync(at("config/master.key"), "");
  symlinkSync(at(".env"), at(".env.example")); // template-named alias of a live secret
  symlinkSync(at("node_modules"), at("deps")); // alias of the vendored tree
  return { root, at };
}

/** The extension wired to a fake Pi, with the hook and the command exposed. */
export function guard(cwd?: string) {
  const project = scratchProject();
  const fake = createFakePi(scriptedExec({}));
  accessGuard(fake.pi);
  const made = createCtx({ cwd: cwd ?? project.root });
  const call = (toolName: string, input: Record<string, unknown>) =>
    fake.emit("tool_call", { toolName, input }, made.ctx) as Promise<Verdict>;
  const command = async (args: string) => {
    const handler = fake.commands.get("access-guard");
    if (!handler) throw new Error("access-guard command not registered");
    await handler.handler(args, made.ctx);
  };
  return { project, call, command, ctx: made };
}
