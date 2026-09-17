// The decision: given one tool call, is it denied, and why. Pure apart from the
// filesystem lookups the matchers make (realpath, is-a-file, template exists).
// index.ts wires this to Pi's tool_call event.
//
//   sensitive  read · write · edit · grep · find · ls · bash   any access is denied
//   vendored   write · edit · bash                              content mutation is denied,
//                                                               reads stay open
//
// The sensitive check always runs first and can never be switched off. The
// vendored check honors `state.vendored`, the session toggle behind the
// `/access-guard` command.

import type { VendoredMatch } from "./catalog/types";
import { sensitiveDenial, vendoredDenial } from "./denial";
import { matchSensitiveCommand } from "./match/command";
import { matchSensitiveGlob } from "./match/glob";
import { matchSensitivePath, matchVendoredPath } from "./match/path";
import { type WriteMode, writeTargets } from "./match/shell";

export interface GuardState {
  /** Whether the vendored write guard is armed for this session. */
  vendored: boolean;
}

export interface Verdict {
  block: true;
  reason: string;
}

const deny = (reason: string): Verdict => ({ block: true, reason });

function str(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  return typeof value === "string" ? value : undefined;
}

function sensitivePath(path: string | undefined, cwd: string): Verdict | null {
  if (path === undefined) return null;
  const rule = matchSensitivePath(path, cwd);
  return rule ? deny(sensitiveDenial(path, rule, cwd)) : null;
}

function sensitiveGlob(pattern: string | undefined, cwd: string): Verdict | null {
  if (pattern === undefined) return null;
  const rule = matchSensitiveGlob(pattern);
  return rule ? deny(sensitiveDenial(pattern, rule, cwd)) : null;
}

/**
 * Whether a vendored match is tampering. Rewriting content is, anywhere. Removing
 * or moving the protected node as a whole is a regeneration step when the entry
 * says so; removing something inside it is not.
 */
function tampers(match: VendoredMatch, mode: WriteMode): boolean {
  if (mode === "content") return true;
  return !match.atRoot || !match.entry.removable;
}

function vendoredPath(path: string | undefined, cwd: string): Verdict | null {
  if (path === undefined) return null;
  const match = matchVendoredPath(path, cwd);
  return match ? deny(vendoredDenial(path, match)) : null;
}

function vendoredCommand(command: string, cwd: string): Verdict | null {
  for (const target of writeTargets(command)) {
    const match = matchVendoredPath(target.path, cwd);
    if (match && tampers(match, target.mode)) {
      return deny(vendoredDenial(target.path, match, target.verb));
    }
  }
  return null;
}

/** The verdict for one tool call, or null when nothing here objects. */
export function decide(
  toolName: string,
  input: Record<string, unknown>,
  cwd: string,
  state: GuardState,
): Verdict | null {
  const path = str(input, "path");
  switch (toolName) {
    case "read":
      return sensitivePath(path, cwd);
    case "write":
    case "edit":
      return sensitivePath(path, cwd) ?? (state.vendored ? vendoredPath(path, cwd) : null);
    case "grep":
      return sensitivePath(path, cwd) ?? sensitiveGlob(str(input, "glob"), cwd);
    case "find":
      return sensitivePath(path, cwd) ?? sensitiveGlob(str(input, "pattern"), cwd);
    case "ls":
      return sensitivePath(path, cwd);
    case "bash": {
      const command = str(input, "command");
      if (command === undefined) return null;
      const hit = matchSensitiveCommand(command);
      if (hit) return deny(sensitiveDenial(hit.token, hit.rule, cwd));
      return state.vendored ? vendoredCommand(command, cwd) : null;
    }
    default:
      return null;
  }
}
