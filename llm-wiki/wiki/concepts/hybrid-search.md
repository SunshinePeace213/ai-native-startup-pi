---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_hybrid_search]
claim_ids: [clm_11592f0abfb3, clm_38f894daef7f, clm_826354f2bdf0, clm_105c92df6add, clm_338407819b19, clm_0f8aacf5947f, clm_55773f910713, clm_b94fd6ddf57c, clm_90eab08bfde2, clm_da107bde5751]
confidence: 0.79
stale_after: 2026-09-22
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# hybrid search

> **In here:** Search that scales combines four retrieval streams · 10 claims, confidence 0.79.

## Current understanding

- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- The state stream's stopword table, inherited from a standard English list, carried the word own itself and silently removed the very token prefix matching exists to expand, until the build dropped it from the list (0.88)
- The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims (0.87)
- Past roughly 100-200 pages index.md becomes too long for the LLM to read in one pass, so it is kept only as a human-readable catalog while real search takes over as the primary retrieval mechanism (0.83)
- The union retriever measures the previous phase's live numbers exactly — fused MRR 0.519188 at recall 0.794118 over the 34-case golden set — because nothing in the scoring path was tuned: the config only changed its version string and gained a private collections block, and the eval reads the shared segment alone (0.74)
- The fusion-v2 rerank block is scaled to a third of fusion-v1 — probability 0.15, authority, recency, and support 0.05 each — so belief acts as a tie-breaker between claims the streams agree on rather than deciding rank one: a claim at p 0.99 with three supports carries belief 1.2835 where fusion-v1 gave it 2.17 (0.74)
- The retriever's state stream folds inflections with a fixed rule set — entities to entity, owns to own, rendering to render — and matches a folded query token of three or more characters by prefix, so own reaches owner and ownership (0.74)
- The retrieval golden set holds 34 cases across six families, grown from 20, and its baseline under the Phase 4 retriever and the fusion-v1 config measured fused MRR 0.4657 at recall 0.74 against corpus-alone MRR 0.5647 at recall 0.71 — the history family answering 3 of 7 and the structure family 4 of 5 before any retriever change (0.74)
- After the retune and the stopword fix the superseded ownership claim ranks fifth on its historical question, and the remaining gap to rank one is the belief multiplier alone, which reads the claim's current belief rather than the belief it held before its supersession (0.71)
- The retrieve test fixture has never satisfied rebuild --check: its views carry hand-authored log-odds, entity ids, exceptions, and a supersession that a rebuild would overwrite, so fixture rows are hand-authored and held by schema validation, render check, and the suite (0.71)

## Evidence

- `clm_11592f0abfb3` — "Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The best approach combines three streams: - **BM25** (keyword matching with stemming and synonym expansion) - **Vector search** (semantic similarity via embeddings) - **Graph traversal** (entity-aware relationship walking)"
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "- BM25 for exact names and terms - vector search for semantic similarity - graph traversal for structural dependencies - state search for claims, entities, confidence, and evidence"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Flat RAG (top-k over cosine similarity to the raw question) retrieved all necessary documents for only 4/6 — it reliably misses the "bridge" document when that document isn't itself semantically close to the question text."
  - exception — when on a small, densely-connected corpus: Graph traversal's multi-hop recall win comes at a precision cost: on a small, densely-connected corpus 3 of 6 questions pulled 5-6 of the 8 documents (precision as low as 0.33), and precision on bigger, sparser graphs — including how many hops is too many — is untested (`obs_a7f3eecc8079`)
  - exception — when on a historical question whose target only two of the four streams return: Reciprocal rank fusion decides the top of a historical answer by vote count before belief enters, so a superseded claim only two streams reach loses to claims every stream found at middling ranks and no rerank weight on current belief lifts it (`obs_c7739b40d9ef`)
- `clm_38f894daef7f` — "The state stream's stopword table, inherited from a standard English list, carried the word own itself and silently removed the very token prefix matching exists to expand, until the build dropped it from the list" · p 0.88 · active · 2 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The stopword table the stream inherited from a standard English list carried the word own itself, which silently removed the token the mechanism exists for until the build dropped it from the list."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "Dropping the word own from the retriever's stopword table moved the superseded ownership claim on "who used to own the wiki layer" from rank 22 to rank 5: once the token reached the state stream it matched ownership by prefix, the claim…"
- `clm_826354f2bdf0` — "The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims" · p 0.87 · active · 2 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "Path seeds follow the shortest path between the question's named entities."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "How path seeds should treat a graph that holds a direct edge beside the chain it summarises: the shortest path between the raw layer and the wiki layer is one hop, so the state layer is never seeded and the connective claim answers at…"
- `clm_105c92df6add` — "Past roughly 100-200 pages index.md becomes too long for the LLM to read in one pass, so it is kept only as a human-readable catalog while real search takes over as the primary retrieval mechanism" · p 0.83 · active · 1 support · 0 contradict · when: past roughly 100-200 pages — beyond the scale at which the index can be read in one pass
  - `src_48f57237f6ef` LLM Wiki v2: "This works up to maybe 100-200 pages. Beyond that, the index itself becomes too long for the LLM to read in one pass, and you need real search."
