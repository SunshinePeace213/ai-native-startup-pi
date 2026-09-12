// archive-reminder — the tool_result hook of .pi/extensions/llm-wiki.
//
// A1  a successful write of a .md under llm-wiki/raw/ that the engine's queue lists as
//     unregistered → the tool result gains one text block naming the ingest skill and
//     that path; the original content is kept in front of it
// A2  a write of an archive the engine already registers, a file under raw/assets/, a
//     non-.md, a path outside raw/, an errored write, or any tool but write → untouched
// A3  the engine is unreachable → untouched

import { describe, expect, test } from "bun:test";

import llmWiki from "@ext/llm-wiki/index";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi, type ExecScript } from "@harness/fake-pi";
import { FAIL_OPEN, ok, scriptedExec } from "@harness/scripted-exec";
import { scratchLayer } from "@harness/scratch-layer";

type Amended = { content: Array<{ type: string; text?: string }> } | undefined;

const NEW = "llm-wiki/raw/notes/new.md";
const listing = (...paths: string[]) => ({
  total: paths.length,
  unregistered: paths.map((path) => ({ path, channel: "notes", lane: "deep" })),
  unextracted: [],
});
const ORIGINAL = [{ type: "text", text: "Successfully wrote" }];

function reminder(exec: ExecScript) {
  const layer = scratchLayer();
  const fake = createFakePi(exec);
  llmWiki(fake.pi);
  const { ctx } = createCtx({ cwd: layer.root });
  return (toolName: string, path: unknown, isError = false) =>
    fake.emit(
      "tool_result",
      { toolName, input: { path }, content: ORIGINAL, isError },
      ctx,
    ) as Promise<Amended>;
}

describe("archive-reminder", () => {
  test("A1 an unregistered raw archive gets the ingest reminder appended", async () => {
    const result = await reminder(scriptedExec({ queue: ok(listing(NEW)) }))("write", NEW);
    expect(result?.content[0]).toEqual(ORIGINAL[0]!);
    const added = result?.content[1]?.text ?? "";
    expect(added).toContain("llm-wiki-ingest");
    expect(added).toContain(NEW);
  });

  test("A1 an absolute path to the same archive is recognised", async () => {
    const layer = scratchLayer();
    const fake = createFakePi(scriptedExec({ queue: ok(listing(NEW)) }));
    llmWiki(fake.pi);
    const { ctx } = createCtx({ cwd: layer.root });
    const result = (await fake.emit(
      "tool_result",
      { toolName: "write", input: { path: layer.at(NEW) }, content: ORIGINAL, isError: false },
      ctx,
    )) as Amended;
    expect(result?.content).toHaveLength(2);
  });

  const UNTOUCHED: Array<
    [id: string, tool: string, path: unknown, isError?: boolean, queue?: object]
  > = [
    ["A2 the archive is already registered", "write", NEW, false, listing()],
    ["A2 a file under raw/assets/", "write", "llm-wiki/raw/assets/img.md"],
    ["A2 a non-.md under raw/", "write", "llm-wiki/raw/notes/data.json"],
    ["A2 a path outside raw/", "write", "docs/llm-wiki/state.md"],
    ["A2 an errored write", "write", NEW, true],
    ["A2 an edit, not a write", "edit", NEW],
    ["A2 a non-string path", "write", 42],
  ];
  for (const [id, tool, path, isError, queue] of UNTOUCHED) {
    test(`${id} → untouched`, async () => {
      const exec = scriptedExec({ queue: ok(queue ?? listing(NEW)) });
      expect(await reminder(exec)(tool, path, isError)).toBeUndefined();
    });
  }

  for (const [name, exec] of FAIL_OPEN) {
    test(`A3 ${name} → untouched`, async () => {
      expect(await reminder(exec)("write", NEW)).toBeUndefined();
    });
  }
});
