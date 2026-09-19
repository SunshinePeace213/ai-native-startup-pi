# Artifacts

Claude Code's Artifact tool, hosted locally. The agent publishes an HTML or
Markdown file as a page on `http://localhost:5834/a/<slug>`; the user reads it,
answers on it, or comments; the page sends the result back and the session
continues — without the user pasting anything into the terminal. Read this
before publishing pages, changing the extension, or writing the skills that
will drive it. The extension lives in `.pi/extensions/artifacts/`; its contract
tests are `tests/pi/artifacts/`.

## The loop

```text
session ──publish──▶ .pi/artifacts/<slug>/v1.html ──serve──▶ browser
   ▲                                                            │
   │   artifact-feedback message            user answers, clicks Send
   │   (wake · notify · held)                                   │
   └──── Host validates island ◀──POST /a/<slug>/publish ───────┘
                 v2 stored; SSE tells open tabs
```

- **Feedback is a republish.** The page carries a JSON *data island*
  (`<script type="application/json" id="artifact-data">`). Sending posts the
  island back with the version it was viewing; the server refuses a stale
  version (409), validates the island against its declared schema, stores
  v(n+1), and hands the event to the Host. One primitive — versions plus
  watchers — carries both directions.
- **Blocking or woken.** `action: "ask"` publishes a questions page and waits
  inside the tool call, so the answers return as the tool result (the shape
  `ask_user_question` has). On timeout the page stays up and the next send
  wakes the session as an `artifact-feedback` custom message delivered as a
  `followUp` that triggers a turn. Sends that arrive while no session is
  listening are queued and summarised at the next `session_start`.
