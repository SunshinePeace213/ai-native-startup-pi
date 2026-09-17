// The destructive-guard extension: a deny/ask gate on every bash, write, and
// edit call, replacing the Claude Code `destructive-guard` hook.
//
//   tool_call (bash)         evaluate() the command → deny blocks with the safe route,
//                            ask opens the approval card, allow is silence
//   tool_call (write/edit)   the path classifier → a system file is denied, a shell
//                            profile asks
//   before_agent_start       tells the model the guard exists and to state `# why:`
//   session_start            loads .pi/destructive-guard.json, announces softened denials
//   /destructive-guard       status · ask off|on (this session; deny never lifts) ·
//                            forget (drop session approvals) · test <command>
//
// Pi has no sandbox and no permission popups: tool_call returning { block } is
// the only choke point, and ctx.ui.select() inside it is the popup. A handler
// that throws blocks the call, so the guard catches its own errors and allows —
// loudly (a notify and an audit line) but open, because a guard bug must never
// wedge the session. Text matching, not a sandbox: an interpreter or a script
// the agent wrote can still do what a rule names; the interpreter rules and
// the system-prompt note narrow that, they do not close it.

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { homedir } from "node:os";
import { release } from "node:os";

import { audit as writeAudit } from "./audit";
import { type LoadedConfig, findWorkspace, loadConfig } from "./config";
import { detectPlatform, evaluate } from "./engine";
import { type ExecFn, recovery } from "./inspect";
import { agentClaim } from "./normalize";
import { classifyWrite } from "./paths";
import {
  CHOICES,
  CHOICE_LIST,
  type Recovery,
  SYSTEM_PROMPT_NOTE,
  card,
  declinedReason,
  denyReason,
  dismissedReason,
  headlessReason,
} from "./prompt";
import { CATALOG, WRITE_RULES } from "./rules";
import { createApprovals } from "./session";
import type { AuditEntry, Decision, GuardEnv, Match, Verdict } from "./types";

const STATUS_KEY = "destructive-guard";
const RECOVERY_TIMEOUT_MS = 3_000;
const RECOVERY_RULES = new Set(["rm", "find-delete"]);

type Block = { block: true; reason: string; terminate?: boolean };

