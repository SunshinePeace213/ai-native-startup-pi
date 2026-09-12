---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/docs/claude-code/goal.md, title: "Keep Claude working toward a goal", id: src_5229aa475d30}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_goal_evaluator]
claim_ids: [clm_62d0421c8691, clm_e16842727e57, clm_cf409a883dc9, clm_c54b34646d07]
confidence: 0.94
stale_after: 2029-09-29
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# goal evaluator

> **In here:** A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion… · 4 claims, confidence 0.94.

## Current understanding

- A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count (0.98)
- A goal condition has to be something Claude's own output can demonstrate in the transcript, because the evaluator judges only what has surfaced in the conversation and never runs commands or reads files itself (0.93)
- A goal clears automatically in three ways: the evaluator confirms the condition is met, it judges the condition impossible to satisfy, or a turn fails on an error you have to fix (0.93)
- Goal evaluation is skipped for any turn that ends while a subagent or background shell command is still running, and resumes at the end of the next turn that finishes with no background work (0.92)

## Evidence

- `clm_62d0421c8691` — "A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count" · p 0.98 · active · 2 support · 0 contradict · when: for goal-based loops
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "an evaluator model checks after each iteration whether the success criteria have been met, rather than Claude trying to judge its own completion"
  - `src_5229aa475d30` Keep Claude working toward a goal: "Each time Claude finishes a turn, Claude Code sends the condition and the conversation so far to your configured [small fast model](/docs/en/model-config), which defaults to Haiku on the Claude API;"
- `clm_e16842727e57` — "A goal condition has to be something Claude's own output can demonstrate in the transcript, because the evaluator judges only what has surfaced in the conversation and never runs commands or reads files itself." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "The [evaluator](#how-evaluation-works) judges your condition against what Claude has surfaced in the conversation. It doesn't run commands or read files independently, so write the condition as something Claude's own output can demonstrate."
- `clm_cf409a883dc9` — "A goal clears automatically in three ways: the evaluator confirms the condition is met, it judges the condition impossible to satisfy, or a turn fails on an error you have to fix." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "The goal clears automatically once the condition is met, if the model judges the condition impossible to satisfy, or if a turn fails on [an error you have to fix](#errors-you-have-to-fix-clear-the-goal)."
- `clm_c54b34646d07` — "Goal evaluation is skipped for any turn that ends while a subagent or background shell command is still running, and resumes at the end of the next turn that finishes with no background work." · p 0.92 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "If a subagent or a background shell command is still running when a turn ends, Claude Code skips the evaluation for that turn. It evaluates at the end of the next turn that finishes with no background work running."

## Timeline

- 2026-08-23 new_claim `clm_62d0421c8691` (src_d0a8a3247101)
- 2026-08-23 support_update `clm_62d0421c8691` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_cf409a883dc9` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_e16842727e57` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_c54b34646d07` (src_5229aa475d30)

## Related

- → applies_to [[completion-condition]] (0.93)
- ← uses [[goal-command]] (0.93)
- → uses small fast model (no page yet) (0.93)
- [[completion-condition]] — 2 shared claims
- [[goal-command]] — 2 shared claims
- [[agent-loops]] — 1 shared claim
- [[claude-code]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
- small fast model (no page yet)
