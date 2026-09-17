---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/memory.md, title: "How Claude remembers your project", id: src_e698013f1182}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_auto_memory]
claim_ids: [clm_be29c94c742f, clm_b83cb09bdf7b, clm_d16362b414b2]
confidence: 0.92
stale_after: 2027-01-17
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# auto memory

> **In here:** Auto memory lets Claude accumulate knowledge across sessions without the user writing anything, saving four kinds of notes for itself as it works · 3 claims, confidence 0.92.

## Current understanding

- Auto memory lets Claude accumulate knowledge across sessions without the user writing anything, saving four kinds of notes for itself as it works (0.93)
- Claude Code carries knowledge across sessions with two complementary memory systems, CLAUDE.md files and auto memory, both loaded at the start of every conversation and treated as context rather than enforced configuration (0.93)
- Only the first 200 lines or first 25KB of auto memory's `MEMORY.md` index loads at the start of a conversation, so Claude keeps the index short and moves detailed notes into separate topic files (0.90)

## Evidence

- `clm_be29c94c742f` — "Auto memory lets Claude accumulate knowledge across sessions without the user writing anything, saving four kinds of notes for itself as it works." · p 0.93 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "Auto memory lets Claude accumulate knowledge across sessions without you writing anything. As it works, Claude saves four kinds of notes for itself."
- `clm_b83cb09bdf7b` — "Claude Code carries knowledge across sessions with two complementary memory systems, CLAUDE.md files and auto memory, both loaded at the start of every conversation and treated as context rather than enforced configuration." · p 0.93 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "Claude Code has two complementary memory systems. Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration."
- `clm_d16362b414b2` — "Only the first 200 lines or first 25KB of auto memory's `MEMORY.md` index loads at the start of a conversation, so Claude keeps the index short and moves detailed notes into separate topic files." · p 0.90 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation. Content beyond that threshold is not loaded at session start."

## Timeline

- 2026-08-23 new_claim `clm_b83cb09bdf7b` (src_e698013f1182)
- 2026-08-23 new_claim `clm_be29c94c742f` (src_e698013f1182)
- 2026-08-23 new_claim `clm_d16362b414b2` (src_e698013f1182)

## Related

- → part_of [[claude-code]] (0.93)
- [[claude-code]] — 2 shared claims
- [[context-window]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
