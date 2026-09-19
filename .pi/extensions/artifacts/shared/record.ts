// The control files beside the store, read by both processes and written by
// whichever owns them: the session mints nothing, the server writes its
// record; the token is created by whoever first needs it.
//
//   <root>/.token          the capability token every page URL carries once
//   <root>/.server.json    pid, port, origin of the running server
//   <root>/.server.log     the server's stdout and stderr

import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { SLUG_RE } from "./protocol";
import type { ServerRecord } from "./types";

/** Atomic write: a sibling temp file renamed into place. */
export function writeAtomic(path: string, content: string): void {
  const tmp = `${path}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, path);
}

export function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export const tokenPath = (root: string) => join(root, ".token");
export const serverRecordPath = (root: string) => join(root, ".server.json");
export const serverLogPath = (root: string) => join(root, ".server.log");

/** Reads the token a store holds, without creating one; null when absent. */
export function readToken(root: string): string | null {
  const path = tokenPath(root);
  if (!existsSync(path)) return null;
  const existing = readFileSync(path, "utf8").trim();
  return /^[a-f0-9]{32,}$/.test(existing) ? existing : null;
}

/** The token, created on first use, readable by the owner only. */
export function ensureToken(root: string): string {
  mkdirSync(root, { recursive: true });
  const existing = readToken(root);
  if (existing) return existing;
  const fresh = randomBytes(24).toString("hex");
  writeAtomic(tokenPath(root), `${fresh}\n`);
  try {
    chmodSync(tokenPath(root), 0o600);
  } catch {
    // Windows and some mounts refuse; the token still lives inside the project.
  }
  return fresh;
}

export function readServerRecord(root: string): ServerRecord | null {
  const record = readJson<ServerRecord | null>(serverRecordPath(root), null);
  return record && typeof record.pid === "number" && typeof record.port === "number"
    ? record
    : null;
}

export function writeServerRecord(root: string, record: ServerRecord): void {
  mkdirSync(root, { recursive: true });
  writeAtomic(serverRecordPath(root), `${JSON.stringify(record, null, 2)}\n`);
}

export function clearServerRecord(root: string): void {
  try {
    unlinkSync(serverRecordPath(root));
  } catch {
    // already gone
  }
}

/** Whether the store holds at least one artifact; a pure directory read. */
export function hasArtifacts(root: string): boolean {
  if (!existsSync(root)) return false;
  return readdirSync(root, { withFileTypes: true }).some(
    (d) =>
      d.isDirectory() && SLUG_RE.test(d.name) && existsSync(join(root, d.name, "manifest.json")),
  );
}
