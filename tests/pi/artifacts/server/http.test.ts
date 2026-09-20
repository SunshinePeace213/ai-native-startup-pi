// Contract — the HTTP surface (src/infra/http) as the browser and the pi side see it
//
// H1: a shell GET with ?t=<viewer> answers 303 to the clean URL and sets an HttpOnly,
//     SameSite=Strict cookie; the cookie alone then serves the viewer shell, which
//     frames the page from the page's own origin and never carries its source;
//     no token → 401
// H2: a shell POST needs the viewer cookie and the shell host's own Origin; a missing
//     cookie, a missing or foreign Origin, the session token, and the Origin of a
//     page's frame — another artifact's or the page's own — are all refused
// H3: /api/health answers anyone with the root and a token digest, never the token;
//     every other /api route needs the session token header
// H4: a page reply leaves the version alone and numbers replies; a stale base is
//     409 with the current version; an island out of contract is 400 and stores nothing
// H5: the Host decides: this port's localhost, 127.0.0.1 and <slug>.localhost are
//     served; any other name, a label that is no slug, or another port is 421
// H6: a tab's stream opens with the current version, then hears "response" once on
//     a reply, "version" on a republish, and "state" when a session comes or goes
// H7: POST /api/sweep runs retention and reports what went
// H8: a folder whose manifest the code cannot read never breaks the gallery or the
//     API list: both answer with the healthy pages, and the folder's own page is 404
// H9: a frame host serves its own artifact and nothing else: /_f/<cap>/<n>/ with the
//     slug's cap is version n's document, the cap is stable across versions and
//     differs between artifacts; a wrong cap, another artifact's cap, or a missing
//     version is 404; /a, /api and / are 404 there whatever the method; /_rt/claude.js
//     and /_rt/mermaid.js are JavaScript; the shell host does not serve /_f
// H10: a page's policy is an HTTP header equal to Claude Code's allowlist, with this
//      port's shell as the only frame ancestor, and it is sent with no-referrer; the
//      shell's own policy admits no inline script or style and frames only
//      *.localhost on this port
// H11: the title menu's routes: rename retitles, pin flips the flag, duplicate
//      answers the copy's slug, delete moves the folder to the trash; each is a shell
//      POST, and a bad title is refused with the reason
// H12: /a/<slug>/state is what the header draws (title, versions with labels, pin,
//      whether the owning session is connected); /a/<slug>/data is what a frame is
//      handed: a version's island with its newest reply over it, and the capabilities
//      it is served — `permissions` always, `reply` only with an island, and of what
//      that version declared only what this host runs, with its config; a capability
//      this host cannot serve, and one a later version declared, are not among them;
//      an unknown version is 404
// H13: under `sandbox` isolation the shell host serves the frame itself, found by
//      its cap: the shell's iframe drops allow-same-origin and its address is
//      relative, and the document's own policy sandboxes it
// H14: what the shell host writes from a manifest is text, never markup: a hostile
//      title, description or label adds no element to the viewer shell, its boot
//      block, or the gallery
// H15: a version's supporting files are served under its frame path,
//      /_f/<cap>/<n>/<published path>, byte for byte, with the media type they were
//      stored under (text with a utf-8 charset), never sniffed, and under the same
//      policy header as the document; an old version keeps serving its own files; a
//      path the version does not hold, a wrong cap, another artifact's host and the
//      shell host are 404; under `sandbox` isolation the shell host serves them by cap
// H16: /api/artifacts/<slug>/files lists the current version's supporting files;
//      ?path= answers one file's record, with its text only when it is a small text
//      file; an unknown path is 404; files that are not base64 refuse the publish
//      with 400 and publish nothing; like the rest of /api it needs the session token
// H17: POST /a/<slug>/self-publish is the page's `artifact` capability, made for it by
//      the shell: a complete document, doctype first, against the version the view runs
//      becomes the next version — its files and declaration carried — and every tab
//      hears `version`; a stale or unknown base is 409 `conflict` naming the `live`
//      version; an artifact that does not declare `artifact` is 403 `not_declared`; no
//      doctype, a malformed island or a malformed body is 400 `invalid_content`; a page
//      over the limit is 413 `too_large`; a refusal publishes nothing
// H18: the files form publishes the named files over the current ones and carries the
//      page: a string needs a text type, null or {delete} removes a path, and the path,
//      type and size rules refuse as `invalid_content` / `too_large`. One entry without
//      ifMatch keeps the whole-version check; with ifMatch on every entry a save from a
//      stale base still lands while each pin holds — `shas` are the stored hashes of
//      what it wrote, `changed` what other writers changed since its base — and a pin
//      that fails is 409 `conflict` with `paths` {path, expected, actual}, publishing
//      nothing
// H19: what the /artifacts panel reaches: GET /api/status answers the server's origin,
//      pid, port, root, start time, isolation and retention, the connected sessions
//      and the store's counts, and no secret; POST /api/artifacts/<slug>/rename
//      retitles a page for a session as the title menu does for the shell, and refuses
//      a missing, empty or oversized title with the reason; both need the session
//      token, and a slug that is not there is 404
// H20: POST /a/<slug>/db is the page's `db` capability, made for it by the shell: get,
//      query, set, update, delete and acquire answer {ok: true, …} with the document, the
//      documents, the version or the lease; a refusal is {code, message} — 400
//      invalid_argument for a path, body, query or op that breaks a rule, 413 for a body
//      over the route's limit, 403 revoked for an artifact that does not declare `db` —
//      and writes nothing
// H21: every open view of the artifact hears a write as one {type: "db", paths} naming
//      the documents it moved — the page's write, a granted lease that changed a body and
//      a session's write alike; a read, a refused write, a busy lease and a delete of
//      what is not there are not heard
// H22: POST /api/artifacts/<slug>/db is the same database for a session: the same ops,
//      plus str_replace and an all-or-nothing batch, any write pinned with ifVersion; a
//      pinned write against a document that moved is 409 `conflict` naming the `current`
//      version — and the `entry`, in a batch — and writes nothing; it needs the session
//      token, and a slug that is not there is 404
// H23: POST /a/<slug>/assets is the page's `assets` capability, made for it by the
//      shell: an upload answers {id, url, sizeBytes, contentType} with url "/_blob/<id>",
//      a listing answers every asset oldest first beside the usage against the
//      artifact's budget, a delete answers {deleted} and is idempotent; a refusal is
//      {code, message} — 400 invalid_request, 413 too_large, 415 unsupported_type, 403
//      not_granted for an artifact that does not declare `assets` — and stores nothing
// H24: an asset is served at /_blob/<id> on its artifact's frame host, whatever the
//      version and with no cap: byte for byte, under the type it was stored as (text
//      with a utf-8 charset), never sniffed or cached, under the page's policy — an SVG,
//      stored sanitised, under a policy that runs and loads nothing; an id nobody
//      minted, a deleted asset, another artifact's host and the shell host are 404, and
//      only GET is answered; under `sandbox` isolation the shell host serves it by id
// H25: POST /api/publish with `type` {name, paths} and a title makes an artifact of that
//      type; a later publish with no `kind` and no `source` carries its page, lays its
//      files over, and every tab hears `version`; bringing a page, or naming a type's
//      path — from a session, or from the page through self-publish — is 403 with
//      code `read_only_path` and publishes nothing; a `type` that is not {name, paths} is
//      400, and an artifact made from no type cannot publish without a page

import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { SESSION_HEADER, VIEWER_COOKIE } from "@ext/artifacts/src/domain/protocol";

import { sleep, stopAll, wire } from "../fixture";

afterEach(stopAll);

type Wired = ReturnType<typeof wire>;

const publish = async (w: Wired, extra: Record<string, unknown> = {}) => {
  const res = await w.api("/publish", {
    method: "POST",
    body: JSON.stringify({ kind: "html", source: "<h1>Plan</h1>", ...extra }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { manifest: { slug: string }; version: number };
  return body;
};

const port = (w: Wired) => w.backend.server.port;

/** Claude Code's page policy, written out: the header must equal it, not merely resemble it. */
const pagePolicy = (p: number) =>
  "default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://cdn.tailwindcss.com https://code.jquery.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; " +
  `frame-ancestors http://localhost:${p} http://127.0.0.1:${p}`;
const shellPolicy = (frames: string) =>
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; " +
  `frame-src ${frames}; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;

const iframeOf = (html: string) => /<iframe\b[^>]*>/.exec(html)?.[0] ?? "";
const attribute = (tag: string, name: string) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? null;

describe("H1 the viewer capability", () => {
  test("H1 ?t sets an HttpOnly cookie and redirects; the cookie serves the shell; nothing → 401", async () => {
    const w = wire();
    const { manifest } = await publish(w, { source: "<h1>Plan</h1><p>the page's own words</p>" });
    const tokened = await fetch(`${w.origin()}/a/${manifest.slug}?t=${w.backend.viewer}`, {
      redirect: "manual",
    });
    expect(tokened.status).toBe(303);
    expect(tokened.headers.get("location")).toBe(`/a/${manifest.slug}`);
    const cookie = tokened.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${VIEWER_COOKIE}=${w.backend.viewer}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    const withCookie = await w.shell(`/a/${manifest.slug}`);
    expect(withCookie.status).toBe(200);
    const html = await withCookie.text();
    const frame = iframeOf(html);
    expect(attribute(frame, "data-base")).toBe(
      `http://${manifest.slug}.localhost:${port(w)}/_f/${w.cap(manifest.slug)}/`,
    );
    expect(attribute(frame, "sandbox")?.split(" ").sort()).toEqual([
      "allow-forms",
      "allow-modals",
      "allow-popups",
      "allow-popups-to-escape-sandbox",
      "allow-same-origin",
      "allow-scripts",
    ]);
    expect(html).not.toContain("the page's own words");
    expect((await fetch(`${w.origin()}/a/${manifest.slug}`)).status).toBe(401);
  });
  test("H1 a pinned address serves the shell for that version; a version that never was is 404", async () => {
    const w = wire();
    const { manifest } = await publish(w);
    const pinned = await w.shell(`/a/${manifest.slug}/v/1`);
    expect(pinned.status).toBe(200);
    expect(await pinned.text()).toContain('"pinned":1');
    expect((await w.shell(`/a/${manifest.slug}/v/7`)).status).toBe(404);
  });
});

