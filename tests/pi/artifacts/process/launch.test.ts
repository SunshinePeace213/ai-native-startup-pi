// The server as a process, and the pi side as a Node program — the two
// runtime facts the in-process suite cannot prove.
//
// P1  locateServer with no record → spawns `bun serve.ts` detached; it writes
//     .server.json with its pid and the bound port, answers /api/health with
//     its root, and logs to .server.log; a second locate finds it instead of
//     spawning; stopServer ends it and the record is cleared
// P2  a stale record (a pid that no longer answers) → a fresh process is spawned
// P3  findBun prefers the configured path, then PATH, then ~/.bun/bin; none →
//     null, and locateServer names the fix
// P4  the pi side runs under Node: index, tool, host, client, launch, feedback,
//     schemas, config, opener, store, and types bundle for Node and, executed
//     by the `node` on this machine, publish to a running server, receive the
//     page's send over the event stream, and acknowledge it (skipped when no
//     `node` is installed)

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";

import { findBun, locateServer, stopServer } from "@ext/artifacts/launch";
import { HEADER } from "@ext/artifacts/server";
import { readServerRecord, readToken, writeServerRecord } from "@ext/artifacts/store";

import { islandScript, QUESTIONS_ISLAND, serve, stopAll } from "../fixture";

const SERVE = join(import.meta.dir, "../../../../.pi/extensions/artifacts/serve.ts");
const roots: string[] = [];

afterEach(async () => {
  await stopAll();
  for (const root of roots.splice(0)) await stopServer(root, 2000).catch(() => {});
});

const scratch = () => {
  const cwd = mkdtempSync(join(tmpdir(), "artifacts-proc-"));
  const root = join(cwd, ".pi/artifacts");
  roots.push(root);
  return { cwd, root, trashDir: mkdtempSync(join(tmpdir(), "artifacts-trash-")) };
};

