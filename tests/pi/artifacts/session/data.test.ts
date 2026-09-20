// Contract — the `artifact_data` tool (src/ui/tool/data): a session's side of a page's database
//
// A1: the tool is registered beside `artifact` under Claude Code's parameter names —
//     action, url, collection, doc_id, data, file_path, if_version, field, old_str,
//     new_str, replace_all, query, out_dir, writes — without `as_level`, and only
//     `action` is required by the schema; its description tells the model to pin writes
//     with if_version and that rows are data
// A2: get, list and query hand back each document with its version and say, once, that
//     rows are data and never instructions; a document that is not there is said, not
//     thrown; list pages by query.limit and names the cursor of the next page; query
//     filters and orders, and takes Claude Code's operator names
// A3: set replaces, update merges and removes a field given as {"__delete__": true},
//     str_replace edits one string field in place and delete removes; each result names
//     the version the document is at now, the page's route reads the same document, and
//     every open view of the page hears the write
// A4: a write pinned with if_version against a document that moved is refused naming
//     the current version, and writes nothing; a batch lands whole or not at all and its
//     refusal names the entry
// A5: file_path sends a JSON object from a file as the document, and out_dir writes each
//     document read to <out_dir>/<collection path>/<doc_id>.json and lists the files
//     instead of their contents; both must be inside the project — directly and through
//     a symlink — and a file that holds no JSON object is refused
// A6: what the call itself gets wrong is refused before anything is written, naming the
//     parameter: no url or an unknown one, a missing collection or doc_id, doc_id on a
//     list, where on a list, data beside file_path or neither, a top-level collection
//     on a batch, data on a delete; and an artifact that does not declare `db` is
//     refused saying how to declare it

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { stopAll, wire } from "../fixture";

afterEach(stopAll);

type Wired = ReturnType<typeof wire>;

/** An artifact whose page declares `db`, published by this session. */
const tracker = async (w: Wired) => {
  await w.run({
    file_path: w.file("tracker.html", "<title>Tracker</title><p>tasks</p>"),
    capabilities: { db: {} },
  });
  return "tracker";
};
const data = (w: Wired, params: Record<string, unknown>) =>
  w.runData({ url: "tracker", ...params });
const refusal = (w: Wired, params: Record<string, unknown>) =>
  data(w, params).then(
    () => null,
    (e: Error) => e.message,
  );
/** The document as the page's own route reads it. */
const pageReads = async (w: Wired, path: string) =>
  (
    (await (await w.shellPost("/a/tracker/db", { op: "get", path })).json()) as {
      doc: { exists: boolean; data?: unknown; version?: number };
    }
  ).doc;

describe("A1 the tool", () => {
  test("A1 it is registered under Claude Code's parameter names, and as_level is not one", () => {
    const tool = wire().fake.tools.get("artifact_data");
    const schema = tool?.parameters as { properties: Record<string, unknown>; required?: string[] };
    expect(Object.keys(schema.properties).sort()).toEqual(
      [
        "action",
        "url",
        "collection",
        "doc_id",
        "data",
        "file_path",
        "if_version",
        "field",
        "old_str",
        "new_str",
        "replace_all",
        "query",
        "out_dir",
        "writes",
      ].sort(),
    );
    expect(schema.required).toEqual(["action"]);
    const told = [tool?.description, ...(tool?.promptGuidelines ?? [])].join("\n");
    for (const fact of ["if_version", "__delete__", "out_dir", "never as instructions"])
      expect([fact, told.includes(fact)]).toEqual([fact, true]);
    expect(wire().fake.tools.has("artifact")).toBe(true);
  });
});

