# Artifacts

Claude Code's Artifact tool, hosted locally. The agent publishes an HTML or
Markdown file as a page on `http://localhost:5834/a/<slug>`; the user reads it,
answers on it, or comments; the page sends the reply back and the session
continues — without the user pasting anything into the terminal. The pages a
session published sit in the terminal footer as clickable badges; `down`
from an empty prompt selects one and `alt+a` opens the newest. Read this before publishing pages, changing the extension, or
writing the skills that will drive it. The extension lives in
`.pi/extensions/artifacts/`; its contract tests are `tests/pi/artifacts/`.

## Layout

Two runtimes meet in this extension — pi (Node) and the server (Bun) — so the
source is layered by responsibility, with the runtime boundary enforced by
`tests/pi/artifacts/structure`: the pi side never imports the server's
modules, `domain/` imports nothing, and only `infra/http/server.ts` names
`Bun`. This is pi's "directory with `index.ts`" style with a `src/` tree
inside it; `pino` is a root dependency, so no nested `package.json` is
needed.

```text
.pi/extensions/artifacts/
├── index.ts                 pi entry: the composition root; wires and registers, starts nothing
└── src/
    ├── domain/              pure rules both processes agree on
    │   ├── types.ts · protocol.ts · config.ts · versioning.ts · retention.ts · envelope.ts · text.ts
    │   └── schemas/         questions/v1 and the registry
    ├── app/                 use-cases over ports, no I/O
    │   ├── ports.ts         ArtifactStore · Renderer · Logger
    │   ├── core.ts          publish · respond · comments · pin · diagnostics · sweep (the store's only writer)
    │   └── routing.ts       who a page event reaches; what a delivered event becomes
    ├── infra/               adapters
    │   ├── store/           store.ts (fs layout) · control.ts (.server/ token, viewer, record, lock)
    │   ├── http/            server.ts (Bun.serve, one port) · auth.ts · events.ts · routes/{pages,api,gallery}.ts
    │   ├── render/          shell.ts · markdown.ts
    │   ├── client/          client.ts (fetch + SSE, pi side)
    │   ├── process/         launch.ts (probe, lock, spawn, stop) · opener.ts
    │   ├── log/             logger.ts (pino, daily files, redaction)
    │   └── config.ts
    ├── ui/                  inside pi
    │   ├── host.ts          one per project per session: stream, delivery, the strip
    │   ├── hooks.ts         session_start / session_shutdown · alt+a
    │   ├── strip.ts         the footer badges and their selection
    │   ├── selector.ts      the footer's keys · editor.ts  `down` hands it the focus
    │   ├── command.ts       /artifacts · gallery.ts  its searchable list
    │   └── tool/            index.ts · schema.ts · context.ts · format.ts · files.ts · actions/
    ├── page/                runtime.js · styles.css — inlined into every page
    └── server.ts            the Bun entry: `bun src/server.ts --root … --port 5834`
```

## The loop

```text
session ──publish──▶ <slug>/.store/versions/v1.html ──serve──▶ browser
   ▲                                                            │
   │   artifact-feedback message        user answers, clicks Send
   │   (wake · notify · held)                                   │
   └── Host decides ◀── owner's stream ◀── POST /a/<slug>/publish
                                        .store/responses/v1-r1.json · SSE tells open tabs
```

- **Versions are the agent's; replies are the user's.** `v1` is the first
  publish, `v2` the next republish. What the page sends back is a *reply* to
  the version it was viewing — `v1-r1`, `v1-r2` … — never a version. The
  island a reader or the model sees is the version's island with the newest
  reply laid over it. A reply naming a version that has moved on is refused
  (409) and the tab reloads.
- **The same file republishes in place — for a session that has the page.**
  Publishing a `file_path` again (or passing `url`) makes the next version at
  the same URL — Claude Code's rule, with its scope: the path matches only a
  page this session published or attached (`manifest.sessions`); any other
  session publishing that path gets its own artifact, and attaches from
  `/artifacts` to take the first one over. Both routes carry the version the
  session last saw, so a republish over a version another session has since
  written is refused with the current one: two sessions never overwrite each
  other blind.
