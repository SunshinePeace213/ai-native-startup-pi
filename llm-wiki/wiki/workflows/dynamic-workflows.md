---
type: workflow
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-harness-for-every-task-dynamic-workflows-in-claude-code.md, title: "A harness for every task: dynamic workflows in Claude Code", id: src_7415e8608f3c}
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/docs/claude-code/workflows.md, title: "Orchestrate subagents at scale with dynamic workflows", id: src_d6586d5c5c4f}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_dynamic_workflows]
claim_ids: [clm_1691eac7dbb3, clm_7da30002a7c7, clm_7ed354e5255b, clm_0097cfd2b5f8, clm_edfd83ab9d0b, clm_7c3de0c5639e, clm_e5ff207092fb, clm_f395b23fc4e7, clm_5379e62f099f, clm_e3e1d00b42dd, clm_73ef785dc390, clm_8e1ec1b60062, clm_d621eeb9b8ff, clm_7aa000c22eba, clm_9b8d653ab3e6, clm_174fcd481dc7]
confidence: 0.90
stale_after: 2027-01-17
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# dynamic workflows

> **In here:** A static workflow written with the Agent SDK has to work for all edge cases and so ends up generic, whereas a dynamic workflow is a custom harness Claude writes tailor-made for the task at hand · 16 claims, confidence 0.90.

## Current understanding

- A dynamic workflow executes a JavaScript file with a few special functions that spawn and coordinate subagents, and it can pick which model each agent uses and whether an agent runs in its own worktree, so Claude chooses the intelligence level and isolation the step needs (0.99)
- Dynamic workflows often use significantly more tokens and are best suited to complex, high-value tasks: the question to ask of a regular coding task is whether it really needs more compute, since most traditional coding tasks do not need a panel of five reviewers (0.98)
- Six orchestration patterns compose into most workflows — classify-and-act, fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament, and loop-until-done — with loop-until-done the answer whenever the amount of work is unknown (0.98)
- Resuming a stopped dynamic workflow replays in the order the agents started: cached results stop at the first agent that did not finish, and every agent that started after it runs again even if it had completed (0.93)
- A dynamic workflow can only be resumed within the same Claude Code session; exiting Claude Code while a workflow is running means the next session starts it fresh (0.93)
- The subagents a dynamic workflow spawns always run in acceptEdits mode with file edits auto-approved and inherit the user's tool allowlist, whatever permission mode the session itself is in (0.93)
- A dynamic workflow script holds the loop, the branching, and the intermediate results itself so Claude's context holds only the final answer, whereas with subagents, skills, and agent teams Claude orchestrates turn by turn and every result lands in a context window (0.93)
- A dynamic workflow script accepts no mid-run user input, has no direct filesystem or shell access, and fails before the run starts if it contains import() — the agents it coordinates are what read, write, and run commands (0.93)
- A dynamic workflow's script body is plain JavaScript with top-level await in which agent() spawns one subagent and pipeline() runs one agent per item in a list (0.91)
- The workflow runtime runs up to 16 agents concurrently — fewer when Claude Code has fewer CPUs available — and allows at most 1,000 agents in total per run (0.91)
- Sorting a long list in one prompt degrades in quality and will not fit in context, so the workflow answer is a tournament, a pipeline of pairwise-comparison agents, or parallel bucket-ranking then a merge — comparative judgment being more reliable than absolute scoring (0.83)
- A static workflow written with the Agent SDK has to work for all edge cases and so ends up generic, whereas a dynamic workflow is a custom harness Claude writes tailor-made for the task at hand (0.83)
- The quarantine pattern for triage workflows bars the agents that read untrusted public content from taking high-privilege actions, leaving those actions to separate agents in charge of acting on the information (0.83)
- The longer Claude works on a complex task inside a single context window the more it becomes susceptible to three specific failure modes — agentic laziness, self-preferential bias, and goal drift — and a workflow combats them by orchestrating separate subagents with their own context windows and isolated goals (0.83)
- Debugging in one context window runs into self-preferential bias, and a workflow prevents it structurally by spinning up agents that generate hypotheses from disjoint evidence — separate agents for logs, files, and data — each hypothesis then facing a panel of verifiers and refuters (0.83)
- Token usage inside a loop is managed by matching primitives and models to the task's actual complexity, piloting a dynamic workflow at small scale before running it broadly, and using scripts for deterministic steps rather than having the model reason through them each time (0.78)

