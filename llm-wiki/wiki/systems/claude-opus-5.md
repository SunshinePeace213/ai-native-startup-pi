---
type: system
status: current
created: 2026-08-23
updated: 2026-09-12
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/docs/anthropic/models-overview.md, title: "Models overview", id: src_963229517470}
  - {resource: llm-wiki/raw/docs/anthropic/pricing.md, title: "pricing", id: src_41365e6aef45}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
generated: {by: process:llm-wiki-render, at: 2026-09-12}
entity_ids: [ent_claude_opus_5]
claim_ids: [clm_a5e46d967548, clm_ad10275e9301, clm_176a1b0b4554, clm_2bd0da02bf11, clm_45fbc544515a, clm_d14e11fac1d7, clm_d30741f36b3c, clm_de413e5598d2, clm_9c0d8265daab, clm_34fc0b797675, clm_41f9da71e4cf, clm_99361b6ce5ac, clm_a6168419f5b5, clm_2b15ffa95160, clm_3cf4d9ede51e, clm_a50b6a0ab8de]
confidence: 0.91
stale_after: 2027-03-22
last_rendered: 2026-09-12T20:30:33Z
review_required: false
---

# Claude Opus 5

> **In here:** Claude Opus 5 verifies its own work without being told to, so explicit verification instructions carried over from earlier prompts cause over-verification and removing them reduces wasted tokens… · 16 claims, confidence 0.91.

## Current understanding

- A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter (0.99)
- Claude Opus 5 verifies its own work without being told to, so explicit verification instructions carried over from earlier prompts cause over-verification and removing them reduces wasted tokens with no loss in quality (0.93)
- On Claude Opus 5 low and medium effort produce strong quality at a fraction of the tokens and latency of higher settings, so they serve as the primary control for token cost and response time wherever quality holds, with xhigh reserved for demanding coding and agentic work (0.93)
- Claude Opus 5 carries a 1M token context window as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout that window (0.93)
- Claude Opus 5 delegates to subagents more readily than prior models, and delegation pays off only on genuinely independent, sizeable tracks of work — applied to small tasks it multiplies cost and time (0.93)
- Claude Opus 5's default user-facing responses run longer than prior Opus models, and because effort controls how much the model thinks rather than how much it says, lowering effort does not reliably shorten the visible response — response length has to be prompted for explicitly (0.93)
- With thinking disabled Claude Opus 5 can leak a tool call into user-facing text or emit internal XML tags, and the primary mitigation for both is to keep thinking enabled and control cost with lower effort instead — thinking enabled at low effort outperforms thinking disabled at similar cost (0.93)
- Anthropic's own routing rule is to start with Claude Opus 5 for most workloads and reach for Claude Fable 5.1 for demanding reasoning and long-horizon agentic work, or when evals on Opus 5 at higher effort still fall short (0.93)
- Fable 5.1 is the escalation from Opus 5: Anthropic names the trigger as evals on Claude Opus 5 at higher effort still falling short (0.93)
- Anthropic's comparative latency ladder runs Fable 5.1 slower, Opus 5 moderate, Sonnet 5 fast, Haiku 4.5 fastest (0.93)
- Claude Haiku 4.5 has a 200K-token context window, 64K max output, and a reliable knowledge cutoff of February 2025, against 1M context, 128K output, and 2026 cutoffs for Sonnet 5, Opus 5, and Fable 5.1 (0.93)
- Claude API list prices per million input/output tokens are Fable 5.1 $10/$50, Opus 5 $5/$25, Sonnet 5 $2/$10, and Haiku 4.5 $1/$5 (0.93)
- Anthropic positions Fable 5.1 for demanding reasoning and long-horizon agentic work, Opus 5 for complex agentic coding and enterprise work, Sonnet 5 as the best combination of speed and intelligence, and Haiku 4.5 as the fastest model with near-frontier intelligence (0.93)
- On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5 (0.81)
- On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54) (0.81)
- GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol (0.81)

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
- `clm_de413e5598d2` — "Anthropic's own routing rule is to start with Claude Opus 5 for most workloads and reach for Claude Fable 5.1 for demanding reasoning and long-horizon agentic work, or when evals on Opus 5 at higher effort still fall short." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "If you're unsure which model to use, start with [Claude Opus 5](https://platform.claude.com/docs/en/models/opus-5/overview) for most workloads."
- `clm_9c0d8265daab` — "Fable 5.1 is the escalation from Opus 5: Anthropic names the trigger as evals on Claude Opus 5 at higher effort still falling short." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "or when your evals on Claude Opus 5 at higher effort still fall short."
- `clm_34fc0b797675` — "Anthropic's comparative latency ladder runs Fable 5.1 slower, Opus 5 moderate, Sonnet 5 fast, Haiku 4.5 fastest." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "| Comparative latency | Slower | Moderate | Fast | Fastest |"
- `clm_41f9da71e4cf` — "Claude Haiku 4.5 has a 200K-token context window, 64K max output, and a reliable knowledge cutoff of February 2025, against 1M context, 128K output, and 2026 cutoffs for Sonnet 5, Opus 5, and Fable 5.1." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "| Reliable knowledge cutoff | Jun 2026 | May 2026 | Jan 2026 | Feb 2025 |"
- `clm_99361b6ce5ac` — "Claude API list prices per million input/output tokens are Fable 5.1 $10/$50, Opus 5 $5/$25, Sonnet 5 $2/$10, and Haiku 4.5 $1/$5." · p 0.93 · active · 1 support · 0 contradict
  - `src_41365e6aef45` pricing: "| Claude Opus 5 | $5 / MTok | $6.25 / MTok | $10 / MTok | $0.50 / MTok | $25 / MTok |"
