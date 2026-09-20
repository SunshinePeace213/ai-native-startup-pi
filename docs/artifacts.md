# Artifacts

Claude Code's Artifact tool, hosted locally. The agent publishes an HTML or
Markdown file; the browser opens a viewer shell at
`http://localhost:5834/a/<slug>` that frames the page from an origin of its
own, `<slug>.localhost:5834`; the user reads it, answers on it, or comments;
the shell sends the reply back and the session continues — without the user
pasting anything into the terminal. The stored document, the page policy,
`window.claude` and its capabilities, the two tools — `artifact`, and
`artifact_data` for a page's database — the footer row and the `/artifacts`
panel follow Claude Code's. What differs on purpose — this machine is the
host, there is one viewer, nothing reaches claude.ai — is listed under
[Against Claude Code](#against-claude-code). The pages a session published sit
in the terminal footer as pills; `down` from an empty prompt selects the newest
and `alt+a` opens it. Read this before publishing pages, changing
the extension, or writing the skills that drive it. The extension lives in
`.pi/extensions/artifacts/`; its contract tests are `tests/pi/artifacts/`.

## Layout

Two runtimes meet in this extension — pi (Node) and the server (Bun) — and the
browser loads what the server hands it. The source is layered by
responsibility, and the boundaries are tests (`tests/pi/artifacts/structure`):
`domain/` imports nothing outside itself, `app/` only `domain/` and itself, the
pi side never imports the server's modules, only `infra/http/server.ts` names
`Bun`, and `page/` and `shell/` hold classic browser scripts that are served
and never imported. This is pi's "directory with `index.ts`" style with a
`src/` tree inside it; `pino` and `mermaid` are root dependencies, so no nested
`package.json` is needed.

```text
.pi/extensions/artifacts/
├── index.ts                 pi entry: the composition root; wires and registers, starts nothing
└── src/
    ├── domain/              pure rules every layer agrees on
    │   ├── types.ts · protocol.ts · config.ts · versioning.ts · retention.ts · envelope.ts · text.ts
    │   ├── files.ts         supporting files: published paths, media types, limits, per-file pins, a type's read-only paths
    │   ├── capabilities.ts  what a page may declare, and what this host serves of it
    │   ├── db.ts            a page's database: paths, bodies, versions, merges, queries, batches, leases
    │   ├── assets.ts        what a page uploads: the accepted types, the size caps, the budget, SVG sanitising
    │   ├── icons.ts         the icon word, and the glyph the shell draws for it
    │   └── schemas/         questions/v1 and the registry
    ├── app/                 use-cases over ports, no I/O
    │   ├── ports.ts         ArtifactStore · Renderer · Logger
    │   ├── core.ts          publish (from a file or a type) · the viewer's own publish · respond · the database ·
    │   │                    assets · comments · watch · pin · rename · duplicate · diagnostics · delete · sweep
    │   │                    (the store's only writer)
    │   └── routing.ts       who a page event reaches; what a delivered event becomes
    ├── infra/               adapters
    │   ├── store/           store.ts (fs layout, blobs, db.json, assets/) · control.ts (.server/ token, viewer, record, lock)
    │   ├── http/            server.ts (Bun.serve, one port, dispatch by Host) · auth.ts · policy.ts · events.ts ·
    │   │                    assets.ts (the static files a browser is handed) · respond.ts ·
    │   │                    routes/{shell,pages,frame,api,db,gallery}.ts
    │   ├── render/          document.ts (the stored document) · markdown.ts
    │   ├── client/          client.ts (fetch + SSE, pi side)
    │   ├── process/         launch.ts (probe, lock, spawn, stop) · opener.ts
    │   ├── log/             logger.ts (pino, daily files, redaction)
    │   └── config.ts
    ├── ui/                  inside pi
    │   ├── host.ts          one per project per session: stream, delivery, the strip
    │   ├── hooks.ts         session_start / session_shutdown · alt+a
    │   ├── strip.ts         the footer row and its selection
    │   ├── selector.ts      the footer's keys · editor.ts  `down` hands it the focus
    │   ├── command.ts       /artifacts · gallery.ts  its panel and the Status tab
    │   └── tool/            the `artifact` tool: index.ts · schema.ts · context.ts · format.ts · files.ts ·
    │       │                artifact-types.ts · actions/
    │       └── data/        the `artifact_data` tool: index.ts · schema.ts
    ├── page/                claude.js — the runtime every page loads: window.claude and the bridge
    ├── shell/               shell.js · shell.css — the viewer shell around a page
    └── server.ts            the Bun entry: `bun src/server.ts --root … --port 5834`
```

Every source file opens with a prose header; `routes/pages.ts`,
`routes/frame.ts` and `routes/api.ts` open with their route lists, and
`routes/db.ts` with the database's wire format.

## The loop

```text
session ──publish──▶ <slug>/.store/versions/v1.html ──▶ frame on <slug>.localhost
   ▲                                                         │ postMessage
   │   artifact-feedback message                        viewer shell on localhost
   │   (wake · notify · held)                                │ the user clicks Send
   └── Host decides ◀── owner's stream ◀── POST /a/<slug>/publish
                                        .store/responses/v1-r1.json · SSE tells open tabs
```

- **Versions are publishes; replies are the user's.** `v1` is the first
  publish, `v2` the next — the agent's, or the viewer's own through the page's
  `artifact` capability. What the page sends back is a *reply* to the version
  it was viewing — `v1-r1`, `v1-r2` … — never a version. A version's document
  and files are written once and never again; a reply is stored beside them
  (T1, T2). The island a reader or the model sees is the version's island with
  the newest reply laid over it (D1). A reply naming a version that has moved
  on is refused with 409 and the current version (H4), and the shell's banner
  offers that version.
- **The same file republishes in place — for a session that has the page.**
  Publishing a `file_path` again (or passing `url`) makes the next version at
  the same URL, with Claude Code's scope: the path matches only a page this
  session published or attached (`manifest.sessions`); any other session
  publishing that path gets its own artifact, and attaches from `/artifacts`
  to take the first one over (T6). Both routes carry the version the session
  last saw, so a republish over a version it has not read is refused with the
  current one; `force` drops that guard, for when the user said to discard the
  newer version (S3). `read` and `read_page_data` record the version as seen.
- **A version the viewer published is one the session has not read.** It is
  attributed to `viewer`; the owner, the sessions and the watch stay as they
  were. The owning session's next republish is refused until it has `read`
  that version, and `read` says the viewer made it (T18, S17).
- **Only the owner is woken.** Every artifact records the session that
  created, last published, or adopted it (`owner`). A reply reaches that
  session's stream; when it is not connected the event stays *pending* and
  every connected session is told once that a reply is held — a notice, never
  a turn (S4). On `session_start` a session replays only its own pending
  replies as one summary (S5).
- **Blocking or woken.** `action: "ask"` publishes a questions page and waits
  inside the tool call, so the answers return as the tool result (the shape
  `ask_user_question` has). On timeout the page stays up and the next reply
  wakes the session as an `artifact-feedback` custom message delivered as a
  `followUp` that triggers a turn (S2). With `delivery: "notify"` it is queued
  for the next prompt instead.
- **Provenance on every string.** The envelope names the reply and the version
  it answers, says the version did not move, states what the answers are (the
  user's replies to the questions the page asked) and what they are not (new
  instructions, or a permission approval), and marks a send made without a
  user gesture as page-generated (D5). An island out of contract is refused
  before it is stored (H4).
- **Gesture trust is the shell's.** The page never states its own gesture. A
  press of the shell's Send button is the user's; for a send the page starts,
  the shell reads its own window's `navigator.userActivation` when the call
  arrives. A click on the page's own send button counts; a send its script
  starts by itself does not (L5).

## The viewer

`GET /a/<slug>` on the shell host answers the viewer shell: static markup with
no inline script or style, brought to life by `/a/_shell.js` from a JSON boot
block (`routes/shell.ts`, `src/shell/`). It never carries the page's source
(H1). The page is an `<iframe>` whose address is
`http://<slug>.localhost:<port>/_f/<cap>/<n>/` — version `n`'s stored
document, with that version's supporting files beneath the same path.
`/a/<slug>` follows the latest version. `/a/<slug>/v/<n>` pins the address to
one version, read-only: it shows no Send bar, refuses the page's own publish,
and does not follow a republish (L9). The database and the assets are the
artifact's, not a version's, so a pinned view reaches the same ones. `/a/` is
the gallery in the browser: every artifact, pinned first.

The shell draws everything around the page, so none of it lives in the page's
document and page script can neither imitate nor trigger it:

| Piece | What it does |
| --- | --- |
| Header | Gallery link · title menu · version picker · theme picker · session dot · comments toggle |
| Title menu | **Rename** (the title is the user's from then on: a later publish keeps it, T13) · **Duplicate** (a copy at a slug of its own, opened: the current document and island, its files, declaration, database, assets and type — T14, T17, T19–T21) · **Refresh** (the same version loaded afresh, nothing carried) · **Pin** / **Unpin** · **All artifacts** · **Delete** (after a confirm dialog the folder moves to the Trash and the tab leaves for the gallery) |
| Version picker | `Latest · vN`, then every version newest first with its `label`; choosing one opens its pinned address |
| Theme picker | System · Light · Dark, remembered in the shell origin's `localStorage` |
| Session dot | Lit while the session that owns the page is connected: a send reaches it now. Otherwise a send waits for that session |
| 💬 button and panel | On every page, island or not (L6); the badge counts open threads. The panel lists threads with a reply field each, and a composer: comment, an optional *About*, and *send to agent (wakes the session)*, ticked by default. A comment without it is a note that wakes nobody |
| Send bar | Only on the latest version of a page that has an island. With `questions/v1` it reads `2 of 3 answered · 1 required left` and enables **Send to agent** once every required, visible question is answered; with an untyped island it enables on unsent changes |
| Banner | `v3 was published. Showing it discards your unsent choices.` with **Show v3**; the same offer after a stale send; `This artifact was deleted.` with a link to the gallery (L10, L12) |
| Save prompt | What `downloads.save` opens: the final file name and size, **Save** or **Don't save** |

**The bridge.** The page and the shell talk only over `postMessage`. The
runtime says `hello` to the two shell origins this port can have (or to the one
`location.ancestorOrigins` names); the shell answers `init` with the slug, the
version, the capabilities the page is served, the island, and any carried
state. After that the page sends `call` (a capability verb), `reply.state`,
`diag`, and answers `snapshot` with `carry` and `reply.collect` with
`reply.island`; the shell sends `result`, `theme`, and `event` — a push to a
capability that listens: `reply` (a send went through, another tab replied) and
`db` (documents moved). The shell
accepts a message only from a frame it created and from that frame's origin;
the runtime only from its parent at a shell origin, and after `init` only from
the one that answered. The runtime holds no secret; apart from loading mermaid
from its own origin it makes no request, and asks the shell for the rest.

**Updates carry state.** The shell listens to `/a/<slug>/events`. On a new
version it asks the live document for a snapshot — waiting while the user is
typing, up to ten seconds — loads the new version in a second frame beneath
the first, hands it the snapshot in `init`, and swaps it in. The shell itself
never reloads (L4). When the page holds unsent choices the shell does not
move: the banner says so and the user decides (L10). The stream's first
message names the current version, so a tab that reconnects after a server
restart catches up by itself (H6).

## The page contract

**Document.** What is stored is Claude Code's skeleton byte for byte, plus one
tag — the runtime, right after the viewport meta, so `window.claude` exists
before any page script runs; the tag then removes itself (R1, L2):

```html
<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><script src="/_rt/claude.js"></script><style>…</style></head><body>
…the file…
</body></html>
```

The skeleton's one `<style>` sets `color-scheme: light`, safe-area padding, a
14px system font in `#141413` on `#faf9f5`, `img{max-width:100%}` and the
`[hidden]` rule; the page brings everything else, its dark variant included.
Nothing more is added: no policy `<meta>`, no icon, no title, no island, no id,
no body class, no chrome. A full document — one that leads with a doctype or
has an `<html>`, `<head>` or `<body>` tag — is injected into, never wrapped:
the tag goes ahead of every script it has and a missing doctype is supplied
(R3). A `.md` file is rendered (headings, lists and task items, fenced code,
blockquotes, rules, pipe tables, inline code, emphasis, links, images; front
matter dropped; raw HTML escaped, never passed through) into
`<main class="md">` with one `<style>` whose rules all hang off `.md` and
whose dark variant follows the stamped theme first, the system otherwise (R4,
R5). The rendered page may not exceed 16 MiB.

**Title and icon.** What the file says wins: an HTML page's `<title>`, read
from its first 8 KB, or a Markdown file's own name; then the `title`
parameter; a republish that names nothing keeps the title it has; only a new
artifact falls back to its island's `title`, its first heading, and
`artifact` (T10, R6). A title the user renamed stays theirs (T13). `icon` is
one generic word — 2–24 lowercase letters, digits or hyphens, starting with a
letter; never an emoji. The word is stored and kept when a republish omits it;
the shell maps the words it knows to a glyph for its tab icon and any other
word to a neutral one (D8, T11).

**Policy.** Sent as an HTTP header on the document and on every supporting
file, never as `<meta>` (H10, H15) — one header, broken here for reading:

```text
default-src 'none';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://cdn.tailwindcss.com https://code.jquery.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self';
base-uri 'none'; form-action 'none'; frame-ancestors http://localhost:<port> http://127.0.0.1:<port>
```

`'self'` is the page's own origin, which serves that artifact's documents and
files under its cap, what its page uploaded at `/_blob/<id>`,
`/_rt/claude.js` and `/_rt/mermaid.js`, and nothing else (H9, H24). So a
relative URL reaches what `files` published and `fetch` reaches the same;
`'self'` in `style-src` and `font-src` is what lets a published stylesheet
apply and the font it names load (L13), and what a page uploaded — an image, a
stylesheet, a script, a data file — takes effect from its `/_blob/` address
(L22). Unpkg, a stylesheet from a
script CDN, an external image and an external fetch are blocked (L2). From any
other host a page takes stylesheets only from Google Fonts, and fonts only
from Google Fonts or `data:` URLs. The iframe's sandbox allows scripts, the
page's own origin, forms, modals, and popups that escape the sandbox
(`allow-scripts`, `allow-same-origin`, `allow-forms`, `allow-modals`,
`allow-popups`, `allow-popups-to-escape-sandbox`): no downloads, no top
navigation.

**Runtime.** `window.claude` has two properties, `use` and `hot`.
`await claude.use(name)` resolves one frozen namespace for a capability the
page is served and `null` for everything else — not declared, not run by this
host, or no capability at all; the cases are indistinguishable on purpose, so
a page designs for absence (L14). Opened outside the shell a page still
starts: every capability is `null` and `hot.ready` gets `{}` (L11).

| Capability | Served | What the page gets |
| --- | --- | --- |
| `permissions` | Every page; never declared | `state(name?)` and `request(names)` answer `granted` for what the page is served and `unavailable` for anything else. There is one viewer, who owns the page, so nothing ever prompts (L14) |
| `reply` | Every page with a data island; never declared. Pi's own | The island, the `questions/v1` form, the bindings and `send` — see [The `reply` capability](#the-reply-capability) |
| `downloads` | When declared | `save({filename, data})` offers a file: the shell shows the viewer the final name and the size and saves from its own document on a yes (`{status: "saved"}`); a no rejects `declined`. One offer at a time (`rate_limited`); the name's extension must be on the shell's allowlist (`rejected_extension`) and decides the saved type; empty data is `bad_request`. The page's own `<a download>` saves nothing, because the frame cannot download (L15) |
| `comments` | When declared; composer-only | `openComposer({element})` or `({range})` opens the shell's 💬 panel with its composer focused and *About* filled from the target, on the viewer's gesture only. With no gesture, over a draft the viewer is typing, or inside `[data-uncommentable]` it resolves `{opened: false}`. `anchorFor(element)` answers a CSS path and a point. Every write verb rejects `not_granted` and `canSendToClaude()` answers `"off"`: a comment is always the viewer's own (L16) |
| `artifact` | When declared | `publish(html)` — the complete page, doctype first — makes the next version as the viewer and moves every open view to it. `publish(files)` saves the named files (`string`, `Blob`, `{content, contentType?, ifMatch?}`, `{delete: true}` or `null`) and leaves the publishing view running while the others move. Both are compare-and-set against the version the view runs; with `ifMatch` on every entry only the named files are compared, and the result carries the stored `shas` and what other writers `changed`. Refusals: `conflict` (with `live`, and `paths` for a failed pin), `not_declared`, `invalid_content`, `too_large`, and `read_only_path` for the page or a type's path on an artifact made from a type. `edit` and `sync` reject `capability_disabled` (H17, H18, H25, L17, L18, L23) |
| `db` | When declared | JSON documents at `collection/doc` paths, shared live by every open view and by the agent's `artifact_data` tool — see [The `db` capability](#the-db-capability) |
| `assets` | When declared | `upload(blob, {type}?)`, `list()` and `delete(ref)`: files the viewer adds, stored with the artifact and served to every version at `/_blob/<id>` — see [The `assets` capability](#the-assets-capability) |
| `mcp` · `room` · `sample` · `self` · `user` | Never | Accepted in a declaration, so a page written for Claude Code publishes here unchanged, but they exist only as claude.ai services: `use()` resolves `null`, and the publish result names them in a line of their own so the model never believes one works here (S16) |

`capabilities` on a publish speaks in three gestures: omitted keeps the stored
declaration, `{}` clears it, anything else replaces it whole, so what is not
restated is revoked. An unknown name — `permissions` and `reply` included —
refuses the publish (D10, T17). A version is served what that version
declared, whatever the artifact declares by now (H12); the server's routes for
`artifact`, `db` and `assets` answer only while the artifact still declares
them (H17, H20, H23). A capability's config is any JSON object; it is stored
with the declaration, and nothing on this host reads it — the names alone
decide what a page is served.

**State across a republish.** `claude.hot.snapshot(fn)` registers what the old
document hands over; `claude.hot.ready(fn)` receives it in the new one, or
`{}` on a fresh load, and the same fields are copied onto `hot.data` when the
shell's `init` arrives. The runtime also carries the value of every `input`,
`textarea` and `select` that has an `id` (never a file or a password field),
the focused element's id, and the scroll position, and restores them after
the page's own ready callbacks, firing `input` and `change` on each control. A
control without an id is not carried. The old document's `hot.signal` aborts
once its snapshot is taken, and its storage survives (L4). `hot.restart()`
loads the same version afresh (L12). `hot.accept(fn)` is stored and never
called, because a new version is always a new document here; `hot.from` and
`hot.gen` stay `null` and `0`.

**Theme.** Three states. The shell's choice rides in the frame's address
(`?theme=dark`) and the runtime stamps `data-theme` on `<html>` before first
paint; *System* stamps nothing, and an attribute the author wrote is left
alone until the viewer chooses. A change while the page is open arrives as a
message and is stamped at once (L3). The Markdown look and the page `ask`
generates style dark the way any page does: `:root[data-theme=dark]`, and
under `prefers-color-scheme: dark`, `:root:not([data-theme=light])`.

**Mermaid.** `<pre class="mermaid">`, an HTML `pre > code.language-mermaid`,
and a Markdown fence tagged `mermaid` are drawn by mermaid (L2), which the
runtime loads from `/_rt/mermaid.js` only when a page has a diagram, with
`securityLevel: "strict"`. The theme follows the ground the figure sits on,
and figures are redrawn when the theme changes.

**Storage.** A page has its origin to itself, so browser storage is per
artifact: its `localStorage` holds what no other artifact sees (L2), and
survives a republish (L4). Under `sandbox` isolation the origin is opaque and
storage throws (L8).

**Supporting files.** `files` publishes stylesheets, scripts, fonts, images,
media and data beside the page; the page reaches them by relative URL, under
the same policy, with the media type they were stored under and never sniffed
(H15, L13). A published path is relative, stays inside the artifact, and may
not be `index.html` or `preflight.js` at the root. The media type comes from
the extension for the common web types and must otherwise be stated, bare and
servable. A text file holds 16 MiB, a binary one 15 MiB, a version 255 files
and 64 MiB (D9). A republish names only what changes: a path it passes is
added or replaced, a path it leaves out is kept, `null` removes one. Each
version keeps a complete map, so an old version keeps serving its own files,
and the bytes are stored once per hash however many paths or versions name
them (T15). A publish that breaks a rule is refused whole and writes nothing
(T16). On an artifact made from a type, the paths it came with are read-only
(D19).

## The `reply` capability

Pi's own: the loop that sends the user's answers back to the session. A page
is served it when its version has a data island — any JSON object, written in
the file as `<script type="application/json" id="artifact-data">` or passed as
`data`, which wins without rewriting the document (R2). An island in the file
ends at the first `</script>`, so write `<` as `\u003c` inside it; one that is
not valid JSON, or not a JSON object, refuses the publish. Declaring
`"schema": "questions/v1"` gets validation and the built-in form:

```json
{ "schema": "questions/v1", "round": 1, "intro": "Three calls before I build.",
  "questions": [
    { "id": "tiering", "header": "Pricing", "question": "Which model first?",
      "options": [ { "label": "Usage-based (Recommended)", "description": "…", "preview": "…" },
                   { "label": "Seat-based" } ],
      "recommended": 0, "whyItMatters": "Decides the billing table." },
    { "id": "region", "question": "Which region?", "options": [ { "label": "EU" }, { "label": "US" } ],
      "dependsOn": { "tiering": "Usage-based (Recommended)" } },
    { "id": "notes", "question": "Anything else?", "required": false } ],
  "assumptions": [ { "id": "stripe", "text": "Stripe stays the processor" } ],
  "answers": {} }
```

Questions use `ask_user_question`'s shape (`header`, `question`, `options`
with `label`/`description`/`preview`, `multiSelect`) plus `id`, `required`
(default true), `recommended`, `dependsOn`, `whyItMatters`, `allowText`.
Answers come back as `answers[id] = { selected?: string[], text?: string }`;
assumptions answer `"confirm"` or `"override"`. The server validates what the
page sends against the questions it was given: unknown ids or options and
over-selection fail, hidden questions are not required (D4).

`await claude.use("reply")` resolves one frozen namespace: `data.get()`,
`data.set(patch)`, `data.replace(next)`, `answer(id, value)`,
`select(id, label, multi)`, `send(extra?)`, `on` / `off` for `change`, `sent`
and `update`, and `version`, `slug`, `dirty`. `data.get()` starts as the
version's island with the newest reply over it, as the shell handed it over.
`send` never rejects: it resolves `{ok: true, version, response}` or
`{ok: false, error, code, …}`. `update` fires when another tab replied; the
island is replaced only when this one has no unsent changes.

Hand-written markup binds without code: inside `[data-question=id]`, each
`[data-option=label]` toggles (add `data-multi` to the holder for several) and
carries `data-selected` and `aria-pressed` for the page to style; an `input`,
`textarea` or `select` that is itself `[data-question]`, or a `[data-text]`
field inside the holder, carries text; a `[data-artifact-send="action"]`
button sends with that action (L11). A questions island renders into
`[data-artifact-questions]` or, absent that, at the end of the body. The form
is all the runtime draws; the Send bar is the shell's.

## The `db` capability

Claude Code's `db`: one database per artifact — not per version — of JSON
documents at slash-separated paths, read and written by the page in every open
view and by the agent's [`artifact_data`](#the-tool) tool. Declare it with
`capabilities: {"db": {}}`. The rules are pure (`domain/db.ts`, D12–D16):

| Rule | Value |
| --- | --- |
| Paths | `collection/doc`, nesting as `collection/doc/subcollection/doc`: a document path has an even number of segments, a collection path an odd one. A segment is letters, digits and `_ - . ~ : @ +`, never `.`, `..` or a reserved `__name__`; at most 200 bytes a segment, 1000 bytes and 16 segments a path |
| The viewer's own | `data/users/me/…` is the one viewer's subtree, stored as `data/users/owner/…`. Every access level is theirs, the agent's tool included |
| Bodies | A plain JSON object of at most 256 KiB and 32 levels; 5,000 documents an artifact, the next one is `quota_exceeded` |
| Versions | Every write moves its document's version on by one, from 1. Writes are last-writer-wins; one pinned to a version the document has left writes nothing and is a `conflict` naming the `current` version |
| `update` | Needs the document. Nested objects merge; anything else — arrays included — replaces the field whole; a field given as `{"__delete__": true}` is removed, at any depth, never inside an array. `set` writes the whole document and refuses that value |
| Queries | One collection, no index: up to ten filters on top-level fields (`==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not-in`, `array-contains`; `eq`, `ne`, `lt`, `lte`, `gt`, `gte` mean the same; at most thirty `in` values), one `orderBy` with a document missing the field last, else the id's order, a `limit` of 1–1000, and a cursor where the next page starts. A range never matches across types |
| Leases | `acquire` is set-if-not-busy: granted on a free document — created when absent, its `data` merged in — and again to its own holder. Anyone else is told only when it ends. The length is clamped to 1 s – 10 min around a default of 30 s; an expired lease is free; a renewal without data leaves the version; a plain write leaves the lease standing |

**On the page.** `await claude.use("db")` resolves a Firestore-shaped
namespace (L21). `db.doc(path)` answers a reference with `id`, `path`, `get()`,
`set(data)`, `update(data)`, `delete()`, `acquire({holder, ttlMs?, data?})`,
`onSnapshot(next, error?)` and `collection(name)`. `db.collection(path)`
answers one with `where(field, op, value)`, `orderBy(field, direction?)`,
`limit(n)`, `get()`, `onSnapshot(next, error?)`, `doc(id?)` — which mints an
id when none is given — and `add(data)`. A query is a value: each builder
answers a new one. A path that breaks the grammar throws a `TypeError` where
it is written; what the server refuses rejects with its code
(`invalid_argument`, `quota_exceeded`), on a listener through its error
callback, once; a body that is not plain JSON rejects `transform_error`. A
second holder's `acquire` resolves `{acquired: false}` with only the expiry. A
view holds at most 64 live subscriptions; the 65th is refused
`resource_exhausted`, and an unsubscribed one frees its place.

**Live.** Every open view of the artifact hears which documents a write
moved, as one `{type: "db", paths}` on its event stream — the page's write, a
granted lease that changed a body and a session's write alike; a read, a
refused write, a busy lease and a delete of what is not there are not heard
(H21). The shell pushes the paths to a page that is served `db`;
listeners on a document, or on the collection it is in, read again, and all of
them do when the stream has just connected. A document one view writes reaches
`onSnapshot` in another, on the document and on a query over its collection,
and a row the tool writes arrives the same way (L20). Snapshots are frozen: a
document snapshot has `id`, `exists`, `data()` and `metadata`; a query
snapshot has `docs`, `size`, `empty` and `docChanges()`, whose `added`,
`modified` and `removed` changes carry `oldIndex` and `newIndex` that fit the
new order. A document that did not change is the same object in the next
delivery, and a removal still carries the last body. Every delivery is a fresh
read from the server: `metadata` is always `{fromCache: false,
hasPendingWrites: false}`, and a write's promise resolves once this view's own
listeners have seen it, so a page never renders behind its own write.

**Over HTTP.** One handler answers two routes (`routes/db.ts`):
`POST /a/<slug>/db`, the shell acting for the page, and
`POST /api/artifacts/<slug>/db`, a session's tool. Both take `get`, `query`,
`set`, `update`, `delete`, `str_replace`, an all-or-nothing `batch` of up to
fifty writes that addresses a document at most once, and `acquire`. The shell
relays six verbs for a page — `get`, `query`, `set`, `update`, `delete`,
`acquire` — and the page's namespace carries no version pin; `str_replace`,
`batch` and the pin are what `artifact_data` adds. A refusal is
`{code, message}` and writes nothing: 400 `invalid_argument`, 409 `conflict`
with `current` (and the `entry`, in a batch), 413 `quota_exceeded`, and 403
`revoked` for an artifact that does not declare `db` (H20, H22). The database
is one file, `.store/db.json`, written by the first write and rewritten whole;
a refused write leaves it byte for byte. A duplicate starts with the source's
documents and the two then move apart (T19).

## The `assets` capability

Claude Code's `assets`: files people add on the page — stored with the
artifact under an opaque id and served to every version of it. Declare it with
`capabilities: {"assets": {}}`, and `db` beside it to keep the ids.
`await claude.use("assets")` resolves `upload(blob, {type}?)`, `list()` and
`delete(ref)` (H23, L22):

- **`upload`** takes a `Blob` or a `File` and resolves
  `{id, url, sizeBytes, contentType}`, with `url` being `"/_blob/" + id` — the
  one root-relative address a page is served, so the id kept in a `db`
  document still renders after a republish. The type is the one the page
  states, else the Blob's own.
- **`list`** resolves every asset, oldest first, beside the `usage` against
  the artifact's budget; **`delete`** takes an id or the url it was handed,
  resolves `{deleted}`, and is idempotent.
- **Accepted** (`domain/assets.ts`, D17): eighteen exact media types —
  `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/svg+xml`,
  `video/mp4`, `video/webm`, `application/pdf`, `font/woff2`, `font/woff`,
  `font/ttf`, `font/otf`, `text/csv`, `text/markdown`, `application/json`,
  `text/plain`, `text/css`, `text/javascript`. A parameter, an alias or no type
  at all is refused. A file is never empty and holds at most 20 MiB — 16 MiB
  for CSS and JavaScript, 2 MiB for SVG. A text type is UTF-8; a stylesheet or
  a script may not open with markup or carry binary content, and no binary
  type opens with markup. An artifact holds 1,000 assets and 256 MiB.
- **SVG** is stored sanitised (D18): script, `foreignObject`, style, link and
  animation elements go with all they hold, as do event handlers,
  `javascript:` and `data:` URLs however they are spelled, a `<use>` that
  points out of the file, comments, instructions and the doctype. The drawing,
  its text and its local references stay. It is served under
  `default-src 'none'; style-src 'unsafe-inline'; sandbox`, so opened as a
  document it runs and loads nothing (H24).
- **Refusals** are `{code, message}` and store nothing: `invalid_request`,
  `too_large`, `unsupported_type`, `quota_or_state` for a full budget, and
  `not_granted` for an artifact that does not declare `assets`.

An asset is served at `/_blob/<id>` on its artifact's frame host, whatever the
version and with no cap: byte for byte, under the type it was stored as (text
with a UTF-8 charset), never sniffed or cached, under the page's policy. An id
nobody minted, a deleted asset, another artifact's host and the shell host are
404, and only GET is answered; under `sandbox` isolation the shell host serves
it by id (H24). The shell carries an upload to `POST /a/<slug>/assets` in
base64. On disk an asset is `.store/assets/<id>` — 32 hex characters the
server mints — beside `assets/index.json`; a deleted asset leaves the index
and its bytes move to the trash, never unlinked; a duplicate holds the same
assets under the same ids in a folder of its own (T20). Only the page reaches
its assets: neither tool nor `/api` has a route to them.

## The tool

Two tools, registered side by side: `artifact` for the page, and
`artifact_data` for the database a page keeps.

`artifact` — one tool, an `action` parameter (default `publish`), with Claude
Code's parameter names (S12). Its description tells the model to load the
`artifact-design` skill and then `artifact-capabilities` before writing a
page, and `artifact-diagramming` before drawing a figure, and sends it to
`artifact_data` for a page's documents (S18).

| Action | Inputs | What happens |
| --- | --- | --- |
| `publish` | `file_path` (`.html`/`.htm`/`.md` inside the project), `url` to update; `title?`, `slug?`, `description?`, `icon?`, `label?`, `data?`, `files?`, `root?`, `capabilities?`, `force?`, `pin?`; or `type` + `title` | Creates `/a/<slug>` as v1 and opens the browser. The same `file_path` again, or `url`, makes the next version in place, and open views move to it; the browser is not opened again. `label` names the version in at most 60 characters. `force` overwrites a version this session has not read. `pin: true` also pins, and a pin that fails never fails the publish. With `type` it makes a new artifact from one of the project's types — see *Artifact types* below. The result states the island's validation, the files, the type, the capabilities served, and those declared but not served |
| `ask` | `questions` + `title` (+ `intro?`, `assumptions?`), or `file_path` whose island declares `questions/v1`; `timeout?` seconds; the publish parameters | Publishes, opens, blocks until the page replies; returns the answers. Timeout → tells the model to end its turn; the reply wakes it later |
| `read_page_data` | `url`, `schema?` | The current island (version + newest reply), validated; lists unanswered required ids |
| `read` | `url`; `path?` or `paths?` | Source and island; says when the viewer published the current version. With `path` or `paths`, supporting files instead: a small text file inline, anything else by size and type, `index.html` is the page itself, and a path the version does not hold is reported, not thrown (S15) |
| `verify` | `url` | Runtime diagnostics viewers' browsers reported for the current version: console errors and warnings, uncaught errors, failed loads, unhandled rejections, policy violations. None is *not* evidence of a clean render |
| `list` | `scope?`, `url` | Every artifact, pinned first; with `scope: "files"` and `url`, that artifact's supporting files with type and size; with `scope: "types"`, the artifact types this project keeps (S20) |
| `quickstart` | `intent` (`document`, `slides`, `design`, `other`) | Before making something new: lists the project's types and names the skill to load for a plain page. It writes and publishes nothing (S20) |
| `open` · `status` | `url` for open | Browser; ownership, watches, pending, wakes this hour |
| `watch` · `unwatch` | `url` | Adopt the page (this session is woken by it) or silence wakes; replies are stored either way |
| `pin` · `unpin` | `url` | Exempt from the retention sweep; first in lists |
| `comments` · `reply` · `resolve` | `url`, `thread_id`, `text`, `acknowledge_duplicate?` | Threads; only a thread the user *sent to the agent* accepts a reply or a resolve. A second reply with nothing new from the user is refused unless acknowledged (T9) |
| `delete` | `url` | After `ui.confirm`, moves the folder to `~/.Trash`; refuses headless |

`url` accepts the slug, the path, or the full page URL. `files` is a map of
published path → source path, `{from, contentType}` or `null`, or a list
published at its own spelling; relative sources resolve against `root`. Every
source — the page included — is resolved through its symlinks and refused when
it leaves the project, and a supporting file's size is checked before a byte
of it is read (S14). Tool results carry a one-line card
(`🧩 Pricing plan v2 republished v2`), and the model is told not to paste
URLs: the footer shows the pages.

**Artifact types.** A type is a folder the project keeps,
`.pi/artifact-types/<name>/` — the name in lowercase letters, digits and
hyphens — holding `type.json` (`{title, description}`), the type's page
`index.html`, and whatever files that page loads; dotfiles are left out. None
ships with the extension. `publish` with `type` and `title`, and no
`file_path` or `url`, makes a new artifact whose first version is the type's
page and files; it is named by `title`, whatever the type's own `<title>`
says, and files of the artifact's own may come with it at other paths (S19,
T21). The manifest records the type and the paths that are the type's — the
page among them — and those stay read-only, whoever publishes: a publish
naming one, to replace it or to remove it, is refused whole as
`read_only_path` before any other rule speaks (D19), and so is a `file_path`,
the page's own `artifact.publish(html)`, and a files publish from the page
that names a type's path (T21, H25, L23). The artifact gets its content by
publishing `files` to its `url` with no `file_path`: the page is carried as it
stands, the files are laid over, and open views move to the new version,
rendered by the type's own script (L23). An artifact made from no type cannot
publish without a page. A type's files meet the rules every published file
meets, and none may lead out of the project. A duplicate is of the same type.

**`artifact_data`** — a session's side of a page's database, with Claude
Code's ArtifactData parameter names (A1). Every call takes `url`, and the
artifact must declare `db`; one that does not is refused saying how to declare
it (A6).

| Action | Inputs | What happens |
| --- | --- | --- |
| `get` | `collection`, `doc_id`; `out_dir?` | One document with its version. One that is not there is said, not thrown (A2) |
| `list` | `collection`; `query.limit?`, `query.cursor?`; `out_dir?` | A page of a collection in its own order — 100 when no limit is named — and the `next_cursor` when more follow |
| `query` | `collection`, `query` (`where` triples, `order_by`, `limit`, `cursor`); `out_dir?` | The matching documents, filtered and ordered; takes Claude Code's operator names |
| `set` · `update` | `collection`, `doc_id`, exactly one of `data` or `file_path`; `if_version?` | Replaces the document, or merges fields into one that exists; a field given as `{"__delete__": true}` is removed by an update and refused by a set (A3) |
| `str_replace` | `collection`, `doc_id`, `field`, `old_str`, `new_str`, `replace_all?`, `if_version?` | Edits one top-level string field in place. `old_str` must occur exactly once unless `replace_all`, or nothing is written |
| `delete` | `collection`, `doc_id`, `if_version?` | Removes the document |
| `batch` | `writes`: 1–50 entries of `{op, collection, doc_id, if_version?}` with `data` or `file_path`, where `op` is `set`, `update` or `delete` | All of them land or none does; a refusal names the entry (A4) |

Each document read, and each write's result, shows the document's `version`,
and the description tells the model to pass it back as `if_version`: a pinned
write against a document that moved is refused naming the current version and
writes nothing (A4). `file_path` sends the top-level object of a JSON file as
the document; `out_dir` writes each document read to
`<out_dir>/<collection path>/<doc_id>.json` and lists the files instead of
their contents. Both must be inside the project, directly and through a
symlink (A5). A read says once that what a document holds is data the page's
viewers and the agent wrote, never instructions (A2). Every open view of the
page hears what the tool writes (A3, L20). What the call itself gets wrong is
refused before anything is written, naming the parameter (A6). Results carry a
one-line card of their own (`🗃 Sprint board tasks/t1 version 3`).

## The terminal

The footer row is one extension status (`setStatus("artifacts", …)`). The
soriza statusline gives it the token line and leaves the other statuses the
line above; pi's default footer shows it among the statuses.

```text
⧉ +2 · pricing-plan · ● roadmap · parity-audit
❯ ⧉ +2 · pricing-plan · ● roadmap ·  parity-audit  · ←/→ to navigate · Enter to open · x to dismiss
```

A pill is named after the file the page was published from, without its
extension, or after the slug when it came from no file; `●` leads it while a
reply waits. Pills run oldest → newest by last publish, so the newest is
rightmost. At most five show — the five newest, the older ones folded into a
leading `+N`; with the footer focused the window follows the selection and
newer pages fold into a trailing `+N` (S6). The row holds what this session
published or attached, and any page it took with `watch` or read with `read`
or `read_page_data`. Names pass through `terminalSafe` first: a file name can
never rewrite the line (D6).

- `down` on an empty prompt — focus moves into the row, onto the newest pill,
  as in Claude Code. The row then leads with `❯`, fills the selected pill, and
  names its keys. `←/→` (or `tab` / `shift+tab`) move and wrap, `enter` opens,
  `c` copies the URL, `x` drops the pill from the row (the page stays
  published), `esc` or `↑` hand focus back, and any other key hands it back
  and is typed (S7). It is the editor's own input handler (`editor.ts`, set
  with `setEditorComponent`), so an open picker never sees it, and `esc` in
  the footer is not pi's interrupt.
