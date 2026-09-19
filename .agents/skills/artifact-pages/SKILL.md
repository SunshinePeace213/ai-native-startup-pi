---
name: artifact-pages
description: >-
  The contract for a page published with the `artifact` tool: when a page
  beats terminal text, the hard page rules (one self-contained file, the CSP,
  no relative links, how the shell serves a fragment), and how a page talks
  to the session — the `artifact-data` island, the `questions/v1` schema, the
  `[data-question]` / `[data-artifact-send]` markup, and `window.artifact`.
  Load it before writing or editing any file you will publish with the
  artifact tool, and before hand-writing controls that send input back to
  the session. Not for how the page looks: load artifact-design first for
  that; not for operating the tool (publish, ask, watch, comments — the tool
  description covers those); not for figures: load artifact-diagramming.
---

# Artifact pages

Load `artifact-design` first: it decides how the page looks. This skill is
what the page may do and how it talks to the session.

A page is worth its tokens when the reader must *see* something to decide or
understand: an annotated diff, options side by side, a dashboard, a plan
with a checklist, a form of more than two questions. If a paragraph in the
terminal says it, write the paragraph.

## Where the page lives

Write it at `.pi/artifacts/<slug>/<slug>.html` — choose the slug first
(lowercase letters, digits, hyphens; two to four words of the title). The
folder *is* the artifact: its name is the slug and the URL (`/a/<slug>`),
whatever the page's title says; publishing that path again republishes it in
place; deleting the artifact moves the whole folder, this file included, to
the trash. The server keeps its files beside the page in `.store/` — never
read or edit those; use the tool's `read` action. `.pi/artifacts/` is
git-ignored, so a page meant to be committed is written elsewhere in the
project (under `docs/`, say) and published from there; its slug then comes
from its title or the `slug` parameter. Never write a page to `.tmp/` or the
project root.

## Page rules

- **One self-contained file**, `.html` by default and `.md` only for prose.
  Inline all CSS and JS; embed images as `data:` URIs and prefer inline SVG
  or HTML/CSS over raster images, which are expensive in output tokens.
- **The CSP blocks every other host.** Google Fonts (`fonts.googleapis.com`,
  `fonts.gstatic.com`) is the one exception, and every face needs a fallback
  stack. No CDN scripts, no `fetch`/XHR/WebSocket beyond the page's own
  origin, no forms that post anywhere.
- **Relative links do not resolve**; use in-page anchors.
- **Write a fragment with its own `<style>`**: `<title>`, any font `<link>`,
  `<style>`, then markup, with no `<html>`, `<head>` or `<body>`. The shell
  adds the document, the viewport, the favicon and the runtime, and serves a
  styled fragment on a blank ground. Only a fragment with no stylesheet (and
  Markdown) gets the base look — an 860px column whose element rules would
  fight a designed page. The `--af-*` variables style the runtime's own
  controls; they are not the page's palette. The rendered page must stay
  under 16 MiB.
- Summarise large datasets instead of inlining them whole.

## The data island

The page's machine-readable record is a JSON object in
`<script type="application/json" id="artifact-data">…</script>` (or the
tool's `data` parameter). Inside the script write `<` as `<`. What the
user sends back is this island with their changes: a *reply* to the version,
never a new version.

Declaring `"schema": "questions/v1"` gets validation and a built-in form,
rendered into `<div data-artifact-questions></div>` or at the end of the body:

```json
{ "schema": "questions/v1", "intro": "Three calls before I build.",
  "questions": [
    { "id": "tiering", "header": "Pricing", "question": "Which model first?",
      "options": [ { "label": "Usage-based (Recommended)", "description": "…", "preview": "…" },
                   { "label": "Seat-based" } ],
      "recommended": 0, "whyItMatters": "Decides the billing table." },
    { "id": "region", "question": "Which region?",
      "options": [ { "label": "EU" }, { "label": "US" } ],
      "dependsOn": { "tiering": "Usage-based (Recommended)" } },
    { "id": "notes", "question": "Anything else?", "required": false } ],
  "assumptions": [ { "id": "stripe", "text": "Stripe stays the processor" } ],
  "answers": {} }
```

Questions take `ask_user_question`'s shape (`header`, `question`, `options`
with `label` / `description` / `preview`, `multiSelect`) plus `id`,
`required` (default true), `recommended`, `dependsOn`, `whyItMatters`,
`allowText`. Answers return as `answers[id] = { selected?: string[], text?:
string }`; assumptions answer `"confirm"` or `"override"`. Put the things the
user must *see* to answer — mockups, diffs, code shapes — on the page around
the form; that is the reason to use a page instead of the terminal.

## Hand-written controls

No code is needed for the common cases:

- `[data-question="id"]` containing `[data-option="label"]` rows — a click
  selects the row; add `data-multi` to the holder for multi-select. Free text
  is an `<input>` / `<textarea>` / `<select>` that carries `data-question`
  itself, or one marked `data-text` inside the holder.
- `[data-artifact-send]` on a button sends the island; give it a value
  (`data-artifact-send="approve"`) to send that as the island's `action`.

For anything else, `window.artifact`: `data.get()` / `data.set(patch)`,
`answer(id, value)`, `select(id, label, multi)`, `send(extra?)`,
`comment(text, { toAgent, anchor, threadId })`, `on("change" | "sent" |
"update", fn)`, `version`, `slug`. Send only from a user gesture: a send
without one is labelled page-generated when it reaches the session.

The shell already mounts the comments panel and live reload on republish,
and a send bar whenever the page has an island and no `[data-artifact-send]`
button of its own; do not build a second one.

## After publishing

`verify` reports console errors and failed loads from the browsers that
opened the page. Empty diagnostics are not evidence of a clean render.
