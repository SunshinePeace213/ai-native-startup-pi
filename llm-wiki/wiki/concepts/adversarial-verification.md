---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-harness-for-every-task-dynamic-workflows-in-claude-code.md, title: "A harness for every task: dynamic workflows in Claude Code", id: src_7415e8608f3c}
  - {resource: llm-wiki/raw/articles/anthropic/ai-code-migration.md, title: "How Anthropic runs large-scale code migrations with Claude Code", id: src_40c83dc51471}
  - {resource: llm-wiki/raw/docs/claude-code/workflows.md, title: "Orchestrate subagents at scale with dynamic workflows", id: src_d6586d5c5c4f}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_adversarial_verification]
claim_ids: [clm_7ed354e5255b, clm_9b8d653ab3e6, clm_01ab6a8be656]
confidence: 0.87
stale_after: 2027-11-22
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# adversarial verification

> **In here:** adversarial verification — 3 claims, confidence 0.87, 3 sources.

## Current understanding

- Six orchestration patterns compose into most workflows — classify-and-act, fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament, and loop-until-done — with loop-until-done the answer whenever the amount of work is unknown (0.98)
- Debugging in one context window runs into self-preferential bias, and a workflow prevents it structurally by spinning up agents that generate hypotheses from disjoint evidence — separate agents for logs, files, and data — each hypothesis then facing a panel of verifiers and refuters (0.83)
- A migration's prerequisite is a strong judge able to evaluate original and target code on equal terms: portable tests rewritten into assertions runnable against both codebases, adversarial agents checking that the rewrites did not weaken the assertions, and the judge itself validated against both correct and deliberately broken code (0.79)

## Evidence

- `clm_7ed354e5255b` — "Six orchestration patterns compose into most workflows — classify-and-act, fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament, and loop-until-done — with loop-until-done the answer whenever the amount of work is unknown" · p 0.98 · active · 2 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "For tasks with an unknown amount of work, loop spawning agents until a stop condition is met (no new findings, or no more errors in the logs) instead of a fixed number of passes."
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow fits best when the task is larger than one agent can hold in context, or when the same step needs to run across many items. The prompts below show common shapes. Each one asks Claude to write and run a workflow for that task;"
- `clm_9b8d653ab3e6` — "Debugging in one context window runs into self-preferential bias, and a workflow prevents it structurally by spinning up agents that generate hypotheses from disjoint evidence — separate agents for logs, files, and data — each hypothesis then facing a panel of verifiers and refuters" · p 0.83 · active · 1 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "A workflow can structurally prevent this by spinning up agents to generate hypotheses from disjoint evidence."
- `clm_01ab6a8be656` — "A migration's prerequisite is a strong judge able to evaluate original and target code on equal terms: portable tests rewritten into assertions runnable against both codebases, adversarial agents checking that the rewrites did not weaken the assertions, and the judge itself validated against both correct and deliberately broken code" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "rewriting the portable ones into assertions runnable against both codebases (checked by adversarial agents so rewrites don't weaken assertions); and validating the judge itself against both correct and deliberately broken code"

## Timeline

- 2026-08-23 new_claim `clm_7ed354e5255b` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_9b8d653ab3e6` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_01ab6a8be656` (src_40c83dc51471)
- 2026-08-23 support_update `clm_7ed354e5255b` (src_d6586d5c5c4f)

## Related

- ← uses [[dynamic-workflows]] (0.96)
- ← uses [[code-migration]] (0.79)
- [[dynamic-workflows]] — 2 shared claims
- [[code-migration]] — 1 shared claim
- [[context-window]] — 1 shared claim