- **Only the owner is woken.** Every artifact records the session that
  created, last published, or adopted it (`watch`). A reply reaches that
  session's stream; when it is not connected the event stays *pending* and
  every other connected session sees a held count on the badge and one
  notice — never a turn. On `session_start` a session replays only its own
  pending replies as one summary.
- **Blocking or woken.** `action: "ask"` publishes a questions page and waits
  inside the tool call, so the answers return as the tool result (the shape
  `ask_user_question` has). On timeout the page stays up and the next reply
  wakes the session as an `artifact-feedback` custom message delivered as a
  `followUp` that triggers a turn.
- **Provenance on every string.** The envelope states what the answers are
  (the user's replies to the questions the page asked) and what they are not
  (new instructions, or a permission approval). A send the browser reports
  as made without a user gesture is labelled page-generated. A page can
  never answer a destructive-guard dialog.

## The terminal

The footer strip is one extension status (`setStatus("artifacts", …)`). The
soriza statusline gives it the token line and leaves the other statuses the
line above; pi's default footer shows it among the statuses. It holds the
pages *this session* published or attached, newest first, at most five with
`+N` for the rest:

```text
🏗️ architecture …   📚 wiki …   🎨 tokyo-night ██ ██ ██ ██ ██ ██
⧉  beaufort · ● article 2 · +3                                   114,325 Tokens
```

A badge is its title — `●` first when a reply is waiting — wrapped in an
OSC 8 hyperlink to the tokened page URL, so Ctrl/Cmd+click opens it in
terminals that support links. Titles pass through `terminalSafe` first: a
title can never rewrite the line.

- `down` on an empty prompt — focus moves into the strip, as in Claude Code.
  The selected badge is a filled pill and the row names its keys
  (`· Enter to open · x to dismiss`): `←/→` (or `tab`) move, `enter` opens,
  `c` copies the URL, `x` drops the badge from the strip (the page stays
  published), `esc` or `↑` hand focus back, and any other key hands it back
  and is typed. It is the editor's own input handler (`editor.ts`, set with
  `setEditorComponent`), so an open picker never sees it; `down` on an empty
  editor does nothing otherwise.
