---
type: system
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_log_md]
claim_ids: [clm_fd6b4187fcae, clm_64d1c38ec74a]
confidence: 0.82
stale_after: 2028-05-04
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# log.md

> **In here:** log.md — 2 claims, confidence 0.82, 2 sources.

## Current understanding

- An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages (0.83)
- The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them (0.82)

## Evidence

- `clm_fd6b4187fcae` — "An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages" · p 0.83 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "An example flow: the LLM reads the source, discusses key takeaways with you, writes a summary page in the wiki, updates the index, updates relevant entity and concept pages across the wiki, and appends an entry to the log."
  - exception — when for a broad, uncurated file-system corpus of thousands of files rather than a small personally curated collection: For a broad, uncurated corpus the goal of ingestion is findability rather than deep indexing: a good title and a clean summary is enough for a librarian to locate the file later, and trying to do more at that stage wastes tokens and produces dirty data that poisons retrieval downstream (`obs_8e2a1e93b171`)
- `clm_64d1c38ec74a` — "The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them" · p 0.82 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**log.md** is chronological. It's an append-only record of what happened and when — ingests, queries, lint passes."

## Timeline

- 2026-08-20 new_claim `clm_64d1c38ec74a` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_fd6b4187fcae` (src_6711dfc0cddd)
- 2026-08-20 exception_addition `clm_fd6b4187fcae` (src_b585de1a26bb)

## Related

- ← applies_to [[ingest]] (0.83)
- → produces [[ingest]] (0.82)
- → produces [[lint]] (0.82)
- → produces [[query]] (0.82)
- [[ingest]] — 2 shared claims
- [[llm-wiki]] — 2 shared claims
- [[index-md]] — 1 shared claim
- [[librarian]] — 1 shared claim
- [[lint]] — 1 shared claim
- [[query]] — 1 shared claim
- [[segmentation]] — 1 shared claim
