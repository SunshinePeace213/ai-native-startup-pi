---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/pi/themes.md, title: "Themes", id: src_d432de1cd9da}
  - {resource: llm-wiki/raw/docs/pi/tui.md, title: "TUI Components", id: src_1d072e1d683a}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_theme]
claim_ids: [clm_fafe9fb8b66e, clm_7a3f0a042a7d, clm_e8293864a15e, clm_6a82f1ec6eda, clm_ed8fac585242]
confidence: 0.92
stale_after: 2027-01-26
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# theme

> **In here:** A theme change makes Pi's TUI call invalidate() on every component to drop cached renders, so a component that does not implement it correctly will not pick the new theme up · 5 claims, confidence 0.92.

## Current understanding

- A Pi theme is a JSON file defining the colors of the TUI (0.93)
- On its first run Pi detects the terminal background and defaults the theme to dark or light accordingly (0.92)
- Pi renders themes in 24-bit RGB and falls back to the nearest approximation on terminals that only support 256 colors (0.92)
- A theme change makes Pi's TUI call invalidate() on every component to drop cached renders, so a component that does not implement it correctly will not pick the new theme up (0.92)
- A Pi theme carries a separate editor border color per thinking level, giving the current level a visual hierarchy from subtle to prominent (0.91)

## Evidence

- `clm_fafe9fb8b66e` — "A Pi theme is a JSON file defining the colors of the TUI." · p 0.93 · active · 1 support · 0 contradict
  - `src_d432de1cd9da` Themes: "Themes are JSON files that define colors for the TUI."
- `clm_7a3f0a042a7d` — "On its first run Pi detects the terminal background and defaults the theme to dark or light accordingly." · p 0.92 · active · 1 support · 0 contradict
  - `src_d432de1cd9da` Themes: "On first run, pi detects your terminal background and defaults to `dark` or `light`."
- `clm_e8293864a15e` — "Pi renders themes in 24-bit RGB and falls back to the nearest approximation on terminals that only support 256 colors." · p 0.92 · active · 1 support · 0 contradict
  - `src_d432de1cd9da` Themes: "Pi uses 24-bit RGB colors. Most modern terminals support this (iTerm2, Kitty, WezTerm, Windows Terminal, VS Code). For older terminals with only 256-color support, pi falls back to the nearest approximation."
- `clm_6a82f1ec6eda` — "A theme change makes Pi's TUI call invalidate() on every component to drop cached renders, so a component that does not implement it correctly will not pick the new theme up." · p 0.92 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "When the theme changes, the TUI calls `invalidate()` on all components to clear their caches. Components must properly implement `invalidate()` to ensure theme changes take effect."
- `clm_ed8fac585242` — "A Pi theme carries a separate editor border color per thinking level, giving the current level a visual hierarchy from subtle to prominent." · p 0.91 · active · 1 support · 0 contradict
  - `src_d432de1cd9da` Themes: "Editor border colors indicating thinking level (visual hierarchy from subtle to prominent):"

## Timeline

- 2026-09-11 new_claim `clm_fafe9fb8b66e` (src_d432de1cd9da)
- 2026-09-11 new_claim `clm_e8293864a15e` (src_d432de1cd9da)
- 2026-09-11 new_claim `clm_7a3f0a042a7d` (src_d432de1cd9da)
- 2026-09-11 new_claim `clm_ed8fac585242` (src_d432de1cd9da)
- 2026-09-11 new_claim `clm_6a82f1ec6eda` (src_1d072e1d683a)

## Related

- → applies_to [[tui]] (0.99)
- → related_to [[adaptive-thinking]] (0.92)
- [[pi]] — 5 shared claims
- [[tui]] — 2 shared claims
- [[adaptive-thinking]] — 1 shared claim
