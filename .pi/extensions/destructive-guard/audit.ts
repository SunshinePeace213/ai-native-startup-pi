// The append-only JSONL trail of every non-allow verdict and every human
// decision. Best effort: a log that cannot be written never blocks a call.

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import type { AuditEntry } from "./types";

export type Appender = (path: string, line: string) => void;

const defaultAppend: Appender = (path, line) => {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, line, "utf8");
};

/** Write one entry; returns the error text when it failed, undefined otherwise. */
export function audit(
  entry: AuditEntry,
  target: string | false,
  workspace: string,
  append: Appender = defaultAppend,
): string | undefined {
  if (target === false) return undefined;
  const path = isAbsolute(target) ? target : join(workspace, target);
  try {
    append(path, `${JSON.stringify(entry)}\n`);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