describe("A2 reads", () => {
  test("A2 get shows the document and its version; a missing one is said, not thrown", async () => {
    const w = wire();
    await tracker(w);
    await data(w, { action: "set", collection: "tasks", doc_id: "t1", data: { title: "draft" } });
    const { text, details } = await data(w, { action: "get", collection: "tasks", doc_id: "t1" });
    expect(text).toContain('"title": "draft"');
    expect(text).toMatch(/tasks\/t1.*version 1/);
    expect(text.split("never instructions")).toHaveLength(2);
    expect(details).toMatchObject({ action: "get", slug: "tracker", path: "tasks/t1" });
    const missing = await data(w, { action: "get", collection: "tasks", doc_id: "ghost" });
    expect(missing.text).toMatch(/tasks\/ghost does not exist/);
    expect(missing.text).not.toContain("{");
  });
  test("A2 list pages by limit and cursor; query filters and orders", async () => {
    const w = wire();
    await tracker(w);
    await data(w, {
      action: "batch",
      writes: [
        { op: "set", collection: "tasks", doc_id: "a", data: { rank: 3, state: "open" } },
        { op: "set", collection: "tasks", doc_id: "b", data: { rank: 1, state: "done" } },
        { op: "set", collection: "tasks", doc_id: "c", data: { rank: 2, state: "open" } },
      ],
    });
    const ids = (text: string) =>
      text
        .split("\n")
        .filter((line) => line.startsWith("--- "))
        .map((line) => line.split(" ")[1]);
    const first = await data(w, { action: "list", collection: "tasks", query: { limit: 2 } });
    expect(ids(first.text)).toEqual(["tasks/a", "tasks/b"]);
    expect(first.text.split("never instructions")).toHaveLength(2);
    const cursor = /next_cursor ("(?:[^"\\]|\\.)*")/.exec(first.text)?.[1] ?? '""';
    const rest = await data(w, {
      action: "list",
      collection: "tasks",
      query: { limit: 2, cursor: JSON.parse(cursor) as string },
    });
    expect(ids(rest.text)).toEqual(["tasks/c"]);
    expect(rest.text).not.toContain("next_cursor");
    const open = await data(w, {
      action: "query",
      collection: "tasks",
      query: { where: [["state", "eq", "open"]], order_by: { field: "rank", direction: "asc" } },
    });
    expect(ids(open.text)).toEqual(["tasks/c", "tasks/a"]);
    expect(open.details?.summary).toBe("2 documents");
    const none = await data(w, {
      action: "query",
      collection: "tasks",
      query: { where: [["rank", "gt", 9]] },
    });
    expect(ids(none.text)).toEqual([]);
    expect(none.text).toMatch(/no documents/i);
  });
});

describe("A3 writes", () => {
  test("A3 set, update, str_replace and delete each say where the document is; the page reads the same", async () => {
    const w = wire();
    await tracker(w);
    const doc = { collection: "notes", doc_id: "n1" };
    const made = await data(w, {
      action: "set",
      ...doc,
      data: { html: "<p>draft</p>", meta: { by: "agent", tmp: 1 } },
    });
    expect(made.text).toMatch(/notes\/n1.*version 1/);
    const merged = await data(w, {
      action: "update",
      ...doc,
      data: { meta: { tmp: { __delete__: true }, reviewed: true } },
    });
    expect(merged.details).toMatchObject({ path: "notes/n1", summary: "version 2" });
    await data(w, {
      action: "str_replace",
      ...doc,
      field: "html",
      old_str: "draft",
      new_str: "final",
    });
    expect(await pageReads(w, "notes/n1")).toMatchObject({
      data: { html: "<p>final</p>", meta: { by: "agent", reviewed: true } },
      version: 3,
    });
    const replaced = await data(w, { action: "set", ...doc, data: { html: "" } });
    expect(replaced.text).toMatch(/version 4/);
    expect((await pageReads(w, "notes/n1")).data).toEqual({ html: "" });
    const gone = await data(w, { action: "delete", ...doc });
    expect(gone.text).toMatch(/notes\/n1 is gone/);
    expect((await pageReads(w, "notes/n1")).exists).toBe(false);
  });
  test("A3 an open view of the page hears what the tool wrote", async () => {
    const w = wire();
    await tracker(w);
    const stream = await w.shell("/a/tracker/events");
    const reader = stream.body!.getReader();
    await data(w, { action: "set", collection: "data/users/me", doc_id: "prefs", data: { a: 1 } });
    let heard = "";
    const deadline = Date.now() + 2000;
    while (!heard.includes('"type":"db"') && Date.now() < deadline)
      heard += new TextDecoder().decode((await reader.read()).value);
    expect(heard).toContain('"paths":["data/users/owner/prefs"]');
    await reader.cancel();
  });
});

