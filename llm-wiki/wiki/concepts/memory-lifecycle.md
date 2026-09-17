---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_memory_lifecycle]
claim_ids: [clm_f3c9a3215ea4, clm_7efaede7ba35, clm_03243c5df8d3, clm_d72e29d3a5de]
confidence: 0.90
stale_after: 2028-05-20
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# memory lifecycle

> **In here:** A wiki that never forgets becomes noisy, so a retention curve lets facts that were important once but have not been accessed or reinforced in months gradually fade — deprioritized rather than deleted · 4 claims, confidence 0.90.

## Current understanding

- When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note (0.99)
- A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything (0.96)
- A wiki that never forgets becomes noisy, so a retention curve lets facts that were important once but have not been accessed or reinforced in months gradually fade — deprioritized rather than deleted (0.82)
- Observations consolidate up four tiers — working memory for recent unprocessed observations, episodic memory for compressed session summaries, semantic memory for cross-session facts, and procedural memory for workflows and patterns — each tier more compressed, more confident, and longer-lived than the one below it (0.82)

## Evidence

- `clm_f3c9a3215ea4` — "When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The new one should explicitly supersede it. Linked, timestamped, old version preserved but marked stale."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A transition where a newer claim replaces an older claim while preserving historical lineage."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Two claims linked by `CONTRADICTS` with no resolution are both `disputed`. When a later source resolves the conflict, the losing claim flips to `superseded`"
- `clm_7efaede7ba35` — "A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Every fact in the wiki should carry a confidence score: how many sources support it, how recently it was confirmed, whether anything contradicts it."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "This avoids pretending that one float captures everything."
- `clm_03243c5df8d3` — "A wiki that never forgets becomes noisy, so a retention curve lets facts that were important once but have not been accessed or reinforced in months gradually fade — deprioritized rather than deleted" · p 0.82 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Implement a retention curve: facts that were important once but haven't been accessed or reinforced in months should gradually fade. Not deleted, but deprioritized."
- `clm_d72e29d3a5de` — "Observations consolidate up four tiers — working memory for recent unprocessed observations, episodic memory for compressed session summaries, semantic memory for cross-session facts, and procedural memory for workflows and patterns — each tier more compressed, more confident, and longer-lived than the one below it" · p 0.82 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "- **Working memory**: recent observations, not yet processed - **Episodic memory**: session summaries, compressed from raw observations - **Semantic memory**: cross-session facts, consolidated from episodes - **Procedural memory**…"

## Timeline

- 2026-08-20 new_claim `clm_7efaede7ba35` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_f3c9a3215ea4` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_03243c5df8d3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_d72e29d3a5de` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_7efaede7ba35` (src_758247b58186)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_758247b58186)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_09c828d1c803)

## Related

- ← part_of [[confidence-scoring]] (0.80)
- → part_of [[llm-wiki]] (0.80)
- ← part_of [[supersession]] (0.79)
- ← part_of retention curve (no page yet) (0.79)
- ← part_of consolidation tiers (no page yet) (0.79)
- [[llm-wiki]] — 4 shared claims
- [[claim]] — 2 shared claims
- [[state-layer]] — 2 shared claims
- [[confidence-scoring]] — 1 shared claim
- [[knowledge-graph]] — 1 shared claim
- [[observation]] — 1 shared claim
- [[supersession]] — 1 shared claim
- [[transition-ledger]] — 1 shared claim
- consolidation tiers (no page yet)
- retention curve (no page yet)
