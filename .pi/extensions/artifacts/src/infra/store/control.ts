// The control files under <root>/.server/, read by both processes:
//
//   token        the session capability; only the pi process sends it
//   viewer       the browser capability; page URLs carry it once, then a cookie
//   record.json  pid, port, origin of the running server
//   lock         who is spawning the server right now (pid), O_EXCL
//   server.log   the server's stdout and stderr
//
// Whoever needs a token first mints it; the server re-reads both when a
// request presents something else, so a rotation never orphans a process.

import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import type { ServerRecord } from "../../domain/types";

export const CONTROL_DIR = ".server";

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

export const controlDir = (root: string) => join(root, CONTROL_DIR);
export const tokenPath = (root: string) => join(controlDir(root), "token");
export const viewerPath = (root: string) => join(controlDir(root), "viewer");
export const recordPath = (root: string) => join(controlDir(root), "record.json");
export const lockPath = (root: string) => join(controlDir(root), "lock");
export const serverLogPath = (root: string) => join(controlDir(root), "server.log");

const SECRET_RE = /^[a-f0-9]{32,}$/;

function readSecret(path: string): string | null {
  if (!existsSync(path)) return null;
  const value = readFileSync(path, "utf8").trim();
  return SECRET_RE.test(value) ? value : null;
}

function ensureSecret(path: string, bytes: number): string {
  mkdirSync(join(path, ".."), { recursive: true });
  const existing = readSecret(path);
  if (existing) return existing;
  const fresh = randomBytes(bytes).toString("hex");
  writeAtomic(path, `${fresh}\n`);
  try {
    chmodSync(path, 0o600);
  } catch {
    // Windows and some mounts refuse; the file still lives inside the project.
  }
  return fresh;
}

export const readToken = (root: string) => readSecret(tokenPath(root));
export const ensureToken = (root: string) => ensureSecret(tokenPath(root), 24);
export const readViewer = (root: string) => readSecret(viewerPath(root));
export const ensureViewer = (root: string) => ensureSecret(viewerPath(root), 16);

/** A short digest of a secret: enough to notice a rotation, useless to present. */
export const tokenId = (secret: string) =>
  createHash("sha256").update(secret).digest("hex").slice(0, 8);

/** The mtime of a control file, for a cheap "did it change" check. */
export function fileStamp(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return -1;
  }
}

export function readServerRecord(root: string): ServerRecord | null {
  const record = readJson<ServerRecord | null>(recordPath(root), null);
  return record && typeof record.pid === "number" && typeof record.port === "number"
    ? record
    : null;
}

export function writeServerRecord(root: string, record: ServerRecord): void {
  mkdirSync(controlDir(root), { recursive: true });
  writeAtomic(recordPath(root), `${JSON.stringify(record, null, 2)}\n`);
}

export function clearServerRecord(root: string): void {
  try {
    unlinkSync(recordPath(root));
  } catch {
    // already gone
  }
}

export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Roots this process holds the lock for: a second caller in the same process must wait too. */
const heldHere = new Set<string>();

/** Takes the spawn lock; false when another live process (or this one) holds it. A dead holder is replaced. */
export function acquireLock(root: string): boolean {
  if (heldHere.has(root)) return false;
  mkdirSync(controlDir(root), { recursive: true });
  const path = lockPath(root);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      writeFileSync(path, `${process.pid}\n`, { flag: "wx" });
      heldHere.add(root);
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      const holder = Number(readFileSync(path, "utf8").trim());
      if (Number.isFinite(holder) && holder !== process.pid && pidAlive(holder)) return false;
      try {
        unlinkSync(path);
      } catch {
        // raced; the next attempt sees the fresh state
      }
    }
  }
  return false;
}

export function releaseLock(root: string): void {
  heldHere.delete(root);
  try {
    if (Number(readFileSync(lockPath(root), "utf8").trim()) === process.pid)
      unlinkSync(lockPath(root));
  } catch {
    // not ours or already gone
  }
}
