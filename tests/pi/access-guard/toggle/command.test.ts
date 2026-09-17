// toggle — the /access-guard command of .pi/extensions/access-guard.
//
// T1  `/access-guard vendored off` → every vendored denial (write, edit, bash) is
//     lifted for the session and the footer shows an unlocked status
// T2  `/access-guard vendored on` → the denials return and the status clears
// T3  `/access-guard` alone → reports both guards and whether vendored is armed
// T4  an unknown argument → usage warning, state unchanged
// T5  the toggle lives in the extension instance: a fresh instance starts armed

import { describe, expect, test } from "bun:test";

import { guard } from "../fixture";

const EDIT = { path: "node_modules/pkg/index.js", edits: [] };
const BASH = { command: "echo x > node_modules/pkg/index.js" };

describe("access-guard toggle", () => {
  test("T1 vendored off lifts the write, edit, and bash denials and shows a status", async () => {
    const g = guard();
    expect(await g.call("edit", EDIT)).toMatchObject({ block: true });
    await g.command("vendored off");
    expect(await g.call("edit", EDIT)).toBeUndefined();
    expect(await g.call("write", { path: "dist/out.js", content: "" })).toBeUndefined();
    expect(await g.call("bash", BASH)).toBeUndefined();
    expect(g.ctx.status.get("access-guard")).toBeTruthy();
    expect(g.ctx.notifications.at(-1)?.message).toMatch(/vendored: OFF/);
  });

  test("T2 vendored on re-arms and clears the status", async () => {
    const g = guard();
    await g.command("vendored off");
    await g.command("vendored on");
    expect(await g.call("edit", EDIT)).toMatchObject({ block: true });
    expect(await g.call("bash", BASH)).toMatchObject({ block: true });
    expect(g.ctx.status.get("access-guard")).toBeFalsy();
    expect(g.ctx.notifications.at(-1)?.message).toMatch(/vendored: on/);
  });

  test("T3 the bare command reports both guards", async () => {
    const g = guard();
    await g.command("");
    const report = g.ctx.notifications.at(-1);
    expect(report?.type).toBe("info");
    expect(report?.message).toMatch(/sensitive: on/);
    expect(report?.message).toMatch(/vendored: on/);
  });

  test("T4 an unknown argument warns and changes nothing", async () => {
    const g = guard();
    await g.command("everything off");
    expect(g.ctx.notifications.at(-1)?.type).toBe("warning");
    expect(await g.call("edit", EDIT)).toMatchObject({ block: true });
  });

  test("T5 a fresh instance starts armed regardless of another's toggle", async () => {
    const first = guard();
    await first.command("vendored off");
    expect(await guard().call("edit", EDIT)).toMatchObject({ block: true });
  });
});
