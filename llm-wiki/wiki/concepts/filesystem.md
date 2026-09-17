---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_filesystem]
claim_ids: [clm_b239352645a0, clm_fba2df5be733, clm_2790bc8fcda1, clm_6cf1f164aa2a, clm_5758915e185b]
confidence: 0.76
stale_after: 2026-10-08
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# filesystem

> **In here:** The filesystem is a natural collaboration surface because multiple agents and humans coordinate through shared files · 5 claims, confidence 0.76.

## Current understanding

- The filesystem is the harness's durable-storage primitive: it lets agents interface with real data, offload information beyond context limits, and persist work across sessions (0.77)
- A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution (0.77)
- The filesystem is a natural collaboration surface because multiple agents and humans coordinate through shared files (0.76)
- Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions (0.76)
- Tool call offloading keeps only the head and tail tokens of a tool output above a threshold in context and offloads the full output to the filesystem (0.73)

## Evidence

- `clm_b239352645a0` — "The filesystem is the harness's durable-storage primitive: it lets agents interface with real data, offload information beyond context limits, and persist work across sessions." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "Agents need durable storage to interface with real data, offload information beyond context limits, and persist work across sessions."
- `clm_fba2df5be733` — "A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "- System Prompts - Tools, Skills, MCPs and their descriptions - Bundled Infrastructure (filesystem, sandbox, browser) - Orchestration Logic (subagent spawning, handoffs, model routing) - Hooks/Middleware for deterministic execution…"
- `clm_2790bc8fcda1` — "The filesystem is a natural collaboration surface because multiple agents and humans coordinate through shared files." · p 0.76 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**The filesystem is a natural collaboration surface.** Multiple agents and humans coordinate through shared files"
- `clm_6cf1f164aa2a` — "Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions." · p 0.76 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "This is a form of continual learning where agents durably store knowledge from one session and inject that knowledge into future sessions."
- `clm_5758915e185b` — "Tool call offloading keeps only the head and tail tokens of a tool output above a threshold in context and offloads the full output to the filesystem." · p 0.73 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**Tool call offloading** reduces the impact of large tool outputs that clutter context without providing useful information."

## Timeline

- 2026-08-23 new_claim `clm_fba2df5be733` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_b239352645a0` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_2790bc8fcda1` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_6cf1f164aa2a` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_5758915e185b` (src_be6da1f4f37a)

## Related

- ← uses [[agent-harness]] (0.92)
- → part_of [[agent-harness]] (0.78)
- ← depends_on [[agent-memory]] (0.77)
- ← uses [[subagents]] (0.77)
- [[agent-harness]] — 4 shared claims
- [[subagents]] — 2 shared claims
- [[agent-memory]] — 1 shared claim
- [[context-rot]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[sandbox]] — 1 shared claim
