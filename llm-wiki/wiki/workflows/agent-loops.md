---
type: workflow
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md, title: "The AI-Native SDLC playbook", id: src_c65435745c66}
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
  - {resource: llm-wiki/raw/docs/claude-code/goal.md, title: "Keep Claude working toward a goal", id: src_5229aa475d30}
  - {resource: llm-wiki/raw/docs/claude-code/hooks.md, title: "Hooks reference", id: src_af0a3c9de51d}
  - {resource: llm-wiki/raw/docs/claude-code/scheduled-tasks.md, title: "Run prompts on a schedule", id: src_1aeabecafdc5}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_agent_loops]
claim_ids: [clm_6282902285c5, clm_1b9bffef36d2, clm_59b11e9c72c2, clm_62d0421c8691, clm_e888d6f6645f, clm_3a7e3a8fb83b, clm_8a554e6f410e, clm_82f6244bbaa4, clm_c29788ac7b83, clm_dccaa0e30cd9, clm_03066b8b3f8d, clm_ef8112621454, clm_dcd107fbb284, clm_45559da3e34a, clm_b5487cbd1bcd, clm_ff0824c7a20d, clm_174fcd481dc7, clm_7b6ad949a0a3]
confidence: 0.86
stale_after: 2026-10-29
last_rendered: 2026-09-17T23:03:12Z
review_required: false
---

# agent loops

> **In here:** The hill climbing loop's return path does not merely restart the run: it reaches inside and updates the agent loop directly, so each outer cycle makes the inner loops more effective · 18 claims, confidence 0.86.

## Current understanding

- Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not (1.00)
- A loop's polling or run interval should be matched to how often the underlying thing actually changes, alongside explicit success and stop criteria defined up front (0.98)
- A time-based loop has two surfaces: /loop runs the prompt repeatedly at intervals locally, while /schedule moves the same recurring routine to cloud infrastructure so it no longer depends on a local session staying open (0.98)
- A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count (0.98)
- Hook events fall into three cadences: once per session (SessionStart, SessionEnd), once per turn (UserPromptSubmit, Stop, StopFailure), and once per tool call inside the agentic loop (PreToolUse, PostToolUse) (0.93)
- Three criteria decide when a loop stops being sufficient and a graph becomes necessary — session persistence, cross-agent coordination, and traceability — and loops handle the first poorly because state is flushed with the context window, the second not at all because a loop is one agent, and the third weakly because conversation history is the only record (0.90)
- The patterns are not isolated recipes but stages in the externalization of cognition: a loop externalizes revision, a chain externalizes task order, a network externalizes role specialization, and a graph externalizes shared state and relationships (0.90)
- In the closed maintenance loop detection stays entirely deterministic with no model involved — Claude is invoked only once a control band is breached, and the tier sets what it may do: log at one sigma, read-only diagnosis at two, and action confined to a PR or a pre-approved runbook at three (0.83)
- The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete (0.81)
- Loop engineering treats an agent as a stack of loops: the model calling tools until it is done is the most fundamental loop but far from the only loop that powers agents (0.80)
- The verification loop wraps the agent loop with a grader that checks output against a rubric and sends the result back with feedback when it falls short (0.80)
- The event-driven loop connects an agent to its ecosystem so that a document landing, a schedule, or a webhook fires the run, making the agent a component running continuously inside a larger system rather than something invoked manually (0.80)
- Middleware hooks into the agent loop before and after model calls, before and after tool calls, and at agent startup and teardown, with each piece handling one concern and composing freely with any other (0.80)
- The hill climbing loop's return path does not merely restart the run: it reaches inside and updates the agent loop directly, so each outer cycle makes the inner loops more effective (0.80)
- Expertise that can be codified belongs in the prompt or tools, but sensitive actions such as financial transactions and database operations need live human review (0.80)
- Agent loops sort along three axes — what triggers them, what stops them, and what tasks they suit — into four types: turn-based, goal-based, time-based, and proactive (0.78)
- Token usage inside a loop is managed by matching primitives and models to the task's actual complexity, piloting a dynamic workflow at small scale before running it broadly, and using scripts for deterministic steps rather than having the model reason through them each time (0.78)
- LangChain's create_agent is purposefully minimalistic: it implements only the core agent loop and exposes middleware as the primitive for customization (0.76)

## Evidence

- `clm_6282902285c5` — "Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not" · p 1.00 · active · 3 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Use a second agent for code review to reduce the bias of an agent reviewing its own output."
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Claude self-review: unchanged at 91.4%"
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin does not ask the same Claude instance that wrote the code to grade itself. The per-edit check is a deterministic string match with no model involved."
- `clm_1b9bffef36d2` — "A loop's polling or run interval should be matched to how often the underlying thing actually changes, alongside explicit success and stop criteria defined up front" · p 0.98 · active · 2 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Match a loop's polling/run interval to how often the underlying thing actually changes."
  - `src_1aeabecafdc5` Run prompts on a schedule: "When you omit the interval, Claude chooses one dynamically instead of running on a fixed cron schedule."