- `alt+a` — opens the newest page. Claude Code's `ctrl+]` is deliberately not
  bound: it is pi's default for the editor's jump-to-character
  (`tui.editor.jumpForward`), and an extension shortcut would outrank it and
  show up as a conflict in pi's startup diagnostics (S7).
- Themes — a status is painted text pi keeps exactly as the extension handed
  it over, so the row would otherwise keep the colours of the theme it was
  drawn in. Pi has no theme-change event, but every switch (`alt+=` / `alt+-`,
  the picker and its live preview, a reloaded theme file) invalidates the
  screen, so the editor's own draw (`editor.ts`, `onFrame`) compares what the
  theme paints with against the row's paint and redraws the row — selection,
  focus mark and hint included — when they differ (S6).
- Clicks — every pill, padding included, is an OSC 8 hyperlink to the tokened
  page URL. In pi's fullscreen mode (`--tui-mode fullscreen`) pi's renderer
  hit-tests a plain left click against those links and opens the page; a click
  anywhere else on the row opens nothing (S6). In regular mode no application
  sees the mouse, and the terminal's own Ctrl/Cmd+click on the link is what
  remains.

**`/artifacts`** opens Claude Code's Artifacts dialog, plus a Status tab
(`gallery.ts`; G1–G13):

```text
Artifacts

╭──────────────────────────────────────────────────────────────────────────╮
│ ⌕ Search artifacts…                                                      │
╰──────────────────────────────────────────────────────────────────────────╯

  All 7   ⧉ This session 2   ↳ Other sessions 5   ★ Pinned 1   ◍ Status

  ↑ 2 more above
❯ ⧉ ★ Pricing plan  attached · v2 · 1 reply · 3h ago
  ↳ Roadmap  1 reply waiting · v1 · 2w ago
  ↓ 3 more below

Copied http://localhost:5834/a/roadmap

Enter to attach · x to dismiss · c to copy url · Ctrl+R to rename · d to delete
p to unpin · / to search · r to refresh
```

