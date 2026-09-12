// grounding — the input → before_agent_start pair of .pi/extensions/llm-wiki.
//
// G1  a prompt of four or more words with usable leads → one hidden llm-wiki-leads
//     message carrying, per lead, the claim key, the probability to two decimals, the
//     status, its flags, and its pages; at most MAX_GROUNDING_LEADS of them
// G2  a slash command, a `!` shell escape, a `#` memory line, or fewer than four words →
//     no message and no exec
// G3  the retriever fails, or answers with no usable lead → no leads block that cites
//     anything; a valid empty answer says the wiki holds nothing for the prompt
// G4  the skip decided on the raw input text does not leak into the next turn
// G5  the leads block is a machine-parsed format: it opens with <llm-wiki> and closes
//     with </llm-wiki>

import { describe, expect, test } from "bun:test";

import llmWiki from "@ext/llm-wiki/index";
import { MAX_GROUNDING_LEADS } from "@ext/llm-wiki/format";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi, type ExecScript } from "@harness/fake-pi";
import { FAIL_OPEN, ok, scriptedExec } from "@harness/scripted-exec";
import { scratchLayer } from "@harness/scratch-layer";

type Grounded = { message: { customType: string; content: string; display: boolean } } | undefined;

const LEADS = {
  claims: [
    {
      claim_key: "a.b",
      probability: 0.9123,
      status: "disputed",
      flags: ["disputed"],
      needs_review: true,
      current_text: "the first lead",
      pages: ["llm-wiki/wiki/concepts/a.md"],
    },
    { claim_id: "clm_2", current_text: "the second lead" },
    { current_text: "the third lead" },
    { current_text: "the fourth lead, past the cap" },
  ],
};

function grounding(exec: ExecScript) {
  const layer = scratchLayer();
  const fake = createFakePi(exec);
  llmWiki(fake.pi);
  const { ctx } = createCtx({ cwd: layer.root });
  return {
    fake,
    input: (text: string) => fake.emit("input", { text, source: "interactive" }, ctx),
    start: (prompt: string) =>
      fake.emit(
        "before_agent_start",
        { prompt, systemPrompt: "", systemPromptOptions: {} },
        ctx,
      ) as Promise<Grounded>,
  };
}

const PROMPT = "how does the retriever fuse its streams";

describe("grounding", () => {
  test("G1 a question with leads yields a hidden message carrying the leads' facts", async () => {
    const g = grounding(scriptedExec({ search: ok(LEADS) }));
    await g.input(PROMPT);
    const result = await g.start(PROMPT);
    expect(result?.message.customType).toBe("llm-wiki-leads");
    expect(result?.message.display).toBe(false);
    const block = result?.message.content ?? "";
    for (const fact of [
      "a.b",
      "0.91",
      "disputed",
      "needs_review",
      "llm-wiki/wiki/concepts/a.md",
      "clm_2",
    ]) {
      expect(block).toContain(fact);
    }
    expect(block).toContain(`${MAX_GROUNDING_LEADS} leads`);
    expect(block).not.toContain("fourth");
    expect(block.startsWith("<llm-wiki>")).toBe(true); // G5
    expect(block.trimEnd().endsWith("</llm-wiki>")).toBe(true);
    expect(g.fake.execCalls.map((c) => c.args).flat()).toContain(PROMPT);
  });

  const SKIPS: Array<[id: string, text: string]> = [
    ["G2 a skill command", "/skill:llm-wiki-lint"],
    ["G2 a shell escape", "!git status"],
    ["G2 a memory line", "# remember this for later please"],
    ["G2 fewer than four words", "fix it"],
    ["G2 an empty prompt", ""],
  ];
  for (const [id, text] of SKIPS) {
    test(`${id} sends nothing and never execs`, async () => {
      const g = grounding(scriptedExec({ search: ok(LEADS) }));
      await g.input(text);
      expect(await g.start(text)).toBeUndefined();
      expect(g.fake.execCalls).toEqual([]);
    });
  }

  for (const [name, exec] of FAIL_OPEN) {
    test(`G3 ${name} → no message`, async () => {
      const g = grounding(exec);
      await g.input(PROMPT);
      expect(await g.start(PROMPT)).toBeUndefined();
    });
  }
  test("G3 a valid answer with no usable lead says the wiki holds nothing", async () => {
    const g = grounding(scriptedExec({ search: ok({ claims: [{ current_text: "" }] }) }));
    await g.input(PROMPT);
    const block = (await g.start(PROMPT))?.message.content ?? "";
    expect(block).toContain("no leads");
    expect(block).not.toContain("·");
  });
  test("G3 a malformed answer (no claims field) → no message", async () => {
    const g = grounding(scriptedExec({ search: ok({}) }));
    await g.input(PROMPT);
    expect(await g.start(PROMPT)).toBeUndefined();
  });

  test("G4 a skipped turn does not skip the next one", async () => {
    const g = grounding(scriptedExec({ search: ok(LEADS) }));
    await g.input("/skill:llm-wiki-lint");
    expect(await g.start("/skill:llm-wiki-lint expanded into a long prompt here")).toBeUndefined();
    await g.input(PROMPT);
    expect((await g.start(PROMPT))?.message.customType).toBe("llm-wiki-leads");
  });
});
