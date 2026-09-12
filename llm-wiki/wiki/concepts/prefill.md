---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/increase-consistency.md, title: "increase-consistency", id: src_1dce2e527884}
  - {resource: llm-wiki/raw/docs/anthropic/reduce-prompt-leak.md, title: "reduce-prompt-leak", id: src_10de5546316e}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_prefill]
claim_ids: [clm_244dbfd14a89, clm_2ef1b8811d31]
confidence: 0.96
stale_after: 2029-10-09
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# prefill

> **In here:** Prefilling the assistant turn is not supported on Claude 4.6 and later models or on Claude Mythos Preview; structured outputs on models that support them, or system prompt instructions, replace it · 2 claims, confidence 0.96.

## Current understanding

- Prefilling the assistant turn is not supported on Claude 4.6 and later models or on Claude Mythos Preview; structured outputs on models that support them, or system prompt instructions, replace it (0.99)
- A system prompt can isolate key information and context from user queries, with the key instructions emphasized in the user turn and, on models that support it, re-emphasized by prefilling the assistant turn (0.92)

## Evidence

- `clm_244dbfd14a89` — "Prefilling the assistant turn is not supported on Claude 4.6 and later models or on Claude Mythos Preview; structured outputs on models that support them, or system prompt instructions, replace it." · p 0.99 · active · 2 support · 0 contradict
  - `src_1dce2e527884` increase-consistency: "Prefilling is not supported on Claude 4.6 and later models and [Claude Mythos Preview](https://anthropic.com/glasswing) ."
  - `src_10de5546316e` reduce-prompt-leak: "(Note: prefilling is not supported on Claude 4.6 and later models and [Claude Mythos Preview](https://anthropic.com/glasswing).)"
- `clm_2ef1b8811d31` — "A system prompt can isolate key information and context from user queries, with the key instructions emphasized in the user turn and, on models that support it, re-emphasized by prefilling the assistant turn." · p 0.92 · active · 1 support · 0 contradict
  - `src_10de5546316e` reduce-prompt-leak: "* **Separate context from queries:** You can try using system prompts to isolate key information and context from user queries."

## Timeline

- 2026-09-02 new_claim `clm_244dbfd14a89` (src_1dce2e527884)
- 2026-09-02 new_claim `clm_2ef1b8811d31` (src_10de5546316e)
- 2026-09-02 support_update `clm_244dbfd14a89` (src_10de5546316e)

## Related

- ← replaces [[structured-outputs]] (0.93)
- → applies_to [[prompt-leak]] (0.92)
- [[prompt-leak]] — 1 shared claim
- [[structured-outputs]] — 1 shared claim
- [[system-prompt]] — 1 shared claim
