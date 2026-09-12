---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_graph_traversal]
claim_ids: [clm_11592f0abfb3, clm_8268e86d6097, clm_826354f2bdf0]
confidence: 0.95
stale_after: 2027-01-02
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# graph traversal

> **In here:** An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions · 3 claims, confidence 0.95.

## Current understanding

- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages (0.96)
- The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims (0.89)

## Evidence

- `clm_11592f0abfb3` — "Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The best approach combines three streams: - **BM25** (keyword matching with stemming and synonym expansion) - **Vector search** (semantic similarity via embeddings) - **Graph traversal** (entity-aware relationship walking)"
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "- BM25 for exact names and terms - vector search for semantic similarity - graph traversal for structural dependencies - state search for claims, entities, confidence, and evidence"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Flat RAG (top-k over cosine similarity to the raw question) retrieved all necessary documents for only 4/6 — it reliably misses the "bridge" document when that document isn't itself semantically close to the question text."
  - exception — when on a small, densely-connected corpus: Graph traversal's multi-hop recall win comes at a precision cost: on a small, densely-connected corpus 3 of 6 questions pulled 5-6 of the 8 documents (precision as low as 0.33), and precision on bigger, sparser graphs — including how many hops is too many — is untested (`obs_a7f3eecc8079`)
  - exception — when on a historical question whose target only two of the four streams return: Reciprocal rank fusion decides the top of a historical answer by vote count before belief enters, so a superseded claim only two streams reach loses to claims every stream found at middling ranks and no rerank weight on current belief lifts it (`obs_c7739b40d9ef`)
- `clm_8268e86d6097` — "An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "It should extract structured entities. People, projects, libraries, concepts, files, decisions. Each entity gets a type, attributes, and relationships to other entities."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "The original pattern stores the maintained layer as markdown pages with freeform links. This variant stores it as a property graph, so the "cross-references" a markdown wiki approximates with links become real, typed, queryable edges"
- `clm_826354f2bdf0` — "The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims" · p 0.89 · active · 2 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "Path seeds follow the shortest path between the question's named entities."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "How path seeds should treat a graph that holds a direct edge beside the chain it summarises: the shortest path between the raw layer and the wiki layer is one hop, so the state layer is never seeded and the connective claim answers at…"

## Timeline

- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_8268e86d6097` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 support_update `clm_8268e86d6097` (src_09c828d1c803)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_826354f2bdf0` (src_21d1317cc326)
- 2026-08-21 support_update `clm_826354f2bdf0` (src_e261dc10ac79)

## Related

- → uses [[knowledge-graph]] (0.99)
- → part_of [[hybrid-search]] (0.99)
- → related_to [[rag]] (0.82)
- [[hybrid-search]] — 2 shared claims
- [[knowledge-graph]] — 2 shared claims
- [[llm-wiki]] — 2 shared claims
- [[state-layer]] — 2 shared claims
- [[wiki-layer]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[entity-extraction]] — 1 shared claim
- [[graphwiki]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[rag]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
- [[supersession]] — 1 shared claim
