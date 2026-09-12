---
type: system
status: current
created: 2026-08-20
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_index_md]
claim_ids: [clm_105c92df6add, clm_fd6b4187fcae, clm_511e5a08009b]
confidence: 0.83
stale_after: 2028-05-04
last_rendered: 2026-08-23T09:04:00Z
review_required: false
---

# index.md

> **In here:** Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed · 3 claims, confidence 0.83.

## Current understanding

- Past roughly 100-200 pages index.md becomes too long for the LLM to read in one pass, so it is kept only as a human-readable catalog while real search takes over as the primary retrieval mechanism (0.83)
- An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages (0.83)
- Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed (0.82)

## Evidence

- `clm_105c92df6add` — "Past roughly 100-200 pages index.md becomes too long for the LLM to read in one pass, so it is kept only as a human-readable catalog while real search takes over as the primary retrieval mechanism" · p 0.83 · active · 1 support · 0 contradict · when: past roughly 100-200 pages — beyond the scale at which the index can be read in one pass
  - `src_48f57237f6ef` LLM Wiki v2: "This works up to maybe 100-200 pages. Beyond that, the index itself becomes too long for the LLM to read in one pass, and you need real search."
- `clm_fd6b4187fcae` — "An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages" · p 0.83 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "An example flow: the LLM reads the source, discusses key takeaways with you, writes a summary page in the wiki, updates the index, updates relevant entity and concept pages across the wiki, and appends an entry to the log."
  - exception — when for a broad, uncurated file-system corpus of thousands of files rather than a small personally curated collection: For a broad, uncurated corpus the goal of ingestion is findability rather than deep indexing: a good title and a clean summary is enough for a librarian to locate the file later, and trying to do more at that stage wastes tokens and produces dirty data that poisons retrieval downstream (`obs_8e2a1e93b171`)
- `clm_511e5a08009b` — "Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed" · p 0.82 · active · 1 support · 0 contradict · when: at moderate scale — roughly 100 sources and hundreds of pages
  - `src_6711dfc0cddd` LLM Wiki: "When answering a query, the LLM reads the index first to find relevant pages, then drills into them."

## Timeline

- 2026-08-20 new_claim `clm_fd6b4187fcae` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_511e5a08009b` (src_6711dfc0cddd)
- 2026-08-20 scope_split `clm_105c92df6add` (src_48f57237f6ef)
- 2026-08-20 exception_addition `clm_fd6b4187fcae` (src_b585de1a26bb)

## Related

- ← applies_to [[ingest]] (0.83)
- → replaces [[rag]] (0.82)
- ← replaces [[hybrid-search]] (0.21) *[disputed]*
- [[llm-wiki]] — 3 shared claims
- [[hybrid-search]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[librarian]] — 1 shared claim
- [[log-md]] — 1 shared claim
- [[rag]] — 1 shared claim
- [[segmentation]] — 1 shared claim
