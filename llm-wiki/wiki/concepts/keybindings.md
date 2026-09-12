---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/pi/keybindings.md, title: "Keybindings", id: src_59b8fc9e355e}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_keybindings]
claim_ids: [clm_2dfafb1d2b1d, clm_5080bebfc64b, clm_986b656d48da, clm_cda7cb4e957d]
confidence: 0.93
stale_after: 2027-01-29
last_rendered: 2026-09-11T19:52:50Z
review_required: false
---

# keybindings

> **In here:** Every Pi keyboard shortcut is rebindable through ~/.pi/agent/keybindings.json, and an action may carry one key or an array of them · 4 claims, confidence 0.93.

## Current understanding

- Every Pi keyboard shortcut is rebindable through ~/.pi/agent/keybindings.json, and an action may carry one key or an array of them (0.93)
- Pi migrates pre-namespaced keybinding ids such as cursorUp or expandTools to their namespaced equivalents automatically at startup (0.92)
- In Pi's fullscreen TUI mode the transcript bindings outrank the editor's, so bare navigation keys drive the transcript while their ctrl variants stay with the editor; outside fullscreen both drive the editor (0.92)
- Pi's super-modifier bindings need a terminal that reports the modifier separately, typically via the Kitty keyboard protocol, and may simply not fire elsewhere (0.92)

## Evidence

- `clm_2dfafb1d2b1d` — "Every Pi keyboard shortcut is rebindable through ~/.pi/agent/keybindings.json, and an action may carry one key or an array of them." · p 0.93 · active · 1 support · 0 contradict
  - `src_59b8fc9e355e` Keybindings: "All keyboard shortcuts can be customized via `~/.pi/agent/keybindings.json`. Each action can be bound to one or more keys."
- `clm_5080bebfc64b` — "Pi migrates pre-namespaced keybinding ids such as cursorUp or expandTools to their namespaced equivalents automatically at startup." · p 0.92 · active · 1 support · 0 contradict
  - `src_59b8fc9e355e` Keybindings: "Older configs using pre-namespaced ids such as `cursorUp` or `expandTools` are migrated automatically to the namespaced ids on startup."
- `clm_986b656d48da` — "In Pi's fullscreen TUI mode the transcript bindings outrank the editor's, so bare navigation keys drive the transcript while their ctrl variants stay with the editor; outside fullscreen both drive the editor." · p 0.92 · active · 1 support · 0 contradict · when: in fullscreen TUI mode (--tui-mode fullscreen)
  - `src_59b8fc9e355e` Keybindings: "Fullscreen transcript bindings take precedence over editor bindings. The default unmodified navigation keys therefore control the transcript in fullscreen mode, while their `ctrl` variants continue to control the editor."
- `clm_cda7cb4e957d` — "Pi's super-modifier bindings need a terminal that reports the modifier separately, typically via the Kitty keyboard protocol, and may simply not fire elsewhere." · p 0.92 · active · 1 support · 0 contradict
  - `src_59b8fc9e355e` Keybindings: "`super` bindings require a terminal that reports the modifier separately, typically through the Kitty keyboard protocol. They may not work in terminals without that support."

## Timeline

- 2026-09-11 new_claim `clm_2dfafb1d2b1d` (src_59b8fc9e355e)
- 2026-09-11 new_claim `clm_986b656d48da` (src_59b8fc9e355e)
- 2026-09-11 new_claim `clm_cda7cb4e957d` (src_59b8fc9e355e)
- 2026-09-11 new_claim `clm_5080bebfc64b` (src_59b8fc9e355e)

## Related

- ← uses [[pi]] (0.93)
- [[pi]] — 4 shared claims
