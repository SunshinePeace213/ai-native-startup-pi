// queue — the session_start hook of .pi/extensions/llm-wiki.
//
// Q1  the engine reports waiting archives or the inbox holds proposals → one message
//     delivered next turn, carrying the counts, each waiting path with its channel and
//     lane, and the verb to run; the status line names both counts
// Q2  nothing waits anywhere → no message, the status line is cleared
// Q3  the engine is unreachable → nothing sent, nothing set
// Q4  more rows than MAX_QUEUE_LINES → the rows are capped and the rest are counted
// Q5  the block is a machine-parsed format: <llm-wiki-queue> … </llm-wiki-queue>
// Q6  without a UI the status is not set, the message still goes
// Q7  session_start replayed on the unchanged conversation (reason "reload") → the status
//     refreshes but no second reminder is queued; every reason that opens a conversation
//     not yet told (startup, new, resume, fork) sends

import { describe, expect, test } from "bun:test";
import { writeFileSync } from "node:fs";

import llmWiki from "@ext/llm-wiki/index";
import { MAX_QUEUE_LINES } from "@ext/llm-wiki/format";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi, type ExecScript } from "@harness/fake-pi";
import { FAIL_OPEN, ok, scriptedExec } from "@harness/scripted-exec";
import { scratchLayer } from "@harness/scratch-layer";

const row = (n: number, lane = "light") => ({
  path: `llm-wiki/raw/chats/c${n}.md`,
  channel: "chats",
  lane,
});
const EMPTY = { total: 0, unregistered: [], unextracted: [] };

function session(
  exec: ExecScript,
  options: { hasUI?: boolean; inbox?: number; reason?: string } = {},
) {
  const layer = scratchLayer();
  for (let i = 0; i < (options.inbox ?? 0); i++) {
    writeFileSync(layer.at(`llm-wiki/states/inbox/agent-${i}.jsonl`), "{}\n");
  }
  const fake = createFakePi(exec);
  llmWiki(fake.pi);
  const { ctx, status } = createCtx({ cwd: layer.root, hasUI: options.hasUI });
  return {
    fake,
    status,
    start: (reason = options.reason ?? "startup") => fake.emit("session_start", { reason }, ctx),
  };
}

describe("queue", () => {
  test("Q1 waiting archives → a next-turn message with counts, paths, and the verb", async () => {
    const s = session(
      scriptedExec({
        queue: ok({ total: 2, unregistered: [row(1)], unextracted: [row(2, "deep")] }),
      }),
      { inbox: 1 },
    );
    await s.start();
    expect(s.fake.sent).toHaveLength(1);
    const { message, options } = s.fake.sent[0]!;
    expect(message.customType).toBe("llm-wiki-queue");
    expect(options).toMatchObject({ deliverAs: "nextTurn" });
    const block = String(message.content);
    for (const fact of [
      "2",
      "llm-wiki/raw/chats/c1.md",
      "llm-wiki/raw/chats/c2.md",
      "chats",
      "deep",
      "1 proposal",
      "/skill:llm-wiki-ingest --queue",
    ]) {
      expect(block).toContain(fact);
    }
    expect(block.startsWith("<llm-wiki-queue>")).toBe(true); // Q5
    expect(block.trimEnd().endsWith("</llm-wiki-queue>")).toBe(true);
    expect(s.status.get("llm-wiki")).toContain("2");
    expect(s.status.get("llm-wiki")).toContain("1");
  });

  test("Q1 an empty queue but a waiting inbox still sends", async () => {
    const s = session(scriptedExec({ queue: ok(EMPTY) }), { inbox: 2 });
    await s.start();
    expect(s.fake.sent).toHaveLength(1);
    expect(String(s.fake.sent[0]!.message.content)).toContain("2 proposals");
  });

  test("Q2 nothing waits → no message, status cleared", async () => {
    const s = session(scriptedExec({ queue: ok(EMPTY) }));
    await s.start();
    expect(s.fake.sent).toEqual([]);
    expect(s.status.get("llm-wiki")).toBe("");
  });

  for (const [name, exec] of FAIL_OPEN) {
    test(`Q3 ${name} → nothing sent, nothing set`, async () => {
      const s = session(exec, { inbox: 1 });
      await s.start();
      expect(s.fake.sent).toEqual([]);
      expect(s.status.has("llm-wiki")).toBe(false);
    });
  }
  test("Q3 a JSON answer of the wrong shape → nothing sent", async () => {
    const s = session(scriptedExec({ queue: ok({ total: "2", unregistered: [] }) }));
    await s.start();
    expect(s.fake.sent).toEqual([]);
  });

  test("Q4 rows past MAX_QUEUE_LINES are capped and counted", async () => {
    const rows = Array.from({ length: MAX_QUEUE_LINES + 3 }, (_, i) => row(i));
    const s = session(
      scriptedExec({ queue: ok({ total: rows.length, unregistered: rows, unextracted: [] }) }),
    );
    await s.start();
    const block = String(s.fake.sent[0]!.message.content);
    expect(block.split("\n").filter((l) => l.includes("llm-wiki/raw/chats/")).length).toBe(
      MAX_QUEUE_LINES,
    );
    expect(block).toContain("3 more");
  });

  const WAITING = { total: 1, unregistered: [row(1)], unextracted: [] };

  test("Q7 a reload replays session_start → status refreshed, no second reminder", async () => {
    const s = session(scriptedExec({ queue: ok(WAITING) }), { hasUI: true });
    await s.start("startup");
    await s.start("reload");
    await s.start("reload");
    expect(s.fake.sent).toHaveLength(1);
    expect(s.status.get("llm-wiki")).toContain("1");
  });

  test("Q7 a reload with nothing yet sent stays silent but still refreshes", async () => {
    const s = session(scriptedExec({ queue: ok(WAITING) }), { hasUI: true });
    await s.start("reload");
    expect(s.fake.sent).toEqual([]);
    expect(s.status.get("llm-wiki")).toContain("1");
  });

  for (const reason of ["startup", "new", "resume", "fork"]) {
    test(`Q7 ${reason} opens a conversation not yet told → the reminder is sent`, async () => {
      const s = session(scriptedExec({ queue: ok(WAITING) }));
      await s.start(reason);
      expect(s.fake.sent).toHaveLength(1);
      expect(s.fake.sent[0]!.message.customType).toBe("llm-wiki-queue");
    });
  }

  test("Q6 without a UI the message still goes and no status is set", async () => {
    const s = session(
      scriptedExec({ queue: ok({ total: 1, unregistered: [row(1)], unextracted: [] }) }),
      {
        hasUI: false,
      },
    );
    await s.start();
    expect(s.fake.sent).toHaveLength(1);
    expect(s.status.size).toBe(0);
  });
});
