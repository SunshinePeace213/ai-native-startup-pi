---
name: artifact-design
description: >-
  The design pass for every page published with the `artifact` tool: read how
  much treatment the request wants (a plan or memo, versus a tool, explainer
  or anything the user said could be "any topic"), ground the look in the
  subject, write a short design plan — named palette, paired typefaces, a
  layout concept — before any markup, then build it cleanly: tokens for
  every colour, one type scale, grid and gap, semantic elements, focus and
  reduced-motion, both colour schemes. Load it first, before writing or
  restyling any .html or .md file you will publish, even a small one, and
  whenever the user says a page looks plain, generic, weird or unlike Claude
  Code's. Not for the page contract (the island, `window.artifact`, the CSP):
  load artifact-pages for that; not for figures: load artifact-diagramming.
---

# Artifact design

Work as the design lead of a small studio: every page gets a visual identity
pitched at what the task calls for, with a palette, typefaces and layout
chosen for *this* subject. A page assembled from defaults — the system font,
one accent colour, the same bordered card around every block — is the failure
this skill exists to prevent.

## 1. Read the request

The read sets the treatment, never whether to design.

- **Utilitarian** — a plan, a memo, a review, a questions page. Real
  typographic hierarchy, considered spacing, a chosen palette; no oversized
  hero, few flourishes.
