---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_entity_resolution]
claim_ids: [clm_388d45acd4c5, clm_804caacdb245, clm_a37a7b28e462, clm_10573df70548, clm_4c34c8aabbe3]
confidence: 0.85
stale_after: 2026-10-16
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# entity resolution

> **In here:** Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets… · 5 claims, confidence 0.85.

## Current understanding

- Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs (0.96)
- A graph preserves errors as efficiently as facts — entity resolution can merge distinct organizations and extraction can attach the wrong date — so graph-grounded systems require schema validation, canonical identifiers, provenance, conflict representation, confidence calibration, and periodic review (0.90)
- No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 — because semantic-similarity embeddings measure same topic, not same real-world entity, which is a different task than identity resolution (0.83)
- Retraction is keyed on the run identifier stamped on every row a run appends, so rows written before the governance layer carry none and are permanent: asking to reverse the vault's one pre-existing entity merge returns a refusal naming it as not retractable, and the only way to change a pre-governance belief is a new observation that contradicts or supersedes it (0.79)
- Sorting the ledger readers moved only evidence lists on the live vault — 20 of 44 entity rows and 11 of 100 relationship rows, each the same multiset re-ordered — while the claims, unresolved-conflicts, and snapshot views stayed byte-identical and no entity resolution moved (0.76)

## Evidence

- `clm_388d45acd4c5` — "Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs." · p 0.96 · active · 2 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**2. Two-stage fix (cheap filter + LLM judgment)"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "A second finding fell out of this run: the stage-1 threshold (0.55) that cleanly separated classes on the first domain did *not* transfer — one unrelated pair leaked through as a candidate in the new domain (cosine 0.60, above threshold)."
- `clm_804caacdb245` — "A graph preserves errors as efficiently as facts — entity resolution can merge distinct organizations and extraction can attach the wrong date — so graph-grounded systems require schema validation, canonical identifiers, provenance, conflict representation, confidence calibration, and periodic review" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "A graph can preserve errors as efficiently as facts. Entity resolution can merge distinct organizations. Extraction can attach the wrong date. A confident evaluator can mark a weak source as sufficient."
- `clm_a37a7b28e462` — "No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 — because semantic-similarity embeddings measure same topic, not same real-world entity, which is a different task than identity resolution." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "No threshold cleanly separates the classes; best achievable was F1=0.667 (precision 0.542) at threshold 0.72. The 0.97 guessed in the original smoke test was never viable — at 0.97, recall is ~0."
- `clm_10573df70548` — "Retraction is keyed on the run identifier stamped on every row a run appends, so rows written before the governance layer carry none and are permanent: asking to reverse the vault's one pre-existing entity merge returns a refusal naming it as not retractable, and the only way to change a pre-governance belief is a new observation that contradicts or supersedes it" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "This is a real limit rather than an oversight, and it is worth stating plainly because it decides what a migration into this layer buys. Everything written after the governance layer landed is reversible under the stack rule;"
- `clm_4c34c8aabbe3` — "Sorting the ledger readers moved only evidence lists on the live vault — 20 of 44 entity rows and 11 of 100 relationship rows, each the same multiset re-ordered — while the claims, unresolved-conflicts, and snapshot views stayed byte-identical and no entity resolution moved" · p 0.76 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "On a scratch copy the diff was exact — 20 of 44 entity rows moved and 11 of 100 relationship rows moved, and in every case the only field that changed was an evidence list."

## Timeline

- 2026-08-20 new_claim `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_a37a7b28e462` (src_09c828d1c803)
- 2026-08-20 support_update `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-22 new_claim `clm_4c34c8aabbe3` (src_4863372048fa)
- 2026-08-22 new_claim `clm_10573df70548` (src_e689bfca564a)
- 2026-08-23 new_claim `clm_804caacdb245` (src_363b13dc0870)

## Related

- → uses [[embeddings]] (0.99)
- ← uses [[graphwiki]] (0.96)
- ← depends_on [[knowledge-graph]] (0.90)
- → part_of [[ingest]] (0.82)
- → applies_to [[knowledge-graph]] (0.79)
- → applies_to [[transition-ledger]] (0.79)
- [[knowledge-graph]] — 4 shared claims
- [[embeddings]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[graphwiki]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[state-layer]] — 1 shared claim
- [[transition-ledger]] — 1 shared claim
