---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/docs/claude-code/cli-reference.md, title: "CLI reference", id: src_716248fd9713}
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_claude_agent_sdk]
claim_ids: [clm_917de29f9f33, clm_c7efa28cfcfb, clm_935a50944ab0, clm_87f54b7b4618, clm_675e7768a524]
confidence: 0.88
stale_after: 2026-11-10
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# Claude Agent SDK

> **In here:** The Claude Agent SDK exposes the same tools, agent loop, and context management that power Claude Code, available as a CLI for scripts and CI/CD or as Python and TypeScript packages for full… · 5 claims, confidence 0.88.

## Current understanding

- The Claude Agent SDK exposes the same tools, agent loop, and context management that power Claude Code, available as a CLI for scripts and CI/CD or as Python and TypeScript packages for full programmatic control (0.93)
- SIGTERM ends a `claude -p` run with exit code 143 and leaves the in-progress turn unfinished with no result recorded, so ending the turn instead takes a SIGINT or the Agent SDK's `interrupt()` before the process is stopped (0.93)
- The -p / --print flag is Claude Code's non-interactive entry point: it prints the response instead of opening an interactive session, and is the surface used for programmatic and SDK-style invocation (0.89)
- claude --continue loads the most recent conversation in the current directory but skips background sessions, sessions created with claude -p or the Agent SDK, and sessions whose first prompt was /loop; adding -p brings those excluded sessions back into scope (0.89)
- Pre-assembled harnesses such as Deep Agents and the Claude Agent SDK reach a production-ready agent fast and work for most cases, but many agents need finer-grained customization than they support, including custom prompting, business logic, and guardrails (0.76)

## Evidence

- `clm_917de29f9f33` — "The Claude Agent SDK exposes the same tools, agent loop, and context management that power Claude Code, available as a CLI for scripts and CI/CD or as Python and TypeScript packages for full programmatic control." · p 0.93 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "The [Agent SDK](/docs/en/agent-sdk/overview) gives you the same tools, agent loop, and context management that power Claude Code."
- `clm_c7efa28cfcfb` — "SIGTERM ends a `claude -p` run with exit code 143 and leaves the in-progress turn unfinished with no result recorded, so ending the turn instead takes a SIGINT or the Agent SDK's `interrupt()` before the process is stopped." · p 0.93 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "If you stop a `claude -p` run with SIGTERM, for example with `kill` or from a process supervisor, Claude Code exits with code 143. Claude Code leaves the turn that was in progress unfinished and records no result for it."
- `clm_935a50944ab0` — "The -p / --print flag is Claude Code's non-interactive entry point: it prints the response instead of opening an interactive session, and is the surface used for programmatic and SDK-style invocation." · p 0.89 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "| `--print`, `-p` | Print response without interactive mode (see [Agent SDK documentation](/docs/en/agent-sdk/overview) for programmatic usage details) |"
- `clm_87f54b7b4618` — "claude --continue loads the most recent conversation in the current directory but skips background sessions, sessions created with claude -p or the Agent SDK, and sessions whose first prompt was /loop; adding -p brings those excluded sessions back into scope." · p 0.89 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "| `--continue`, `-c` | Load the most recent conversation in the current directory, skipping [background sessions, sessions created with `claude -p` or the Agent SDK, and sessions whose first prompt was…"
- `clm_675e7768a524` — "Pre-assembled harnesses such as Deep Agents and the Claude Agent SDK reach a production-ready agent fast and work for most cases, but many agents need finer-grained customization than they support, including custom prompting, business logic, and guardrails." · p 0.76 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "They're designed to get you to a production-ready agent fast, and they work well for most cases. But many agents need finer grained customization than these harnesses support: custom prompting, business logic, guardrails, etc."

## Timeline

- 2026-08-23 new_claim `clm_675e7768a524` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_935a50944ab0` (src_716248fd9713)
- 2026-08-23 new_claim `clm_87f54b7b4618` (src_716248fd9713)
- 2026-08-23 new_claim `clm_917de29f9f33` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_c7efa28cfcfb` (src_d5ec157b2e7b)

## Related

- → related_to [[claude-code]] (0.93)
- → uses [[middleware]] (0.79)
- [[claude-code]] — 4 shared claims
- [[agent-harness]] — 1 shared claim
- [[middleware]] — 1 shared claim
- [[non-interactive-mode]] — 1 shared claim
- [[print-mode]] — 1 shared claim
- [[session]] — 1 shared claim
- Deep Agents (no page yet)