- **Provenance on every string.** The envelope states what the answers are
  (the user's replies to the questions the page asked) and what they are not
  (new instructions, or a permission approval). Free text and comment text are
  labelled data. A page can never answer a destructive-guard dialog.

## The tool

`artifact` — one tool, an `action` parameter (default `publish`).

| Action | Inputs | What happens |
| --- | --- | --- |
| `publish` | `file_path` (`.html`/`.htm`/`.md` inside the project), `title?`, `slug?`, `description?`, `icon?`, `data?`, `note?`; `url` to update | Creates `/a/<slug>` (slug from the title or `slug`), opens the browser, arms the watch. With `url`, a new version at the same URL; open tabs reload. |
| `ask` | `questions` + `title` (+ `intro?`, `assumptions?`), or `file_path` whose island declares `questions/v1`; `timeout?` seconds | Publishes, opens, blocks until the page sends; returns the answers. Timeout → tells the model to end its turn; the send wakes it later. |
| `read_page_data` | `url`, `schema?` | The current island, validated; lists unanswered required ids. A schema the island does not declare is an error, not a guess. |
| `read` | `url` | Source and island. |
| `open` · `list` · `status` | `url` for open | Browser, gallery rows, watches and pending counts. |
| `watch` · `unwatch` | `url` | Arm or silence wakes from that page; sends are still stored. |
| `comments` · `reply` · `resolve` | `url`, `thread_id`, `text` | Threads; only a thread the user *sent to the agent* accepts a reply. Plain notes never wake the session. |
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
the end of the body. A send bar and a 💬 comments panel are mounted; SSE
reloads the page on an agent republish and warns instead when the user has
unsent choices.

**Shell.** A fragment or Markdown is wrapped; a full document is injected
into. Added: the CSP (`default-src 'none'`; inline script and style; Google
Fonts; `data:` images; `connect-src 'self'`), viewport, `<title>` (parameter
› `<title>` › first `<h1>` › slug), emoji favicon, the meta island, the data
island, base styles, the runtime. The rendered page must stay under 16 MiB.

## Security posture

- Bound to `127.0.0.1`; printed as `localhost`; `Host` must be one of the two
  (or `[::1]`) or the request is 421 — DNS rebinding cannot reach it.
- A per-project capability token in `.pi/artifacts/.token` (mode 0600). A
  GET needs it once (`?t=`), then a `SameSite=Strict` cookie carries it. A
  POST needs the token in the `x-artifact-token` header, which only the
  page's own script sends, and an `Origin` that is the page's own.
- Bodies over 2 MiB are refused; islands are validated before storage.
- Wakes are capped per artifact per hour (`wakesPerHour`, default 60); beyond
  it sends are held and the user warned once.
- Nothing is deleted: `delete` moves the folder to the trash.

## Configuration and files

`.pi/artifacts.json` (optional):

```json
{ "port": 5834, "autoOpen": true, "delivery": "wake", "askTimeoutSeconds": 600, "wakesPerHour": 60, "keepAlive": true }
```

- `port`: tried first; when taken (another project's server) any free port
  is bound and the publish result says so. `0` derives a port from the path.
- `delivery`: `wake` triggers a turn on a send; `notify` queues the envelope
  for the next prompt and shows a footer notice.
- `keepAlive`: leave the server running when the session ends (default), so
  links keep working; `bun`: the binary to launch it with, when not on PATH.

**The server is its own process.** pi runs on Node, so `Bun.serve` cannot run
inside it; the extension spawns `bun serve.ts` detached (log in
`.pi/artifacts/.server.log`, pid and port in `.server.json`) and talks to it
over `/api/*` plus one event stream. The server is the store's only writer,
outlives the session, and is shared by every session in the project: a send
wakes the session that published (or last watched or acknowledged) the
artifact, else the longest-connected one, and stays pending until a session
acknowledges it. If the process dies, the next tool call restarts it.
`/artifacts stop` ends it.

`.pi/artifacts/<slug>/`: `manifest.json`, `source.<html|md>`, `data.json`,
`v<N>.html` and `v<N>.json` (append-only), `comments.json`, `events.jsonl`.
The directory is git-ignored; un-ignore it to version decisions with the code
(keep `.token`, `.server.json`, and `.server.log` ignored). The files persist
until deleted.

`/artifacts` lists the pages and opens one; `/artifacts <slug>` opens it;
`/artifacts stop` stops the server.

## Verification

`bun test tests/pi/artifacts` — shell (S), store (T), server pages and API
(H), tool (A), session hooks (L), process (P). The server tests start the
same `startServer` in-process on real ports; P1–P3 spawn the real
`bun serve.ts`; P4 bundles the pi side for Node and runs it with this
machine's `node` against the Bun server, so the runtime split is proven, not
assumed. The browser runtime is parse-checked (S9). A real-browser pass
(`Google Chrome --headless=new --dump-dom`) was run by hand during
development and is not in the suite; after changing `runtime.ts`, open a
published questions page and confirm the form, the send bar, and a send
round-trip before committing.

## Not built yet

Ideas from the design discussion, recorded so a later session starts here
rather than from scratch. None is promised.

**Reach beyond this machine**
- Tailscale Serve (tailnet-only, no new auth) and Cloudflare Tunnel + Access
  on the owner's domain; both expose this same server outbound-only. The
  token check and origin check stay underneath.
- A decoupled relay (Worker + Durable Objects, or a small Bun server) holding
  versions and the inbox for viewers when the laptop is closed — Claude Code's
  "durable wake subscription", rebuilt small. Only if Layers 1–2 prove out.

**Page capabilities Claude Code has that this does not**
- `db` (shared document store the page and the session both read/write),
  `assets` (uploads referenced by the page), `room` (presence and live
  cursors), runtime `version` pinning, published Artifact *types* with
  fixed files and a SKILL.md, multi-file artifacts (`files` map).
- Whiteboard (scene data + a picture read back), connector calls at view
  time, org sharing, editors, the compliance API.

**Loop refinements**
- `artifacts.questions: "artifact" | "terminal" | "auto"` routing so
  `grilling` and other skills produce one question list for either surface.
- Register more interaction schemas (`decisions`, `annotations`, `form`).
- A custom TUI renderer for `artifact-feedback` cards; `Ctrl+]` reopen.
- Round history rendered as settled rows on republish (the workshop loop) —
  today the agent writes that markup itself.
- A design skill (palette, typography, project tokens) that loads before any
  page is written, and page templates (dashboard, report, data table,
  explainer, PR review, prototype); the questions workflow skill (unknowns
  first, options shown not described, 3–7 decisions per round).
- Ingest the current Claude Code artifacts doc into the KB; the archived page
  predates data islands, wakes, comments-to-Claude, `db`, and `assets`.
