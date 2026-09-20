// live — the guarantees only a browser can prove: origins, the page policy, the
// sandbox, the bridge between a page and the viewer shell, and state carried
// across a republish. A real Chromium, driven by playwright-core, against the
// in-process server of the fixture. Skipped where no Chromium is found; the
// HTTP contracts beside this file still run there. Hosts a page may load from
// are checked by the absence of a policy violation, so the suite does not need
// the network; when it has it, the loads themselves are checked too. What runs
// inside a page is written as source text, since this project compiles without
// the DOM's types; a wait on the shell uses a locator, because its policy
// (rightly) refuses the evaluated text a polled expression needs.
//
// L1  a script in page A cannot read page B's document or island, cannot post a
//     reply or a comment to B, and cannot reach /api or the shell's routes — from
//     its own origin they do not exist, and any other origin its policy blocks;
//     the shell's document is out of its reach
// L2  a page gets what Claude Code gives it: an origin of its own inside a shell,
//     the policy's allowlist (cdnjs and jsdelivr scripts, eval, Google Fonts, data
//     images, same-origin fetch; unpkg, a cdnjs stylesheet, an external image and
//     an external fetch blocked), window.claude with use and hot before its first
//     script, no platform id, meta or icon in its document, storage no other
//     artifact sees, and mermaid drawn in HTML and in Markdown — whose raw HTML
//     never runs
// L3  the shell's theme choice is stamped on the page: dark and light set
//     data-theme, system stamps nothing; a stored choice rides in the frame's
//     address, so it is there before first paint
// L4  a republish moves an open tab to the new version by itself: what controls
//     with an id held (a typed value, a ticked box), the focus, the scroll position
//     and the old document's hot.snapshot reach the new document (hot.ready); a
//     control without an id is not carried and a fresh load gets {}; the old
//     document's hot.signal aborts first, its storage survives, and the shell
//     never reloads
// L5  the questions loop: the shell's Send button stays disabled until the
//     required question is answered, then delivers a validated reply to the
//     blocked `ask` as a user gesture; a click on the page's own send button is a
//     gesture too, while a send the page's script starts by itself is not
// L6  the 💬 button is there on a page with no island (and no Send bar is): a
//     comment posted from its panel with "send to agent" checked reaches the
//     owning session as a comment event
// L7  what a page's browser saw — console errors, policy violations, that it
//     loaded — reaches `verify` through the shell
// L8  under `sandbox` isolation the page is framed from the shell host with an
//     opaque origin: its storage throws, the shell's routes refuse it, and the
//     bridge still serves it (the questions form renders and sends)
// L9  the header acts on the artifact: Rename retitles it, Pin flips the flag, the
//     version picker pins the address to a version that shows no Send bar and does
//     not follow a republish, Duplicate opens the copy, and Delete — only after its
//     modal is confirmed — moves the folder to the trash and leaves for the gallery
// L10 a republish never throws away answers the user has not sent: the shell says
//     so in its banner and keeps the page, shows the new version when asked, and
//     the Send bar then reads the new document's questions
// L11 the reply capability as a page author meets it: claude.use("reply") is one
//     frozen namespace on a page with an island and null on a page without, as is
//     any unknown name; hand-written [data-question] / [data-option] / [data-text]
//     markup fills the island and marks what is selected; change and sent are
//     heard; the island the shell sends is the one the page built; opened outside
//     the shell a page still starts — hot.ready gets {} and every capability is null
// L12 claude.hot.restart() and the menu's Refresh load the same version afresh inside
//     the same shell; an artifact deleted while it is open says so and offers the gallery
// L13 a page reaches its published files by relative URL: an <img>, a <script>, a
//     stylesheet and a fetch each load the file's own bytes, and neither the stylesheet
//     nor the font it names is refused by the page policy; a path the version does not
//     hold fails to load; after a republish the open view's relative URLs are the new
//     version's
// L14 claude.use(name) is one frozen namespace, with Claude Code's verbs, for a
//     capability the artifact declares and this host serves, and for `permissions` on
//     every page; it is null for what is not declared, for what is declared but only
//     claude.ai could serve (mcp, room, sample, user, self), and for any unknown name;
//     permissions.state and request report what the page is served as granted and
//     anything else as unavailable, and never open a prompt
// L15 downloads.save offers a file through the shell: the viewer is shown the final
//     name and the size; accepting saves those bytes under that name and resolves
//     {status: "saved"}, declining rejects `declined` and saves nothing; a second
//     offer while one waits is `rate_limited`, a name outside the allowlist
//     `rejected_extension`, empty data `bad_request`; the page's own <a download>
//     saves nothing, because the frame cannot download
// L16 comments.openComposer, from the viewer's click in the page, opens the shell's 💬
//     panel with its composer focused and About filled from the element — or from a
//     range's selected text — and what is posted there is the viewer's comment, which
//     reaches the owning session; with no gesture behind it, over a draft the viewer
//     is typing, or inside [data-uncommentable] it resolves {opened: false} and
//     changes nothing; a target outside the document rejects `invalid`, every write
//     verb rejects `not_granted`, and canSendToClaude answers "off"
// L17 artifact.publish(html) makes the next version as the viewer and moves every open
//     view to it, the publishing one included, carrying its state like any republish;
//     a view still on the older version — held there by unsent answers — rejects
//     `conflict` naming the live version; edit and sync reject `capability_disabled`
// L18 artifact.publish(files) saves the named files as the next version and leaves the
//     publishing view running — its document is not reloaded and its next save builds
//     on the version it made — while every other open view moves to it and reads the
//     new file; with ifMatch the result carries the stored `shas`, and a pin that no
//     longer holds rejects `conflict` with its `paths` and publishes nothing
// L19 under `sandbox` isolation, where the page's origin is opaque, the same bridge
//     serves the capabilities: use() answers as it does elsewhere, a relative <img>
//     loads the published file, a confirmed save reaches the viewer's downloads, and
//     the page's own publish moves the view to the new version
// L20 db is shared and live: a document one view writes reaches onSnapshot in another —
//     on the document and on a query over its collection — and the `artifact_data` tool
//     reads that same row; a row the tool writes, edits or the page deletes arrives in
//     every open view as added, modified and removed changes whose indexes fit the new
//     order; snapshots are frozen, a document that did not change is the same object in
//     the next delivery, and a removal still carries the last body
// L21 db as a page author meets it, verb for verb: where, orderBy and limit shape a
//     query's get(); add() mints an id; update merges and {"__delete__": true} removes
//     a field; a path that breaks the grammar throws a TypeError where it is written;
//     an update of what is not there, and a query that breaks a rule, reject
//     `invalid_argument` — on a listener, through its error callback, once — and an
//     argument that cannot cross to the shell rejects `transform_error`; a second
//     holder's acquire resolves {acquired: false} with only the expiry; a view's 65th
//     live subscription is refused `resource_exhausted` through its error callback, and
//     an unsubscribed one frees its place; a listener on `data/users/me/…` hears what
//     the tool writes there; use("db") is null for an artifact that does not declare it
// L22 assets.upload stores a Blob and resolves {id, url, sizeBytes, contentType}; the url
//     renders in an <img>, and an uploaded stylesheet, script and data file take effect
//     from theirs, none refused by the page policy; an SVG renders as an image and its
//     script never runs; list() reports every asset oldest first with the usage against
//     the budget; the id kept in a db document still renders as "/_blob/" + id after a
//     republish; delete resolves {deleted: true}, then false, and the url stops loading;
//     what is no Blob, an empty one, a missing type, an alias and a type outside the set
//     reject `invalid_request` or `unsupported_type`; under `sandbox` isolation the same
//     upload renders
// L23 an artifact made from a type shows the type's page under the session's title; the
//     files the session publishes to its url reach the open view as the next version,
//     rendered by the type's own script, which came along unchanged; from the page,
//     artifact.publish(html) and a files publish naming one of the type's paths reject
//     `read_only_path` and publish nothing, while a file of the artifact's own saves

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { type Browser, chromium, type Frame, type Page } from "playwright-core";

import { QUESTIONS, sleep, stopAll, wire } from "../fixture";

function findChromium(): string | null {
  const caches = [
    join(homedir(), "Library/Caches/ms-playwright"),
    join(homedir(), ".cache/ms-playwright"),
  ];
  const bundled = caches.flatMap((cache) =>
    existsSync(cache)
      ? readdirSync(cache)
          .filter((name) => /^chromium-\d+$/.test(name))
          .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
          .flatMap((name) => [
            join(
              cache,
              name,
              "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
            ),
            join(
              cache,
              name,
              "chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
            ),
            join(cache, name, "chrome-linux/chrome"),
          ])
      : [],
  );
  const installed = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return [...bundled, ...installed].find((path) => existsSync(path)) ?? null;
}

const executablePath = findChromium();
const fixturePage = (name: string) => readFileSync(join(import.meta.dir, "pages", name), "utf8");

type Wired = ReturnType<typeof wire>;

let browser: Browser;
const pages: Page[] = [];

beforeAll(async () => {
  if (executablePath) browser = await chromium.launch({ executablePath, headless: true });
});
afterAll(async () => {
  await browser?.close();
});
afterEach(async () => {
  while (pages.length) await pages.pop()?.context().close();
  await stopAll();
});

/** Publishes through the API as a session would; returns the slug. */
async function publish(
  w: Wired,
  source: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const res = await w.api("/publish", {
    method: "POST",
    body: JSON.stringify({ kind: "html", source, ...extra }),
  });
  const body = (await res.json()) as { manifest?: { slug: string }; error?: string };
  if (!body.manifest) throw new Error(body.error ?? "publish failed");
  return body.manifest.slug;
}

/** A supporting file as the publish route takes it. */
const upload = (content: string | Uint8Array, contentType?: string) => ({
  base64: Buffer.from(content).toString("base64"),
  contentType,
});
/** A one-pixel GIF. */
const GIF = new Uint8Array(
  Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
);

/** Opens the viewer shell the way the user does: the tokened link, in a browser with nothing stored. */
async function view(
  w: Wired,
  slug: string,
  options: { colorScheme?: "light" | "dark" } = {},
): Promise<Page> {
  const context = await browser.newContext({ colorScheme: options.colorScheme ?? "light" });
  const page = await context.newPage();
  pages.push(page);
  await page.goto(`${w.origin()}/a/${slug}?t=${w.backend.viewer}`);
  return page;
}

