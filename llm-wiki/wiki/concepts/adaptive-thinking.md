---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-sonnet-5.md, title: "prompting-claude-sonnet-5", id: src_b6f0e67933fe}
  - {resource: llm-wiki/raw/docs/pi/themes.md, title: "Themes", id: src_d432de1cd9da}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_adaptive_thinking]
claim_ids: [clm_be249df2601f, clm_d30741f36b3c, clm_ed8fac585242]
confidence: 0.92
stale_after: 2027-01-26
last_rendered: 2026-09-17T23:03:12Z
review_required: false
---

# adaptive thinking

> **In here:** Adaptive thinking is on by default on Claude Sonnet 5, a change from Sonnet 4.6 where the same requests ran without thinking, and manual extended thinking is removed and returns a 400 error · 3 claims, confidence 0.92.

## Current understanding

- Adaptive thinking is on by default on Claude Sonnet 5, a change from Sonnet 4.6 where the same requests ran without thinking, and manual extended thinking is removed and returns a 400 error (0.93)
- With thinking disabled Claude Opus 5 can leak a tool call into user-facing text or emit internal XML tags, and the primary mitigation for both is to keep thinking enabled and control cost with lower effort instead — thinking enabled at low effort outperforms thinking disabled at similar cost (0.93)
- A Pi theme carries a separate editor border color per thinking level, giving the current level a visual hierarchy from subtle to prominent (0.91)

## Evidence

- `clm_be249df2601f` — "Adaptive thinking is on by default on Claude Sonnet 5, a change from Sonnet 4.6 where the same requests ran without thinking, and manual extended thinking is removed and returns a 400 error" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "is not supported on Claude Sonnet 5 and returns a 400 error. It was deprecated on Claude Sonnet 4.6 and is now removed."
- `clm_d30741f36b3c` — "With thinking disabled Claude Opus 5 can leak a tool call into user-facing text or emit internal XML tags, and the primary mitigation for both is to keep thinking enabled and control cost with lower effort instead — thinking enabled at low effort outperforms thinking disabled at similar cost" · p 0.93 · active · 1 support · 0 contradict · when: when thinking is disabled
  - `src_26d415487f93` prompting-claude-opus-5: "With thinking disabled, two artifacts can occasionally appear in the model's visible output."
- `clm_ed8fac585242` — "A Pi theme carries a separate editor border color per thinking level, giving the current level a visual hierarchy from subtle to prominent." · p 0.91 · active · 1 support · 0 contradict
  - `src_d432de1cd9da` Themes: "Editor border colors indicating thinking level (visual hierarchy from subtle to prominent):"

## Timeline

- 2026-08-23 new_claim `clm_d30741f36b3c` (src_26d415487f93)
- 2026-08-23 new_claim `clm_be249df2601f` (src_b6f0e67933fe)
- 2026-09-11 new_claim `clm_ed8fac585242` (src_d432de1cd9da)

## Related

- ← uses [[claude-opus-5]] (0.93)
- ← uses [[claude-sonnet-5]] (0.93)
- ← related_to [[theme]] (0.92)
- [[claude-opus-5]] — 1 shared claim
- [[claude-sonnet-5]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[theme]] — 1 shared claim
