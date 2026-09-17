---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/workflows.md, title: "Orchestrate subagents at scale with dynamic workflows", id: src_d6586d5c5c4f}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_workflow_runtime]
claim_ids: [clm_0097cfd2b5f8, clm_f395b23fc4e7, clm_e3e1d00b42dd]
confidence: 0.92
stale_after: 2027-01-17
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# workflow runtime

> **In here:** The workflow runtime runs up to 16 agents concurrently — fewer when Claude Code has fewer CPUs available — and allows at most 1,000 agents in total per run · 3 claims, confidence 0.92.

## Current understanding

- Resuming a stopped dynamic workflow replays in the order the agents started: cached results stop at the first agent that did not finish, and every agent that started after it runs again even if it had completed (0.93)
- A dynamic workflow script accepts no mid-run user input, has no direct filesystem or shell access, and fails before the run starts if it contains import() — the agents it coordinates are what read, write, and run commands (0.93)
- The workflow runtime runs up to 16 agents concurrently — fewer when Claude Code has fewer CPUs available — and allows at most 1,000 agents in total per run (0.90)

## Evidence

- `clm_0097cfd2b5f8` — "Resuming a stopped dynamic workflow replays in the order the agents started: cached results stop at the first agent that did not finish, and every agent that started after it runs again even if it had completed." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "* An agent that was still running when you stopped isn't saved, so it starts over on resume. * Replay follows the order agents started."
- `clm_f395b23fc4e7` — "A dynamic workflow script accepts no mid-run user input, has no direct filesystem or shell access, and fails before the run starts if it contains import() — the agents it coordinates are what read, write, and run commands." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "| No mid-run user input | Only agent permission prompts can pause a run."
- `clm_e3e1d00b42dd` — "The workflow runtime runs up to 16 agents concurrently — fewer when Claude Code has fewer CPUs available — and allows at most 1,000 agents in total per run." · p 0.90 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "| Up to 16 concurrent agents, fewer when Claude Code has fewer CPUs available, including inside a CPU-limited container | Bounds local resource use | | In a fan-out, agents that share the first agent's prompt-cache prefix start up to 5…"

## Timeline

- 2026-08-23 new_claim `clm_f395b23fc4e7` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_e3e1d00b42dd` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_0097cfd2b5f8` (src_d6586d5c5c4f)

## Related

- → applies_to [[dynamic-workflows]] (0.93)
- [[dynamic-workflows]] — 3 shared claims
- [[claude-code]] — 1 shared claim
- [[subagents]] — 1 shared claim
