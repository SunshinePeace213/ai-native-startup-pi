---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md, title: "Demystifying evals for AI agents", id: src_e66d966eb39d}
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_agent_harness]
claim_ids: [clm_8b458dd1f653, clm_2ef013ac2702, clm_fb52a42c5df4, clm_74d513c47cec, clm_64207eb604ea, clm_5cee05d79c41, clm_99954c9a26b6, clm_4174226402d2, clm_c9201456d93b, clm_ea3893719806, clm_57fe4f170ef5, clm_b239352645a0, clm_4ed8d31fca58, clm_fba2df5be733, clm_bc4f7b493418, clm_6cf1f164aa2a, clm_675e7768a524, clm_a8ebbcbbc60d, clm_f517ef4e1778, clm_5758915e185b]
confidence: 0.80
stale_after: 2026-10-08
last_rendered: 2026-09-17T23:03:12Z
review_required: false
---

# agent harness

> **In here:** A harness is every piece of code, configuration, and execution logic beyond the model itself; · 20 claims, confidence 0.80.

## Current understanding

- A harness is every piece of code, configuration, and execution logic beyond the model itself; a raw model is not an agent until a harness supplies state, tool execution, feedback loops, and enforceable constraints (0.94)
- Claude Fable 5.1 writes fewer user-facing updates during long tool-calling turns than Claude Fable 5, more pronounced at higher effort and in longer tool chains, so a harness must request progress-update thinking blocks and strip prompt lines that suppress narration before adding new instructions (0.93)
- Claude Fable 5.1 executes very long tasks without much guidance on methodology when the goal is clear, but on complex asynchronous workloads it needs a nudge not to end its turn before the work is done (0.92)
- The hill climbing loop runs an analysis agent over production traces and uses the findings to rewrite the harness configuration, including prompt, tool, and grader tweaks (0.80)
- Task-harness fit is how well a harness matches the actual demands of the task, meaning the context it needs, the failures it will encounter, the policies it must enforce, and the environment it operates in (0.80)
- An agent is only as good as the context provided to the model, so the job of a harness is to provide that context at every step (0.80)
- How well a harness fits the task at hand determines how useful an agent is (0.80)
- Deterministic middleware logic is the right place for anything that cannot or should not live in a prompt: business logic, policy enforcement, swapping the model by task complexity, adjusting the prompt, and updating message history during compaction (0.79)
- Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context (0.77)
- Sandboxes give agents safe operating environments: rather than executing locally, the harness connects to a sandbox to run code, inspect files, and install dependencies in isolation (0.77)
- Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools (0.77)
- The filesystem is the harness's durable-storage primitive: it lets agents interface with real data, offload information beyond context limits, and persist work across sessions (0.77)
- The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt into a clean context window, forcing the agent to keep working against a completion goal (0.77)
- A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution (0.77)
- Evaluating an agent evaluates the agent harness and the model together, not the model alone, because the harness is what processes inputs, orchestrates tool calls, and returns results (0.77)
- Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions (0.76)
- Pre-assembled harnesses such as Deep Agents and the Claude Agent SDK reach a production-ready agent fast and work for most cases, but many agents need finer-grained customization than they support, including custom prompting, business logic, and guardrails (0.76)
- As models get more capable, some of what lives in the harness today will be absorbed into the model, which will get better at planning, self-verification, and long-horizon coherence natively (0.75)
- The best harness for a task is not necessarily the one a model was post-trained with: Terminal Bench 2.0 shows the same model scoring differently across harnesses, so optimizing the harness for the task carries significant value (0.74)
- Tool call offloading keeps only the head and tail tokens of a tool output above a threshold in context and offloads the full output to the filesystem (0.73)

## Evidence

