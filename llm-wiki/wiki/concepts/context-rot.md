---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_context_rot]
claim_ids: [clm_5d4b33c3295a, clm_c9201456d93b, clm_5758915e185b]
confidence: 0.77
stale_after: 2026-10-08
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# context rot

> **In here:** Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context · 3 claims, confidence 0.77.

## Current understanding

- Long-running sessions accumulate message history fast and overflow the context window without intervention, which summarization and context-editing middleware exist to prevent (0.80)
- Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context (0.78)
- Tool call offloading keeps only the head and tail tokens of a tool output above a threshold in context and offloads the full output to the filesystem (0.75)

## Evidence

- `clm_5d4b33c3295a` — "Long-running sessions accumulate message history fast and overflow the context window without intervention, which summarization and context-editing middleware exist to prevent." · p 0.80 · active · 1 support · 0 contradict · when: in long-running sessions
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Prevent context overflow | Long-running sessions accumulate message history fast. Without intervention, it overflows the context window. | SummarizationMiddleware, ContextEditingMiddleware |"
- `clm_c9201456d93b` — "Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context." · p 0.78 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "Context Rot describes how models become worse at reasoning and completing tasks as their context window fills up. Context is a precious and scarce resource, so harnesses need strategies to manage it."
- `clm_5758915e185b` — "Tool call offloading keeps only the head and tail tokens of a tool output above a threshold in context and offloads the full output to the filesystem." · p 0.75 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**Tool call offloading** reduces the impact of large tool outputs that clutter context without providing useful information."

## Timeline

- 2026-08-23 new_claim `clm_c9201456d93b` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_5758915e185b` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_5d4b33c3295a` (src_f7dcee3b42fc)

## Related

- → applies_to [[context-window]] (0.78)
- [[agent-harness]] — 2 shared claims
- [[context-window]] — 2 shared claims
- [[filesystem]] — 1 shared claim
- [[middleware]] — 1 shared claim