- **Tabs.** `All`, `⧉ This session` (what this session published or
  attached), `↳ Other sessions`, `★ Pinned` only while a page is pinned or
  that tab is open, then `◍ Status`, always last and uncounted. The counts
  follow the search. `tab` / `→` and `shift+tab` / `←` cycle and wrap; in
  fullscreen mode a left click on a tab selects it (G1, G2).
- **Rows.** Pinned first, then most recently updated: the relation icon, `★`
  when pinned, the title (else the slug, at most 50 characters), then
  `attached · N replies waiting · unwatched · version · age`. The list shows
  as many rows as the terminal's height leaves, at most twenty, with
  `↑ N more above` and `↓ N more below` around them (G3, G4).
- **Search.** `/`, or `↑` on the first row, focuses the box; typing keeps the
  pages whose title, slug or description contains the text, whatever its case;
  `enter` or `↓` goes back to the list; `esc` empties the box, and on an empty
  box `esc` or `backspace` leaves it without closing the panel (G5).
- **Keys on a row.** `enter` attaches the page to this session — it becomes
  the owner, the pill appears, the model is told with the next prompt to
  `read` it before changing it — and closes the panel (G7). `c` copies the
  tokened URL and names the bare one; `x` drops an attached page from the
  footer and leaves it published; `p` pins or unpins; `Ctrl+R` renames through
  the server, the field holding the current title; `d` asks first, and only
  `y` after it moves the folder to the Trash. `o` opens the page and `w` turns
  its wakes off or on — the user's own off-switch; both work without being
  advertised (G8–G10). `r` refreshes, `esc` leaves.
