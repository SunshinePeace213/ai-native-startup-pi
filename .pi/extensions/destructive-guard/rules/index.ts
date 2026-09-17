// The catalog: every family in evaluation order. Order matters only for the
// order matches are reported in; the tier a command lands on is the worst of
// everything that fired.

import type { Rule } from "../types";
import { DATA_RULES } from "./data";
import { DISK_RULES } from "./disk";
import { FILESYSTEM_RULES } from "./filesystem";
import { MACOS_RULES, WSL_RULES } from "./platform";
import { REMOTE_RULES } from "./remote";
import { SYSTEM_RULES } from "./system";
import { VCS_RULES } from "./vcs";

export const CATALOG: readonly Rule[] = [
  ...FILESYSTEM_RULES,
  ...DISK_RULES,
  ...SYSTEM_RULES,
  ...REMOTE_RULES,
  ...VCS_RULES,
  ...DATA_RULES,
  ...MACOS_RULES,
  ...WSL_RULES,
];

const ids = new Set<string>();
for (const rule of CATALOG) {
  if (ids.has(rule.id)) throw new Error(`destructive-guard: duplicate rule id ${rule.id}`);
  ids.add(rule.id);
}

/**
 * The write/edit tool rules. They never scan bash text (their pattern matches
 * nothing); paths.ts classifyWrite() decides, and index.ts wraps the result in
 * one of these so the dialog, the block reason, and the config overrides read
 * the same shape as every bash rule.
 */
export const WRITE_RULES = {
  system: {
    id: "write-system-file",
    family: "filesystem",
    tier: "deny",
    pattern: /(?!)/,
    title: "write or edit of a system file",
    why: "a write under /etc, /boot, /usr, /System or /Library, or into a key directory, changes the machine for every user and process.",
    fix: "Write the content to a file inside the workspace and ask the user to install it themselves.",
  },
  profile: {
    id: "write-profile",
    family: "system",
    tier: "ask",
    pattern: /(?!)/,
    title: "write or edit of a shell profile",
    why: "a profile write persists into every future shell, so a bad line sabotages or hijacks later sessions.",
    fix: "Show the user the exact lines to add; approve only if a persistent change is intended.",
  },
} as const satisfies Record<string, Rule>;

export function ruleById(id: string): Rule | undefined {
  return (
    CATALOG.find((rule) => rule.id === id) ??
    Object.values(WRITE_RULES).find((rule) => rule.id === id)
  );
}
