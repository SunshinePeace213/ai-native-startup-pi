---
type: system
status: current
created: 2026-09-12
updated: 2026-09-12
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/docs/openai/guides-reasoning.md, title: "Reasoning models", id: src_7fcd56977d57}
  - {resource: llm-wiki/raw/docs/openai/models-gpt-6-astra.md, title: "GPT-6 Astra", id: src_5fbc74a9d0b2}
generated: {by: process:llm-wiki-render, at: 2026-09-12}
entity_ids: [ent_gpt_6_astra]
claim_ids: [clm_44d4b23cec26, clm_51440bd7a6d9, clm_631dab2e5c9f, clm_af58081c4617, clm_bcec285b79ec, clm_46e3c15120c2, clm_56f905a63307, clm_90f666969a1a, clm_9e1d6aa8e826, clm_6111a2f83575, clm_3d8a0aa2d11b, clm_4ed7faf79e21, clm_94f937808acc, clm_b33fcb0a8223, clm_094644aafda5, clm_2b15ffa95160, clm_3cf4d9ede51e, clm_a50b6a0ab8de]
confidence: 0.87
stale_after: 2028-03-18
last_rendered: 2026-09-12T20:30:33Z
review_required: false
---

# GPT-6 Astra

> **In here:** GPT-6 Astra lists at $10 per million input tokens, $1 cached input, $12.50 cache writes, and $50 per million output tokens · 18 claims, confidence 0.87.

## Current understanding

- GPT-6 Astra lists at $10 per million input tokens, $1 cached input, $12.50 cache writes, and $50 per million output tokens (0.92)
- GPT-6 Astra carries a 1,050,000-token context window, 128,000 max output tokens, and an April 30, 2026 knowledge cutoff (0.92)
- OpenAI positions GPT-6 Astra as its most capable model, built for the hardest end-to-end work (0.92)
- On OpenAI's GPT-5.6 and GPT-6 models a request whose input exceeds 272K tokens is billed at 2x input and cache rates and 1.5x output for the whole request, and cache writes cost 1.25x the uncached input rate (0.92)
- GPT-6 Astra's Batch and Flex tiers cost 50% of Standard rates while Fast mode costs 2x the applicable rates (0.92)
- OpenAI recommends high effort for hard reasoning, complex debugging, deep planning, and agentic tasks where quality matters more than latency (0.92)
- Setting reasoning effort to none on GPT-6 Astra returns HTTP 400 — a request migrated from a model that disabled reasoning fails on Astra (0.92)
- OpenAI reserves xhigh for deep research, asynchronous workflows, and long agentic runs, and says to use it only when evals show a clear benefit that justifies the extra latency and cost (0.92)
- GPT-6 Astra's reasoning.effort takes low, medium, high, xhigh, and max — there is no none setting (0.92)
- OpenAI's own routing rule is to start with gpt-6-astra for most reasoning workloads, drop to gpt-5.6-terra for lower cost, and to gpt-5.6-luna for the lowest cost and latency (0.92)
- GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose (0.81)
- At max effort GPT-6 Astra uses about 27k output tokens per Intelligence Index task, roughly a third of Claude Fable 5.1's 78k for the same score (0.81)
- GPT-6 Astra gains about 90 Elo on AA-Briefcase long-horizon knowledge work over GPT-5.6 Sol but loses Presentation Quality Elo, where Sol at max still leads every model (0.81)
- On Artificial Analysis's indices GPT-6 Astra ties Claude Fable 5.1 for first place — 53 on the Intelligence Index and 62 on the Coding Agent Index — at roughly 40% and 60% of Fable's cost per task respectively (0.81)
- On Terminal-Bench v4.0 GPT-6 Astra scores 59%, ahead of Claude Fable 5.1 at 52% and GPT-5.6 Sol at 40% (0.81)
- On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5 (0.81)
- On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54) (0.81)
- GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol (0.81)

## Evidence

