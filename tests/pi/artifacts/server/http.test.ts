// Contract — the HTTP surface (src/infra/http) as the browser and the pi side see it
//
// H1: a page GET with ?t=<viewer> answers 303 to the clean URL and sets an HttpOnly,
//     SameSite=Strict cookie; the cookie alone then serves the page; no token → 401
// H2: a page POST is the page acting on itself: it needs the viewer cookie, its own
//     Origin, and x-artifact-page naming the slug; the session token in a header
//     buys a page nothing; a foreign Origin is refused
// H3: /api/health answers anyone with the root and a token digest, never the token;
//     every other /api route needs the session token header
// H4: a page reply leaves the version alone and numbers replies; a stale base is
//     409 with the current version; an island out of contract is 400 and stores nothing
// H5: a request whose Host is not this server is 421
// H6: a tab's stream opens with the current version, then hears "response" on a
//     reply and "version" on a republish
// H7: POST /api/sweep runs retention and reports what went

import { afterEach, describe, expect, test } from "bun:test";

import { PAGE_HEADER, SESSION_HEADER, VIEWER_COOKIE } from "@ext/artifacts/src/domain/protocol";

import { stopAll, wire } from "../fixture";

afterEach(stopAll);

const publish = async (w: ReturnType<typeof wire>, extra: Record<string, unknown> = {}) => {
  const res = await w.api("/publish", {
    method: "POST",
    body: JSON.stringify({ kind: "html", source: "<h1>Plan</h1>", ...extra }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { manifest: { slug: string }; version: number };
  return body;
};

describe("H1 the viewer capability", () => {
  test("H1 ?t sets an HttpOnly cookie and redirects; the cookie serves; nothing → 401", async () => {
    const w = wire();
    const { manifest } = await publish(w);
    const tokened = await fetch(`${w.origin()}/a/${manifest.slug}?t=${w.backend.viewer}`, {
      redirect: "manual",
    });
    expect(tokened.status).toBe(303);
    expect(tokened.headers.get("location")).toBe(`/a/${manifest.slug}`);
    const cookie = tokened.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${VIEWER_COOKIE}=${w.backend.viewer}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    const withCookie = await fetch(`${w.origin()}/a/${manifest.slug}`, {
      headers: { cookie: `${VIEWER_COOKIE}=${w.backend.viewer}` },
    });
    expect(withCookie.status).toBe(200);
    const html = await withCookie.text();
    expect(html).toContain("artifact-runtime");
    // The diagnostics probe precedes the page's own content, so verify sees early errors.
    expect(html.indexOf('id="artifact-probe"')).toBeLessThan(html.indexOf("<h1>Plan</h1>"));
    expect((await fetch(`${w.origin()}/a/${manifest.slug}`)).status).toBe(401);
  });
});

describe("H2 a page acts only on itself", () => {
  test("H2 cookie + own origin + page header → 200; each missing piece → 403", async () => {
    const w = wire();
    const { manifest } = await publish(w);
    const slug = manifest.slug;
    const body = JSON.stringify({ base_version: 1, data: { a: 1 } });
    const post = (headers: Record<string, string>) =>
      fetch(`${w.origin()}/a/${slug}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body,
      });
    const full = {
      cookie: `${VIEWER_COOKIE}=${w.backend.viewer}`,
      origin: w.origin(),
      [PAGE_HEADER]: slug,
    };
    expect((await post(full)).status).toBe(200);
    expect((await post({ ...full, cookie: "" })).status).toBe(403);
    expect((await post({ ...full, origin: "http://localhost:3000" })).status).toBe(403);
    expect((await post({ ...full, [PAGE_HEADER]: "other-page" })).status).toBe(403);
    // The session token is not a page capability.
    expect(
      (await post({ origin: w.origin(), [PAGE_HEADER]: slug, [SESSION_HEADER]: w.backend.token }))
        .status,
    ).toBe(403);
  });
});

describe("H3 the session capability", () => {
  test("H3 health is open and names the root, not the token; the rest is 401 without it", async () => {
    const w = wire();
    const health = await fetch(`${w.origin()}/api/health`);
    expect(health.status).toBe(200);
    const body = (await health.json()) as Record<string, unknown>;
    expect(body.root).toBe(w.storeRoot);
    expect(typeof body.tokenId).toBe("string");
    expect(JSON.stringify(body)).not.toContain(w.backend.token);
    expect((await fetch(`${w.origin()}/api/artifacts`)).status).toBe(401);
    expect(
      (
        await fetch(`${w.origin()}/api/artifacts`, {
          headers: { cookie: `${VIEWER_COOKIE}=${w.backend.viewer}` },
        })
      ).status,
    ).toBe(401);
    expect((await w.api("/artifacts")).status).toBe(200);
  });
});

describe("H4 replies", () => {
  test("H4 reply numbers climb, the version does not; stale → 409; bad island → 400", async () => {
    const w = wire();
    const island = {
      schema: "questions/v1",
      questions: [{ id: "q", question: "Q?", options: [{ label: "a" }] }],
      answers: {},
    };
    const { manifest } = await publish(w, { island });
    const slug = manifest.slug;
    const good = { ...island, answers: { q: { selected: ["a"] } } };
    const r1 = await w.pageRespond(slug, 1, good);
    expect(await r1.json()).toMatchObject({ ok: true, version: 1, response: 1 });
    const r2 = await w.pageRespond(slug, 1, good);
    expect(await r2.json()).toMatchObject({ version: 1, response: 2 });
    const stale = await w.pageRespond(slug, 0, good);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ current: 1 });
    const bad = await w.pageRespond(slug, 1, { ...island, answers: { q: { selected: ["zzz"] } } });
    expect(bad.status).toBe(400);
    const read = (await (await w.api(`/artifacts/${slug}`)).json()) as {
      manifest: { current: number; responses: unknown[] };
    };
    expect(read.manifest.current).toBe(1);
    expect(read.manifest.responses).toHaveLength(2);
  });
});

describe("H5 Host", () => {
  test("H5 a rebinding host is 421", async () => {
    const w = wire();
    const res = await fetch(`${w.origin()}/api/health`, { headers: { host: "evil.example:5834" } });
    expect(res.status).toBe(421);
  });
});

describe("H6 tabs hear the page change", () => {
  test("H6 hello carries the version; a reply broadcasts response; a republish broadcasts version", async () => {
    const w = wire();
    const { manifest } = await publish(w);
    const slug = manifest.slug;
    const stream = await w.page(`/a/${slug}/events`, slug);
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder();
    const readUntil = async (needle: string) => {
      let buffer = "";
      const deadline = Date.now() + 2000;
      while (!buffer.includes(needle) && Date.now() < deadline) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);
      }
      return buffer;
    };
    expect(await readUntil('"type":"hello"')).toContain('"version":1');
    await w.pageRespond(slug, 1, { a: 1 });
    expect(await readUntil('"type":"response"')).toContain('"response":1');
    await publish(w, { update: slug });
    expect(await readUntil('"type":"version"')).toContain('"version":2');
    await reader.cancel();
  });
});

describe("H7 sweep on demand", () => {
  test("H7 POST /api/sweep reports what it trashed", async () => {
    let t = Date.parse("2026-01-01T00:00:00.000Z");
    const w = wire({ now: () => new Date(t), retentionDays: 14 });
    const { manifest } = await publish(w);
    t += 30 * 24 * 3600 * 1000;
    const res = await w.api("/sweep", { method: "POST", body: "{}" });
    expect(await res.json()).toEqual({ artifacts: [manifest.slug], logs: [] });
    expect((await w.api(`/artifacts/${manifest.slug}`)).status).toBe(404);
  });
});
