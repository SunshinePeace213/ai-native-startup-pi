// Contract — the server process and the port policy (src/infra/process, src/server.ts)
//
// P1: with the port free, locate spawns the real `bun src/server.ts`, which answers
//     /api/health with this root; a second locate from another session attaches to
//     it (spawned false, same pid); stop ends it
// P2: after the session token file is rotated, the running server accepts the new
//     token on its next request — no zombie, no respawn
// P3: when the port is held by another program, locate refuses and names the port;
//     when it is held by an artifact server for another root, it names that root;
//     nothing is spawned either way
// P4: two sessions locating together spawn one server: one takes the lock, the other
//     waits and attaches
// P5: the server writes logs/<date>/server.jsonl lines with an action, and the pi
//     side's logger writes logs/<date>/<session>.jsonl beside it; neither line
//     carries the token

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { logDate } from "@ext/artifacts/src/domain/retention";
import { createLogger } from "@ext/artifacts/src/infra/log/logger";
import { locateServer, probe, stopServer } from "@ext/artifacts/src/infra/process/launch";
import { readToken, tokenPath } from "@ext/artifacts/src/infra/store/control";
import { SESSION_HEADER } from "@ext/artifacts/src/domain/protocol";

const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()?.();
});

async function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const port = (s.address() as { port: number }).port;
      s.close(() => resolve(port));
    });
  });
}

function scratch() {
  const root = mkdtempSync(join(tmpdir(), "artifacts-proc-"));
  const trashDir = mkdtempSync(join(tmpdir(), "artifacts-proc-trash-"));
  return { root, trashDir };
}

const launch = (root: string, trashDir: string, port: number) =>
  locateServer({ root, port, trashDir, retentionDays: 14, waitMs: 15_000 });

describe("P1 spawn, attach, stop", () => {
  test("P1 the real server comes up on the port; a second locate attaches; stop ends it", async () => {
    const { root, trashDir } = scratch();
    const port = await freePort();
    cleanups.push(() => void stopServer(root, port, readToken(root)));
    const first = await launch(root, trashDir, port);
    expect(first.spawned).toBe(true);
    expect(first.record.port).toBe(port);
    const health = await probe(port, root);
    expect(health.kind).toBe("ours");
    const second = await launch(root, trashDir, port);
    expect(second.spawned).toBe(false);
    expect(second.record.pid).toBe(first.record.pid);
    expect(await stopServer(root, port, readToken(root))).toBe(true);
    expect((await probe(port, root)).kind).toBe("free");
  }, 30_000);
});

describe("P2 token rotation", () => {
  test("P2 a rotated token file is honoured by the running server", async () => {
    const { root, trashDir } = scratch();
    const port = await freePort();
    cleanups.push(() => void stopServer(root, port, readToken(root)));
    await launch(root, trashDir, port);
    const fresh = "f".repeat(48);
    await new Promise((r) => setTimeout(r, 20));
    writeFileSync(tokenPath(root), `${fresh}\n`);
    const res = await fetch(`http://127.0.0.1:${port}/api/artifacts`, {
      headers: { [SESSION_HEADER]: fresh },
    });
    expect(res.status).toBe(200);
    const again = await launch(root, trashDir, port);
    expect(again.spawned).toBe(false);
  }, 30_000);
});

describe("P3 a taken port is refused, never worked around", () => {
  test("P3 another program on the port → error names the port; nothing spawned", async () => {
    const { root, trashDir } = scratch();
    const port = await freePort();
    const sockets = new Set<import("node:net").Socket>();
    const squatter = createServer((socket) => {
      sockets.add(socket);
      socket.end("HTTP/1.1 200 OK\r\nconnection: close\r\ncontent-length: 2\r\n\r\nhi");
    });
    await new Promise<void>((r) => squatter.listen(port, "127.0.0.1", () => r()));
    cleanups.push(() => {
      for (const s of sockets) s.destroy();
      squatter.close();
    });
    await expect(launch(root, trashDir, port)).rejects.toThrow(new RegExp(`port ${port}`));
    expect(existsSync(join(root, ".server", "record.json"))).toBe(false);
  }, 30_000);
  test("P3 an artifact server for another root → error names that root", async () => {
    const a = scratch();
    const b = scratch();
    const port = await freePort();
    cleanups.push(() => void stopServer(a.root, port, readToken(a.root)));
    await launch(a.root, a.trashDir, port);
    await expect(launch(b.root, b.trashDir, port)).rejects.toThrow(a.root);
  }, 30_000);
});

describe("P4 one server for two sessions starting together", () => {
  test("P4 concurrent locates: exactly one spawn, both attach to the same pid", async () => {
    const { root, trashDir } = scratch();
    const port = await freePort();
    cleanups.push(() => void stopServer(root, port, readToken(root)));
    const [x, y] = await Promise.all([launch(root, trashDir, port), launch(root, trashDir, port)]);
    expect([x.spawned, y.spawned].filter(Boolean)).toHaveLength(1);
    expect(x.record.pid).toBe(y.record.pid);
  }, 30_000);
});

describe("P5 logs", () => {
  test("P5 server and session lines land under logs/<date>/ without the token", async () => {
    const { root, trashDir } = scratch();
    const port = await freePort();
    cleanups.push(() => void stopServer(root, port, readToken(root)));
    await launch(root, trashDir, port);
    const log = createLogger({
      root,
      name: "session-p5",
      base: { component: "session", session: "session-p5" },
    });
    log.info({ action: "publish", token: readToken(root), slug: "x" }, "published");
    // bun test pins this process to UTC while the spawned server keeps the host's
    // zone, so the two may name different days; each lands under logs/<date>/.
    const days = readdirSync(join(root, "logs")).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    const find = (name: string) =>
      days.map((d) => join(root, "logs", d, name)).find((p) => existsSync(p));
    expect(days).toContain(logDate(new Date()));
    const serverFile = find("server.jsonl");
    const sessionFile = find("session-p5.jsonl");
    expect(serverFile).toBeDefined();
    expect(sessionFile).toBeDefined();
    const serverLines = readFileSync(serverFile as string, "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(serverLines.some((l) => l.action === "start")).toBe(true);
    const sessionLine = readFileSync(sessionFile as string, "utf8");
    expect(sessionLine).toContain('"action":"publish"');
    expect(sessionLine).not.toContain(readToken(root) as string);
    expect(sessionLine).toContain("[redacted]");
  }, 30_000);
});