- `clm_8b458dd1f653` — "A harness is every piece of code, configuration, and execution logic beyond the model itself; a raw model is not an agent until a harness supplies state, tool execution, feedback loops, and enforceable constraints." · p 0.94 · active · 2 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "A harness encompasses every piece of code, configuration, and execution logic beyond the model itself. A raw model isn't an agent until a harness provides elements like state, tool execution, feedback loops, and enforceable constraints."
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "The harness is the scaffolding around the model that connects it to the real world."
- `clm_2ef013ac2702` — "Claude Fable 5.1 writes fewer user-facing updates during long tool-calling turns than Claude Fable 5, more pronounced at higher effort and in longer tool chains, so a harness must request progress-update thinking blocks and strip prompt lines that suppress narration before adding new instructions." · p 0.93 · active · 1 support · 0 contradict · when: during long tool-calling turns
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1's default behavior is to write fewer user-facing updates during long tool-calling turns than Claude Fable 5 does. This becomes more pronounced at higher effort and in longer tool chains."
- `clm_fb52a42c5df4` — "Claude Fable 5.1 executes very long tasks without much guidance on methodology when the goal is clear, but on complex asynchronous workloads it needs a nudge not to end its turn before the work is done." · p 0.92 · active · 1 support · 0 contradict · when: on complex asynchronous workloads
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1 can execute very long tasks without much guidance on methodology, especially when the goal is clear. On complex asynchronous workloads, though, nudge it not to end its turn before the work is done."
- `clm_74d513c47cec` — "The hill climbing loop runs an analysis agent over production traces and uses the findings to rewrite the harness configuration, including prompt, tool, and grader tweaks." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The hill climbing loop runs an analysis agent over those traces and uses the findings to rewrite the harness with improved configuration. That can include prompt/tool tweaks or grader tweaks."
- `clm_64207eb604ea` — "Task-harness fit is how well a harness matches the actual demands of the task, meaning the context it needs, the failures it will encounter, the policies it must enforce, and the environment it operates in." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "Task-harness fit is how well your harness matches the actual demands of the task: the context it needs, the failures it'll encounter, the policies it must enforce, the environment it operates in."
- `clm_5cee05d79c41` — "An agent is only as good as the context provided to the model, so the job of a harness is to provide that context at every step." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "1. An agent is only as good as the context provided to the model 2. The job of a harness is to provide context to the model at every step"
- `clm_99954c9a26b6` — "How well a harness fits the task at hand determines how useful an agent is." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "How well a harness fits the task at hand determines how useful an agent is."
- `clm_4174226402d2` — "Deterministic middleware logic is the right place for anything that cannot or should not live in a prompt: business logic, policy enforcement, swapping the model by task complexity, adjusting the prompt, and updating message history during compaction." · p 0.79 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "**Deterministic Logic.** Business logic, policy enforcement, dynamic agent control — anything that needs to fire at a specific point in the loop."
- `clm_c9201456d93b` — "Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "Context Rot describes how models become worse at reasoning and completing tasks as their context window fills up. Context is a precious and scarce resource, so harnesses need strategies to manage it."
- `clm_ea3893719806` — "Sandboxes give agents safe operating environments: rather than executing locally, the harness connects to a sandbox to run code, inspect files, and install dependencies in isolation." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**Sandboxes give agents safe operating environments.** Instead of executing locally, the harness connects to a sandbox to run code, inspect files, install dependencies, and complete tasks. This creates secure, isolated execution."
- `clm_57fe4f170ef5` — "Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "This gives models a computer and lets them figure out the rest autonomously. The model can design its own tools on the fly via code instead of being constrained to pre-configured tools."
- `clm_b239352645a0` — "The filesystem is the harness's durable-storage primitive: it lets agents interface with real data, offload information beyond context limits, and persist work across sessions." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "Agents need durable storage to interface with real data, offload information beyond context limits, and persist work across sessions."
- `clm_4ed8d31fca58` — "The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt into a clean context window, forcing the agent to keep working against a completion goal." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt in a clean context window, forcing the agent to continue its work against a completion goal."
- `clm_fba2df5be733` — "A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "- System Prompts - Tools, Skills, MCPs and their descriptions - Bundled Infrastructure (filesystem, sandbox, browser) - Orchestration Logic (subagent spawning, handoffs, model routing) - Hooks/Middleware for deterministic execution…"
- `clm_bc4f7b493418` — "Evaluating an agent evaluates the agent harness and the model together, not the model alone, because the harness is what processes inputs, orchestrates tool calls, and returns results." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "When we evaluate “an agent,” we’re evaluating the harness *and* the model working together."
- `clm_6cf1f164aa2a` — "Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions." · p 0.76 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "This is a form of continual learning where agents durably store knowledge from one session and inject that knowledge into future sessions."
- `clm_675e7768a524` — "Pre-assembled harnesses such as Deep Agents and the Claude Agent SDK reach a production-ready agent fast and work for most cases, but many agents need finer-grained customization than they support, including custom prompting, business logic, and guardrails." · p 0.76 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "They're designed to get you to a production-ready agent fast, and they work well for most cases. But many agents need finer grained customization than these harnesses support: custom prompting, business logic, guardrails, etc."
- `clm_a8ebbcbbc60d` — "As models get more capable, some of what lives in the harness today will be absorbed into the model, which will get better at planning, self-verification, and long-horizon coherence natively." · p 0.75 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "As models get more capable, some of what lives in the harness today will get absorbed into the model. Models will get better at planning, self-verification, and long horizon coherence natively."
- `clm_f517ef4e1778` — "The best harness for a task is not necessarily the one a model was post-trained with: Terminal Bench 2.0 shows the same model scoring differently across harnesses, so optimizing the harness for the task carries significant value." · p 0.74 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**But this doesn't mean that the best harness for your task is the one a model was post-trained with.** The Terminal Bench 2.0 Leaderboard shows examples where Opus 4.6 scores differently depending on the harness."
- `clm_5758915e185b` — "Tool call offloading keeps only the head and tail tokens of a tool output above a threshold in context and offloads the full output to the filesystem." · p 0.73 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**Tool call offloading** reduces the impact of large tool outputs that clutter context without providing useful information."