- `clm_59b11e9c72c2` — "A time-based loop has two surfaces: /loop runs the prompt repeatedly at intervals locally, while /schedule moves the same recurring routine to cloud infrastructure so it no longer depends on a local session staying open" · p 0.98 · active · 2 support · 0 contradict · when: for time-based loops
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "`/loop` runs the prompt repeatedly at intervals locally; `/schedule` moves the same kind of recurring routine to cloud infrastructure so it doesn't depend on a local session staying open."
  - `src_1aeabecafdc5` Run prompts on a schedule: "For scheduling that survives independently of any session, use [Routines](/docs/en/routines) to create a routine on the cloud, set up a [Desktop scheduled task](/docs/en/desktop-scheduled-tasks), or use [GitHub…"
- `clm_62d0421c8691` — "A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count" · p 0.98 · active · 2 support · 0 contradict · when: for goal-based loops
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "an evaluator model checks after each iteration whether the success criteria have been met, rather than Claude trying to judge its own completion"
  - `src_5229aa475d30` Keep Claude working toward a goal: "Each time Claude finishes a turn, Claude Code sends the condition and the conversation so far to your configured [small fast model](/docs/en/model-config), which defaults to Haiku on the Claude API;"
- `clm_e888d6f6645f` — "Hook events fall into three cadences: once per session (SessionStart, SessionEnd), once per turn (UserPromptSubmit, Stop, StopFailure), and once per tool call inside the agentic loop (PreToolUse, PostToolUse)." · p 0.93 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Events fall into three cadences: * once per session: `SessionStart` and `SessionEnd` * once per turn: `UserPromptSubmit`, `Stop`, and `StopFailure` * on every tool call inside the agentic loop: `PreToolUse` and `PostToolUse`, except…"
- `clm_3a7e3a8fb83b` — "Three criteria decide when a loop stops being sufficient and a graph becomes necessary — session persistence, cross-agent coordination, and traceability — and loops handle the first poorly because state is flushed with the context window, the second not at all because a loop is one agent, and the third weakly because conversation history is the only record" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "First, **session persistence**: if the work spans multiple sessions and transcript replay is no longer practical, state needs to live outside the context window — the graph."
- `clm_8a554e6f410e` — "The patterns are not isolated recipes but stages in the externalization of cognition: a loop externalizes revision, a chain externalizes task order, a network externalizes role specialization, and a graph externalizes shared state and relationships" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "They are stages in the externalization of cognition. A loop externalizes revision. A chain externalizes task order. A network externalizes role specialization. A graph externalizes shared state and relationships."
- `clm_82f6244bbaa4` — "In the closed maintenance loop detection stays entirely deterministic with no model involved — Claude is invoked only once a control band is breached, and the tier sets what it may do: log at one sigma, read-only diagnosis at two, and action confined to a PR or a pre-approved runbook at three" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "Detection stays deterministic. Claude is invoked once a band is breached, and the tier sets what it may do."
- `clm_c29788ac7b83` — "The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "At its core, an agent is just a model calling tools in a loop until a task is complete."
- `clm_dccaa0e30cd9` — "Loop engineering treats an agent as a stack of loops: the model calling tools until it is done is the most fundamental loop but far from the only loop that powers agents." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The core agent algorithm is simple: give the LLM context and let it call tools in a loop until it's done. This is the most fundamental loop. But it's far from the only loop that powers agents."
- `clm_03066b8b3f8d` — "The verification loop wraps the agent loop with a grader that checks output against a rubric and sends the result back with feedback when it falls short." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The verification loop adds a grader: something that checks the agent's output against a rubric and, if it fails, sends the result back with feedback."
- `clm_ef8112621454` — "The event-driven loop connects an agent to its ecosystem so that a document landing, a schedule, or a webhook fires the run, making the agent a component running continuously inside a larger system rather than something invoked manually." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The event-driven loop connects your agent to your ecosystem. An event fires — a new document lands, a schedule triggers, a webhook arrives — and the agent runs. The agent isn't something you invoke manually;"
- `clm_dcd107fbb284` — "Middleware hooks into the agent loop before and after model calls, before and after tool calls, and at agent startup and teardown, with each piece handling one concern and composing freely with any other." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "Middleware hooks into the agent loop at each step: before and after model calls, before and after tool calls, at agent startup and teardown. Each piece handles one concern and composes freely with any other"
- `clm_45559da3e34a` — "The hill climbing loop's return path does not merely restart the run: it reaches inside and updates the agent loop directly, so each outer cycle makes the inner loops more effective." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The key move here is that the return arrow doesn't just loop back to the top — it reaches inside and updates the agent loop directly. Each cycle of the outer loop makes the inner loops more effective."
- `clm_b5487cbd1bcd` — "Expertise that can be codified belongs in the prompt or tools, but sensitive actions such as financial transactions and database operations need live human review." · p 0.80 · active · 1 support · 0 contradict · when: for sensitive actions
  - `src_5b435bf5e144` the-art-of-loop-engineering: "Some expertise should be codified in the prompt/tools themselves, but for sensitive actions, live human review is essential (think financial transactions, DB operations, etc)."
