// The artifact server process. Run by bun, never imported by the pi side:
//
//   bun src/server.ts --root <store dir> --port <n> [--trash <dir>] [--retention <days>]
//                     [--isolation origin|sandbox]
//
// It binds Bun.serve on 127.0.0.1 at exactly the port it is given, writes
// .server/record.json once listening, logs to logs/<date>/server.jsonl,
// sweeps expired artifacts and logs at start and once a day, exits when its
// store root disappears, and exits on SIGTERM/SIGINT or POST /api/stop. It
// outlives the pi session that started it, so page links keep working and
// sends made while no session is attached wait as pending events.

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { Core } from "./app/core";
import { DEFAULT_CONFIG, DEFAULT_PORT } from "./domain/types";
import { startServer } from "./infra/http/server";
import { createLogger } from "./infra/log/logger";
import { renderer } from "./infra/render/document";
import {
  clearServerRecord,
  ensureToken,
  ensureViewer,
  writeServerRecord,
} from "./infra/store/control";
import { Store } from "./infra/store/store";

const SWEEP_EVERY_MS = 24 * 3600 * 1000;
const ROOT_CHECK_MS = 30_000;

function arg(name: string, fallback?: string): string | undefined {
  const k = process.argv.indexOf(`--${name}`);
  return k >= 0 && process.argv[k + 1] !== undefined ? process.argv[k + 1] : fallback;
}

const root = arg("root");
if (!root) {
  console.error(
    "usage: bun src/server.ts --root <store dir> --port <n> [--trash <dir>] [--retention <days>] [--isolation origin|sandbox]",
  );
  process.exit(2);
}
const absoluteRoot = resolve(root);
const port = Number(arg("port", String(DEFAULT_PORT)));
const trashDir = arg("trash", join(homedir(), ".Trash")) as string;
const retentionDays = Number(arg("retention", String(DEFAULT_CONFIG.retentionDays)));
const isolation = arg("isolation") === "sandbox" ? "sandbox" : DEFAULT_CONFIG.isolation;
const startedAt = new Date().toISOString();

const log = createLogger({
  root: absoluteRoot,
  name: "server",
  base: { pid: process.pid, component: "server" },
});
const store = new Store(absoluteRoot, trashDir);
const unreadable = store.unreadable();
if (unreadable.length)
  log.warn(
    { action: "skip", slugs: unreadable },
    "folders with a manifest this server cannot read",
  );
const core = new Core(store, renderer, {
  log,
  retentionDays: Number.isFinite(retentionDays) ? retentionDays : 14,
});
let stopping = false;

function stop(reason: string): void {
  if (stopping) return;
  stopping = true;
  log.info({ action: "stop", reason }, "stopping");
  try {
    server.stop();
  } catch {
    // already down
  }
  clearServerRecord(absoluteRoot);
  process.exit(0);
}

let server: ReturnType<typeof startServer>;
try {
  server = startServer(core, {
    root: absoluteRoot,
    token: ensureToken(absoluteRoot),
    viewer: ensureViewer(absoluteRoot),
    port: Number.isFinite(port) ? port : DEFAULT_PORT,
    isolation,
    startedAt,
    log,
    onStop: () => stop("api"),
  });
} catch (e) {
  log.error({ action: "start", port, err: (e as Error).message }, "could not start");
  console.error(`[artifacts] ${(e as Error).message}`);
  process.exit(3);
}

writeServerRecord(absoluteRoot, {
  pid: process.pid,
  port: server.port,
  origin: server.origin,
  root: absoluteRoot,
  startedAt,
});
log.info(
  { action: "start", port: server.port, origin: server.origin, root: absoluteRoot },
  "listening",
);
console.log(`[artifacts] listening on ${server.origin} (pid ${process.pid}, root ${absoluteRoot})`);

const sweep = () => {
  try {
    const swept = core.sweep();
    if (swept.artifacts.length || swept.logs.length)
      log.info({ action: "sweep", ...swept }, "sweep done");
  } catch (e) {
    log.error({ action: "sweep", err: (e as Error).message }, "sweep failed");
  }
};
sweep();
setInterval(sweep, SWEEP_EVERY_MS).unref();
setInterval(() => {
  if (!existsSync(absoluteRoot)) stop("root removed");
}, ROOT_CHECK_MS).unref();

process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGHUP", () => {
  // A closed terminal must not take the server with it.
});
