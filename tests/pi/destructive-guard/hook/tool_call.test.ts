// The wired extension: tool_call, before_agent_start, session_start, /destructive-guard.
//
// H1  deny tier → { block: true } with a BLOCKED reason naming the rule, the target, the
//     fix, and that the human runs it; no dialog is shown; the audit line says denied-rule
// H2  ask tier with a UI → one select dialog whose title carries the command, the rule,
//     the target, and the agent's `# why:` claim marked unverified (or "gave no reason"),
//     with exactly the four choices
// H3  each choice resolves: approve once → runs (undefined); approve for session → runs
//     and the same rule + targets never asks again while a different target does;
//     deny-alternative → block with a DECLINED reason and the fix; deny-stop → block with
//     terminate; Esc → block with a "dismissed" reason. Every outcome is one audit line
// H4  ask tier with no UI → block with a NEEDS APPROVAL reason naming the config key,
//     unless headless is "allow" in the config
// H5  the rm approval card carries a recovery line from git (tracked / untracked) when git
//     answers, and no line when it fails or times out
// H6  write/edit: a system file is denied, a shell profile asks, everything else passes;
//     a non-string path passes
// H7  allow tier → undefined, no dialog, no audit line
// H8  a guard bug fails open and loud: the call runs, ui.notify says so, the audit line
//     says internal-error
// H9  session_start warns about an invalid config and announces softened deny rules;
//     before_agent_start appends the guard's note to the system prompt
// H10 /destructive-guard: status notifies the counts; `ask off` lifts the ask tier for
//     the session (deny still blocks) and `ask on` re-arms; `forget` drops approvals;
//     `test <cmd>` reports the verdict without running anything

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CHOICES } from "@ext/destructive-guard/prompt";

import { type Workspace, gitExec, guardCtx, scratchWorkspace, wire } from "../fixture";

function auditLines(ws: Workspace): Array<Record<string, unknown>> {
  const path = join(ws.root, ".pi", "logs", "destructive-guard.jsonl");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("H1 deny", () => {
  test("blocks with the rule, target, fix, and the hand-off; no dialog", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root });
    const result = await bash("sudo rm -rf /etc", g.ctx);
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("BLOCKED (filesystem/rm)");
    expect(result?.reason).toContain("/etc is a protected system root");
    expect(result?.reason).toContain("~/.Trash/");
    expect(result?.reason).toContain("run it themselves");
    expect(result?.terminate).toBeUndefined();
    expect(g.dialogs).toHaveLength(0);
    const [line] = auditLines(ws);
    expect(line).toMatchObject({
      tool: "bash",
      tier: "deny",
      decision: "denied-rule",
      rules: ["rm", "sudo"],
    });
  });
});

describe("H2 the approval card", () => {
  test("shows the command, rule, target, claim, and the four choices", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.once });
    await bash("# why: regenerating from the schema\nrm -rf src/migrations", g.ctx);
    expect(g.dialogs).toHaveLength(1);
    const [dialog] = g.dialogs;
    expect(dialog?.title).toContain("approval needed");
    expect(dialog?.title).toContain("rm -rf src/migrations");
    expect(dialog?.title).toContain("filesystem/rm");
    expect(dialog?.title).toContain(`${ws.root}/src/migrations is inside the workspace`);
    expect(dialog?.title).toContain('"regenerating from the schema"');
    expect(dialog?.title).toContain("unverified");
    expect(dialog?.options).toEqual([
      CHOICES.once,
      CHOICES.session,
      CHOICES.alternative,
      CHOICES.stop,
    ]);
  });
  test("says so when the agent gave no reason", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.once });
    await bash("git reset --hard", g.ctx);
    expect(g.dialogs[0]?.title).toContain("gave no reason");
  });
});