- `clm_338407819b19` — "The union retriever measures the previous phase's live numbers exactly — fused MRR 0.519188 at recall 0.794118 over the 34-case golden set — because nothing in the scoring path was tuned: the config only changed its version string and gained a private collections block, and the eval reads the shared segment alone" · p 0.74 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The retrieval floor for this phase was Phase 5's live numbers, fused MRR 0.519188 at recall 0.794118 over the 34-case golden set."
- `clm_0f8aacf5947f` — "The fusion-v2 rerank block is scaled to a third of fusion-v1 — probability 0.15, authority, recency, and support 0.05 each — so belief acts as a tie-breaker between claims the streams agree on rather than deciding rank one: a claim at p 0.99 with three supports carries belief 1.2835 where fusion-v1 gave it 2.17" · p 0.74 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The `fusion-v2` config scales the rerank block to a third — probability 0.15, authority, recency, and support 0.05 each — so belief acts as a tie-breaker between claims the streams agree on rather than deciding rank one."
- `clm_55773f910713` — "The retriever's state stream folds inflections with a fixed rule set — entities to entity, owns to own, rendering to render — and matches a folded query token of three or more characters by prefix, so own reaches owner and ownership" · p 0.74 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The retriever's state stream folds inflections with a fixed rule set (entities → entity, owns → own, rendering → render) and matches a folded query token of three or more characters by prefix, so own reaches owner and ownership."
- `clm_b94fd6ddf57c` — "The retrieval golden set holds 34 cases across six families, grown from 20, and its baseline under the Phase 4 retriever and the fusion-v1 config measured fused MRR 0.4657 at recall 0.74 against corpus-alone MRR 0.5647 at recall 0.71 — the history family answering 3 of 7 and the structure family 4 of 5 before any retriever change" · p 0.74 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The golden set grew from 20 to 34 cases across six families. Its baseline under the Phase 4 retriever and the `fusion-v1` config measured fused MRR 0.4657 at recall 0.74 against corpus-alone MRR 0.5647 at recall 0.71."
- `clm_90eab08bfde2` — "After the retune and the stopword fix the superseded ownership claim ranks fifth on its historical question, and the remaining gap to rank one is the belief multiplier alone, which reads the claim's current belief rather than the belief it held before its supersession" · p 0.71 · active · 1 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "Whether the historical profile should read the belief a claim held before its supersession: the retune and the stopword fix put the superseded claim fifth, and the remaining gap to rank one is the belief multiplier alone."
- `clm_da107bde5751` — "The retrieve test fixture has never satisfied rebuild --check: its views carry hand-authored log-odds, entity ids, exceptions, and a supersession that a rebuild would overwrite, so fixture rows are hand-authored and held by schema validation, render check, and the suite" · p 0.71 · active · 1 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "The retrieve test fixture has never satisfied rebuild --check: its views carry hand-authored log-odds, entity ids, exceptions, and a supersession that a rebuild would overwrite, so fixture rows are hand-authored and held by schema…"

## Timeline

- 2026-08-20 scope_split `clm_105c92df6add` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-21 new_claim `clm_b94fd6ddf57c` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_0f8aacf5947f` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_55773f910713` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_38f894daef7f` (src_21d1317cc326)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_826354f2bdf0` (src_21d1317cc326)
- 2026-08-21 support_update `clm_38f894daef7f` (src_e261dc10ac79)
- 2026-08-21 new_claim `clm_da107bde5751` (src_e261dc10ac79)
- 2026-08-21 new_claim `clm_90eab08bfde2` (src_e261dc10ac79)
- 2026-08-21 support_update `clm_826354f2bdf0` (src_e261dc10ac79)
- 2026-08-22 new_claim `clm_338407819b19` (src_4863372048fa)

## Related

- ← part_of [[graph-traversal]] (0.99)
- → uses [[state-layer]] (0.98)
- → uses [[knowledge-graph]] (0.94)
- ← applies_to [[golden-set]] (0.93)
- ← uses [[llm-wiki]] (0.80)
- ← applies_to [[segmentation]] (0.79)
- → uses [[confidence-scoring]] (0.79)
- → replaces [[index-md]] (0.21) *[disputed]*
- [[state-layer]] — 4 shared claims
- [[golden-set]] — 3 shared claims
- [[supersession]] — 3 shared claims
- [[graph-traversal]] — 2 shared claims
- [[llm-wiki]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[confidence-scoring]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[index-md]] — 1 shared claim
- [[knowledge-graph]] — 1 shared claim
- [[rag]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
- [[segmentation]] — 1 shared claim
- [[wiki-layer]] — 1 shared claim