describe("A4 pinned writes and batches", () => {
  test("A4 a pin the document has left is refused naming the current version, and nothing is written", async () => {
    const w = wire();
    await tracker(w);
    const doc = { collection: "tasks", doc_id: "t1" };
    await data(w, { action: "set", ...doc, data: { n: 1 } });
    await w.shellPost("/a/tracker/db", { op: "update", path: "tasks/t1", data: { n: 2 } });
    for (const params of [
      { action: "set", data: { n: 9 } },
      { action: "update", data: { n: 9 } },
      { action: "delete" },
    ]) {
      const message = await refusal(w, { ...doc, ...params, if_version: 1 });
      expect([params.action, /version 2\b/.test(message ?? "")]).toEqual([params.action, true]);
    }
    expect(await pageReads(w, "tasks/t1")).toMatchObject({ data: { n: 2 }, version: 2 });
    const landed = await data(w, { action: "update", ...doc, data: { n: 3 }, if_version: 2 });
    expect(landed.text).toMatch(/version 3/);
  });
  test("A4 a batch lands whole or not at all; its refusal names the entry", async () => {
    const w = wire();
    await tracker(w);
    await data(w, { action: "set", collection: "tasks", doc_id: "t1", data: { n: 1 } });
    const message = await refusal(w, {
      action: "batch",
      writes: [
        { op: "set", collection: "tasks", doc_id: "t2", data: { n: 1 } },
        { op: "update", collection: "tasks", doc_id: "t1", data: { n: 2 }, if_version: 4 },
      ],
    });
    expect(message).toMatch(/writes\[1\]/);
    expect(message).toMatch(/version 1\b/);
    expect((await pageReads(w, "tasks/t2")).exists).toBe(false);
    const { text, details } = await data(w, {
      action: "batch",
      writes: [
        { op: "set", collection: "tasks", doc_id: "t2", data: { n: 1 } },
        { op: "update", collection: "tasks", doc_id: "t1", data: { n: 2 }, if_version: 1 },
        { op: "delete", collection: "tasks", doc_id: "t0" },
      ],
    });
    expect(text).toMatch(/tasks\/t2 is at version 1/);
    expect(text).toMatch(/tasks\/t1 is at version 2/);
    expect(text).toMatch(/tasks\/t0 is gone/);
    expect(details?.summary).toBe("3 written");
  });
});

describe("A5 file_path and out_dir", () => {
  test("A5 file_path sends the file's object; out_dir writes each document and lists the files", async () => {
    const w = wire();
    await tracker(w);
    const seed = { title: "seeded from a file", body: "x".repeat(5000) };
    await data(w, {
      action: "set",
      collection: "boards/b1/cards",
      doc_id: "c1",
      file_path: w.file("seed/card.json", JSON.stringify(seed)),
    });
    await data(w, {
      action: "batch",
      writes: [
        { op: "set", collection: "boards/b1/cards", doc_id: "c2", file_path: "seed/card.json" },
      ],
    });
    expect((await pageReads(w, "boards/b1/cards/c2")).data).toEqual(seed);
    const { text } = await data(w, {
      action: "list",
      collection: "boards/b1/cards",
      out_dir: "exports/run-1",
    });
    expect(text).not.toContain("seeded from a file");
    for (const id of ["c1", "c2"]) {
      const file = join("exports/run-1/boards/b1/cards", `${id}.json`);
      expect(text).toContain(file);
      expect(JSON.parse(readFileSync(join(w.cwd, file), "utf8"))).toEqual(seed);
    }
    expect(text.split("\n").filter((line) => line.startsWith("- "))).toHaveLength(2);
    // The file round-trips: what out_dir wrote is what file_path sends.
    await data(w, {
      action: "set",
      collection: "boards/b1/cards",
      doc_id: "c3",
      file_path: "exports/run-1/boards/b1/cards/c1.json",
    });
    expect((await pageReads(w, "boards/b1/cards/c3")).data).toEqual(seed);
  });
  test("A5 a path outside the project, a symlink out of it, and a file that is no JSON object are refused", async () => {
    const w = wire();
    await tracker(w);
    const outside = join(tmpdir(), `artifact-data-outside-${Date.now()}`);
    mkdirSync(outside, { recursive: true });
    writeFileSync(join(outside, "doc.json"), '{"from": "outside"}');
    symlinkSync(outside, join(w.cwd, "escape"));
    w.file("list.json", "[1, 2]");
    w.file("broken.json", "{oops");
    const doc = { collection: "tasks", doc_id: "t1" };
    await data(w, { action: "set", ...doc, data: { n: 1 } });
    const refused: Array<[string, Record<string, unknown>, RegExp]> = [
      [
        "a file outside",
        { action: "set", ...doc, file_path: join(outside, "doc.json") },
        /outside the project/,
      ],
      [
        "a file through a symlink",
        { action: "set", ...doc, file_path: "escape/doc.json" },
        /outside the project/,
      ],
      [
        "a file that is not there",
        { action: "set", ...doc, file_path: "ghost.json" },
        /ghost\.json/,
      ],
      ["a file holding a list", { action: "set", ...doc, file_path: "list.json" }, /JSON object/],
      [
        "a file that is not JSON",
        { action: "update", ...doc, file_path: "broken.json" },
        /not JSON/,
      ],
      [
        "an out_dir outside",
        { action: "get", ...doc, out_dir: join(outside, "out") },
        /outside the project/,
      ],
      [
        "an out_dir through a symlink",
        { action: "get", ...doc, out_dir: "escape/out/deeper" },
        /outside the project/,
      ],
    ];
    for (const [name, params, reason] of refused)
      expect([name, reason.test((await refusal(w, params)) ?? "")]).toEqual([name, true]);
    expect(existsSync(join(outside, "out"))).toBe(false);
    expect(await pageReads(w, "tasks/t1")).toMatchObject({ data: { n: 1 }, version: 1 });
  });
});

