// session hooks and /artifacts of .pi/extensions/artifacts.
//
// L1  session_start on a project with no artifacts → no server contact, no
//     status, no message
// L2  session_start on a project with artifacts → the stream opens, the footer
//     names the count; sends that arrived while nobody listened → exactly one
//     artifact-feedback message queued for the next turn naming each slug, and
//     they are acknowledged; a "reload" start on the same conversation sends
//     nothing more
// L3  session_shutdown with keepAlive (default) → the stream closes, the server
//     keeps answering; with keepAlive off → the server is stopped
// L4  /artifacts <slug> opens that page; /artifacts with no UI lists the pages
//     through notify; with a UI the picked row opens; `/artifacts stop` stops
//     the server

import { afterEach, describe, expect, test } from "bun:test";
import { register } from "@ext/artifacts/index";
import { HEADER } from "@ext/artifacts/server";
import { ensureToken } from "@ext/artifacts/store";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi } from "@harness/fake-pi";
import { scriptedExec } from "@harness/scripted-exec";

import { islandScript, QUESTIONS_ISLAND, stopAll, tick, wire } from "../fixture";

afterEach(stopAll);

describe("artifacts session hooks", () => {
  test("L1 an empty project starts nothing", async () => {
    const w = wire();
    await w.fake.emit("session_start", { reason: "startup" }, w.ctx.ctx);
    expect(w.host.endpoint).toBeNull();
    expect(w.ctx.status.get("artifacts")).toBeUndefined();
    expect(w.feedback()).toHaveLength(0);
  });

  test("L2 a project with pending sends is told once, on a fresh start", async () => {
    // A first session publishes, then goes away; the page sends meanwhile.
    const first = wire();
    await first.run({
      file_path: first.file("q.html", `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`),
    });
    await first.host.shutdown(false);
    await first.pagePublish("q", 1, {
      ...QUESTIONS_ISLAND,
      answers: { tiering: { selected: ["Seat-based"] } },
    });
    await tick(30);
    expect(first.backend.store.get("q")?.pending).toHaveLength(1);

    // A second session on the same project and server.
    const fake = createFakePi(scriptedExec({}));
    const { hostFor } = register(fake.pi, {
      config: () => first.config,
      hostDeps: () => ({
        session: "second",
        locate: async () => ({
          origin: first.backend.server.origin,
          port: first.backend.server.port,
          requestedPort: first.backend.server.requestedPort,
          token: first.backend.token,
        }),
        open: async () => null,
        stop: async () => true,
      }),
    });
    const made = createCtx({ cwd: first.cwd });
    await fake.emit("session_start", { reason: "startup" }, made.ctx);
    const host = hostFor(first.cwd);
    try {
      expect(host.endpoint?.origin).toBe(first.backend.server.origin);
      expect(made.status.get("artifacts")).toContain("artifacts 1");
      const sent = fake.sent.filter((s) => s.message.customType === "artifact-feedback");
      expect(sent).toHaveLength(1);
      expect(sent[0]?.options).toEqual({ deliverAs: "nextTurn" });
      expect(sent[0]?.message.content as string).toContain("(q)");
      expect(sent[0]?.message.content as string).toContain("1 send");
      expect(first.backend.store.get("q")?.pending).toEqual([]);
      expect(first.backend.store.get("q")?.owner).toBe("second");

      await fake.emit("session_start", { reason: "reload" }, made.ctx);
      expect(fake.sent.filter((s) => s.message.customType === "artifact-feedback")).toHaveLength(1);
    } finally {
      await host.shutdown(false);
    }
  });

  test("L3 shutdown keeps the server unless keepAlive is off", async () => {
    const keep = wire();
    await keep.run({ file_path: keep.file("p.html", "<h1>Plan</h1>") });
    await keep.fake.emit("session_shutdown", {}, keep.ctx.ctx);
    expect((await keep.page("/a/plan")).status).toBe(200);

    const end = wire({ config: { keepAlive: false } });
    await end.run({ file_path: end.file("p.html", "<h1>Plan</h1>") });
    const origin = end.origin();
    await end.fake.emit("session_shutdown", {}, end.ctx.ctx);
    await expect(fetch(`${origin}/a/plan`)).rejects.toThrow();
  });

  test("L4 /artifacts opens by slug, lists without a UI, picks with one, and stops", async () => {
    const w = wire({ select: (_title, rows) => rows[0] });
    await w.run({ file_path: w.file("p.html", "<h1>Plan</h1>") });
    const command = w.fake.commands.get("artifacts");
    if (!command) throw new Error("/artifacts was not registered");
    await command.handler("plan", w.ctx.ctx);
    expect(w.opened).toHaveLength(2);
    await command.handler("nope", w.ctx.ctx);
    expect(w.ctx.notifications.at(-1)?.type).toBe("warning");

    await command.handler("", w.ctx.ctx);
    expect(w.ctx.dialogs.at(-1)?.kind).toBe("select");
    expect(w.opened).toHaveLength(3);

    const headless = createCtx({ cwd: w.cwd, hasUI: false });
    await command.handler("", headless.ctx);
    expect(headless.notifications.at(-1)?.message).toContain("plan — Plan (v1)");

    const origin = w.origin();
    const token = ensureToken(w.storeRoot);
    await command.handler("stop", w.ctx.ctx);
    expect(w.ctx.notifications.at(-1)?.message).toContain("stopped");
    await expect(fetch(`${origin}/api/health`, { headers: { [HEADER]: token } })).rejects.toThrow();
  });
});
