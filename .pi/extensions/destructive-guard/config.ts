// `.pi/destructive-guard.json` and the workspace it belongs to. The file is
// optional; a malformed one falls back to the defaults with a warning rather
// than silently disabling the guard or wedging the session.

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { expandHome } from "./paths";
import { ruleById } from "./rules";
import type { GuardConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

export const CONFIG_FILE = ".pi/destructive-guard.json";

/** The nearest ancestor (or cwd itself) holding .git or .pi — the workspace boundary. */
export function findWorkspace(cwd: string): string {
  let dir = resolve(cwd);
  for (let depth = 0; depth < 64; depth += 1) {
    if (existsSync(join(dir, ".git")) || isDir(join(dir, ".pi"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(cwd);
}

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export interface LoadedConfig {
  config: GuardConfig;
  warnings: string[];
  /** Deny-tier rules the file softened or cleared — announced at session start. */
  softened: string[];
}

function stringList(value: unknown, field: string, warnings: string[]): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    warnings.push(`${field} must be a list of strings; ignored`);
    return [];
  }
  return value as string[];
}

function ruleIds(value: unknown, field: string, warnings: string[]): string[] {
  const ids = stringList(value, field, warnings);
  const known = ids.filter((id) => {
    if (ruleById(id)) return true;
    warnings.push(`${field}: no rule named "${id}"`);
    return false;
  });
  return known;
}

/** Parse the config text; never throws. */
export function parseConfig(text: string, home: string): LoadedConfig {
  const warnings: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return {
      config: DEFAULT_CONFIG,
      warnings: [
        `not valid JSON (${error instanceof Error ? error.message : String(error)}); using defaults`,
      ],
      softened: [],
    };
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      config: DEFAULT_CONFIG,
      warnings: ["must be a JSON object; using defaults"],
      softened: [],
    };
  }
  const object = raw as Record<string, unknown>;
  const allow = ruleIds(object.allow, "allow", warnings);
  const ask = ruleIds(object.ask, "ask", warnings);
  const deny = ruleIds(object.deny, "deny", warnings);
  const protectedRoots = stringList(object.protectedRoots, "protectedRoots", warnings).map((root) =>
    resolve(expandHome(root, home)),
  );
  const artifacts = stringList(object.artifacts, "artifacts", warnings);
  let headless: GuardConfig["headless"] = DEFAULT_CONFIG.headless;
  if (object.headless !== undefined) {
    if (object.headless === "deny" || object.headless === "allow") headless = object.headless;
    else warnings.push(`headless must be "deny" or "allow"; using "${headless}"`);
  }
  let audit: GuardConfig["audit"] = DEFAULT_CONFIG.audit;
  if (object.audit !== undefined) {
    if (object.audit === false || typeof object.audit === "string") audit = object.audit;
    else warnings.push("audit must be a path or false; using the default");
  }
  const softened = [...allow, ...ask].filter((id) => ruleById(id)?.tier === "deny");
  return {
    config: { allow, ask, deny, protectedRoots, artifacts, headless, audit },
    warnings,
    softened,
  };
}

/** Read the workspace's config; a missing file is the defaults with no warning. */
export function loadConfig(workspace: string, home: string): LoadedConfig {
  const path = join(workspace, CONFIG_FILE);
  if (!existsSync(path)) return { config: DEFAULT_CONFIG, warnings: [], softened: [] };
  try {
    return parseConfig(readFileSync(path, "utf8"), home);
  } catch (error) {
    return {
      config: DEFAULT_CONFIG,
      warnings: [
        `could not read ${CONFIG_FILE} (${error instanceof Error ? error.message : String(error)})`,
      ],
      softened: [],
    };
  }
}
