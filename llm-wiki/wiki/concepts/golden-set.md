---
type: concept
status: current
created: 2026-08-21
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_golden_set]
claim_ids: [clm_338407819b19, clm_b94fd6ddf57c, clm_da107bde5751]
confidence: 0.75
stale_after: 2026-09-22
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# golden set

> **In here:** The retrieval golden set holds 34 cases across six families, grown from 20, and its baseline under the Phase 4 retriever and the fusion-v1 config measured fused MRR 0.4657 at recall 0.74 against… · 3 claims, confidence 0.75.

## Current understanding

- The union retriever measures the previous phase's live numbers exactly — fused MRR 0.519188 at recall 0.794118 over the 34-case golden set — because nothing in the scoring path was tuned: the config only changed its version string and gained a private collections block, and the eval reads the shared segment alone (0.76)
- The retrieval golden set holds 34 cases across six families, grown from 20, and its baseline under the Phase 4 retriever and the fusion-v1 config measured fused MRR 0.4657 at recall 0.74 against corpus-alone MRR 0.5647 at recall 0.71 — the history family answering 3 of 7 and the structure family 4 of 5 before any retriever change (0.76)
- The retrieve test fixture has never satisfied rebuild --check: its views carry hand-authored log-odds, entity ids, exceptions, and a supersession that a rebuild would overwrite, so fixture rows are hand-authored and held by schema validation, render check, and the suite (0.72)

## Evidence

- `clm_338407819b19` — "The union retriever measures the previous phase's live numbers exactly — fused MRR 0.519188 at recall 0.794118 over the 34-case golden set — because nothing in the scoring path was tuned: the config only changed its version string and gained a private collections block, and the eval reads the shared segment alone" · p 0.76 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The retrieval floor for this phase was Phase 5's live numbers, fused MRR 0.519188 at recall 0.794118 over the 34-case golden set."
- `clm_b94fd6ddf57c` — "The retrieval golden set holds 34 cases across six families, grown from 20, and its baseline under the Phase 4 retriever and the fusion-v1 config measured fused MRR 0.4657 at recall 0.74 against corpus-alone MRR 0.5647 at recall 0.71 — the history family answering 3 of 7 and the structure family 4 of 5 before any retriever change" · p 0.76 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The golden set grew from 20 to 34 cases across six families. Its baseline under the Phase 4 retriever and the `fusion-v1` config measured fused MRR 0.4657 at recall 0.74 against corpus-alone MRR 0.5647 at recall 0.71."
- `clm_da107bde5751` — "The retrieve test fixture has never satisfied rebuild --check: its views carry hand-authored log-odds, entity ids, exceptions, and a supersession that a rebuild would overwrite, so fixture rows are hand-authored and held by schema validation, render check, and the suite" · p 0.72 · active · 1 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "The retrieve test fixture has never satisfied rebuild --check: its views carry hand-authored log-odds, entity ids, exceptions, and a supersession that a rebuild would overwrite, so fixture rows are hand-authored and held by schema…"

## Timeline

- 2026-08-21 new_claim `clm_b94fd6ddf57c` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_da107bde5751` (src_e261dc10ac79)
- 2026-08-22 new_claim `clm_338407819b19` (src_4863372048fa)

## Related

- → applies_to [[hybrid-search]] (0.93)
- [[hybrid-search]] — 3 shared claims
- [[segmentation]] — 1 shared claim