export default function (pi: ExtensionAPI) {
  const approvals = createApprovals();
  const exec: ExecFn = (command, args, options) => pi.exec(command, args, options);
  const platform = detectPlatform(process.platform, release());
  let cache: { workspace: string; home: string; loaded: LoadedConfig } | undefined;
  let askLifted = false;

  function state(cwd: string): { env: GuardEnv; loaded: LoadedConfig } {
    const workspace = findWorkspace(cwd);
    // $HOME first — what homedir() reads on POSIX, minus Bun's caching of it.
    const home = process.env.HOME || homedir();
    if (!cache || cache.workspace !== workspace || cache.home !== home) {
      cache = { workspace, home, loaded: loadConfig(workspace, home) };
    }
    const { config } = cache.loaded;
    return {
      env: {
        cwd,
        workspace,
        home,
        platform,
        extraProtectedRoots: config.protectedRoots,
        extraArtifacts: config.artifacts,
      },
      loaded: cache.loaded,
    };
  }

  function status(ctx: ExtensionContext, loaded: LoadedConfig) {
    if (!ctx.hasUI) return;
    const parts: string[] = [];
    if (askLifted) parts.push("ask OFF");
    if (loaded.softened.length) parts.push(`${loaded.softened.length} deny softened`);
    ctx.ui.setStatus(STATUS_KEY, parts.length ? `guard · ${parts.join(" · ")}` : "");
  }

  function log(
    entry: Omit<AuditEntry, "at">,
    env: GuardEnv,
    loaded: LoadedConfig,
    ctx: ExtensionContext,
  ) {
    const error = writeAudit(
      { at: new Date().toISOString(), ...entry },
      loaded.config.audit,
      env.workspace,
    );
    if (error && ctx.hasUI)
      ctx.ui.notify(`destructive-guard: audit log not written (${error})`, "warning");
  }

  /** The shared deny / ask / allow flow for a verdict, whatever tool produced it. */
  async function resolve(
    verdict: Verdict,
    tool: string,
    command: string,
    ctx: ExtensionContext,
    env: GuardEnv,
    loaded: LoadedConfig,
  ): Promise<Block | undefined> {
    if (verdict.tier === "allow") return undefined;
    const claim = agentClaim(command);
    const targets = verdict.matches.flatMap((match) => match.targets ?? []);
    const base = {
      tool,
      tier: verdict.tier,
      rules: verdict.matches.map((match) => match.rule.id),
      command,
      cwd: env.cwd,
      ...(targets.length ? { targets } : {}),
      ...(claim ? { claim } : {}),
    };
    const record = (decision: Decision) => log({ ...base, decision }, env, loaded, ctx);

    if (verdict.tier === "deny") {
      record("denied-rule");
      return { block: true, reason: denyReason(verdict) };
    }
    if (approvals.covers(verdict)) {
      record("remembered");
      return undefined;
    }
    if (askLifted) {
      record("allow");
      return undefined;
    }
    if (!ctx.hasUI) {
      if (loaded.config.headless === "allow") {
        record("allow");
        return undefined;
      }
      record("denied-headless");
      return { block: true, reason: headlessReason(verdict) };
    }
    const lead = verdict.matches[0] as Match;
    let rec: Recovery | undefined;
    if (RECOVERY_RULES.has(lead.rule.id) && lead.targets?.length) {
      rec = await recovery(exec, env.workspace, lead.targets, RECOVERY_TIMEOUT_MS);
    }
    const choice = await ctx.ui.select(card(verdict, command, claim, rec), CHOICE_LIST);
    switch (choice) {
      case CHOICES.once:
        record("approved-once");
        return undefined;
      case CHOICES.session:
        approvals.remember(verdict);
        record("approved-session");
        return undefined;
      case CHOICES.alternative:
        record("denied-alternative");
        return { block: true, reason: declinedReason(verdict) };
      case CHOICES.stop:
        record("denied-stop");
        return {
          block: true,
          reason: `${declinedReason(verdict)}\nThe user ended this turn.`,
          terminate: true,
        };
      default:
        record("dismissed");
        return { block: true, reason: dismissedReason(verdict) };
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    const { loaded } = state(ctx.cwd);
    if (!ctx.hasUI) return;
    for (const warning of loaded.warnings)
      ctx.ui.notify(`destructive-guard: .pi/destructive-guard.json — ${warning}`, "warning");
    if (loaded.softened.length) {
      ctx.ui.notify(
        `destructive-guard: deny-tier rules softened by .pi/destructive-guard.json: ${loaded.softened.join(", ")}`,
        "warning",
      );
    }
    status(ctx, loaded);
  });

  pi.on("before_agent_start", async (event) => {
    return { systemPrompt: `${event.systemPrompt}\n\n${SYSTEM_PROMPT_NOTE}` };
  });

  pi.on("tool_call", async (event, ctx) => {
    const input = event.input as Record<string, unknown>;
    let current: { env: GuardEnv; loaded: LoadedConfig } | undefined;
    try {
      current = state(ctx.cwd);
      if (event.toolName === "bash" && typeof input.command === "string") {
        const verdict = evaluate(input.command, current.env, current.loaded.config);
        return await resolve(verdict, "bash", input.command, ctx, current.env, current.loaded);
      }
      if (
        (event.toolName === "write" || event.toolName === "edit") &&
        typeof input.path === "string"
      ) {
        const cls = classifyWrite(input.path, current.env);
        if (!cls) return undefined;
        const rule = cls.kind === "scratch" ? WRITE_RULES.profile : WRITE_RULES.system;
        const match: Match = {
          rule,
          tier: rule.tier,
          detail: cls.detail,
          targets: [cls.absolute ?? input.path],
          fix: rule.fix,
        };
        const verdict: Verdict = { tier: rule.tier, matches: [match], normalized: input.path };
        return await resolve(
          verdict,
          event.toolName,
          `${event.toolName} ${input.path}`,
          ctx,
          current.env,
          current.loaded,
        );
      }
      return undefined;
    } catch (error) {
      // A thrown handler blocks the call; fail open instead, and say so.
      const text = error instanceof Error ? (error.stack ?? error.message) : String(error);
      if (ctx.hasUI)
        ctx.ui.notify(
          `destructive-guard: internal error, call allowed unguarded — ${text.split("\n")[0]}`,
          "error",
        );
      if (current) {
        log(
          {
            tool: event.toolName,
            tier: "allow",
            decision: "allow",
            rules: ["internal-error"],
            command: typeof input.command === "string" ? input.command : String(input.path ?? ""),
            cwd: ctx.cwd,
            claim: text.split("\n")[0],
          },
          current.env,
          current.loaded,
          ctx,
        );
      }
      return undefined;
    }
  });

  pi.registerCommand("destructive-guard", {
    description: "status · ask off|on (this session; deny never lifts) · forget · test <command>",
    handler: async (args, ctx) => {
      const { env, loaded } = state(ctx.cwd);
      const [verb, ...rest] = (args ?? "").trim().split(/\s+/).filter(Boolean);
      if (verb === "ask" && (rest[0] === "off" || rest[0] === "on")) {
        askLifted = rest[0] === "off";
        status(ctx, loaded);
        ctx.ui.notify(
          askLifted
            ? "destructive-guard: ask tier lifted for this session — ask-tier commands run without a dialog (deny still blocks)"
            : "destructive-guard: ask tier re-armed",
          askLifted ? "warning" : "info",
        );
        return;
      }
      if (verb === "forget") {
        const count = approvals.size();
        approvals.clear();
        ctx.ui.notify(`destructive-guard: forgot ${count} session approval(s)`, "info");
        return;
      }
      if (verb === "test") {
        const command = (args ?? "").replace(/^\s*test\s+/, "");
        if (!command.trim()) {
          ctx.ui.notify(
            "destructive-guard test <command> — shows the verdict without running it",
            "info",
          );
          return;
        }
        const verdict = evaluate(command, env, loaded.config);
        const summary =
          verdict.tier === "allow"
            ? "allow — no rule fired"
            : verdict.matches
                .slice(0, 3)
                .map(
                  (m) =>
                    `${m.tier} · ${m.rule.family}/${m.rule.id}${m.detail ? ` — ${m.detail}` : ""}`,
                )
                .join("\n");
        ctx.ui.notify(
          `destructive-guard: ${summary}`,
          verdict.tier === "deny" ? "error" : verdict.tier === "ask" ? "warning" : "info",
        );
        return;
      }
      const deny = CATALOG.filter((r) => r.tier === "deny").length;
      const ask = CATALOG.filter((r) => r.tier === "ask").length;
      const refined = CATALOG.filter((r) => r.refine).length;
      ctx.ui.notify(
        [
          `destructive-guard · ${CATALOG.length} rules (${deny} deny, ${ask} ask, ${refined} target-refined) + write/edit path guard`,
          `workspace ${env.workspace} · platform ${env.platform} · ask tier ${askLifted ? "OFF (this session)" : "on"} · headless ${loaded.config.headless}`,
          `session approvals ${approvals.size()} · config overrides allow ${loaded.config.allow.length} / ask ${loaded.config.ask.length} / deny ${loaded.config.deny.length}${loaded.softened.length ? ` · softened deny: ${loaded.softened.join(", ")}` : ""}`,
          `audit ${loaded.config.audit === false ? "off" : loaded.config.audit}`,
        ].join("\n"),
        "info",
      );
    },
  });
}