- **Guide and notices.** The guide names only what the selected row allows and
  wraps without cutting an entry; the line above it is the last notice, or
  what is being asked. Loading, a failed load with its reason and an empty
  store each stand where the list would (G6, G11).

The **Status** tab reads the live server and this session's settings, and no
line carries the session token, the viewer secret or a tokened URL (G12):

| Row | Reads |
| --- | --- |
| Server | Origin · pid · uptime |
| Code | `current`, or a warning that the server is older than its source and is replaced at the next session start |
| Store | The store root, under `~` when it is in the home directory |
| Isolation | `origin` or `sandbox`, spelled out |
| Sessions | How many are connected, and whether this one is — a warning when it is not |
| Artifacts | Total · this session's · pinned · replies waiting |
| Delivery | `delivery` and the `wakesPerHour` cap |
| Retention | Days idle before the Trash; pinned pages are kept |
| Settings | `autoOpen` · `keepAlive` · the ask timeout |
| Logs | Today's log folder, relative to the project |

A server that does not answer is one warning row with the reason, over what
starts it. Under the rows stand the commands:
`/artifacts restart · /artifacts stop · /artifacts sweep`.

| Command | Does |
| --- | --- |
| `/artifacts` | The panel; without a UI, the list as text (G13) |
| `/artifacts status` | The panel on its Status tab; without a UI, the same rows as text. It opens even when the server cannot be reached, and says why |
| `/artifacts <slug>` | Opens that page; a URL or path works too |
| `/artifacts pin <slug>` · `unpin <slug>` | Exempt from retention, or not |
| `/artifacts sweep` | Runs the retention sweep now |
| `/artifacts stop` | Ends the server; the next session start or publish starts it again |
| `/artifacts restart` | Ends it and starts a fresh one at once; the session keeps its pills and is still woken by its pages (S11) |

