---
type: concept
status: current
created: 2026-08-20
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_embeddings]
claim_ids: [clm_11592f0abfb3, clm_388d45acd4c5, clm_a37a7b28e462]
confidence: 0.93
stale_after: 2028-06-22
last_rendered: 2026-08-23T09:04:00Z
review_required: false
---

# embeddings

> **In here:** No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 · 3 claims, confidence 0.93.

## Current understanding

- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs (0.96)
- No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 — because semantic-similarity embeddings measure same topic, not same real-world entity, which is a different task than identity resolution (0.83)

## Evidence

- `clm_11592f0abfb3` — "Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The best approach combines three streams: - **BM25** (keyword matching with stemming and synonym expansion) - **Vector search** (semantic similarity via embeddings) - **Graph traversal** (entity-aware relationship walking)"
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "- BM25 for exact names and terms - vector search for semantic similarity - graph traversal for structural dependencies - state search for claims, entities, confidence, and evidence"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Flat RAG (top-k over cosine similarity to the raw question) retrieved all necessary documents for only 4/6 — it reliably misses the "bridge" document when that document isn't itself semantically close to the question text."
  - exception — when on a small, densely-connected corpus: Graph traversal's multi-hop recall win comes at a precision cost: on a small, densely-connected corpus 3 of 6 questions pulled 5-6 of the 8 documents (precision as low as 0.33), and precision on bigger, sparser graphs — including how many hops is too many — is untested (`obs_a7f3eecc8079`)
  - exception — when on a historical question whose target only two of the four streams return: Reciprocal rank fusion decides the top of a historical answer by vote count before belief enters, so a superseded claim only two streams reach loses to claims every stream found at middling ranks and no rerank weight on current belief lifts it (`obs_c7739b40d9ef`)
- `clm_388d45acd4c5` — "Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs." · p 0.96 · active · 2 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**2. Two-stage fix (cheap filter + LLM judgment)"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "A second finding fell out of this run: the stage-1 threshold (0.55) that cleanly separated classes on the first domain did *not* transfer — one unrelated pair leaked through as a candidate in the new domain (cosine 0.60, above threshold)."
- `clm_a37a7b28e462` — "No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 — because semantic-similarity embeddings measure same topic, not same real-world entity, which is a different task than identity resolution." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "No threshold cleanly separates the classes; best achievable was F1=0.667 (precision 0.542) at threshold 0.72. The 0.97 guessed in the original smoke test was never viable — at 0.97, recall is ~0."

## Timeline

- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 new_claim `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_a37a7b28e462` (src_09c828d1c803)
- 2026-08-20 support_update `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)

## Related

- ← uses [[entity-resolution]] (0.99)
- [[knowledge-graph]] — 3 shared claims
- [[entity-resolution]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[graph-traversal]] — 1 shared claim
- [[graphwiki]] — 1 shared claim
- [[hybrid-search]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[llm-wiki]] — 1 shared claim
- [[rag]] — 1 shared claim
- [[state-layer]] — 1 shared claim
- [[supersession]] — 1 shared claim