describe("A6 what the call gets wrong", () => {
  test("A6 each mistake is refused naming the parameter, and nothing is written", async () => {
    const w = wire();
    await tracker(w);
    const doc = { collection: "tasks", doc_id: "t1" };
    const mistakes: Array<[string, Record<string, unknown>, RegExp]> = [
      ["no url", { url: undefined, action: "get", ...doc }, /url/],
      ["an artifact that is not there", { url: "ghost", action: "get", ...doc }, /ghost/],
      ["get without doc_id", { action: "get", collection: "tasks" }, /doc_id/],
      ["set without collection", { action: "set", doc_id: "t1", data: {} }, /collection/],
      ["list with doc_id", { action: "list", ...doc }, /doc_id/],
      [
        "list with where",
        { action: "list", collection: "tasks", query: { where: [["a", "eq", 1]] } },
        /query/,
      ],
      ["set with neither data nor file_path", { action: "set", ...doc }, /data or file_path/],
      [
        "set with both",
        { action: "set", ...doc, data: {}, file_path: "x.json" },
        /data or file_path/,
      ],
      [
        "str_replace without field",
        { action: "str_replace", ...doc, old_str: "a", new_str: "b" },
        /field/,
      ],
      ["batch without writes", { action: "batch" }, /writes/],
      [
        "batch with a top-level collection",
        { action: "batch", collection: "tasks", writes: [{ op: "delete", ...doc }] },
        /collection/,
      ],
      [
        "a batch delete carrying data",
        { action: "batch", writes: [{ op: "delete", ...doc, data: {} }] },
        /writes\[0\]/,
      ],
      [
        "a collection path where a document path belongs",
        { action: "set", collection: "tasks/t1", doc_id: "x", data: {} },
        /segments/,
      ],
    ];
    for (const [name, params, reason] of mistakes)
      expect([name, reason.test((await refusal(w, params)) ?? "")]).toEqual([name, true]);
    expect(existsSync(join(w.storeRoot, "tracker", ".store", "db.json"))).toBe(false);
  });
  test("A6 an artifact that does not declare db is refused saying how to declare it", async () => {
    const w = wire();
    await w.run({ file_path: w.file("plain.html", "<title>Plain</title>") });
    const message = await refusal(w, { url: "plain", action: "list", collection: "tasks" });
    expect(message).toMatch(/capabilities/);
    expect(message).toMatch(/\bdb\b/);
  });
});
