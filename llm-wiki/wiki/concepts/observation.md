---
type: concept
status: current
created: 2026-08-20
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_observation]
claim_ids: [clm_7efaede7ba35, clm_9e583518b455, clm_2bb1cab4a5e8, clm_877c740dd0fb, clm_30151137c491, clm_d9fe1d507413, clm_c3528b922fca]
confidence: 0.86
stale_after: 2027-08-30
last_rendered: 2026-08-23T10:25:46Z
review_required: false
---

# observation

> **In here:** observation — 7 claims, confidence 0.86, 4 sources.

## Current understanding

- A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything (0.96)
- Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages (0.96)
- An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships (0.83)
- Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth (0.83)
- Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required — and the operation vocabulary is new_claim, support_update, contradiction_update, scope_split, exception_addition, supersession, decay_update, promotion, archival, rejection, and human_override (0.83)
- The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page (0.81)
- The inbox separates authorship of a proposal from responsibility for the write: an actor with no permission to apply may still write a proposal, and the drain records the run against the actor that applied it rather than the one that wrote the file (0.77)

## Evidence

- `clm_7efaede7ba35` — "A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Every fact in the wiki should carry a confidence score: how many sources support it, how recently it was confirmed, whether anything contradicts it."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "This avoids pretending that one float captures everything."
- `clm_9e583518b455` — "Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "The important insight: **good answers can be filed back into the wiki as new pages.** A comparison you asked for, an analysis, a connection you discovered — these are valuable and shouldn't disappear into chat history."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A debugging session, research thread, or architecture conversation becomes a source."
- `clm_2bb1cab4a5e8` — "An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A structured claim extracted by the LLM from a source. It is a noisy semantic measurement, not truth."
- `clm_877c740dd0fb` — "Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "The LLM does not decide truth. It outputs a noisy observation. The updater decides how belief changes."
- `clm_30151137c491` — "Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Every state update is append-only."
- `clm_d9fe1d507413` — "The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page" · p 0.81 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Separate source, observation, belief, and rendered page."
- `clm_c3528b922fca` — "The inbox separates authorship of a proposal from responsibility for the write: an actor with no permission to apply may still write a proposal, and the drain records the run against the actor that applied it rather than the one that wrote the file" · p 0.77 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "That split is what lets an actor propose work it is not permitted to land. The weekly routine has no permission to apply on the shared segment, but nothing stops it writing a proposal;"

## Timeline

- 2026-08-20 new_claim `clm_9e583518b455` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_7efaede7ba35` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_2bb1cab4a5e8` (src_758247b58186)
- 2026-08-20 new_claim `clm_877c740dd0fb` (src_758247b58186)
- 2026-08-20 new_claim `clm_30151137c491` (src_758247b58186)
- 2026-08-20 support_update `clm_7efaede7ba35` (src_758247b58186)
- 2026-08-20 support_update `clm_9e583518b455` (src_758247b58186)
- 2026-08-20 new_claim `clm_d9fe1d507413` (src_758247b58186)
- 2026-08-22 new_claim `clm_c3528b922fca` (src_e689bfca564a)

## Related

- → applies_to [[claim]] (0.80)
- → depends_on [[raw-layer]] (0.80)
- → uses [[evidence-span]] (0.80)
- ← uses [[belief-updater]] (0.79)
- ← cites [[transition-ledger]] (0.79)
- → uses [[confidence-scoring]] (0.79)
- ← produces [[crystallization]] (0.78)
- → part_of [[state-layer]] (0.77)
- ← produces [[ingest]] (0.77)
- [[claim]] — 6 shared claims
- [[state-layer]] — 5 shared claims
- [[llm-wiki]] — 4 shared claims
- [[belief-updater]] — 2 shared claims
- [[evidence-span]] — 2 shared claims
- [[raw-layer]] — 2 shared claims
- [[rendered-page]] — 2 shared claims
- [[confidence-scoring]] — 1 shared claim
- [[crystallization]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[memory-lifecycle]] — 1 shared claim
- [[query]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[transition-ledger]] — 1 shared claim