- `clm_a6168419f5b5` — "Anthropic positions Fable 5.1 for demanding reasoning and long-horizon agentic work, Opus 5 for complex agentic coding and enterprise work, Sonnet 5 as the best combination of speed and intelligence, and Haiku 4.5 as the fastest model with near-frontier intelligence." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "For demanding reasoning and long-horizon agentic work | For complex agentic coding and enterprise work | The best combination of speed and intelligence | The fastest model with near-frontier intelligence"
- `clm_2b15ffa95160` — "On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "Every reasoning effort of GPT-6 Astra sits on the Intelligence Index vs Cost per Task frontier, from low at $0.82 per task to max at $3.26."
- `clm_3cf4d9ede51e` — "On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54)." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "In Codex, GPT-6 Astra scores 62 in the Index, level with Claude Fable 5.1 in Claude Code (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55) and Muse Spark 1.3 in Muse Code (54)."
- `clm_a50b6a0ab8de` — "GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "24 per task at max effort, compared to 45 for GPT-5.6 Sol and 60 turns per task for Claude Fable 5.1 and Claude Opus 5."

## Timeline

- 2026-08-23 new_claim `clm_ad10275e9301` (src_26d415487f93)
- 2026-08-23 new_claim `clm_d14e11fac1d7` (src_26d415487f93)
- 2026-08-23 new_claim `clm_45fbc544515a` (src_26d415487f93)
- 2026-08-23 new_claim `clm_a5e46d967548` (src_26d415487f93)
- 2026-08-23 new_claim `clm_176a1b0b4554` (src_26d415487f93)
- 2026-08-23 new_claim `clm_2bd0da02bf11` (src_26d415487f93)
- 2026-08-23 new_claim `clm_d30741f36b3c` (src_26d415487f93)
- 2026-08-30 support_update `clm_a5e46d967548` (src_1d5f4c9615f1)
- 2026-09-12 new_claim `clm_3cf4d9ede51e` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_2b15ffa95160` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_a50b6a0ab8de` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_de413e5598d2` (src_963229517470)
- 2026-09-12 new_claim `clm_9c0d8265daab` (src_963229517470)
- 2026-09-12 new_claim `clm_41f9da71e4cf` (src_963229517470)
- 2026-09-12 new_claim `clm_34fc0b797675` (src_963229517470)
- 2026-09-12 new_claim `clm_a6168419f5b5` (src_963229517470)
- 2026-09-12 new_claim `clm_99361b6ce5ac` (src_41365e6aef45)

## Related

- → uses [[effort-level]] (0.99)
- ← extends [[claude-fable-5-1]] (0.93)
- → uses [[adaptive-thinking]] (0.93)
- → uses [[context-window]] (0.93)
- → uses [[subagents]] (0.93)
- ← applies_to [[code-review]] (0.91)
- [[claude-fable-5-1]] — 9 shared claims
- [[claude-haiku-4-5]] — 4 shared claims
- [[claude-sonnet-5]] — 4 shared claims
- [[artificial-analysis]] — 3 shared claims
- [[effort-level]] — 3 shared claims
- [[gpt-6-astra]] — 3 shared claims
- [[gpt-5-6-sol]] — 2 shared claims
- [[subagents]] — 2 shared claims
- [[adaptive-thinking]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[context-window]] — 1 shared claim
