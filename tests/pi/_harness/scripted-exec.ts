// exec doubles for the engine bridge. `scriptedExec` answers by the verb it sees in
// the args (`queue`, `search`); the fail-open matrix lists every way an exec can
// go wrong that the bridge must turn into null.

import type { ExecCall, ExecResult, ExecScript } from "./fake-pi";

export const ok = (stdout: unknown): ExecResult => ({
  stdout: typeof stdout === "string" ? stdout : JSON.stringify(stdout),
  stderr: "",
  code: 0,
});

/** Answer each engine verb with its own result; a verb with no entry gets `code 1`. */
export function scriptedExec(byVerb: Record<string, ExecResult | (() => ExecResult)>): ExecScript {
  return ({ args }: ExecCall) => {
    const verb = args.find((a) => a === "queue" || a === "search") ?? "";
    const entry = byVerb[verb];
    if (entry === undefined) return { stdout: "", stderr: `no script for ${verb}`, code: 1 };
    return typeof entry === "function" ? entry() : entry;
  };
}

/** Every failure shape the bridge fails open on. */
export const FAIL_OPEN: Array<[name: string, exec: ExecScript]> = [
  [
    "uv missing (exec throws)",
    () => {
      throw new Error("spawn uv ENOENT");
    },
  ],
  ["non-zero exit", () => ({ stdout: "{}", stderr: "boom", code: 1 })],
  ["killed on timeout", () => ({ stdout: "", stderr: "", code: 0, killed: true })],
  ["stdout is not JSON", () => ({ stdout: "not json", stderr: "", code: 0 })],
  ["stdout is a JSON array", () => ({ stdout: "[]", stderr: "", code: 0 })],
  ["stdout is a JSON scalar", () => ({ stdout: "42", stderr: "", code: 0 })],
];
