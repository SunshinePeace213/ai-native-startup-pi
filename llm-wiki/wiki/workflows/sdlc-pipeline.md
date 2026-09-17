---
type: workflow
status: current
created: 2026-08-31
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/notes/sdlc-lessons-digest-2026-09.md, title: "SDLC lessons digest — recurring mistake classes", id: src_89c94277b388}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_sdlc_pipeline]
claim_ids: [clm_11756515326f, clm_342f37a2d893, clm_6e0d478eb763, clm_b831b6d08634, clm_f5ca4914ba73, clm_a435a2f24fd4]
confidence: 0.75
stale_after: 2027-01-28
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# SDLC pipeline

> **In here:** The regression-in-fix mistake, seen 4 times, is a fix commit introducing new blocking defects that the delta round then finds · 6 claims, confidence 0.75.

## Current understanding

- The regression-in-fix mistake, seen 4 times, is a fix commit introducing new blocking defects that the delta round then finds (0.75)
- The unrunnable-validation-command mistake, seen 3 times, is a spec naming a runner that cannot reach, collect, or grade its target; it was amended as the proof check in scripts/sdlc_lint.py (0.75)
- The path-containment-missing mistake, seen 3 times, is a validator joining caller-supplied paths without containment, so traversal or symlinks escape the project root (0.75)
- The stale-counts mistake, seen 5 times, is a summary, dev report, or spec carrying counts and statuses that contradict the ledger they summarize (0.75)
- The unfaithful-environment mistake, seen once, is a staged scratch copy missing what the code resolves against — the git repo, the env, the referenced files — so the eval measures the fake (0.75)
- The false-passing-validator mistake, seen 10 times across shipped ledgers, is a check that passes without proving its criterion — extra rows, substring matches, or vacuous quantifiers let a wrong artifact through (0.75)

## Evidence

- `clm_11756515326f` — "The regression-in-fix mistake, seen 4 times, is a fix commit introducing new blocking defects that the delta round then finds." · p 0.75 · active · 1 support · 0 contradict
  - `src_89c94277b388` SDLC lessons digest — recurring mistake classes: "The regression-in-fix mistake, seen 4 times, is a fix commit introducing new blocking defects that the delta round then finds."
- `clm_342f37a2d893` — "The unrunnable-validation-command mistake, seen 3 times, is a spec naming a runner that cannot reach, collect, or grade its target; it was amended as the proof check in scripts/sdlc_lint.py." · p 0.75 · active · 1 support · 0 contradict
  - `src_89c94277b388` SDLC lessons digest — recurring mistake classes: "The unrunnable-validation-command mistake, seen 3 times, is a spec naming a runner that cannot reach, collect, or grade its target; it was amended as the `proof` check in `scripts/sdlc_lint.py`."
- `clm_6e0d478eb763` — "The path-containment-missing mistake, seen 3 times, is a validator joining caller-supplied paths without containment, so traversal or symlinks escape the project root." · p 0.75 · active · 1 support · 0 contradict
  - `src_89c94277b388` SDLC lessons digest — recurring mistake classes: "The path-containment-missing mistake, seen 3 times, is a validator joining caller-supplied paths without containment, so traversal or symlinks escape the project root."
- `clm_b831b6d08634` — "The stale-counts mistake, seen 5 times, is a summary, dev report, or spec carrying counts and statuses that contradict the ledger they summarize." · p 0.75 · active · 1 support · 0 contradict
  - `src_89c94277b388` SDLC lessons digest — recurring mistake classes: "The stale-counts mistake, seen 5 times, is a summary, dev report, or spec carrying counts and statuses that contradict the ledger they summarize."
- `clm_f5ca4914ba73` — "The unfaithful-environment mistake, seen once, is a staged scratch copy missing what the code resolves against — the git repo, the env, the referenced files — so the eval measures the fake." · p 0.75 · active · 1 support · 0 contradict
  - `src_89c94277b388` SDLC lessons digest — recurring mistake classes: "The unfaithful-environment mistake, seen once, is a staged scratch copy missing what the code resolves against — the git repo, the env, the referenced files — so the eval measures the fake."
- `clm_a435a2f24fd4` — "The false-passing-validator mistake, seen 10 times across shipped ledgers, is a check that passes without proving its criterion — extra rows, substring matches, or vacuous quantifiers let a wrong artifact through." · p 0.75 · active · 1 support · 0 contradict
  - `src_89c94277b388` SDLC lessons digest — recurring mistake classes: "The false-passing-validator mistake, seen 10 times, is a check that passes without proving its criterion — extra rows, substring matches, or vacuous quantifiers let a wrong artifact through."

## Timeline

- 2026-08-31 new_claim `clm_a435a2f24fd4` (src_89c94277b388)
- 2026-08-31 new_claim `clm_342f37a2d893` (src_89c94277b388)
- 2026-08-31 new_claim `clm_6e0d478eb763` (src_89c94277b388)
- 2026-08-31 new_claim `clm_b831b6d08634` (src_89c94277b388)
- 2026-08-31 new_claim `clm_11756515326f` (src_89c94277b388)
- 2026-08-31 new_claim `clm_f5ca4914ba73` (src_89c94277b388)

## Related

- → part_of [[ai-native-startup]] (0.76)
- [[ai-native-startup]] — 1 shared claim
