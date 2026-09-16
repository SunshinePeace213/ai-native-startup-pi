// Contract — the statusline through Pi's lifecycle
//
// S1: session_start in TUI mode → Pi's footer is replaced; outside TUI mode
//     it is never touched.
// S2: the footer shows the session's own variables — the cwd `~`-collapsed,
//     the session name, the model with its thinking level, the cumulative
//     tokens and cost summed the way Pi's footer sums them, and the context
//     percentage and window from Pi's reading; `sub` only when the model is
//     OAuth-backed.
// S3: git: session_start probes the tree and the footer shows its marks; a
//     probe failure leaves Pi's own branch; a change after agent_end asks
//     the TUI to redraw, no change asks for nothing; a branch change reported
//     by Pi re-probes.
// S4: quota: a provider the session is logged into by OAuth is polled at
//     session_start with the token Pi resolves for it, and its windows
//     render; a provider on an API key is never polled and gets no line.
// S5: a switch to another model polls that model's provider; agent_end polls
//     the active provider only, and not again within a minute.
// S6: an Anthropic response's rate-limit headers update the 5h/7d windows
//     without a request; another provider's headers are ignored.
// S7: /statusline off restores Pi's footer, on brings the statusline back,
//     compact renders two content lines, verbose toggles the cache detail,
//     refresh polls now, an unknown word is an error; each reports its state.
// S8: session_shutdown restores Pi's footer; extension statuses other
//     extensions set render on the last line with their icons.

import { describe, expect, test } from "bun:test";
import extension from "@ext/ui-customization-soriza/index";
import type { FetchFn } from "@ext/ui-customization-soriza/statusline/quota-fetch";
import { createFakePi, type ExecScript } from "@harness/fake-pi";
import { assistantEntry, createUiCtx, gitExec, strip, type UiCtxOptions } from "../fixture";

const HOME = "/home/someone";
const CWD = `${HOME}/work/ai-native-startup-pi`;
const NOW = Date.parse("2026-09-16T06:32:00Z");
const CLEAN =
  "# branch.oid abc\n# branch.head main\n# branch.upstream origin/main\n# branch.ab +0 -0\n";
const DIRTY = `${CLEAN}1 M. N... 100644 100644 100644 a b staged.ts\n? new.ts\n`;