## Security posture

Two kinds of host on one port, told apart by the `Host` header; any other
name, a label that is no slug, or another port is 421 (H5). Under the default
`origin` isolation:

| Host | Serves |
| --- | --- |
| Shell host — `localhost:<port>`, `127.0.0.1:<port>` | The gallery and the viewer shell under `/a`, the API under `/api`. Never a page's document or files |
| Frame host — `<slug>.localhost:<port>` | `/_f/<cap>/<n>/…` for that slug, `/_blob/<id>` for what its page uploaded, `/_rt/claude.js`, `/_rt/mermaid.js`. `/a`, `/api` and `/` are 404 there, whatever the method (H9, H24) |

Three capabilities, never one:

| Capability | Where it lives | What it opens |
| --- | --- | --- |
| Session | `.server/token` (0600); only the pi process sends it, in `x-artifact-token` | `/api/*`. A browser cannot send that header cross-site, and no page holds it |
| Viewer | `.server/viewer` (0600); page URLs carry it once in `?t=`, the server answers 303 to the clean URL and sets it as an `HttpOnly; SameSite=Strict` cookie on the shell host (H1) | The shell's GETs; with the shell host's own `Origin`, the shell's POSTs. The page's script never sees it |
| Cap | An HMAC of the viewer secret and the slug, in the frame path | That artifact's documents and files. The frame carries no cookie, and every relative URL in the page inherits the cap. It is stable across versions and differs between artifacts (H9) |