- `clm_44d4b23cec26` — "GPT-6 Astra lists at $10 per million input tokens, $1 cached input, $12.50 cache writes, and $50 per million output tokens." · p 0.92 · active · 1 support · 0 contradict
  - `src_5fbc74a9d0b2` GPT-6 Astra: "| Input | $10 | 1M tokens |"
- `clm_51440bd7a6d9` — "GPT-6 Astra carries a 1,050,000-token context window, 128,000 max output tokens, and an April 30, 2026 knowledge cutoff." · p 0.92 · active · 1 support · 0 contradict
  - `src_5fbc74a9d0b2` GPT-6 Astra: "- 1,050,000 context window"
- `clm_631dab2e5c9f` — "OpenAI positions GPT-6 Astra as its most capable model, built for the hardest end-to-end work." · p 0.92 · active · 1 support · 0 contradict
  - `src_5fbc74a9d0b2` GPT-6 Astra: "GPT-6 Astra is our most capable model, built for the hardest end-to-end work."
- `clm_af58081c4617` — "On OpenAI's GPT-5.6 and GPT-6 models a request whose input exceeds 272K tokens is billed at 2x input and cache rates and 1.5x output for the whole request, and cache writes cost 1.25x the uncached input rate." · p 0.92 · active · 1 support · 0 contradict · when: input over 272K tokens
  - `src_5fbc74a9d0b2` GPT-6 Astra: "Prompts with more than 272K input tokens are priced at 2x input and cache rates and 1.5x output for the full request."
- `clm_bcec285b79ec` — "GPT-6 Astra's Batch and Flex tiers cost 50% of Standard rates while Fast mode costs 2x the applicable rates." · p 0.92 · active · 1 support · 0 contradict
  - `src_5fbc74a9d0b2` GPT-6 Astra: "Batch and Flex are priced at 50% of Standard rates. Fast mode is priced at 2x the applicable rates."
- `clm_46e3c15120c2` — "OpenAI recommends high effort for hard reasoning, complex debugging, deep planning, and agentic tasks where quality matters more than latency." · p 0.92 · active · 1 support · 0 contradict
  - `src_7fcd56977d57` Reasoning models: "Hard reasoning, complex debugging, deep planning, and high-value tasks where quality and intelligence matters more than latency. Recommended for complex workflows and agentic tasks."
- `clm_56f905a63307` — "Setting reasoning effort to none on GPT-6 Astra returns HTTP 400 — a request migrated from a model that disabled reasoning fails on Astra." · p 0.92 · active · 1 support · 0 contradict
  - `src_7fcd56977d57` Reasoning models: "does not support `none` reasoning effort. Setting `reasoning.effort` (Responses) or `reasoning_effort` (Chat Completions) to `none` returns HTTP 400."
- `clm_90f666969a1a` — "OpenAI reserves xhigh for deep research, asynchronous workflows, and long agentic runs, and says to use it only when evals show a clear benefit that justifies the extra latency and cost." · p 0.92 · active · 1 support · 0 contradict
  - `src_7fcd56977d57` Reasoning models: "Only use when your evals show a clear benefit that justifies the extra latency and cost."
- `clm_9e1d6aa8e826` — "GPT-6 Astra's reasoning.effort takes low, medium, high, xhigh, and max — there is no none setting." · p 0.92 · active · 1 support · 0 contradict
  - `src_5fbc74a9d0b2` GPT-6 Astra: "`reasoning.effort` supports `low`, `medium`, `high`, `xhigh`, and `max`."
- `clm_6111a2f83575` — "OpenAI's own routing rule is to start with gpt-6-astra for most reasoning workloads, drop to gpt-5.6-terra for lower cost, and to gpt-5.6-luna for the lowest cost and latency." · p 0.92 · active · 1 support · 0 contradict
  - `src_7fcd56977d57` Reasoning models: "Start with `gpt-6-astra` for most reasoning workloads."
