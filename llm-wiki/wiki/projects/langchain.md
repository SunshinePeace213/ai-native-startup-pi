---
type: project
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_langchain]
claim_ids: [clm_7b6ad949a0a3, clm_688607202e97]
confidence: 0.78
stale_after: 2026-10-29
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# LangChain

> **In here:** LangChain — 2 claims, confidence 0.78, 2 sources.

## Current understanding

- LangChain's create_agent is purposefully minimalistic: it implements only the core agent loop and exposes middleware as the primitive for customization (0.78)
- LangChain argues focus should pivot from the agent and verification loops to the event-driven and hill climbing loops, where value compounds by embedding continuously improving agents into an ecosystem (0.77)

## Evidence

- `clm_7b6ad949a0a3` — "LangChain's create_agent is purposefully minimalistic: it implements only the core agent loop and exposes middleware as the primitive for customization." · p 0.78 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "`create_agent` just implements the core agent loop, and it exposes **middleware** as a primitive for customization."
- `clm_688607202e97` — "LangChain argues focus should pivot from the agent and verification loops to the event-driven and hill climbing loops, where value compounds by embedding continuously improving agents into an ecosystem." · p 0.77 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "We've been thinking about loops 1 and 2 for a while. But focus should pivot to loops 3 and 4 where value compounds by embedding agents into your ecosystem that continuously improve in response to your criteria."

## Timeline

- 2026-08-23 new_claim `clm_688607202e97` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_7b6ad949a0a3` (src_f7dcee3b42fc)

## Related

- ← part_of create_agent (no page yet) (0.80)
- → owns [[loop-engineering]] (0.79)
- [[agent-loops]] — 1 shared claim
- [[event-driven-loop]] — 1 shared claim
- [[hill-climbing-loop]] — 1 shared claim
- [[loop-engineering]] — 1 shared claim
- [[middleware]] — 1 shared claim
- create_agent (no page yet)
