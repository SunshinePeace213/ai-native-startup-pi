// artifact — the tool of .pi/extensions/artifacts, driven as the model calls it,
// against the Bun server with the session's event stream open.
//
// A1  publish file_path → the artifact exists, watched, owned by this session,
//     at v1; the result names the URL and v1; the browser is opened once with
//     the token URL; publish again with url → v2 at the same URL and the
//     browser is not reopened
// A2  publish refuses a file outside the project, a missing file, and a .txt,
//     naming the reason; nothing is created
// A3  publish with a malformed questions island → throws naming the fault; a
//     valid one → the result states the schema and question count
// A4  ask with questions → the generated page is published and the call blocks;
//     a page publish with answers resolves it: the result carries the answers,
//     no artifact-feedback message is sent, and the event is acknowledged
// A5  ask that times out → the result says to end the turn and not re-ask; a
//     later page publish → one artifact-feedback message delivered as a
//     followUp that triggers a turn, naming the answers; nothing stays pending
// A6  ask whose signal aborts → the result says cancelled; the artifact stays
//     published and watched
// A7  read_page_data → the island and the unanswered required ids; a schema
//     the island does not declare → throws; an unknown schema → throws
// A8  unwatch → a page publish is held (no message, one pending); watch again
//     → the next publish is delivered
// A9  delivery "notify" → the message is queued for the next turn (no
//     triggerTurn) and the user is notified
// A10 wakesPerHour reached → further sends are held and the user is warned once
// A11 a comment sent to the agent → an artifact-feedback message naming the
//     thread; reply → the thread carries the agent's text; reply to a thread
//     not sent to the agent → throws; a plain comment sends nothing
// A12 delete → without a UI throws and deletes nothing; declined → stays;
//     confirmed → the folder is in the trash and the URL 404s
// A13 list and status name every slug with its version and pending count
// A14 url accepts the full page URL as well as the slug
// A15 slug chooses the path of a new artifact; a malformed one or one already
//     taken → throws naming the fix; slug is ignored when url updates
// A16 two sessions on one server: a send wakes the session that published,
//     not the other; after the owner shuts down, the other session is woken

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { islandScript, QUESTIONS, QUESTIONS_ISLAND, stopAll, tick, wire } from "../fixture";

afterEach(stopAll);