describe("H2 only the shell posts", () => {
  test("H2 cookie + the shell's Origin → 200; every other sender → 403", async () => {
    const w = wire();
    const { manifest } = await publish(w);
    const other = await publish(w, { title: "Other page" });
    const slug = manifest.slug;
    const body = JSON.stringify({ base_version: 1, data: { a: 1 } });
    const post = (headers: Record<string, string>, to = slug) =>
      fetch(`${w.origin()}/a/${to}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body,
      });
    const cookie = `${VIEWER_COOKIE}=${w.backend.viewer}`;
    expect((await post({ cookie, origin: w.origin() })).status).toBe(200);
    expect((await post({ cookie, origin: `http://127.0.0.1:${port(w)}` })).status).toBe(200);
    const refused: Array<[string, Record<string, string>]> = [
      ["no cookie", { origin: w.origin() }],
      ["no Origin", { cookie }],
      ["another localhost port", { cookie, origin: "http://localhost:3000" }],
      ["an opaque origin", { cookie, origin: "null" }],
      ["the page's own frame", { cookie, origin: `http://${slug}.localhost:${port(w)}` }],
      [
        "another artifact's frame",
        { cookie, origin: `http://${other.manifest.slug}.localhost:${port(w)}` },
      ],
      ["the session token", { origin: w.origin(), [SESSION_HEADER]: w.backend.token }],
    ];
    for (const [name, headers] of refused)
      expect([name, (await post(headers)).status]).toEqual([name, 403]);
    // Nothing the refused senders tried was stored.
    const read = (await (await w.api(`/artifacts/${slug}`)).json()) as {
      manifest: { responses: unknown[] };
    };
    expect(read.manifest.responses).toHaveLength(2);
  });
  test("H2 the same rule guards comments, diagnostics and the title menu", async () => {
    const w = wire();
    const { manifest } = await publish(w);
    const forged = (path: string) =>
      fetch(`${w.origin()}/a/${manifest.slug}/${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${VIEWER_COOKIE}=${w.backend.viewer}`,
          origin: `http://${manifest.slug}.localhost:${port(w)}`,
        },
        body: JSON.stringify({ text: "x", title: "x", rows: [] }),
      });
    for (const path of [
      "comments",
      "diagnostics",
      "self-publish",
      "db",
      "assets",
      "rename",
      "duplicate",
      "pin",
      "delete",
    ])
      expect([path, (await forged(path)).status]).toEqual([path, 403]);
    expect(existsSync(join(w.storeRoot, manifest.slug))).toBe(true);
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
  test.each([
    ["localhost", 200],
    ["127.0.0.1", 200],
    ["some-page.localhost", 404],
    ["evil.example", 421],
    ["localhost.evil.example", 421],
    ["Bad_Label.localhost", 421],
    ["-dash.localhost", 421],
    ["a.b.localhost", 421],
  ])("H5 Host %s → %d", async (name, status) => {
    const w = wire();
    const res = await fetch(`http://127.0.0.1:${port(w)}/api/health`, {
      headers: { host: `${name}:${port(w)}` },
    });
    expect(res.status).toBe(status);
  });
  test("H5 this server's name on another port is 421", async () => {
    const w = wire();
    const res = await fetch(`http://127.0.0.1:${port(w)}/api/health`, {
      headers: { host: `localhost:${port(w) + 1}` },
    });
    expect(res.status).toBe(421);
  });
});

describe("H6 tabs hear the page change", () => {
  test("H6 hello carries the version; one response per reply; version on republish; state on a session", async () => {
    const w = wire();
    const { manifest } = await publish(w);
    const slug = manifest.slug;
    const stream = await w.shell(`/a/${slug}/events`);
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
    const heard = await readUntil('"type":"response"');
    expect(heard).toContain('"response":1');
    await publish(w, { update: slug });
    const after = await readUntil('"type":"version"');
    expect(after).toContain('"version":2');
    // One reply is one message: a second copy would arrive before the version does.
    expect((heard + after).split('"type":"response"')).toHaveLength(2);
    await w.host.start();
    expect(await readUntil('"type":"state"')).toContain('"type":"state"');
    await reader.cancel();
  });
});

describe("H8 one unreadable folder never takes the gallery down", () => {
  test("H8 the gallery and the API list the healthy page beside a manifest missing fields", async () => {
    const w = wire();
    const { manifest } = await publish(w, { title: "Healthy page" });
    mkdirSync(join(w.storeRoot, "smoke", ".store"), { recursive: true });
    writeFileSync(
      join(w.storeRoot, "smoke", ".store", "manifest.json"),
      JSON.stringify({ slug: "smoke", title: "Old", owner: "agent", current: 3, versions: [] }),
    );
    const gallery = await w.shell("/a/");
    expect(gallery.status).toBe(200);
    const body = await gallery.text();
    expect(body).toContain("Healthy page");
    expect(body).not.toContain("/a/smoke");
    const listed = (await (await w.api("/artifacts")).json()) as { artifacts: { slug: string }[] };
    expect(listed.artifacts.map((a) => a.slug)).toEqual([manifest.slug]);
    expect((await w.shell("/a/smoke")).status).toBe(404);
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

describe("H9 a frame host reaches only its own artifact", () => {
  test("H9 the slug's cap opens each version's document; the cap is per artifact and outlives versions", async () => {
    const w = wire();
    const a = (await publish(w, { title: "Page A", source: "<p>words of A, v1</p>" })).manifest
      .slug;
    const b = (await publish(w, { title: "Page B", source: "<p>words of B</p>" })).manifest.slug;
    await publish(w, { update: a, source: "<p>words of A, v2</p>" });
    expect(w.cap(a)).not.toBe(w.cap(b));
    const v1 = await w.frame(a, `/_f/${w.cap(a)}/1/`);
    expect(v1.status).toBe(200);
    expect(v1.headers.get("content-type")).toContain("text/html");
    expect(await v1.text()).toContain("words of A, v1");
    expect(await w.document(a, 2)).toContain("words of A, v2");
  });
  test("H9 a wrong cap, another artifact's cap, a missing version, a cookie: all 404", async () => {
    const w = wire();
    const a = (await publish(w, { title: "Page A" })).manifest.slug;
    const b = (await publish(w, { title: "Page B" })).manifest.slug;
    const cookie = { cookie: `${VIEWER_COOKIE}=${w.backend.viewer}` };
    const tries: Array<[string, Promise<Response>]> = [
      ["a wrong cap", w.frame(a, `/_f/${"0".repeat(32)}/1/`)],
      ["B's cap on A's host", w.frame(a, `/_f/${w.cap(b)}/1/`)],
      ["A's cap on B's host", w.frame(b, `/_f/${w.cap(a)}/1/`)],
      ["a version that never was", w.frame(a, `/_f/${w.cap(a)}/9/`)],
      ["no cap, the viewer cookie instead", w.frame(a, `/_f/1/`, { headers: cookie })],
      ["a slug that is no artifact", w.frame("ghost", `/_f/${w.cap("ghost")}/1/`)],
    ];
    for (const [name, attempt] of tries)
      expect([name, (await attempt).status]).toEqual([name, 404]);
  });
  test("H9 the shell's routes do not exist on a frame host, and frames do not exist on the shell host", async () => {
    const w = wire();
    const slug = (await publish(w)).manifest.slug;
    const session = { [SESSION_HEADER]: w.backend.token };
    const cookie = { cookie: `${VIEWER_COOKIE}=${w.backend.viewer}`, origin: w.origin() };
    const tries: Array<[string, Promise<Response>]> = [
      ["/", w.frame(slug, "/")],
      ["the gallery", w.frame(slug, "/a/", { headers: cookie })],
      ["its own shell page", w.frame(slug, `/a/${slug}`, { headers: cookie })],
      ["its island", w.frame(slug, `/a/${slug}/data`, { headers: cookie })],
      ["health", w.frame(slug, "/api/health")],
      ["the api, with the token", w.frame(slug, "/api/artifacts", { headers: session })],
      [
        "a reply",
        w.frame(slug, `/a/${slug}/publish`, {
          method: "POST",
          headers: { ...cookie, "content-type": "application/json" },
          body: JSON.stringify({ base_version: 1, data: {} }),
        }),
      ],
      ["stop", w.frame(slug, "/api/stop", { method: "POST", headers: session })],
      ["a frame on the shell host", w.shell(`/_f/${w.cap(slug)}/1/`)],
    ];
    for (const [name, attempt] of tries)
      expect([name, (await attempt).status]).toEqual([name, 404]);
    expect((await fetch(`${w.origin()}/api/health`)).status).toBe(200);
  });
  test("H9 the runtime and mermaid are served as JavaScript", async () => {
    const w = wire();
    const slug = (await publish(w)).manifest.slug;
    for (const path of ["/_rt/claude.js", "/_rt/mermaid.js"]) {
      const res = await w.frame(slug, path);
      expect([path, res.status]).toEqual([path, 200]);
      expect(res.headers.get("content-type")).toContain("javascript");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    }
    expect((await w.frame(slug, "/_rt/secrets.js")).status).toBe(404);
  });
});

describe("H10 the policies", () => {
  test("H10 a page's policy is Claude Code's allowlist, as a header; the shell's admits nothing inline", async () => {
    const w = wire();
    const slug = (await publish(w)).manifest.slug;
    const page = await w.frame(slug, `/_f/${w.cap(slug)}/1/`);
    expect(page.headers.get("content-security-policy")).toBe(pagePolicy(port(w)));
    expect(page.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await page.text()).not.toMatch(/http-equiv/i);
    for (const path of [`/a/${slug}`, "/a/"]) {
      const shell = await w.shell(path);
      expect(shell.headers.get("content-security-policy")).toBe(
        shellPolicy(`http://*.localhost:${port(w)}`),
      );
      // The policy would block them, so the markup must not rely on either.
      const html = await shell.text();
      expect(html).not.toMatch(/<style\b|\sstyle="/);
      expect(
        html.match(/<script\b[^>]*>/g)?.every((tag) => /\bsrc=|application\/json/.test(tag)),
      ).toBe(true);
    }
  });
});

describe("H11 the title menu", () => {
  test("H11 rename, pin, duplicate and delete are shell POSTs", async () => {
    const w = wire();
    const slug = (await publish(w, { title: "First name", island: { a: 1 } })).manifest.slug;
    const renamed = await w.shellPost(`/a/${slug}/rename`, { title: "  A better   name " });
    expect(await renamed.json()).toMatchObject({ state: { title: "A better name" } });
    expect(
      (
        (await (await w.shellPost(`/a/${slug}/pin`, { pinned: true })).json()) as {
          state: { pinned: boolean };
        }
      ).state.pinned,
    ).toBe(true);
    expect(
      (
        (await (await w.shellPost(`/a/${slug}/pin`, { pinned: false })).json()) as {
          state: { pinned: boolean };
        }
      ).state.pinned,
    ).toBe(false);
    const copy = (await (await w.shellPost(`/a/${slug}/duplicate`)).json()) as { slug: string };
    expect(copy.slug).not.toBe(slug);
    expect((await w.shell(`/a/${copy.slug}`)).status).toBe(200);
    expect((await w.shellPost(`/a/${slug}/delete`)).status).toBe(200);
    expect(existsSync(join(w.storeRoot, slug))).toBe(false);
    expect(existsSync(join(w.trashDir, "pi-artifacts"))).toBe(true);
    expect((await w.shell(`/a/${slug}`)).status).toBe(404);
    expect((await w.shell(`/a/${copy.slug}`)).status).toBe(200);
  });
  test("H11 an empty or oversized title is refused and changes nothing", async () => {
    const w = wire();
    const slug = (await publish(w, { title: "Kept name" })).manifest.slug;
    for (const title of ["   ", "x".repeat(201)]) {
      const res = await w.shellPost(`/a/${slug}/rename`, { title });
      expect(res.status).toBe(400);
      expect(typeof ((await res.json()) as { error: unknown }).error).toBe("string");
    }
    expect((await w.shellPost(`/a/${slug}/rename`, {})).status).toBe(400);
    expect(await (await w.shell(`/a/${slug}/state`)).json()).toMatchObject({ title: "Kept name" });
  });
});

describe("H12 what the shell reads", () => {
  test("H12 state is the header's facts; the owner's connection shows and clears", async () => {
    const w = wire();
    const slug = (await publish(w, { title: "Stateful", icon: "chart", label: "first cut" }))
      .manifest.slug;
    await publish(w, { update: slug });
    const state = async () =>
      (await (await w.shell(`/a/${slug}/state`)).json()) as Record<string, unknown>;
    expect(await state()).toMatchObject({
      slug,
      title: "Stateful",
      icon: "chart",
      current: 2,
      pinned: false,
      connected: false,
      versions: [{ n: 1, label: "first cut" }, { n: 2 }],
    });
    await w.host.start();
    await sleep(50);
    expect((await state()).connected).toBe(true);
    await w.host.shutdown(false);
    expect((await state()).connected).toBe(false);
    expect((await fetch(`${w.origin()}/a/${slug}/state`)).status).toBe(401);
  });
  test("H12 data is a version's island with its newest reply over it; reply is served only with an island", async () => {
    const w = wire();
    const slug = (await publish(w, { island: { topic: "v1", a: 1 } })).manifest.slug;
    await w.pageRespond(slug, 1, { a: 2, b: 3 });
    await publish(w, { update: slug, island: { topic: "v2" } });
    const data = async (query = "") => (await w.shell(`/a/${slug}/data${query}`)).json();
    expect(await data("?v=1")).toEqual({
      version: 1,
      island: { topic: "v1", a: 2, b: 3 },
      caps: { permissions: {}, reply: {} },
    });
    expect(await data()).toEqual({
      version: 2,
      island: { topic: "v2" },
      caps: { permissions: {}, reply: {} },
    });
    expect((await w.shell(`/a/${slug}/data?v=5`)).status).toBe(404);
    const bare = (await publish(w, { title: "No island" })).manifest.slug;
    expect(await (await w.shell(`/a/${bare}/data`)).json()).toEqual({
      version: 1,
      island: null,
      caps: { permissions: {} },
    });
  });
  test("H12 a page is served what its version declared that this host runs, never the rest", async () => {
    const w = wire();
    const slug = (
      await publish(w, {
        capabilities: { comments: { composer_only: true }, mcp: { servers: ["x"] }, user: {} },
      })
    ).manifest.slug;
    await publish(w, { update: slug, capabilities: { artifact: {}, downloads: {} } });
    const caps = async (query: string) =>
      ((await (await w.shell(`/a/${slug}/data${query}`)).json()) as { caps: unknown }).caps;
    expect(await caps("?v=1")).toEqual({ permissions: {}, comments: { composer_only: true } });
    expect(await caps("")).toEqual({ permissions: {}, artifact: {}, downloads: {} });
    const refused = await w.api("/publish", {
      method: "POST",
      body: JSON.stringify({ kind: "html", source: "<p>x</p>", capabilities: { telepathy: {} } }),
    });
    expect(refused.status).toBe(400);
    expect(((await refused.json()) as { error: string }).error).toContain("telepathy");
  });
});

describe("H13 sandbox isolation", () => {
  test("H13 the shell host serves the frame by its cap, sandboxed out of the shell's origin", async () => {
    const w = wire({ isolation: "sandbox" });
    const a = (await publish(w, { title: "Page A", source: "<p>words of A</p>" })).manifest.slug;
    const b = (await publish(w, { title: "Page B", source: "<p>words of B</p>" })).manifest.slug;
    const shell = await w.shell(`/a/${a}`);
    const frame = iframeOf(await shell.text());
    expect(attribute(frame, "data-base")).toBe(`/_f/${w.cap(a)}/`);
    expect(attribute(frame, "sandbox")?.split(" ")).not.toContain("allow-same-origin");
    expect(attribute(frame, "sandbox")?.split(" ")).toContain("allow-scripts");
    expect(shell.headers.get("content-security-policy")).toBe(shellPolicy("'self'"));
    const page = await fetch(`${w.origin()}/_f/${w.cap(a)}/1/`);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("words of A");
    const policy = page.headers.get("content-security-policy") ?? "";
    expect(policy.startsWith(`${pagePolicy(port(w))}; sandbox `)).toBe(true);
    expect(policy).not.toContain("allow-same-origin");
    expect(await (await fetch(`${w.origin()}/_f/${w.cap(b)}/1/`)).text()).toContain("words of B");
    expect((await fetch(`${w.origin()}/_f/${"0".repeat(32)}/1/`)).status).toBe(404);
    expect((await fetch(`${w.origin()}/_rt/claude.js`)).status).toBe(200);
  });
});

describe("H14 a manifest is text to the shell", () => {
  test("H14 a hostile title, description and label add no markup to the shell or the gallery", async () => {
    const w = wire();
    const hostile = '</script><script>alert(1)</script><img src=x onerror=alert(2)>"';
    await publish(w, {
      title: hostile,
      description: hostile,
      label: '"><img src=y>',
      slug: "hostile",
    });
    await publish(w, { title: "Plain page", slug: "plain" });
    const count = (html: string, tag: string) => html.split(`<${tag}`).length - 1;
    const shell = await (await w.shell("/a/hostile")).text();
    const reference = await (await w.shell("/a/plain")).text();
    for (const tag of ["script", "img", "iframe"])
      expect([tag, count(shell, tag)]).toEqual([tag, count(reference, tag)]);
    // The boot block still carries the title, as data.
    const boot = /<script type="application\/json" id="viewer-boot">([^<]*)<\/script>/.exec(shell);
    expect((JSON.parse(boot?.[1] ?? "{}") as { state: { title: string } }).state.title).toBe(
      hostile,
    );
    const gallery = await (await w.shell("/a/")).text();
    expect(gallery).toContain("Plain page");
    expect([count(gallery, "img"), count(gallery, "script")]).toEqual([0, 1]);
  });
});

/** A supporting file as the wire carries it. */
const upload = (content: string | Uint8Array, contentType?: string) => ({
  base64: Buffer.from(content).toString("base64"),
  contentType,
});
/** A one-pixel GIF: bytes no text decoder would round-trip. */
const GIF = new Uint8Array(
  Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
);

describe("H15 a version's files are served under its frame path", () => {
  test("H15 each file comes back byte for byte, typed as stored, unsniffed, under the page's policy", async () => {
    const w = wire();
    const slug = (
      await publish(w, {
        files: {
          "style.css": upload("body{color:red}"),
          "img/dot.gif": upload(GIF),
          "data/q3 rows.csv": upload("a,b\n1,2\n", "text/csv"),
        },
      })
    ).manifest.slug;
    const base = `/_f/${w.cap(slug)}/1/`;
    const css = await w.frame(slug, `${base}style.css`);
    expect(css.status).toBe(200);
    expect(css.headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect(css.headers.get("x-content-type-options")).toBe("nosniff");
    expect(css.headers.get("referrer-policy")).toBe("no-referrer");
    expect(css.headers.get("content-security-policy")).toBe(pagePolicy(port(w)));
    expect(await css.text()).toBe("body{color:red}");
    const gif = await w.frame(slug, `${base}img/dot.gif`);
    expect(gif.headers.get("content-type")).toBe("image/gif");
    expect(new Uint8Array(await gif.arrayBuffer())).toEqual(GIF);
    const csv = await w.frame(slug, `${base}data/q3%20rows.csv?cache=1`);
    expect(csv.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(await csv.text()).toBe("a,b\n1,2\n");
  });
  test("H15 an old version keeps its own files; what a version does not hold is 404", async () => {
    const w = wire();
    const a = (await publish(w, { title: "Page A", files: { "a.css": upload("v1") } })).manifest
      .slug;
    const b = (await publish(w, { title: "Page B" })).manifest.slug;
    await publish(w, { update: a, files: { "a.css": null, "b.css": upload("v2") } });
    const served = async (host: string, path: string) => {
      const res = await w.frame(host, path);
      return res.status === 200 ? await res.text() : res.status;
    };
    expect(await served(a, `/_f/${w.cap(a)}/1/a.css`)).toBe("v1");
    expect(await served(a, `/_f/${w.cap(a)}/2/b.css`)).toBe("v2");
    const tries: Array<[string, Promise<Response>]> = [
      ["a path removed in v2", w.frame(a, `/_f/${w.cap(a)}/2/a.css`)],
      ["a path v1 never had", w.frame(a, `/_f/${w.cap(a)}/1/b.css`)],
      ["a path nobody published", w.frame(a, `/_f/${w.cap(a)}/2/ghost.css`)],
      ["an escape that does not decode", w.frame(a, `/_f/${w.cap(a)}/2/%E0%A4%A.css`)],
      ["a version that never was", w.frame(a, `/_f/${w.cap(a)}/9/b.css`)],
      ["a wrong cap", w.frame(a, `/_f/${"0".repeat(32)}/2/b.css`)],
      ["another artifact's host", w.frame(b, `/_f/${w.cap(a)}/2/b.css`)],
      ["the shell host", w.shell(`/_f/${w.cap(a)}/2/b.css`)],
    ];
    for (const [name, attempt] of tries)
      expect([name, (await attempt).status]).toEqual([name, 404]);
    expect((await w.frame(a, `/_f/${w.cap(a)}/2/b.css`, { method: "POST" })).status).toBe(405);
  });
  test("H15 under sandbox isolation the shell host serves a file by its cap, sandboxed", async () => {
    const w = wire({ isolation: "sandbox" });
    const slug = (await publish(w, { files: { "app.js": upload("window.ok = 1;") } })).manifest
      .slug;
    const res = await fetch(`${w.origin()}/_f/${w.cap(slug)}/1/app.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/javascript; charset=utf-8");
    expect(res.headers.get("content-security-policy")).toContain("; sandbox ");
    expect(await res.text()).toBe("window.ok = 1;");
  });
});

describe("H16 a session reads an artifact's files", () => {
  test("H16 the listing is the current version's map; a small text file comes back with its text", async () => {
    const w = wire();
    const slug = (
      await publish(w, {
        files: { "notes.md": upload("# v1"), "dot.gif": upload(GIF), "old.txt": upload("old") },
      })
    ).manifest.slug;
    await publish(w, {
      update: slug,
      files: {
        "notes.md": upload("# v2"),
        "old.txt": null,
        "big.json": upload("x".repeat(70_000)),
      },
    });
    const listing = (await (await w.api(`/artifacts/${slug}/files`)).json()) as {
      version: number;
      files: Record<string, { contentType: string; bytes: number; sha256: string }>;
    };
    expect(listing.version).toBe(2);
    expect(Object.keys(listing.files).sort()).toEqual(["big.json", "dot.gif", "notes.md"]);
    expect(listing.files["dot.gif"]).toMatchObject({
      contentType: "image/gif",
      bytes: GIF.byteLength,
    });
    const read = async (path: string) =>
      (await w.api(`/artifacts/${slug}/files?path=${encodeURIComponent(path)}`)).json();
    expect(await read("notes.md")).toMatchObject({
      version: 2,
      path: "notes.md",
      contentType: "text/markdown",
      bytes: 4,
      text: "# v2",
    });
    expect(await read("dot.gif")).toMatchObject({ contentType: "image/gif", text: null });
    expect(await read("big.json")).toMatchObject({ bytes: 70_000, text: null });
    expect((await w.api(`/artifacts/${slug}/files?path=old.txt`)).status).toBe(404);
    expect((await fetch(`${w.origin()}/api/artifacts/${slug}/files`)).status).toBe(401);
  });
  test.each([
    ["not base64", { "a.css": { base64: "not base64!" } }],
    ["a bare string", { "a.css": "body{}" }],
    ["a list", [{ path: "a.css" }]],
  ])("H16 files that are %s refuse the publish and publish nothing", async (_name, files) => {
    const w = wire();
    const res = await w.api("/publish", {
      method: "POST",
      body: JSON.stringify({ kind: "html", source: "<h1>Plan</h1>", files }),
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toContain("files");
    expect(await (await w.api("/artifacts")).json()).toEqual({ artifacts: [] });
  });
});

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const DOCUMENT = (words: string) =>
  `<!doctype html><html><head><title>Self Made</title></head><body><p>${words}</p></body></html>`;

/** An artifact that declares `artifact`, with one supporting file, as a session publishes it. */
const selfPublishing = async (w: Wired, extra: Record<string, unknown> = {}) =>
  (
    await publish(w, {
      source: DOCUMENT("the agent's words"),
      capabilities: { artifact: {}, downloads: {} },
      files: { "data/doc.json": upload('{"rev":1}') },
      ...extra,
    })
  ).manifest.slug;

/** What the route answers: a result, or a refusal by code. */
type Published = { code?: string; live?: string; paths?: unknown; changed?: unknown };
const selfPublish = async (w: Wired, slug: string, body: Record<string, unknown>) => {
  const res = await w.shellPost(`/a/${slug}/self-publish`, body);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> & Published };
};
const currentOf = async (w: Wired, slug: string) =>
  (
    (await (await w.api(`/artifacts/${slug}`)).json()) as {
      manifest: { current: number; capabilities?: unknown; versions: Array<{ by: string }> };
    }
  ).manifest;

describe("H17 a page publishes itself", () => {
  test("H17 a whole document against the current version is the next version; tabs hear it", async () => {
    const w = wire();
    const slug = await selfPublishing(w);
    const stream = await w.shell(`/a/${slug}/events`);
    const reader = stream.body!.getReader();
    const out = await selfPublish(w, slug, {
      base_version: 1,
      html: DOCUMENT("the viewer's words"),
    });
    expect(out).toEqual({ status: 200, body: { ok: true, version: "2" } });
    expect(await w.document(slug, 2)).toContain("the viewer's words");
    expect(await w.document(slug, 2)).toContain("/_rt/claude.js");
    expect(await w.document(slug, 1)).toContain("the agent's words");
    // The page is replaced; what stood beside it is carried.
    const file = await w.frame(slug, `/_f/${w.cap(slug)}/2/data/doc.json`);
    expect(await file.text()).toBe('{"rev":1}');
    const manifest = await currentOf(w, slug);
    expect(manifest).toMatchObject({ current: 2, capabilities: { artifact: {}, downloads: {} } });
    let heard = "";
    const deadline = Date.now() + 2000;
    while (!heard.includes('"type":"version"') && Date.now() < deadline)
      heard += new TextDecoder().decode((await reader.read()).value);
    expect(heard).toContain('"version":2');
    await reader.cancel();
  });
  test("H17 a stale or unknown base is a conflict naming the live version, and publishes nothing", async () => {
    const w = wire();
    const slug = await selfPublishing(w);
    await publish(w, { update: slug, source: DOCUMENT("v2, the agent's") });
    for (const base of [1, 0, 7]) {
      const out = await selfPublish(w, slug, { base_version: base, html: DOCUMENT("late") });
      expect([base, out.status, out.body.code, out.body.live]).toEqual([
        base,
        409,
        "conflict",
        "2",
      ]);
    }
    expect((await currentOf(w, slug)).current).toBe(2);
  });
  test.each([
    ["a fragment with no doctype", { html: "<p>just a fragment</p>" }, 400, "invalid_content"],
    [
      "an island that is not JSON",
      {
        html: `${DOCUMENT("x")}<script type="application/json" id="artifact-data">{oops</script>`,
      },
      400,
      "invalid_content",
    ],
    ["html that is no string", { html: { not: "a string" } }, 400, "invalid_content"],
    ["neither html nor files", {}, 400, "invalid_content"],
    ["both html and files", { html: DOCUMENT("x"), files: {} }, 400, "invalid_content"],
    ["a page over 16 MiB", { html: DOCUMENT("x".repeat(16 * 1024 * 1024)) }, 413, "too_large"],
  ])("H17 %s is refused by code and publishes nothing", async (_name, body, status, code) => {
    const w = wire();
    const slug = await selfPublishing(w);
    const out = await selfPublish(w, slug, { base_version: 1, ...body });
    expect([out.status, out.body.code]).toEqual([status, code]);
    expect((await currentOf(w, slug)).current).toBe(1);
  });
  test("H17 without the artifact capability the publish is not_declared, even after a republish drops it", async () => {
    const w = wire();
    const plain = (await publish(w, { title: "Plain", source: DOCUMENT("plain") })).manifest.slug;
    const out = await selfPublish(w, plain, { base_version: 1, html: DOCUMENT("mine now") });
    expect([out.status, out.body.code]).toEqual([403, "not_declared"]);
    const slug = await selfPublishing(w);
    await publish(w, { update: slug, source: DOCUMENT("v2"), capabilities: { downloads: {} } });
    const late = await selfPublish(w, slug, { base_version: 2, html: DOCUMENT("late") });
    expect([late.status, late.body.code]).toEqual([403, "not_declared"]);
    expect((await currentOf(w, slug)).current).toBe(2);
  });
});

describe("H18 a page publishes just its files", () => {
  const fileAt = async (w: Wired, slug: string, version: number, path: string) => {
    const res = await w.frame(slug, `/_f/${w.cap(slug)}/${version}/${path}`);
    return res.status === 200 ? res.text() : res.status;
  };

  test("H18 the named files change, the page and every other file are carried", async () => {
    const w = wire();
    const slug = await selfPublishing(w, {
      files: {
        "data/doc.json": upload('{"rev":1}'),
        "old.txt": upload("old"),
        "keep.txt": upload("k"),
      },
    });
    const out = await selfPublish(w, slug, {
      base_version: 1,
      files: {
        "data/doc.json": { text: '{"rev":2}' },
        "img/dot.gif": { base64: Buffer.from(GIF).toString("base64") },
        "rows.data": { text: "a,b", contentType: "text/csv" },
        "old.txt": null,
      },
    });
    expect(out).toEqual({ status: 200, body: { ok: true, version: "2" } });
    expect(await w.document(slug, 2)).toBe(await w.document(slug, 1));
    expect(await fileAt(w, slug, 2, "data/doc.json")).toBe('{"rev":2}');
    expect(await fileAt(w, slug, 2, "rows.data")).toBe("a,b");
    expect(await fileAt(w, slug, 2, "keep.txt")).toBe("k");
    expect(await fileAt(w, slug, 2, "old.txt")).toBe(404);
    expect(await fileAt(w, slug, 1, "old.txt")).toBe("old");
    const gif = await w.frame(slug, `/_f/${w.cap(slug)}/2/img/dot.gif`);
    expect(new Uint8Array(await gif.arrayBuffer())).toEqual(GIF);
    // The next save builds on the version this one made.
    const next = await selfPublish(w, slug, {
      base_version: 2,
      files: { "keep.txt": { delete: true } },
    });
    expect(next.body).toEqual({ ok: true, version: "3" });
    expect(await fileAt(w, slug, 3, "keep.txt")).toBe(404);
  });
  test.each([
    ["no file at all", {}, 400, "invalid_content"],
    ["a path that climbs out", { "../x.json": { text: "{}" } }, 400, "invalid_content"],
    ["the page's own name", { "index.html": { text: "<p>x</p>" } }, 400, "invalid_content"],
    ["an extension with no stated type", { "rows.csv": { text: "a,b" } }, 400, "invalid_content"],
    [
      "a string under a type that is not text",
      { "dot.gif": { text: "GIF89a" } },
      400,
      "invalid_content",
    ],
    ["bytes that are not base64", { "dot.gif": { base64: "!!" } }, 400, "invalid_content"],
    ["an ifMatch that is no hash", { "a.txt": { text: "a", ifMatch: 7 } }, 400, "invalid_content"],
    [
      "a binary file over 15 MiB",
      { "big.png": { base64: Buffer.alloc(15 * 1024 * 1024 + 1).toString("base64") } },
      413,
      "too_large",
    ],
  ])("H18 %s is refused by code and publishes nothing", async (_name, files, status, code) => {
    const w = wire();
    const slug = await selfPublishing(w);
    const out = await selfPublish(w, slug, { base_version: 1, files });
    expect([out.status, out.body.code]).toEqual([status, code]);
    expect((await currentOf(w, slug)).current).toBe(1);
  });
  test("H18 one entry without ifMatch keeps the whole-version check", async () => {
    const w = wire();
    const slug = await selfPublishing(w);
    await publish(w, { update: slug, source: DOCUMENT("v2") });
    const out = await selfPublish(w, slug, {
      base_version: 1,
      files: {
        "data/doc.json": { text: '{"rev":2}', ifMatch: sha('{"rev":1}') },
        "notes.txt": { text: "unpinned" },
      },
    });
    expect([out.status, out.body.code, out.body.live]).toEqual([409, "conflict", "2"]);
    expect(out.body.paths).toBeUndefined();
    expect((await currentOf(w, slug)).current).toBe(2);
  });
  test("H18 with ifMatch on every entry a stale save lands, reporting its shas and what others changed", async () => {
    const w = wire();
    const slug = await selfPublishing(w, {
      files: {
        "data/doc.json": upload('{"rev":1}'),
        "theirs.txt": upload("t1"),
        "gone.txt": upload("g"),
      },
    });
    // Another writer moves on: changes one file, deletes one, adds one.
    await publish(w, {
      update: slug,
      source: DOCUMENT("v2"),
      files: { "theirs.txt": upload("t2"), "gone.txt": null, "new.txt": upload("n") },
    });
    const out = await selfPublish(w, slug, {
      base_version: 1,
      files: {
        "data/doc.json": { text: '{"rev":2}', ifMatch: sha('{"rev":1}') },
        "mine.txt": { text: "created", ifMatch: null },
      },
    });
    expect(out.status).toBe(200);
    expect(out.body).toEqual({
      ok: true,
      version: "3",
      shas: { "data/doc.json": sha('{"rev":2}'), "mine.txt": sha("created") },
      changed: [
        { path: "gone.txt", sha256: null },
        { path: "new.txt", sha256: sha("n") },
        { path: "theirs.txt", sha256: sha("t2") },
      ],
    });
    expect(await fileAt(w, slug, 3, "theirs.txt")).toBe("t2");
    expect(await fileAt(w, slug, 3, "data/doc.json")).toBe('{"rev":2}');
    // Nobody else wrote since v3: a pinned save reports no change, and a pinned delete writes no file.
    const quiet = await selfPublish(w, slug, {
      base_version: 3,
      files: { "mine.txt": { delete: true, ifMatch: sha("created") } },
    });
    expect(quiet.body).toEqual({ ok: true, version: "4", shas: {}, changed: [] });
  });
  test("H18 a pin that no longer holds is a conflict with its paths, and nothing is published", async () => {
    const w = wire();
    const slug = await selfPublishing(w);
    await publish(w, {
      update: slug,
      source: DOCUMENT("v2"),
      files: { "data/doc.json": upload('{"rev":"theirs"}') },
    });
    const out = await selfPublish(w, slug, {
      base_version: 1,
      files: {
        "data/doc.json": { text: '{"rev":2}', ifMatch: sha('{"rev":1}') },
        "fresh.txt": { text: "x", ifMatch: null },
        "ghost.txt": { delete: true, ifMatch: sha("never there") },
      },
    });
    expect([out.status, out.body.code, out.body.live]).toEqual([409, "conflict", "2"]);
    expect(out.body.paths).toEqual([
      { path: "data/doc.json", expected: sha('{"rev":1}'), actual: sha('{"rev":"theirs"}') },
      { path: "ghost.txt", expected: sha("never there"), actual: null },
    ]);
    expect(out.body.changed).toEqual([]);
    expect((await currentOf(w, slug)).current).toBe(2);
    expect(await fileAt(w, slug, 2, "fresh.txt")).toBe(404);
  });
});

describe("H19 what the /artifacts panel reaches", () => {
  const titleOf = async (w: Wired, slug: string) =>
    ((await (await w.api(`/artifacts/${slug}`)).json()) as { manifest: { title: string } }).manifest
      .title;
  const rename = (w: Wired, slug: string, body: Record<string, unknown>) =>
    w.api(`/artifacts/${slug}/rename`, { method: "POST", body: JSON.stringify(body) });

  test("H19 status is the server's own facts, who is connected and the store's counts, and no secret", async () => {
    const w = wire({ retentionDays: 3 });
    const { manifest } = await publish(w, { title: "Plan" });
    await publish(w, { title: "Roadmap" });
    await w.api(`/artifacts/${manifest.slug}/pin`, { method: "POST", body: "{}" });
    // Nobody is connected yet, so the reply is held: that is the one the count reports.
    expect((await w.pageRespond(manifest.slug, 1, { x: 1 })).status).toBe(200);
    const before = (await (await w.api("/status")).json()) as { sessions: string[] };
    expect(before.sessions).toEqual([]);
    await w.host.start();
    const deadline = Date.now() + 2000;
    while (!w.backend.server.sessions().length && Date.now() < deadline) await sleep(5);
    const res = await w.api("/status");
    expect(res.status).toBe(200);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(body).toMatchObject({
      origin: w.origin(),
      pid: process.pid,
      port: port(w),
      root: w.storeRoot,
      isolation: "origin",
      retentionDays: 3,
      sessions: [w.session],
      artifacts: { total: 2, pinned: 1, pending: 1 },
    });
    expect(Number.isFinite(Date.parse(body.startedAt as string))).toBe(true);
    for (const secret of [w.backend.token, w.backend.viewer]) expect(text).not.toContain(secret);
  });
  test("H19 status names the isolation the server runs under", async () => {
    const w = wire({ isolation: "sandbox" });
    const body = (await (await w.api("/status")).json()) as { isolation: string };
    expect(body.isolation).toBe("sandbox");
  });
  test("H19 rename retitles, trimmed, and says the user named it", async () => {
    const w = wire();
    const { manifest } = await publish(w, { title: "Plan" });
    const res = await rename(w, manifest.slug, { title: "  Pricing   plan " });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { manifest: { title: string; renamed?: boolean } };
    expect([body.manifest.title, body.manifest.renamed]).toEqual(["Pricing plan", true]);
    expect(await titleOf(w, manifest.slug)).toBe("Pricing plan");
  });
  test.each([
    ["a missing title", {}],
    ["an empty title", { title: "   " }],
    ["a title over 200 characters", { title: "x".repeat(201) }],
  ])("H19 %s is refused with the reason and changes nothing", async (_name, body) => {
    const w = wire();
    const { manifest } = await publish(w, { title: "Plan" });
    const res = await rename(w, manifest.slug, body);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/title/);
    expect(await titleOf(w, manifest.slug)).toBe("Plan");
  });
  test("H19 a slug that is not there is 404", async () => {
    const w = wire();
    expect((await rename(w, "never-published", { title: "Plan" })).status).toBe(404);
  });
  test("H19 neither answers without the session token; the viewer's cookie is not one", async () => {
    const w = wire();
    const { manifest } = await publish(w, { title: "Plan" });
    const paths = ["/api/status", `/api/artifacts/${manifest.slug}/rename`];
    for (const path of paths) {
      const method = path.endsWith("/rename") ? "POST" : "GET";
      const body = method === "POST" ? JSON.stringify({ title: "Taken" }) : undefined;
      const headers = { "content-type": "application/json" };
      expect((await fetch(`${w.origin()}${path}`, { method, body, headers })).status).toBe(401);
      expect((await w.shell(path, { method, body, headers })).status).toBe(401);
    }
    expect(await titleOf(w, manifest.slug)).toBe("Plan");
  });
});

/** An artifact that declares `db`, as a session publishes it. */
const tracking = async (w: Wired, title = "Tracker") =>
  (await publish(w, { title, capabilities: { db: {} } })).manifest.slug;
type Answer = { status: number; body: Record<string, unknown> };
/** The page's call, as the shell makes it for the page; and a session's, with its token. */
const pageDb = async (w: Wired, slug: string, body: Record<string, unknown>): Promise<Answer> => {
  const res = await w.shellPost(`/a/${slug}/db`, body);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};
const sessionDb = async (
  w: Wired,
  slug: string,
  body: Record<string, unknown>,
): Promise<Answer> => {
  const res = await w.api(`/artifacts/${slug}/db`, { method: "POST", body: JSON.stringify(body) });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

describe("H20 the page's database", () => {
  test("H20 set, get, update, query, delete and acquire answer with what they did", async () => {
    const w = wire();
    const slug = await tracking(w);
    expect(await pageDb(w, slug, { op: "get", path: "tasks/t1" })).toEqual({
      status: 200,
      body: { ok: true, doc: { id: "t1", path: "tasks/t1", exists: false } },
    });
    expect(
      await pageDb(w, slug, { op: "set", path: "tasks/t1", data: { title: "draft", rank: 2 } }),
    ).toEqual({ status: 200, body: { ok: true, path: "tasks/t1", version: 1 } });
    await pageDb(w, slug, { op: "set", path: "tasks/t2", data: { title: "ship", rank: 1 } });
    expect(
      (await pageDb(w, slug, { op: "update", path: "tasks/t1", data: { done: true } })).body,
    ).toMatchObject({ version: 2 });
    const read = await pageDb(w, slug, { op: "get", path: "tasks/t1" });
    expect(read.body.doc).toMatchObject({
      id: "t1",
      exists: true,
      data: { title: "draft", rank: 2, done: true },
      version: 2,
    });
    const found = await pageDb(w, slug, {
      op: "query",
      path: "tasks",
      query: { where: [["rank", ">=", 1]], orderBy: { field: "rank" }, limit: 1 },
    });
    expect(found.body).toMatchObject({ ok: true, docs: [{ id: "t2", version: 1 }] });
    expect(typeof found.body.nextCursor).toBe("string");
    const lease = await pageDb(w, slug, { op: "acquire", path: "locks/editor", holder: "tab-a" });
    expect(lease.body).toMatchObject({ ok: true, acquired: true, holder: "tab-a", version: 1 });
    const busy = await pageDb(w, slug, { op: "acquire", path: "locks/editor", holder: "tab-b" });
    expect(busy.body).toEqual({ ok: true, acquired: false, expiresAt: lease.body.expiresAt });
    expect((await pageDb(w, slug, { op: "delete", path: "tasks/t1" })).body).toEqual({
      ok: true,
      path: "tasks/t1",
      version: null,
    });
    expect((await pageDb(w, slug, { op: "get", path: "tasks/t1" })).body.doc).toMatchObject({
      exists: false,
    });
  });
  test.each([
    ["a collection path where a document goes", { op: "set", path: "tasks", data: {} }],
    ["a body that is a list", { op: "set", path: "tasks/t9", data: [1] }],
    [
      "a set that carries the delete sentinel",
      { op: "set", path: "tasks/t9", data: { a: { __delete__: true } } },
    ],
    ["an update of what is not there", { op: "update", path: "tasks/ghost", data: { a: 1 } }],
    [
      "a query with an unknown operator",
      { op: "query", path: "tasks", query: { where: [["a", "~", 1]] } },
    ],
    ["a lease with no holder", { op: "acquire", path: "locks/editor" }],
    ["an op nobody knows", { op: "drop", path: "tasks/t9" }],
    ["no op at all", { path: "tasks/t9" }],
  ])("H20 %s is 400 invalid_argument and writes nothing", async (_name, body) => {
    const w = wire();
    const slug = await tracking(w);
    const out = await pageDb(w, slug, body);
    expect([out.status, out.body.code, typeof out.body.message]).toEqual([
      400,
      "invalid_argument",
      "string",
    ]);
    expect(existsSync(join(w.storeRoot, slug, ".store", "db.json"))).toBe(false);
  });
  test("H20 a body over the route's limit is 413 in the capability's code", async () => {
    const w = wire();
    const slug = await tracking(w);
    const out = await pageDb(w, slug, {
      op: "set",
      path: "tasks/big",
      data: { text: "x".repeat(2 * 1024 * 1024) },
    });
    expect([out.status, out.body.code]).toEqual([413, "invalid_argument"]);
  });
  test("H20 an artifact that does not declare db is 403 revoked, even after a republish drops it", async () => {
    const w = wire();
    const plain = (await publish(w, { title: "Plain" })).manifest.slug;
    const out = await pageDb(w, plain, { op: "set", path: "tasks/t1", data: {} });
    expect([out.status, out.body.code]).toEqual([403, "revoked"]);
    const slug = await tracking(w);
    await pageDb(w, slug, { op: "set", path: "tasks/t1", data: { kept: true } });
    await publish(w, { update: slug, capabilities: { downloads: {} } });
    const late = await pageDb(w, slug, { op: "get", path: "tasks/t1" });
    expect([late.status, late.body.code]).toEqual([403, "revoked"]);
    // Declared again, the documents are still there: the database is the artifact's, not a version's.
    await publish(w, { update: slug, capabilities: { db: {} } });
    expect((await pageDb(w, slug, { op: "get", path: "tasks/t1" })).body.doc).toMatchObject({
      data: { kept: true },
    });
  });
});

describe("H21 open views hear the database move", () => {
  test("H21 one db message per write that moved something, naming the documents; nothing else is heard", async () => {
    const w = wire();
    const slug = await tracking(w);
    const stream = await w.shell(`/a/${slug}/events`);
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder();
    let heard = "";
    const until = async (needle: string) => {
      const deadline = Date.now() + 2000;
      while (!heard.includes(needle) && Date.now() < deadline)
        heard += decoder.decode((await reader.read()).value);
    };
    // What must not be heard, each followed by nothing; the marker write closes the window.
    await pageDb(w, slug, { op: "get", path: "tasks/t1" });
    await pageDb(w, slug, { op: "query", path: "tasks" });
    await pageDb(w, slug, { op: "set", path: "tasks", data: {} });
    await pageDb(w, slug, { op: "delete", path: "tasks/ghost" });
    await pageDb(w, slug, { op: "set", path: "tasks/t1", data: { n: 1 } });
    await pageDb(w, slug, { op: "acquire", path: "locks/l1", holder: "tab-a", data: { by: "a" } });
    await pageDb(w, slug, { op: "acquire", path: "locks/l1", holder: "tab-b" });
    await pageDb(w, slug, { op: "acquire", path: "locks/l1", holder: "tab-a" });
    await sessionDb(w, slug, {
      op: "batch",
      writes: [
        { op: "set", path: "data/users/me/prefs", data: { theme: "dark" } },
        { op: "delete", path: "tasks/t1" },
      ],
    });
    await sessionDb(w, slug, { op: "set", path: "tasks/t1", data: {}, ifVersion: 4 });
    await pageDb(w, slug, { op: "set", path: "marks/end", data: {} });
    await until('"marks/end"');
    const messages = heard
      .split("\n")
      .filter((line) => line.startsWith("data: ") && line.includes('"type":"db"'))
      .map((line) => (JSON.parse(line.slice(6)) as { paths: string[] }).paths);
    expect(messages).toEqual([
      ["tasks/t1"],
      ["locks/l1"],
      ["data/users/owner/prefs", "tasks/t1"],
      ["marks/end"],
    ]);
    await reader.cancel();
  });
});

describe("H22 a session's side of the database", () => {
  test("H22 a session reads what the page wrote, edits a field in place, and the page reads that", async () => {
    const w = wire();
    const slug = await tracking(w);
    await pageDb(w, slug, {
      op: "set",
      path: "notes/n1",
      data: { html: "<p>draft</p>", by: "viewer" },
    });
    const read = await sessionDb(w, slug, { op: "get", path: "notes/n1" });
    expect(read.body.doc).toMatchObject({ data: { html: "<p>draft</p>" }, version: 1 });
    const edited = await sessionDb(w, slug, {
      op: "str_replace",
      path: "notes/n1",
      field: "html",
      oldStr: "draft",
      newStr: "final",
      ifVersion: 1,
    });
    expect(edited).toEqual({ status: 200, body: { ok: true, path: "notes/n1", version: 2 } });
    expect((await pageDb(w, slug, { op: "get", path: "notes/n1" })).body.doc).toMatchObject({
      data: { html: "<p>final</p>", by: "viewer" },
      version: 2,
    });
    const listed = await sessionDb(w, slug, { op: "query", path: "notes", query: { limit: 10 } });
    expect(listed.body).toMatchObject({ docs: [{ id: "n1", version: 2 }], nextCursor: null });
  });
  test("H22 a pinned write against a document that moved is a conflict naming where it is", async () => {
    const w = wire();
    const slug = await tracking(w);
    await sessionDb(w, slug, { op: "set", path: "tasks/t1", data: { n: 1 } });
    await pageDb(w, slug, { op: "update", path: "tasks/t1", data: { n: 2 } });
    for (const body of [
      { op: "set", path: "tasks/t1", data: { n: 9 }, ifVersion: 1 },
      { op: "update", path: "tasks/t1", data: { n: 9 }, ifVersion: 1 },
      { op: "delete", path: "tasks/t1", ifVersion: 1 },
      { op: "str_replace", path: "tasks/t1", field: "x", oldStr: "a", newStr: "b", ifVersion: 1 },
    ]) {
      const out = await sessionDb(w, slug, body);
      expect([body.op, out.status, out.body.code, out.body.current]).toEqual([
        body.op,
        409,
        "conflict",
        2,
      ]);
      expect(out.body.entry).toBeUndefined();
    }
    expect((await sessionDb(w, slug, { op: "get", path: "tasks/t1" })).body.doc).toMatchObject({
      data: { n: 2 },
      version: 2,
    });
    const landed = await sessionDb(w, slug, {
      op: "set",
      path: "tasks/t1",
      data: {},
      ifVersion: 2,
    });
    expect(landed.body).toMatchObject({ ok: true, version: 3 });
  });
  test("H22 a batch lands whole or not at all, and a refusal names its entry", async () => {
    const w = wire();
    const slug = await tracking(w);
    await sessionDb(w, slug, { op: "set", path: "tasks/t1", data: { n: 1 } });
    const refused = await sessionDb(w, slug, {
      op: "batch",
      writes: [
        { op: "set", path: "tasks/t2", data: { n: 1 } },
        { op: "update", path: "tasks/t1", data: { n: 2 }, ifVersion: 5 },
      ],
    });
    expect([refused.status, refused.body]).toEqual([
      409,
      expect.objectContaining({ code: "conflict", entry: 1, current: 1, path: "tasks/t1" }),
    ]);
    expect((await sessionDb(w, slug, { op: "get", path: "tasks/t2" })).body.doc).toMatchObject({
      exists: false,
    });
    const malformed = await sessionDb(w, slug, {
      op: "batch",
      writes: [
        { op: "set", path: "tasks/t2", data: {} },
        { op: "acquire", path: "tasks/t3" },
      ],
    });
    expect([malformed.status, malformed.body.code]).toEqual([400, "invalid_argument"]);
    expect(String(malformed.body.message)).toContain("writes[1]");
    const landed = await sessionDb(w, slug, {
      op: "batch",
      writes: [
        { op: "set", path: "tasks/t2", data: { n: 1 } },
        { op: "update", path: "tasks/t1", data: { n: 2 }, ifVersion: 1 },
        { op: "delete", path: "tasks/t0" },
      ],
    });
    expect(landed).toEqual({
      status: 200,
      body: {
        ok: true,
        written: [
          { path: "tasks/t2", version: 1 },
          { path: "tasks/t1", version: 2 },
          { path: "tasks/t0", version: null },
        ],
      },
    });
  });
  test("H22 it takes fifty documents of full size in one body, needs the token, and 404s a missing slug", async () => {
    const w = wire();
    const slug = await tracking(w);
    const big = { text: "x".repeat(200 * 1024) };
    const out = await sessionDb(w, slug, {
      op: "batch",
      writes: Array.from({ length: 50 }, (_, k) => ({ op: "set", path: `bulk/d${k}`, data: big })),
    });
    expect([out.status, (out.body.written as unknown[]).length]).toEqual([200, 50]);
    const body = JSON.stringify({ op: "get", path: "bulk/d0" });
    const headers = { "content-type": "application/json" };
    const path = `/api/artifacts/${slug}/db`;
    expect((await fetch(`${w.origin()}${path}`, { method: "POST", body, headers })).status).toBe(
      401,
    );
    expect((await w.shell(path, { method: "POST", body, headers })).status).toBe(401);
    expect((await sessionDb(w, "never-published", { op: "get", path: "bulk/d0" })).status).toBe(
      404,
    );
  });
});

/** An artifact that declares `assets`, and the call the shell makes for its page. */
const holding = async (w: Wired, extra: Record<string, unknown> = {}) =>
  (await publish(w, { title: "Gallery", capabilities: { assets: {}, db: {} }, ...extra })).manifest
    .slug;
const pageAssets = async (w: Wired, slug: string, body: Record<string, unknown>) => {
  const res = await w.shellPost(`/a/${slug}/assets`, body);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};
const uploaded = async (w: Wired, slug: string, content: string | Uint8Array, type: string) =>
  (
    await pageAssets(w, slug, {
      op: "upload",
      base64: Buffer.from(content).toString("base64"),
      contentType: type,
    })
  ).body as { id: string; url: string; sizeBytes: number; contentType: string };

describe("H23 the page's assets", () => {
  test("H23 upload answers the id and its url; list the assets and the budget; delete is idempotent", async () => {
    const w = wire();
    const slug = await holding(w);
    const empty = await pageAssets(w, slug, { op: "list" });
    expect(empty).toEqual({
      status: 200,
      body: {
        ok: true,
        assets: [],
        usage: { files: 0, bytes: 0, maxFiles: 1000, maxBytes: 256 * 1024 * 1024 },
      },
    });
    const gif = await uploaded(w, slug, GIF, "image/gif");
    expect(gif).toEqual({
      ok: true,
      id: expect.stringMatching(/^[a-f0-9]{32}$/),
      url: `/_blob/${gif.id}`,
      sizeBytes: GIF.byteLength,
      contentType: "image/gif",
    } as never);
    const csv = await uploaded(w, slug, "a,b\n1,2\n", "text/csv");
    const listed = (await pageAssets(w, slug, { op: "list" })).body as {
      assets: Array<Record<string, unknown>>;
      usage: Record<string, number>;
    };
    expect(listed.assets.map((a) => [a.id, a.url, a.contentType, a.sizeBytes])).toEqual([
      [gif.id, gif.url, "image/gif", GIF.byteLength],
      [csv.id, csv.url, "text/csv", 8],
    ]);
    expect(Number.isFinite(Date.parse(String(listed.assets[0]?.createdAt)))).toBe(true);
    expect(listed.usage).toMatchObject({ files: 2, bytes: GIF.byteLength + 8 });
    expect((await pageAssets(w, slug, { op: "delete", ref: gif.url })).body).toEqual({
      ok: true,
      deleted: true,
    });
    expect((await pageAssets(w, slug, { op: "delete", ref: gif.id })).body).toEqual({
      ok: true,
      deleted: false,
    });
    expect(
      ((await pageAssets(w, slug, { op: "list" })).body.usage as { files: number }).files,
    ).toBe(1);
  });
  test.each([
    [
      "a type outside the set",
      { op: "upload", base64: "AAAA", contentType: "text/html" },
      415,
      "unsupported_type",
    ],
    [
      "a type with a parameter",
      { op: "upload", base64: "AAAA", contentType: "text/csv;charset=utf-8" },
      415,
      "unsupported_type",
    ],
    [
      "markup under a binary type",
      { op: "upload", base64: Buffer.from("<svg/>").toString("base64"), contentType: "image/png" },
      415,
      "unsupported_type",
    ],
    ["no type", { op: "upload", base64: "AAAA" }, 400, "invalid_request"],
    ["no bytes", { op: "upload", base64: "", contentType: "image/png" }, 400, "invalid_request"],
    [
      "bytes that are not base64",
      { op: "upload", base64: "!!", contentType: "image/png" },
      400,
      "invalid_request",
    ],
    [
      "text that is not UTF-8",
      {
        op: "upload",
        base64: Buffer.from([0x63, 0xe9]).toString("base64"),
        contentType: "text/plain",
      },
      400,
      "invalid_request",
    ],
    ["a delete of no id", { op: "delete", ref: "../manifest.json" }, 400, "invalid_request"],
    ["an op nobody knows", { op: "rename" }, 400, "invalid_request"],
    [
      "an SVG over 2 MiB",
      {
        op: "upload",
        base64: Buffer.alloc(2 * 1024 * 1024 + 1, 0x20).toString("base64"),
        contentType: "image/svg+xml",
      },
      413,
      "too_large",
    ],
  ])("H23 %s is refused by code and stores nothing", async (_name, body, status, code) => {
    const w = wire();
    const slug = await holding(w);
    const out = await pageAssets(w, slug, body);
    expect([out.status, out.body.code, typeof out.body.message]).toEqual([status, code, "string"]);
    expect(existsSync(join(w.storeRoot, slug, ".store", "assets"))).toBe(false);
  });
  test("H23 an artifact that does not declare assets is 403 not_granted", async () => {
    const w = wire();
    const plain = (await publish(w, { title: "Plain" })).manifest.slug;
    const out = await pageAssets(w, plain, { op: "list" });
    expect([out.status, out.body.code]).toEqual([403, "not_granted"]);
  });
});

describe("H24 an asset is served at /_blob/<id>", () => {
  const IMAGE_POLICY = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

  test("H24 byte for byte under its stored type, unsniffed, uncached, from every version", async () => {
    const w = wire();
    const slug = await holding(w);
    const gif = await uploaded(w, slug, GIF, "image/gif");
    const css = await uploaded(w, slug, "body{color:red}", "text/css");
    await publish(w, { update: slug });
    const image = await w.frame(slug, gif.url);
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/gif");
    expect(image.headers.get("x-content-type-options")).toBe("nosniff");
    expect(image.headers.get("cache-control")).toBe("no-store");
    expect(image.headers.get("referrer-policy")).toBe("no-referrer");
    expect(image.headers.get("content-security-policy")).toBe(pagePolicy(port(w)));
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(GIF);
    const sheet = await w.frame(slug, `${css.url}?v=2`);
    expect(sheet.headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect(await sheet.text()).toBe("body{color:red}");
  });
  test("H24 an SVG comes back sanitised, under a policy that runs and loads nothing", async () => {
    const w = wire();
    const slug = await holding(w);
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><rect width="4" height="4"/></svg>';
    const svg = await uploaded(w, slug, source, "image/svg+xml");
    const res = await w.frame(slug, svg.url);
    expect(res.headers.get("content-type")).toBe("image/svg+xml; charset=utf-8");
    expect(res.headers.get("content-security-policy")).toBe(IMAGE_POLICY);
    const body = await res.text();
    expect(body).toBe('<svg xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4"/></svg>');
    expect(svg.sizeBytes).toBe(Buffer.byteLength(body));
  });
  test("H24 an unknown or deleted id, another artifact's host and the shell host are 404; only GET answers", async () => {
    const w = wire();
    const slug = await holding(w);
    const other = await holding(w, { title: "Other gallery" });
    const kept = await uploaded(w, slug, GIF, "image/gif");
    const gone = await uploaded(w, slug, GIF, "image/gif");
    await pageAssets(w, slug, { op: "delete", ref: gone.id });
    const tries: Array<[string, Promise<Response>]> = [
      ["an id nobody minted", w.frame(slug, `/_blob/${"0".repeat(32)}`)],
      ["a deleted asset", w.frame(slug, gone.url)],
      ["another artifact's host", w.frame(other, kept.url)],
      ["the shell host", w.shell(kept.url)],
      ["an id that is no id", w.frame(slug, "/_blob/index.json")],
      ["a path under the id", w.frame(slug, `${kept.url}/x`)],
    ];
    for (const [name, attempt] of tries)
      expect([name, (await attempt).status]).toEqual([name, 404]);
    expect((await w.frame(slug, kept.url, { method: "POST" })).status).toBe(405);
    expect((await w.frame(slug, kept.url)).status).toBe(200);
  });
  test("H24 under sandbox isolation the shell host serves an asset by its id, sandboxed", async () => {
    const w = wire({ isolation: "sandbox" });
    const slug = await holding(w);
    const gif = await uploaded(w, slug, GIF, "image/gif");
    const res = await fetch(`${w.origin()}${gif.url}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-security-policy")).toContain("; sandbox ");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(GIF);
    expect((await fetch(`${w.origin()}/_blob/${"0".repeat(32)}`)).status).toBe(404);
  });
});

describe("H25 an artifact made from a type", () => {
  const TYPE_PAGE = DOCUMENT("the type's page");
  const post = async (w: Wired, body: Record<string, unknown>) => {
    const res = await w.api("/publish", { method: "POST", body: JSON.stringify(body) });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  };
  /** A board of the type `kanban`, which brings one script, declaring `artifact` so its page may publish. */
  const board = async (w: Wired) => {
    const made = await post(w, {
      kind: "html",
      source: TYPE_PAGE,
      title: "Q3 Roadmap",
      type: { name: "kanban", paths: ["app.js"] },
      files: { "app.js": upload("render()") },
      capabilities: { artifact: {} },
    });
    expect(made.status).toBe(200);
    return (made.body.manifest as { slug: string }).slug;
  };

  test("H25 a publish with no page carries the type's page, lays the files over, and tabs hear it", async () => {
    const w = wire();
    const slug = await board(w);
    expect((await currentOf(w, slug)) as unknown).toMatchObject({
      current: 1,
      type: { name: "kanban", paths: ["index.html", "app.js"] },
    });
    const stream = await w.shell(`/a/${slug}/events`);
    const reader = stream.body!.getReader();
    const filled = await post(w, { update: slug, files: { "data/cards.json": upload("[1]") } });
    expect([filled.status, filled.body.version]).toEqual([200, 2]);
    expect(await w.document(slug, 2)).toBe(await w.document(slug, 1));
    const served = async (path: string) =>
      (await w.frame(slug, `/_f/${w.cap(slug)}/2/${path}`)).text();
    expect([await served("data/cards.json"), await served("app.js")]).toEqual(["[1]", "render()"]);
    let heard = "";
    const deadline = Date.now() + 2000;
    while (!heard.includes('"type":"version"') && Date.now() < deadline)
      heard += new TextDecoder().decode((await reader.read()).value);
    expect(heard).toContain('"version":2');
    await reader.cancel();
  });
  test("H25 a page, or a type's path, is 403 read_only_path from a session and from the page, and publishes nothing", async () => {
    const w = wire();
    const slug = await board(w);
    const sessionTries: Array<[string, Record<string, unknown>]> = [
      ["a page", { kind: "html", source: DOCUMENT("mine"), update: slug }],
      ["a type's file", { update: slug, files: { "app.js": upload("evil()") } }],
      ["a type's file, removed", { update: slug, files: { "app.js": null } }],
      ["the page as a file", { update: slug, files: { "index.html": upload("x") } }],
    ];
    for (const [name, body] of sessionTries) {
      const out = await post(w, body);
      expect([name, out.status, out.body.code]).toEqual([name, 403, "read_only_path"]);
      expect(typeof out.body.error).toBe("string");
    }
    const pageTries: Array<[string, Record<string, unknown>]> = [
      ["the html form", { html: DOCUMENT("the viewer's") }],
      ["the files form on a type's path", { files: { "app.js": { text: "evil()" } } }],
    ];
    for (const [name, body] of pageTries) {
      const out = await selfPublish(w, slug, { base_version: 1, ...body });
      expect([name, out.status, out.body.code]).toEqual([name, 403, "read_only_path"]);
    }
    expect((await currentOf(w, slug)).current).toBe(1);
    const own = await selfPublish(w, slug, {
      base_version: 1,
      files: { "data/cards.json": { text: "[2]" } },
    });
    expect([own.status, own.body.version]).toEqual([200, "2"]);
  });
  test.each([
    ["a name alone", "kanban"],
    ["no paths", { name: "kanban" }],
    ["paths that are no strings", { name: "kanban", paths: [1] }],
  ])("H25 a type that is %s is 400 and publishes nothing", async (_name, type) => {
    const w = wire();
    const out = await post(w, { kind: "html", source: TYPE_PAGE, title: "Board", type });
    expect(out.status).toBe(400);
    expect(String(out.body.error)).toContain("type");
    expect(await (await w.api("/artifacts")).json()).toEqual({ artifacts: [] });
  });
  test("H25 an artifact made from no type cannot publish without a page", async () => {
    const w = wire();
    const { manifest } = await publish(w, { title: "Plain" });
    const out = await post(w, { update: manifest.slug, files: { "a.css": upload("a") } });
    expect(out.status).toBe(400);
    expect(String(out.body.error)).toMatch(/page/);
    expect((await currentOf(w, manifest.slug)).current).toBe(1);
  });
});