An uploaded asset needs no cap: its id — 128 random bits only its own page
was ever told — is the capability, and under `origin` isolation only its
artifact's frame host answers for it (H24).

A shell POST — a reply, a comment, diagnostics, the page's own publish, its
database call, its upload, rename, duplicate, pin, delete — needs the viewer
cookie and an `Origin` that is the shell host's own. A missing cookie, a
missing `Origin`, another `localhost` port, an opaque origin, the origin of a
page's frame (another artifact's or the page's own) and the session token are
each refused with 403, and nothing they tried is stored (H2). The cookie is
not the API's key either (H3, H19, H22).

What a page's script can reach, measured in a real browser (L1): it cannot
read another page's document or island, cannot post a reply or a comment to
it, and cannot reach `/api` or the shell's routes — from its own origin they do
not exist, and any other origin its policy blocks. It cannot frame another
artifact, and the shell's document is out of its reach. What it needs done it
asks of the shell, which answers only for a capability that page is served.

**`isolation`.** `"origin"`, the default, is the above. `"sandbox"` is the
fallback where `<slug>.localhost` does not resolve: the shell host serves the
frames itself, found by their cap, and an asset by its id; the iframe drops
`allow-same-origin` and
its address is relative; and the document's own policy adds a `sandbox`
directive, so even opened outside the shell it gets an opaque origin, never
the shell's (H13). There the page's storage throws and the shell's routes
refuse it, while the bridge still serves it: `use()` answers as elsewhere, a
relative `<img>` loads, a confirmed save reaches the viewer, the page's own
publish moves the view, and an upload renders (L8, L19, L22). The shell's own
policy admits no inline
script or style and frames only `*.localhost` on this port — `'self'` under
`sandbox` (H10, H13).

