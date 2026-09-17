---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/anthropic/reduce-latency.md, title: "reduce-latency", id: src_40d06136bbd7}
  - {resource: llm-wiki/raw/docs/pi/json.md, title: "JSON Event Stream Mode", id: src_559bd402b02f}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_streaming]
claim_ids: [clm_12448876d31c, clm_bd13f1fd3954, clm_2cb47310aec4]
confidence: 0.93
stale_after: 2027-02-01
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# streaming

> **In here:** Streaming lets the model start returning its response before the full output is complete, which significantly improves perceived responsiveness because users see output in real time · 3 claims, confidence 0.93.

## Current understanding

- Streaming lets the model start returning its response before the full output is complete, which significantly improves perceived responsiveness because users see output in real time (0.93)
- Time to first token measures how long the model takes to emit the first token of its response after the prompt is sent, and matters most when streaming to give users a responsive experience (0.93)
- Pi's JSON mode emits message_update records as deltas only, dropping the cumulative message field and the partial snapshot so stream size stays linear in the output (0.92)

## Evidence

- `clm_12448876d31c` — "Streaming lets the model start returning its response before the full output is complete, which significantly improves perceived responsiveness because users see output in real time." · p 0.93 · active · 1 support · 0 contradict
  - `src_40d06136bbd7` reduce-latency: "Streaming is a feature that allows the model to start sending back its response before the full output is complete."
- `clm_bd13f1fd3954` — "Time to first token measures how long the model takes to emit the first token of its response after the prompt is sent, and matters most when streaming to give users a responsive experience." · p 0.93 · active · 1 support · 0 contradict
  - `src_40d06136bbd7` reduce-latency: "**Time to first token (TTFT):** This metric measures the time it takes for the model to generate the first token of the response, from when the prompt was sent."
- `clm_2cb47310aec4` — "Pi's JSON mode emits message_update records as deltas only, dropping the cumulative message field and the partial snapshot so stream size stays linear in the output." · p 0.92 · active · 1 support · 0 contradict
  - `src_559bd402b02f` JSON Event Stream Mode: "`message_update` records are delta-only. They omit both the cumulative `message` field and `assistantMessageEvent.partial` to keep stream size linear."

## Timeline

- 2026-09-02 new_claim `clm_bd13f1fd3954` (src_40d06136bbd7)
- 2026-09-02 new_claim `clm_12448876d31c` (src_40d06136bbd7)
- 2026-09-11 new_claim `clm_2cb47310aec4` (src_559bd402b02f)

## Related

- → applies_to [[latency]] (0.93)
- → uses time to first token (no page yet) (0.93)
- ← uses [[json-event-stream-mode]] (0.93)
- [[latency]] — 2 shared claims
- [[json-event-stream-mode]] — 1 shared claim
- [[pi]] — 1 shared claim
- time to first token (no page yet)
