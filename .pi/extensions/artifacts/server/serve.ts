// The artifact server process. Run by bun, never imported by the pi side:
//
//   bun server/serve.ts --root <store dir> [--port <n>] [--seed <project path>] [--trash <dir>]
//
// It binds Bun.serve on 127.0.0.1, writes .server.json beside the store once
// listening, logs to stdout, and exits on SIGTERM/SIGINT or POST /api/stop.
// It outlives the pi session that started it, so page links keep working and
// sends made while no session is attached wait as pending events.

import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { PREFIX } from "../shared/protocol";
import { clearServerRecord, ensureToken, writeServerRecord } from "../shared/record";
import { DEFAULT_PORT } from "../shared/types";
import { Core } from "./core";
import { startServer } from "./http";
import { Store } from "./store";

function arg(name: string, fallback?: string): string | undefined {
  const k = process.argv.indexOf(`--${name}`);
  return k >= 0 && process.argv[k + 1] !== undefined ? process.argv[k + 1] : fallback;
}

const root = arg("root");
if (!root) {
  console.error(
    "usage: bun server/serve.ts --root <store dir> [--port <n>] [--seed <path>] [--trash <dir>]",
  );
  process.exit(2);
}
const absoluteRoot = resolve(root);
const portArg = arg("port", String(DEFAULT_PORT)) as string;
const port = portArg === "any" ? -1 : Number(portArg);
const seed = arg("seed", absoluteRoot) as string;
const trashDir = arg("trash", join(homedir(), ".Trash")) as string;
const startedAt = new Date().toISOString();

const store = new Store(absoluteRoot);
const core = new Core(store, PREFIX, trashDir);
let stopping = false;

function stop(reason: string): void {
  if (stopping) return;
  stopping = true;
  console.log(`[artifacts] stopping (${reason})`);
  try {
    server.stop();
  } catch {
    // already down
  }
  clearServerRecord(absoluteRoot);
  process.exit(0);
}

const server = startServer(core, {
  token: ensureToken(absoluteRoot),
  port: Number.isFinite(port) ? port : DEFAULT_PORT,
  seed,
  startedAt,
  onStop: () => stop("api"),
});

writeServerRecord(absoluteRoot, {
  pid: process.pid,
  port: server.port,
  requestedPort: server.requestedPort,
  origin: server.origin,
  root: absoluteRoot,
  startedAt,
});

console.log(
  `[artifacts] listening on ${server.origin} (pid ${process.pid}, root ${absoluteRoot}` +
    `${server.requestedPort > 0 && server.port !== server.requestedPort ? `, port ${server.requestedPort} was taken` : ""})`,
);

process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGHUP", () => {
  // A closed terminal must not take the server with it.
});
