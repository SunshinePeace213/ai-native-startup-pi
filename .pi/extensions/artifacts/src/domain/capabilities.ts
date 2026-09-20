// What an artifact declares its page may do at run time, as Claude Code has
// it: `capabilities` maps a capability's name to its config — an object, or
// `true` for one with nothing to say, stored as `{}` — and a page reaches a
// served one with `await claude.use(name)`. A publish speaks in
// three gestures — omitted carries the stored declaration forward, `{}`
// clears it, anything else replaces it whole, so what is not restated is
// revoked.
//
// This host serves what it can run by itself. The capabilities that exist
// only as claude.ai services may still be declared, so a page written for
// Claude Code publishes here unchanged — but nothing stands behind them:
// `use()` resolves null, which is what Claude Code's contract tells a page to
// design for, and the publish result names them so the model never believes
// one works here. `permissions` is every page's and `reply` comes with a data
// island; neither is ever declared.

import type { Capabilities } from "./types";

/** Declared, and served to the page. */
export const SERVED_CAPABILITIES: readonly string[] = [
  "artifact",
  "assets",
  "comments",
  "db",
  "downloads",
];
/** Claude Code's, accepted in a declaration, with nothing behind them on this host. */
export const UNSERVED_CAPABILITIES: readonly string[] = ["mcp", "room", "sample", "self", "user"];
/** Served to every page, whatever it declares. */
export const PERMISSIONS = "permissions";
/** This platform's own: served to a page that has a data island. */
export const REPLY = "reply";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Why a declaration is refused, or null when it is one. */
export function declarationProblem(raw: unknown): string | null {
  if (!isPlainObject(raw)) return "capabilities is an object of capability name → config";
  for (const [name, config] of Object.entries(raw)) {
    if (name === PERMISSIONS)
      return `"${PERMISSIONS}" is built in: every page has it, so it is never declared`;
    if (name === REPLY)
      return `"${REPLY}" comes with the page's data island, so it is never declared`;
    if (!SERVED_CAPABILITIES.includes(name) && !UNSERVED_CAPABILITIES.includes(name)) {
      return `unknown capability "${name}"; this host serves ${SERVED_CAPABILITIES.join(", ")}, and accepts without serving ${UNSERVED_CAPABILITIES.join(", ")}`;
    }
    if (config !== true && !isPlainObject(config))
      return `the config of "${name}" must be an object, or true when it has nothing to say`;
  }
  return null;
}

/** A config as a publish states it: `true` is Claude Code's spelling of "declared, nothing to say" (`{downloads: true}`). */
export type DeclaredConfig = Record<string, unknown> | true;

/** The declaration a publish leaves behind: what it passed, or what was stored when it passed nothing. */
export const nextDeclaration = (
  stored: Capabilities | undefined,
  passed: Record<string, DeclaredConfig> | undefined,
): Capabilities =>
  passed === undefined
    ? (stored ?? {})
    : Object.fromEntries(
        Object.entries(passed).map(([name, config]) => [name, config === true ? {} : config]),
      );

/** What a page is served, name → config: the built-in, the reply loop when it has an island, and what it declared that this host runs. */
export function servedCapabilities(declared: Capabilities, hasIsland: boolean): Capabilities {
  const served: Capabilities = { [PERMISSIONS]: {} };
  if (hasIsland) served[REPLY] = {};
  for (const name of SERVED_CAPABILITIES) {
    if (Object.hasOwn(declared, name)) served[name] = declared[name] as Record<string, unknown>;
  }
  return served;
}

/** The declared names nothing stands behind here, in a stable order. */
export const unservedCapabilities = (declared: Capabilities): string[] =>
  Object.keys(declared)
    .filter((name) => UNSERVED_CAPABILITIES.includes(name))
    .sort();
