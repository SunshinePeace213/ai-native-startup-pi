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
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_knowledge_graph]
claim_ids: [clm_f3c9a3215ea4, clm_11592f0abfb3, clm_64cae6b2f5df, clm_388d45acd4c5, clm_8268e86d6097, clm_804caacdb245, clm_a286eb2a1892, clm_4e9c001d7b2e, clm_a37a7b28e462, clm_0e3aa800f1e4, clm_4c34c8aabbe3]
confidence: 0.91
stale_after: 2026-10-16
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# knowledge graph

> **In here:** A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; · 11 claims, confidence 0.91.

## Current understanding

- When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note (0.99)
- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- The pattern has three layers — the raw sources, the wiki, and the schema (0.99)
- Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs (0.96)
- An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages (0.96)
- A graph preserves errors as efficiently as facts — entity resolution can merge distinct organizations and extraction can attach the wrong date — so graph-grounded systems require schema validation, canonical identifiers, provenance, conflict representation, confidence calibration, and periodic review (0.90)
- A knowledge graph serves multi-agent systems in three distinct roles: shared memory for orchestrator-workers, where workers read and write the graph directly instead of passing summaries through the orchestrator's bottleneck; a grounding layer for evaluator-optimizer, where the evaluator checks claims against edges carrying provenance; and a persistent world model for loops, which survives context-window flushes (0.90)
- A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; a graph written to once and never queried is a database table with extra overhead (0.90)
- No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 — because semantic-similarity embeddings measure same topic, not same real-world entity, which is a different task than identity resolution (0.83)
- The graph schema is deliberately a small, fixed, generic vocabulary of node labels and relationship types enforced by database constraints: it trades domain expressiveness for query simplicity, and domain nuance lives in node properties rather than in new labels (0.83)
- Sorting the ledger readers moved only evidence lists on the live vault — 20 of 44 entity rows and 11 of 100 relationship rows, each the same multiset re-ordered — while the claims, unresolved-conflicts, and snapshot views stayed byte-identical and no entity resolution moved (0.74)

## Evidence

- `clm_f3c9a3215ea4` — "When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The new one should explicitly supersede it. Linked, timestamped, old version preserved but marked stale."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A transition where a newer claim replaces an older claim while preserving historical lineage."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Two claims linked by `CONTRADICTS` with no resolution are both `disputed`. When a later source resolves the conflict, the losing claim flips to `superseded`"
- `clm_11592f0abfb3` — "Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The best approach combines three streams: - **BM25** (keyword matching with stemming and synonym expansion) - **Vector search** (semantic similarity via embeddings) - **Graph traversal** (entity-aware relationship walking)"
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "- BM25 for exact names and terms - vector search for semantic similarity - graph traversal for structural dependencies - state search for claims, entities, confidence, and evidence"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Flat RAG (top-k over cosine similarity to the raw question) retrieved all necessary documents for only 4/6 — it reliably misses the "bridge" document when that document isn't itself semantically close to the question text."
  - exception — when on a small, densely-connected corpus: Graph traversal's multi-hop recall win comes at a precision cost: on a small, densely-connected corpus 3 of 6 questions pulled 5-6 of the 8 documents (precision as low as 0.33), and precision on bigger, sparser graphs — including how many hops is too many — is untested (`obs_a7f3eecc8079`)
  - exception — when on a historical question whose target only two of the four streams return: Reciprocal rank fusion decides the top of a historical answer by vote count before belief enters, so a superseded claim only two streams reach loses to claims every stream found at middling ranks and no rerank weight on current belief lifts it (`obs_c7739b40d9ef`)
- `clm_64cae6b2f5df` — "The pattern has three layers — the raw sources, the wiki, and the schema" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "There are three layers: **Raw sources** — your curated collection of source documents."
  - `src_48f57237f6ef` LLM Wiki v2: "The three-layer architecture (raw sources, wiki, schema) works. The operations (ingest, query, lint) cover the basics."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "1. **Raw Sources** — immutable `:Source` nodes. Original text, never modified after ingest. 2. **Graph Wiki** — the maintained layer. `:Concept` nodes (a synthesized entity or topic, with a prose `summary`"
