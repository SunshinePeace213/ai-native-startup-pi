// Path matching for both catalogs. A raw path from a tool call is expanded
// (`~`), resolved against the session cwd, and checked in both its lexical and
// its symlink-resolved form, so an alias aimed at a secret or a vendored file
// is caught too. Every function here returns null on odd input; nothing throws.

import { existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";

import { SENSITIVE_CATALOG, TEMPLATE_ALLOWLIST } from "../catalog/sensitive";
import type { SensitiveRule, VendoredEntry, VendoredMatch } from "../catalog/types";
import { VENDORED_CATALOG } from "../catalog/vendored";

// --- Normalization -----------------------------------------------------------

/** realpath that tolerates a path whose tail does not exist yet (a new file). */
export function realpathLenient(path: string): string {
  let head = path;
  const tail: string[] = [];
  while (!existsSync(head)) {
    const parent = dirname(head);
    if (parent === head) return path;
    tail.unshift(basename(head));
    head = parent;
  }
  try {
    return join(realpathSync(head), ...tail);
  } catch {
    return path;
  }
}

/** `~` expanded, made absolute against `cwd`, normalized. */
export function absolutize(raw: string, cwd: string): string {
  let candidate = raw.trim();
  if (candidate === "~") candidate = homedir();
  else if (candidate.startsWith("~/")) candidate = join(homedir(), candidate.slice(2));
  if (!isAbsolute(candidate)) candidate = resolve(cwd, candidate);
  return resolve(candidate);
}

/** The distinct absolute forms to test: lexical first, then the real path when it differs. */
export function candidateForms(raw: string, cwd: string): string[] {
  const lexical = absolutize(raw, cwd);
  const real = realpathLenient(lexical);
  return real === lexical ? [lexical] : [lexical, real];
}

function usable(path: unknown): path is string {
  return typeof path === "string" && path.trim().length > 0;
}

// --- Glob → regex -------------------------------------------------------------

/** fnmatch-style `*` / `?` over one path segment, anchored; other chars literal. */
export function globToRegex(pattern: string, flags = "i"): RegExp {
  let source = "";
  for (const ch of pattern) {
    if (ch === "*") source += "[^/]*";
    else if (ch === "?") source += "[^/]";
    else source += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`, flags);
}

// --- Sensitive ----------------------------------------------------------------

const ALLOWLIST = new Set(TEMPLATE_ALLOWLIST.map((name) => name.toLowerCase()));

/** True when `name` is one of the template names (case-insensitive). */
export function isAllowlisted(name: string): boolean {
  return ALLOWLIST.has(name.toLowerCase());
}

const isWild = (pattern: string) => pattern.includes("*") || pattern.includes("?");

function compileSensitive(): { basenames: SensitiveRule[]; fragments: SensitiveRule[] } {
  const basenames: SensitiveRule[] = [];
  const fragments: SensitiveRule[] = [];
  for (const category of SENSITIVE_CATALOG) {
    for (const pattern of category.basenames)
      basenames.push({ category, kind: "basename", pattern });
    for (const pattern of category.fragments)
      fragments.push({ category, kind: "fragment", pattern });
  }
  // A name matching both a literal and a wildcard rule (master.key: framework
  // and *.key: certs) reports the literal's category. The deny is the same.
  basenames.sort((a, b) => Number(isWild(a.pattern)) - Number(isWild(b.pattern)));
  return { basenames, fragments };
}

export const SENSITIVE_RULES = compileSensitive();

const BASENAME_REGEX = new Map(
  SENSITIVE_RULES.basenames.map((rule) => [rule.pattern, globToRegex(rule.pattern)] as const),
);

/** The basename rule `name` matches, honoring literal-before-wildcard order. */
export function basenameRule(name: string): SensitiveRule | null {
  for (const rule of SENSITIVE_RULES.basenames) {
    if (BASENAME_REGEX.get(rule.pattern)?.test(name)) return rule;
  }
  return null;
}

/**
 * Whether `fragment` occurs slash-bounded in `absPath`. A directory fragment
 * (`/.ssh/`) matches the directory itself and everything below it; a file
 * fragment (`/etc/shadow`) matches that file and anything below it, never
 * `/etc/shadowy`. Both sides lower-cased.
 */
export function fragmentMatchesPath(fragment: string, absPath: string): boolean {
  const needle = (fragment.endsWith("/") ? fragment : `${fragment}/`).toLowerCase();
  const haystack = `${absPath.split(sep).join("/").toLowerCase()}/`;
  return haystack.includes(needle);
}

function sensitiveForm(absPath: string): SensitiveRule | null {
  for (const rule of SENSITIVE_RULES.fragments) {
    if (fragmentMatchesPath(rule.pattern, absPath)) return rule;
  }
  const name = basename(absPath);
  if (isAllowlisted(name)) return null;
  return basenameRule(name);
}

/**
 * The sensitive rule a file path matches, or null. Fragments (directory
 * membership) win and are never allowlist-exempt; a basename is exempt only
 * when that form's own basename is a template — so a template-named symlink to
 * a real `.env` is still caught through its real path.
 */
export function matchSensitivePath(raw: unknown, cwd: string): SensitiveRule | null {
  if (!usable(raw)) return null;
  for (const form of candidateForms(raw, cwd)) {
    const rule = sensitiveForm(form);
    if (rule) return rule;
  }
  return null;
}

// --- Vendored ----------------------------------------------------------------

const DIR_RULES: Array<{ entry: VendoredEntry; pattern: string; regex: RegExp }> = [];
const FILE_RULES = new Map<string, VendoredEntry>();
for (const entry of VENDORED_CATALOG) {
  for (const pattern of entry.dirs)
    DIR_RULES.push({ entry, pattern, regex: globToRegex(pattern, "") });
  for (const name of entry.files) FILE_RULES.set(name, entry);
}

function isRegularFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function vendoredForm(absPath: string): VendoredMatch | null {
  const segments = absPath.split(sep).filter(Boolean);
  const last = segments.length - 1;
  for (let index = 0; index <= last; index += 1) {
    const segment = segments[index];
    if (segment === undefined) continue;
    const atRoot = index === last;
    for (const rule of DIR_RULES) {
      if (!rule.regex.test(segment)) continue;
      // A last-segment hit that is an existing regular file is a script named
      // like the directory (`./build`), not the directory.
      if (atRoot && isRegularFile(absPath)) continue;
      return { entry: rule.entry, segment, atRoot };
    }
  }
  const name = segments[last];
  if (name !== undefined) {
    const entry = FILE_RULES.get(name);
    if (entry) return { entry, segment: name, atRoot: true };
  }
  return null;
}

/** The vendored match for a path, or null. Both lexical and real forms are tried. */
export function matchVendoredPath(raw: unknown, cwd: string): VendoredMatch | null {
  if (!usable(raw)) return null;
  for (const form of candidateForms(raw, cwd)) {
    const match = vendoredForm(form);
    if (match) return match;
  }
  return null;
}
