---
name: artifact-design
description: >-
  The page contract and the design pass for every page published with the
  `artifact` tool: what the host wraps around the file, which scripts and
  fonts the CSP admits, how the three-state theme works, how to name the page
  and pick its icon word, then the design plan — named palette, paired
  typefaces, a layout concept — and how to build it cleanly. Load it first,
  before writing or restyling any .html or .md file you will publish, even a
  small one, and whenever the user says a page looks plain, generic, broken in
  dark mode, or unlike Claude Code's. Not for what a page can do at runtime
  (answers back to the session, saved state, downloads, a database): load
  artifact-capabilities for that; not for figures: load artifact-diagramming.
---

# Artifact design

The host follows Claude Code's Artifacts contract: a page written to these
rules renders the same there and here. Read the contract, then design.

## The page contract

**Format.** Author `.html`. Publish `.md` only for plain prose the user asked
to keep as Markdown; a Markdown page keeps its filename as its title and takes
almost none of the craft below. It is never a way to save time.

**Where it lives.** Write the page at `.pi/artifacts/<slug>/<slug>.html`; the
folder names the slug and the URL, publishing that path again republishes in
place, and deleting the artifact moves the folder to the Trash. The server's
files sit beside it in `.store/` — never read or edit those. A page meant to be
committed is written elsewhere in the project and published from there.

**Skeleton.** The file is wrapped at publish time, so write the content
directly: no `<!doctype>`, `<html>`, `<head>` or `<body>`. The wrapper carries a
charset, a viewport meta with `viewport-fit=cover`, and a five-rule reset: a
light `color-scheme`, `:root` padded by the safe-area insets, `body` at zero
margin with a 14px system font on an off-white ground, `img{max-width:100%}`,
and `[hidden]{display:none!important}` — so toggle visibility with
`el.hidden`, never `style.display`. Put your own `<title>` and `<style>` at the
top of the file. Nothing else is added to the document: no chrome, no styles,
no favicon. The viewer that frames the page draws the rest over it: a 💬
button at the bottom-right of every page, a Send bar along the bottom when the
page asks for answers, the theme switch and the version picker. Leave the
bottom-right corner and the bottom edge free of your own fixed controls.

**Title.** Set `<title>` in the first 8 KB. It names the page in the tab, the
gallery and the terminal footer, so make it a name: a short noun phrase of two
to four words, distinctive to this subject, never a category label and never a
name plus an explainer after a dash or colon. The file's `<title>` wins; the
tool's `title` only fills in when the file has none. The explanation goes in
`description`, one sentence. Keep the title stable across republishes.

**Icon.** On the first publish pass one short generic word as `icon`
(`chart`, `calendar`, `camera`): a plain signifier, never an emoji, a brand or
markup. Omit it on a republish so the page keeps the one it has.

