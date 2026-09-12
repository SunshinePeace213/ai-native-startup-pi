import { describe, expect, test } from "bun:test";

import {
  formatLeads,
  formatQueue,
  formatUnregistered,
  groundable,
  LEAD_TEXT_CHARS,
  MAX_QUEUE_LINES,
} from "./format";

describe("groundable", () => {
  test("a question of four or more words grounds", () => {
    expect(groundable("how does the retriever fuse streams")).toBe(true);
  });
  test("commands, shell escapes, memory lines, and short prompts do not", () => {
    expect(groundable("/skill:llm-wiki-lint")).toBe(false);
    expect(groundable("!git status")).toBe(false);
    expect(groundable("# remember this")).toBe(false);
    expect(groundable("fix it")).toBe(false);
    expect(groundable("")).toBe(false);
    expect(groundable(42)).toBe(false);
  });
});

describe("formatQueue", () => {
  const row = (n: number) => ({
    path: `llm-wiki/raw/chats/c${n}.md`,
    channel: "chats",
    lane: "light",
  });

  test("counts, rows, and the ingest sentence", () => {
    const block = formatQueue({ total: 2, unregistered: [row(1)], unextracted: [row(2)] }, 1);
    expect(block).toContain("2 archives under llm-wiki/raw/ wait: 1 unregistered · 1 filed light");
    expect(block).toContain("1 proposals wait in states/inbox/");
    expect(block).toContain("llm-wiki/raw/chats/c1.md · chats · light lane");
    expect(block).toContain("llm-wiki/raw/chats/c2.md · chats · light lane · filed light");
    expect(block).toContain("/skill:llm-wiki-ingest --queue");
    expect(block.startsWith("<llm-wiki-queue>")).toBe(true);
    expect(block.endsWith("</llm-wiki-queue>")).toBe(true);
  });
  test("singular wording", () => {
    expect(formatQueue({ total: 1, unregistered: [row(1)], unextracted: [] })).toContain(
      "1 archive under llm-wiki/raw/ waits",
    );
  });
  test("caps the rows and counts the rest", () => {
    const rows = Array.from({ length: MAX_QUEUE_LINES + 3 }, (_, i) => row(i));
    const block = formatQueue({ total: rows.length, unregistered: rows, unextracted: [] });
    expect(block.split("\n").filter((line) => line.startsWith("  llm-wiki/")).length).toBe(
      MAX_QUEUE_LINES,
    );
    expect(block).toContain("… and 3 more");
  });
});

describe("formatLeads", () => {
  test("a malformed slice yields nothing", () => {
    expect(formatLeads({})).toBe("");
  });
  test("a valid slice with no usable leads yields the no-leads cue", () => {
    expect(formatLeads({ claims: [] })).toContain("hold no leads for this prompt");
    expect(formatLeads({ claims: [{ current_text: "" }] })).toContain(
      "hold no leads for this prompt",
    );
  });
  test("leads carry key, probability, status, flags, pages, and truncated text", () => {
    const long = "x".repeat(LEAD_TEXT_CHARS + 40);
    const block = formatLeads({
      claims: [
        {
          claim_key: "a.b",
          probability: 0.9123,
          status: "disputed",
          flags: ["disputed"],
          needs_review: true,
          current_text: long,
          pages: ["llm-wiki/wiki/concepts/a.md"],
        },
        { claim_id: "clm_1", current_text: "second lead text" },
        { current_text: "third" },
        { current_text: "fourth, past the cap" },
      ],
    });
    expect(block).toContain("3 leads the knowledge base holds");
    expect(block).toContain("  a.b · p 0.91 · disputed · ⚠ disputed, needs_review");
    expect(block).toContain("    pages: llm-wiki/wiki/concepts/a.md");
    expect(block).toContain("  clm_1 · unknown");
    expect(block).not.toContain("fourth");
    const textLine = block.split("\n").find((line) => line.startsWith("    xxx")) ?? "";
    expect(textLine.trim().length).toBe(LEAD_TEXT_CHARS);
    expect(textLine.trim().endsWith("…")).toBe(true);
    expect(block).toContain("llm-wiki-librarian");
  });
});

describe("formatUnregistered", () => {
  test("names the ingest skill with the path", () => {
    expect(formatUnregistered("llm-wiki/raw/notes/n.md")).toContain(
      "`/skill:llm-wiki-ingest llm-wiki/raw/notes/n.md`",
    );
  });
});