describe("H3 choices", () => {
  test("approve once runs it, and asks again next time", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.once });
    expect(await bash("rm -rf src", g.ctx)).toBeUndefined();
    expect(await bash("rm -rf src", g.ctx)).toBeUndefined();
    expect(g.dialogs).toHaveLength(2);
    expect(auditLines(ws).map((l) => l.decision)).toEqual(["approved-once", "approved-once"]);
  });
  test("approve for session remembers the rule + targets, not the rule alone", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.session });
    expect(await bash("rm -rf src", g.ctx)).toBeUndefined();
    expect(await bash("rm -rf ./src/", g.ctx)).toBeUndefined();
    expect(g.dialogs).toHaveLength(1);
    expect(await bash("rm -rf dist src", g.ctx)).toBeUndefined();
    expect(g.dialogs).toHaveLength(2);
    expect(auditLines(ws).map((l) => l.decision)).toEqual([
      "approved-session",
      "remembered",
      "approved-session",
    ]);
  });
  test("a rule with no targets remembers the exact command", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.session });
    await bash("git push --force", g.ctx);
    await bash("git push  --force", g.ctx);
    await bash("git push --force origin main", g.ctx);
    expect(g.dialogs).toHaveLength(2);
  });
  test("deny with the alternative blocks and hands the agent the fix", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.alternative });
    const result = await bash("rm -rf src", g.ctx);
    expect(result?.block).toBe(true);
    expect(result?.terminate).toBeUndefined();
    expect(result?.reason).toContain("DECLINED by the user");
    expect(result?.reason).toContain("~/.Trash/");
    expect(result?.reason).toContain("Do not retry");
    expect(auditLines(ws)[0]?.decision).toBe("denied-alternative");
  });
  test("deny and stop terminates the turn", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.stop });
    const result = await bash("rm -rf src", g.ctx);
    expect(result).toMatchObject({ block: true, terminate: true });
    expect(result?.reason).toContain("ended this turn");
    expect(auditLines(ws)[0]?.decision).toBe("denied-stop");
  });
  test("a dismissed dialog blocks without terminating", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: undefined });
    const result = await bash("rm -rf src", g.ctx);
    expect(result).toMatchObject({ block: true });
    expect(result?.terminate).toBeUndefined();
    expect(result?.reason).toContain("dialog dismissed");
    expect(auditLines(ws)[0]?.decision).toBe("dismissed");
  });
  test("the audit line carries the claim and the targets", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.once });
    await bash("# why: stale\nrm -rf src", g.ctx);
    expect(auditLines(ws)[0]).toMatchObject({
      claim: "stale",
      targets: [`${ws.root}/src`],
      cwd: ws.root,
    });
  });
});

describe("H4 no UI", () => {
  test("ask becomes a block that names the config key", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, hasUI: false });
    const result = await bash("git push --force", g.ctx);
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("no human present");
    expect(result?.reason).toContain('"git-force-push"');
    expect(result?.reason).toContain(".pi/destructive-guard.json");
    expect(g.dialogs).toHaveLength(0);
    expect(auditLines(ws)[0]?.decision).toBe("denied-headless");
  });
  test('headless "allow" runs it and logs', async () => {
    const ws = scratchWorkspace({ config: '{ "headless": "allow" }' });
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, hasUI: false });
    expect(await bash("git push --force", g.ctx)).toBeUndefined();
    expect(auditLines(ws)[0]?.decision).toBe("allow");
  });
  test("deny stays deny without a UI whatever headless says", async () => {
    const ws = scratchWorkspace({ config: '{ "headless": "allow" }' });
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root, hasUI: false });
    expect((await bash("rm -rf /", g.ctx))?.block).toBe(true);
  });
});

describe("H5 the recovery line", () => {
  test("git counts appear on an rm card", async () => {
    const ws = scratchWorkspace();
    const { bash, fake } = wire(gitExec(39, 3));
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.once });
    await bash("rm -rf src", g.ctx);
    expect(g.dialogs[0]?.title).toContain("39 tracked (restorable) · 3 untracked → PERMANENT");
    expect(fake.execCalls.map((c) => c.command)).toEqual(["git", "git"]);
    expect(fake.execCalls[0]?.args).toContain(`${ws.root}/src`);
  });
  test("no untracked files means no PERMANENT warning", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire(gitExec(5, 0));
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.once });
    await bash("rm -rf src", g.ctx);
    expect(g.dialogs[0]?.title).toContain("5 tracked (restorable)");
    expect(g.dialogs[0]?.title).not.toContain("PERMANENT");
  });
  test("a failing git is no line, and no git is asked for a non-rm rule", async () => {
    const ws = scratchWorkspace();
    const { bash, fake } = wire(() => {
      throw new Error("spawn git ENOENT");
    });
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.once });
    await bash("rm -rf src", g.ctx);
    expect(g.dialogs[0]?.title).not.toContain("recovery");
    await bash("git push --force", g.ctx);
    expect(fake.execCalls).toHaveLength(2);
  });
});