Also: bound to `127.0.0.1`; `/api/health` is open on loopback and reports the
root and a token *digest*, never a token (H3); what the shell host writes from
a manifest is text, never markup — a hostile title, description or label adds
no element (H14); bodies over 2 MiB are refused — 104 MiB where a body
carries files or a batch: a publish, the page's own publish, an upload, a
session's database call; islands are validated before storage; an uploaded SVG
is sanitised before it is stored (D18); wakes are capped per artifact per hour
(`wakesPerHour`); names and titles are control-stripped before they reach the
terminal (D6, G3); logs redact `token`, `viewer`, and cookies; nothing is
deleted — `delete` and the sweep move folders to the trash, a deleted asset's
bytes go there too, and only expired log folders are removed (T4, T5, T20).
What either tool reads back — a file, a diagnostic, a document — is labelled
as data, never instructions. The viewer secret is a local capability: a
process on this machine that can read `.server/viewer` can do what the shell
does.

## Server lifecycle

**One port, one server, many sessions.** The server binds exactly the
configured port (5834) — a taken port is never worked around. On
`session_start` every session probes `/api/health`:

| The port answers | The session |
| --- | --- |
| our server (same store root), started after its source last changed | attaches, whichever session started it (P1) |
| our server, but older than the newest file under `src/` | stops it and spawns a fresh one, so `/reload` after an edit never leaves old code serving pages; pending replies are on disk and other sessions' streams reconnect (P6) |
| an artifact server for another project | refuses, naming that root and pid; set `port` for this project or `/artifacts stop` there (P3) |
| another program | refuses, naming the port (P3) |
| nothing | spawns `bun src/server.ts` under `.server/lock`; a second session starting at the same moment waits and attaches (P4) |

The server re-reads its secrets from disk when a request presents something
else (a rotated `.server/token` never orphans a process, P2), exits when its
store root disappears, and outlives sessions (`keepAlive`, default). A session
leaving tells the server (`/api/detach`) so replies are held rather than sent
into a dead stream. `/artifacts stop` ends it and `/artifacts restart`
replaces it at once. Neither is needed after an edit — a server older than its
source is replaced by itself — and nothing is lost either way: pages and held
replies are on disk, and every session's stream reconnects. At start the
server logs any folder whose manifest it cannot read and leaves it out of
every list (T8, H8).

**Retention.** `retentionDays` (14): an unpinned artifact whose last
activity — publish, reply, comment, view, database write or upload — is older
than that is moved to `~/.Trash/pi-artifacts/<date>/<slug>`; `logs/<date>/`
folders older than that are removed. The server sweeps at start and daily;
`session_start` and `/artifacts sweep` ask for one.

## Configuration and files

`.pi/artifacts.json` (optional):

```json
{ "port": 5834, "autoOpen": true, "delivery": "wake", "askTimeoutSeconds": 600,
  "wakesPerHour": 60, "keepAlive": true, "retentionDays": 14, "isolation": "origin" }
```

- `port`: the only port bound. `delivery`: `wake` triggers a turn on a reply;
  `notify` queues it for the next prompt and tells the user it is waiting.
- `keepAlive`: leave the server running when the session ends (default);
  `bun`: the binary to launch it with, when not on PATH.
