---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/pi/compaction.md, title: "Compaction & Branch Summarization", id: src_f3c56d2c0088}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_tool_results]
claim_ids: [clm_1d75feeedff1, clm_d444268af3b9, clm_1ff93b651fdd, clm_81614d317c70, clm_424056cf5ae9, clm_71a19f64f88b]
confidence: 0.93
stale_after: 2027-02-01
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# tool results

> **In here:** Third-party content should reach Claude only inside tool_result blocks, never in the system prompt or plain user text, because Claude is trained to treat instructions appearing inside tool results… · 6 claims, confidence 0.93.

## Current understanding

- Third-party content should reach Claude only inside tool_result blocks, never in the system prompt or plain user text, because Claude is trained to treat instructions appearing inside tool results with appropriate skepticism (0.94)
- Because Claude treats tool-result content as untrusted data, an application's own instructions placed there may be ignored or flagged as injection; they belong in a user turn following the tool_result block or, on supported models, a mid-conversation system message (0.94)
- Wrapping third-party strings in a JSON object rather than concatenating them into free-form text gives unambiguous delimiters, so an attacker cannot close a quote or tag to break out into an instruction context (0.93)
- Making the nature and origin of untrusted content explicit, in the tool description or the result's structure, helps Claude calibrate how much to trust any directives embedded in it (0.93)
- Pi never cuts compaction at a tool result, because a tool result must stay with the tool call that produced it (0.92)
- Pi truncates tool results to 2000 characters when serializing a conversation for summarization, since tool output is typically the largest contributor to context size (0.92)

## Evidence

- `clm_1d75feeedff1` — "Third-party content should reach Claude only inside tool_result blocks, never in the system prompt or plain user text, because Claude is trained to treat instructions appearing inside tool results with appropriate skepticism." · p 0.94 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Put untrusted content only in tool results.** Deliver third-party content to Claude inside `tool_result` blocks, never in `system` prompts or plain user `text` blocks."
- `clm_d444268af3b9` — "Because Claude treats tool-result content as untrusted data, an application's own instructions placed there may be ignored or flagged as injection; they belong in a user turn following the tool_result block or, on supported models, a mid-conversation system message." · p 0.94 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Don't put your own instructions in tool results.** Because Claude treats tool-result content as untrusted data, instructions you place there may be ignored or flagged as a potential injection."
- `clm_1ff93b651fdd` — "Wrapping third-party strings in a JSON object rather than concatenating them into free-form text gives unambiguous delimiters, so an attacker cannot close a quote or tag to break out into an instruction context." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **JSON-encode untrusted content.** Where possible, wrap third-party strings in a JSON object rather than concatenating them into free-form text."
- `clm_81614d317c70` — "Making the nature and origin of untrusted content explicit, in the tool description or the result's structure, helps Claude calibrate how much to trust any directives embedded in it." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Tell Claude what the content is and where it came from.** In the tool's `description`, or in the structure of the result itself, make the nature and source of the content explicit: for example, that it is the body of an inbound email…"
- `clm_424056cf5ae9` — "Pi never cuts compaction at a tool result, because a tool result must stay with the tool call that produced it." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "Never cut at tool results (they must stay with their tool call)."
- `clm_71a19f64f88b` — "Pi truncates tool results to 2000 characters when serializing a conversation for summarization, since tool output is typically the largest contributor to context size." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "Tool results are truncated to 2000 characters during serialization."

## Timeline

- 2026-09-02 new_claim `clm_1d75feeedff1` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_81614d317c70` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_1ff93b651fdd` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_d444268af3b9` (src_ba6d75fadd1b)
- 2026-09-11 new_claim `clm_424056cf5ae9` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_71a19f64f88b` (src_f3c56d2c0088)

## Related

- → applies_to [[prompt-injection]] (0.94)
- ← applies_to [[compaction]] (0.93)
- [[prompt-injection]] — 4 shared claims
- [[compaction]] — 2 shared claims
- [[pi]] — 2 shared claims