## Timeline

- 2026-08-23 new_claim `clm_8b458dd1f653` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_fba2df5be733` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_b239352645a0` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_57fe4f170ef5` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_ea3893719806` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_6cf1f164aa2a` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_c9201456d93b` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_5758915e185b` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_4ed8d31fca58` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_f517ef4e1778` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_a8ebbcbbc60d` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_74d513c47cec` (src_5b435bf5e144)
- 2026-08-23 support_update `clm_8b458dd1f653` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_5cee05d79c41` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_4174226402d2` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_675e7768a524` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_64207eb604ea` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_99954c9a26b6` (src_f7dcee3b42fc)
- 2026-08-26 new_claim `clm_bc4f7b493418` (src_e66d966eb39d)
- 2026-09-02 new_claim `clm_2ef013ac2702` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_fb52a42c5df4` (src_9f2ae1e705ce)

## Related

- → uses [[claude-fable-5-1]] (0.99)
- ← applies_to [[task-harness-fit]] (0.93)
- → uses [[filesystem]] (0.92)
- ← applies_to [[hill-climbing-loop]] (0.81)
- → uses [[context-engineering]] (0.80)
- ← part_of [[middleware]] (0.80)
- ← part_of [[filesystem]] (0.78)
- ← part_of [[hooks]] (0.78)
- ← part_of Ralph Loop (no page yet) (0.78)
- ← part_of [[sandbox]] (0.78)
- ← part_of [[subagents]] (0.78)
- → uses [[bash-tool]] (0.78)
- … 5 more edges — `graph.py neighbors ent_agent_harness`
- [[filesystem]] — 4 shared claims
- [[context-window]] — 3 shared claims
- [[task-harness-fit]] — 3 shared claims
- [[claude-fable-5-1]] — 2 shared claims
- [[context-rot]] — 2 shared claims
- [[hooks]] — 2 shared claims
- [[middleware]] — 2 shared claims
- [[sandbox]] — 2 shared claims
- [[agent-evaluation]] — 1 shared claim
- [[agent-memory]] — 1 shared claim
- [[agent-trace]] — 1 shared claim
- [[bash-tool]] — 1 shared claim
- [[claude-agent-sdk]] — 1 shared claim
- [[context-engineering]] — 1 shared claim
- [[hill-climbing-loop]] — 1 shared claim
- [[loop-engineering]] — 1 shared claim
- [[planning]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[tool-use]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
- Deep Agents (no page yet)
- Ralph Loop (no page yet)
