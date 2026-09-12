---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/pi/json.md, title: "JSON Event Stream Mode", id: src_559bd402b02f}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_json_event_stream_mode]
claim_ids: [clm_cfd347ecc508, clm_2cb47310aec4, clm_088ce0e77862, clm_00bb29da7aa9]
confidence: 0.93
stale_after: 2027-01-26
last_rendered: 2026-09-11T19:52:50Z
review_required: false
---

# JSON event stream mode

> **In here:** In Pi's JSON stream the message_end event carries the final authoritative message, so a consumer need not reassemble deltas to get the settled text · 4 claims, confidence 0.93.

## Current understanding

- Pi's --mode json writes every session event as JSON lines on stdout, the integration surface for other tools and custom UIs (0.93)
- Pi's JSON mode emits message_update records as deltas only, dropping the cumulative message field and the partial snapshot so stream size stays linear in the output (0.93)
- The top-level usage field in Pi's JSON stream carries the latest cumulative provider-reported usage and can stay at zero when a provider reports usage only at completion (0.92)
- In Pi's JSON stream the message_end event carries the final authoritative message, so a consumer need not reassemble deltas to get the settled text (0.92)

## Evidence

- `clm_cfd347ecc508` — "Pi's --mode json writes every session event as JSON lines on stdout, the integration surface for other tools and custom UIs." · p 0.93 · active · 1 support · 0 contradict
  - `src_559bd402b02f` JSON Event Stream Mode: "Outputs all session events as JSON lines to stdout. Useful for integrating pi into other tools or custom UIs."
- `clm_2cb47310aec4` — "Pi's JSON mode emits message_update records as deltas only, dropping the cumulative message field and the partial snapshot so stream size stays linear in the output." · p 0.93 · active · 1 support · 0 contradict
  - `src_559bd402b02f` JSON Event Stream Mode: "`message_update` records are delta-only. They omit both the cumulative `message` field and `assistantMessageEvent.partial` to keep stream size linear."
- `clm_088ce0e77862` — "The top-level usage field in Pi's JSON stream carries the latest cumulative provider-reported usage and can stay at zero when a provider reports usage only at completion." · p 0.92 · active · 1 support · 0 contradict
  - `src_559bd402b02f` JSON Event Stream Mode: "The top-level `usage` field contains the latest cumulative provider-reported usage and may remain zero when a provider only reports usage at completion."
- `clm_00bb29da7aa9` — "In Pi's JSON stream the message_end event carries the final authoritative message, so a consumer need not reassemble deltas to get the settled text." · p 0.92 · active · 1 support · 0 contradict
  - `src_559bd402b02f` JSON Event Stream Mode: "`message_end` contains the final authoritative message."

## Timeline

- 2026-09-11 new_claim `clm_cfd347ecc508` (src_559bd402b02f)
- 2026-09-11 new_claim `clm_2cb47310aec4` (src_559bd402b02f)
- 2026-09-11 new_claim `clm_088ce0e77862` (src_559bd402b02f)
- 2026-09-11 new_claim `clm_00bb29da7aa9` (src_559bd402b02f)

## Related

- ← produces [[pi]] (0.93)
- → uses [[streaming]] (0.93)
- [[pi]] — 4 shared claims
- [[streaming]] — 1 shared claim
