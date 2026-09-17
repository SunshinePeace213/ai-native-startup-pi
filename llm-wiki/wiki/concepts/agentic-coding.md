---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-field-guide-to-claude-fable-finding-your-unknowns.md, title: "A field guide to Claude Fable 5: Finding your unknowns", id: src_10f512f5f8de}
  - {resource: llm-wiki/raw/articles/anthropic/building-verification-loops-in-claude-code-with-skills.md, title: "Building verification loops in Claude Code with skills", id: src_8e30f40dbfb8}
  - {resource: llm-wiki/raw/books/founders-playbook/index.md, title: "The Founder's Playbook: Building an AI-Native Startup", id: src_72a67c0111dc}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_agentic_coding]
claim_ids: [clm_69a691b0baea, clm_486ba5592791, clm_3a7054e3ee20, clm_5cbba3ebb17e, clm_b2abede86a8c, clm_6cfecd1b5320, clm_8ca11f550bd7]
confidence: 0.86
stale_after: 2028-04-16
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# agentic coding

> **In here:** Most agentic coding sessions follow one predictable pattern — request changes, gather context, execute actions, verify results, and iterate if needed · 7 claims, confidence 0.86.

## Current understanding

- A working prototype is not evidence of problem-solution fit — it is a pressure-testing prop for conversations with potential users, and those conversations are the real evidence (0.96)
- On open-ended feature work Claude Fable 5.1 sometimes delivers more than asked - fixing nearby code, extending unmentioned behavior, or committing more test files than the change warrants - and an explicit instruction about what to leave out drops unrequested additions and committed test code substantially with no measurable change in task success (0.93)
- AI technical debt compounds rather than accumulating gradually: each session re-derives foundational decisions from scratch and those decisions drift, leaving a codebase with no coherent mental model behind it — not because any single piece is bad but because the pieces were never designed to fit together (0.84)
- Agentic coding tools generate code that works, not code that is inherently secure, and security defects carry no natural feedback loop because they stay invisible until exploited — so a security review before any user touches the product is the minimum responsible threshold for shipping an MVP (0.84)
- In an AI-native startup the founder stops being an individual contributor and becomes an orchestrator of agents, with attention shifting up the stack to generating ideas and directing the AI agents, tools, and small team that carry them out (0.84)
- Most agentic coding sessions follow one predictable pattern — request changes, gather context, execute actions, verify results, and iterate if needed — with verification being how the agent validates its work before responding (0.82)
- Reducing and planning for your unknowns is the skill of agentic coding — the best agentic coders have relatively few unknowns and assume the rest — and it is a skill that improves by working with Claude (0.81)

## Evidence

- `clm_69a691b0baea` — "A working prototype is not evidence of problem-solution fit — it is a pressure-testing prop for conversations with potential users, and those conversations are the real evidence" · p 0.96 · active · 2 support · 0 contradict
  - `src_72a67c0111dc` The Founder's Playbook: Building an AI-Native Startup: "A working prototype is easy to mistake as concrete evidence that you're solving a real problem, but it's not. Your prototype instead serves as a useful pressure-testing prop for conversations with potential users."
  - `src_72a67c0111dc` The Founder's Playbook: Building an AI-Native Startup: "Even before the current era of agentic coding, 42% of startups failed because they built something nobody wanted."
- `clm_486ba5592791` — "On open-ended feature work Claude Fable 5.1 sometimes delivers more than asked - fixing nearby code, extending unmentioned behavior, or committing more test files than the change warrants - and an explicit instruction about what to leave out drops unrequested additions and committed test code substantially with no measurable change in task success." · p 0.93 · active · 1 support · 0 contradict · when: on open-ended feature implementation
  - `src_9f2ae1e705ce` Delivering work: "When asked to implement an open-ended feature, Claude Fable 5.1 delivers what's asked for and sometimes more: it may fix nearby code, extend behavior the task didn't mention, or commit more test files than the change warrants."
