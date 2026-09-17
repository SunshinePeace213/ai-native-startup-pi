// Fragments and helpers every rule family builds on. Patterns scan the
// quote-normalized command and are never anchored to its start, so a wrapper
// prefix (`sudo`, `env X=1`, `timeout 5`) or a compound (`cd / && rm -rf *`)
// still matches. Refinements read the parsed segments instead.

import { options } from "../normalize";
import { type PathClass, type PathKind, classifyTarget } from "../paths";
import type { GuardEnv, RefineInput, Refinement, Segment, Tier } from "../types";

/** Package runners that front a JS/Python CLI: `npx prisma`, `uvx …`, `bunx cdk`. */
export const RUNNERS = "npx|bunx|pnpm|yarn|npm|bun|uvx|uv|pipx|poetry|bundle";
import { TIER_RANK } from "../types";

// --- Regex fragments ------------------------------------------------------------

/** Stay inside one command segment (stops at ; & | newline). */
export const SEG = "[^;&|\\n]*?";
/** May cross a pipe — for rules whose whole point is a `| sh` stage. */
export const PIPE = "[^;\\n]*?";
/** Greedy whole-segment form for negative lookaheads. */
export const SEGG = "[^;&|\\n]*";
/** An option token starts after whitespace or at the beginning. */
export const OB = "(?<!\\S)";
/**
 * A verb starts after whitespace, a path (`/bin/rm`), a backslash (`\rm`), or an
 * operator — never after a hyphen (`--rm`), a dot (`foo.rm`), or a word. A refined
 * rule clears a false positive itself; an unrefined one accepts it, because a miss
 * on a deny rule costs more than a rare block on `ls /sbin/shutdown`.
 */
export const verb = (name: string) => `(?<![\\w.-])${name}(?![\\w-])`;
/** Recursive / force flag clusters in any order: -rf, -fr, -vrf, --recursive, --force. */
export const REC = `${OB}(?:--recursive|-[A-Za-z]*[rR][A-Za-z]*)\\b`;
export const FORCE = `${OB}(?:--force|-[A-Za-z]*f[A-Za-z]*)\\b`;
export const REC_R = `${OB}(?:--recursive|-[A-Za-z]*R[A-Za-z]*)\\b`;
export const HOME = "(?:~|\\$\\{HOME\\}|\\$HOME)";
/** A raw block / disk device node — never /dev/null, /dev/zero, /dev/stdout. */
export const BLOCKDEV =
  "/dev/(?:sd[a-z]+\\d*|hd[a-z]+\\d*|vd[a-z]+\\d*|xvd[a-z]+\\d*|nvme\\d+n\\d+(?:p\\d+)?" +
  "|mmcblk\\d+(?:p\\d+)?|disk\\d+(?:s\\d+)?|rdisk\\d+(?:s\\d+)?|mapper/[\\w-]+|md\\d+|dm-\\d+|loop\\d+)\\b";
/** A redirect or a tee that writes into the target that follows. */
export const REDIR_OR_TEE = `(?:>{1,2}\\s*|${OB}tee\\b${SEG}\\s)`;
/** A critical system file at an argument boundary; a `.bak` suffix does not match a fixed name. */
export const CRITICAL_FILE =
  "(?<![^\\s=<>|&;)}`])(?:/private)?(?:" +
  "/etc/(?:(?:passwd|shadow|gshadow|group|fstab|hosts|resolv\\.conf|nsswitch\\.conf|wsl\\.conf" +
  "|ld\\.so\\.preload|ssh/sshd_config)(?![\\w.-])" +
  "|sudoers(?:\\.d(?:/[^\\s;&|]+)?)?(?![\\w.-])" +
  "|(?:cron|pam\\.d|security|systemd|ssh)[^\\s;&|]*)" +
  "|/boot/[^\\s;&|]+|/System/[^\\s;&|]+|/Library/Launch(?:Daemons|Agents)/[^\\s;&|]+)";

export const re = (source: string, flags = "") => new RegExp(source, flags);

// --- Segment helpers ------------------------------------------------------------

export function withVerb(input: RefineInput, ...names: string[]): Segment[] {
  return input.segments.filter((segment) => names.includes(segment.verb));
}

export function hasFlag(segment: Segment, ...flags: string[]): boolean {
  const parsed = options(segment.args);
  return flags.some((flag) => parsed.flags.has(flag));
}

// --- Target classification → tier ------------------------------------------------

/** What each landing zone means for a verb that deletes what it names. */
export const DELETE_TIER: Record<PathKind, Tier> = {
  "protected-root": "deny",
  "critical-file": "deny",
  "variable-collapses": "deny",
  "workspace-root": "deny",
  outside: "deny",
  variable: "ask",
  workspace: "ask",
  scratch: "ask",
  unknown: "ask",
  artifact: "allow",
};

export function worse(a: Tier, b: Tier): Tier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

export interface Classified {
  operand: string;
  cls: PathClass;
  tier: Tier;
}

/** Classify every operand; `tierOf` maps a landing zone to a tier (DELETE_TIER by default). */
export function classifyAll(
  operands: string[],
  env: GuardEnv,
  tierOf: (cls: PathClass) => Tier = (cls) => DELETE_TIER[cls.kind],
): Classified[] {
  return operands.map((operand) => {
    const cls = classifyTarget(operand, env);
    return { operand, cls, tier: tierOf(cls) };
  });
}

/** Fold classified operands into one refinement: the worst tier, its details, and the targets. */
export function fold(classified: Classified[], fix?: string): Refinement | undefined {
  if (!classified.length) return undefined;
  let tier: Tier = "allow";
  for (const item of classified) tier = worse(tier, item.tier);
  const decisive = classified.filter((item) => item.tier === tier);
  const detail = decisive
    .slice(0, 3)
    .map((item) => item.cls.detail)
    .join("; ");
  const targets = classified.map((item) => item.cls.absolute ?? item.operand);
  return { tier, detail, targets, ...(fix ? { fix } : {}) };
}

/** Merge refinements from several segments: the worst tier wins; details and targets concatenate. */
export function merge(refinements: Array<Refinement | undefined>): Refinement | undefined {
  const present = refinements.filter((r): r is Refinement => r !== undefined);
  if (!present.length) return undefined;
  let tier: Tier = "allow";
  for (const r of present) tier = worse(tier, r.tier);
  const decisive = present.filter((r) => r.tier === tier);
  const detail = decisive
    .map((r) => r.detail)
    .filter((d): d is string => Boolean(d))
    .join("; ");
  const targets = present.flatMap((r) => r.targets ?? []);
  const fix = decisive.find((r) => r.fix)?.fix;
  return { tier, ...(detail ? { detail } : {}), targets, ...(fix ? { fix } : {}) };
}

export const ALLOW: Refinement = { tier: "allow" };

/**
 * The refinement for a verb-anchored rule with no target logic: the verb must be
 * what some segment runs (after wrappers, nested `sh -c`, and `eval`), not merely
 * a word in the text — so `ls /sbin/shutdown` and `echo "git push --force"` pass
 * while `sudo /sbin/shutdown -h now` and `bash -c "crontab -r"` still fire.
 */
export function needsVerb(pattern: RegExp) {
  return (input: RefineInput): Refinement | undefined =>
    input.segments.some((segment) => pattern.test(segment.verb)) ? undefined : ALLOW;
}
export const RUN_IT_YOURSELF = "Run this yourself in your own terminal — the agent will not.";
