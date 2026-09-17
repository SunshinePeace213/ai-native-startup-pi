// The destructive-guard contract: what a rule is, what evaluating a command
// yields, and the environment the classifier needs. Pure data — index.ts owns
// every side effect (dialogs, audit, config file).

/**
 * The three verdicts, ordered by severity.
 *
 *   allow  runs without a word — recoverable, or inside the workspace and regenerable
 *   ask    the human decides per call — irreversible but scoped, or reversible but outside
 *          the workspace; with no human present (`-p`, json, subagents) it resolves to deny
 *   deny   never runs from an agent — endangers the machine's ability to boot or be reached,
 *          damages shared state, or a mistaken "yes" is catastrophic. The block reason
 *          tells the agent to hand the command to the human.
 */
export type Tier = "allow" | "ask" | "deny";

export const TIER_RANK: Record<Tier, number> = { allow: 0, ask: 1, deny: 2 };

export type Family =
  | "filesystem"
  | "disk"
  | "system"
  | "permissions"
  | "network"
  | "process"
  | "remote-exec"
  | "vcs"
  | "data"
  | "cloud"
  | "macos"
  | "wsl";

/** One command segment after wrapper stripping: `sudo -E rm -rf x` → verb `rm`, args `[-rf, x]`. */
export interface Segment {
  verb: string;
  args: string[];
  /** Wrappers peeled off the front: sudo, env, xargs, nohup, timeout … */
  wrappers: string[];
  /** The operands arrive from stdin (xargs) or a substitution — they cannot be read here. */
  operandsUnknown: boolean;
}

export interface GuardEnv {
  /** Where the bash tool will run; relative operands resolve against it. */
  cwd: string;
  /** The project root — the boundary "inside the workspace" means. Defaults to cwd. */
  workspace: string;
  home: string;
  platform: "linux" | "darwin" | "win32" | "wsl";
  /** Extra protected roots from config, already expanded. */
  extraProtectedRoots?: readonly string[];
  /** Extra regenerable directory names from config. */
  extraArtifacts?: readonly string[];
}

export interface RefineInput {
  segments: Segment[];
  normalized: string;
  env: GuardEnv;
}

/** A rule's second look, after its pattern matched: the tier may move either way. */
export interface Refinement {
  tier: Tier;
  /** One line explaining why this target lands in this tier — shown to human and agent. */
  detail?: string;
  /** The paths or resources the command would destroy, when they can be read. */
  targets?: string[];
  /** A more specific fix than the rule's default. */
  fix?: string;
}

export interface Rule {
  id: string;
  family: Family;
  /** The tier when the pattern matches and no refinement moves it. */
  tier: Tier;
  /** Tested against the quote-normalized command text, never anchored to its start. */
  pattern: RegExp;
  /** What tripped, one line. */
  title: string;
  /** The one-line danger. */
  why: string;
  /** The safe alternative. */
  fix: string;
  /**
   * Target-based classification. Returning undefined keeps the rule's tier;
   * returning `{ tier: "allow" }` clears the match.
   */
  refine?: (input: RefineInput) => Refinement | undefined;
}

export interface Match {
  rule: Rule;
  tier: Tier;
  detail?: string;
  targets?: string[];
  fix: string;
}

export interface Verdict {
  tier: Tier;
  /** Every non-allow match, deny first, then ask, catalog order within a tier. */
  matches: Match[];
  /** The quote-normalized text the rules scanned. */
  normalized: string;
}

/** `.pi/destructive-guard.json` — every field optional. */
export interface GuardConfig {
  /** Rule ids moved to allow. A deny-tier rule here is announced at session start. */
  allow: string[];
  /** Rule ids moved to ask. A deny-tier rule here is announced at session start. */
  ask: string[];
  /** Rule ids moved to deny. */
  deny: string[];
  /** Extra protected roots (`~` and `$HOME` expand). */
  protectedRoots: string[];
  /** Extra regenerable directory names that `rm -rf` may clear inside the workspace. */
  artifacts: string[];
  /** What the ask tier becomes with no human to answer. */
  headless: "deny" | "allow";
  /** Append-only JSONL audit path, relative to the project root; false disables. */
  audit: string | false;
}

export const DEFAULT_CONFIG: GuardConfig = {
  allow: [],
  ask: [],
  deny: [],
  protectedRoots: [],
  artifacts: [],
  headless: "deny",
  audit: ".pi/logs/destructive-guard.jsonl",
};

/** What the human chose, or what the guard chose for them. */
export type Decision =
  | "allow" // no rule fired, or the rule resolved to allow
  | "approved-once"
  | "approved-session"
  | "remembered" // an earlier approved-session covered it
  | "denied-alternative" // human said no, agent told the safe route
  | "denied-stop" // human said no and ended the turn
  | "denied-headless" // ask with nobody present
  | "denied-rule" // deny tier
  | "dismissed"; // Esc / timeout on the dialog

export interface AuditEntry {
  at: string;
  tool: string;
  tier: Tier;
  decision: Decision;
  rules: string[];
  command: string;
  targets?: string[];
  claim?: string;
  cwd: string;
}
