// What the human and the agent read. The dialog shows the command first, then
// the rule, the danger, the targets, and — labelled as unverified — whatever
// the agent said its reason was. The block reasons are written for the model
// to act on: what tripped, why, the safe route, and that the human is the one
// who runs it if it is truly needed.

import type { Match, Verdict } from "./types";

export const CHOICES = {
  once: "Approve once",
  session: "Approve for this session (same rule + targets)",
  alternative: "Deny — tell the agent the safe alternative",
  stop: "Deny and stop this turn",
} as const;

export const CHOICE_LIST: string[] = [
  CHOICES.once,
  CHOICES.session,
  CHOICES.alternative,
  CHOICES.stop,
];

const MAX_SHOWN = 3;

function oneLine(command: string, width = 96): string {
  const flat = command.replace(/\s*\n\s*/g, " ⏎ ").trim();
  return flat.length > width ? `${flat.slice(0, width - 1)}…` : flat;
}

function label(match: Match): string {
  return `${match.rule.family}/${match.rule.id}`;
}

export interface Recovery {
  tracked: number;
  untracked: number;
}

/** The approval card — the dialog title, multi-line. */
export function card(
  verdict: Verdict,
  command: string,
  claim: string | undefined,
  recovery?: Recovery,
): string {
  const lead = verdict.matches[0];
  const lines = ["⚠ destructive-guard — approval needed", `  ${oneLine(command)}`, ""];
  if (lead) {
    lines.push(
      `  rule     ${label(lead)}${verdict.matches.length > 1 ? ` (+${verdict.matches.length - 1} more)` : ""}`,
    );
    lines.push(`  why      ${lead.rule.why}`);
    if (lead.detail) lines.push(`  target   ${lead.detail}`);
    const extra = verdict.matches.slice(1, MAX_SHOWN);
    for (const match of extra)
      lines.push(`  also     ${label(match)} — ${match.detail ?? match.rule.title}`);
  }
  if (recovery) {
    const permanent =
      recovery.untracked > 0 ? ` · ${recovery.untracked} untracked → PERMANENT` : "";
    lines.push(`  recovery ${recovery.tracked} tracked (restorable)${permanent}`);
  }
  lines.push(
    claim
      ? `  agent    "${oneLine(claim, 80)}"  ← its claim, unverified`
      : "  agent    gave no reason (a `# why:` line would show here)",
  );
  return lines.join("\n");
}

function blocks(matches: Match[], head: string): string[] {
  const out = matches.slice(0, MAX_SHOWN).map((match) => {
    const target = match.detail ? `\nTarget: ${match.detail}` : "";
    return `[destructive-guard] ${head} (${label(match)}): ${match.rule.title}${target}\nWhy: ${match.rule.why}\nFix: ${match.fix}`;
  });
  if (matches.length > MAX_SHOWN)
    out.push(`[destructive-guard] … and ${matches.length - MAX_SHOWN} more rule(s) matched`);
  return out;
}

const EQUIVALENTS =
  "Do not retry this command or an equivalent (find -delete, xargs rm, an interpreter's rmtree/rmSync, a script that does the same).";

/** The deny tier: the agent cannot run this at all. */
export function denyReason(verdict: Verdict): string {
  const denied = verdict.matches.filter((match) => match.tier === "deny");
  return [
    ...blocks(denied, "BLOCKED"),
    `This command never runs from an agent session. ${EQUIVALENTS} If the task genuinely needs it, tell the user exactly what it does and ask them to run it themselves.`,
  ].join("\n");
}

/** The human said no and chose to hand the agent the safe route. */
export function declinedReason(verdict: Verdict): string {
  return [
    ...blocks(verdict.matches, "DECLINED by the user"),
    `${EQUIVALENTS} Use the Fix above, or explain why the task cannot proceed without it and stop.`,
  ].join("\n");
}

/** Ask tier with nobody to ask. */
export function headlessReason(verdict: Verdict): string {
  const ids = verdict.matches.map((match) => `"${match.rule.id}"`).join(", ");
  return [
    ...blocks(verdict.matches, "NEEDS APPROVAL, no human present"),
    `This session has no UI (print/json mode or a subagent), so an approval cannot be asked for. ${EQUIVALENTS} Either continue under an interactive session, or the user adds ${ids} to "allow" in .pi/destructive-guard.json.`,
  ].join("\n");
}

/** The dialog was dismissed (Esc or timeout) — treated as a decline, but say so. */
export function dismissedReason(verdict: Verdict): string {
  return [
    ...blocks(verdict.matches, "NOT APPROVED (dialog dismissed)"),
    `The user closed the approval dialog without approving. ${EQUIVALENTS} Ask the user how to proceed.`,
  ].join("\n");
}

/** What the guard tells the model about itself. */
export const SYSTEM_PROMPT_NOTE = [
  "A destructive-guard extension inspects every bash, write, and edit call before it runs.",
  "Commands that would destroy the machine, the home directory, a system root, or anything outside the workspace are blocked outright; irreversible commands inside the workspace (recursive rm of source, git reset --hard, DROP TABLE, docker prune, terraform destroy, sudo, curl | sh) pause for the user's approval.",
  "Before a bash command that deletes, resets, or overwrites data, put a one-line comment `# why: <reason>` on the line above it; the guard shows that reason to the user in the approval dialog.",
  "When the guard blocks or the user declines, do not retry with an equivalent (find -delete, xargs rm, python shutil.rmtree, node fs.rmSync, a script); use the fix it names or explain the need and let the user run it.",
  "Regenerable build directories (node_modules, dist, build, .venv, __pycache__, coverage, target) inside the workspace may be removed without approval; prefer `mv <target> ~/.Trash/` for anything else.",
].join(" ");
