---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/docs/pi/security.md, title: "Security", id: src_38afec4a51af}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_agent_memory]
claim_ids: [clm_101c1d9e86b6, clm_3e99f9d5f50a, clm_6cf1f164aa2a]
confidence: 0.87
stale_after: 2027-02-01
last_rendered: 2026-09-11T19:57:09Z
review_required: false
---

# agent memory

> **In here:** Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions · 3 claims, confidence 0.87.

## Current understanding

- A directory's AGENTS.override.md makes Pi load it in place of that directory's AGENTS.md or CLAUDE.md, while context files from other directories still layer normally (0.93)
- Pi loads context files such as AGENTS.override.md, AGENTS.md, and CLAUDE.md regardless of project trust, unless context loading is switched off entirely (0.93)
- Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions (0.77)

## Evidence

- `clm_101c1d9e86b6` — "A directory's AGENTS.override.md makes Pi load it in place of that directory's AGENTS.md or CLAUDE.md, while context files from other directories still layer normally." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "If a directory contains `AGENTS.override.md`, Pi loads it instead of `AGENTS.md` or `CLAUDE.md` from that directory. Context files from other directories still layer normally."
- `clm_3e99f9d5f50a` — "Pi loads context files such as AGENTS.override.md, AGENTS.md, and CLAUDE.md regardless of project trust, unless context loading is switched off entirely." · p 0.93 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "Context files such as `AGENTS.override.md`, `AGENTS.md`, and `CLAUDE.md` are loaded regardless of project trust unless context loading is disabled."
- `clm_6cf1f164aa2a` — "Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "This is a form of continual learning where agents durably store knowledge from one session and inject that knowledge into future sessions."

## Timeline

- 2026-08-23 new_claim `clm_6cf1f164aa2a` (src_be6da1f4f37a)
- 2026-09-11 new_claim `clm_3e99f9d5f50a` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_101c1d9e86b6` (src_ab670f25c35e)

## Related

- ← uses [[pi]] (0.99)
- → depends_on [[filesystem]] (0.77)
- ← uses [[agent-harness]] (0.77)
- [[pi]] — 2 shared claims
- [[agent-harness]] — 1 shared claim
- [[filesystem]] — 1 shared claim
- [[workspace-trust]] — 1 shared claim
