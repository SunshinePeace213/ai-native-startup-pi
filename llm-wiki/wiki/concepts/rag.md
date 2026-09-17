---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/docs/anthropic/increase-consistency.md, title: "increase-consistency", id: src_1dce2e527884}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_rag]
claim_ids: [clm_11592f0abfb3, clm_a645efcafb39, clm_4f2426d16440, clm_511e5a08009b]
confidence: 0.92
stale_after: 2028-05-04
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# RAG

> **In here:** RAG retrieves chunks at query time and so rediscovers knowledge from scratch on every question, accumulating nothing between queries · 4 claims, confidence 0.92.

## Current understanding

- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- RAG retrieves chunks at query time and so rediscovers knowledge from scratch on every question, accumulating nothing between queries (0.96)
- Tasks that need consistent context, such as chatbots and knowledge bases, should use retrieval to ground Claude's responses in a fixed information set (0.93)
- Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed (0.82)

## Evidence

- `clm_11592f0abfb3` — "Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The best approach combines three streams: - **BM25** (keyword matching with stemming and synonym expansion) - **Vector search** (semantic similarity via embeddings) - **Graph traversal** (entity-aware relationship walking)"
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "- BM25 for exact names and terms - vector search for semantic similarity - graph traversal for structural dependencies - state search for claims, entities, confidence, and evidence"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Flat RAG (top-k over cosine similarity to the raw question) retrieved all necessary documents for only 4/6 — it reliably misses the "bridge" document when that document isn't itself semantically close to the question text."
  - exception — when on a small, densely-connected corpus: Graph traversal's multi-hop recall win comes at a precision cost: on a small, densely-connected corpus 3 of 6 questions pulled 5-6 of the 8 documents (precision as low as 0.33), and precision on bigger, sparser graphs — including how many hops is too many — is untested (`obs_a7f3eecc8079`)
  - exception — when on a historical question whose target only two of the four streams return: Reciprocal rank fusion decides the top of a historical answer by vote count before belief enters, so a superseded claim only two streams reach loses to claims every stream found at middling ranks and no rerank weight on current belief lifts it (`obs_c7739b40d9ef`)
- `clm_a645efcafb39` — "RAG retrieves chunks at query time and so rediscovers knowledge from scratch on every question, accumulating nothing between queries" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "This works, but the LLM is rediscovering knowledge from scratch on every question. There's no accumulation."
  - `src_48f57237f6ef` LLM Wiki v2: "The core insight is correct: **stop re-deriving, start compiling.** RAG retrieves and forgets. A wiki accumulates and compounds."
- `clm_4f2426d16440` — "Tasks that need consistent context, such as chatbots and knowledge bases, should use retrieval to ground Claude's responses in a fixed information set." · p 0.93 · active · 1 support · 0 contradict · when: for tasks requiring consistent context such as chatbots and knowledge bases
  - `src_1dce2e527884` increase-consistency: "For tasks requiring consistent context (for example, chatbots, knowledge bases), use retrieval to ground Claude's responses in a fixed information set."
- `clm_511e5a08009b` — "Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed" · p 0.82 · active · 1 support · 0 contradict · when: at moderate scale — roughly 100 sources and hundreds of pages
  - `src_6711dfc0cddd` LLM Wiki: "When answering a query, the LLM reads the index first to find relevant pages, then drills into them."

## Timeline

- 2026-08-20 new_claim `clm_a645efcafb39` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_511e5a08009b` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_a645efcafb39` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-09-02 new_claim `clm_4f2426d16440` (src_1dce2e527884)

## Related

- ← related_to [[llm-wiki]] (0.95)
- → applies_to [[output-consistency]] (0.93)
- ← related_to [[graph-traversal]] (0.82)
- ← replaces [[index-md]] (0.82)
- [[llm-wiki]] — 3 shared claims
- [[claim]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[graph-traversal]] — 1 shared claim
- [[hybrid-search]] — 1 shared claim
- [[index-md]] — 1 shared claim
- [[knowledge-graph]] — 1 shared claim
- [[output-consistency]] — 1 shared claim
- [[state-layer]] — 1 shared claim
- [[supersession]] — 1 shared claim
- rohitg00 (no page yet)
