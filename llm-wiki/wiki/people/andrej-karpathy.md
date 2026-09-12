---
type: person
status: current
created: 2026-08-20
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_andrej_karpathy]
claim_ids: [clm_68d42ae34cc5, clm_1036b815fa78]
confidence: 0.92
stale_after: 2028-08-11
last_rendered: 2026-08-23T09:04:00Z
review_required: false
---

# Andrej Karpathy

> **In here:** Andrej Karpathy — 2 claims, confidence 0.92, 3 sources.

## Current understanding

- The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents (0.99)
- In the LLM Wiki pattern the LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files that sits between a reader and their raw sources — rather than only retrieving from those sources at query time (0.84)

## Evidence

- `clm_68d42ae34cc5` — "The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "This is the key difference: **the wiki is a persistent, compounding artifact.** The cross-references are already there."
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Future queries read the compiled wiki instead of re-deriving knowledge from scratch every time. Knowledge compounds."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Inspired by [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), which proposes a persistent, LLM-maintained knowledge base that compounds over time instead of re-deriving answers from raw sources on…"
- `clm_1036b815fa78` — "In the LLM Wiki pattern the LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files that sits between a reader and their raw sources — rather than only retrieving from those sources at query time" · p 0.84 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "Instead of just retrieving from raw documents at query time, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files that sits between you and the raw sources."

## Timeline

- 2026-08-20 new_claim `clm_1036b815fa78` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_68d42ae34cc5` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_09c828d1c803)

## Related

- → authored [[llm-wiki]] (0.96)
- [[llm-wiki]] — 2 shared claims
- [[graphwiki]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
- [[wiki-layer]] — 1 shared claim
- lucianfialho (no page yet)
