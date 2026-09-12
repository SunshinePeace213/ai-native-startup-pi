---
type: system
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_claude_opus_5]
claim_ids: [clm_a5e46d967548, clm_ad10275e9301, clm_176a1b0b4554, clm_2bd0da02bf11, clm_45fbc544515a, clm_d14e11fac1d7, clm_d30741f36b3c]
confidence: 0.94
stale_after: 2029-10-26
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# Claude Opus 5

> **In here:** Claude Opus 5 verifies its own work without being told to, so explicit verification instructions carried over from earlier prompts cause over-verification and removing them reduces wasted tokens… · 7 claims, confidence 0.94.

## Current understanding

- A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter (0.99)
- Claude Opus 5 verifies its own work without being told to, so explicit verification instructions carried over from earlier prompts cause over-verification and removing them reduces wasted tokens with no loss in quality (0.93)
- On Claude Opus 5 low and medium effort produce strong quality at a fraction of the tokens and latency of higher settings, so they serve as the primary control for token cost and response time wherever quality holds, with xhigh reserved for demanding coding and agentic work (0.93)
- Claude Opus 5 carries a 1M token context window as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout that window (0.93)
- Claude Opus 5 delegates to subagents more readily than prior models, and delegation pays off only on genuinely independent, sizeable tracks of work — applied to small tasks it multiplies cost and time (0.93)
- Claude Opus 5's default user-facing responses run longer than prior Opus models, and because effort controls how much the model thinks rather than how much it says, lowering effort does not reliably shorten the visible response — response length has to be prompted for explicitly (0.93)
- With thinking disabled Claude Opus 5 can leak a tool call into user-facing text or emit internal XML tags, and the primary mitigation for both is to keep thinking enabled and control cost with lower effort instead — thinking enabled at low effort outperforms thinking disabled at similar cost (0.93)

## Evidence

- `clm_a5e46d967548` — "A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter" · p 0.99 · active · 2 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "ask it to report everything and filter in a separate pass instead"
  - `src_1d5f4c9615f1` Code Review: "When a review runs, multiple agents analyze the diff and surrounding code in parallel on Anthropic infrastructure."
- `clm_ad10275e9301` — "Claude Opus 5 verifies its own work without being told to, so explicit verification instructions carried over from earlier prompts cause over-verification and removing them reduces wasted tokens with no loss in quality" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "instructions like these cause over-verification on Claude Opus 5, and removing them reduces wasted tokens with no loss in quality"
- `clm_176a1b0b4554` — "On Claude Opus 5 low and medium effort produce strong quality at a fraction of the tokens and latency of higher settings, so they serve as the primary control for token cost and response time wherever quality holds, with xhigh reserved for demanding coding and agentic work" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "use `low` and `medium` liberally as your primary control for token cost and response time wherever quality holds, and step up to `xhigh` for demanding coding and agentic work"
- `clm_2bd0da02bf11` — "Claude Opus 5 carries a 1M token context window as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout that window" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout the window"
- `clm_45fbc544515a` — "Claude Opus 5 delegates to subagents more readily than prior models, and delegation pays off only on genuinely independent, sizeable tracks of work — applied to small tasks it multiplies cost and time" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "Claude Opus 5 delegates to subagents more readily than prior models. Delegation pays off on genuinely independent, sizeable tracks of work, but it multiplies cost and time when applied to small tasks."
- `clm_d14e11fac1d7` — "Claude Opus 5's default user-facing responses run longer than prior Opus models, and because effort controls how much the model thinks rather than how much it says, lowering effort does not reliably shorten the visible response — response length has to be prompted for explicitly" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "lowering effort can reduce thinking volume without reliably shortening the visible response. To control response length, prompt for it explicitly."
- `clm_d30741f36b3c` — "With thinking disabled Claude Opus 5 can leak a tool call into user-facing text or emit internal XML tags, and the primary mitigation for both is to keep thinking enabled and control cost with lower effort instead — thinking enabled at low effort outperforms thinking disabled at similar cost" · p 0.93 · active · 1 support · 0 contradict · when: when thinking is disabled
  - `src_26d415487f93` prompting-claude-opus-5: "With thinking disabled, two artifacts can occasionally appear in the model's visible output."

## Timeline

- 2026-08-23 new_claim `clm_ad10275e9301` (src_26d415487f93)
- 2026-08-23 new_claim `clm_d14e11fac1d7` (src_26d415487f93)
- 2026-08-23 new_claim `clm_45fbc544515a` (src_26d415487f93)
- 2026-08-23 new_claim `clm_a5e46d967548` (src_26d415487f93)
- 2026-08-23 new_claim `clm_176a1b0b4554` (src_26d415487f93)
- 2026-08-23 new_claim `clm_2bd0da02bf11` (src_26d415487f93)
- 2026-08-23 new_claim `clm_d30741f36b3c` (src_26d415487f93)
- 2026-08-30 support_update `clm_a5e46d967548` (src_1d5f4c9615f1)

## Related

- → uses [[effort-level]] (0.99)
- → uses [[adaptive-thinking]] (0.93)
- → uses [[context-window]] (0.93)
- → uses [[subagents]] (0.93)
- ← applies_to [[code-review]] (0.91)
- [[effort-level]] — 2 shared claims
- [[subagents]] — 2 shared claims
- [[adaptive-thinking]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[context-window]] — 1 shared claim
