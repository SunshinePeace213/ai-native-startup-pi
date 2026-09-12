---
type: system
status: current
created: 2026-08-20
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_transition_ledger]
claim_ids: [clm_f3c9a3215ea4, clm_30151137c491, clm_10573df70548, clm_4de35163e2a6, clm_b78683e15c8a, clm_c0aec8aa0fdd, clm_774c0f6c78f5]
confidence: 0.81
stale_after: 2026-10-07
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# transition ledger

> **In here:** Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human… · 7 claims, confidence 0.81.

## Current understanding

- When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note (0.99)
- Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required — and the operation vocabulary is new_claim, support_update, contradiction_update, scope_split, exception_addition, supersession, decay_update, promotion, archival, rejection, and human_override (0.83)
- Retraction is keyed on the run identifier stamped on every row a run appends, so rows written before the governance layer carry none and are permanent: asking to reverse the vault's one pre-existing entity merge returns a refusal naming it as not retractable, and the only way to change a pre-governance belief is a new observation that contradicts or supersedes it (0.79)
- The ledgers are marked for union merge and the views are not: a union in either direction yields the same views only because the fold is a total order on the rows themselves rather than on their position in the file, and a conflict in a view or a page is repaired by rebuilding and re-rendering rather than by hand (0.79)
- Undo is stack-ordered for belief runs because probability and status come from each transition's recorded after-snapshot while log-odds replay as deltas — removing a run from the middle would leave later claims carrying a snapshot their own history no longer produces — while a merge or an observation-less registration carries no belief and reverses from any position (0.79)
- Ledger rows fold in (timestamp, run_id, file order), made causal by an engine invariant that stamps every write run strictly after the newest replayed ledger stamp — max(now, newest + 1 second) — so runs never tie inside one checkout and the run_id component only ever orders runs from two independent branches (0.79)
- Ordering two same-second runs by the hex of their run_id can replay a support or a supersession before the claim it targets exists — thirteen core tests hit a KeyError on it, and an inbox drain produces dependent runs inside one wall-clock second by construction (0.75)

## Evidence

- `clm_f3c9a3215ea4` — "When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The new one should explicitly supersede it. Linked, timestamped, old version preserved but marked stale."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A transition where a newer claim replaces an older claim while preserving historical lineage."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Two claims linked by `CONTRADICTS` with no resolution are both `disputed`. When a later source resolves the conflict, the losing claim flips to `superseded`"
- `clm_30151137c491` — "Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Every state update is append-only."
- `clm_10573df70548` — "Retraction is keyed on the run identifier stamped on every row a run appends, so rows written before the governance layer carry none and are permanent: asking to reverse the vault's one pre-existing entity merge returns a refusal naming it as not retractable, and the only way to change a pre-governance belief is a new observation that contradicts or supersedes it" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "This is a real limit rather than an oversight, and it is worth stating plainly because it decides what a migration into this layer buys. Everything written after the governance layer landed is reversible under the stack rule;"
- `clm_4de35163e2a6` — "The ledgers are marked for union merge and the views are not: a union in either direction yields the same views only because the fold is a total order on the rows themselves rather than on their position in the file, and a conflict in a view or a page is repaired by rebuilding and re-rendering rather than by hand" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "That works only because the fold is a total order on the rows themselves rather than on their position in the file, so a union merge in either direction yields the same views byte for byte."
- `clm_b78683e15c8a` — "Undo is stack-ordered for belief runs because probability and status come from each transition's recorded after-snapshot while log-odds replay as deltas — removing a run from the middle would leave later claims carrying a snapshot their own history no longer produces — while a merge or an observation-less registration carries no belief and reverses from any position" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "The reason is in how the fold works. Probability and status come from each transition's recorded after-snapshot, while log-odds replay as deltas;"
- `clm_c0aec8aa0fdd` — "Ledger rows fold in (timestamp, run_id, file order), made causal by an engine invariant that stamps every write run strictly after the newest replayed ledger stamp — max(now, newest + 1 second) — so runs never tie inside one checkout and the run_id component only ever orders runs from two independent branches" · p 0.79 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The resolution kept the plan's key and gave the engine the invariant that makes it causal: a write run's stamp is strictly after the newest stamp on any replayed ledger row, computed as `max(now, newest + 1 second)`."
- `clm_774c0f6c78f5` — "Ordering two same-second runs by the hex of their run_id can replay a support or a supersession before the claim it targets exists — thirteen core tests hit a KeyError on it, and an inbox drain produces dependent runs inside one wall-clock second by construction" · p 0.75 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The engine builder shipped `(timestamp, file order)` instead, because the literal key replays a same-second dependent run before the run it depends on: two runs sharing a timestamp order by the hex of their `run_id`, so a support or a…"

## Timeline

- 2026-08-20 new_claim `clm_f3c9a3215ea4` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_30151137c491` (src_758247b58186)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_758247b58186)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_09c828d1c803)
- 2026-08-22 new_claim `clm_c0aec8aa0fdd` (src_4863372048fa)
- 2026-08-22 new_claim `clm_774c0f6c78f5` (src_4863372048fa)
- 2026-08-22 new_claim `clm_b78683e15c8a` (src_e689bfca564a)
- 2026-08-22 new_claim `clm_10573df70548` (src_e689bfca564a)
- 2026-08-22 new_claim `clm_4de35163e2a6` (src_e689bfca564a)

## Related

- → produces [[claim]] (0.99)
- → part_of [[state-layer]] (0.93)
- ← part_of [[supersession]] (0.79)
- → cites [[observation]] (0.79)
- ← produces [[belief-updater]] (0.79)
- ← applies_to [[entity-resolution]] (0.79)
- ← uses [[belief-updater]] (0.79)
- [[claim]] — 5 shared claims
- [[state-layer]] — 3 shared claims
- [[supersession]] — 3 shared claims
- [[belief-updater]] — 2 shared claims
- [[entity-resolution]] — 1 shared claim
- [[evidence-span]] — 1 shared claim
- [[knowledge-graph]] — 1 shared claim
- [[llm-wiki]] — 1 shared claim
- [[memory-lifecycle]] — 1 shared claim
- [[observation]] — 1 shared claim
- [[rendered-page]] — 1 shared claim
