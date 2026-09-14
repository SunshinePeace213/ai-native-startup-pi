---
type: concept
status: current
created: 2026-09-14
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/datacurve/deepswe-v1-1.md, title: "DeepSWE v1.1", id: src_74863c70ef6c}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_deepswe]
claim_ids: [clm_983bc5b1738a, clm_cb09cba5d977, clm_38ba668ff2cd, clm_aa4c77894040, clm_096dbb5c1e93, clm_af3ac5bbcf6b, clm_2d9fb7740370, clm_ecddcb2a82c4]
confidence: 0.81
stale_after: 2026-12-18
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# DeepSWE

> **In here:** DeepSWE v1.1 sets main to the task's starting commit with no future commits visible instead of running the agent in detached HEAD, so the agent branches and commits the way it would in normal… · 8 claims, confidence 0.81.

## Current understanding

- DeepSWE v1.1 grades the agent's committed git patch in a fresh container separate from where the agent worked, following SWE-bench's approach, so grading is independent of the agent's runtime environment (0.83)
- Grading only the committed patch in a separate container closes the easy DeepSWE shortcuts: an agent cannot monkey-patch the test framework, and because the CTRF report records each task-defining test by name, dropped tests or an early exit surface as missing or failed rather than as a pass (0.83)
- DeepSWE v1.1 sets main to the task's starting commit with no future commits visible instead of running the agent in detached HEAD, so the agent branches and commits the way it would in normal development (0.81)
- Tightening DeepSWE's execution and grading between v1 and v1.1 left aggregate results close: the ordering at the top is unchanged and most configurations land within a few points of their v1 score (0.81)
- 73 of Claude Fable 5's 2,260 DeepSWE trials never completed because a US government directive suspended access partway through the sweep, and its pass rates are computed over the completed trials only (0.81)
- Datacurve swept the tasks' upstream repositories as of June 5th for implementations similar to its tasks, found none, and concludes v1.0 results are free of agents finding the answer through git log (0.81)
- DeepSWE v1.1 puts GPT-6 Astra at xhigh, Gemini 3.8 Flash at high, and Claude Opus 5 at max in a three-way tie at 74% pass@1 on costs of $6.52, $2.36, and $11.84 per task (0.81)
- DeepSWE's stable aggregate hides large per-task movement between versions — narwhals-rolling-window-suite went from 33% to 100% and vulture-persistent-analysis-cache from 83% to 17% — so a single task's pass rate carries far less signal than the benchmark total (0.79)

## Evidence

- `clm_983bc5b1738a` — "DeepSWE v1.1 grades the agent's committed git patch in a fresh container separate from where the agent worked, following SWE-bench's approach, so grading is independent of the agent's runtime environment." · p 0.83 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "**Isolated Verification:** The agent commits its proposed changes, and we extract the git patch to evaluate in an isolated container, separate from where the agent worked."
- `clm_cb09cba5d977` — "Grading only the committed patch in a separate container closes the easy DeepSWE shortcuts: an agent cannot monkey-patch the test framework, and because the CTRF report records each task-defining test by name, dropped tests or an early exit surface as missing or failed rather than as a pass." · p 0.83 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "Because we grade only the committed patch in a separate container, some easier shortcuts no longer work: an agent can't monkey-patch the test framework, and because the CTRF report records each task-defining test by name, dropping tests…"
- `clm_38ba668ff2cd` — "DeepSWE v1.1 sets main to the task's starting commit with no future commits visible instead of running the agent in detached HEAD, so the agent branches and commits the way it would in normal development." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "**Natural Git Environment:** Rather than operating in detached HEAD mode, we set the `main` branch to the task's starting commit and ensure no future commits are visible."
- `clm_aa4c77894040` — "Tightening DeepSWE's execution and grading between v1 and v1.1 left aggregate results close: the ordering at the top is unchanged and most configurations land within a few points of their v1 score." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "The chart below compares each model's pass rate under v1 and v1.1. Scores stay close: the ordering at the top is unchanged, and most configurations land within a few points of their v1 result."
- `clm_096dbb5c1e93` — "73 of Claude Fable 5's 2,260 DeepSWE trials never completed because a US government directive suspended access partway through the sweep, and its pass rates are computed over the completed trials only." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "Note: 73 of Claude Fable 5's 2,260 trials did not complete due to [access being suspended by a US government directive](https://www.anthropic.com/news/fable-mythos-access) partway through our sweep."
- `clm_af3ac5bbcf6b` — "Datacurve swept the tasks' upstream repositories as of June 5th for implementations similar to its tasks, found none, and concludes v1.0 results are free of agents finding the answer through git log." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "We conducted a sweep of the tasks' upstream repos to check whether any had implementations similar to our tasks as of June 5th. We found no such instances, meaning results from v1.0 remain free of this form of cheating."
- `clm_2d9fb7740370` — "DeepSWE v1.1 puts GPT-6 Astra at xhigh, Gemini 3.8 Flash at high, and Claude Opus 5 at max in a three-way tie at 74% pass@1 on costs of $6.52, $2.36, and $11.84 per task." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "gpt-6-astra[xhigh] 74%±3% Avg cost $6.52Out tok 30kSteps 29 74%±3% $6.52 30k 29 gemini-3.8-flash[high] 74%±1% Avg cost $2.36Out tok 143kSteps 166 74%±1% $2.36 143k 166 claude-opus-5[max] 74%±4% Avg cost $11.84Out tok 118kSteps 99 74%±4%…"
- `clm_ecddcb2a82c4` — "DeepSWE's stable aggregate hides large per-task movement between versions — narwhals-rolling-window-suite went from 33% to 100% and vulture-persistent-analysis-cache from 83% to 17% — so a single task's pass rate carries far less signal than the benchmark total." · p 0.79 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "vulture-persistent-analysis-cache83%17%-66.7%"

## Timeline

- 2026-09-14 new_claim `clm_983bc5b1738a` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_cb09cba5d977` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_aa4c77894040` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_ecddcb2a82c4` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_2d9fb7740370` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_38ba668ff2cd` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_af3ac5bbcf6b` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_096dbb5c1e93` (src_74863c70ef6c)

## Related

- → applies_to [[agent-evaluation]] (0.83)
- ← produces [[datacurve]] (0.83)
- → uses [[eval-task]] (0.79)
- [[datacurve]] — 2 shared claims
- [[agent-evaluation]] — 1 shared claim
- [[claude-fable-5]] — 1 shared claim
- [[claude-opus-5]] — 1 shared claim
- [[eval-task]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