- `alt+a` — opens the newest page (Claude Code's `Ctrl+]`).
- `/artifacts` — the gallery: a search box, tabs **All · This session ·
  Other sessions**, rows `⧉ title  v2 · pinned · 1 pending · 3h ago` pinned
  first then newest. `enter` attaches the page to this session (it becomes
  the owner, the badge appears, and the model is told with the next prompt
  to `read` it before changing it), `o` opens, `c` copies, `p` pins, `w`
  turns its wakes off or on — the user's own off-switch — `d` then `y` moves
  it to the trash, `/` searches, `r` refreshes, `esc` leaves.
  `/artifacts <slug>` opens it; `pin`/`unpin <slug>`; `sweep`; `stop`;
  `restart` (stop, then a fresh server at once — the session keeps its badges).
  Without a UI the list prints as text.

Tool results carry a one-line card (`🧩 Pricing plan v2 published v2`), and
the model is told not to paste URLs: the strip shows them.

## The tool

`artifact` — one tool, an `action` parameter (default `publish`).

| Action | Inputs | What happens |
| --- | --- | --- |
| `publish` | `file_path` (`.html`/`.htm`/`.md` inside the project), `title?`, `slug?`, `description?`, `icon?`, `data?`, `note?`; `url` to update | Creates `/a/<slug>` as v1 and opens the browser; the same `file_path` again, or `url`, makes the next version in place; open tabs reload. |
| `ask` | `questions` + `title` (+ `intro?`, `assumptions?`), or `file_path` whose island declares `questions/v1`; `timeout?` seconds | Publishes, opens, blocks until the page replies; returns the answers. Timeout → tells the model to end its turn; the reply wakes it later. |
| `read_page_data` | `url`, `schema?` | The current island (version + newest reply), validated; lists unanswered required ids. |
| `read` | `url` | Source and island. |
| `verify` | `url` | Runtime diagnostics viewers' browsers reported for the current version (console errors, failed loads). None is *not* evidence of a clean render. |
| `open` · `list` · `status` | `url` for open | Browser; every artifact; ownership, watches, pending. |
| `watch` · `unwatch` | `url` | Adopt the page (this session is woken by it) or silence wakes; replies are stored either way. |
| `pin` · `unpin` | `url` | Exempt from the retention sweep; first in lists. |
| `comments` · `reply` · `resolve` | `url`, `thread_id`, `text` | Threads; only a thread the user *sent to the agent* accepts a reply. |
| `delete` | `url` | After `ui.confirm`, moves the folder to `~/.Trash`; refuses headless. |

`url` accepts the slug, the path, or the full page URL.

## The page contract

**Island.** Any JSON object. Declaring `"schema": "questions/v1"` gets
validation and the built-in form:

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
assumptions answer `"confirm"` or `"override"`. Inside a `<script>` the author
must write `<` as `\u003c`; the shell re-emits every island escaped.

**Runtime.** Every page gets `window.artifact`:
`data.get()/set(patch)`, `answer(id, value)`, `select(id, label, multi)`,
`send(extra?)`, `comment(text, {toAgent, anchor, threadId})`, `on("change" |
"sent" | "update", fn)`, `version`, `slug`. Hand-written markup binds without
code: `[data-question=id] [data-option=label]` rows toggle, inputs with
`data-question` carry text, `[data-artifact-send="action"]` buttons send. A
questions island renders into `[data-artifact-questions]` or, absent that, at
the end of the body. A 💬 comments panel is mounted, and a send bar when the
page has an island and no send button of its own; SSE
reloads the page on an agent republish (warning instead when the user has
unsent choices) and on a reply sent from another tab; the stream greets every
(re)connection with the current version, so a tab that missed a broadcast
during a server restart catches up by itself. A probe injected in `<head>`
captures uncaught errors, `console.error/warn`, failed resource loads, and
unhandled rejections from the first byte — including what a page script does
before the runtime is reached — and the runtime posts them to
`/a/<slug>/diagnostics`, which `verify` reads.

**Shell.** A full document is injected into; a fragment or Markdown is
wrapped. A fragment with its own `<style>` is served on a blank ground
(`body.af-ground`: margin, ground, ink and face only, no column), because the
base look's element rules (`.af-base h1`, `.af-base p` …) outrank a page's
own `h1` and its 860px column boxes a designed layout in; only a fragment
with no stylesheet, and Markdown, get `af-base`. Added: the CSP (`default-src 'none'`; inline script and style; Google
Fonts; `data:` images; `connect-src 'self'`), viewport, `<title>` (parameter
› `<title>` › first `<h1>` › slug), emoji favicon, the meta island, the data
island, the diagnostics probe, base styles, the runtime. The rendered page
must stay under 16 MiB.

## Security posture

Two capabilities, never one:

- **Viewer** (`.server/viewer`, 0600): page URLs carry it once in `?t=`;
  the server answers 303 to the clean URL and sets it as an `HttpOnly;
  SameSite=Strict` cookie. It reads pages and lets a page act on itself. The
  page's script never sees it.
- **Session** (`.server/token`, 0600): only the pi process sends it, in
  `x-artifact-token`, on `/api/*`. A browser cannot send that header
  cross-site, and no page holds it.

A page's own POST (`/a/<slug>/publish|comments|diagnostics`) needs the viewer
cookie, an `Origin` that is the server's own, and `x-artifact-page: <slug>`
— a custom header that forces a CORS preflight any other origin fails. So an
inline script in one artifact cannot publish, delete, stop the server, or
read other artifacts, and a dev server on another `localhost` port that
receives the cookie (cookies ignore ports) gets a read-only viewer
capability, not the API.

Also: bound to `127.0.0.1`; `Host` must be `127.0.0.1:port` or
`localhost:port` or the request is 421; `/api/health` is open on loopback and
reports the root and a token *digest*, never a token; bodies over 2 MiB are
refused; islands are validated before storage; wakes are capped per artifact
per hour (`wakesPerHour`); titles are control-stripped before the footer;
logs redact `token`, `viewer`, and cookies; nothing is deleted — `delete`
and the sweep move folders to the trash, only expired log folders are
removed.

## Server lifecycle

**One port, one server, many sessions.** The server binds exactly the
configured port (5834) — a taken port is never worked around. On
`session_start` every session probes `/api/health`:

| The port answers | The session |
| --- | --- |
| our server (same store root), started after its source last changed | attaches, whichever session started it |
| our server, but older than the newest file under `src/` | stops it and spawns a fresh one, so `/reload` after an edit never leaves old code serving pages; pending replies are on disk and other sessions' streams reconnect |
| an artifact server for another project | refuses, naming that root and pid; set `port` for this project or `/artifacts stop` there |
| another program | refuses, naming the port |
| nothing | spawns `bun src/server.ts` under `.server/lock`; a second session starting at the same moment waits and attaches |

The server re-reads its tokens from disk when a request presents something
else (a rotated `.server/token` never orphans a process), exits when its
store root disappears, and outlives sessions (`keepAlive`, default). A
session leaving tells the server (`/api/detach`) so replies are held rather
than sent into a dead stream. `/artifacts stop` ends it and `/artifacts
restart` replaces it at once. Neither is needed after an edit — a server older
than its source is replaced by itself — and nothing is lost either way: pages
and held replies are on disk, and every session's stream reconnects.

**Retention.** `retentionDays` (14): an unpinned artifact whose last
activity — publish, reply, comment, or view — is older than that is moved
to `~/.Trash/pi-artifacts/<date>/<slug>`; `logs/<date>/` folders older than
that are removed. The server sweeps at start and daily; `session_start` and
`/artifacts sweep` ask for one.

## Configuration and files

`.pi/artifacts.json` (optional):

```json
{ "port": 5834, "autoOpen": true, "delivery": "wake", "askTimeoutSeconds": 600,
  "wakesPerHour": 60, "keepAlive": true, "retentionDays": 14 }
```

- `port`: the only port bound. `delivery`: `wake` triggers a turn on a reply;
  `notify` queues it for the next prompt and shows a footer notice.
- `keepAlive`: leave the server running when the session ends (default);
  `bun`: the binary to launch it with, when not on PATH.

```text
.pi/artifacts/
├── .server/                  token · viewer · record.json · lock · server.log
├── logs/<YYYY-MM-DD>/        <session-id>.jsonl (pi side) · server.jsonl (server, `session` per line)
└── <slug>/                   the artifact is its folder
    ├── <slug>.html|md        the page the agent authors and edits; the server never writes it
    └── .store/               the server's files
        ├── manifest.json     title · owner · sessions · current · versions · responses · pinned · pending · lastActivityAt
        ├── index.html        the current page: the version with the newest reply over it
        ├── source.html|md    the source as last published (the authored page may have moved on)
        ├── versions/v<N>.html · v<N>.json      agent versions as published, append-only
        ├── responses/v<N>-r<K>.json            page replies, bound to a version
        └── comments.json · diagnostics.json · events.jsonl
```

**The artifact is its folder.** The tool tells the model to write the page
at `.pi/artifacts/<slug>/<slug>.html`; a page authored there publishes to the
slug its folder names, whatever its title (`slugForSourcePath`), a `slug`
parameter that disagrees is refused, and a folder another session owns
answers "already lives at … pass url". `delete` and the retention sweep move
the whole folder to the trash, authored page included — pin what should
outlive 14 idle days. A file anywhere else in the project still publishes
(slug from the title or `slug`): that is where a page meant for git goes,
since `.pi/artifacts/` is ignored. A store written before `.store/` existed
is moved under it when the server starts (`Store.migrate`). `access-guard`
lists `.server/token` and `.server/viewer` as sensitive, because the model
now writes one folder away from them.

Logs are pino JSON lines — `{time, level, pid, component, session, action,
slug, version, response, msg, …}` — one file per session and one for the
server per day, under the local date, with `time` as the local wall clock and
its offset (`2026-09-20T07:22:36.062+08:00`); `ARTIFACTS_LOG_LEVEL` sets the
level. Stored data (`manifest.json`, `record.json`) keeps UTC: those
timestamps are sorted and compared as strings. The directory is
git-ignored.

## A demo page

`.pi/artifacts/artifact-demo/artifact-demo.html` (git-ignored; recreate it from this description if
it is gone) is the by-hand check of the whole loop: the built-in
`questions/v1` form with previews, a dependent question, a multi-select, and
assumptions; a hand-written `data-question`/`data-option` mirror of the first
question; a `data-artifact-send="approve"` button; a live readout of
`window.artifact`; a "post a comment" button; and one intentional
`console.warn` on load so `verify` has something to show. Publish it with the
tool (`file_path: .pi/artifacts/artifact-demo/artifact-demo.html`), then walk the checklist the page
itself lists: the footer badge and `alt+a`, a send (reply 1 to v1), a second
send (reply 2), a comment, `verify`, and a republish (the tab reloads).

## Verification

`bun test tests/pi/artifacts` — domain rules (D), store (T), HTTP (H),
process (P), session (S), structure (B); every file opens with its numbered
contract. The server tests start the same `startServer` in-process; P1–P5
spawn the real `bun src/server.ts` on a free port and prove the fixed-port
policy, the lock, token rotation, and the logs. `bun test` pins its own
process to UTC while a spawned server keeps the host zone, so P5 looks under
any day's folder. The browser runtime is linted and parse-checked (B5); after
changing `src/page/runtime.js`, open a published questions page and confirm
the form, the send bar, a reply round-trip, and `verify` seeing the load
before committing.

## Against Claude Code's loop

Reviewed 2026-09-20 against `llm-wiki/raw/docs/claude-code/artifacts.md`.

| Step | Claude Code | Here |
| --- | --- | --- |
| Before writing | A design skill; diagramming and capabilities skills on demand | `.agents/skills/artifact-design` (the read, the design plan, the generic looks to avoid, building it cleanly), `artifact-pages` (page rules, the island and `window.artifact`) and `artifact-diagramming`; the tool description names them and keeps the rules to one line |
| Publish | Permission prompt on a new artifact; prints the URL; `Ctrl+]` reopens the latest | No prompt — localhost and private, on purpose; a footer badge instead of a URL; `alt+a` |
| Update | Same file, same URL, within the session; another session passes the URL or attaches; a conflict hands back the newer version | The same, see *The loop* |
| Find again | `/artifacts`: search, tabs, `Enter` attaches | The gallery; "Shared with me" is **Other sessions** |
| Feedback | A comment sent to Claude wakes the session; 60/hour; the user can stop it | Structured sends, blocking `ask`, comments, the same cap; `w` in the gallery |
| Footer | A pill per artifact; `down` focuses the footer | The same |

Claude Code's page capabilities (`db`, `room`, `user`, `assets`, `mcp`,
`sample`) are not cloned: they answer multi-viewer and organisation problems a
single-user localhost server does not have.

## Not built yet

**Reach beyond this machine** — Tailscale Serve or Cloudflare Tunnel in
front of this same server; a relay for viewers when the laptop is closed.

**Page capabilities Claude Code has that this does not** — `db`, `assets`,
`room`, multi-file artifacts, published artifact *types*, whiteboard,
connectors, org sharing.

**The gallery's rename** (`Ctrl+R` in Claude Code) — needs a server route and
a core use-case; nothing renames a page today except a republish with `title`.

**Supporting files** — the CSP already allows `img-src 'self'` but no route
serves assets, so every image passes through the model's output as a data
URI; a `files` parameter copied into the store and served under
`/a/<slug>/files/` would remove that cost. A Mermaid fence for the Markdown
lane, which has no way to draw.

**Loop refinements** — `artifacts.questions: "artifact" | "terminal" |
"auto"` routing for `grilling`; more interaction schemas (`decisions`,
`annotations`, `form`); round history rendered as settled rows on republish;
page templates; ingesting the current Claude Code
artifacts doc into the KB.
