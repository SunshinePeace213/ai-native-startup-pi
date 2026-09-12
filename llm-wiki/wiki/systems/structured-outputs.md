---
type: system
status: current
created: 2026-09-02
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/increase-consistency.md, title: "increase-consistency", id: src_1dce2e527884}
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/anthropic/reduce-prompt-leak.md, title: "reduce-prompt-leak", id: src_10de5546316e}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_structured_outputs]
claim_ids: [clm_244dbfd14a89, clm_151d29479d44, clm_21cc7130eee8, clm_3d6594729375]
confidence: 0.95
stale_after: 2029-11-05
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# structured outputs

> **In here:** When Claude must always emit valid JSON conforming to a specific schema, Structured Outputs give guaranteed schema compliance and replace prompt-engineering techniques, which remain useful for… · 4 claims, confidence 0.95.

## Current understanding

- Prefilling the assistant turn is not supported on Claude 4.6 and later models or on Claude Mythos Preview; structured outputs on models that support them, or system prompt instructions, replace it (0.99)
- When Claude must always emit valid JSON conforming to a specific schema, Structured Outputs give guaranteed schema compliance and replace prompt-engineering techniques, which remain useful for general consistency or flexibility beyond strict JSON schemas (0.93)
- A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification (0.93)
- Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block (0.93)

## Evidence

- `clm_244dbfd14a89` — "Prefilling the assistant turn is not supported on Claude 4.6 and later models or on Claude Mythos Preview; structured outputs on models that support them, or system prompt instructions, replace it." · p 0.99 · active · 2 support · 0 contradict
  - `src_1dce2e527884` increase-consistency: "Prefilling is not supported on Claude 4.6 and later models and [Claude Mythos Preview](https://anthropic.com/glasswing) ."
  - `src_10de5546316e` reduce-prompt-leak: "(Note: prefilling is not supported on Claude 4.6 and later models and [Claude Mythos Preview](https://anthropic.com/glasswing).)"
- `clm_151d29479d44` — "When Claude must always emit valid JSON conforming to a specific schema, Structured Outputs give guaranteed schema compliance and replace prompt-engineering techniques, which remain useful for general consistency or flexibility beyond strict JSON schemas." · p 0.93 · active · 1 support · 0 contradict
  - `src_1dce2e527884` increase-consistency: "If you need Claude to always output valid JSON that conforms to a specific schema, use [Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) instead of the prompt engineering techniques below."
- `clm_21cc7130eee8` — "A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Harmlessness screens:** Use a lightweight model like Claude Haiku 4.5 to pre-screen user input before it reaches your main conversation."
- `clm_3d6594729375` — "Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "Run each tool, pass its raw output to a small classifier call with Claude Haiku 4.5, and only return the content as a `tool_result` block if the screen reports no injection attempt."

## Timeline

- 2026-09-02 new_claim `clm_151d29479d44` (src_1dce2e527884)
- 2026-09-02 new_claim `clm_244dbfd14a89` (src_1dce2e527884)
- 2026-09-02 new_claim `clm_21cc7130eee8` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_3d6594729375` (src_ba6d75fadd1b)
- 2026-09-02 support_update `clm_244dbfd14a89` (src_10de5546316e)

## Related

- → applies_to [[jailbreak]] (0.93)
- → applies_to [[output-consistency]] (0.93)
- → replaces [[prefill]] (0.93)
- [[claude-haiku-4-5]] — 2 shared claims
- [[jailbreak]] — 1 shared claim
- [[output-consistency]] — 1 shared claim
- [[prefill]] — 1 shared claim
- [[prompt-injection]] — 1 shared claim
