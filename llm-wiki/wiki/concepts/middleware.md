---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_middleware]
claim_ids: [clm_dcd107fbb284, clm_ed006b80a855, clm_4174226402d2, clm_5d4b33c3295a, clm_874d9cfdb703, clm_a62733208672, clm_7b6ad949a0a3, clm_675e7768a524]
confidence: 0.79
stale_after: 2026-10-29
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# middleware

> **In here:** Because each middleware piece is isolated, the same middleware can be reused across every agent in an organization so new agents inherit battle-tested behavior without rebuilding it · 8 claims, confidence 0.79.

## Current understanding

- Middleware hooks into the agent loop before and after model calls, before and after tool calls, and at agent startup and teardown, with each piece handling one concern and composing freely with any other (0.80)
- Policy enforcement such as PII handling, compliance checks, and approval gates must fire on every call regardless of what the model does, so it does not belong in a prompt (0.80)
- Deterministic middleware logic is the right place for anything that cannot or should not live in a prompt: business logic, policy enforcement, swapping the model by task complexity, adjusting the prompt, and updating message history during compaction (0.80)
- Long-running sessions accumulate message history fast and overflow the context window without intervention, which summarization and context-editing middleware exist to prevent (0.80)
- Subagents handle complex sub-tasks with clean context windows while a todo list tracks progress across a long run (0.80)
- Because each middleware piece is isolated, the same middleware can be reused across every agent in an organization so new agents inherit battle-tested behavior without rebuilding it (0.79)
- LangChain's create_agent is purposefully minimalistic: it implements only the core agent loop and exposes middleware as the primitive for customization (0.78)
- Pre-assembled harnesses such as Deep Agents and the Claude Agent SDK reach a production-ready agent fast and work for most cases, but many agents need finer-grained customization than they support, including custom prompting, business logic, and guardrails (0.78)

## Evidence

- `clm_dcd107fbb284` — "Middleware hooks into the agent loop before and after model calls, before and after tool calls, and at agent startup and teardown, with each piece handling one concern and composing freely with any other." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "Middleware hooks into the agent loop at each step: before and after model calls, before and after tool calls, at agent startup and teardown. Each piece handles one concern and composes freely with any other"
- `clm_ed006b80a855` — "Policy enforcement such as PII handling, compliance checks, and approval gates must fire on every call regardless of what the model does, so it does not belong in a prompt." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Enforce policies | PII handling, compliance checks, approval gates — these need to fire on every call regardless of what the model does. They don't belong in a prompt. | PIIMiddleware, HumanInTheLoopMiddleware |"
- `clm_4174226402d2` — "Deterministic middleware logic is the right place for anything that cannot or should not live in a prompt: business logic, policy enforcement, swapping the model by task complexity, adjusting the prompt, and updating message history during compaction." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "**Deterministic Logic.** Business logic, policy enforcement, dynamic agent control — anything that needs to fire at a specific point in the loop."
- `clm_5d4b33c3295a` — "Long-running sessions accumulate message history fast and overflow the context window without intervention, which summarization and context-editing middleware exist to prevent." · p 0.80 · active · 1 support · 0 contradict · when: in long-running sessions
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Prevent context overflow | Long-running sessions accumulate message history fast. Without intervention, it overflows the context window. | SummarizationMiddleware, ContextEditingMiddleware |"
- `clm_874d9cfdb703` — "Subagents handle complex sub-tasks with clean context windows while a todo list tracks progress across a long run." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Delegate tasks | Subagents handle complex sub-tasks with clean context windows. A todo list tracks progress across a long run. | SubAgentMiddleware, AsyncSubAgentMiddleware, TodoListMiddleware |"
- `clm_a62733208672` — "Because each middleware piece is isolated, the same middleware can be reused across every agent in an organization so new agents inherit battle-tested behavior without rebuilding it." · p 0.79 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "Because each piece is isolated, the same middleware can be reused across every agent in an organization so that new agents inherit battle-tested behavior without rebuilding it."
- `clm_7b6ad949a0a3` — "LangChain's create_agent is purposefully minimalistic: it implements only the core agent loop and exposes middleware as the primitive for customization." · p 0.78 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "`create_agent` just implements the core agent loop, and it exposes **middleware** as a primitive for customization."
- `clm_675e7768a524` — "Pre-assembled harnesses such as Deep Agents and the Claude Agent SDK reach a production-ready agent fast and work for most cases, but many agents need finer-grained customization than they support, including custom prompting, business logic, and guardrails." · p 0.78 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "They're designed to get you to a production-ready agent fast, and they work well for most cases. But many agents need finer grained customization than these harnesses support: custom prompting, business logic, guardrails, etc."

## Timeline

- 2026-08-23 new_claim `clm_7b6ad949a0a3` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_dcd107fbb284` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_4174226402d2` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_a62733208672` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_675e7768a524` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_5d4b33c3295a` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_874d9cfdb703` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_ed006b80a855` (src_f7dcee3b42fc)

## Related

- → extends [[agent-loops]] (0.80)
- → related_to [[hooks]] (0.80)
- ← uses create_agent (no page yet) (0.80)
- ← part_of [[human-in-the-loop]] (0.80)
- → applies_to [[context-window]] (0.80)
- → part_of [[agent-harness]] (0.80)
- ← uses [[claude-agent-sdk]] (0.79)
- ← uses Deep Agents (no page yet) (0.79)
- [[agent-harness]] — 2 shared claims
- [[agent-loops]] — 2 shared claims
- [[context-window]] — 2 shared claims
- [[claude-agent-sdk]] — 1 shared claim
- [[context-rot]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[human-in-the-loop]] — 1 shared claim
- [[langchain]] — 1 shared claim
- [[subagents]] — 1 shared claim
- create_agent (no page yet)
- Deep Agents (no page yet)
