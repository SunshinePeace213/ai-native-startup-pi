---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_confidence_scoring]
claim_ids: [clm_7efaede7ba35, clm_a0b912ad50ca, clm_2c4f52e16820, clm_0f8aacf5947f]
confidence: 0.88
stale_after: 2026-10-15
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# confidence scoring

> **In here:** A claim's confidence is not one number · 4 claims, confidence 0.88.

## Current understanding

- A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything (0.96)
- A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion (0.96)
- Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid — because probabilities saturate too easily while log-odds lets independent sources accumulate naturally (0.83)
- The fusion-v2 rerank block is scaled to a third of fusion-v1 — probability 0.15, authority, recency, and support 0.05 each — so belief acts as a tie-breaker between claims the streams agree on rather than deciding rank one: a claim at p 0.99 with three supports carries belief 1.2835 where fusion-v1 gave it 2.17 (0.76)

## Evidence

- `clm_7efaede7ba35` — "A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Every fact in the wiki should carry a confidence score: how many sources support it, how recently it was confirmed, whether anything contradicts it."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "This avoids pretending that one float captures everything."
- `clm_a0b912ad50ca` — "A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The LLM should propose which claim is more likely correct based on source recency, source authority, and the number of supporting observations. The human can override, but the default behavior should usually be right."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Contradictions should not be hidden."
- `clm_2c4f52e16820` — "Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Probabilities saturate too easily. If several independent sources support the same claim, log-odds lets evidence accumulate more naturally."
- `clm_0f8aacf5947f` — "The fusion-v2 rerank block is scaled to a third of fusion-v1 — probability 0.15, authority, recency, and support 0.05 each — so belief acts as a tie-breaker between claims the streams agree on rather than deciding rank one: a claim at p 0.99 with three supports carries belief 1.2835 where fusion-v1 gave it 2.17" · p 0.76 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The `fusion-v2` config scales the rerank block to a third — probability 0.15, authority, recency, and support 0.05 each — so belief acts as a tie-breaker between claims the streams agree on rather than deciding rank one."

## Timeline

- 2026-08-20 new_claim `clm_7efaede7ba35` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_a0b912ad50ca` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_2c4f52e16820` (src_758247b58186)
- 2026-08-20 support_update `clm_7efaede7ba35` (src_758247b58186)
- 2026-08-20 support_update `clm_a0b912ad50ca` (src_758247b58186)
- 2026-08-21 new_claim `clm_0f8aacf5947f` (src_21d1317cc326)

## Related

- → part_of [[memory-lifecycle]] (0.80)
- ← depends_on [[supersession]] (0.79)
- → part_of [[state-layer]] (0.79)
- → applies_to [[claim]] (0.79)
- ← uses [[observation]] (0.79)
- ← uses [[hybrid-search]] (0.79)
- [[claim]] — 3 shared claims
- [[state-layer]] — 3 shared claims
- [[belief-updater]] — 2 shared claims
- [[llm-wiki]] — 2 shared claims
- [[hybrid-search]] — 1 shared claim
- [[memory-lifecycle]] — 1 shared claim
- [[observation]] — 1 shared claim
- [[supersession]] — 1 shared claim