## Evidence

- `clm_1691eac7dbb3` — "A dynamic workflow executes a JavaScript file with a few special functions that spawn and coordinate subagents, and it can pick which model each agent uses and whether an agent runs in its own worktree, so Claude chooses the intelligence level and isolation the step needs" · p 0.99 · active · 2 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "It's particularly useful to know that dynamic workflows can decide which models an agent uses and whether subagents are run in their own worktree, allowing Claude to choose the intelligence level and isolation needed."
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A dynamic workflow is a JavaScript script that orchestrates [subagents](/docs/en/sub-agents) at scale. Claude writes the script for the task you describe, and a runtime executes it in the background while your session stays responsive."
- `clm_7da30002a7c7` — "Dynamic workflows often use significantly more tokens and are best suited to complex, high-value tasks: the question to ask of a regular coding task is whether it really needs more compute, since most traditional coding tasks do not need a panel of five reviewers" · p 0.98 · active · 2 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "For example, most traditional coding tasks do not need a panel of 5 reviewers."
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow spawns many agents, so a single run can use meaningfully more tokens than working through the same task in conversation. Runs count toward your plan's usage and rate limits like any other session."
- `clm_7ed354e5255b` — "Six orchestration patterns compose into most workflows — classify-and-act, fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament, and loop-until-done — with loop-until-done the answer whenever the amount of work is unknown" · p 0.98 · active · 2 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "For tasks with an unknown amount of work, loop spawning agents until a stop condition is met (no new findings, or no more errors in the logs) instead of a fixed number of passes."
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow fits best when the task is larger than one agent can hold in context, or when the same step needs to run across many items. The prompts below show common shapes. Each one asks Claude to write and run a workflow for that task;"
- `clm_0097cfd2b5f8` — "Resuming a stopped dynamic workflow replays in the order the agents started: cached results stop at the first agent that did not finish, and every agent that started after it runs again even if it had completed." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "* An agent that was still running when you stopped isn't saved, so it starts over on resume. * Replay follows the order agents started."
- `clm_edfd83ab9d0b` — "A dynamic workflow can only be resumed within the same Claude Code session; exiting Claude Code while a workflow is running means the next session starts it fresh." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "Resume works within the same Claude Code session. If you exit Claude Code while a workflow is running, the next session starts the workflow fresh."
- `clm_7c3de0c5639e` — "The subagents a dynamic workflow spawns always run in acceptEdits mode with file edits auto-approved and inherit the user's tool allowlist, whatever permission mode the session itself is in." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "Your permission mode controls only the launch prompt above."
- `clm_e5ff207092fb` — "A dynamic workflow script holds the loop, the branching, and the intermediate results itself so Claude's context holds only the final answer, whereas with subagents, skills, and agent teams Claude orchestrates turn by turn and every result lands in a context window." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow moves the plan into code. With subagents, skills, and agent teams, Claude is the orchestrator: it decides turn by turn what to spawn or assign next, and every result lands in a context window."
- `clm_f395b23fc4e7` — "A dynamic workflow script accepts no mid-run user input, has no direct filesystem or shell access, and fails before the run starts if it contains import() — the agents it coordinates are what read, write, and run commands." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "| No mid-run user input | Only agent permission prompts can pause a run."
- `clm_5379e62f099f` — "A dynamic workflow's script body is plain JavaScript with top-level await in which agent() spawns one subagent and pipeline() runs one agent per item in a list." · p 0.91 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "The body is plain JavaScript with top-level `await`. `agent()` spawns one subagent and `pipeline()` runs one per item in a list."
- `clm_e3e1d00b42dd` — "The workflow runtime runs up to 16 agents concurrently — fewer when Claude Code has fewer CPUs available — and allows at most 1,000 agents in total per run." · p 0.91 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "| Up to 16 concurrent agents, fewer when Claude Code has fewer CPUs available, including inside a CPU-limited container | Bounds local resource use | | In a fan-out, agents that share the first agent's prompt-cache prefix start up to 5…"
- `clm_73ef785dc390` — "Sorting a long list in one prompt degrades in quality and will not fit in context, so the workflow answer is a tournament, a pipeline of pairwise-comparison agents, or parallel bucket-ranking then a merge — comparative judgment being more reliable than absolute scoring" · p 0.83 · active · 1 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "Instead run a tournament, a pipeline of pairwise-comparison agents (comparative judgment is more reliable than absolute scoring), or bucket-rank in parallel then merge."
- `clm_8e1ec1b60062` — "A static workflow written with the Agent SDK has to work for all edge cases and so ends up generic, whereas a dynamic workflow is a custom harness Claude writes tailor-made for the task at hand" · p 0.83 · active · 1 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "But because static workflows need to work for all edge cases, they are usually more generic."
- `clm_d621eeb9b8ff` — "The quarantine pattern for triage workflows bars the agents that read untrusted public content from taking high-privilege actions, leaving those actions to separate agents in charge of acting on the information" · p 0.83 · active · 1 support · 0 contradict · when: for triage workflows over untrusted content
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "This involves barring the agents that read untrusted public content from taking high-privilege actions, which are instead done by the agents in charge of acting on the information."
- `clm_7aa000c22eba` — "The longer Claude works on a complex task inside a single context window the more it becomes susceptible to three specific failure modes — agentic laziness, self-preferential bias, and goal drift — and a workflow combats them by orchestrating separate subagents with their own context windows and isolated goals" · p 0.83 · active · 1 support · 0 contradict · when: over long-running, massively parallel, highly structured or adversarial tasks
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "This is because the longer Claude works on a complex task in a single context window, the more it becomes susceptible to a few specific failure modes:"
- `clm_9b8d653ab3e6` — "Debugging in one context window runs into self-preferential bias, and a workflow prevents it structurally by spinning up agents that generate hypotheses from disjoint evidence — separate agents for logs, files, and data — each hypothesis then facing a panel of verifiers and refuters" · p 0.83 · active · 1 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "A workflow can structurally prevent this by spinning up agents to generate hypotheses from disjoint evidence."
- `clm_174fcd481dc7` — "Token usage inside a loop is managed by matching primitives and models to the task's actual complexity, piloting a dynamic workflow at small scale before running it broadly, and using scripts for deterministic steps rather than having the model reason through them each time" · p 0.78 · active · 1 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Pilot a dynamic workflow at small scale before running it broadly. - Use scripts for deterministic steps instead of having the model reason through them each time."

