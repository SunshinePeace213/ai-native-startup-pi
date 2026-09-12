---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_task_harness_fit]
claim_ids: [clm_64207eb604ea, clm_99954c9a26b6, clm_f517ef4e1778]
confidence: 0.79
stale_after: 2026-10-23
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# task-harness fit

> **In here:** The best harness for a task is not necessarily the one a model was post-trained with: Terminal Bench 2.0 shows the same model scoring differently across harnesses, so optimizing the harness for the… · 3 claims, confidence 0.79.

## Current understanding

- Task-harness fit is how well a harness matches the actual demands of the task, meaning the context it needs, the failures it will encounter, the policies it must enforce, and the environment it operates in (0.80)
- How well a harness fits the task at hand determines how useful an agent is (0.80)
- The best harness for a task is not necessarily the one a model was post-trained with: Terminal Bench 2.0 shows the same model scoring differently across harnesses, so optimizing the harness for the task carries significant value (0.75)

## Evidence

- `clm_64207eb604ea` — "Task-harness fit is how well a harness matches the actual demands of the task, meaning the context it needs, the failures it will encounter, the policies it must enforce, and the environment it operates in." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "Task-harness fit is how well your harness matches the actual demands of the task: the context it needs, the failures it'll encounter, the policies it must enforce, the environment it operates in."
- `clm_99954c9a26b6` — "How well a harness fits the task at hand determines how useful an agent is." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "How well a harness fits the task at hand determines how useful an agent is."
- `clm_f517ef4e1778` — "The best harness for a task is not necessarily the one a model was post-trained with: Terminal Bench 2.0 shows the same model scoring differently across harnesses, so optimizing the harness for the task carries significant value." · p 0.75 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**But this doesn't mean that the best harness for your task is the one a model was post-trained with.** The Terminal Bench 2.0 Leaderboard shows examples where Opus 4.6 scores differently depending on the harness."

## Timeline

- 2026-08-23 new_claim `clm_f517ef4e1778` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_64207eb604ea` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_99954c9a26b6` (src_f7dcee3b42fc)

## Related

- → applies_to [[agent-harness]] (0.93)
- [[agent-harness]] — 3 shared claims
