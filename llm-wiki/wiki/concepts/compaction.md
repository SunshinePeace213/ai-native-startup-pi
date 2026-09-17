---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/pi/compaction.md, title: "Compaction & Branch Summarization", id: src_f3c56d2c0088}
  - {resource: llm-wiki/raw/docs/pi/session-format.md, title: "Session File Format", id: src_92c377275d79}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_compaction]
claim_ids: [clm_424056cf5ae9, clm_8d8d4c1628d8, clm_ffe883da9a45, clm_07c0f6c720a3, clm_71a19f64f88b, clm_be8b43ff7593, clm_368deae620d9, clm_d65893ecf0db]
confidence: 0.92
stale_after: 2027-01-29
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# compaction

> **In here:** When one Pi turn is itself larger than keepRecentTokens the cut point lands mid-turn at an assistant message, and Pi then merges a history summary with a turn-prefix summary · 8 claims, confidence 0.92.

## Current understanding

- Pi never cuts compaction at a tool result, because a tool result must stay with the tool call that produced it (0.92)
- Pi auto-compacts once context tokens exceed the context window minus reserveTokens, which defaults to 16384 tokens held back for the model's response (0.92)
- Pi picks its compaction cut point by walking backwards from the newest message accumulating token estimates until keepRecentTokens, 20k by default, is covered (0.92)
- A Pi extension can intercept compaction through the session_before_compact event to cancel it outright or supply its own summary (0.92)
- Pi truncates tool results to 2000 characters when serializing a conversation for summarization, since tool output is typically the largest contributor to context size (0.92)
- A Pi compaction entry must carry firstKeptEntryId, naming the oldest entry retained: rebuilding context swaps the summarized entries for the summary and keeps everything from that entry onward (0.92)
- When one Pi turn is itself larger than keepRecentTokens the cut point lands mid-turn at an assistant message, and Pi then merges a history summary with a turn-prefix summary (0.91)
- Pi issues compaction and branch-summary requests on fresh routing session IDs and, where the provider supports it, disables prompt-cache writes because these one-off prompts are unlikely to be reused (0.91)

## Evidence

- `clm_424056cf5ae9` — "Pi never cuts compaction at a tool result, because a tool result must stay with the tool call that produced it." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "Never cut at tool results (they must stay with their tool call)."
- `clm_8d8d4c1628d8` — "Pi auto-compacts once context tokens exceed the context window minus reserveTokens, which defaults to 16384 tokens held back for the model's response." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "By default, `reserveTokens` is 16384 tokens (configurable in `~/.pi/agent/settings.json` or `<project-dir>/.pi/settings.json`). This leaves room for the LLM's response."
- `clm_ffe883da9a45` — "Pi picks its compaction cut point by walking backwards from the newest message accumulating token estimates until keepRecentTokens, 20k by default, is covered." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "**Find cut point**: Walk backwards from newest message, accumulating token estimates until `keepRecentTokens` (default 20k, configurable in `~/.pi/agent/settings.json` or `<project-dir>/.pi/settings.json`) is reached"
- `clm_07c0f6c720a3` — "A Pi extension can intercept compaction through the session_before_compact event to cancel it outright or supply its own summary." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "Fired before auto-compaction or `/compact`. Can cancel or provide custom summary."
- `clm_71a19f64f88b` — "Pi truncates tool results to 2000 characters when serializing a conversation for summarization, since tool output is typically the largest contributor to context size." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "Tool results are truncated to 2000 characters during serialization."
- `clm_be8b43ff7593` — "A Pi compaction entry must carry firstKeptEntryId, naming the oldest entry retained: rebuilding context swaps the summarized entries for the summary and keeps everything from that entry onward." · p 0.92 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "`firstKeptEntryId` is required. It identifies the first entry retained from before the compaction entry. When rebuilding context, Pi replaces older summarized entries with the compaction summary and keeps the range beginning at this entry."
- `clm_368deae620d9` — "When one Pi turn is itself larger than keepRecentTokens the cut point lands mid-turn at an assistant message, and Pi then merges a history summary with a turn-prefix summary." · p 0.91 · active · 1 support · 0 contradict · when: when a single turn exceeds keepRecentTokens
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "When a single turn exceeds `keepRecentTokens`, the cut point lands mid-turn at an assistant message."
- `clm_d65893ecf0db` — "Pi issues compaction and branch-summary requests on fresh routing session IDs and, where the provider supports it, disables prompt-cache writes because these one-off prompts are unlikely to be reused." · p 0.91 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "Compaction and branch-summary requests use fresh routing session IDs and, where supported by the provider, disable prompt-cache writes because these one-off prompts are unlikely to be reused."

## Timeline

- 2026-09-11 new_claim `clm_8d8d4c1628d8` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_ffe883da9a45` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_424056cf5ae9` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_368deae620d9` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_71a19f64f88b` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_07c0f6c720a3` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_d65893ecf0db` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_be8b43ff7593` (src_92c377275d79)

## Related

- → applies_to [[context-window]] (0.93)
- → applies_to [[tool-results]] (0.93)
- ← uses [[pi]] (0.93)
- ← applies_to [[pi-extension]] (0.93)
- → applies_to [[session]] (0.93)
- [[pi]] — 8 shared claims
- [[tool-results]] — 2 shared claims
- [[context-window]] — 1 shared claim
- [[pi-extension]] — 1 shared claim
- [[session]] — 1 shared claim
