---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/docs/claude-code/goal.md, title: "Keep Claude working toward a goal", id: src_5229aa475d30}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_goal_command]
claim_ids: [clm_62d0421c8691, clm_cf409a883dc9, clm_ddd5deba5af8, clm_3072c56e3d0e, clm_a9f8de81c140, clm_1b37e536a50d]
confidence: 0.93
stale_after: 2027-01-06
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# goal command

> **In here:** /goal rides on the hooks system, so it follows the same workspace-trust rule as hooks in settings files and is unavailable wherever disableAllHooks or allowManagedHooksOnly is in force · 6 claims, confidence 0.93.

## Current understanding

- A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count (0.98)
- A goal clears automatically in three ways: the evaluator confirms the condition is met, it judges the condition impossible to satisfy, or a turn fails on an error you have to fix (0.93)
- The /goal command sets a completion condition and Claude Code keeps working toward it turn after turn, starting a new turn instead of returning control whenever the condition does not yet hold (0.93)
- A turn that fails on an error which will not clear until you fix it ends the active goal, with a warning naming the cause and telling you to run /goal again once it is fixed (0.93)
- Only one goal can be active per Claude Code session, and the same /goal command sets, checks, and clears it depending on the argument given (0.93)
- /goal rides on the hooks system, so it follows the same workspace-trust rule as hooks in settings files and is unavailable wherever disableAllHooks or allowManagedHooksOnly is in force (0.88)

## Evidence

- `clm_62d0421c8691` — "A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count" · p 0.98 · active · 2 support · 0 contradict · when: for goal-based loops
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "an evaluator model checks after each iteration whether the success criteria have been met, rather than Claude trying to judge its own completion"
  - `src_5229aa475d30` Keep Claude working toward a goal: "Each time Claude finishes a turn, Claude Code sends the condition and the conversation so far to your configured [small fast model](/docs/en/model-config), which defaults to Haiku on the Claude API;"
- `clm_cf409a883dc9` — "A goal clears automatically in three ways: the evaluator confirms the condition is met, it judges the condition impossible to satisfy, or a turn fails on an error you have to fix." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "The goal clears automatically once the condition is met, if the model judges the condition impossible to satisfy, or if a turn fails on [an error you have to fix](#errors-you-have-to-fix-clear-the-goal)."
- `clm_ddd5deba5af8` — "The /goal command sets a completion condition and Claude Code keeps working toward it turn after turn, starting a new turn instead of returning control whenever the condition does not yet hold." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "The `/goal` command sets a completion condition and Claude keeps working toward it without you prompting each step. After each turn, a small fast model checks whether the condition holds."
- `clm_3072c56e3d0e` — "A turn that fails on an error which will not clear until you fix it ends the active goal, with a warning naming the cause and telling you to run /goal again once it is fixed." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "If a turn fails on an error that won't clear until you fix it, Claude Code clears the goal and prints a warning naming the cause."
- `clm_a9f8de81c140` — "Only one goal can be active per Claude Code session, and the same /goal command sets, checks, and clears it depending on the argument given." · p 0.93 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "One goal can be active per session. The same command sets, checks, and clears it depending on the argument."
- `clm_1b37e536a50d` — "/goal rides on the hooks system, so it follows the same workspace-trust rule as hooks in settings files and is unavailable wherever disableAllHooks or allowManagedHooksOnly is in force." · p 0.88 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "Claude Code makes `/goal` available under the same [workspace trust rule as hooks in settings files](/docs/en/permissions#what-runs-before-you-trust-a-folder), because the evaluator is part of the hooks system."

## Timeline

- 2026-08-23 new_claim `clm_62d0421c8691` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_ddd5deba5af8` (src_5229aa475d30)
- 2026-08-23 support_update `clm_62d0421c8691` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_cf409a883dc9` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_a9f8de81c140` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_3072c56e3d0e` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_1b37e536a50d` (src_5229aa475d30)

## Related

- → part_of [[claude-code]] (0.93)
- → uses [[completion-condition]] (0.93)
- → uses [[goal-evaluator]] (0.93)
- → depends_on [[hooks]] (0.92)
- [[claude-code]] — 3 shared claims
- [[completion-condition]] — 2 shared claims
- [[goal-evaluator]] — 2 shared claims
- [[agent-loops]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
- small fast model (no page yet)
