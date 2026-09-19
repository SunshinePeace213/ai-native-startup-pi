// server — the HTTP surface of .pi/extensions/artifacts, driven as a browser
// and as a session would.
//
// Pages
// H1  GET the page with no token → 401; with ?t=<token> → 303 to the clean
//     path setting a persistent SameSite=Strict cookie; with the cookie → 200
//     HTML carrying the runtime under the Content-Security-Policy header
// H2  a foreign Host header → 421; an unknown slug → 404; an unknown route → 404
// H3  POST publish with the cookie but no header → 403; with the header and a
//     foreign Origin → 403 (a cross-site page cannot drive the session)
// H4  POST publish with a stale base_version → 409 naming the current version
//     and nothing stored; with the current one → 200 {version: n+1}, a new
//     version on disk and the island saved
// H5  POST publish whose answers name a label that is not an option → 400 with
//     the errors and nothing stored
// H6  a body over 2 MiB → 413; a non-JSON body → 400
// H7  GET events → after the session republishes, the stream carries
//     {type:"version", version}
// H8  GET data → the island; POST comments → 200 with the thread, then GET
//     comments lists it; empty text → 400
// H9  derivedPort is stable per seed and inside [41000, 42000)
// H10 the configured port is bound when free (URLs read http://localhost:<port>/a/<slug>);
//     when taken, any free port is bound instead and the publish result says so
// H11 GET / → redirects to /a/; GET /a/ with the token → the gallery naming every
//     artifact by title and path
//
// API
// H12 every /api route needs the header token: cookie or query → 401
// H13 POST /api/publish creates (owner recorded) and updates; a bad kind or a
//     malformed questions island → 400 with the reason; GET /api/artifacts and
//     /api/artifacts/<slug> read back manifest, island, and source
// H14 a page send reaches the owner's event stream when connected, else the
//     longest-connected session; it stays in /api/pending until /ack, and ack
//     transfers ownership
// H15 POST /api/stop answers {stopping:true} and then calls onStop

import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { derivedPort, startServer } from "@ext/artifacts/server/http";
import { COOKIE, HEADER, PREFIX } from "@ext/artifacts/shared/protocol";
import { Core } from "@ext/artifacts/server/core";
import { ensureToken } from "@ext/artifacts/shared/record";
import { Store } from "@ext/artifacts/server/store";
import type { PageEvent } from "@ext/artifacts/shared/types";

import { firstSseData, islandScript, QUESTIONS_ISLAND, stopAll, wire } from "../fixture";

afterEach(stopAll);

async function published(w: ReturnType<typeof wire>, island: unknown = QUESTIONS_ISLAND) {
  const path = w.file("q.html", `<h1>Questions</h1>${islandScript(island)}`);
  const { details } = await w.run({ file_path: path });
  return details?.slug as string;
}

const api = (w: ReturnType<typeof wire>, path: string, init: RequestInit = {}) =>
  fetch(`${w.origin()}/api${path}`, {
    ...init,
    headers: {
      [HEADER]: w.token(),
      "content-type": "application/json",
      ...(init.headers as Record<string, string>),
    },
  });

