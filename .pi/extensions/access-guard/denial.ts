// The text a blocked tool call returns to the model. Each denial names what was
// blocked and why, then the safe alternative, so the agent can route around the
// wall instead of retrying against it.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { TEMPLATE_ALLOWLIST } from "./catalog/sensitive";
import type { SensitiveRule, VendoredMatch } from "./catalog/types";
import { absolutize, matchSensitivePath } from "./match/path";

export const POLICY_LINE =
  "Policy: never read, print, copy, or modify secret-bearing files; ask the user when a value is needed.";

const NO_TEMPLATE = "no template found -- ask the user for the variable names/values you need";

/**
 * First existing template beside the target, then at the project root — one the
 * guard would let the agent read, so a template-named symlink to a live secret
 * is never recommended.
 */
function findEnvTemplate(target: string, root: string): string | null {
  let targetDir = "";
  try {
    targetDir = dirname(absolutize(target, root));
  } catch {
    targetDir = "";
  }
  const dirs = [...new Set([targetDir, root].filter(Boolean))];
  for (const dir of dirs) {
    for (const name of TEMPLATE_ALLOWLIST) {
      const candidate = join(dir, name);
      try {
        if (existsSync(candidate) && !matchSensitivePath(candidate, root)) return candidate;
      } catch {
        continue;
      }
    }
  }
  return null;
}

function guidanceFor(target: string, rule: SensitiveRule, root: string): string {
  if (rule.category.id !== "env") return rule.category.guidance;
  const template = findEnvTemplate(target, root);
  return template ? `Read '${template}' instead for the variable names.` : NO_TEMPLATE;
}

/** The three-line sensitive denial: what matched, the redirect, the standing policy. */
export function sensitiveDenial(target: string, rule: SensitiveRule, root: string): string {
  return [
    `Blocked: '${target}' matches sensitive category '${rule.category.label}'`,
    guidanceFor(target, rule, root),
    POLICY_LINE,
  ].join("\n");
}

/** The two-line vendored denial: where the path sits, and what to do instead. */
export function vendoredDenial(target: string, match: VendoredMatch, verb?: string): string {
  const where = match.atRoot
    ? `'${target}' is '${match.segment}', ${match.entry.label}`
    : `'${target}' is inside '${match.segment}', ${match.entry.label}`;
  const via = verb ? ` (via ${verb})` : "";
  return [`Blocked${via}: ${where}.`, match.entry.guidance].join("\n");
}