describe("H6 write and edit", () => {
  test.each(["write", "edit"] as const)("%s of a system file is denied", async (tool) => {
    const ws = scratchWorkspace();
    const { write } = wire();
    const g = guardCtx({ cwd: ws.root });
    const result = await write(tool, "/etc/nginx/nginx.conf", g.ctx);
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("write-system-file");
    expect(result?.reason).toContain("/etc/nginx/nginx.conf is under the system tree /etc");
    expect(auditLines(ws)[0]).toMatchObject({ tool, decision: "denied-rule" });
  });
  test("a shell profile asks, and the card shows the path", async () => {
    const ws = scratchWorkspace();
    const { write } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.alternative });
    // The guard reads the home from the process; point it at the fixture's for this call.
    const realHome = process.env.HOME;
    process.env.HOME = ws.home;
    try {
      const result = await write("edit", join(ws.home, ".bashrc"), g.ctx);
      expect(result?.block).toBe(true);
      expect(g.dialogs[0]?.title).toContain(`edit ${ws.home}/.bashrc`);
      expect(g.dialogs[0]?.title).toContain("write-profile");
    } finally {
      process.env.HOME = realHome;
    }
  });
  test("a workspace file, /tmp, and a non-string path pass", async () => {
    const ws = scratchWorkspace();
    const { write, fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    expect(await write("write", "src/new.ts", g.ctx)).toBeUndefined();
    expect(await write("write", "/tmp/scratch.txt", g.ctx)).toBeUndefined();
    expect(
      await fake.emit(
        "tool_call",
        { toolName: "write", toolCallId: "t", input: { path: 42 } },
        g.ctx,
      ),
    ).toBeUndefined();
    expect(g.dialogs).toHaveLength(0);
  });
});