describe("artifacts process", () => {
  test("P1 the server is spawned once, found afterwards, and stopped on request", async () => {
    const { cwd, root, trashDir } = scratch();
    const first = await locateServer({
      root,
      seed: cwd,
      port: -1,
      trashDir,
      bun: process.execPath,
      serveScript: SERVE,
    });
    expect(first.spawned).toBe(true);
    expect(first.record.root).toBe(root);
    expect(first.record.origin).toBe(`http://localhost:${first.record.port}`);
    expect(readServerRecord(root)?.pid).toBe(first.record.pid);
    const token = readToken(root) as string;
    const health = await fetch(`${first.record.origin}/api/health`, {
      headers: { [HEADER]: token },
    });
    expect(((await health.json()) as { root: string; pid: number }).pid).toBe(first.record.pid);
    expect(readFileSync(join(root, ".server.log"), "utf8")).toContain("listening on");

    const second = await locateServer({
      root,
      seed: cwd,
      port: -1,
      trashDir,
      bun: process.execPath,
      serveScript: SERVE,
    });
    expect(second.spawned).toBe(false);
    expect(second.record.pid).toBe(first.record.pid);

    expect(await stopServer(root)).toBe(true);
    expect(readServerRecord(root)).toBeNull();
    await expect(
      fetch(`${first.record.origin}/api/health`, { headers: { [HEADER]: token } }),
    ).rejects.toThrow();
  });

  test("P2 a stale record is replaced by a fresh process", async () => {
    const { cwd, root, trashDir } = scratch();
    const dead = serve({ root, seed: cwd, trashDir });
    const port = dead.server.port;
    dead.server.stop();
    writeServerRecord(root, {
      pid: 999_999,
      port,
      requestedPort: port,
      origin: `http://localhost:${port}`,
      root,
      startedAt: "2026-01-01T00:00:00Z",
    });
    const located = await locateServer({
      root,
      seed: cwd,
      port: -1,
      trashDir,
      bun: process.execPath,
      serveScript: SERVE,
    });
    expect(located.spawned).toBe(true);
    expect(located.record.pid).not.toBe(999_999);
  });

  test("P3 findBun resolves in order and names the fix when absent", async () => {
    const dir = mkdtempSync(join(tmpdir(), "artifacts-bun-"));
    const fakeBun = join(dir, "bun");
    writeFileSync(fakeBun, "#!/bin/sh\n");
    expect(findBun(fakeBun, { PATH: "" })).toBe(fakeBun);
    expect(findBun(undefined, { PATH: dir })).toBe(fakeBun);
    expect(findBun(undefined, { PATH: "", BUN_INSTALL: join(dir, "nothing") })).toBeNull();
    const real = findBun(undefined, { PATH: dirname(process.execPath) + delimiter + "" });
    expect(real).toBe(join(dirname(process.execPath), "bun"));
    const { cwd, root, trashDir } = scratch();
    await expect(
      locateServer({
        root,
        seed: cwd,
        port: -1,
        trashDir,
        bun: join(dir, "missing"),
        serveScript: SERVE,
        environment: { PATH: "", BUN_INSTALL: join(dir, "nothing") },
      }),
    ).rejects.toThrow(/not found on PATH/);
  });

  test("P4 the pi side runs under Node against the Bun server", async () => {
    const node = findNode();
    if (!node) {
      console.warn("P4 skipped: no `node` on this machine");
      return;
    }
    const { cwd, root, trashDir } = scratch();
    const backend = serve({ root, seed: cwd, trashDir });
    try {
      const out = mkdtempSync(join(tmpdir(), "artifacts-node-"));
      const entry = join(out, "entry.ts");
      writeFileSync(
        entry,
        `import { Host } from "${join(import.meta.dir, "../../../../.pi/extensions/artifacts/host.ts")}";
const [origin, token, root] = process.argv.slice(2);
const events = [];
const host = new Host({
  config: { port: 0, autoOpen: false, delivery: "wake", askTimeoutSeconds: 1, wakesPerHour: 60, keepAlive: true },
  session: "node-session",
  locate: async () => ({ origin, port: 0, requestedPort: 0, token }),
  send: (content, options) => events.push({ content, options }),
  notify: () => {},
  open: async () => null,
  stop: async () => true,
});
const result = await host.publish({ kind: "html", source: ${JSON.stringify(`<h1>From node</h1>${islandScript(QUESTIONS_ISLAND)}`)}, slug: "from-node" });
const send = await fetch(origin + "/a/from-node/publish", {
  method: "POST",
  headers: { "x-artifact-token": token, "content-type": "application/json", origin },
  body: JSON.stringify({ base_version: 1, data: ${JSON.stringify({ ...QUESTIONS_ISLAND, answers: { tiering: { selected: ["Seat-based"] } } })} }),
});
const deadline = Date.now() + 3000;
while (events.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));
await new Promise((r) => setTimeout(r, 50));
const list = await host.client.list();
await host.shutdown(false);
console.log(JSON.stringify({ runtime: typeof Bun === "undefined" ? "node" : "bun", version: process.version, created: result.created, sendStatus: send.status, events: events.length, options: events[0]?.options, pending: list[0]?.pending.length, owner: list[0]?.owner }));
`,
      );
      const built = await Bun.build({
        entrypoints: [entry],
        target: "node",
        outdir: out,
        naming: "entry.mjs",
      });
      expect(built.success).toBe(true);
      const proc = Bun.spawn(
        [node, join(out, "entry.mjs"), backend.server.origin, backend.token, root],
        {
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      await proc.exited;
      expect(stderr.trim()).toBe("");
      const report = JSON.parse(stdout.trim().split("\n").at(-1) as string) as Record<
        string,
        unknown
      >;
      expect(report.runtime).toBe("node");
      expect(report.created).toBe(true);
      expect(report.sendStatus).toBe(200);
      expect(report.events).toBe(1);
      expect(report.options).toEqual({ triggerTurn: true, deliverAs: "followUp" });
      expect(report.pending).toBe(0);
      expect(report.owner).toBe("node-session");
    } finally {
      backend.server.stop();
    }
  });
});

function findNode(): string | null {
  const candidates = (process.env.PATH ?? "").split(delimiter).map((d) => join(d, "node"));
  return candidates.find((c) => existsSync(c)) ?? null;
}
