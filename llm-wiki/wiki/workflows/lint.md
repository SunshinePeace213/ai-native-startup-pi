---
type: workflow
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_lint]
claim_ids: [clm_1970186e8e8b, clm_eeb7b7aa9290, clm_d8e8392dd4ee, clm_64d1c38ec74a]
confidence: 0.86
stale_after: 2028-05-04
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# lint

> **In here:** A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page… · 4 claims, confidence 0.86.

## Current understanding

- A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page, missing cross-references, and data gaps a web search could fill (0.96)
- A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows (0.83)
- The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction (0.82)
- The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them (0.82)

## Evidence

- `clm_1970186e8e8b` — "A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page, missing cross-references, and data gaps a web search could fill" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "Look for: contradictions between pages, stale claims that newer sources have superseded, orphan pages with no inbound links, important concepts mentioned but lacking their own page, missing cross-references, data gaps that could be filled…"
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "**The linter** keeps the collection healthy. It deduplicates. It flags outdated entries. It makes sure the same document did not get filed under three different titles. It runs on its own schedule, not as part of every query."
- `clm_eeb7b7aa9290` — "A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously. Those are separate jobs done by separate people with separate workflows. The library works because the roles are segmented."
- `clm_d8e8392dd4ee` — "The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction" · p 0.82 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The human should still be in the loop for curation and direction. But the bookkeeping, the part that makes people abandon wikis, should be fully automated."
  - exception — when for the deep lane, which turns a source into belief: Automation stops at the light lane: the weekly routine files only the light-lane channels and the deep lane stays a session's command (`obs_da678a69fac4`)
- `clm_64d1c38ec74a` — "The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them" · p 0.82 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**log.md** is chronological. It's an append-only record of what happened and when — ingests, queries, lint passes."

## Timeline

- 2026-08-20 new_claim `clm_64d1c38ec74a` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_1970186e8e8b` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_d8e8392dd4ee` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_eeb7b7aa9290` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_1970186e8e8b` (src_b585de1a26bb)
- 2026-08-21 exception_addition `clm_d8e8392dd4ee` (src_21d1317cc326)

## Related

- → part_of [[llm-wiki]] (0.94)
- ← uses [[llm-wiki]] (0.83)
- ← produces [[log-md]] (0.82)
- ← produces [[hooks]] (0.79)
- → related_to [[query]] (0.79)
- [[llm-wiki]] — 4 shared claims
- [[ingest]] — 3 shared claims
- [[query]] — 2 shared claims
- [[hooks]] — 1 shared claim
- [[librarian]] — 1 shared claim
- [[log-md]] — 1 shared claim
- [[segmentation]] — 1 shared claim
