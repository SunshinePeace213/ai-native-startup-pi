// engine-bridge — engine.ts, the seam every hook of .pi/extensions/llm-wiki shares.
//
// E1  exec throws, exits non-zero, is killed, or prints anything but a JSON object →
//     queue() and search() answer null
// E2  a JSON object of the right shape → the parsed object; queue() also rejects an
//     object missing total/unregistered/unextracted
// E3  layerRoot walks up from cwd to the nearest directory holding both llm-wiki/ and
//     scripts/llm-wiki/state.py, and answers null when none does
// E4  the engine is always run through `uv run` with --root set to the layer root
// E5  inboxCount counts only .jsonl proposals and answers 0 for a missing inbox

import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { inboxCount, layerRoot, queue, search } from "@ext/llm-wiki/engine";
import type { ExecFn } from "@ext/llm-wiki/engine";
import { FAIL_OPEN, ok, scriptedExec } from "@harness/scripted-exec";
import { scratchLayer } from "@harness/scratch-layer";

const asExecFn =
  (script: (call: { command: string; args: string[]; options?: unknown }) => unknown): ExecFn =>
  (command, args, options) =>
    Promise.resolve(script({ command, args, options }) as never);

describe("engine-bridge", () => {
  for (const [name, exec] of FAIL_OPEN) {
    test(`E1 ${name} → null from queue and search`, async () => {
      const fn = asExecFn(exec);
      expect(await queue(fn, "/root", 100)).toBeNull();
      expect(await search(fn, "/root", "q", 3, 100)).toBeNull();
    });
  }

  test("E2 a well-shaped answer is returned as parsed", async () => {
    const answer = {
      total: 1,
      unregistered: [{ path: "x", channel: "notes", lane: "deep" }],
      unextracted: [],
    };
    const fn = asExecFn(scriptedExec({ queue: ok(answer), search: ok({ claims: [] }) }));
    expect(await queue(fn, "/root", 100)).toEqual(answer);
    expect(await search(fn, "/root", "q", 3, 100)).toEqual({ claims: [] });
  });
  test("E2 a queue answer of the wrong shape → null", async () => {
    const fn = asExecFn(scriptedExec({ queue: ok({ total: "1", unregistered: [] }) }));
    expect(await queue(fn, "/root", 100)).toBeNull();
  });

  test("E3 layerRoot finds the layer from a nested cwd and refuses a bare layer", () => {
    const layer = scratchLayer();
    expect(layerRoot(join(layer.root, "llm-wiki", "wiki", "concepts"))).toBe(layer.root);
    expect(layerRoot(layer.root)).toBe(layer.root);
    const bare = scratchLayer();
    mkdirSync(join(bare.root, "only-layer", "llm-wiki"), { recursive: true });
    // only-layer/ has llm-wiki/ but no engine; the walk continues up to bare.root, which has both.
    expect(layerRoot(join(bare.root, "only-layer"))).toBe(bare.root);
    expect(layerRoot("/")).toBeNull();
  });

  test("E4 the engine runs through uv with --root at the layer root", async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const fn = asExecFn((call) => {
      calls.push(call);
      return ok({ total: 0, unregistered: [], unextracted: [] });
    });
    await queue(fn, "/the/root", 100);
    expect(calls[0]?.command).toBe("uv");
    expect(calls[0]?.args.slice(0, 1)).toEqual(["run"]);
    expect(calls[0]?.args).toContain("--root");
    expect(calls[0]?.args[calls[0].args.indexOf("--root") + 1]).toBe("/the/root");
  });

  test("E5 inboxCount counts .jsonl proposals only, 0 without an inbox", () => {
    const layer = scratchLayer();
    writeFileSync(layer.at("llm-wiki/states/inbox/a.jsonl"), "");
    writeFileSync(layer.at("llm-wiki/states/inbox/b.jsonl"), "");
    writeFileSync(layer.at("llm-wiki/states/inbox/notes.txt"), "");
    expect(inboxCount(layer.root)).toBe(2);
    expect(inboxCount("/nonexistent")).toBe(0);
  });
});