describe("artifact tool", () => {
  test("A1 publish creates, opens once, and republishes in place", async () => {
    const w = wire();
    const path = w.file("pages/plan.html", "<h1>Migration Plan</h1><p>steps</p>");
    const first = await w.run({ file_path: path, description: "The plan", icon: "🗺️" });
    expect(first.details).toMatchObject({ action: "publish", slug: "migration-plan", version: 1 });
    expect(first.text).toContain(`${w.origin()}/a/migration-plan?t=${w.token()}`);
    expect(first.text).toContain("v1");
    expect(first.text).toContain("Opened");
    expect(w.opened).toEqual([`${w.origin()}/a/migration-plan?t=${w.token()}`]);
    const m = w.backend.store.get("migration-plan");
    expect(m?.watched).toBe(true);
    expect(m?.owner).toBe(w.session);
    expect(m?.description).toBe("The plan");

    const second = await w.run({ file_path: path, url: "migration-plan", note: "with regions" });
    expect(second.details).toMatchObject({ slug: "migration-plan", version: 2 });
    expect(second.text).toContain("Republished");
    expect(w.opened).toHaveLength(1);
    expect(w.backend.store.get("migration-plan")?.versions.at(-1)?.note).toBe("with regions");
  });

  test("A2 publish refuses files it must not publish", async () => {
    const w = wire();
    await expect(w.run({ file_path: "/etc/hosts" })).rejects.toThrow(
      /must be \.html|outside the project/,
    );
    await expect(w.run({ file_path: "missing.html" })).rejects.toThrow(/not found/);
    const txt = w.file("notes.txt", "hi");
    await expect(w.run({ file_path: txt })).rejects.toThrow(/\.html, \.htm, or \.md/);
    const outside = w.file("../outside-artifacts-test.html", "<h1>x</h1>");
    await expect(w.run({ file_path: outside })).rejects.toThrow(/outside the project/);
    await expect(w.run({})).rejects.toThrow(/file_path/);
    expect(w.backend.store.list()).toEqual([]);
  });

  test("A3 a questions island is validated on publish", async () => {
    const w = wire();
    const bad = w.file(
      "bad.html",
      `<h1>Q</h1>${islandScript({ schema: "questions/v1", questions: [{ id: "a" }] })}`,
    );
    await expect(w.run({ file_path: bad })).rejects.toThrow(/questions\[0\]\.question/);
    expect(w.backend.store.list()).toEqual([]);
    const good = w.file("good.html", `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`);
    const { text } = await w.run({ file_path: good });
    expect(text).toContain("questions/v1");
    expect(text).toContain("3 questions");
  });

  test("A4 ask blocks until the page sends, then returns the answers", async () => {
    const w = wire();
    const pending = w.run({
      action: "ask",
      title: "Pricing decisions",
      questions: QUESTIONS,
      intro: "Three calls.",
    });
    await tick(80);
    const slug = "pricing-decisions";
    expect(w.backend.store.get(slug)?.current).toBe(1);
    expect(w.opened).toHaveLength(1);
    const page = await (await w.page(`/a/${slug}`)).text();
    expect(page).toContain("data-artifact-questions");
    expect(page).toContain("Three calls.");

    const answers = {
      tiering: { selected: ["Usage-based (Recommended)"] },
      region: { selected: ["EU"] },
      notes: { text: "ship it" },
    };
    const sent = await w.pagePublish(slug, 1, {
      ...QUESTIONS_ISLAND,
      intro: "Three calls.",
      answers,
      action: "start",
    });
    expect(sent.status).toBe(200);
    const result = await pending;
    expect(result.details).toMatchObject({ action: "ask", slug, version: 2 });
    expect(result.text).toContain("answered 3/3");
    expect(result.text).toContain('"ship it"');
    expect(result.text).toContain('action "start"');
    expect(result.text).toContain("do not re-ask");
    await tick(50);
    expect(w.feedback()).toHaveLength(0);
    expect(w.backend.store.get(slug)?.pending).toEqual([]);
  });

  test("A5 an ask that times out wakes the session on the later send", async () => {
    const w = wire();
    const result = await w.run({
      action: "ask",
      title: "Slow",
      questions: QUESTIONS,
      timeout: 0.05,
    });
    expect(result.text).toContain("End your turn");
    expect(result.text).toContain("do not re-ask");
    expect(w.backend.store.get("slow")?.watched).toBe(true);

    const sent = await w.pagePublish("slow", 1, {
      ...QUESTIONS_ISLAND,
      answers: { tiering: { selected: ["Seat-based"] } },
    });
    expect(sent.status).toBe(200);
    expect(await w.feedbackCount(1)).toBe(1);
    const message = w.feedback()[0];
    expect(message?.options).toEqual({ triggerTurn: true, deliverAs: "followUp" });
    const content = message?.message.content as string;
    expect(content).toContain('"Slow"');
    expect(content).toContain("v1 → v2");
    expect(content).toContain("Seat-based");
    expect(content).toContain("unanswered: none");
    expect(content).toContain("never stand in for a permission approval");
    await tick(50);
    expect(w.backend.store.get("slow")?.pending).toEqual([]);
  });

  test("A6 an aborted ask leaves the page published and watched", async () => {
    const w = wire();
    const controller = new AbortController();
    const pending = w.run(
      { action: "ask", title: "Abort me", questions: QUESTIONS },
      controller.signal,
    );
    await tick(60);
    controller.abort();
    const result = await pending;
    expect(result.text).toContain("Cancelled");
    expect(w.backend.store.get("abort-me")?.watched).toBe(true);
  });

  test("A7 read_page_data validates against the declared schema", async () => {
    const w = wire();
    const path = w.file("q.html", `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`);
    await w.run({ file_path: path });
    const read = await w.run({ action: "read_page_data", url: "q", schema: "questions/v1" });
    expect(read.text).toContain("unanswered: tiering");
    expect(read.text).not.toContain("unanswered: tiering, region");
    expect(read.text).toContain('"schema": "questions/v1"');
    await expect(
      w.run({ action: "read_page_data", url: "q", schema: "workshop/v9" }),
    ).rejects.toThrow(/unknown schema/);
    const plain = w.file("p.html", `<h1>P</h1>${islandScript({ mood: "ok" })}`);
    await w.run({ file_path: plain });
    await expect(
      w.run({ action: "read_page_data", url: "p", schema: "questions/v1" }),
    ).rejects.toThrow(/declares no schema/);
    expect((await w.run({ action: "read_page_data", url: "p" })).text).toContain('"mood": "ok"');
  });

  test("A8 unwatch holds sends; watch delivers again", async () => {
    const w = wire();
    const path = w.file("q.html", `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`);
    await w.run({ file_path: path });
    await w.run({ action: "unwatch", url: "q" });
    const answer = { ...QUESTIONS_ISLAND, answers: { tiering: { selected: ["Seat-based"] } } };
    await w.pagePublish("q", 1, answer);
    await tick(100);
    expect(w.feedback()).toHaveLength(0);
    expect(w.backend.store.get("q")?.pending).toHaveLength(1);
    const status = await w.run({ action: "status" });
    expect(status.text).toContain("1 pending");
    const rearmed = await w.run({ action: "watch", url: "q" });
    expect(rearmed.text).toContain("1 pending");
    await w.pagePublish("q", 2, answer);
    expect(await w.feedbackCount(1)).toBe(1);
  });

  test("A9 delivery notify queues for the next prompt and tells the user", async () => {
    const w = wire({ config: { delivery: "notify" } });
    const path = w.file("q.html", `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`);
    await w.run({ file_path: path });
    await w.fake.emit("session_start", { reason: "startup" }, w.ctx.ctx);
    await w.pagePublish("q", 1, {
      ...QUESTIONS_ISLAND,
      answers: { tiering: { selected: ["Seat-based"] } },
    });
    expect(await w.feedbackCount(1)).toBe(1);
    expect(w.feedback()[0]?.options).toEqual({ deliverAs: "nextTurn" });
    expect(w.ctx.notifications.some((n) => n.message.includes("next prompt"))).toBe(true);
  });

  test("A10 the hourly wake cap holds further sends and warns once", async () => {
    const w = wire({ config: { wakesPerHour: 1 } });
    const path = w.file("q.html", `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`);
    await w.run({ file_path: path });
    await w.fake.emit("session_start", { reason: "startup" }, w.ctx.ctx);
    const answer = { ...QUESTIONS_ISLAND, answers: { tiering: { selected: ["Seat-based"] } } };
    await w.pagePublish("q", 1, answer);
    await w.pagePublish("q", 2, answer);
    await w.pagePublish("q", 3, answer);
    await tick(150);
    expect(w.feedback()).toHaveLength(1);
    expect(w.backend.store.get("q")?.pending).toHaveLength(2);
    expect(w.ctx.notifications.filter((n) => n.message.includes("cap"))).toHaveLength(1);
  });

  test("A11 comments reach the session only when sent to the agent", async () => {
    const w = wire();
    const path = w.file("p.html", "<h1>Plan</h1>");
    await w.run({ file_path: path });
    await w.pageComment("plan", { text: "just a note", toAgent: false });
    await tick(80);
    expect(w.feedback()).toHaveLength(0);
    const posted = await w.pageComment("plan", {
      text: "Please add a per-region table",
      toAgent: true,
      anchor: "Summary",
    });
    const { thread } = (await posted.json()) as { thread: { id: string } };
    expect(await w.feedbackCount(1)).toBe(1);
    const content = w.feedback()[0]?.message.content as string;
    expect(content).toContain(thread.id);
    expect(content).toContain("per-region table");
    expect(content).toContain("data about what they want changed");

    const replied = await w.run({
      action: "reply",
      url: "plan",
      thread_id: thread.id,
      text: "Added below the chart.",
    });
    expect(replied.text).toContain("Added below the chart.");
    expect(
      w.backend.store
        .comments("plan")
        .find((t) => t.id === thread.id)
        ?.messages.at(-1)?.author,
    ).toBe("agent");
    const plain = w.backend.store.comments("plan").find((t) => !t.toAgent) as { id: string };
    await expect(
      w.run({ action: "reply", url: "plan", thread_id: plain.id, text: "x" }),
    ).rejects.toThrow(/not sent to the agent/);
    const listed = await w.run({ action: "comments", url: "plan" });
    expect(listed.text).toContain("2 threads");
    expect((await w.run({ action: "resolve", url: "plan", thread_id: thread.id })).text).toContain(
      "Resolved",
    );
  });

  test("A12 delete needs the user's confirmation", async () => {
    const headless = wire({ hasUI: false });
    await headless.run({ file_path: headless.file("p.html", "<h1>Plan</h1>") });
    await expect(headless.run({ action: "delete", url: "plan" })).rejects.toThrow(/confirmation/);
    expect(headless.backend.store.get("plan")).not.toBeNull();

    let answer = false;
    const w = wire({ confirm: () => answer });
    await w.run({ file_path: w.file("p.html", "<h1>Plan</h1>") });
    expect((await w.run({ action: "delete", url: "plan" })).text).toContain("declined");
    expect(w.backend.store.get("plan")).not.toBeNull();
    answer = true;
    const deleted = await w.run({ action: "delete", url: "plan" });
    expect(deleted.text).toContain(w.trashDir);
    expect(existsSync(join(w.storeRoot, "plan"))).toBe(false);
    expect(readdirSync(w.trashDir).some((d) => d.startsWith("artifact-plan-"))).toBe(true);
    expect((await w.page("/a/plan")).status).toBe(404);
  });

  test("A13 list and status name every artifact", async () => {
    const w = wire();
    expect((await w.run({ action: "list" })).text).toContain("No artifacts");
    await w.run({ file_path: w.file("a.html", "<h1>Alpha</h1>") });
    await w.run({ file_path: w.file("b.md", "# Beta\n\ntext") });
    const list = (await w.run({ action: "list" })).text;
    expect(list).toContain("2 artifacts");
    expect(list).toContain("alpha");
    expect(list).toContain("beta");
    expect(list).toContain("v1");
    const status = (await w.run({ action: "status" })).text;
    expect(status).toContain("2 of 2 watched");
    expect(status).toContain(w.origin());
  });

  test("A14 url accepts the page URL or the slug", async () => {
    const w = wire();
    const path = w.file("p.html", "<h1>Plan</h1>");
    const { text } = await w.run({ file_path: path });
    const url = /http:\/\/\S+/.exec(text)?.[0] as string;
    expect((await w.run({ action: "open", url })).details).toMatchObject({ slug: "plan" });
    expect((await w.run({ action: "open", url: "plan" })).details).toMatchObject({ slug: "plan" });
    expect((await w.run({ action: "open", url: "/a/plan" })).details).toMatchObject({
      slug: "plan",
    });
    await expect(w.run({ action: "open", url: "http://localhost:1/a/other" })).rejects.toThrow(
      /no artifact matches/,
    );
  });

  test("A15 slug picks the path of a new artifact", async () => {
    const w = wire();
    const path = w.file("p.html", "<h1>Welcome aboard</h1>");
    const first = await w.run({ file_path: path, slug: "welcome" });
    expect(first.details).toMatchObject({ slug: "welcome" });
    expect(first.text).toContain(`${w.origin()}/a/welcome?t=`);
    expect(w.backend.store.get("welcome")?.title).toBe("Welcome aboard");
    await expect(w.run({ file_path: path, slug: "welcome" })).rejects.toThrow(
      /already lives at \/a\/welcome/,
    );
    await expect(w.run({ file_path: path, slug: "Not Valid!" })).rejects.toThrow(/lowercase/);
    const updated = await w.run({ file_path: path, url: "welcome", slug: "ignored" });
    expect(updated.details).toMatchObject({ slug: "welcome", version: 2 });
    expect(w.backend.store.get("ignored")).toBeNull();
  });

  test("A16 two sessions on one server: the owner is woken, then the survivor", async () => {
    const a = wire({ session: "session-a" });
    const b = wire({ share: a, session: "session-b" });
    await b.run({ action: "list" }); // opens b's stream first
    await tick(30);
    const path = a.file("q.html", `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`);
    await a.run({ file_path: path });
    const answer = { ...QUESTIONS_ISLAND, answers: { tiering: { selected: ["Seat-based"] } } };
    await a.pagePublish("q", 1, answer);
    expect(await a.feedbackCount(1)).toBe(1);
    await tick(80);
    expect(b.feedback()).toHaveLength(0);

    await a.host.shutdown(false);
    await tick(30);
    await a.pagePublish("q", 2, answer);
    expect(await b.feedbackCount(1)).toBe(1);
    await tick(50);
    expect(a.backend.store.get("q")?.owner).toBe("session-b");
  });
});
