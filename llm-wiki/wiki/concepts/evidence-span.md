---
type: concept
status: current
created: 2026-08-20
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_evidence_span]
claim_ids: [clm_2bb1cab4a5e8, clm_a91dceb8a749, clm_30151137c491]
confidence: 0.83
stale_after: 2028-05-20
last_rendered: 2026-08-23T09:04:00Z
review_required: false
---

# evidence span

> **In here:** evidence span — 3 claims, confidence 0.83, 1 source.

## Current understanding

- An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships (0.83)
- A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline — and every load-bearing claim is shown at its confidence instead of stated as settled truth (0.83)
- Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required — and the operation vocabulary is new_claim, support_update, contradiction_update, scope_split, exception_addition, supersession, decay_update, promotion, archival, rejection, and human_override (0.83)

## Evidence

- `clm_2bb1cab4a5e8` — "An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A structured claim extracted by the LLM from a source. It is a noisy semantic measurement, not truth."
- `clm_a91dceb8a749` — "A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Markdown pages should be generated from the current belief state, not treated as unmanaged truth."
- `clm_30151137c491` — "Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Every state update is append-only."

## Timeline

- 2026-08-20 new_claim `clm_2bb1cab4a5e8` (src_758247b58186)
- 2026-08-20 new_claim `clm_30151137c491` (src_758247b58186)
- 2026-08-20 new_claim `clm_a91dceb8a749` (src_758247b58186)

## Related

- ← uses [[observation]] (0.80)
- ← cites [[rendered-page]] (0.79)
- [[claim]] — 3 shared claims
- [[observation]] — 2 shared claims
- [[state-layer]] — 2 shared claims
- [[belief-updater]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
- [[rendered-page]] — 1 shared claim
- [[transition-ledger]] — 1 shared claim
- [[wiki-layer]] — 1 shared claim