- **Editorial** — a tool or explainer the user will keep or share, a
  landing page, a game, and any open brief ("make an artifact about
  anything"). The user is asking to be shown something; give it a point of
  view.

When unsure, a well-composed page is never wrong; an over-dressed one
sometimes is.

## 2. Honour what exists

Look for a design system first — `AGENTS.md`, `CLAUDE.md`, a tokens or theme
file, existing component styles. Precedence: the user's words, then the
project's system, then your choices. Everything below only fills gaps.

## 3. Ground it in the subject

Name one concrete subject, its audience, and the single job of the page.
Distinctive choices come from the subject's own world — its materials,
instruments, units, document conventions, terms of art. Carry at least one
detail only this subject has, as content and not ornament: the warning
pennants on a wind scale, true hydration in a bread formula. Use real
content throughout, never filler.

## 4. Write the design plan before any markup

Three lines, in your reply or your notes, and then every decision derives
from them:

- **Colour** — 4–6 hex values *named for the subject* (`--sea`, `--foam`,
  `--rust`; `--rye`, `--crust`, `--enamel`), not `--accent` and `--bg`.
  Neutrals are chosen too: a grey biased slightly toward the accent reads as
  picked, a pure mid-grey as inherited.
- **Type** — typefaces for at least two roles: a display face with
  character, used with restraint; a body face that complements it; a mono or
  utility face when there is data. Google Fonts is the one font host the CSP
  admits — link it (`<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=…&display=swap">`) and give
  every face a real fallback stack. Do not reach for the same families on
  every page.
- **Layout** — the concept in a sentence or two: what leads, how many
  columns, what is lifted.

For an editorial read, check the plan against the subject before building:
any part that you would have produced for any similar page gets revised.

## 5. Avoid the generic looks

Where the user pinned a direction, follow it exactly. Where they did not, do
not spend the freedom on one of these: the system or Inter font as the safe
face; near-black with one acid-green or vermilion pop; warm cream with a
serif and terracotta; a purple-to-blue gradient hero; an emoji in the
heading or as section markers; everything centred; one radius and one border
on every block; big-number stat tiles when the numbers are not the point;
`01 / 02 / 03` markers on content that is not a sequence.

## 6. Editorial principles

- **The opening is the thesis.** Lead with the most characteristic thing in
  the subject's world — a live demo, an interactive moment, a drawn scene —
  sized to what it holds, never `100vh`.
- **Spend boldness in one place** and keep the rest quiet. If the accent
  fights the ground, shift its hue or drop its saturation.
- **Motion serves the subject or is absent.** One orchestrated moment beats
  scattered effects. For generative or atmospheric graphics use `<canvas>`
  (handle `devicePixelRatio` and resize), not long hand-written SVG paths.
- **Not everything is a card.** Border, fill, radius and shadow each say
  "separate object"; lift the one thing that needs it.
- **When it is a tool**, it is operated, not read: summary before detail,
  state encoded in form as well as number, controls that look operable, and
  semantic colour (ok / warning / danger) kept apart from the accent.
- **Open in a working state** — a sensible preset loaded, so the first
  frame shows what the page does. Everything meant to be read is visible at
  rest, never parked at `opacity: 0` waiting for a scroll.

## 7. Build it cleanly

How the file is written is most of how it looks.

- **The page is a fragment with its own `<style>`.** Start with `<title>`,
  then the font `<link>`, then `<style>`, then markup — no `<html>`, `<head>`
  or `<body>`. A fragment that brings a stylesheet is served on a blank
  ground: no column, no base rules. Begin the stylesheet with
  `*, *::before, *::after { box-sizing: border-box }`, and paint `body`'s
  background, colour and font from your tokens.
- **Every colour is a token.** Declare the whole palette on `:root` and
  style through `var(--…)`. A literal `rgba(…)` repeated at six opacities is
  a missing token; use `color-mix()` for tints. The `--af-*` variables
  belong to the runtime's own controls — they are not your palette.
- **Both schemes.** `:root` holds the complete light palette;
  `@media (prefers-color-scheme: dark)` redefines *only the tokens*. Never
  define a colour solely inside the dark block. A page that commits to one
  visual world (a night sea, a letterpress card) may stay single-theme: then
  set `color-scheme`, paint every colour explicitly, and say so in a comment.
- **One type scale.** Five or six sizes, declared once; if the stylesheet
  holds ten different `font-size` values, the scale is missing. Running text
  near 65 characters (`max-width: 60ch`), `text-wrap: balance` on headings,
  letter-spacing on uppercase labels, `font-variant-numeric: tabular-nums`
  wherever digits line up or change.
- **Layout does the spacing.** Sibling groups are `grid` or `flex` with
  `gap`; zero the default margins instead of tuning `margin-top` per element.
  One outer wrapper sets `padding-inline` of at least 16px and `padding-block`
  separately. Go as wide as the content earns (a tool often wants
  1000–1100px and two columns); stack to one column near 400px; only tables,
  code and figures scroll sideways, each in its own `overflow-x: auto` box.
- **Compose repeated things as one object** — same edges, baselines and
  padding from one card or row to the next; a column count the items fill.
- **Semantic elements.** `header`, `section`, `figure`, `dl` for label–value
  pairs, `table` with `thead`/`tfoot`, `label for=` on every control, a
  stable `id` on every form control.
- **Operable and calm.** A visible `:focus-visible` state, `aria-pressed` /
  `aria-current` on toggles, `aria-live="polite"` on a readout that changes,
  `role="img"` with an `aria-label` on drawn graphics, and
  `@media (prefers-reduced-motion: reduce)` honoured by every animation.
- **One data array, one render function.** State lives in data; the DOM is
  derived from it in a single `render()`/`update()`. No one-off special cases
  in event handlers.
- **Charts are drawn to their scale.** One scale places marks, ticks and
  labels; labels stay clear of marks and inside the `viewBox`; chart text
  takes its colour from the tokens.
- **Watch the cascade.** A type selector and a class selector fighting over
  the same margin is how spacing silently disappears.

## 8. Words and the name

Copy is design material: write from the reader's side, active voice, controls
that say what happens, specific over clever. The `<title>` is the page's name
in the footer strip and the gallery — two to four words, specific to the
subject, no explainer after a dash or colon; the explanation goes in the
tool's `description`.

## 9. Look once, then publish

Publish, then `verify` once for console errors and failed loads (a font that
did not load is the usual one). Fix what is visibly broken; further polish is
the user's to ask for.