/** The artifact's frame showing `version`, once its document has loaded. */
async function frameOf(page: Page, version = 1): Promise<Frame> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const frame = page
      .frames()
      .find((f) => new RegExp(`/_f/[a-f0-9]{32}/${version}/`).test(f.url()));
    if (frame) {
      await frame.waitForLoadState("domcontentloaded");
      return frame;
    }
    await sleep(50);
  }
  throw new Error(`no frame shows v${version}; frames: ${page.frames().map((f) => f.url())}`);
}

/** Evaluates source text in a page or a frame; what it yields comes back untyped. */
const evaluate = (target: Page | Frame, source: string): Promise<unknown> =>
  target.evaluate<unknown>(source);

const manifestOf = async (w: Wired, slug: string) =>
  (
    (await (await w.api(`/artifacts/${slug}`)).json()) as {
      manifest: { current: number; responses: Array<{ r: number; gesture: boolean }> };
      island: Record<string, unknown> | null;
    }
  ).manifest;

/** Waits until the server has `count` replies on the artifact. */
async function replies(w: Wired, slug: string, count: number) {
  const deadline = Date.now() + 10_000;
  for (;;) {
    const { responses } = await manifestOf(w, slug);
    if (responses.length >= count || Date.now() > deadline) return responses;
    await sleep(50);
  }
}

