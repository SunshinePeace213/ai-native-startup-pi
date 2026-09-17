---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/pi/rpc.md, title: "RPC Mode", id: src_3c01fb9c03bd}
  - {resource: llm-wiki/raw/docs/pi/themes.md, title: "Themes", id: src_d432de1cd9da}
  - {resource: llm-wiki/raw/docs/pi/tui.md, title: "TUI Components", id: src_1d072e1d683a}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_tui]
claim_ids: [clm_e0c84f167157, clm_fafe9fb8b66e, clm_8737c7ca6b63, clm_0c8568fc38b5, clm_b36b56efd6d5, clm_6a82f1ec6eda, clm_e467f67072a9, clm_1b9e0668b95f]
confidence: 0.92
stale_after: 2027-01-29
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# TUI

> **In here:** Every line a Pi TUI component returns from render() must fit within the width parameter it was given · 8 claims, confidence 0.92.

## Current understanding

- Pi extensions and custom tools can draw their own TUI components to build interactive interfaces inside the agent (0.93)
- A Pi theme is a JSON file defining the colors of the TUI (0.93)
- Every line a Pi TUI component returns from render() must fit within the width parameter it was given (0.92)
- Pi lets the user submit while the agent works: Enter queues a steering message delivered once the current assistant turn finishes its tool calls, and Alt+Enter queues a follow-up delivered after all work completes (0.92)
- Pi's TUI appends a full SGR and OSC 8 reset to each rendered line, so styles never carry across lines and multi-line styled text must reapply them per line (0.92)
- A theme change makes Pi's TUI call invalidate() on every component to drop cached renders, so a component that does not implement it correctly will not pick the new theme up (0.92)
- In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI (0.92)
- Pi's guidance is to reuse the built-in SelectList, SettingsList, and BorderedLoader components, which cover about 90% of extension UI cases, rather than rebuild them (0.91)

## Evidence

- `clm_e0c84f167157` — "Pi extensions and custom tools can draw their own TUI components to build interactive interfaces inside the agent." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "Extensions and custom tools can render custom TUI components for interactive user interfaces."
- `clm_fafe9fb8b66e` — "A Pi theme is a JSON file defining the colors of the TUI." · p 0.93 · active · 1 support · 0 contradict
  - `src_d432de1cd9da` Themes: "Themes are JSON files that define colors for the TUI."
- `clm_8737c7ca6b63` — "Every line a Pi TUI component returns from render() must fit within the width parameter it was given." · p 0.92 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "**Critical:** Each line from `render()` must not exceed the `width` parameter."
- `clm_0c8568fc38b5` — "Pi lets the user submit while the agent works: Enter queues a steering message delivered once the current assistant turn finishes its tool calls, and Alt+Enter queues a follow-up delivered after all work completes." · p 0.92 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "**Enter** queues a steering message, delivered after the current assistant turn finishes executing its tool calls."
- `clm_b36b56efd6d5` — "Pi's TUI appends a full SGR and OSC 8 reset to each rendered line, so styles never carry across lines and multi-line styled text must reapply them per line." · p 0.92 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "The TUI appends a full SGR reset and OSC 8 reset at the end of each rendered line. Styles do not carry across lines."
- `clm_6a82f1ec6eda` — "A theme change makes Pi's TUI call invalidate() on every component to drop cached renders, so a component that does not implement it correctly will not pick the new theme up." · p 0.92 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "When the theme changes, the TUI calls `invalidate()` on all components to clear their caches. Components must properly implement `invalidate()` to ensure theme changes take effect."
- `clm_e467f67072a9` — "In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI." · p 0.92 · active · 1 support · 0 contradict · when: in RPC mode
  - `src_3c01fb9c03bd` RPC Mode: "Note: `ctx.mode` is `"rpc"` and `ctx.hasUI` is `true` in RPC mode because the dialog and fire-and-forget methods are functional via the extension UI sub-protocol."
- `clm_1b9e0668b95f` — "Pi's guidance is to reuse the built-in SelectList, SettingsList, and BorderedLoader components, which cover about 90% of extension UI cases, rather than rebuild them." · p 0.91 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "`SelectList`, `SettingsList`, `BorderedLoader` cover 90% of cases. Don't rebuild them."

## Timeline

- 2026-09-11 new_claim `clm_0c8568fc38b5` (src_ab670f25c35e)
- 2026-09-11 new_claim `clm_fafe9fb8b66e` (src_d432de1cd9da)
- 2026-09-11 new_claim `clm_e0c84f167157` (src_1d072e1d683a)
- 2026-09-11 new_claim `clm_8737c7ca6b63` (src_1d072e1d683a)
- 2026-09-11 new_claim `clm_b36b56efd6d5` (src_1d072e1d683a)
- 2026-09-11 new_claim `clm_6a82f1ec6eda` (src_1d072e1d683a)
- 2026-09-11 new_claim `clm_1b9e0668b95f` (src_1d072e1d683a)
- 2026-09-11 new_claim `clm_e467f67072a9` (src_3c01fb9c03bd)

## Related

- ← applies_to [[theme]] (0.99)
- ← uses [[pi-extension]] (0.93)
- ← uses [[pi]] (0.93)
- [[pi]] — 8 shared claims
- [[pi-extension]] — 3 shared claims
- [[theme]] — 2 shared claims
- [[rpc-mode]] — 1 shared claim
