// Sensitive-file references inside a bash command. Raw-text matching, not a
// shell parse, so a path inside quotes or an interpreter one-liner
// (`python -c "open('.env')"`) is caught as readily as `cat .env`. Best-effort:
// this is a tripwire against the ordinary case, not a sandbox.
//
// A cataloged basename counts only as its own shell token: bounded on both
// sides by whitespace, quotes, or a shell operator, with `/` and `=` also
// accepted on the left so `cat $HOME/.ssh/id_rsa` and `FOO=.env` match while
// `.env` inside `.envrc` never does. A directory fragment matches the directory
// itself and anything below it, in its absolute form (`/home/u/.aws`) and — for
// home dot-directories — its token-start relative form (`cat .aws/credentials`).

import { SENSITIVE_RULES, basenameRule, isAllowlisted } from "./path";
import type { SensitiveRule } from "../catalog/types";

const BOUNDARY = "\\s'\"|&;:,<>()`";
const LEFT = `(?:^|(?<=[${BOUNDARY}/=]))`;
const RIGHT = `(?=[${BOUNDARY}]|$)`;
const NON_BOUNDARY = `[^${BOUNDARY}/]`;
/** Token start for the relative form of a fragment: never a preceding `/`. */
const LEFT_REL = `(?:^|(?<=[${BOUNDARY}=]))`;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

function basenameSource(pattern: string): string {
  let out = "";
  for (const ch of pattern) {
    if (ch === "*") out += `${NON_BOUNDARY}*`;
    else if (ch === "?") out += NON_BOUNDARY;
    else out += escape(ch);
  }
  return out;
}

/**
 * Command-text form of a path fragment. The trailing `/` of a directory
 * fragment is dropped and replaced by a right boundary, so `ls ~/.ssh` matches
 * like `~/.ssh/id_rsa` does while `/.sshd/` and `.ssh_backup` do not.
 */
function fragmentSource(fragment: string): string {
  const core = fragment.endsWith("/") ? fragment.slice(0, -1) : fragment;
  const right = `(?=/|$|[${BOUNDARY}])`;
  const absolute = escape(core) + right;
  if (!fragment.startsWith("/.")) return absolute;
  const relative = LEFT_REL + escape(core.slice(1)) + right;
  return `(?:${absolute}|${relative})`;
}

const FRAGMENT_REGEX = new Map(
  SENSITIVE_RULES.fragments.map(
    (rule) => [rule.pattern, new RegExp(fragmentSource(rule.pattern), "i")] as const,
  ),
);

const COMMAND_REGEX = new RegExp(
  `${LEFT}(?<bn>${SENSITIVE_RULES.basenames.map((r) => basenameSource(r.pattern)).join("|")})${RIGHT}` +
    `|(?<fr>${SENSITIVE_RULES.fragments.map((r) => fragmentSource(r.pattern)).join("|")})`,
  "gi",
);

function fragmentRule(token: string): SensitiveRule | null {
  for (const rule of SENSITIVE_RULES.fragments) {
    if (FRAGMENT_REGEX.get(rule.pattern)?.test(token)) return rule;
  }
  return null;
}

export interface CommandMatch {
  token: string;
  rule: SensitiveRule;
}

/**
 * The first sensitive reference a command makes, or null. Scans left to right;
 * a token whose basename is a template is skipped, so `cat .env.example`
 * passes while `cat .env` is denied.
 */
export function matchSensitiveCommand(command: unknown): CommandMatch | null {
  if (typeof command !== "string" || !command.trim()) return null;
  for (const found of command.matchAll(COMMAND_REGEX)) {
    const bn = found.groups?.bn;
    if (bn !== undefined) {
      if (isAllowlisted(bn)) continue;
      const rule = basenameRule(bn);
      if (rule) return { token: bn, rule };
      continue;
    }
    const fr = found.groups?.fr;
    if (fr !== undefined) {
      const rule = fragmentRule(fr);
      if (rule) return { token: fr, rule };
    }
  }
  return null;
}