describe.skipIf(!executablePath)("artifacts in a real browser", () => {
  test("L1 a page cannot reach another artifact, the shell, or the API", async () => {
    const w = wire();
    const victim = await publish(w, "<title>Victim</title><p id='secret'>the victim's words</p>", {
      island: { secret: "the victim's island" },
    });
    const victimDocument = `http://${victim}.localhost:${w.backend.server.port}/_f/${w.cap(victim)}/1/`;
    // The attacker is even told the victim's frame address, which it could never compute.
    const attacker = await publish(
      w,
      `<title>Attacker</title><script>
        const shell = ${JSON.stringify(w.origin())};
        const tries = {
          "victim document": () => fetch(${JSON.stringify(victimDocument)}).then((r) => r.text()),
          "victim island": () => fetch(shell + "/a/${victim}/data", { credentials: "include" }).then((r) => r.text()),
          "reply to victim": () => fetch(shell + "/a/${victim}/publish", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ base_version: 1, data: { forged: true }, gesture: true }) }).then((r) => r.status),
          "comment on victim": () => fetch(shell + "/a/${victim}/comments", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "forged", toAgent: true }) }).then((r) => r.status),
          "api on the shell": () => fetch(shell + "/api/artifacts").then((r) => r.status),
          "api on its own origin": () => fetch("/api/health").then((r) => r.status),
          "shell route on its own origin": () => fetch("/a/${victim}/data").then((r) => r.status),
          "reply through its own origin": () => fetch("/a/${victim}/publish", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((r) => r.status),
          "the shell's document": () => Promise.resolve(parent.document.title),
          "a frame of the victim": () => new Promise((resolve, reject) => { const f = document.createElement("iframe"); f.onload = () => resolve("loaded"); document.addEventListener("securitypolicyviolation", (e) => reject(new Error(e.violatedDirective))); f.src = ${JSON.stringify(victimDocument)}; document.body.appendChild(f); }),
        };
        window.outcome = {};
        addEventListener("DOMContentLoaded", async () => {
          for (const [name, attempt] of Object.entries(tries)) {
            try { window.outcome[name] = { got: await attempt() }; } catch (e) { window.outcome[name] = { refused: String(e.message || e) }; }
          }
          window.done = true;
        });
      </script><p>attacker</p>`,
    );
    const page = await view(w, attacker);
    const frame = await frameOf(page);
    await frame.waitForFunction("window.done === true");
    const outcome = (await evaluate(frame, "window.outcome")) as Record<
      string,
      { got?: unknown; refused?: string }
    >;

    for (const blocked of [
      "victim document",
      "victim island",
      "reply to victim",
      "comment on victim",
      "api on the shell",
      "the shell's document",
      "a frame of the victim",
    ])
      expect([blocked, outcome[blocked]?.refused !== undefined]).toEqual([blocked, true]);
    for (const absent of [
      "api on its own origin",
      "shell route on its own origin",
      "reply through its own origin",
    ])
      expect([absent, outcome[absent]?.got]).toEqual([absent, 404]);
    expect(JSON.stringify(outcome)).not.toContain("the victim's");
    expect((await manifestOf(w, victim)).responses).toHaveLength(0);
    expect(await (await w.api(`/artifacts/${victim}/comments`)).json()).toEqual({ threads: [] });
  }, 30_000);

  test("L2 the page gets Claude Code's contract", async () => {
    const online = await fetch(
      "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.13/dayjs.min.js",
      {
        method: "HEAD",
        signal: AbortSignal.timeout(4000),
      },
    ).then(
      (r) => r.ok,
      () => false,
    );
    const w = wire();
    const other = await publish(w, fixturePage("bare-fragment.html"));
    const otherPage = await view(w, other);
    await (
      await frameOf(otherPage)
    ).waitForFunction('localStorage.getItem("written-by-unstyled-fragment") === "1"');

    const slug = await publish(w, fixturePage("contract-probe.html"));
    const page = await view(w, slug);
    const frame = await frameOf(page);
    await frame.waitForFunction(
      `Object.values(window.__probe || {}).every((v) => v !== "pending…") &&
        /^yes/.test((window.__probe || {})["mermaid <pre> rendered"] || "")`,
    );
    const probe = (await evaluate(frame, "window.__probe")) as Record<string, string>;

    expect(probe["location.origin"]).toBe(`http://${slug}.localhost:${w.backend.server.port}`);
    expect(probe["location.pathname"]).toBe(`/_f/${w.cap(slug)}/1/`);
    expect(probe["framed (self !== top)"]).toBe("true");
    expect(probe["doctype / compatMode"]).toBe("html / CSS1Compat");
    expect(probe["viewport meta"]).toBe("width=device-width,initial-scale=1,viewport-fit=cover");
    expect(probe["favicon href (first 70)"]).toBe("(none)");
    expect(probe["csp <meta> present"]).toBe("false");
    expect(probe["platform ids in document"]).toBe("(none)");
    expect(probe["body class"]).toBe("(none)");
    expect(probe["body background"]).toBe("rgb(250, 249, 245)");
    expect(probe["body color"]).toBe("rgb(20, 20, 19)");
    expect(probe["body margin"]).toBe("0px");
    expect(probe["html[data-theme]"]).toBe("(not stamped)");
    expect(probe["window.claude at first run"]).toBe("object");
    expect(probe["window.artifact at first run"]).toBe("undefined");
    expect(probe["eval()"]).toBe("allowed → 42");
    expect(probe["img: data URI"]).toBe("LOADED");
    expect(probe["fetch: same origin"]).toBe("ALLOWED (HTTP 200)");
    expect(probe["script: unpkg"]).toBe("blocked / failed");
    expect(probe["stylesheet: cdnjs"]).toBe("blocked / failed");
    expect(probe["img: external host"]).toBe("blocked / failed");
    expect(probe["fetch: external"]).toStartWith("blocked");
    // What the policy refused, each reported once — and nothing it admits among them.
    expect((probe["csp violations seen"] ?? "").split(" | ").sort()).toEqual([
      "connect-src ← https://api.github.com/zen",
      "img-src ← https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png",
      "script-src-elem ← https://unpkg.com/dayjs@1.11.13/plugin/utc.js",
      "style-src-elem ← https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css",
    ]);
    if (online) {
      expect(probe["script: cdnjs"]).toStartWith("LOADED");
      expect(probe["script: jsdelivr"]).toStartWith("LOADED");
      expect(probe["stylesheet: Google Fonts"]).toBe("LOADED");
    }
    expect(probe["localStorage"]).toBe("ok; keys on this origin: contract-probe");
    expect(probe["mermaid <pre> rendered"]).toStartWith("yes");

    const claude = await evaluate(
      frame,
      `(() => {
      const c = window.claude;
      return {
        own: Object.getOwnPropertyNames(c).sort(),
        frozen: Object.isFrozen(c),
        use: typeof c.use,
        hot: Object.getOwnPropertyNames(c.hot).sort(),
        hotFrozen: Object.isFrozen(c.hot),
        data: JSON.stringify(c.hot.data),
        from: c.hot.from,
        gen: c.hot.gen,
        signal: Object.prototype.toString.call(c.hot.signal),
        returns: [c.hot.snapshot(() => ({})), c.hot.ready(() => {})].map((r) => typeof r),
      };
    })()`,
    );
    expect(claude).toEqual({
      own: ["hot", "use"],
      frozen: false,
      use: "function",
      hot: ["accept", "data", "from", "gen", "ready", "restart", "signal", "snapshot"],
      hotFrozen: true,
      data: "{}",
      from: null,
      gen: 0,
      signal: "[object AbortSignal]",
      returns: ["undefined", "undefined"],
    });
    expect(await evaluate(frame, 'document.querySelector("iframe, link[rel~=icon]")')).toBeNull();

    const md = await publish(w, fixturePage("markdown-lane.md"), {
      kind: "md",
      sourcePath: "docs/markdown-lane.md",
    });
    const mdFrame = await frameOf(await view(w, md));
    await mdFrame.waitForSelector("pre.mermaid svg");
    expect(await evaluate(mdFrame, "window.__md_script_ran")).toBeUndefined();
  }, 60_000);

  test("L3 the shell's theme choice is stamped on the page; system stamps nothing", async () => {
    const w = wire();
    const slug = await publish(w, "<title>Themed</title><p>themed</p>");
    const page = await view(w, slug);
    const frame = await frameOf(page);
    const THEME = 'document.documentElement.getAttribute("data-theme")';
    expect(await evaluate(frame, THEME)).toBeNull();
    await page.selectOption("#theme-picker", "dark");
    await frame.waitForFunction(`${THEME} === "dark"`);
    expect(await evaluate(page, THEME)).toBe("dark");
    await page.selectOption("#theme-picker", "light");
    await frame.waitForFunction(`${THEME} === "light"`);
    // The choice is remembered by the shell and rides in the frame's address on the next load.
    await page.reload();
    const again = await frameOf(page);
    expect(new URL(again.url()).searchParams.get("theme")).toBe("light");
    expect(await evaluate(again, THEME)).toBe("light");
    await page.selectOption("#theme-picker", "system");
    await again.waitForFunction(`${THEME} === null`);
    await page.reload();
    expect(new URL((await frameOf(page)).url()).search).toBe("");
  }, 30_000);

  test("L4 a republish carries typed input and hot state into the new document", async () => {
    const w = wire();
    const source = (build: string) =>
      `<title>Carried</title><p id="build">${build}</p><div style="height:1500px"></div>
      <input id="agree" type="checkbox"><input id="note" type="text"><input type="text" class="anonymous">
      <div style="height:1500px"></div>
      <script>
        const state = { count: 0 };
        claude.hot.snapshot(() => ({ count: state.count, from: ${JSON.stringify(build)} }));
        claude.hot.ready((carried) => { window.received = carried; state.count = (carried.count || 0) + 1; });
        claude.hot.signal.addEventListener("abort", () => sessionStorage.setItem("left", ${JSON.stringify(build)}));
      </script>`;
    const slug = await publish(w, source("build one"));
    const page = await view(w, slug);
    const first = await frameOf(page, 1);
    await first.waitForFunction('"received" in window');
    expect(await evaluate(first, "window.received")).toEqual({});
    await first.locator("#note").pressSequentially("typed before the republish");
    await first.locator(".anonymous").fill("no id, not carried");
    await first.locator("#agree").check();
    await first.locator("#note").focus();
    const scrolled = (await evaluate(first, "window.scrollY")) as number;
    expect(scrolled).toBeGreaterThan(500);
    await evaluate(page, "window.stayed = true");

    await publish(w, source("build two"), { update: slug });
    const second = await frameOf(page, 2);
    await second.waitForFunction('"received" in window');
    expect(await second.locator("#build").textContent()).toBe("build two");
    expect(await evaluate(second, "window.received")).toEqual({ count: 1, from: "build one" });
    await second.waitForFunction('document.getElementById("note").value !== ""');
    expect(await second.locator("#note").inputValue()).toBe("typed before the republish");
    expect(await second.locator(".anonymous").inputValue()).toBe("");
    expect(await second.locator("#agree").isChecked()).toBe(true);
    expect(await evaluate(second, "document.activeElement.id")).toBe("note");
    expect(await evaluate(second, "window.scrollY")).toBe(scrolled);
    expect(await evaluate(second, 'sessionStorage.getItem("left")')).toBe("build one");
    // The old document is gone and the shell is the same page it was.
    while ((await page.locator("iframe").count()) !== 1) await sleep(50);
    expect(await evaluate(page, "window.stayed")).toBe(true);
    expect(await page.locator("#version-picker option").first().textContent()).toContain("v2");
  }, 30_000);

  test("L5 the questions loop sends through the shell, and only a person's send is a gesture", async () => {
    const w = wire();
    const asking = w.run({ action: "ask", title: "Pricing", questions: QUESTIONS, timeout: 25 });
    while (!w.opened.length) await sleep(20);
    const context = await browser.newContext();
    const page = await context.newPage();
    pages.push(page);
    await page.goto(w.opened[0] as string);
    const frame = await frameOf(page);
    const send = page.locator("#send-button");
    const status = page.locator("#send-status");
    await page.locator("#send-bar").waitFor({ state: "visible" });
    await status.filter({ hasText: "required left" }).waitFor();
    expect(await send.isDisabled()).toBe(true);
    await frame.locator('[data-option="Seat-based"]').click();
    await status.filter({ hasText: "ready to send" }).waitFor();
    expect(await send.isDisabled()).toBe(false);
    await send.click();
    const { text } = await asking;
    expect(text).toContain("Seat-based");
    expect(text).toContain("reply 1 to v1");
    expect(text).not.toContain("no user gesture");
    await status.filter({ hasText: "Sent reply 1 to v1" }).waitFor();
    expect((await manifestOf(w, "pricing")).responses).toEqual([
      expect.objectContaining({ r: 1, gesture: true }),
    ]);

    // A page that sends by itself, then offers its own button: only the click is the user's.
    const own = await publish(
      w,
      `<title>Own send</title><button data-artifact-send="approve">Approve</button>
       <script>claude.use("reply").then((reply) => reply.send({ automatic: true }));</script>`,
      { island: { topic: "deploy" } },
    );
    const ownPage = await view(w, own);
    expect(await replies(w, own, 1)).toEqual([expect.objectContaining({ r: 1, gesture: false })]);
    await (await frameOf(ownPage)).locator("[data-artifact-send]").click();
    expect(await replies(w, own, 2)).toEqual([
      expect.objectContaining({ r: 1, gesture: false }),
      expect.objectContaining({ r: 2, gesture: true }),
    ]);
    const read = (await (await w.api(`/artifacts/${own}`)).json()) as {
      island: Record<string, unknown>;
    };
    expect(read.island).toMatchObject({ topic: "deploy", automatic: true, action: "approve" });
  }, 60_000);

  test("L6 a comment from the 💬 panel reaches the owning session", async () => {
    const w = wire();
    await w.run({ file_path: w.file("notes.html", "<title>Plain Notes</title><p>no island</p>") });
    const page = await view(w, "plain-notes");
    await frameOf(page);
    await page.locator("#fab").waitFor({ state: "visible" });
    expect(await page.locator("#send-bar").isVisible()).toBe(false);
    expect(await page.locator("#comments-panel").isVisible()).toBe(false);
    await page.locator("#fab").click();
    expect(await page.locator("#comment-to-agent").isChecked()).toBe(true);
    await page.locator("#comment-text").fill("tighten the second paragraph");
    await page.locator("#comment-anchor").fill("paragraph two");
    await page.locator("#composer button[type=submit]").click();
    expect(await w.feedbackCount(1, 5000)).toBe(1);
    const content = String(w.feedback()[0]?.message.content);
    expect(content).toContain("tighten the second paragraph");
    expect(content).toContain("paragraph two");
    expect(w.feedback()[0]?.message.details).toMatchObject({
      kind: "comment",
      slug: "plain-notes",
    });
    await page.locator("#fab-count").filter({ hasText: "1" }).waitFor();
    // The header's icon toggles the same panel.
    await page.locator("#comments-toggle").click();
    expect(await page.locator("#comments-panel").isVisible()).toBe(false);
  }, 30_000);

  test("L7 what the page's browser saw reaches verify", async () => {
    const w = wire();
    await w.run({
      file_path: w.file(
        "noisy.html",
        `<title>Noisy Page</title><script>console.error("boom at load");</script><img src="https://example.com/x.png" alt="">`,
      ),
    });
    const page = await view(w, "noisy-page");
    await frameOf(page);
    const deadline = Date.now() + 8000;
    let text = "";
    while (Date.now() < deadline && !/page policy/.test(text)) {
      await sleep(200);
      text = (await w.run({ action: "verify", url: "noisy-page" })).text;
    }
    expect(text).toContain("boom at load");
    expect(text).toContain("loaded v1");
    expect(text).toMatch(/page policy \(img-src\): https:\/\/example\.com\/x\.png/);
  }, 30_000);

  test("L8 sandbox isolation frames the page from the shell host with an opaque origin", async () => {
    const w = wire({ isolation: "sandbox" });
    const slug = await publish(
      w,
      `<title>Sandboxed</title><div data-artifact-questions></div><script>
        window.facts = { origin: location.origin, host: location.host };
        try { localStorage.setItem("k", "v"); window.facts.storage = "open"; } catch (e) { window.facts.storage = "throws"; }
        fetch("/a/sandboxed/data", { credentials: "include" }).then((r) => (window.facts.data = r.status), () => (window.facts.data = "refused"));
      </script>`,
      {
        island: {
          schema: "questions/v1",
          questions: [{ id: "go", question: "Go?", options: [{ label: "Yes" }, { label: "No" }] }],
          answers: {},
        },
      },
    );
    const page = await view(w, slug);
    const frame = await frameOf(page);
    expect(new URL(frame.url()).host).toBe(new URL(w.origin()).host);
    await frame.waitForFunction("window.facts.data !== undefined");
    const facts = (await evaluate(frame, "window.facts")) as { storage: string; data: unknown };
    expect(facts.storage).toBe("throws");
    expect(facts.data).not.toBe(200);
    await frame.locator('[data-option="Yes"]').click();
    await page.locator("#send-button").click();
    expect(await replies(w, slug, 1)).toEqual([expect.objectContaining({ r: 1, gesture: true })]);
  }, 30_000);

  test("L9 the header's menu and version picker act on the artifact", async () => {
    const w = wire();
    const source = (words: string) => `<title>Menu Page</title><p id="words">${words}</p>`;
    const slug = await publish(w, source("first words"), { island: { a: 1 } });
    await publish(w, source("second words"), {
      island: { a: 1 },
      update: slug,
      label: "second cut",
    });
    const page = await view(w, slug);
    const menu = async (action: string) => {
      await page.locator("#title-button").click();
      await page.locator(`[data-action="${action}"]`).click();
    };
    const pinnedFlag = async () =>
      ((await (await w.api(`/artifacts/${slug}`)).json()) as { manifest: { pinned: boolean } })
        .manifest.pinned;

    await menu("rename");
    await page.locator("#rename-input").fill("Renamed In The Shell");
    await page.locator("#rename-form button[type=submit]").click();
    await page.locator("#title-text").filter({ hasText: "Renamed In The Shell" }).waitFor();
    expect(await page.title()).toBe("Renamed In The Shell");

    await menu("pin");
    await page.locator("#pin-item").filter({ hasText: "Unpin" }).waitFor({ state: "attached" });
    expect(await pinnedFlag()).toBe(true);

    // Pinned to v1: the old words, no Send bar although the page has an island, and no following.
    expect(await page.locator("#send-bar").isVisible()).toBe(true);
    expect(await page.locator("#version-picker option").allTextContents()).toEqual([
      "Latest · v2",
      "v2 · second cut",
      "v1",
    ]);
    await page.selectOption("#version-picker", "1");
    await page.waitForURL(`**/a/${slug}/v/1`);
    expect(await (await frameOf(page, 1)).locator("#words").textContent()).toBe("first words");
    expect(await page.locator("#send-bar").isVisible()).toBe(false);
    await publish(w, source("third words"), { island: { a: 1 }, update: slug });
    await page.locator("#version-picker option").filter({ hasText: "Latest · v3" }).waitFor({
      state: "attached",
    });
    expect(page.frames().some((f) => /\/_f\/[a-f0-9]{32}\/3\//.test(f.url()))).toBe(false);
    await page.selectOption("#version-picker", "latest");
    await page.waitForURL(`**/a/${slug}`);
    expect(await (await frameOf(page, 3)).locator("#words").textContent()).toBe("third words");

    await menu("duplicate");
    await page.waitForURL(/\/a\/copy-of-/);
    expect(await (await frameOf(page, 1)).locator("#words").textContent()).toBe("third words");
    await page.goBack();

    await menu("delete");
    await page.locator("#delete-dialog [data-close]").click();
    expect(existsSync(join(w.storeRoot, slug))).toBe(true);
    await menu("delete");
    await page.locator("#delete-confirm").click();
    await page.waitForURL("**/a/");
    expect(existsSync(join(w.storeRoot, slug))).toBe(false);
    expect(existsSync(join(w.trashDir, "pi-artifacts"))).toBe(true);
    expect(await page.locator(".gallery a").allTextContents()).toEqual([
      expect.stringContaining("Copy of Renamed In The Shell"),
    ]);
  }, 45_000);

  test("L10 unsent answers hold a republish back until the user asks for it", async () => {
    const w = wire();
    const island = (question: string) => ({
      schema: "questions/v1",
      questions: [{ id: "go", question, options: [{ label: "Yes" }, { label: "No" }] }],
      answers: {},
    });
    const slug = await publish(w, "<title>Held Back</title><div data-artifact-questions></div>", {
      island: island("Ship it?"),
    });
    const page = await view(w, slug);
    const first = await frameOf(page, 1);
    await first.locator('[data-option="Yes"]').click();
    await page.locator("#send-status").filter({ hasText: "ready to send" }).waitFor();
    await publish(w, "<title>Held Back</title><div data-artifact-questions></div>", {
      island: island("Ship it today?"),
      update: slug,
    });
    await page.locator("#banner").filter({ hasText: "v2" }).waitFor();
    expect(page.frames().some((f) => /\/_f\/[a-f0-9]{32}\/2\//.test(f.url()))).toBe(false);
    expect(await first.locator('[data-option="Yes"] input').isChecked()).toBe(true);
    await page.locator("#banner-action").click();
    const second = await frameOf(page, 2);
    await second.locator("text=Ship it today?").waitFor();
    await page.locator("#send-status").filter({ hasText: "0 of 1 answered" }).waitFor();
    expect(await page.locator("#send-button").isDisabled()).toBe(true);
    expect(await page.locator("#banner").isVisible()).toBe(false);
  }, 30_000);

  test("L11 the reply capability, hand-written bindings, and a page with no shell", async () => {
    const w = wire();
    const source = `<title>Hand Written</title>
      <div data-question="tier"><button data-option="Basic">Basic</button><button data-option="Pro">Pro</button></div>
      <div data-question="why"><input data-text type="text"></div>
      <script>
        window.seen = { changes: 0 };
        claude.hot.ready((carried) => (window.seen.readyWith = carried));
        Promise.all([claude.use("reply"), claude.use("nope"), claude.use("reply")]).then(([reply, nope, again]) => {
          Object.assign(window.seen, { settled: true, reply: reply && typeof reply, nope, same: reply === again });
          if (!reply) return;
          Object.assign(window.seen, { frozen: Object.isFrozen(reply), version: reply.version, slug: reply.slug });
          reply.on("change", () => { window.seen.changes += 1; window.seen.dirty = reply.dirty; });
          reply.on("sent", (sent) => Object.assign(window.seen, { sent, dirtyAfter: reply.dirty }));
          window.reply = reply;
        });
      </script>`;
    const slug = await publish(w, source, { island: { topic: "plan" } });
    const page = await view(w, slug);
    const frame = await frameOf(page);
    await frame.waitForFunction("window.seen.settled === true");
    expect(await evaluate(frame, "window.seen")).toMatchObject({
      reply: "object",
      nope: null,
      same: true,
      frozen: true,
      version: 1,
      slug,
      readyWith: {},
    });
    expect(await page.locator("#send-button").isDisabled()).toBe(true);

    await frame.locator('[data-option="Pro"]').click();
    await frame.locator("[data-text]").fill("because it scales");
    expect(await frame.locator('[data-option="Pro"]').getAttribute("data-selected")).toBe("");
    expect(await frame.locator('[data-option="Basic"]').getAttribute("data-selected")).toBeNull();
    expect(await evaluate(frame, "window.reply.data.set({ extra: 1 }).extra")).toBe(1);
    expect(await evaluate(frame, "window.seen")).toMatchObject({ changes: 3, dirty: true });
    await page.locator("#send-status").filter({ hasText: "Unsent changes" }).waitFor();
    await page.locator("#send-button").click();
    await frame.waitForFunction("window.seen.sent !== undefined");
    expect(await evaluate(frame, "window.seen")).toMatchObject({
      sent: { version: 1, response: 1 },
      dirtyAfter: false,
    });
    const read = (await (await w.api(`/artifacts/${slug}`)).json()) as { island: unknown };
    expect(read.island).toEqual({
      topic: "plan",
      extra: 1,
      answers: { tier: { selected: ["Pro"] }, why: { text: "because it scales" } },
    });

    const bare = await publish(w, source.replace("Hand Written", "No Island"));
    const bareFrame = await frameOf(await view(w, bare));
    await bareFrame.waitForFunction("window.seen.settled === true");
    expect(await evaluate(bareFrame, "window.seen")).toMatchObject({ reply: null, nope: null });

    // The same document, opened by its own address: there is no shell to serve it anything.
    const alone = await page.context().newPage();
    await alone.goto(frame.url());
    await alone.waitForFunction("window.seen.settled === true");
    expect(await evaluate(alone, "window.seen")).toMatchObject({ reply: null, readyWith: {} });
  }, 45_000);

  test("L12 a restart reloads only the frame; a deletion elsewhere is announced", async () => {
    const w = wire();
    const slug = await publish(
      w,
      "<title>Restartable</title><script>window.loadedAt = performance.timeOrigin;</script>",
    );
    const page = await view(w, slug);
    const frame = await frameOf(page);
    await evaluate(page, "window.stayed = true");
    const loads = [(await evaluate(frame, "window.loadedAt")) as number];
    for (const restart of [
      () => evaluate(frame, "claude.hot.restart()"),
      async () => {
        await page.locator("#title-button").click();
        await page.locator('[data-action="refresh"]').click();
      },
    ]) {
      await restart();
      const last = loads.at(-1) as number;
      await (await frameOf(page)).waitForFunction(`window.loadedAt > ${last}`);
      loads.push((await evaluate(await frameOf(page), "window.loadedAt")) as number);
    }
    expect(await evaluate(page, "window.stayed")).toBe(true);

    expect((await w.api(`/artifacts/${slug}/delete`, { method: "POST", body: "{}" })).status).toBe(
      200,
    );
    await page.locator("#banner").filter({ hasText: "deleted" }).waitFor();
    await page.locator("#banner-action").click();
    await page.waitForURL("**/a/");
  }, 30_000);

  test("L13 a page reaches its published files by relative URL", async () => {
    const w = wire();
    const source = `<title>Multi File</title>
      <link rel="stylesheet" href="css/page.css">
      <img id="dot" src="img/dot.gif" alt=""><img id="ghost" src="img/ghost.gif" alt="">
      <div id="ruled"></div>
      <script src="app.js"></script>
      <script>
        window.refused = [];
        document.addEventListener("securitypolicyviolation", (e) => window.refused.push(e.violatedDirective));
        window.loads = {};
        for (const id of ["dot", "ghost"]) {
          const img = document.getElementById(id);
          const settle = () => (window.loads[id] = img.naturalWidth > 0);
          if (img.complete) settle();
          else img.onload = img.onerror = settle;
        }
        fetch("data/rows.json").then((r) => r.json()).then((rows) => (window.rows = rows));
        fetch("data/ghost.json").then((r) => (window.ghostStatus = r.status));
      </script>`;
    const files = (build: string) => ({
      "img/dot.gif": upload(GIF),
      "app.js": upload(`window.fromScript = ${JSON.stringify(build)};`),
      "data/rows.json": upload(JSON.stringify({ build })),
      // The font is no font: what matters is that the page policy lets the request go.
      "css/page.css": upload(
        '#ruled{width:123px}@font-face{font-family:"Own";src:url("../fonts/own.woff2")}#ruled{font-family:"Own"}',
      ),
      "fonts/own.woff2": upload("not a font"),
    });
    const slug = await publish(w, source, { files: files("one") });
    const page = await view(w, slug);
    const first = await frameOf(page, 1);
    await first.waitForFunction(
      "window.rows && window.ghostStatus && Object.keys(window.loads).length === 2",
    );
    expect(
      await evaluate(first, "[window.loads, window.rows, window.fromScript, window.ghostStatus]"),
    ).toEqual([{ dot: true, ghost: false }, { build: "one" }, "one", 404]);
    await first.waitForFunction(
      "getComputedStyle(document.getElementById('ruled')).width === '123px'",
    );
    await evaluate(first, "document.fonts.load('16px Own').catch(() => null)");
    expect(await evaluate(first, "window.refused")).toEqual([]);

    await publish(w, source, { update: slug, files: files("two") });
    const second = await frameOf(page, 2);
    await second.waitForFunction("window.rows !== undefined");
    expect(await evaluate(second, "[window.rows, window.fromScript]")).toEqual([
      { build: "two" },
      "two",
    ]);
  }, 30_000);

  test("L14 use() is a namespace for what is declared and served, null for everything else", async () => {
    const w = wire();
    const source = `<title>Capable</title><script>
      const names = ["permissions", "downloads", "comments", "artifact", "mcp", "room", "sample", "user", "self", "nope"];
      Promise.all(names.map((name) => claude.use(name))).then(async (got) => {
        const use = {};
        names.forEach((name, k) => {
          use[name] = got[k] && { frozen: Object.isFrozen(got[k]), verbs: Object.keys(got[k]).sort() };
        });
        const permissions = got[0];
        window.seen = {
          use,
          same: claude.use("permissions") === claude.use("permissions"),
          all: await permissions.state(),
          one: await Promise.all(["downloads", "comments", "artifact", "mcp", "nope", "downloads:x"].map((n) => permissions.state(n))),
          asked: await permissions.request(["downloads", "mcp"]),
          askedAll: await permissions.request(),
        };
      });
    </script>`;
    const slug = await publish(w, source, {
      capabilities: {
        downloads: {},
        comments: { composer_only: true },
        mcp: { servers: ["https://example.com/mcp"] },
        room: {},
        sample: {},
        user: {},
        self: {},
      },
    });
    const page = await view(w, slug);
    const frame = await frameOf(page);
    await frame.waitForFunction("window.seen !== undefined");
    const granted = { permissions: "granted", downloads: "granted", comments: "granted" };
    expect(await evaluate(frame, "window.seen")).toEqual({
      use: {
        permissions: { frozen: true, verbs: ["request", "state"] },
        downloads: { frozen: true, verbs: ["save"] },
        comments: {
          frozen: true,
          verbs: [
            "anchorFor",
            "canSendToClaude",
            "create",
            "customAnchors",
            "delete",
            "openComposer",
            "reply",
            "resolve",
            "sendToClaude",
          ],
        },
        artifact: null,
        mcp: null,
        room: null,
        sample: null,
        user: null,
        self: null,
        nope: null,
      },
      same: true,
      all: granted,
      one: ["granted", "granted", "unavailable", "unavailable", "unavailable", "unavailable"],
      asked: { downloads: "granted", mcp: "unavailable" },
      askedAll: granted,
    });
    expect(await page.locator("dialog[open]").count()).toBe(0);

    // A page that declares nothing still has permissions, and nothing else.
    const bare = await publish(
      w,
      `<title>Undeclared</title><script>
        Promise.all([claude.use("permissions"), claude.use("downloads"), claude.use("artifact")])
          .then(async ([p, d, a]) => (window.seen = { downloads: d, artifact: a, all: await p.state() }));
      </script>`,
    );
    const bareFrame = await frameOf(await view(w, bare));
    await bareFrame.waitForFunction("window.seen !== undefined");
    expect(await evaluate(bareFrame, "window.seen")).toEqual({
      downloads: null,
      artifact: null,
      all: { permissions: "granted" },
    });
  }, 30_000);

  test("L15 downloads.save saves only what the viewer accepts, and the frame cannot download by itself", async () => {
    const w = wire();
    const slug = await publish(
      w,
      `<title>Exporter</title>
      <button id="csv">Export</button><button id="twice">Twice</button><button id="exe">Exe</button>
      <button id="empty">Empty</button><a id="own" download="own.txt" href="data:text/plain,own">own link</a>
      <script>
        window.saves = {};
        const settle = (key, promise) => promise.then(
          (value) => (window.saves[key] = { value }),
          (error) => (window.saves[key] = { code: error.code }),
        );
        claude.use("downloads").then((downloads) => {
          const bytes = new TextEncoder().encode("a,b\\n1,2\\n");
          document.getElementById("csv").onclick = () =>
            settle("csv", downloads.save({ filename: "  q3\\u200b/rows   final.csv ", data: bytes }));
          document.getElementById("twice").onclick = () => {
            settle("first", downloads.save({ filename: "first.txt", data: "first" }));
            settle("second", downloads.save({ filename: "second.txt", data: new Blob(["second"]) }));
          };
          document.getElementById("exe").onclick = () =>
            settle("exe", downloads.save({ filename: "tool.exe", data: "MZ" }));
          document.getElementById("empty").onclick = () =>
            settle("empty", downloads.save({ filename: "empty.txt", data: "" }));
          window.ready = true;
        });
      </script>`,
      { capabilities: { downloads: {} } },
    );
    const page = await view(w, slug);
    const frame = await frameOf(page);
    await frame.waitForFunction("window.ready === true");
    const saved: string[] = [];
    page.on("download", (download) => saved.push(download.suggestedFilename()));
    const dialog = page.locator("#save-dialog");

    await frame.locator("#csv").click();
    await dialog.waitFor({ state: "visible" });
    expect(await page.locator("#save-name").textContent()).toBe("q3_rows final.csv");
    expect(await page.locator("#save-size").textContent()).toContain("8 B");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#save-confirm").click(),
    ]);
    expect(download.suggestedFilename()).toBe("q3_rows final.csv");
    expect(readFileSync(await download.path(), "utf8")).toBe("a,b\n1,2\n");
    await frame.waitForFunction("window.saves.csv !== undefined");
    expect(await evaluate(frame, "window.saves.csv")).toEqual({ value: { status: "saved" } });

    // Two offers at once: the first waits for the viewer, the second is turned away; then the viewer says no.
    await frame.locator("#twice").click();
    await dialog.waitFor({ state: "visible" });
    expect(await page.locator("#save-name").textContent()).toBe("first.txt");
    await frame.waitForFunction("window.saves.second !== undefined");
    await page.locator("#save-dialog [data-close]").click();
    await frame.waitForFunction("window.saves.first !== undefined");
    expect(await evaluate(frame, "[window.saves.first, window.saves.second]")).toEqual([
      { code: "declined" },
      { code: "rate_limited" },
    ]);

    for (const [button, code] of [
      ["exe", "rejected_extension"],
      ["empty", "bad_request"],
    ]) {
      await frame.locator(`#${button}`).click();
      await frame.waitForFunction(`window.saves.${button} !== undefined`);
      expect(await evaluate(frame, `window.saves.${button}`)).toEqual({ code });
      expect(await dialog.isVisible()).toBe(false);
    }
    await frame.locator("#own").click();
    await sleep(500);
    expect(saved).toEqual(["q3_rows final.csv"]);
  }, 45_000);

  test("L16 comments.openComposer opens the 💬 panel on its composer; the page writes nothing itself", async () => {
    const w = wire();
    await w.run({
      file_path: w.file(
        "review.html",
        `<title>Review Me</title>
        <p id="claim">Revenue grew   12% in the third quarter, <b>ahead</b> of plan.</p>
        <div data-uncommentable><p id="sealed">not for comments</p></div>
        <button id="on-claim">Comment</button><button id="on-range">Comment on selection</button>
        <button id="on-sealed">Sealed</button><button id="bad">Bad target</button><button id="write">Write</button>
        <script>
          window.got = {};
          const settle = (key, promise) => promise.then(
            (value) => (window.got[key] = { value }),
            (error) => (window.got[key] = { code: error.code }),
          );
          claude.use("comments").then((comments) => {
            const claim = document.getElementById("claim");
            settle("unasked", comments.openComposer({ element: claim }));
            const click = (id, fn) => (document.getElementById(id).onclick = fn);
            click("on-claim", () => settle("claim", comments.openComposer({ element: claim })));
            click("on-range", () => {
              const range = document.createRange();
              range.setStart(claim.firstChild, 0);
              range.setEnd(claim.firstChild, 7);
              settle("range", comments.openComposer({ range }));
            });
            click("on-sealed", () => settle("sealed", comments.openComposer({ element: document.getElementById("sealed") })));
            click("bad", () => {
              settle("detached", comments.openComposer({ element: document.createElement("p") }));
              settle("both", comments.openComposer({ element: claim, range: document.createRange() }));
            });
            click("write", async () => {
              const anchor = await comments.anchorFor(claim);
              window.got.anchor = typeof anchor.path === "string" && anchor.x > 0 && anchor.y > 0;
              settle("create", comments.create({ anchor, text: "forged by the page" }));
              settle("reply", comments.reply("t_1", "forged"));
              settle("send", comments.sendToClaude({ anchor, text: "forged" }));
              settle("resolve", comments.resolve("t_1", true));
              settle("delete", comments.delete("t_1"));
              settle("anchors", comments.customAnchors({ mode() {}, threads() {}, reveal() {} }));
              settle("can", comments.canSendToClaude());
            });
            window.ready = true;
          });
        </script>`,
      ),
      capabilities: { comments: { composer_only: true } },
    });
    const page = await view(w, "review-me");
    const frame = await frameOf(page);
    await frame.waitForFunction("window.ready === true && window.got.unasked !== undefined");
    const panel = page.locator("#comments-panel");
    // Asked for by script alone, at load: a soft refusal, and the panel stays shut.
    expect(await evaluate(frame, "window.got.unasked")).toEqual({ value: { opened: false } });
    expect(await panel.isVisible()).toBe(false);

    await frame.locator("#on-claim").click();
    await panel.waitFor({ state: "visible" });
    expect(await evaluate(frame, "window.got.claim")).toEqual({ value: { opened: true } });
    expect(await page.locator("#comment-anchor").inputValue()).toBe(
      "Revenue grew 12% in the third quarter, ahead of plan.",
    );
    expect(await evaluate(page, "document.activeElement.id")).toBe("comment-text");
    expect(await page.locator(".panel").count()).toBe(1);

    // What the viewer types there is theirs: it reaches the session as any comment does.
    await page.keyboard.type("is that net of refunds?");
    await page.locator("#composer button[type=submit]").click();
    expect(await w.feedbackCount(1, 5000)).toBe(1);
    const content = String(w.feedback()[0]?.message.content);
    expect(content).toContain("is that net of refunds?");
    expect(content).toContain("Revenue grew 12%");

    await page.locator("#fab").click();
    await panel.waitFor({ state: "hidden" });
    await frame.locator("#on-range").click();
    await panel.waitFor({ state: "visible" });
    expect(await page.locator("#comment-anchor").inputValue()).toBe("Revenue");

    // A draft the viewer is typing is left exactly as it is.
    await page.locator("#comment-text").fill("half a thought");
    await frame.locator("#on-claim").click();
    await frame.waitForFunction("window.got.claim.value.opened === false");
    expect(await page.locator("#comment-anchor").inputValue()).toBe("Revenue");
    expect(await page.locator("#comment-text").inputValue()).toBe("half a thought");

    await frame.locator("#on-sealed").click();
    await frame.locator("#bad").click();
    await frame.locator("#write").click();
    await frame.waitForFunction("window.got.can !== undefined && window.got.both !== undefined");
    expect(await evaluate(frame, "window.got")).toMatchObject({
      sealed: { value: { opened: false } },
      detached: { code: "invalid" },
      both: { code: "invalid" },
      anchor: true,
      create: { code: "not_granted" },
      reply: { code: "not_granted" },
      send: { code: "not_granted" },
      resolve: { code: "not_granted" },
      delete: { code: "not_granted" },
      anchors: { code: "not_granted" },
      can: { value: "off" },
    });
    const threads = (await (await w.api("/artifacts/review-me/comments")).json()) as {
      threads: Array<{ messages: Array<{ text: string }> }>;
    };
    expect(threads.threads.flatMap((t) => t.messages.map((m) => m.text))).toEqual([
      "is that net of refunds?",
    ]);
  }, 45_000);

  // A page that renders itself from its state, as a page that publishes itself is told to:
  // the markup is a template of the count, and the script carries itself along.
  const COUNTER_BODY = `<p id="count">COUNT</p><input id="note" type="text"><button id="bump">Bump</button><button id="live-doc">Edit</button>`;
  const COUNTER_APP = `
    const body = ${JSON.stringify(COUNTER_BODY)};
    const template = (count) =>
      "<!doctype html><html><head><title>Self Publisher</title></head><body>" + body.replace("COUNT", count) +
      '<script id="app">' + document.getElementById("app").textContent + "</" + "script></body></html>";
    window.got = {};
    const settle = (key, promise) => promise.then(
      (value) => (window.got[key] = { value }),
      (error) => (window.got[key] = { code: error.code, live: error.live }),
    );
    claude.hot.snapshot(() => ({ from: document.getElementById("count").textContent }));
    claude.hot.ready((carried) => (window.carried = carried));
    Promise.all([claude.use("artifact"), claude.use("reply")]).then(([artifact, reply]) => {
      window.dirty = () => reply.data.set({ touched: true });
      document.getElementById("bump").onclick = () =>
        settle("publish", artifact.publish(template(Number(document.getElementById("count").textContent) + 1)));
      document.getElementById("live-doc").onclick = () => {
        settle("edit", artifact.edit([{ op: "set-text", target: "x", text: "y" }]));
        settle("sync", artifact.sync(() => {}));
      };
      window.ready = true;
    });`;
  const selfPublisher = (count: number) =>
    `<!doctype html><html><head><title>Self Publisher</title></head><body>${COUNTER_BODY.replace("COUNT", String(count))}<script id="app">${COUNTER_APP}</script></body></html>`;

  test("L17 artifact.publish(html) moves every open view to the viewer's new version; a stale view conflicts", async () => {
    const w = wire();
    const slug = await publish(w, selfPublisher(1), {
      capabilities: { artifact: {} },
      island: { topic: "counter" },
    });
    const publisher = await view(w, slug);
    const watcher = await view(w, slug);
    const held = await view(w, slug);
    const first = await frameOf(publisher, 1);
    await first.waitForFunction("window.ready === true");
    const heldFrame = await frameOf(held, 1);
    await heldFrame.waitForFunction("window.ready === true");
    // Unsent answers keep this view on v1 when v2 arrives: the shell asks before discarding them.
    await evaluate(heldFrame, "window.dirty()");
    await evaluate(publisher, "window.stayed = true");
    await first.locator("#note").fill("typed before publishing");

    await first.locator("#bump").click();
    const second = await frameOf(publisher, 2);
    await second.waitForFunction("window.carried !== undefined");
    expect(await second.locator("#count").textContent()).toBe("2");
    expect(await evaluate(second, "window.carried")).toEqual({ from: "1" });
    await second.waitForFunction('document.getElementById("note").value !== ""');
    expect(await second.locator("#note").inputValue()).toBe("typed before publishing");
    expect(await evaluate(publisher, "window.stayed")).toBe(true);
    expect(await (await frameOf(watcher, 2)).locator("#count").textContent()).toBe("2");
    const manifest = (await (await w.api(`/artifacts/${slug}`)).json()) as {
      manifest: { current: number; owner: string; versions: Array<{ by: string }> };
    };
    expect(manifest.manifest).toMatchObject({ current: 2, owner: w.session });
    expect(manifest.manifest.versions.map((v) => v.by)).toEqual([w.session, "viewer"]);

    await held.locator("#banner").filter({ hasText: "v2" }).waitFor();
    await heldFrame.locator("#bump").click();
    await heldFrame.waitForFunction("window.got.publish !== undefined");
    expect(await evaluate(heldFrame, "window.got.publish")).toEqual({
      code: "conflict",
      live: "2",
    });
    expect((await manifestOf(w, slug)).current).toBe(2);

    // The new document publishes again from where it stands, and live-doc verbs are not this host's.
    await second.locator("#bump").click();
    expect(await (await frameOf(publisher, 3)).locator("#count").textContent()).toBe("3");
    const third = await frameOf(watcher, 3);
    await third.waitForFunction("window.ready === true");
    await third.locator("#live-doc").click();
    await third.waitForFunction("window.got.sync !== undefined");
    expect(await evaluate(third, "[window.got.edit.code, window.got.sync.code]")).toEqual([
      "capability_disabled",
      "capability_disabled",
    ]);
  }, 60_000);

  test("L18 artifact.publish(files) keeps the saving view running and moves the others", async () => {
    const w = wire();
    const source = `<title>Notebook</title><p id="doc"></p>
      <button id="save">Save</button><button id="pinned">Pinned save</button><button id="stale">Stale pin</button>
      <script>
        window.bootedAt = performance.timeOrigin;
        window.got = {};
        let rev = 0;
        const settle = (key, promise) => promise.then(
          (value) => (window.got[key] = { value }),
          (error) => (window.got[key] = { code: error.code, paths: error.paths }),
        );
        fetch("data/doc.json").then((r) => r.json()).then((doc) => {
          rev = doc.rev;
          document.getElementById("doc").textContent = "rev " + doc.rev;
        });
        claude.use("artifact").then((artifact) => {
          const click = (id, fn) => (document.getElementById(id).onclick = fn);
          click("save", () => {
            rev += 1;
            settle("save" + rev, artifact.publish({
              "data/doc.json": JSON.stringify({ rev }),
              "img/dot.gif": new Blob([Uint8Array.from(atob("${Buffer.from(GIF).toString("base64")}"), (c) => c.charCodeAt(0))], { type: "image/gif" }),
            }));
          });
          click("pinned", () => settle("pinned", artifact.publish({
            "notes.txt": { content: "pinned note", ifMatch: null },
          })));
          click("stale", () => settle("stale", artifact.publish({
            "notes.txt": { content: "overwrite", ifMatch: "0".repeat(64) },
          })));
          window.ready = true;
        });
      </script>`;
    const slug = await publish(w, source, {
      capabilities: { artifact: {} },
      files: { "data/doc.json": upload(JSON.stringify({ rev: 1 })) },
    });
    const saver = await view(w, slug);
    const other = await view(w, slug);
    const frame = await frameOf(saver, 1);
    await frame.waitForFunction("window.ready === true");
    const booted = await evaluate(frame, "window.bootedAt");

    await frame.locator("#save").click();
    await frame.waitForFunction("window.got.save2 !== undefined");
    expect(await evaluate(frame, "window.got.save2")).toEqual({ value: { version: "2" } });
    // The others move to v2 and read the saved file; this view is the same document still.
    const moved = await frameOf(other, 2);
    await moved.locator("#doc").filter({ hasText: "rev 2" }).waitFor();
    const gif = await w.frame(slug, `/_f/${w.cap(slug)}/2/img/dot.gif`);
    expect(new Uint8Array(await gif.arrayBuffer())).toEqual(GIF);

    // Its next save builds on the version it made: no conflict, v3.
    await frame.locator("#save").click();
    await frame.waitForFunction("window.got.save3 !== undefined");
    expect(await evaluate(frame, "window.got.save3")).toEqual({ value: { version: "3" } });
    await (await frameOf(other, 3)).locator("#doc").filter({ hasText: "rev 3" }).waitFor();
    expect(await evaluate(frame, "window.bootedAt")).toBe(booted);
    expect(saver.frames().filter((f) => /\/_f\/[a-f0-9]{32}\//.test(f.url()))).toHaveLength(1);
    expect(await saver.locator("#version-picker option").first().textContent()).toContain("v3");

    await frame.locator("#pinned").click();
    await frame.waitForFunction("window.got.pinned !== undefined");
    const pinned = (await evaluate(frame, "window.got.pinned")) as {
      value: { version: string; shas: Record<string, string>; changed: unknown[] };
    };
    expect(pinned.value).toMatchObject({ version: "4", changed: [] });
    expect(pinned.value.shas["notes.txt"]).toMatch(/^[a-f0-9]{64}$/);

    await frame.locator("#stale").click();
    await frame.waitForFunction("window.got.stale !== undefined");
    expect(await evaluate(frame, "window.got.stale")).toEqual({
      code: "conflict",
      paths: [
        { path: "notes.txt", expected: "0".repeat(64), actual: pinned.value.shas["notes.txt"] },
      ],
    });
    expect((await manifestOf(w, slug)).current).toBe(4);
  }, 60_000);

  test("L19 under sandbox isolation the capabilities are served over the same bridge", async () => {
    const w = wire({ isolation: "sandbox" });
    const slug = await publish(
      w,
      `<!doctype html><html><head><title>Boxed</title></head><body>
      <img id="dot" src="dot.gif" alt=""><p id="words">first</p>
      <button id="save">Save</button><button id="publish">Publish</button>
      <script>
        window.got = {};
        const settle = (key, promise) => promise.then(
          (value) => (window.got[key] = { value }),
          (error) => (window.got[key] = { code: error.code }),
        );
        Promise.all(["permissions", "downloads", "artifact", "mcp"].map((n) => claude.use(n))).then(
          async ([permissions, downloads, artifact, mcp]) => {
            window.got.mcp = mcp;
            window.got.states = await permissions.state();
            document.getElementById("save").onclick = () =>
              settle("save", downloads.save({ filename: "boxed.txt", data: new Blob(["boxed"]) }));
            document.getElementById("publish").onclick = () =>
              settle("publish", artifact.publish('<!doctype html><title>Boxed</title><p id="words">second</p>'));
            window.ready = true;
          },
        );
      </script></body></html>`,
      {
        capabilities: { downloads: {}, artifact: {}, mcp: {} },
        files: { "dot.gif": upload(GIF) },
      },
    );
    const page = await view(w, slug);
    const frame = await frameOf(page);
    await frame.waitForFunction("window.ready === true");
    expect(await evaluate(frame, "[window.got.mcp, window.got.states]")).toEqual([
      null,
      { permissions: "granted", downloads: "granted", artifact: "granted" },
    ]);
    expect(await evaluate(frame, 'document.getElementById("dot").naturalWidth')).toBe(1);
    await frame.locator("#save").click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#save-confirm").click(),
    ]);
    expect(readFileSync(await download.path(), "utf8")).toBe("boxed");
    await frame.locator("#publish").click();
    expect(await (await frameOf(page, 2)).locator("#words").textContent()).toBe("second");
  }, 45_000);

  test("L20 a db write in one view reaches onSnapshot in another, and the tool reads and writes the same rows", async () => {
    const w = wire();
    await w.run({
      file_path: w.file(
        "board.html",
        `<title>Shared Board</title><button id="add">Add</button><button id="drop">Drop</button>
        <script>
          window.seen = { lists: [], changes: [], titles: [], frozen: [], kept: [] };
          claude.use("db").then((db) => {
            const tasks = db.collection("tasks");
            let first = null;
            tasks.orderBy("rank").onSnapshot((snap) => {
              window.seen.lists.push(snap.docs.map((doc) => doc.id + ":" + doc.data().title));
              window.seen.changes.push(snap.docChanges().map((c) =>
                [c.type, c.doc.id, c.oldIndex, c.newIndex, c.doc.exists && c.doc.data().title].join(" ")));
              window.seen.frozen.push(Object.isFrozen(snap) && Object.isFrozen(snap.docs) &&
                snap.docs.every((doc) => Object.isFrozen(doc) && Object.isFrozen(doc.data())));
              const t1 = snap.docs.find((doc) => doc.id === "t1");
              if (t1 && first) window.seen.kept.push(t1 === first);
              if (t1 && !first) first = t1;
            });
            db.doc("tasks/t1").onSnapshot((snap) => window.seen.titles.push(snap.exists ? snap.data().title : null));
            document.getElementById("add").onclick = () => tasks.doc("t1").set({ title: "from view one", rank: 5 });
            document.getElementById("drop").onclick = () => db.doc("tasks/t2").delete();
            window.ready = true;
          });
        </script>`,
      ),
      capabilities: { db: {} },
    });
    const one = await frameOf(await view(w, "shared-board"));
    const two = await frameOf(await view(w, "shared-board"));
    for (const frame of [one, two]) {
      await frame.waitForFunction("window.ready === true && window.seen.lists.length === 1");
      expect(await evaluate(frame, "[window.seen.lists, window.seen.titles]")).toEqual([
        [[]],
        [null],
      ]);
    }

    await one.locator("#add").click();
    await two.waitForFunction("window.seen.lists.length === 2");
    expect(await evaluate(two, "window.seen.lists[1]")).toEqual(["t1:from view one"]);
    await two.waitForFunction("window.seen.titles.length === 2");
    expect(await evaluate(two, "window.seen.titles")).toEqual([null, "from view one"]);
    const read = await w.runData({
      url: "shared-board",
      action: "get",
      collection: "tasks",
      doc_id: "t1",
    });
    expect(read.text).toContain("from view one");
    expect(read.text).toMatch(/version 1\b/);

    // The agent writes a row that sorts first, then edits the viewer's in place, pinned to what it read.
    const doc = { url: "shared-board", collection: "tasks" };
    await w.runData({
      ...doc,
      action: "set",
      doc_id: "t2",
      data: { title: "from the agent", rank: 1 },
    });
    await w.runData({
      ...doc,
      action: "str_replace",
      doc_id: "t1",
      field: "title",
      old_str: "view one",
      new_str: "both",
      if_version: 1,
    });
    for (const frame of [one, two]) {
      await frame.waitForFunction("window.seen.lists.length === 4");
      expect(await evaluate(frame, "window.seen.lists.slice(2)")).toEqual([
        ["t2:from the agent", "t1:from view one"],
        ["t2:from the agent", "t1:from both"],
      ]);
    }
    await two.locator("#drop").click();
    await one.waitForFunction("window.seen.lists.length === 5");
    expect(await evaluate(one, "window.seen")).toEqual({
      lists: [
        [],
        ["t1:from view one"],
        ["t2:from the agent", "t1:from view one"],
        ["t2:from the agent", "t1:from both"],
        ["t1:from both"],
      ],
      changes: [
        [],
        ["added t1 -1 0 from view one"],
        ["added t2 -1 0 from the agent"],
        ["modified t1 1 1 from both"],
        ["removed t2 0 -1 from the agent"],
      ],
      titles: [null, "from view one", "from both"],
      frozen: [true, true, true, true, true],
      // Unchanged while t2 arrived, a new object once it was edited, unchanged again when t2 left.
      kept: [true, false, false],
    });
  }, 60_000);

  test("L21 db as a page author meets it: queries, merges, refusals and leases", async () => {
    const w = wire();
    const source = `<title>Db Verbs</title><script>
      window.got = {};
      const settle = (key, promise) => promise.then(
        (value) => (window.got[key] = { value }),
        (error) => (window.got[key] = { code: error.code }),
      );
      const thrown = (fn) => { try { fn(); return null; } catch (e) { return e.name; } };
      claude.use("db").then(async (db) => {
        window.got.db = db && { frozen: Object.isFrozen(db), verbs: Object.keys(db).sort() };
        if (!db) return (window.done = true);
        const people = db.collection("people");
        await Promise.all([
          people.doc("ann").set({ age: 31, team: "red" }),
          people.doc("bob").set({ age: 25, team: "blue" }),
          people.doc("cy").set({ age: 40, team: "red" }),
          people.doc("di").set({ age: 52, team: "red" }),
        ]);
        const found = await people.where("team", "==", "red").where("age", ">", 30).orderBy("age", "desc").limit(2).get();
        window.got.query = { ids: found.docs.map((doc) => doc.id), size: found.size, empty: found.empty,
          changes: found.docChanges().map((c) => c.type + c.newIndex), meta: found.metadata };
        window.got.builders = people.where("team", "==", "red") !== people.where("team", "==", "red");
        const made = await people.add({ age: 1, team: "new" });
        window.got.added = { idLength: made.id.length, path: made.path === "people/" + made.id,
          read: (await made.get()).data() };
        await people.doc("ann").update({ team: { __delete__: true }, tags: { first: true } });
        await people.doc("ann").update({ tags: { second: true } });
        const ann = await db.doc("people/ann").get();
        window.got.merged = { id: ann.id, exists: ann.exists, data: ann.data(), meta: ann.metadata };
        const pets = db.doc("people/ann").collection("pets");
        await pets.doc("rex").set({ kind: "dog" });
        window.got.nested = [pets.path, (await pets.get()).docs.map((doc) => doc.id)];
        const ghost = await db.doc("people/ghost").get();
        window.got.ghost = [ghost.exists, ghost.data() === undefined];
        window.got.thrown = [
          thrown(() => db.doc("people")), thrown(() => db.collection("people/ann")),
          thrown(() => db.doc("people/a b")), thrown(() => people.doc("x/y")),
          thrown(() => db.doc("people/ann").collection("pets/rex")), thrown(() => db.doc("people/ann")),
        ];
        await settle("updateMissing", db.doc("people/ghost").update({ a: 1 }));
        await settle("setList", db.doc("people/list").set([1]));
        await settle("setSentinel", db.doc("people/s").set({ a: { __delete__: true } }));
        await settle("badQuery", people.where("age", "~", 1).get());
        await settle("twoOrders", people.orderBy("age").orderBy("team").get());
        await settle("limitZero", people.limit(0).get());
        await settle("uncloneable", people.where("age", "==", () => 1).get());
        window.got.listenerErrors = [];
        people.where("age", "~", 1).onSnapshot(
          () => window.got.listenerErrors.push("next"),
          (error) => window.got.listenerErrors.push(error.code),
        );
        const lock = db.doc("locks/editor");
        const mine = await lock.acquire({ holder: "tab-a", ttlMs: 60000, data: { by: "a" } });
        const theirs = await lock.acquire({ holder: "tab-b" });
        const again = await lock.acquire({ holder: "tab-a" });
        window.got.lease = { mine: [mine.acquired, mine.holder, mine.version, typeof mine.expiresAt],
          theirs, sameExpiry: theirs.expiresAt === mine.expiresAt, again: [again.acquired, again.version],
          body: (await lock.get()).data() };
        // One listener stays for the test to write to; seventy more ask for the sixty-three places left.
        window.got.mine = [];
        db.doc("data/users/me/prefs").onSnapshot((snap) => window.got.mine.push(snap.exists ? snap.data().theme : null));
        const overflow = [];
        const stops = Array.from({ length: 70 }, (_, k) =>
          db.doc("caps/d" + k).onSnapshot(() => {}, (error) => overflow.push(error.code)));
        await new Promise((resolve) => setTimeout(resolve, 300));
        window.got.overflow = overflow;
        stops.forEach((stop) => stop());
        window.got.freed = await new Promise((resolve) => db.doc("caps/free").onSnapshot((snap) => resolve(snap.exists)));
        window.done = true;
      });
    </script>`;
    const slug = await publish(w, source, { capabilities: { db: {} } });
    const frame = await frameOf(await view(w, slug));
    await frame.waitForFunction("window.done === true && window.got.listenerErrors.length > 0");
    const got = (await evaluate(frame, "window.got")) as Record<string, unknown>;
    expect(got).toMatchObject({
      db: { frozen: true, verbs: ["collection", "doc"] },
      query: {
        ids: ["di", "cy"],
        size: 2,
        empty: false,
        changes: ["added0", "added1"],
        meta: { fromCache: false, hasPendingWrites: false },
      },
      builders: true,
      added: { idLength: 20, path: true, read: { age: 1, team: "new" } },
      merged: {
        id: "ann",
        exists: true,
        data: { age: 31, tags: { first: true, second: true } },
        meta: { fromCache: false, hasPendingWrites: false },
      },
      nested: ["people/ann/pets", ["rex"]],
      ghost: [false, true],
      thrown: ["TypeError", "TypeError", "TypeError", "TypeError", "TypeError", null],
      updateMissing: { code: "invalid_argument" },
      setList: { code: "invalid_argument" },
      setSentinel: { code: "invalid_argument" },
      badQuery: { code: "invalid_argument" },
      twoOrders: { code: "invalid_argument" },
      limitZero: { code: "invalid_argument" },
      uncloneable: { code: "transform_error" },
      listenerErrors: ["invalid_argument"],
      lease: {
        mine: [true, "tab-a", 1, "string"],
        sameExpiry: true,
        again: [true, 1],
        body: { by: "a" },
      },
    });
    const lease = got.lease as { theirs: Record<string, unknown> };
    expect(Object.keys(lease.theirs).sort()).toEqual(["acquired", "expiresAt"]);
    expect(lease.theirs.acquired).toBe(false);
    expect([got.overflow, got.freed]).toEqual([Array(7).fill("resource_exhausted"), false]);
    // The viewer's own subtree has one name for the page and the tool: a write to `me` reaches the listener on `me`.
    await w.runData({
      url: slug,
      action: "set",
      collection: "data/users/me",
      doc_id: "prefs",
      data: { theme: "dark" },
    });
    await frame.waitForFunction("window.got.mine.length === 2");
    expect(await evaluate(frame, "window.got.mine")).toEqual([null, "dark"]);
    // What the page wrote is what the session's tool reads.
    const rows = await w.runData({
      url: slug,
      action: "query",
      collection: "people",
      query: { where: [["team", "eq", "red"]], order_by: { field: "age" } },
    });
    expect(rows.text).toMatch(/people\/cy[\s\S]*people\/di/);
    expect(rows.text).not.toContain("people/ann");

    const bare = await publish(w, source.replace("Db Verbs", "No Db"));
    const bareFrame = await frameOf(await view(w, bare));
    await bareFrame.waitForFunction("window.done === true");
    expect(await evaluate(bareFrame, "window.got.db")).toBeNull();
  }, 60_000);

  // A page that uploads what it is handed, shows it, and keeps the id where a later version finds it.
  const PHOTO_WALL = `<title>Photo Wall</title><img id="restored" alt=""><div id="styled"></div>
    <script>
      window.got = {};
      window.refused = [];
      document.addEventListener("securitypolicyviolation", (e) => window.refused.push(e.violatedDirective));
      const settle = (key, promise) => promise.then(
        (value) => (window.got[key] = { value }),
        (error) => (window.got[key] = { code: error.code }),
      );
      const bytes = Uint8Array.from(atob("${Buffer.from(GIF).toString("base64")}"), (c) => c.charCodeAt(0));
      const shown = (src) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth);
        img.onerror = () => resolve("failed");
        img.src = src;
      });
      const loaded = (tag, attributes) => new Promise((resolve) => {
        const el = Object.assign(document.createElement(tag), attributes);
        el.onload = () => resolve(true);
        el.onerror = () => resolve(false);
        document.head.appendChild(el);
      });
      Promise.all([claude.use("assets"), claude.use("db")]).then(async ([assets, db]) => {
        window.got.assets = assets && { frozen: Object.isFrozen(assets), verbs: Object.keys(assets).sort() };
        const kept = await db.doc("wall/latest").get();
        if (kept.exists) {
          window.got.restored = await shown("/_blob/" + kept.data().photo);
          return (window.done = true);
        }
        const photo = await assets.upload(new Blob([bytes], { type: "image/gif" }));
        window.got.photo = { ...photo, idOk: /^[a-f0-9]{32}$/.test(photo.id), urlOk: photo.url === "/_blob/" + photo.id };
        window.got.rendered = await shown(photo.url);
        await db.doc("wall/latest").set({ photo: photo.id });
        const sheet = await assets.upload(new Blob(["#styled{width:77px}"]), { type: "text/css" });
        const script = await assets.upload(new File(["window.fromAsset = 42;"], "app.js", { type: "text/javascript" }));
        const rows = await assets.upload(new Blob(['{"rows":[1,2]}'], { type: "application/json" }));
        const drawing = await assets.upload(new Blob([
          '<svg xmlns="http://www.w3.org/2000/svg" width="3" height="3" onload="window.top.postMessage(1, \\'*\\')">' +
          '<script>document.documentElement.setAttribute("data-ran", "1")</' + 'script><rect width="3" height="3"/></svg>',
        ], { type: "image/svg+xml" }));
        window.got.took = [
          await loaded("link", { rel: "stylesheet", href: sheet.url }) && getComputedStyle(document.getElementById("styled")).width,
          await loaded("script", { src: script.url }) && window.fromAsset,
          await (await fetch(rows.url)).json(),
          await shown(drawing.url),
          /script|onload/i.test(await (await fetch(drawing.url)).text()),
        ];
        const listed = await assets.list();
        window.got.list = {
          ids: listed.assets.map((a) => a.id),
          expected: [photo, sheet, script, rows, drawing].map((a) => a.id),
          first: listed.assets[0],
          usage: listed.usage,
          bytes: [photo, sheet, script, rows, drawing].reduce((sum, a) => sum + a.sizeBytes, 0),
        };
        await settle("notBlob", assets.upload("just text"));
        await settle("empty", assets.upload(new Blob([])));
        await settle("noType", assets.upload(new Blob(["x"])));
        await settle("alias", assets.upload(new Blob(["x"], { type: "application/javascript" })));
        await settle("outside", assets.upload(new Blob(["<p>x</p>"], { type: "text/html" })));
        await settle("badRef", assets.delete("not-an-id"));
        window.got.deleted = [await assets.delete(sheet.id), await assets.delete(sheet.url), await shown(sheet.url)];
        window.done = true;
      });
    </script>`;

  test("L22 assets.upload stores what the page hands it, and /_blob/<id> serves it to every version", async () => {
    const w = wire();
    const slug = await publish(w, PHOTO_WALL, { capabilities: { assets: {}, db: {} } });
    const page = await view(w, slug);
    const frame = await frameOf(page);
    await frame.waitForFunction("window.done === true");
    const got = (await evaluate(frame, "window.got")) as Record<string, unknown>;
    expect(got).toMatchObject({
      assets: { frozen: true, verbs: ["delete", "list", "upload"] },
      photo: { idOk: true, urlOk: true, sizeBytes: GIF.byteLength, contentType: "image/gif" },
      rendered: 1,
      took: ["77px", 42, { rows: [1, 2] }, 3, false],
      notBlob: { code: "invalid_request" },
      empty: { code: "invalid_request" },
      noType: { code: "invalid_request" },
      alias: { code: "unsupported_type" },
      outside: { code: "unsupported_type" },
      badRef: { code: "invalid_request" },
      deleted: [{ deleted: true }, { deleted: false }, "failed"],
    });
    const list = got.list as {
      ids: string[];
      expected: string[];
      first: Record<string, unknown>;
      usage: Record<string, number>;
      bytes: number;
    };
    expect(list.ids).toEqual(list.expected);
    expect(Object.keys(list.first).sort()).toEqual([
      "contentType",
      "createdAt",
      "id",
      "sizeBytes",
      "url",
    ]);
    expect(list.usage).toEqual({
      files: 5,
      bytes: list.bytes,
      maxFiles: 1000,
      maxBytes: 256 * 1024 * 1024,
    });
    expect(await evaluate(frame, "window.refused")).toEqual([]);
    // The SVG's handler had a message for the shell, and its script a mark for itself: neither happened.
    expect(await evaluate(frame, 'document.documentElement.getAttribute("data-ran")')).toBeNull();

    // A later version finds the id in the database and the asset where it was.
    await publish(w, PHOTO_WALL, { update: slug });
    const second = await frameOf(page, 2);
    await second.waitForFunction("window.done === true");
    expect(await evaluate(second, "window.got.restored")).toBe(1);

    // Sandboxed, the page's origin is opaque, so it shows what it uploads with elements, not fetch.
    const boxed = wire({ isolation: "sandbox" });
    const boxedSlug = await publish(
      boxed,
      `<title>Boxed Wall</title><script>
        claude.use("assets").then(async (assets) => {
          const bytes = Uint8Array.from(atob("${Buffer.from(GIF).toString("base64")}"), (c) => c.charCodeAt(0));
          const photo = await assets.upload(new Blob([bytes], { type: "image/gif" }));
          const img = new Image();
          img.onload = img.onerror = async () =>
            (window.seen = [img.naturalWidth, (await assets.list()).usage.files]);
          img.src = photo.url;
        });
      </script>`,
      { capabilities: { assets: {} } },
    );
    const boxedFrame = await frameOf(await view(boxed, boxedSlug));
    await boxedFrame.waitForFunction("window.seen !== undefined");
    expect(await evaluate(boxedFrame, "window.seen")).toEqual([1, 1]);
  }, 90_000);

  test("L23 a typed artifact is filled through files, and the type's own paths are refused", async () => {
    const w = wire();
    w.file(
      ".pi/artifact-types/checklist/type.json",
      JSON.stringify({ title: "Checklist", description: "Items read from data/items.json" }),
    );
    w.file(
      ".pi/artifact-types/checklist/index.html",
      `<!doctype html><html><head><title>Checklist Type</title></head><body>
       <ul id="items"></ul><button id="html">Html</button><button id="theirs">Theirs</button><button id="own">Own</button>
       <script src="render.js"></script></body></html>`,
    );
    w.file(
      ".pi/artifact-types/checklist/render.js",
      `window.got = {};
       const settle = (key, promise) => promise.then(
         (value) => (window.got[key] = { value }),
         (error) => (window.got[key] = { code: error.code }),
       );
       fetch("data/items.json").then((r) => (r.ok ? r.json() : [])).then((items) => {
         document.getElementById("items").innerHTML = items.map((item) => "<li>" + item + "</li>").join("");
         window.rendered = items.length;
       });
       claude.use("artifact").then((artifact) => {
         const click = (id, fn) => (document.getElementById(id).onclick = fn);
         click("html", () => settle("html", artifact.publish("<!doctype html><title>Mine</title><p>mine</p>")));
         click("theirs", () => settle("theirs", artifact.publish({ "render.js": "evil()", "data/items.json": "[]" })));
         click("own", () => settle("own", artifact.publish({ "data/items.json": JSON.stringify(["from the page"]) })));
         window.ready = true;
       });`,
    );
    const made = await w.run({
      type: "checklist",
      title: "Launch Checklist",
      capabilities: { artifact: {} },
    });
    expect(made.details).toMatchObject({ slug: "launch-checklist", version: 1 });
    const page = await view(w, "launch-checklist");
    await page.locator("#title-text").filter({ hasText: "Launch Checklist" }).waitFor();
    const first = await frameOf(page, 1);
    await first.waitForFunction("window.ready === true && window.rendered === 0");

    // The session fills it: only files, to its url. The open view moves to v2 and the type's script draws them.
    const filled = await w.run({
      url: "launch-checklist",
      files: { "data/items.json": w.file("items.json", '["book the venue","send invites"]') },
    });
    expect(filled.details).toMatchObject({ version: 2 });
    const second = await frameOf(page, 2);
    await second.waitForFunction("window.ready === true && window.rendered === 2");
    expect(await second.locator("#items li").allTextContents()).toEqual([
      "book the venue",
      "send invites",
    ]);

    await second.locator("#html").click();
    await second.locator("#theirs").click();
    await second.waitForFunction(
      "window.got.html !== undefined && window.got.theirs !== undefined",
    );
    expect(await evaluate(second, "[window.got.html, window.got.theirs]")).toEqual([
      { code: "read_only_path" },
      { code: "read_only_path" },
    ]);
    expect((await manifestOf(w, "launch-checklist")).current).toBe(2);
    await expect(
      w.run({ url: "launch-checklist", files: { "render.js": w.file("evil.js", "evil()") } }),
    ).rejects.toThrow(/read.only/);

    await second.locator("#own").click();
    await second.waitForFunction("window.got.own !== undefined");
    expect(await evaluate(second, "window.got.own")).toEqual({ value: { version: "3" } });
    const saved = await w.frame(
      "launch-checklist",
      `/_f/${w.cap("launch-checklist")}/3/data/items.json`,
    );
    expect(await saved.json()).toEqual(["from the page"]);
    const script = await w.frame(
      "launch-checklist",
      `/_f/${w.cap("launch-checklist")}/3/render.js`,
    );
    expect(await script.text()).toContain("claude.use");
  }, 60_000);
});