- `clm_3d8a0aa2d11b` — "GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "This is driven by a significant decrease in hallucination rate from 92% to 51% at max effort."
- `clm_4ed7faf79e21` — "At max effort GPT-6 Astra uses about 27k output tokens per Intelligence Index task, roughly a third of Claude Fable 5.1's 78k for the same score." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "At max effort, Astra uses 27k output tokens per task, about a third of Claude Fable 5.1 (max with fallback) at 78k, for the same score."
- `clm_94f937808acc` — "GPT-6 Astra gains about 90 Elo on AA-Briefcase long-horizon knowledge work over GPT-5.6 Sol but loses Presentation Quality Elo, where Sol at max still leads every model." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "but a reduction in Presentation Quality Elo, where GPT-5.6 Sol (max) still leads all models."
- `clm_b33fcb0a8223` — "On Artificial Analysis's indices GPT-6 Astra ties Claude Fable 5.1 for first place — 53 on the Intelligence Index and 62 on the Coding Agent Index — at roughly 40% and 60% of Fable's cost per task respectively." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra ties leadership with Claude Fable 5.1 in both of our flagship Indices, at lower cost. Astra equals Fable 5.1 in the Intelligence Index at ~40% of the cost, and in the Coding Agent Index at ~60% of the cost."
- `clm_094644aafda5` — "On Terminal-Bench v4.0 GPT-6 Astra scores 59%, ahead of Claude Fable 5.1 at 52% and GPT-5.6 Sol at 40%." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra scores 59% on Terminal-Bench v4.0, ahead of Claude Fable 5.1 (52%) and 19 points ahead of GPT-5.6 Sol (40%)."
- `clm_2b15ffa95160` — "On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "Every reasoning effort of GPT-6 Astra sits on the Intelligence Index vs Cost per Task frontier, from low at $0.82 per task to max at $3.26."
- `clm_3cf4d9ede51e` — "On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54)." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "In Codex, GPT-6 Astra scores 62 in the Index, level with Claude Fable 5.1 in Claude Code (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55) and Muse Spark 1.3 in Muse Code (54)."
- `clm_a50b6a0ab8de` — "GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "24 per task at max effort, compared to 45 for GPT-5.6 Sol and 60 turns per task for Claude Fable 5.1 and Claude Opus 5."

## Timeline

- 2026-09-12 new_claim `clm_631dab2e5c9f` (src_5fbc74a9d0b2)
- 2026-09-12 new_claim `clm_9e1d6aa8e826` (src_5fbc74a9d0b2)
- 2026-09-12 new_claim `clm_51440bd7a6d9` (src_5fbc74a9d0b2)
- 2026-09-12 new_claim `clm_44d4b23cec26` (src_5fbc74a9d0b2)
- 2026-09-12 new_claim `clm_af58081c4617` (src_5fbc74a9d0b2)
- 2026-09-12 new_claim `clm_bcec285b79ec` (src_5fbc74a9d0b2)
- 2026-09-12 new_claim `clm_6111a2f83575` (src_7fcd56977d57)
- 2026-09-12 new_claim `clm_56f905a63307` (src_7fcd56977d57)
- 2026-09-12 new_claim `clm_90f666969a1a` (src_7fcd56977d57)
- 2026-09-12 new_claim `clm_46e3c15120c2` (src_7fcd56977d57)
- 2026-09-12 new_claim `clm_b33fcb0a8223` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_3cf4d9ede51e` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_2b15ffa95160` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_4ed7faf79e21` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_a50b6a0ab8de` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_3d8a0aa2d11b` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_94f937808acc` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_094644aafda5` (src_1a690917c61d)

## Related

- → uses [[effort-level]] (0.92)
- → related_to [[claude-fable-5-1]] (0.81)
- [[artificial-analysis]] — 8 shared claims
- [[claude-fable-5-1]] — 6 shared claims
- [[gpt-5-6-sol]] — 5 shared claims
- [[effort-level]] — 4 shared claims
- [[claude-opus-5]] — 3 shared claims
- [[gpt-5-6-luna]] — 1 shared claim
- [[gpt-5-6-terra]] — 1 shared claim