- `clm_3a7054e3ee20` — "AI technical debt compounds rather than accumulating gradually: each session re-derives foundational decisions from scratch and those decisions drift, leaving a codebase with no coherent mental model behind it — not because any single piece is bad but because the pieces were never designed to fit together" · p 0.84 · active · 1 support · 0 contradict · when: when specs and architectural constraints are not written down somewhere the AI can read
  - `src_72a67c0111dc` The Founder's Playbook: Building an AI-Native Startup: "AI technical debt, however, compounds. Without specs and architectural constraints written down somewhere the AI can read, each session re-derives foundational decisions from scratch, and those decisions drift."
- `clm_5cbba3ebb17e` — "Agentic coding tools generate code that works, not code that is inherently secure, and security defects carry no natural feedback loop because they stay invisible until exploited — so a security review before any user touches the product is the minimum responsible threshold for shipping an MVP" · p 0.84 · active · 1 support · 0 contradict
  - `src_72a67c0111dc` The Founder's Playbook: Building an AI-Native Startup: "The hard truth is that agentic coding tools generate code that works, not code that is inherently secure. Functional code is easy, because either the feature works or it doesn't."
- `clm_b2abede86a8c` — "In an AI-native startup the founder stops being an individual contributor and becomes an orchestrator of agents, with attention shifting up the stack to generating ideas and directing the AI agents, tools, and small team that carry them out" · p 0.84 · active · 1 support · 0 contradict
  - `src_72a67c0111dc` The Founder's Playbook: Building an AI-Native Startup: "In an AI-native startup, the founder role becomes much less individual contributor and much more orchestrator of agents—specialized AI assistants that can read files, run commands, execute code, and even browse the web."
- `clm_6cfecd1b5320` — "Most agentic coding sessions follow one predictable pattern — request changes, gather context, execute actions, verify results, and iterate if needed — with verification being how the agent validates its work before responding" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "Most agentic coding sessions follow a predictable pattern: request changes, gather context, execute actions, verify results, and iterate if needed."
- `clm_8ca11f550bd7` — "Reducing and planning for your unknowns is the skill of agentic coding — the best agentic coders have relatively few unknowns and assume the rest — and it is a skill that improves by working with Claude" · p 0.81 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "In many ways, reducing and planning for your unknowns is the **skill** of agentic coding. But luckily, this is a skill you can improve at, by working with Claude."

## Timeline

- 2026-08-23 new_claim `clm_b2abede86a8c` (src_72a67c0111dc)
- 2026-08-23 new_claim `clm_69a691b0baea` (src_72a67c0111dc)
- 2026-08-23 support_update `clm_69a691b0baea` (src_72a67c0111dc)
- 2026-08-23 new_claim `clm_3a7054e3ee20` (src_72a67c0111dc)
- 2026-08-23 new_claim `clm_5cbba3ebb17e` (src_72a67c0111dc)
- 2026-08-23 new_claim `clm_6cfecd1b5320` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_8ca11f550bd7` (src_10f512f5f8de)
- 2026-09-02 new_claim `clm_486ba5592791` (src_9f2ae1e705ce)

## Related

- ← applies_to [[claude-fable-5-1]] (0.93)
- → produces technical debt (no page yet) (0.84)
- → related_to [[security-review]] (0.84)
- ← uses [[founder]] (0.84)
- → applies_to [[idea-stage]] (0.83)
- ← part_of [[claude-code]] (0.83)
- ← part_of [[verification-loop]] (0.82)
- ← part_of [[unknowns]] (0.82)
- [[ai-native-startup]] — 2 shared claims
- [[mvp-stage]] — 2 shared claims
- [[claude-code]] — 1 shared claim
- [[claude-fable-5-1]] — 1 shared claim
- [[founder]] — 1 shared claim
- [[idea-stage]] — 1 shared claim
- [[security-review]] — 1 shared claim
- [[unknowns]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
- problem-solution fit (no page yet)
- technical debt (no page yet)