describe("artifacts server — pages", () => {
  test("H1 the token authorizes once, then the cookie does", async () => {
    const w = wire();
    const slug = await published(w);
    const bare = await fetch(`${w.origin()}/a/${slug}`, { redirect: "manual" });
    expect(bare.status).toBe(401);
    expect(await bare.text()).toContain("/artifacts");

    const withToken = await fetch(`${w.origin()}/a/${slug}?t=${w.token()}`, { redirect: "manual" });
    expect(withToken.status).toBe(303);
    expect(withToken.headers.get("location")).toBe(`/a/${slug}`);
    expect(withToken.headers.get("set-cookie")).toContain(`${COOKIE}=${w.token()}`);
    expect(withToken.headers.get("set-cookie")).toContain("SameSite=Strict");
    expect(withToken.headers.get("set-cookie")).toMatch(/Max-Age=\d{7,}/);

    const withCookie = await fetch(`${w.origin()}/a/${slug}`, {
      headers: { cookie: `${COOKIE}=${w.token()}` },
    });
    expect(withCookie.status).toBe(200);
    expect(withCookie.headers.get("content-type")).toContain("text/html");
    expect(withCookie.headers.get("content-security-policy")).toContain("connect-src 'self'");
    expect(withCookie.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    const html = await withCookie.text();
    expect(html).toContain('id="artifact-runtime"');
    expect(html).toContain('"endpoint":"/a/' + slug + '"');
    expect(w.origin()).toMatch(/^http:\/\/localhost:\d+$/);

    const wrongToken = await fetch(`${w.origin()}/a/${slug}?t=nope`, { redirect: "manual" });
    expect(wrongToken.status).toBe(401);
  });

  test("H2 foreign hosts, unknown slugs, and unknown routes are refused", async () => {
    const w = wire();
    const slug = await published(w);
    const foreign = await w.page(`/a/${slug}`, { headers: { host: "evil.example:80" } });
    expect(foreign.status).toBe(421);
    expect((await w.page("/a/no-such-thing")).status).toBe(404);
    expect((await w.page("/etc/passwd")).status).toBe(404);
    expect((await w.page(`/a/${slug}/bogus`)).status).toBe(404);
  });

  test("H3 a POST needs the header token and the page's own origin", async () => {
    const w = wire();
    const slug = await published(w);
    const body = JSON.stringify({ base_version: 1, data: QUESTIONS_ISLAND });
    const cookieOnly = await fetch(`${w.origin()}/a/${slug}/publish`, {
      method: "POST",
      headers: {
        cookie: `${COOKIE}=${w.token()}`,
        "content-type": "application/json",
        origin: w.origin(),
      },
      body,
    });
    expect(cookieOnly.status).toBe(403);
    const crossOrigin = await fetch(`${w.origin()}/a/${slug}/publish`, {
      method: "POST",
      headers: {
        [HEADER]: w.token(),
        "content-type": "application/json",
        origin: "http://evil.example",
      },
      body,
    });
    expect(crossOrigin.status).toBe(403);
    expect(w.backend.store.get(slug)?.current).toBe(1);
  });

  test("H4 a page publish is refused when stale and versioned when current", async () => {
    const w = wire();
    const slug = await published(w);
    const answered = { ...QUESTIONS_ISLAND, answers: { tiering: { selected: ["Seat-based"] } } };
    const stale = await w.pagePublish(slug, 0, answered);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ error: "stale", current: 1 });
    expect(w.backend.store.get(slug)?.current).toBe(1);

    const ok = await w.pagePublish(slug, 1, answered);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true, version: 2 });
    expect(w.backend.store.get(slug)?.current).toBe(2);
    expect(w.backend.store.get(slug)?.versions[1]?.by).toBe("page");
    expect(readdirSync(join(w.storeRoot, slug))).toContain("v2.html");
    expect(w.backend.store.readIsland(slug)).toEqual(answered);
    const v2 = await (await w.page(`/a/${slug}`)).text();
    expect(v2).toContain('"version":2');
  });

  test("H5 answers naming a non-option are refused with the reason", async () => {
    const w = wire();
    const slug = await published(w);
    const bad = await w.pagePublish(slug, 1, {
      ...QUESTIONS_ISLAND,
      answers: { tiering: { selected: ["Free"] } },
    });
    expect(bad.status).toBe(400);
    const body = (await bad.json()) as { error: string; errors: string[] };
    expect(body.errors.join(" ")).toContain("tiering");
    expect(body.errors.join(" ")).toContain("Free");
    expect(w.backend.store.get(slug)?.current).toBe(1);
  });

  test("H6 oversized and non-JSON bodies are refused", async () => {
    const w = wire();
    const slug = await published(w);
    const huge = await w.page(`/a/${slug}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ base_version: 1, data: { pad: "x".repeat(2 * 1024 * 1024) } }),
    });
    expect(huge.status).toBe(413);
    const notJson = await w.page(`/a/${slug}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{nope",
    });
    expect(notJson.status).toBe(400);
  });

  test("H7 the event stream announces a session republish", async () => {
    const w = wire();
    const path = w.file("p.html", "<h1>Plan</h1>");
    const { details } = await w.run({ file_path: path });
    const slug = details?.slug as string;
    const stream = await w.page(`/a/${slug}/events`);
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const waiting = firstSseData(stream);
    await w.run({ file_path: path, url: slug });
    const data = await waiting;
    expect(data && JSON.parse(data)).toEqual({ type: "version", version: 2, by: "agent" });
  });

  test("H8 data and comments round-trip through the page routes", async () => {
    const w = wire();
    const slug = await published(w);
    expect(await (await w.page(`/a/${slug}/data`)).json()).toEqual({ island: QUESTIONS_ISLAND });

    const posted = await w.pageComment(slug, {
      text: "Move the chart up",
      toAgent: false,
      anchor: "Summary",
    });
    expect(posted.status).toBe(200);
    const { thread } = (await posted.json()) as {
      thread: { id: string; anchor: string; toAgent: boolean };
    };
    expect(thread.anchor).toBe("Summary");
    expect(thread.toAgent).toBe(false);
    const listed = (await (await w.page(`/a/${slug}/comments`)).json()) as {
      threads: Array<{ id: string }>;
    };
    expect(listed.threads.map((t) => t.id)).toEqual([thread.id]);
    expect((await w.pageComment(slug, { text: "   " })).status).toBe(400);
  });

  test("H9 the derived port is stable and in range", () => {
    const a = derivedPort("/Users/x/project");
    expect(a).toBe(derivedPort("/Users/x/project"));
    expect(a).toBeGreaterThanOrEqual(41000);
    expect(a).toBeLessThan(42000);
    expect(derivedPort("/Users/x/other")).not.toBe(a);
  });

  test("H10 the configured port is used when free and skipped when taken", async () => {
    const holder = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("busy") });
    const taken = holder.port as number;
    try {
      const blocked = wire({ port: taken });
      const result = await blocked.run({ file_path: blocked.file("p.html", "<h1>Plan</h1>") });
      expect(blocked.backend.server.port).not.toBe(taken);
      expect(result.text).toContain(`Port ${taken} was taken`);
      expect(result.text).toContain(`http://localhost:${blocked.backend.server.port}/a/plan`);
    } finally {
      holder.stop(true);
    }
    const free = wire({ port: taken });
    const result = await free.run({ file_path: free.file("p.html", "<h1>Plan</h1>") });
    expect(free.backend.server.port).toBe(taken);
    expect(result.text).not.toContain("was taken");
    expect(result.text).toContain(`http://localhost:${taken}/a/plan?t=`);
  });

  test("H11 the root redirects to the gallery, which lists every artifact", async () => {
    const w = wire();
    await w.run({ file_path: w.file("a.html", "<h1>Welcome</h1>"), icon: "👋" });
    await w.run({ file_path: w.file("b.html", "<h1>Dress</h1>"), description: "Options" });
    const root = await fetch(`${w.origin()}/`, { redirect: "manual" });
    expect(root.status).toBe(303);
    expect(root.headers.get("location")).toBe("/a/");
    expect((await fetch(`${w.origin()}/a/`, { redirect: "manual" })).status).toBe(401);
    const gallery = await (await w.page("/a/")).text();
    expect(gallery).toContain('href="/a/welcome"');
    expect(gallery).toContain('href="/a/dress"');
    expect(gallery).toContain("👋 Welcome");
    expect(gallery).toContain("Options");
    expect(gallery.indexOf("/a/dress")).toBeLessThan(gallery.indexOf("/a/welcome"));
  });
});

