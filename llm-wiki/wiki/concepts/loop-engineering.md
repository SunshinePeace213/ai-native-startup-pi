---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_loop_engineering]
claim_ids: [clm_c29788ac7b83, clm_a456b4d4f8ae, clm_dccaa0e30cd9, clm_03066b8b3f8d, clm_ef8112621454, clm_74d513c47cec, clm_23587a9fe68d, clm_688607202e97]
confidence: 0.80
stale_after: 2026-11-09
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# loop engineering

> **In here:** The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete · 8 claims, confidence 0.80.

## Current understanding

- The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete (0.81)
- The first three loops automate work; the fourth, the hill climbing loop, automates improvement (0.81)
- Loop engineering treats an agent as a stack of loops: the model calling tools until it is done is the most fundamental loop but far from the only loop that powers agents (0.81)
- The verification loop wraps the agent loop with a grader that checks output against a rubric and sends the result back with feedback when it falls short (0.81)
- The event-driven loop connects an agent to its ecosystem so that a document landing, a schedule, or a webhook fires the run, making the agent a component running continuously inside a larger system rather than something invoked manually (0.81)
- The hill climbing loop runs an analysis agent over production traces and uses the findings to rewrite the harness configuration, including prompt, tool, and grader tweaks (0.81)
- Every loop level has natural points where human oversight adds value: an automated grader can check whether links resolve, but it takes a human to notice the framing is wrong for the audience (0.80)
- LangChain argues focus should pivot from the agent and verification loops to the event-driven and hill climbing loops, where value compounds by embedding continuously improving agents into an ecosystem (0.77)

## Evidence

- `clm_c29788ac7b83` — "The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "At its core, an agent is just a model calling tools in a loop until a task is complete."
- `clm_a456b4d4f8ae` — "The first three loops automate work; the fourth, the hill climbing loop, automates improvement." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The first three loops automate work. The fourth (and arguably most important) automates improvement!"
- `clm_dccaa0e30cd9` — "Loop engineering treats an agent as a stack of loops: the model calling tools until it is done is the most fundamental loop but far from the only loop that powers agents." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The core agent algorithm is simple: give the LLM context and let it call tools in a loop until it's done. This is the most fundamental loop. But it's far from the only loop that powers agents."
- `clm_03066b8b3f8d` — "The verification loop wraps the agent loop with a grader that checks output against a rubric and sends the result back with feedback when it falls short." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The verification loop adds a grader: something that checks the agent's output against a rubric and, if it fails, sends the result back with feedback."
- `clm_ef8112621454` — "The event-driven loop connects an agent to its ecosystem so that a document landing, a schedule, or a webhook fires the run, making the agent a component running continuously inside a larger system rather than something invoked manually." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The event-driven loop connects your agent to your ecosystem. An event fires — a new document lands, a schedule triggers, a webhook arrives — and the agent runs. The agent isn't something you invoke manually;"
- `clm_74d513c47cec` — "The hill climbing loop runs an analysis agent over production traces and uses the findings to rewrite the harness configuration, including prompt, tool, and grader tweaks." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The hill climbing loop runs an analysis agent over those traces and uses the findings to rewrite the harness with improved configuration. That can include prompt/tool tweaks or grader tweaks."
- `clm_23587a9fe68d` — "Every loop level has natural points where human oversight adds value: an automated grader can check whether links resolve, but it takes a human to notice the framing is wrong for the audience." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "Automation doesn't mean removing humans from the loop. At every level, there are natural points where human oversight adds value. An automated grader can check whether links resolve;"
- `clm_688607202e97` — "LangChain argues focus should pivot from the agent and verification loops to the event-driven and hill climbing loops, where value compounds by embedding continuously improving agents into an ecosystem." · p 0.77 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "We've been thinking about loops 1 and 2 for a while. But focus should pivot to loops 3 and 4 where value compounds by embedding agents into your ecosystem that continuously improve in response to your criteria."

## Timeline

- 2026-08-23 new_claim `clm_dccaa0e30cd9` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_c29788ac7b83` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_03066b8b3f8d` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_ef8112621454` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_74d513c47cec` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_a456b4d4f8ae` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_23587a9fe68d` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_688607202e97` (src_5b435bf5e144)

## Related

- ← part_of [[agent-loops]] (0.81)
- ← part_of [[event-driven-loop]] (0.81)
- ← part_of [[hill-climbing-loop]] (0.81)
- ← part_of [[verification-loop]] (0.81)
- ← applies_to [[human-in-the-loop]] (0.80)
- ← owns [[langchain]] (0.79)
- [[agent-loops]] — 4 shared claims
- [[hill-climbing-loop]] — 3 shared claims
- [[event-driven-loop]] — 2 shared claims
- [[verification-loop]] — 2 shared claims
- [[agent-harness]] — 1 shared claim
- [[agent-trace]] — 1 shared claim
- [[human-in-the-loop]] — 1 shared claim
- [[langchain]] — 1 shared claim
- [[tool-use]] — 1 shared claim
