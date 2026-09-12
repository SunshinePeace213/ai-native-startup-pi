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
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_supersession]
claim_ids: [clm_f3c9a3215ea4, clm_11592f0abfb3, clm_a0b912ad50ca, clm_38f894daef7f, clm_b78683e15c8a, clm_774c0f6c78f5, clm_90eab08bfde2]
confidence: 0.87
stale_after: 2026-09-22
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# supersession

> **In here:** When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale · 7 claims, confidence 0.87.

## Current understanding

- When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note (0.99)
- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion (0.96)
- The state stream's stopword table, inherited from a standard English list, carried the word own itself and silently removed the very token prefix matching exists to expand, until the build dropped it from the list (0.90)
- Undo is stack-ordered for belief runs because probability and status come from each transition's recorded after-snapshot while log-odds replay as deltas — removing a run from the middle would leave later claims carrying a snapshot their own history no longer produces — while a merge or an observation-less registration carries no belief and reverses from any position (0.79)
- Ordering two same-second runs by the hex of their run_id can replay a support or a supersession before the claim it targets exists — thirteen core tests hit a KeyError on it, and an inbox drain produces dependent runs inside one wall-clock second by construction (0.75)
- After the retune and the stopword fix the superseded ownership claim ranks fifth on its historical question, and the remaining gap to rank one is the belief multiplier alone, which reads the claim's current belief rather than the belief it held before its supersession (0.72)

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
- `clm_a0b912ad50ca` — "A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The LLM should propose which claim is more likely correct based on source recency, source authority, and the number of supporting observations. The human can override, but the default behavior should usually be right."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Contradictions should not be hidden."
- `clm_38f894daef7f` — "The state stream's stopword table, inherited from a standard English list, carried the word own itself and silently removed the very token prefix matching exists to expand, until the build dropped it from the list" · p 0.90 · active · 2 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The stopword table the stream inherited from a standard English list carried the word own itself, which silently removed the token the mechanism exists for until the build dropped it from the list."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "Dropping the word own from the retriever's stopword table moved the superseded ownership claim on "who used to own the wiki layer" from rank 22 to rank 5: once the token reached the state stream it matched ownership by prefix, the claim…"
- `clm_b78683e15c8a` — "Undo is stack-ordered for belief runs because probability and status come from each transition's recorded after-snapshot while log-odds replay as deltas — removing a run from the middle would leave later claims carrying a snapshot their own history no longer produces — while a merge or an observation-less registration carries no belief and reverses from any position" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "The reason is in how the fold works. Probability and status come from each transition's recorded after-snapshot, while log-odds replay as deltas;"
- `clm_774c0f6c78f5` — "Ordering two same-second runs by the hex of their run_id can replay a support or a supersession before the claim it targets exists — thirteen core tests hit a KeyError on it, and an inbox drain produces dependent runs inside one wall-clock second by construction" · p 0.75 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The engine builder shipped `(timestamp, file order)` instead, because the literal key replays a same-second dependent run before the run it depends on: two runs sharing a timestamp order by the hex of their `run_id`, so a support or a…"
- `clm_90eab08bfde2` — "After the retune and the stopword fix the superseded ownership claim ranks fifth on its historical question, and the remaining gap to rank one is the belief multiplier alone, which reads the claim's current belief rather than the belief it held before its supersession" · p 0.72 · active · 1 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "Whether the historical profile should read the belief a claim held before its supersession: the retune and the stopword fix put the superseded claim fifth, and the remaining gap to rank one is the belief multiplier alone."

## Timeline

- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_f3c9a3215ea4` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_a0b912ad50ca` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_758247b58186)
- 2026-08-20 support_update `clm_a0b912ad50ca` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_09c828d1c803)
- 2026-08-21 new_claim `clm_38f894daef7f` (src_21d1317cc326)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-08-21 support_update `clm_38f894daef7f` (src_e261dc10ac79)
- 2026-08-21 new_claim `clm_90eab08bfde2` (src_e261dc10ac79)
- 2026-08-22 new_claim `clm_774c0f6c78f5` (src_4863372048fa)
- 2026-08-22 new_claim `clm_b78683e15c8a` (src_e689bfca564a)

## Related

- → applies_to [[claim]] (1.00)
- → part_of [[transition-ledger]] (0.79)
- → replaces [[claim]] (0.79)
- → depends_on [[confidence-scoring]] (0.79)
- → part_of [[memory-lifecycle]] (0.79)
- [[claim]] — 5 shared claims
- [[state-layer]] — 4 shared claims
- [[hybrid-search]] — 3 shared claims
- [[llm-wiki]] — 3 shared claims
- [[transition-ledger]] — 3 shared claims
- [[knowledge-graph]] — 2 shared claims
- [[belief-updater]] — 1 shared claim
- [[confidence-scoring]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[graph-traversal]] — 1 shared claim
- [[memory-lifecycle]] — 1 shared claim
- [[rag]] — 1 shared claim