**External resources.** From other hosts the CSP admits scripts only from
`https://cdnjs.cloudflare.com` (preferred), `https://cdn.jsdelivr.net/npm/`,
`https://cdn.tailwindcss.com` and `https://code.jquery.com`, and stylesheets
only from `https://fonts.googleapis.com` with the font files they pull from
`https://fonts.gstatic.com`. Everything else is blocked without a visible
error — every other host (unpkg and esm.sh included) and, even on those CDNs,
anything that is not a script: stylesheets, images, media, `fetch`, XHR,
WebSocket. Inline the rest and embed assets as `data:` URIs — or publish them
beside the page with the tool's `files`: a stylesheet, script, font, image or
data file published that way loads by its relative URL. Load a library as its pinned UMD build
(`…/ajax/libs/<lib>/<exact version>/<file>`), placed before the inline script
that uses its global. The page cannot start a download by itself. Mermaid is
drawn by the host: `<pre class="mermaid">` in HTML, a ```mermaid fence in
Markdown — never load the library.

**Storage.** `localStorage`, `sessionStorage` and IndexedDB work and belong to
this artifact alone; they survive republishes and never reach the session.
They can throw or come back empty, so wrap every access in `try/catch` and
render correctly without them. Use them for per-viewer conveniences only; state
that must persist or reach the session is a capability.

**Size.** The rendered page stays under 16 MiB, `data:` URIs included.

**Responsive.** The page also works at about 400px. One outer wrapper sets a
side gutter of at least 16px with `padding-inline` and its vertical padding
with `padding-block`; rows wrap or stack; images and any `aspect-ratio` box get
`max-width:100%`; nothing gets a `min-width` wider than the screen. Only
tables, code and figures may be wider, each in its own `overflow-x:auto` box —
the body never scrolls sideways. Keep the `:root` safe-area padding: a fixed
bar stays at `0` and adds `env(safe-area-inset-*)` to its own padding, a sticky
header uses `top: env(safe-area-inset-top, 0px)`, and a one-screen app sizes
with `height:100%` on `html` and `body`, not `100vh`.

**Theme.** The viewer has three states. An explicit choice stamps
`data-theme="dark"` or `data-theme="light"` on the root; the default "system"
stamps nothing, and only `prefers-color-scheme` separates light from dark.
Write the CSS for all three:

```css
:root { /* the complete light palette, every token */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* redefine the tokens only */ }
}
:root[data-theme="dark"] { /* the same dark tokens again */ }
```

Style components through tokens, never inside a media or `[data-theme]` block:
a colour that exists only there never applies in the un-stamped state. Give
`body` an explicit token background, and take every colour from the same token
set as the surface behind it. A page that commits to one visual world may skip
the dark blocks, and then still paints its ground and every colour explicitly.

## Read the request

The read sets the treatment, never whether to design.

- **Utilitarian** — a plan, a memo, a review, a questions page. Real
  typographic hierarchy, considered spacing, a chosen palette; no oversized
  hero, few flourishes.
- **Editorial** — a tool or explainer the user will keep, a landing page, a
  game, an open brief. Give it a point of view.

When unsure, a well-composed page is never wrong; an over-dressed one
sometimes is.

## Fundamentals

- **Honour what exists.** Look for a design system first — `AGENTS.md`,
  `CLAUDE.md`, a tokens or theme file. Precedence: the user's words, then the
  project's system, then your choices.
- **Ground it in the subject.** One subject, its audience, the page's single
  job. Carry at least one detail only this subject has — its units, its
  document conventions, its terms of art — as content, not ornament. Real
  content throughout, never filler.
- **Pair typefaces.** A display face with character, used with restraint; a
  body face that complements it; a utility face where there is data. Link
  Google Fonts, give every face a fallback stack, keep running text near 65
  characters, one type scale, `text-wrap: balance` on headings, a touch of
  letter-spacing on uppercase labels, `tabular-nums` where digits line up.
- **Load libraries, don't paste them** — and most pages need none.
- **Choose neutrals.** A grey biased slightly toward the accent reads as
  chosen; a pure mid-grey as inherited.
- **Let layout do the spacing.** `grid` or `flex` with `gap`, not per-element
  margins.
- **Compose repeated things as one object** — same edges, baselines and
  padding; a column count the items fill; text that can outgrow its track
  wraps or scrolls, never clips.
- **Not everything is a card.** Border, fill, radius and shadow each say
  "separate object"; lift the one thing that needs it. Big-number tiles only
  when the numbers are the point.
- **Draw charts to the scale.** One scale places marks, ticks and labels;
  chart text takes its colour from the tokens; leave room in the `viewBox`.
- **Show the page at rest.** Everything meant to be read is visible once
  loaded — never parked at `opacity:0`; a hero is sized to what it holds, not
  `100vh`; a tool opens in a realistic working state.
- **Avoid the generic looks** unless the user asked for one: cream with a
  serif and terracotta; near-black with one acid-green or vermilion pop;
  broadsheet hairlines; a purple-to-blue gradient hero; Inter or Space Grotesk
  as the safe face; emoji section markers; everything centred; one radius on
  every block; an accent rail on rounded cards.
- **Build cleanly.** Close every element, double-quote attributes, a visible
  `:focus-visible`, `prefers-reduced-motion` honoured, a stable `id` on every
  form control (the viewer carries form values, focus and scroll by `id`
  across a republish), `<canvas>` rather than long hand-written SVG paths for
  generative graphics. Watch the cascade: a type selector and a class fighting
  over one margin is how spacing disappears.
- **Words are design material.** The reader's side of the screen, active
  voice, controls that say what happens, errors that say how to fix it.
- **Structure is information.** Numbering, eyebrows and dividers encode
  something true or are left out.
- **When it is a UI**, it is scanned and operated: summary before detail,
  state in form as well as number, semantic colour apart from the accent,
  controls that look operable.

## Process

1. Decide what the viewer should be able to *do*. If the page takes input,
   keeps state, offers a file or talks back to the session, load
   `artifact-capabilities` now and design around it.
2. Write the design plan before any markup: **colour** as 4–6 hex values named
   for the subject, **type** for two or more roles, **layout** in a sentence or
   two. For an editorial read, revise any part you would have produced for any
   similar page.
3. Build from the plan; every colour and type decision derives from it.
4. Publish, then `verify` once for console errors, blocked loads and CSP
   violations. Fix what is visibly broken; further polish is the user's to ask
   for. Viewers with the page open move to the new version by themselves; a
   page holding state they would miss registers
   `window.claude?.hot?.snapshot(() => state)` and boots through
   `window.claude?.hot?.ready ? window.claude.hot.ready(start) : start({})`.

## Editorial principles

The opening is the thesis — the most characteristic thing in the subject's
world. Typography carries the personality. Motion serves the subject or is
absent; one orchestrated moment beats scattered effects. Match complexity to
the vision. Spend boldness in one place and keep the rest quiet.
