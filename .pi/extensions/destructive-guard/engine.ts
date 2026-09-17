// evaluate(): one command in, one verdict out. Pure — it reads no file but the
// symlinks the path classifier follows, runs nothing, and remembers nothing.
// index.ts turns the verdict into a dialog, a block, or silence.

import { normalize, segments } from "./normalize";
import { CATALOG } from "./rules";
import type { GuardConfig, GuardEnv, Match, Segment, Tier, Verdict } from "./types";
import { DEFAULT_CONFIG, TIER_RANK } from "./types";

/** Scan only this much of a command; a longer one is almost always a heredoc. */
export const MAX_COMMAND_CHARS = 64 * 1024;

/** The config re-maps a fired tier: allow clears it, ask softens a deny, deny hardens an ask. */
export function applyOverrides(id: string, tier: Tier, config: GuardConfig): Tier {
  if (tier === "allow") return tier;
  if (config.allow.includes(id)) return "allow";
  if (config.deny.includes(id)) return "deny";
  if (config.ask.includes(id)) return "ask";
  return tier;
}

export function evaluate(
  command: string,
  env: GuardEnv,
  config: GuardConfig = DEFAULT_CONFIG,
): Verdict {
  const text = command.length > MAX_COMMAND_CHARS ? command.slice(0, MAX_COMMAND_CHARS) : command;
  const normalized = normalize(text);
  let parsed: Segment[] | undefined;
  const matches: Match[] = [];
  for (const rule of CATALOG) {
    if (!rule.pattern.test(normalized)) continue;
    let tier = rule.tier;
    let detail: string | undefined;
    let targets: string[] | undefined;
    let fix = rule.fix;
    if (rule.refine) {
      parsed ??= segments(text);
      const refinement = rule.refine({ segments: parsed, normalized, env });
      if (refinement) {
        tier = refinement.tier;
        detail = refinement.detail;
        targets = refinement.targets;
        if (refinement.fix) fix = refinement.fix;
      }
    }
    tier = applyOverrides(rule.id, tier, config);
    if (tier === "allow") continue;
    matches.push({
      rule,
      tier,
      fix,
      ...(detail ? { detail } : {}),
      ...(targets ? { targets } : {}),
    });
  }
  matches.sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]);
  return { tier: matches[0]?.tier ?? "allow", matches, normalized };
}

/** The platform the guard runs on; WSL is Linux with a Windows drive under /mnt. */
export function detectPlatform(
  platform: string = process.platform,
  release: string = "",
): GuardEnv["platform"] {
  if (platform === "darwin") return "darwin";
  if (platform === "win32") return "win32";
  if (/microsoft|wsl/i.test(release)) return "wsl";
  return "linux";
}