## Timeline

- 2026-08-23 new_claim `clm_7aa000c22eba` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_1691eac7dbb3` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_8e1ec1b60062` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_7ed354e5255b` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_73ef785dc390` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_d621eeb9b8ff` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_7da30002a7c7` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_9b8d653ab3e6` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_174fcd481dc7` (src_d0a8a3247101)
- 2026-08-23 support_update `clm_1691eac7dbb3` (src_d6586d5c5c4f)
- 2026-08-23 support_update `clm_7da30002a7c7` (src_d6586d5c5c4f)
- 2026-08-23 support_update `clm_7ed354e5255b` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_e5ff207092fb` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_5379e62f099f` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_f395b23fc4e7` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_e3e1d00b42dd` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_0097cfd2b5f8` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_edfd83ab9d0b` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_7c3de0c5639e` (src_d6586d5c5c4f)

## Related

- → uses [[subagents]] (1.00)
- → uses [[adversarial-verification]] (0.96)
- ← applies_to [[workflow-runtime]] (0.93)
- → related_to [[subagents]] (0.93)
- → applies_to [[context-window]] (0.83)
- ← uses [[agent-loops]] (0.78)
- [[subagents]] — 6 shared claims
- [[claude-code]] — 3 shared claims
- [[context-window]] — 3 shared claims
- [[workflow-runtime]] — 3 shared claims
- [[adversarial-verification]] — 2 shared claims
- [[agent-loops]] — 1 shared claim
- [[permission-mode]] — 1 shared claim