- `isolation`: `origin` or `sandbox`, see [Security posture](#security-posture).
- A malformed file or a bad value falls back to the default for that key,
  never as a whole (D3). `port`, `retentionDays` and `isolation` reach the
  server as arguments when it is spawned (P7), so a running server keeps the
  ones it started with until it is restarted.

```text
.pi/artifacts/
├── .server/                  token · viewer · record.json · lock · server.log
├── logs/<YYYY-MM-DD>/        <session-id>.jsonl (pi side) · server.jsonl (the server)
└── <slug>/                   the artifact is its folder
    ├── <slug>.html|md        the page the agent authors and edits; the server never writes it
    └── .store/               the server's files
        ├── manifest.json     title · icon · renamed · owner · sessions · watched · current · versions ·
        │                     responses · capabilities · type · pinned · pending · lastActivityAt
        ├── source.html|md    the source as last published (the authored page may have moved on)
        ├── versions/v<N>.html · v<N>.json    each version's document and island, written once
        ├── versions/v<N>.files.json          its supporting files: published path → {sha256, contentType, bytes};
        │                                     absent when it has none
        ├── blobs/<sha256>                     their bytes, stored once
        ├── responses/v<N>-r<K>.json           page replies, bound to a version
        ├── db.json                            the page's database: collection path → document id →
        │                                     {data, version, updatedAt, lease?}; written on the first write
        ├── assets/<id> · assets/index.json    what the page uploaded, whatever the version, and its index:
        │                                     [{id, contentType, sizeBytes, createdAt}], oldest first
        └── comments.json · diagnostics.json · events.jsonl

.pi/artifact-types/<name>/    a type the project keeps: type.json · index.html · the files its page loads
```

**The artifact is its folder.** The tool tells the model to write the page
at `.pi/artifacts/<slug>/<slug>.html`; a page authored there publishes to the
slug its folder names, whatever its title (`slugForSourcePath`), a `slug`
parameter that disagrees is refused, and a folder another session owns
answers "already lives at … pass url" (T7, S10). A slug is a DNS label —
lowercase letters, digits and inner hyphens, at most 63 characters — because
it is also the page's host name (D7). `delete` and the retention sweep move
the whole folder to the trash, authored page included — pin what should
outlive 14 idle days. A file anywhere else in the project still publishes
(slug from the title or `slug`): that is where a page meant for git goes,
since `.pi/artifacts/` is ignored. No older store layout is read: a folder
whose manifest lacks a field the code reads is not an artifact (T8).
`access-guard` lists `.server/token` and `.server/viewer` as sensitive,
because the model writes one folder away from them.

Logs are pino JSON lines — `time`, `level`, `pid`, `component`, `action`,
`msg`, and what the action concerns (`session`, `slug`, `version`,
`response` …) — one file per session and one for the server per day, under the
local date, with `time` as the local wall clock and its offset
(`2026-09-20T07:22:36.062+08:00`); `ARTIFACTS_LOG_LEVEL` sets the level (P5).
Stored data (`manifest.json`, `record.json`) keeps UTC: those timestamps are
sorted and compared as strings. The directory is git-ignored.

## Verification

`bun test tests/pi/artifacts` — every file opens with its numbered contract,
and every case is named after the line it proves:

| File | Contracts | Proves |
| --- | --- | --- |
| `domain/rules.test.ts` | D1–D19 | The pure rules: versions and replies, retention, config, `questions/v1`, the envelope, terminal text, slugs and frame hosts, icon words, supporting files, capability declarations, per-file pins, the database (D12–D16), uploads and SVG sanitising (D17–D18), a type's read-only paths (D19) |
| `server/store.test.ts` | T1–T21 | The store on disk through the core, `db.json` (T19), `assets/` (T20) and artifacts made from a type (T21) among it |
| `server/render.test.ts` | R1–R6 | The stored document and the Markdown lane |
| `server/http.test.ts` | H1–H25 | The HTTP surface as the browser and the pi side see it: the database's two routes and its pushes (H20–H22), uploads and `/_blob/<id>` (H23–H24), types over the API (H25) |
| `process/launch.test.ts` | P1–P7 | The real `bun src/server.ts` on a free port: the fixed-port policy, the lock, token rotation, the logs, a server older than its source, isolation reaching the process |
| `session/session.test.ts` | S1–S8, S10–S20 | The `artifact` tool, the hooks, the footer row and its keys |
| `session/data.test.ts` | A1–A6 | The `artifact_data` tool |
| `session/gallery.test.ts` | G1–G13 | The `/artifacts` panel the wired command opens |
| `structure/boundaries.test.ts` | B1–B7 | The layer boundary, as a failing test |
| `live/browser.test.ts` | L1–L23 | What only a browser can prove: origins, the page policy, the sandbox, the bridge, the capabilities, state carried across a republish, the database live across views (L20–L21), uploads (L22), a typed artifact (L23) |

The server tests start the same `startServer` in-process and reach a frame
host by sending its `Host` to the loopback address, so none depends on how the
machine resolves `*.localhost`. `bun test` pins its own process to UTC while a
spawned server keeps the host zone, so P5 looks under any day's folder. S6 and
G2 click cells on pi's real alternate-screen renderer over a scripted terminal
(`tests/pi/_harness/fullscreen.ts`). The live suite drives a real Chromium
through `playwright-core` against the fixture's in-process server and
publishes the pages under `live/pages/`. It is skipped where no Chromium is
found — Playwright's cache, or an installed Chrome or Chromium — while the
HTTP contracts beside it still run. It needs no network: hosts a page may load
from are checked by the absence of a policy violation, and when the network is
there the loads themselves are checked too.

Still by hand, in a real terminal and browser: how the footer row and the
panel look under a theme, the terminal's own Ctrl/Cmd+click on a pill in
regular mode, the clipboard copy behind `c` (the tests never write the
developer's clipboard), the system opener launching the browser, and
`<slug>.localhost` resolving in a browser other than Chromium. Where the live
suite is skipped, a pass by hand covers it:
`tests/pi/artifacts/live/pages/contract-probe.html` publishes as it is and
prints what the host gave it — origin, policy, runtime, storage, mermaid — as
rows on the page.

## Against Claude Code

The Claude Code side of this table is what the extension's source and test
contracts state they mirror. Where a row names a Claude Code parameter that has
no counterpart here — `as_level`, `type_url`, `contract`, `asset` — what it
states of this code is the absence.

| Area | Status | Here |
| --- | --- | --- |
| Stored document | Mirrored | Claude Code's skeleton byte for byte, plus the one runtime tag (R1–R3) |
| Page policy | Mirrored | The same allowlist, as an HTTP header, `'self'` for styles and fonts included; only this port's shell may frame the page (H10, L2, L13) |
| `window.claude` | Mirrored | `use` and `hot`; the namespaces, verbs and rejection codes of `permissions`, `downloads`, `comments`, `artifact`, `db` and `assets`, so a page written against Claude Code's type definitions runs unchanged (L14–L22) |
| `db` | Mirrored | The path grammar and its parity, a body of 256 KiB and 32 levels, 5,000 documents, a version on every document, `update` as a merge with `{"__delete__": true}`, queries over top-level fields with no index, cooperative leases, an all-or-nothing batch (D12–D16); on the page, the Firestore-shaped references, `onSnapshot` and `docChanges()` (L20, L21) |
| `assets` | Mirrored | The closed set of media types, the size caps, the UTF-8 and markup rules, SVG sanitising, the 256 MiB budget, and `/_blob/<id>` as the address (D17, D18, H23, H24, L22) |
| `artifact_data` | Mirrored | Claude Code's ArtifactData, action for action and name for name: `get`, `list`, `query`, `set`, `update`, `delete`, `str_replace`, `batch`; `if_version`, `file_path`, `out_dir` (A1–A6) |
| Tool surface | Mirrored | `label`, the icon word, the title precedence, `force`, `pin`, `files` and `root` with the same limits and reserved names, the three `capabilities` gestures, `read` with `path`/`paths`, `list` with `scope`, `quickstart` with Claude Code's four intents (S12, S14–S16, S20) |
| Update | Mirrored | Same file, same URL, within the session; another session passes the URL or attaches; a conflict names the newer version (T6, S3) |
| Footer | Mirrored | The pill row, its focus and its keys; `alt+a` in place of Claude Code's `ctrl+]`, which stays pi's editor binding (S6, S7) |
| `/artifacts` | Mirrored | The dialog's tabs with counts, its guide, notices, search and keys (G1–G11); two nouns differ, below |
| Hosting | Different on purpose | `127.0.0.1` and a page origin per slug instead of claude.ai: no sign-in, no sharing, no public link, and no prompt before a publish |
| Viewers | Different on purpose | One, who owns the page: `permissions` grants whatever a page is served and never prompts |
| Access levels | Different on purpose | Every access level is the one viewer's, the agent's tool included: `data/users/me` is `data/users/owner`, `artifact_data` has no `as_level`, and a capability's config — whatever access a `db` declaration asks for — is stored and never read |
| Artifact types | Different on purpose | Claude Code's types are pages hosted on claude.ai; here a type is a folder the project keeps, named by `type` — there is no `type_url` — and none ships with the extension. `quickstart` lists those folders and names the skill for a plain page (S19, S20) |
| Tab labels | Different on purpose | **This session** — what this session published or attached — stands where Claude Code says "Created by me", with **Other sessions** beside it |
| Delete | Different on purpose | Moves the folder to the Trash; nothing is unlinked (T4) |
| Additions | Pi's own | The `reply` capability and `ask`; the Status tab and `w` in the panel; `alt+a` instead of `ctrl+]`; the `sandbox` isolation fallback |
| `claude.hot` | Partly served | `snapshot`, `ready`, `signal`, `restart` and `data` work; `accept` is stored and never called, and `from` / `gen` stay `null` / `0`, because a new version is always a new document here |
| `comments` | Composer-only | The page opens the viewer's composer and writes nothing itself: every write verb rejects `not_granted` and `canSendToClaude()` answers `"off"` |
| `artifact.edit` · `artifact.sync` | Not served | They belong to live docs, which this host does not make; both reject `capability_disabled` |
| `downloads.save` with `request` | Not served | This host never asks a page for an export, so no token can name one: `request_unknown` |
| Latency compensation in `db` | Not served | Every snapshot is a fresh read of the one local server: `metadata` is always `{fromCache: false, hasPendingWrites: false}`, and a write's promise resolves once this view's own listeners have seen it |
| `assets` from the agent's side | Not served | Only the page reaches its assets: neither tool takes an `asset` to upload, lists them or deletes one, and `/api` has no route to them |
| `contract` | Not served | There is one runtime, `/_rt/claude.js`, and every version of every page loads it as it is now; no publish parameter pins a page to another |
| `mcp` · `room` · `sample` · `self` · `user` | Not served | They exist only as claude.ai services; `use()` resolves `null` and the publish result says so |
| `preflight.js` | Not served | The name is reserved at an artifact's root, and nothing runs it |

## Not built

**Reach beyond this machine** — the server binds loopback only; nothing fronts
it with a tunnel, and no relay serves viewers while the laptop is closed.

**More interaction schemas** — `questions/v1` is the only one registered; any
other island is returned to the model as untyped data.

**Types that ship** — none does: a type exists only once the project keeps one
under `.pi/artifact-types/`, and `quickstart` has nothing else to list.

**The agent's side of assets** — uploads are made, listed and deleted only
from the page; no tool action or `/api` route reaches `.store/assets/`.