- `clm_ff0824c7a20d` — "Agent loops sort along three axes — what triggers them, what stops them, and what tasks they suit — into four types: turn-based, goal-based, time-based, and proactive" · p 0.78 · active · 1 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "The article categorizes loops along three axes: what triggers them, what stops them, and what kinds of tasks they suit. It walks through four loop types — turn-based, goal-based, time-based, and proactive"
- `clm_174fcd481dc7` — "Token usage inside a loop is managed by matching primitives and models to the task's actual complexity, piloting a dynamic workflow at small scale before running it broadly, and using scripts for deterministic steps rather than having the model reason through them each time" · p 0.78 · active · 1 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Pilot a dynamic workflow at small scale before running it broadly. - Use scripts for deterministic steps instead of having the model reason through them each time."
- `clm_7b6ad949a0a3` — "LangChain's create_agent is purposefully minimalistic: it implements only the core agent loop and exposes middleware as the primitive for customization." · p 0.76 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "`create_agent` just implements the core agent loop, and it exposes **middleware** as a primitive for customization."

## Timeline

- 2026-08-23 new_claim `clm_ff0824c7a20d` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_62d0421c8691` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_6282902285c5` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_1b9bffef36d2` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_59b11e9c72c2` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_174fcd481dc7` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_82f6244bbaa4` (src_c65435745c66)
- 2026-08-23 new_claim `clm_8a554e6f410e` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_3a7e3a8fb83b` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_dccaa0e30cd9` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_c29788ac7b83` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_03066b8b3f8d` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_ef8112621454` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_45559da3e34a` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_b5487cbd1bcd` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_7b6ad949a0a3` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_dcd107fbb284` (src_f7dcee3b42fc)
- 2026-08-23 support_update `clm_62d0421c8691` (src_5229aa475d30)
- 2026-08-23 support_update `clm_1b9bffef36d2` (src_1aeabecafdc5)
- 2026-08-23 support_update `clm_59b11e9c72c2` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_e888d6f6645f` (src_af0a3c9de51d)
- 2026-08-28 support_update `clm_6282902285c5` (src_521f898b9896)
- 2026-08-30 support_update `clm_6282902285c5` (src_99ad4fe8f1dd)

## Related

- ← extends [[graph-architecture]] (0.99)
- → depends_on [[context-window]] (0.90)
- → part_of [[agentic-workflow]] (0.90)
- ← uses [[ai-native-sdlc]] (0.83)
- → uses [[tool-use]] (0.81)
- ← extends [[event-driven-loop]] (0.81)
- ← extends [[verification-loop]] (0.81)
- → part_of [[loop-engineering]] (0.81)
- ← extends [[middleware]] (0.80)
- ← produces create_agent (no page yet) (0.80)
- ← applies_to [[hill-climbing-loop]] (0.80)
- ← applies_to [[human-in-the-loop]] (0.80)
- … 3 more edges — `graph.py neighbors ent_agent_loops`
- [[loop-engineering]] — 4 shared claims
- [[claude-code]] — 2 shared claims
- [[graph-architecture]] — 2 shared claims
- [[hooks]] — 2 shared claims
- [[loop-command]] — 2 shared claims
- [[middleware]] — 2 shared claims
- [[verification-loop]] — 2 shared claims
- [[agentic-workflow]] — 1 shared claim
- [[ai-native-sdlc]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[cross-model-review]] — 1 shared claim
- [[dynamic-workflows]] — 1 shared claim
- [[event-driven-loop]] — 1 shared claim
- [[goal-command]] — 1 shared claim
- [[goal-evaluator]] — 1 shared claim
- [[hill-climbing-loop]] — 1 shared claim
- [[human-in-the-loop]] — 1 shared claim
- [[langchain]] — 1 shared claim
- [[llm-as-judge]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
- [[tool-use]] — 1 shared claim
- create_agent (no page yet)
- desktop scheduled tasks (no page yet)
- routines (no page yet)
- small fast model (no page yet)