- `clm_388d45acd4c5` — "Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs." · p 0.96 · active · 2 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**2. Two-stage fix (cheap filter + LLM judgment)"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "A second finding fell out of this run: the stage-1 threshold (0.55) that cleanly separated classes on the first domain did *not* transfer — one unrelated pair leaked through as a candidate in the new domain (cosine 0.60, above threshold)."
- `clm_8268e86d6097` — "An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "It should extract structured entities. People, projects, libraries, concepts, files, decisions. Each entity gets a type, attributes, and relationships to other entities."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "The original pattern stores the maintained layer as markdown pages with freeform links. This variant stores it as a property graph, so the "cross-references" a markdown wiki approximates with links become real, typed, queryable edges"
- `clm_804caacdb245` — "A graph preserves errors as efficiently as facts — entity resolution can merge distinct organizations and extraction can attach the wrong date — so graph-grounded systems require schema validation, canonical identifiers, provenance, conflict representation, confidence calibration, and periodic review" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "A graph can preserve errors as efficiently as facts. Entity resolution can merge distinct organizations. Extraction can attach the wrong date. A confident evaluator can mark a weak source as sufficient."
- `clm_a286eb2a1892` — "A knowledge graph serves multi-agent systems in three distinct roles: shared memory for orchestrator-workers, where workers read and write the graph directly instead of passing summaries through the orchestrator's bottleneck; a grounding layer for evaluator-optimizer, where the evaluator checks claims against edges carrying provenance;" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "A knowledge graph serves multi-agent systems in three distinct roles."
- `clm_4e9c001d7b2e` — "A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; a graph written to once and never queried is a database table with extra overhead" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "A knowledge graph is justified when the same entity or relationship is queried by more than one agent or across more than one session. A graph that is written to once and never queried is a database table with extra overhead."
- `clm_a37a7b28e462` — "No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 — because semantic-similarity embeddings measure same topic, not same real-world entity, which is a different task than identity resolution." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "No threshold cleanly separates the classes; best achievable was F1=0.667 (precision 0.542) at threshold 0.72. The 0.97 guessed in the original smoke test was never viable — at 0.97, recall is ~0."
- `clm_0e3aa800f1e4` — "The graph schema is deliberately a small, fixed, generic vocabulary of node labels and relationship types enforced by database constraints: it trades domain expressiveness for query simplicity, and domain nuance lives in node properties rather than in new labels." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**Schema** — a small, fixed set of node labels and relationship types (below), enforced with Neo4j constraints."
- `clm_4c34c8aabbe3` — "Sorting the ledger readers moved only evidence lists on the live vault — 20 of 44 entity rows and 11 of 100 relationship rows, each the same multiset re-ordered — while the claims, unresolved-conflicts, and snapshot views stayed byte-identical and no entity resolution moved" · p 0.74 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "On a scratch copy the diff was exact — 20 of 44 entity rows moved and 11 of 100 relationship rows moved, and in every case the only field that changed was an evidence list."

## Timeline

- 2026-08-20 new_claim `clm_64cae6b2f5df` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_f3c9a3215ea4` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_8268e86d6097` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_09c828d1c803)
- 2026-08-20 support_update `clm_8268e86d6097` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_0e3aa800f1e4` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_a37a7b28e462` (src_09c828d1c803)
- 2026-08-20 support_update `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_09c828d1c803)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-08-22 new_claim `clm_4c34c8aabbe3` (src_4863372048fa)
- 2026-08-23 new_claim `clm_a286eb2a1892` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_804caacdb245` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_4e9c001d7b2e` (src_363b13dc0870)

## Related

- ← uses [[graph-traversal]] (0.99)
- ← related_to [[wiki-layer]] (0.95)
- ← uses [[hybrid-search]] (0.94)
- → depends_on [[entity-resolution]] (0.90)
- ← uses [[orchestrator-workers]] (0.90)
- → part_of [[graph-architecture]] (0.90)
- ← applies_to [[schema-layer]] (0.82)
- ← uses [[graphwiki]] (0.82)
- ← produces [[entity-extraction]] (0.79)
- ← applies_to [[entity-resolution]] (0.79)
- → part_of [[state-layer]] (0.79)
- [[entity-resolution]] — 4 shared claims
- [[graphwiki]] — 4 shared claims
- [[llm-wiki]] — 4 shared claims
- [[claim]] — 3 shared claims
- [[embeddings]] — 3 shared claims
- [[state-layer]] — 3 shared claims
- [[graph-traversal]] — 2 shared claims
- [[ingest]] — 2 shared claims
- [[schema-layer]] — 2 shared claims
- [[supersession]] — 2 shared claims
- [[wiki-layer]] — 2 shared claims
- [[entity-extraction]] — 1 shared claim
- [[graph-architecture]] — 1 shared claim
- [[hybrid-search]] — 1 shared claim
- [[memory-lifecycle]] — 1 shared claim
- [[orchestrator-workers]] — 1 shared claim
- [[rag]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
- [[transition-ledger]] — 1 shared claim
- Neo4j (no page yet)
