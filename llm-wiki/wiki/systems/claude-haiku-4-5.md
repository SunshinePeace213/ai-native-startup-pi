---
type: system
status: current
created: 2026-09-02
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/anthropic/reduce-latency.md, title: "reduce-latency", id: src_40d06136bbd7}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_claude_haiku_4_5]
claim_ids: [clm_21cc7130eee8, clm_2b81a95aa8bb, clm_3d6594729375]
confidence: 0.93
stale_after: 2029-11-05
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# Claude Haiku 4.5

> **In here:** For speed-critical applications Claude Haiku 4.5 offers the fastest response times while maintaining high intelligence, making model choice one of the most direct latency levers · 3 claims, confidence 0.93.

## Current understanding

- A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification (0.93)
- For speed-critical applications Claude Haiku 4.5 offers the fastest response times while maintaining high intelligence, making model choice one of the most direct latency levers (0.93)
- Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block (0.93)

## Evidence

- `clm_21cc7130eee8` — "A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Harmlessness screens:** Use a lightweight model like Claude Haiku 4.5 to pre-screen user input before it reaches your main conversation."
- `clm_2b81a95aa8bb` — "For speed-critical applications Claude Haiku 4.5 offers the fastest response times while maintaining high intelligence, making model choice one of the most direct latency levers." · p 0.93 · active · 1 support · 0 contradict · when: for speed-critical applications
  - `src_40d06136bbd7` reduce-latency: "For speed-critical applications, **Claude Haiku 4.5** offers the fastest response times while maintaining high intelligence:"
- `clm_3d6594729375` — "Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "Run each tool, pass its raw output to a small classifier call with Claude Haiku 4.5, and only return the content as a `tool_result` block if the screen reports no injection attempt."

## Timeline

- 2026-09-02 new_claim `clm_2b81a95aa8bb` (src_40d06136bbd7)
- 2026-09-02 new_claim `clm_21cc7130eee8` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_3d6594729375` (src_ba6d75fadd1b)

## Related

- → applies_to [[jailbreak]] (0.93)
- → applies_to [[latency]] (0.93)
- → applies_to [[prompt-injection]] (0.93)
- [[structured-outputs]] — 2 shared claims
- [[jailbreak]] — 1 shared claim
- [[latency]] — 1 shared claim
- [[prompt-injection]] — 1 shared claim
