// A1 default/read-only/child-instance sessions → no automatic writes; opt-in editing sessions sync at settled.
// A2 retries, follow-ups and unchanged structure → no premature or redundant writes.
// A3 delegation/pause/shutdown/untrusted or read-only capability → no automatic writes.
// A4 failures → preserve document, surface diagnostics without triggering a model turn.
// A5 explicit check is read-only; sync writes; commands reject invalid arguments.
import { expect, test } from "bun:test";
import { statSync } from "node:fs";
import { join } from "node:path";
import extension from "@ext/architecture-sync/index";
import { architecture, exec } from "@ext/architecture-sync/tree";
import { createCtx } from "@harness/fake-ctx";
import { createFakePi, type ExecScript } from "@harness/fake-pi";
import { FAIL_OPEN } from "@harness/scripted-exec";
import { fixture } from "../fixture";

const realExec: ExecScript = async ({ command, args }) => ({
  stdout: await exec(command, args),
  stderr: "",
  code: 0,
});
function session(
  f = fixture(),
  options: {
    hasUI?: boolean;
    trusted?: boolean;
    readOnly?: boolean;
    activeTools?: string[];
    execute?: ExecScript;
  } = {},
) {
  const fake = createFakePi(options.execute ?? realExec, {
    flags: { "architecture-read-only": options.readOnly ?? false },
    activeTools: options.activeTools,
  });
  extension(fake.pi);
  const { ctx, notifications } = createCtx({
    cwd: f.root,
    hasUI: options.hasUI,
    trusted: options.trusted,
  });
  return {
    f,
    fake,
    ctx,
    notifications,
    emit: (event: string, payload: Record<string, unknown> = {}) => fake.emit(event, payload, ctx),
    command: (args: string) => fake.commands.get("architecture-sync")!.handler(args, ctx),
  };
}

for (const auto of [false, true])
  test(`A1 auto=${auto}: changed structure follows session permission`, async () => {
    const s = session();
    await architecture(s.f.root, "write");
    const before = s.f.read();
    if (auto) await s.command("auto");
    await s.emit("before_agent_start");
    s.f.put("tests/new.ts");
    await s.emit("tool_result", { toolName: "write", isError: false });
    await s.emit("agent_settled");
    expect(s.f.read() !== before).toBe(auto);
    for (const message of s.fake.sent) expect(message.options?.triggerTurn).toBe(false);
  });

test("A1 an embedded child instance does not inherit its parent's opt-in", async () => {
  const parent = session();
  await architecture(parent.f.root, "write");
  await parent.command("auto");
  await parent.emit("before_agent_start");
  const child = session(parent.f);
  const before = child.f.read();
  await child.emit("before_agent_start");
  child.f.put("tests/new.ts");
  await child.emit("tool_result", { toolName: "write", isError: false });
  await child.emit("agent_settled");
  expect(child.f.read()).toBe(before);
  await parent.emit("tool_result", { toolName: "write", isError: false });
  await parent.emit("agent_settled");
  expect(parent.f.read()).not.toBe(before);
});

test("A2 low-level endings and queued follow-ups wait for settled", async () => {
  const s = session();
  await architecture(s.f.root, "write");
  await s.command("auto");
  await s.emit("before_agent_start");
  const before = s.f.read();
  s.f.put("tests/new.ts");
  await s.emit("tool_result", { toolName: "bash", isError: false });
  await s.emit("turn_end");
  await s.emit("agent_end");
  expect(s.f.read()).toBe(before);
  await s.emit("before_agent_start"); // queued follow-up must not erase the write evidence
  await s.emit("agent_settled");
  expect(s.f.read()).not.toBe(before);
  const mtime = statSync(join(s.f.root, "ARCHITECTURE.md")).mtimeMs;
  await s.emit("before_agent_start");
  s.f.put("tests/new.ts", "content-only change\n");
  await s.emit("tool_result", { toolName: "edit", isError: false });
  await s.emit("agent_settled");
  expect(statSync(join(s.f.root, "ARCHITECTURE.md")).mtimeMs).toBe(mtime);
});

for (const reason of ["delegate", "pause", "shutdown", "no-writing-tool"])
  test(`A3 ${reason} suppresses auto writes`, async () => {
    const s = session();
    await architecture(s.f.root, "write");
    await s.command("auto");
    await s.emit("before_agent_start");
    const before = s.f.read();
    s.f.put("tests/new.ts");
    if (reason !== "no-writing-tool")
      await s.emit("tool_result", { toolName: "write", isError: false });
    if (reason === "delegate") await s.emit("tool_call", { toolName: "subagent", input: {} });
    if (reason === "pause") await s.command("pause");
    if (reason === "shutdown") await s.emit("session_shutdown");
    await s.emit("agent_settled");
    expect(s.f.read()).toBe(before);
  });

for (const options of [{ readOnly: true }, { trusted: false }, { activeTools: ["read", "ls"] }])
  test(`A3 permission ${JSON.stringify(options)} refuses auto/sync`, async () => {
    const s = session(fixture(), options);
    const before = s.f.read();
    await s.command("auto");
    await s.command("sync");
    expect(s.f.read()).toBe(before);
    expect(s.notifications.some((n) => n.type === "warning")).toBe(true);
  });

for (const [name, failedExec] of FAIL_OPEN.slice(0, 3))
  test(`A4 ${name.replace("uv", "git")} preserves the document and records a headless diagnostic`, async () => {
    const s = session(fixture(), { hasUI: false, execute: failedExec });
    const before = s.f.read();
    await s.emit("before_agent_start");
    await s.emit("agent_settled");
    expect(s.f.read()).toBe(before);
    expect(s.fake.entries.length).toBeGreaterThan(0);
    expect(s.fake.sent.every((m) => m.options?.triggerTurn === false)).toBe(true);
  });

test("A4 a failure after opt-in is surfaced without a partial write", async () => {
  let fail = false;
  const s = session(fixture(), {
    execute: async (call) => {
      if (fail) return { stdout: "", stderr: "Git unavailable", code: 1 };
      return realExec(call);
    },
  });
  await s.command("auto");
  await s.emit("before_agent_start");
  const before = s.f.read();
  s.f.put("tests/new.ts");
  await s.emit("tool_result", { toolName: "write", isError: false });
  fail = true;
  await s.emit("agent_settled");
  expect(s.f.read()).toBe(before);
  expect(s.notifications.at(-1)?.type).toBe("warning");
});

test("A3 shutdown during an in-flight snapshot invalidates the pending sync", async () => {
  let hold = false;
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const s = session(fixture(), {
    execute: async (call) => {
      if (hold && call.args.includes("ls-files")) {
        entered();
        await gate;
      }
      return realExec(call);
    },
  });
  await s.command("auto");
  await s.emit("before_agent_start");
  const before = s.f.read();
  s.f.put("tests/new.ts");
  await s.emit("tool_result", { toolName: "write", isError: false });
  hold = true;
  const pending = s.emit("agent_settled");
  await started;
  await s.emit("session_shutdown");
  release();
  await pending;
  expect(s.f.read()).toBe(before);
});

test("A5 explicit checks do not write; sync repairs; bad command is rejected", async () => {
  const s = session(),
    before = s.f.read();
  await s.command("check");
  expect(s.f.read()).toBe(before);
  await s.command("oops");
  expect(s.f.read()).toBe(before);
  await s.command("sync");
  expect(s.f.read()).not.toBe(before);
  expect(s.notifications.at(-1)?.message).toContain("ARCHITECTURE.md");
});