const jwt = (claims: Record<string, unknown>) =>
  `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
const CODEX_TOKEN = jwt({ "https://api.openai.com/auth": { chatgpt_account_id: "acct_1" } });

const FABLE = {
  id: "claude-fable-5-1",
  provider: "anthropic",
  reasoning: true,
  oauth: true,
  token: "anthropic-token",
};
const CODEX = {
  id: "gpt-5.5-codex",
  provider: "openai-codex",
  reasoning: true,
  oauth: true,
  token: CODEX_TOKEN,
};

const ANTHROPIC_BODY = {
  five_hour: { utilization: 58, resets_at: "2026-09-16T08:46:00Z" },
  seven_day: { utilization: 21, resets_at: "2026-09-20T12:32:00Z" },
  limits: [
    {
      kind: "weekly_scoped",
      scope: { model: { display_name: "Fable" } },
      percent: 21,
      resets_at: null,
    },
  ],
};
const CODEX_BODY = {
  rate_limit: { primary_window: { used_percent: 3 }, secondary_window: { used_percent: 17 } },
};

interface Call {
  url: string;
  authorization?: string;
}

function usageFetch(): { fetch: FetchFn; calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    fetch: async (url, init) => {
      const headers = (init.headers ?? {}) as Record<string, string>;
      calls.push({ url, authorization: headers["Authorization"] });
      const body = url.includes("anthropic") ? ANTHROPIC_BODY : CODEX_BODY;
      return new Response(JSON.stringify(body), { status: 200 });
    },
  };
}

async function start(exec: ExecScript, options: Partial<UiCtxOptions> = {}, clock = NOW) {
  const fake = createFakePi(exec);
  const usage = usageFetch();
  let now = clock;
  extension(fake.pi, {
    fetch: usage.fetch,
    now: () => now,
    home: HOME,
    agentDir: "/nonexistent",
    env: {},
  });
  const ui = createUiCtx({
    cwd: CWD,
    startedAt: "2026-09-16T05:20:00Z",
    sessionName: "statusline redesign",
    model: FABLE,
    thinkingLevel: "xhigh",
    contextUsage: { tokens: 84_000, contextWindow: 200_000, percent: 42 },
    entries: [
      assistantEntry({
        input: 1_000_000,
        output: 40_000,
        cacheRead: 900_000,
        cacheWrite: 90_000,
        cost: 3.0,
      }),
      assistantEntry({
        input: 200_000,
        output: 8_000,
        cacheRead: 200_000,
        cacheWrite: 6_000,
        cost: 1.31,
      }),
    ],
    ...options,
  });
  await fake.emit("session_start", {}, ui.ctx);
  return {
    fake,
    ui,
    usage,
    advance: (ms: number) => {
      now += ms;
    },
    lines: (width = 4000) => ui.footer!.render(width).map(strip),
    run: (args: string) => fake.commands.get("statusline")!.handler(args, ui.ctx),
  };
}

describe("S1 install", () => {
  test("S1 tui: Pi's footer is replaced once", async () => {
    const { ui } = await start(gitExec({ status: CLEAN }));
    expect(ui.footers).toHaveLength(1);
    expect(ui.footer).toBeDefined();
  });

  test.each([["rpc"], ["print"]] as const)("S1 %s: the footer is never touched", async (mode) => {
    const { ui, fake } = await start(gitExec({ status: CLEAN }), { mode });
    await fake.emit("agent_end", {}, ui.ctx);
    await fake.emit("session_shutdown", {}, ui.ctx);
    expect(ui.footers).toHaveLength(0);
  });
});

describe("S2 session variables", () => {
  test("S2 cwd, session, model · thinking, elapsed, tokens, cost sub, context", async () => {
    const { lines } = await start(gitExec({ status: CLEAN }));
    const [where, session] = lines();
    expect(where).toContain("📁 ~/work/ai-native-startup-pi");
    expect(where).toContain("🔖 statusline redesign");
    expect(where).toContain("🤖 claude-fable-5-1 · 🧠 xhigh");
    expect(where).toMatch(/🕐 \d\d:\d\d · ⏱️ 1h12m/);
    expect(session).toContain("42% (84k/200k)");
    expect(session).toContain("📥 1.2M in · 📤 48k out");
    // the latest turn: 200k cached of 200k + 200k + 6k prompt
    expect(session).toContain("⚡ 49% cached");
    expect(session).toContain("💰 $4.31 sub ($3.59/h)");
  });

  test("S2 an API-key model shows no sub and no quota line", async () => {
    const { lines, usage } = await start(gitExec({ status: CLEAN }), {
      model: { ...FABLE, oauth: false, token: undefined },
    });
    const all = lines();
    expect(all[1]).toContain("💰 $4.31 ($3.59/h)");
    expect(all[1]).not.toContain("sub");
    expect(all.join("\n")).not.toContain("🟠");
    expect(usage.calls).toHaveLength(0);
  });

  test("S2 outside home the cwd stays absolute; no model → no 🤖", async () => {
    const { lines } = await start(gitExec({ status: CLEAN }), {
      cwd: "/srv/checkouts/x",
      model: undefined,
    });
    expect(lines()[0]).toContain("📁 /srv/checkouts/x");
    expect(lines()[0]).not.toContain("🤖");
  });
});

describe("S3 git", () => {
  test("S3 a clean tree → ✓; a dirty tree → its marks", async () => {
    expect((await start(gitExec({ status: CLEAN }))).lines()[0]).toContain("🌿 main ✓");
    expect((await start(gitExec({ status: DIRTY }))).lines()[0]).toContain("🌿 main +1 ?1");
  });

  test("S3 a failing probe leaves Pi's own branch", async () => {
    const { lines } = await start(gitExec({}), { branch: "pi-branch" });
    expect(lines()[0]).toContain("🌿 pi-branch");
  });

  test("S3 agent_end: a change redraws, no change asks for nothing", async () => {
    let status = CLEAN;
    const { fake, ui, lines } = await start(({ command, args }) =>
      gitExec({ status })({ command, args }),
    );
    const before = ui.renders;
    await fake.emit("agent_end", {}, ui.ctx);
    expect(ui.renders).toBe(before);
    status = DIRTY;
    await fake.emit("agent_end", {}, ui.ctx);
    expect(ui.renders).toBe(before + 1);
    expect(lines()[0]).toContain("+1 ?1");
  });

  test("S3 a branch change reported by Pi re-probes", async () => {
    let status = CLEAN;
    const { ui, lines } = await start(({ command, args }) =>
      gitExec({ status })({ command, args }),
    );
    status = CLEAN.replace("branch.head main", "branch.head feature/x");
    ui.fireBranchChange();
    await new Promise((r) => setTimeout(r, 0));
    expect(lines()[0]).toContain("🌿 feature/x ✓");
  });
});

describe("S4 quota", () => {
  test("S4 the OAuth provider is polled with its token and its windows render", async () => {
    const { lines, usage } = await start(gitExec({ status: CLEAN }));
    expect(usage.calls).toHaveLength(1);
    expect(usage.calls[0]!.url).toContain("anthropic.com");
    expect(usage.calls[0]!.authorization).toBe("Bearer anthropic-token");
    const quota = lines()[2]!;
    expect(quota).toContain("🟠 5h ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ 58% ⏳ 2h14m");
    expect(quota).toContain("7d ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ 21% ⏳ 4d6h");
    expect(quota).toContain("(fable 21%)");
  });

  test("S4 both providers logged in → both polled, the active one first with bars", async () => {
    const { lines, usage } = await start(gitExec({ status: CLEAN }), { models: [CODEX] });
    expect(usage.calls.map((c) => c.url).sort()).toEqual([
      "https://api.anthropic.com/api/oauth/usage",
      "https://chatgpt.com/backend-api/wham/usage",
    ]);
    const quota = lines()[2]!;
    expect(quota.startsWith("🟠 5h ⛁")).toBe(true);
    expect(quota).toContain("🟢 codex 5h 3% · 7d 17%");
  });

  test("S4 a provider on an API key is not polled even when another is", async () => {
    const { usage } = await start(gitExec({ status: CLEAN }), {
      models: [{ ...CODEX, oauth: false, token: undefined }],
    });
    expect(usage.calls.map((c) => c.url)).toEqual(["https://api.anthropic.com/api/oauth/usage"]);
  });
});

describe("S5 when to poll", () => {
  test("S5 agent_end within a minute polls nothing; after a minute, the active provider only", async () => {
    const { fake, ui, usage, advance } = await start(gitExec({ status: CLEAN }), {
      models: [CODEX],
    });
    expect(usage.calls).toHaveLength(2);
    await fake.emit("agent_end", {}, ui.ctx);
    expect(usage.calls).toHaveLength(2);
    advance(61_000);
    await fake.emit("agent_end", {}, ui.ctx);
    expect(usage.calls).toHaveLength(3);
    expect(usage.calls[2]!.url).toContain("anthropic.com");
  });

  test("S5 switching model polls the new provider and the footer flips", async () => {
    const { fake, ui, usage, advance, lines } = await start(gitExec({ status: CLEAN }), {
      models: [CODEX],
    });
    ui.model = CODEX;
    advance(61_000);
    await fake.emit("model_select", { model: ui.ctx.model }, ui.ctx);
    expect(usage.calls[2]!.url).toContain("chatgpt.com");
    expect(lines()[2]!.startsWith("🟢 5h ⛁")).toBe(true);
    expect(lines()[2]).toContain("🟠 anthropic 5h 58% · 7d 21% · fable 21%");
  });
});

describe("S6 response headers", () => {
  test("S6 anthropic headers update the windows without a request", async () => {
    const { fake, ui, usage, lines } = await start(gitExec({ status: CLEAN }));
    await fake.emit(
      "after_provider_response",
      {
        status: 200,
        headers: {
          "anthropic-ratelimit-unified-5h-utilization": "0.7",
          "anthropic-ratelimit-unified-7d-utilization": "0.25",
        },
      },
      ui.ctx,
    );
    expect(usage.calls).toHaveLength(1);
    expect(lines()[2]).toContain("70%");
    expect(lines()[2]).toContain("25%");
  });

  test("S6 headers while another provider is active are ignored", async () => {
    const { fake, ui, lines } = await start(gitExec({ status: CLEAN }), { models: [CODEX] });
    ui.model = CODEX;
    await fake.emit(
      "after_provider_response",
      { status: 200, headers: { "anthropic-ratelimit-unified-5h-utilization": "0.99" } },
      ui.ctx,
    );
    expect(lines().join("\n")).not.toContain("99%");
  });
});

describe("S7 /statusline", () => {
  test("S7 off restores Pi's footer; on brings it back", async () => {
    const { ui, run } = await start(gitExec({ status: CLEAN }));
    await run("off");
    expect(ui.footers.at(-1)).toBeUndefined();
    expect(ui.footer).toBeUndefined();
    expect(ui.notifications.at(-1)?.message).toContain("off");
    await run("on");
    expect(ui.footer).toBeDefined();
    expect(ui.notifications.at(-1)?.message).toContain("full");
  });

  test("S7 compact → session and quota share one line without bars; full → their own lines", async () => {
    const { run, lines } = await start(gitExec({ status: CLEAN }));
    await run("compact");
    let all = lines();
    expect(all).toHaveLength(3); // where · session+quota · the theme status
    expect(all[1]).toContain("🧮");
    expect(all[1]).toContain("🟠 5h 58%");
    expect(all.join("\n")).not.toContain("⛁");
    await run("full");
    all = lines();
    expect(all).toHaveLength(4);
    expect(all[2]!.startsWith("🟠 5h ⛁")).toBe(true);
  });

  test("S7 verbose toggles the cache detail", async () => {
    const { run, lines } = await start(gitExec({ status: CLEAN }));
    await run("verbose");
    expect(lines()[1]).toContain("read");
    await run("verbose");
    expect(lines()[1]).not.toContain("read");
  });

  test("S7 refresh polls now; an unknown word is an error and changes nothing", async () => {
    const { run, usage, ui } = await start(gitExec({ status: CLEAN }));
    await run("refresh");
    expect(usage.calls).toHaveLength(2);
    await run("sideways");
    expect(ui.notifications.at(-1)?.type).toBe("error");
    expect(usage.calls).toHaveLength(2);
  });

  test("S7 no argument reports the state", async () => {
    const { run, ui } = await start(gitExec({ status: CLEAN }));
    await run("");
    expect(ui.notifications.at(-1)?.message).toContain("full");
  });
});

describe("S8 shutdown and statuses", () => {
  test("S8 session_shutdown restores Pi's footer", async () => {
    const { fake, ui } = await start(gitExec({ status: CLEAN }));
    await fake.emit("session_shutdown", {}, ui.ctx);
    expect(ui.footers.at(-1)).toBeUndefined();
    expect(ui.footer).toBeUndefined();
  });

  test("S8 other extensions' statuses render on the last line with icons, the theme last", async () => {
    const { ui, lines } = await start(gitExec({ status: CLEAN }));
    ui.ctx.ui.setStatus("llm-wiki", "wiki queue 2 · inbox 0");
    const last = lines().at(-1)!;
    expect(last).toContain("📚 wiki queue 2 · inbox 0");
    expect(last).toContain("🎨 dark");
    expect(last.indexOf("📚")).toBeLessThan(last.indexOf("🎨"));
  });
});
