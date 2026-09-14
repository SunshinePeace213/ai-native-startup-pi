---
type: concept
status: current
created: 2026-08-26
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md, title: "Demystifying evals for AI agents", id: src_e66d966eb39d}
  - {resource: llm-wiki/raw/articles/datacurve/deepswe-v1-1.md, title: "DeepSWE v1.1", id: src_74863c70ef6c}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_eval_task]
claim_ids: [clm_ecddcb2a82c4, clm_01fcc1cff38a, clm_3726a8f5038f, clm_f2a36e88d3ab]
confidence: 0.77
stale_after: 2027-08-08
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# eval task

> **In here:** A good eval task is one where two domain experts would independently reach the same pass/fail verdict; ambiguity in the task specification turns into noise in the metric · 4 claims, confidence 0.77.

## Current understanding

- DeepSWE's stable aggregate hides large per-task movement between versions — narwhals-rolling-window-suite went from 33% to 100% and vulture-persistent-analysis-cache from 83% to 17% — so a single task's pass rate carries far less signal than the benchmark total (0.79)
- A good eval task is one where two domain experts would independently reach the same pass/fail verdict; ambiguity in the task specification turns into noise in the metric (0.77)
- An initial eval set of 20-50 simple tasks drawn from real failures is enough to start, because early in agent development each change has a large enough effect that small samples suffice (0.76)
- An eval set must cover both the cases where a behavior should occur and the cases where it should not, because one-sided evals create one-sided optimization — testing only that the agent searches when it should yields an agent that searches for almost everything (0.76)

## Evidence

- `clm_ecddcb2a82c4` — "DeepSWE's stable aggregate hides large per-task movement between versions — narwhals-rolling-window-suite went from 33% to 100% and vulture-persistent-analysis-cache from 83% to 17% — so a single task's pass rate carries far less signal than the benchmark total." · p 0.79 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "vulture-persistent-analysis-cache83%17%-66.7%"
- `clm_01fcc1cff38a` — "A good eval task is one where two domain experts would independently reach the same pass/fail verdict; ambiguity in the task specification turns into noise in the metric." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "A good task is one where two domain experts would independently reach the same pass/fail verdict. Could they pass the task themselves? If not, the task needs refinement. Ambiguity in task specifications becomes noise in metrics."
- `clm_3726a8f5038f` — "An initial eval set of 20-50 simple tasks drawn from real failures is enough to start, because early in agent development each change has a large enough effect that small samples suffice." · p 0.76 · active · 1 support · 0 contradict · when: in early agent development
  - `src_e66d966eb39d` Demystifying evals for AI agents: "In reality, 20-50 simple tasks drawn from real failures is a great start."
- `clm_f2a36e88d3ab` — "An eval set must cover both the cases where a behavior should occur and the cases where it should not, because one-sided evals create one-sided optimization — testing only that the agent searches when it should yields an agent that searches for almost everything." · p 0.76 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "Test both the cases where a behavior *should* occur and where it *shouldn't*. One-sided evals create one-sided optimization."

## Timeline

- 2026-08-26 new_claim `clm_3726a8f5038f` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_01fcc1cff38a` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_f2a36e88d3ab` (src_e66d966eb39d)
- 2026-09-14 new_claim `clm_ecddcb2a82c4` (src_74863c70ef6c)

## Related

- → part_of [[eval-suite]] (0.91)
- ← uses [[deepswe]] (0.79)
- ← applies_to [[grader]] (0.77)
- [[eval-suite]] — 2 shared claims
- [[deepswe]] — 1 shared claim
- [[grader]] — 1 shared claim