describe("artifacts server — api", () => {
  test("H12 the api takes the header token only", async () => {
    const w = wire();
    await published(w);
    expect(
      (
        await fetch(`${w.origin()}/api/artifacts`, {
          headers: { cookie: `${COOKIE}=${w.token()}` },
        })
      ).status,
    ).toBe(401);
    expect((await fetch(`${w.origin()}/api/artifacts?t=${w.token()}`)).status).toBe(401);
    expect((await api(w, "/artifacts")).status).toBe(200);
    expect((await api(w, "/health")).status).toBe(200);
    const health = (await (await api(w, "/health")).json()) as {
      ok: boolean;
      root: string;
      port: number;
    };
    expect(health.ok).toBe(true);
    expect(health.root).toBe(w.storeRoot);
    expect(health.port).toBe(w.backend.server.port);
  });

  test("H13 publish creates and updates through the api; bad input is named", async () => {
    const w = wire();
    const created = await api(w, "/publish", {
      method: "POST",
      body: JSON.stringify({
        kind: "html",
        source: "<h1>Plan A</h1>",
        owner: "s1",
        description: "d",
      }),
    });
    expect(created.status).toBe(200);
    const body = (await created.json()) as {
      manifest: { slug: string; owner: string; current: number };
      created: boolean;
    };
    expect(body.created).toBe(true);
    expect(body.manifest.slug).toBe("plan-a");
    expect(body.manifest.owner).toBe("s1");

    const updated = await api(w, "/publish", {
      method: "POST",
      body: JSON.stringify({
        kind: "md",
        source: "# Plan A\n\ntext",
        update: "plan-a",
        note: "md now",
      }),
    });
    expect(((await updated.json()) as { version: number }).version).toBe(2);
    const read = (await (await api(w, "/artifacts/plan-a")).json()) as {
      manifest: { current: number; source: string };
      island: unknown;
      source: { kind: string; source: string };
    };
    expect(read.manifest.current).toBe(2);
    expect(read.source).toEqual({ kind: "md", source: "# Plan A\n\ntext" });
    expect(read.island).toBeNull();
    const all = (await (await api(w, "/artifacts")).json()) as {
      artifacts: Array<{ slug: string }>;
    };
    expect(all.artifacts.map((m) => m.slug)).toEqual(["plan-a"]);

    const badKind = await api(w, "/publish", {
      method: "POST",
      body: JSON.stringify({ kind: "txt", source: "" }),
    });
    expect(badKind.status).toBe(400);
    const badIsland = await api(w, "/publish", {
      method: "POST",
      body: JSON.stringify({
        kind: "html",
        source: "<h1>Q</h1>",
        island: { schema: "questions/v1", questions: [{ id: "a" }] },
      }),
    });
    expect(badIsland.status).toBe(400);
    expect(((await badIsland.json()) as { error: string }).error).toContain(
      "questions[0].question",
    );
    expect((await api(w, "/artifacts/none")).status).toBe(404);
  });

  test("H14 a page send goes to the owner, else the longest-connected session, and stays pending until acked", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifacts-api-"));
    const store = new Store(root);
    const core = new Core(store, PREFIX, mkdtempSync(join(tmpdir(), "artifacts-trash-")));
    const token = ensureToken(root);
    const server = startServer(core, { token, port: -1, seed: root });
    try {
      const h = { [HEADER]: token, "content-type": "application/json" };
      const call = (path: string, init: RequestInit = {}) =>
        fetch(`${server.origin}/api${path}`, { ...init, headers: h });
      await call("/publish", {
        method: "POST",
        body: JSON.stringify({
          kind: "html",
          source: `<h1>Q</h1>${islandScript(QUESTIONS_ISLAND)}`,
          slug: "q",
          owner: "owner",
        }),
      });
      const other = await call("/events?session=other");
      await new Promise((r) => setTimeout(r, 20));
      const owner = await call("/events?session=owner");
      await new Promise((r) => setTimeout(r, 20));
      expect(server.sessions()).toEqual(["other", "owner"]);

      const ownerData = firstSseData(owner, 1500);
      const otherData = firstSseData(other, 400);
      const send = { ...QUESTIONS_ISLAND, answers: { tiering: { selected: ["Seat-based"] } } };
      const sent = await fetch(`${server.origin}/a/q/publish`, {
        method: "POST",
        headers: { ...h, origin: server.origin },
        body: JSON.stringify({ base_version: 1, data: send }),
      });
      expect(sent.status).toBe(200);
      const event = JSON.parse((await ownerData) as string) as PageEvent;
      expect(event.slug).toBe("q");
      expect(event.version).toBe(2);
      expect(event.previousVersion).toBe(1);
      expect(event.validation?.ok).toBe(true);
      expect(event.island).toEqual(send);
      expect(await otherData).toBeNull();

      const pending = (await (await call("/pending")).json()) as { events: PageEvent[] };
      expect(pending.events.map((e) => e.pendingId)).toEqual([event.pendingId]);
      expect(pending.events[0]?.island).toEqual(send);

      // The owner's stream is gone; the next send goes to whoever is connected.
      const other2 = await call("/events?session=other2");
      await new Promise((r) => setTimeout(r, 20));
      const other2Data = firstSseData(other2, 1500);
      await fetch(`${server.origin}/a/q/publish`, {
        method: "POST",
        headers: { ...h, origin: server.origin },
        body: JSON.stringify({ base_version: 2, data: send }),
      });
      const second = JSON.parse((await other2Data) as string) as PageEvent;
      expect(second.version).toBe(3);

      const acked = await call("/artifacts/q/ack", {
        method: "POST",
        body: JSON.stringify({ ids: [event.pendingId, second.pendingId], owner: "other2" }),
      });
      expect(await acked.json()).toEqual({ acked: 2 });
      expect(((await (await call("/pending")).json()) as { events: unknown[] }).events).toEqual([]);
      expect(store.get("q")?.owner).toBe("other2");
    } finally {
      server.stop();
    }
  });

  test("H15 /api/stop answers, then the server's onStop runs", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifacts-api-"));
    const core = new Core(new Store(root), PREFIX, root);
    const token = ensureToken(root);
    let stopped = false;
    const server = startServer(core, {
      token,
      port: -1,
      seed: root,
      onStop: () => (stopped = true),
    });
    try {
      const res = await fetch(`${server.origin}/api/stop`, {
        method: "POST",
        headers: { [HEADER]: token },
        body: "{}",
      });
      expect(await res.json()).toEqual({ ok: true, stopping: true });
      await new Promise((r) => setTimeout(r, 60));
      expect(stopped).toBe(true);
    } finally {
      server.stop();
    }
  });
});