describe("H7 allow", () => {
  test("no dialog, no audit line, no exec", async () => {
    const ws = scratchWorkspace();
    const { bash, fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    expect(await bash("rm -rf node_modules && bun install", g.ctx)).toBeUndefined();
    expect(await bash("ls -la", g.ctx)).toBeUndefined();
    expect(g.dialogs).toHaveLength(0);
    expect(auditLines(ws)).toEqual([]);
    expect(fake.execCalls).toHaveLength(0);
  });
  test("a tool that is not bash/write/edit passes", async () => {
    const ws = scratchWorkspace();
    const { fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    expect(
      await fake.emit(
        "tool_call",
        { toolName: "read", toolCallId: "t", input: { path: "/etc/passwd" } },
        g.ctx,
      ),
    ).toBeUndefined();
  });
});

describe("H8 a guard bug fails open and loud", () => {
  test("the call runs, the user is told, the audit says internal-error", async () => {
    const ws = scratchWorkspace();
    const { bash } = wire();
    const g = guardCtx({
      cwd: ws.root,
      answer: () => {
        throw new Error("dialog exploded");
      },
    });
    expect(await bash("rm -rf src", g.ctx)).toBeUndefined();
    expect(
      g.notifications.some((n) => n.type === "error" && n.message.includes("allowed unguarded")),
    ).toBe(true);
    expect(auditLines(ws).at(-1)).toMatchObject({ decision: "allow", rules: ["internal-error"] });
  });
});

describe("H9 session_start and before_agent_start", () => {
  test("an invalid config warns; softened deny rules are announced and shown in the status", async () => {
    const ws = scratchWorkspace({ config: '{ "allow": ["crontab-wipe", "nope"], "headless": 7 }' });
    const { fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    await fake.emit("session_start", { reason: "new" }, g.ctx);
    const messages = g.notifications.map((n) => n.message);
    expect(messages.some((m) => m.includes('no rule named "nope"'))).toBe(true);
    expect(messages.some((m) => m.includes("headless must be"))).toBe(true);
    expect(messages.some((m) => m.includes("softened") && m.includes("crontab-wipe"))).toBe(true);
    expect(g.status.get("destructive-guard")).toContain("1 deny softened");
  });
  test("a clean session sets an empty status and says nothing", async () => {
    const ws = scratchWorkspace();
    const { fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    await fake.emit("session_start", { reason: "new" }, g.ctx);
    expect(g.notifications).toEqual([]);
    expect(g.status.get("destructive-guard")).toBe("");
  });
  test("the config's allow list reaches the verdict", async () => {
    const ws = scratchWorkspace({ config: '{ "allow": ["sudo"] }' });
    const { bash } = wire();
    const g = guardCtx({ cwd: ws.root });
    expect(await bash("sudo apt-get install jq", g.ctx)).toBeUndefined();
    expect(g.dialogs).toHaveLength(0);
  });
  test("before_agent_start appends the guard's note", async () => {
    const ws = scratchWorkspace();
    const { fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    const result = (await fake.emit(
      "before_agent_start",
      { prompt: "hi", systemPrompt: "BASE" },
      g.ctx,
    )) as {
      systemPrompt: string;
    };
    expect(result.systemPrompt.startsWith("BASE\n\n")).toBe(true);
    expect(result.systemPrompt).toContain("# why:");
    expect(result.systemPrompt).toContain("do not retry with an equivalent");
  });
});

describe("H10 /destructive-guard", () => {
  test("status reports the catalog and the session", async () => {
    const ws = scratchWorkspace();
    const { fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    await fake.commands.get("destructive-guard")?.handler("", g.ctx);
    const [note] = g.notifications;
    expect(note?.message).toMatch(/\d+ rules \(\d+ deny, \d+ ask, \d+ target-refined\)/);
    expect(note?.message).toContain(`workspace ${ws.root}`);
    expect(note?.message).toContain("ask tier on");
  });
  test("ask off lifts the ask tier for the session; deny still blocks; ask on re-arms", async () => {
    const ws = scratchWorkspace();
    const { fake, bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.alternative });
    const command = fake.commands.get("destructive-guard")?.handler;
    await command?.("ask off", g.ctx);
    expect(g.status.get("destructive-guard")).toContain("ask OFF");
    expect(await bash("git push --force", g.ctx)).toBeUndefined();
    expect((await bash("rm -rf /", g.ctx))?.block).toBe(true);
    expect(g.dialogs).toHaveLength(0);
    await command?.("ask on", g.ctx);
    expect((await bash("git push --force", g.ctx))?.block).toBe(true);
    expect(g.dialogs).toHaveLength(1);
  });
  test("forget drops session approvals", async () => {
    const ws = scratchWorkspace();
    const { fake, bash } = wire();
    const g = guardCtx({ cwd: ws.root, answer: CHOICES.session });
    await bash("rm -rf src", g.ctx);
    await fake.commands.get("destructive-guard")?.handler("forget", g.ctx);
    expect(g.notifications.at(-1)?.message).toContain("forgot 1");
    await bash("rm -rf src", g.ctx);
    expect(g.dialogs).toHaveLength(2);
  });
  test("test <command> reports the verdict and runs nothing", async () => {
    const ws = scratchWorkspace();
    const { fake } = wire();
    const g = guardCtx({ cwd: ws.root });
    const command = fake.commands.get("destructive-guard")?.handler;
    await command?.("test rm -rf /etc", g.ctx);
    expect(g.notifications.at(-1)).toMatchObject({ type: "error" });
    expect(g.notifications.at(-1)?.message).toContain("deny · filesystem/rm");
    await command?.("test rm -rf node_modules", g.ctx);
    expect(g.notifications.at(-1)?.message).toContain("allow");
    expect(g.dialogs).toHaveLength(0);
    expect(auditLines(ws)).toEqual([]);
  });
});
