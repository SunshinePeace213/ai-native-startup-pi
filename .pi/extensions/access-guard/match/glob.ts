// Sensitive-file selection through a glob (grep's `glob`, find's `pattern`). A
// glob is a selection pattern, not a path, so the token grammar of command.ts
// cannot see that `.env*` or `secrets.*` select cataloged files. Conservative
// by design: a glob is denied only when it clearly targets a cataloged BASENAME
// family. One that opens with a wildcard — `*.py`, `**/*.md`, `src/**` — is a
// broad search and always passes; so does an exact template name.
//
// The glob's last segment (character classes rewritten to `?`, `*` runs
// collapsed — together a superset of what it selects) is tested three ways:
// (a) a concrete instance with every wildcard filled is itself a cataloged
// name (`bar.env` → `*.env`); (b) against a prefix-anchored rule the two
// pattern languages intersect (`.env[.]local` → `.env.*`); (c) against a
// suffix-anchored rule (`*.pem`) the intersection is taken after dropping only
// the terminal broad-search `*` (`secret.p*m*` → `secret.p*m` → `*.pem`), and
// a rule broad at both ends (`*.tfstate.*`) additionally needs three
// contiguous literal characters of its fixed middle in the raw glob.

import { SENSITIVE_RULES, basenameRule, isAllowlisted } from "./path";
import type { SensitiveRule } from "../catalog/types";

function lastSegment(pattern: string): string {
  const index = pattern.lastIndexOf("/");
  return index === -1 ? pattern : pattern.slice(index + 1);
}

function literalPrefix(segment: string): string {
  let out = "";
  for (const ch of segment) {
    if (ch === "*" || ch === "?" || ch === "[") break;
    out += ch;
  }
  return out;
}

/**
 * Replace each character class with `?`. A class matches one character, so
 * `?` selects a superset; a deny can only over-block, never under-block. An
 * unclosed `[` stays literal, as fnmatch reads it.
 */
export function rewriteCharClasses(segment: string): string {
  let out = "";
  let i = 0;
  const n = segment.length;
  while (i < n) {
    const ch = segment[i];
    if (ch !== "[") {
      out += ch;
      i += 1;
      continue;
    }
    let j = i + 1;
    if (j < n && segment[j] === "!") j += 1;
    if (j < n && segment[j] === "]") j += 1;
    while (j < n && segment[j] !== "]") j += 1;
    if (j >= n) {
      out += "[";
      i += 1;
    } else {
      out += "?";
      i = j + 1;
    }
  }
  return out;
}

/**
 * True iff some string matches both patterns (`*` any run, `?` one char,
 * literals; case-insensitive). Table DP filled from the end so an over-long
 * glob can never overflow the stack and fail the guard open.
 */
export function globsIntersect(glob: string, rule: string): boolean {
  const a = glob.toLowerCase();
  const b = rule.toLowerCase();
  const la = a.length;
  const lb = b.length;
  const dp: boolean[][] = Array.from({ length: la + 1 }, () =>
    new Array<boolean>(lb + 1).fill(false),
  );
  const at = (i: number, j: number) => dp[i]?.[j] ?? false;
  dp[la]![lb] = true;
  for (let i = la; i >= 0; i -= 1) {
    for (let j = lb; j >= 0; j -= 1) {
      if (i === la && j === lb) continue;
      let value = false;
      if (i < la && a[i] === "*") value = at(i + 1, j) || (j < lb && at(i, j + 1));
      else if (j < lb && b[j] === "*") value = at(i, j + 1) || (i < la && at(i + 1, j));
      else if (i < la && j < lb && (a[i] === "?" || b[j] === "?" || a[i] === b[j])) {
        value = at(i + 1, j + 1);
      }
      dp[i]![j] = value;
    }
  }
  return at(0, 0);
}

/**
 * Whether the raw glob spells three contiguous characters of a `*LIT*` rule's
 * fixed middle through literals or singleton classes. Variable classes, `?`,
 * and `*` break contiguity, so wildcard-only globs carry no signal.
 */
function hasBothEndsSignal(glob: string, rule: string): boolean {
  let skeleton = "";
  let i = 0;
  const n = glob.length;
  while (i < n) {
    const ch = glob[i];
    if (ch === "*" || ch === "?") {
      skeleton += "\0";
      i += 1;
      continue;
    }
    if (ch !== "[") {
      skeleton += ch;
      i += 1;
      continue;
    }
    let j = i + 1;
    const negated = j < n && glob[j] === "!";
    if (negated) j += 1;
    const memberStart = j;
    if (j < n && glob[j] === "]") j += 1;
    while (j < n && glob[j] !== "]") j += 1;
    if (j >= n) {
      skeleton += "[";
      i += 1;
      continue;
    }
    const members = glob.slice(memberStart, j);
    skeleton += !negated && members.length === 1 ? members : "\0";
    i = j + 1;
  }
  const text = skeleton.toLowerCase();
  const literal = rule.replace(/^\*+|\*+$/g, "").toLowerCase();
  for (let k = 0; k + 3 <= literal.length; k += 1) {
    if (text.includes(literal.slice(k, k + 3))) return true;
  }
  return false;
}

/** The sensitive rule a glob can select a file for, or null. */
export function matchSensitiveGlob(pattern: unknown): SensitiveRule | null {
  if (typeof pattern !== "string" || !pattern.trim()) return null;
  const raw = lastSegment(pattern.trim());
  if (isAllowlisted(raw)) return null;
  const segment = rewriteCharClasses(raw).replace(/\*+/g, "*");
  if (!literalPrefix(segment)) return null; // opens with a wildcard → broad search
  const lower = segment.toLowerCase();
  const core = lower.replace(/\*+$/, "");
  const witness = segment.replace(/[*?]/g, "x");
  const direct = basenameRule(witness);
  if (direct) return direct;
  for (const rule of SENSITIVE_RULES.basenames) {
    if (rule.pattern.startsWith("*")) {
      const bothEnds = rule.pattern.endsWith("*");
      if (bothEnds && !hasBothEndsSignal(raw, rule.pattern)) continue;
      if (globsIntersect(core, rule.pattern)) return rule;
    } else if (globsIntersect(lower, rule.pattern)) {
      return rule;
    }
  }
  return null;
}
