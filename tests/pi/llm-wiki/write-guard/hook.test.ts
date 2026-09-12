// write-guard — the tool_call hook of .pi/extensions/llm-wiki.
//
// W1  write/edit/bash aimed at a ledger or view under llm-wiki/states/ → blocked, the
//     reason names state.py and the verb to run
// W2  write/edit/bash aimed at a shelf page, a shelf folder, index.md, or the bare
//     llm-wiki/wiki root → blocked, the reason names render.py
// W3  the bare layer llm-wiki/ and the bare llm-wiki/states → blocked
// W4  the inbox, raw/, wiki/log.md, schemas/, evals/, docs/ → pass through untouched
// W5  a path outside the project, a cwd with no layer above it, a non-string path, or a
//     tool that is not write/edit/bash → pass (not this guard's authority)
// W6  a protected file reached through a symlink or from a nested cwd → blocked via its
//     real path
// W7  a bash command the parser cannot read stays open — an unterminated quote, a
//     `sh -c` wrapper, and a `cd`-relative target — and this file names them as intended
//     fail-open so a hole is a decision, not an oversight; a heredoc's own redirect is
//     still read
// W8  governance.json → blocked, the reason says it is the human's

import { describe, expect, test } from "bun:test";
import { symlinkSync } from "node:fs";
import { join } from "node:path";

import llmWiki from "@ext/llm-wiki/index";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi } from "@harness/fake-pi";
import { scriptedExec } from "@harness/scripted-exec";
import { scratchLayer } from "@harness/scratch-layer";

type Verdict = { block: true; reason: string } | undefined;

function guard(cwd?: string) {
  const layer = scratchLayer();
  const fake = createFakePi(scriptedExec({}));
  llmWiki(fake.pi);
  const { ctx } = createCtx({ cwd: cwd ?? layer.root });
  const call = (toolName: string, input: Record<string, unknown>) =>
    fake.emit("tool_call", { toolName, input }, ctx) as Promise<Verdict>;
  return { layer, call };
}

const BLOCKED: Array<[id: string, tool: string, input: Record<string, unknown>, names: string]> = [
  ["W1 write to a ledger", "write", { path: "llm-wiki/states/claims.jsonl" }, "state.py"],
  [
    "W1 edit an observation file",
    "edit",
    { path: "llm-wiki/states/observations/src_1.jsonl" },
    "state.py",
  ],
  [
    "W1 bash redirect into a view",
    "bash",
    { command: "echo x >> llm-wiki/states/claims.jsonl" },
    "state.py",
  ],
  [
    "W1 bash tee in a pipeline",
    "bash",
    { command: "cat a | tee llm-wiki/states/snapshot.json && rm c" },
    "state.py",
  ],
  [
    "W1 bash sed -i on a ledger",
    "bash",
    { command: "sed -i s/a/b/ llm-wiki/states/sources.jsonl" },
    "state.py",
  ],
  [
    "W1 bash cp onto a ledger",
    "bash",
    { command: "cp a.jsonl llm-wiki/states/transitions.jsonl" },
    "state.py",
  ],
  ["W2 write a shelf page", "write", { path: "llm-wiki/wiki/concepts/new-page.md" }, "render.py"],
  ["W2 write index.md", "write", { path: "llm-wiki/wiki/index.md" }, "render.py"],
  ["W2 bash rm -rf the wiki root", "bash", { command: "rm -rf llm-wiki/wiki" }, "render.py"],
  ["W2 bash rm a shelf folder", "bash", { command: "rm -r llm-wiki/wiki/concepts" }, "render.py"],
  ["W3 bash rm -rf the whole layer", "bash", { command: "rm -rf llm-wiki" }, "llm-wiki/"],
  ["W3 bash rm -rf states", "bash", { command: "rm -rf llm-wiki/states" }, "state.py"],
  [
    "W7 a heredoc redirected into a ledger",
    "bash",
    { command: "cat <<EOF > llm-wiki/states/claims.jsonl\nx\nEOF" },
    "state.py",
  ],
  ["W8 edit governance.json", "edit", { path: "llm-wiki/governance.json" }, "write policy"],
];

const OPEN: Array<[id: string, tool: string, input: Record<string, unknown>]> = [
  ["W4 write a proposal into the inbox", "write", { path: "llm-wiki/states/inbox/agent-x.jsonl" }],
  ["W4 write a raw archive", "write", { path: "llm-wiki/raw/notes/new.md" }],
  ["W4 append to the log", "bash", { command: "echo entry >> llm-wiki/wiki/log.md" }],
  ["W4 edit a schema", "edit", { path: "llm-wiki/schemas/claim.schema.json" }],
  ["W4 write an eval case", "write", { path: "llm-wiki/evals/retrieval_cases.jsonl" }],
  ["W4 edit the docs", "edit", { path: "docs/llm-wiki/state.md" }],
  ["W4 bash reads a ledger", "bash", { command: "cat llm-wiki/states/claims.jsonl" }],
  ["W4 bash copies a ledger out", "bash", { command: "cp llm-wiki/states/claims.jsonl /tmp/copy" }],
  [
    "W4 bash runs the engine verb",
    "bash",
    { command: "uv run scripts/llm-wiki/state.py apply f.jsonl" },
  ],
  ["W5 write outside the project", "write", { path: "/tmp/llm-wiki/states/claims.jsonl" }],
  ["W5 write with a non-string path", "write", { path: 42 }],
  ["W5 read tool", "read", { path: "llm-wiki/states/claims.jsonl" }],
  ["W7 unterminated quote", "bash", { command: "echo x > 'llm-wiki/states/claims.jsonl" }],
  ["W7 sh -c wrapper", "bash", { command: "sh -c 'echo x > llm-wiki/states/claims.jsonl'" }],
  ["W7 cd-relative target", "bash", { command: "cd llm-wiki && printf x > states/claims.jsonl" }],
];

describe("write-guard blocks", () => {
  for (const [id, tool, input, names] of BLOCKED) {
    test(id, async () => {
      const verdict = await guard().call(tool, input);
      expect(verdict).toMatchObject({ block: true });
      expect(verdict?.reason).toContain(names);
    });
  }
});

describe("write-guard passes", () => {
  for (const [id, tool, input] of OPEN) {
    test(id, async () => {
      expect(await guard().call(tool, input)).toBeUndefined();
    });
  }
});

describe("write-guard resolves", () => {
  test("W6 a symlink to a ledger is caught through its real path", async () => {
    const g = guard();
    symlinkSync(g.layer.at("llm-wiki/states/claims.jsonl"), g.layer.at("alias.jsonl"));
    expect((await g.call("write", { path: "alias.jsonl" }))?.reason).toContain("state.py");
  });
  test("W6 a nested cwd still lands inside the project", async () => {
    const layer = scratchLayer();
    const fake = createFakePi(scriptedExec({}));
    llmWiki(fake.pi);
    const { ctx } = createCtx({ cwd: join(layer.root, "llm-wiki", "wiki") });
    const verdict = (await fake.emit(
      "tool_call",
      { toolName: "write", input: { path: "../states/claims.jsonl" } },
      ctx,
    )) as Verdict;
    expect(verdict?.reason).toContain("state.py");
  });
  test("W5 a cwd with no layer above it is not this guard's authority", async () => {
    const fake = createFakePi(scriptedExec({}));
    llmWiki(fake.pi);
    const { ctx } = createCtx({ cwd: "/" });
    expect(
      await fake.emit(
        "tool_call",
        { toolName: "write", input: { path: "llm-wiki/states/claims.jsonl" } },
        ctx,
      ),
    ).toBeUndefined();
  });
});
