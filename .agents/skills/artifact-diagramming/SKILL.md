---
name: artifact-diagramming
description: >-
  When a diagram earns its place on an artifact page and how to draw one:
  show the mechanism rather than name it, draw the difference when comparing
  options, label every arrow, and hand-author inline SVG that stays legible
  in light and dark (`viewBox` sizing, `currentColor`, marker arrowheads, a
  grid, one figure one claim with a caption). Load it before adding any
  figure — architecture, data flow, state machine, before/after, sequence —
  to a page published with the artifact tool. Not for charts of data, and
  not for the page's layout or contract: load artifact-pages for those.
---

# Artifact diagramming

A diagram earns its place when it lets a reader who was not in the
conversation see a mechanism they would otherwise assemble from prose: where
data flows, which parts talk, what one option changes, what states a request
passes through. If a sentence says it faster, write the sentence.

## What to draw

- **The mechanism, not its name.** A box labelled "cache" says less than the
  prose. The path a request takes through it, the two stores it sits
  between, the arrow that disappears without it — that is what words cannot
  show. Draw the parts the argument turns on and leave out the rest.
- **For a comparison, the difference.** Two layouts side by side, or a before
  and an after, with the one edge each option adds or removes. One labelled
  box per option with nothing connecting them is the option list again.
- **As much as the decision needs.** A one-hop question is three boxes; a
  migration that reroutes writes through a queue needs the writer, the
  queue, the reader and the ordering arrow. Neither forced minimalism nor an
  inventory of the system.
- **Label the arrows.** `writes`, `invalidates`, `polls every 30s`. An
  unlabelled arrow only says "related". Use a legend only when an encoding
  (dashed, coloured) repeats; otherwise put the meaning on the mark.

## Inline SVG

Pages are one self-contained file under a CSP with no script hosts, so a
figure is hand-written inline `<svg>` with native shapes and `<text>`: no
library, no external image. The Markdown lane has no diagram fence — a page
that needs a figure is an `.html` page.

- **Size by `viewBox`**, scaled in CSS (`max-width: 100%; height: auto`).
  Choose the width and height for the content. Flows read left to right,
  stacks top to bottom.
- **Theme with `currentColor`** for strokes, text and arrowheads so the
  figure follows the page in both schemes. Keep one hue — a token from the page's own palette — for the
  one element that carries the point, and check it on both grounds.
- **Arrowheads** are a `<marker>` in `<defs>` referenced by
  `marker-end="url(#arrow)"`, or a small `<polygon>`; give the marker
  `fill="currentColor"`.
- **Text** at 11–13px at the drawn scale, aligned with `text-anchor`, a word
  or three per label. Sentences belong in the caption.
- **Align to a grid.** Shared baselines and even gaps are most of what makes
  a hand-drawn figure look deliberate.
- **One figure, one claim.** Wrap it in `<figure>` with a `<figcaption>` that
  states what the picture shows; give the `<svg>` `role="img"` and an
  `aria-label` with the same claim. Wide figures go in an
  `overflow-x: auto` box.
- **Self-contained.** No `<script>`, `<style>` or `<foreignObject>` inside
  the SVG; gradients and `<use>` reference ids in the same fragment. Long
  decorative path data means the drawing wants simplifying.

The example takes its one hue from a page token named `--accent`:

```html
<figure>
  <svg viewBox="0 0 420 90" role="img" aria-label="Reads hit the cache first; only a miss reaches the database"
       style="max-width:100%;height:auto" fill="none" stroke="currentColor" font-size="12">
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0L10 5L0 10z" fill="currentColor" stroke="none"/></marker></defs>
    <rect x="10" y="25" width="90" height="40" rx="6"/>
    <rect x="165" y="25" width="90" height="40" rx="6" stroke="var(--accent)"/>
    <rect x="320" y="25" width="90" height="40" rx="6"/>
    <path d="M100 45H163" marker-end="url(#arrow)"/>
    <path d="M255 45H318" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
    <g fill="currentColor" stroke="none" text-anchor="middle">
      <text x="55" y="49">API</text><text x="210" y="49">cache</text><text x="365" y="49">database</text>
      <text x="132" y="38">reads</text><text x="287" y="38">on miss</text></g>
  </svg>
  <figcaption>Reads hit the cache first; only a miss reaches the database.</figcaption>
</figure>
```
