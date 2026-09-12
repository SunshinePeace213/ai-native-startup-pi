---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/docs/claude-code/goal.md, title: "Keep Claude working toward a goal", id: src_5229aa475d30}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_completion_condition]
claim_ids: [clm_e16842727e57, clm_cf409a883dc9, clm_ddd5deba5af8]
confidence: 0.93
stale_after: 2029-11-23
last_rendered: 2026-08-23T14:39:21Z
review_required: false
---

# completion condition

> **In here:** A goal condition has to be something Claude's own output can demonstrate in the transcript, because the evaluator judges only what has surfaced in the conversation and never runs commands or reads… · 3 claims, confidence 0.93.

## Current understanding

- A goal condition has to be something Claude's own output can demonstrate in the transcript, because the evaluator judges only what has surfaced in the conversation and never runs commands or reads files itself (0.93)
- A goal clears automatically in three ways: the evaluator confirms the condition is met, it judges the condition impossible to satisfy, or a turn fails on an error you have to fix (0.93)
- The /goal command sets a completion condition and Claude Code keeps working toward it turn after turn, starting a new turn instead of returning control whenever the condition does not yet hold (0.93)

## Evidence

- `clm_e16842727e57` — "A goal condition has to be something Claude's own output can demonstrate in the transcript, because the evaluator judges only what has surfaced in the conversation and never runs commands or reads files itself." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "The [evaluator](#how-evaluation-works) judges your condition against what Claude has surfaced in the conversation. It doesn't run commands or read files independently, so write the condition as something Claude's own output can demonstrate."
- `clm_cf409a883dc9` — "A goal clears automatically in three ways: the evaluator confirms the condition is met, it judges the condition impossible to satisfy, or a turn fails on an error you have to fix." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "The goal clears automatically once the condition is met, if the model judges the condition impossible to satisfy, or if a turn fails on [an error you have to fix](#errors-you-have-to-fix-clear-the-goal)."
- `clm_ddd5deba5af8` — "The /goal command sets a completion condition and Claude Code keeps working toward it turn after turn, starting a new turn instead of returning control whenever the condition does not yet hold." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "The `/goal` command sets a completion condition and Claude keeps working toward it without you prompting each step. After each turn, a small fast model checks whether the condition holds."

## Timeline

- 2026-08-23 new_claim `clm_ddd5deba5af8` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_cf409a883dc9` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_e16842727e57` (src_5229aa475d30)

## Related

- ← applies_to [[goal-evaluator]] (0.93)
- ← uses [[goal-command]] (0.93)
- [[goal-command]] — 2 shared claims
- [[goal-evaluator]] — 2 shared claims
- [[claude-code]] — 1 shared claim
