---
type: system
status: current
created: 2026-09-12
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/automationbench-aa.md, title: "AutomationBench-AA: Agentic SaaS Workflow Benchmark", id: src_3fd111830533}
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/articles/artificial-analysis/omniscience.md, title: "AA-Omniscience: Knowledge and Hallucination Benchmark", id: src_c197533a04c8}
  - {resource: llm-wiki/raw/articles/artificial-analysis/terminalbench-v4-0.md, title: "Terminal-Bench v4.0 Benchmark Leaderboard", id: src_28e09fc746e0}
  - {resource: llm-wiki/raw/articles/datacurve/deepswe-v1-1.md, title: "DeepSWE v1.1", id: src_74863c70ef6c}
  - {resource: llm-wiki/raw/articles/mercor/apex-agents-leaderboard.md, title: "The AI Productivity Index for Agents", id: src_3858898cebb3}
  - {resource: llm-wiki/raw/docs/openai/guides-reasoning.md, title: "Reasoning models", id: src_7fcd56977d57}
  - {resource: llm-wiki/raw/docs/openai/models-gpt-6-astra.md, title: "GPT-6 Astra", id: src_5fbc74a9d0b2}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_gpt_6_astra]
claim_ids: [clm_094644aafda5, clm_3d8a0aa2d11b, clm_44d4b23cec26, clm_51440bd7a6d9, clm_631dab2e5c9f, clm_af58081c4617, clm_bcec285b79ec, clm_46e3c15120c2, clm_56f905a63307, clm_90f666969a1a, clm_9e1d6aa8e826, clm_6111a2f83575, clm_a75b4d41b36f, clm_70222fe06a5d, clm_f88d52405cba, clm_13f4f5cb2042, clm_4ed7faf79e21, clm_94f937808acc, clm_b33fcb0a8223, clm_2b15ffa95160, clm_3cf4d9ede51e, clm_4f24f36ff7b8, clm_2d9fb7740370, clm_a50b6a0ab8de, clm_458be0d9c81d]
confidence: 0.87
stale_after: 2026-12-07
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# GPT-6 Astra

> **In here:** GPT-6 Astra lists at $10 per million input tokens, $1 cached input, $12.50 cache writes, and $50 per million output tokens · 25 claims, confidence 0.87.

## Current understanding

- On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1% (0.96)
- GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose (0.95)
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
- On AutomationBench-AA DeepSeek V4.1 Flash leads at 68.9%, ahead of GPT-6 Astra at max on 68.5% and at xhigh on 67.2% (0.83)
- On the APEX-Agents corporate-lawyer job GPT-6 Astra leads at 73.4, ahead of Claude Fable 5.1 at 71.9 and Claude Opus 5 at 70 (0.81)
- On AutomationBench-AA GPT-6 Astra at max completes 88.8% of objectives but scores only 41.6% strict and 68.5% headline while breaking 0.444 guardrails per task, so policy adherence rather than task competence is what the benchmark exposes (0.81)
- On the AA-Omniscience Index GPT-6 Astra (high) leads at 43.73, with Claude Fable 5.1 (max with fallback) at 43.45 and two further GPT-6 Astra settings at 43.42 and 43.40 — the top four inside a third of a point (0.81)
- At max effort GPT-6 Astra uses about 27k output tokens per Intelligence Index task, roughly a third of Claude Fable 5.1's 78k for the same score (0.81)
- GPT-6 Astra gains about 90 Elo on AA-Briefcase long-horizon knowledge work over GPT-5.6 Sol but loses Presentation Quality Elo, where Sol at max still leads every model (0.81)
- On Artificial Analysis's indices GPT-6 Astra ties Claude Fable 5.1 for first place — 53 on the Intelligence Index and 62 on the Coding Agent Index — at roughly 40% and 60% of Fable's cost per task respectively (0.81)
- On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5 (0.81)
- On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54) (0.81)
- Equal DeepSWE pass rates hide very different trajectories: GPT-6 Astra reaches 74% in 29 steps and 30k output tokens where Gemini 3.8 Flash needs 166 steps and 143k tokens for the same score (0.81)
- DeepSWE v1.1 puts GPT-6 Astra at xhigh, Gemini 3.8 Flash at high, and Claude Opus 5 at max in a three-way tie at 74% pass@1 on costs of $6.52, $2.36, and $11.84 per task (0.81)
- GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol (0.81)
- On Terminal-Bench v4.0 GPT-6 Astra's xhigh setting scores above its max setting (59.6% against 59.1%), so a model's highest labelled effort is not automatically its best-scoring one (0.80)

## Evidence

- `clm_094644aafda5` — "On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1%." · p 0.96 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra scores 59% on Terminal-Bench v4.0, ahead of Claude Fable 5.1 (52%) and 19 points ahead of GPT-5.6 Sol (40%)."
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "GPT-6 Astra (xhigh) scores the highest on Terminal-Bench v4.0 with a score of 59.6%, followed by GPT-6 Astra (max) with a score of 59.1% and Claude Fable 5.1 (Adaptive Reasoning, Xhigh Effort, Default Fallback) with a score of 55.1%."
- `clm_3d8a0aa2d11b` — "GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose." · p 0.95 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "This is driven by a significant decrease in hallucination rate from 92% to 51% at max effort."
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "| GPT-6 Astra (high) | 44.8% | | GPT-6 Astra (medium) | 46.5% | | GPT-6 Astra (xhigh) | 48.3% | | GPT-6 Astra (max) | 51.3% |"
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
- `clm_a75b4d41b36f` — "On AutomationBench-AA DeepSeek V4.1 Flash leads at 68.9%, ahead of GPT-6 Astra at max on 68.5% and at xhigh on 67.2%." · p 0.83 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "DeepSeek V4.1 Flash (Reasoning, Max Effort) scores the highest on AutomationBench-AA with a score of 68.9%, followed by GPT-6 Astra (max) with a score of 68.5% and GPT-6 Astra (xhigh) with a score of 67.2%."
- `clm_70222fe06a5d` — "On the APEX-Agents corporate-lawyer job GPT-6 Astra leads at 73.4, ahead of Claude Fable 5.1 at 71.9 and Claude Opus 5 at 70." · p 0.81 · active · 1 support · 0 contradict · when: corporate lawyer job
  - `src_3858898cebb3` The AI Productivity Index for Agents: "Top displayed scores: GPT-6 Astra 73.4, Fable 5.1 71.9, Opus 5 70"
- `clm_f88d52405cba` — "On AutomationBench-AA GPT-6 Astra at max completes 88.8% of objectives but scores only 41.6% strict and 68.5% headline while breaking 0.444 guardrails per task, so policy adherence rather than task competence is what the benchmark exposes." · p 0.81 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "| GPT-6 Astra (max) | 68.5% | 41.6% | 88.8% | 292 | 0.444 | 22822 | 657 | 13826 | 53882 |"
- `clm_13f4f5cb2042` — "On the AA-Omniscience Index GPT-6 Astra (high) leads at 43.73, with Claude Fable 5.1 (max with fallback) at 43.45 and two further GPT-6 Astra settings at 43.42 and 43.40 — the top four inside a third of a point." · p 0.81 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "| GPT-6 Astra (high) | 43.73 | | Claude Fable 5.1 (max with fallback) | 43.45 | | GPT-6 Astra (xhigh) | 43.42 | | GPT-6 Astra (max) | 43.40 |"
- `clm_4ed7faf79e21` — "At max effort GPT-6 Astra uses about 27k output tokens per Intelligence Index task, roughly a third of Claude Fable 5.1's 78k for the same score." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "At max effort, Astra uses 27k output tokens per task, about a third of Claude Fable 5.1 (max with fallback) at 78k, for the same score."
- `clm_94f937808acc` — "GPT-6 Astra gains about 90 Elo on AA-Briefcase long-horizon knowledge work over GPT-5.6 Sol but loses Presentation Quality Elo, where Sol at max still leads every model." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "but a reduction in Presentation Quality Elo, where GPT-5.6 Sol (max) still leads all models."
- `clm_b33fcb0a8223` — "On Artificial Analysis's indices GPT-6 Astra ties Claude Fable 5.1 for first place — 53 on the Intelligence Index and 62 on the Coding Agent Index — at roughly 40% and 60% of Fable's cost per task respectively." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra ties leadership with Claude Fable 5.1 in both of our flagship Indices, at lower cost. Astra equals Fable 5.1 in the Intelligence Index at ~40% of the cost, and in the Coding Agent Index at ~60% of the cost."
- `clm_2b15ffa95160` — "On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "Every reasoning effort of GPT-6 Astra sits on the Intelligence Index vs Cost per Task frontier, from low at $0.82 per task to max at $3.26."
- `clm_3cf4d9ede51e` — "On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54)." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "In Codex, GPT-6 Astra scores 62 in the Index, level with Claude Fable 5.1 in Claude Code (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55) and Muse Spark 1.3 in Muse Code (54)."
- `clm_4f24f36ff7b8` — "Equal DeepSWE pass rates hide very different trajectories: GPT-6 Astra reaches 74% in 29 steps and 30k output tokens where Gemini 3.8 Flash needs 166 steps and 143k tokens for the same score." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "gpt-6-astra[xhigh] 74%±3% Avg cost $6.52Out tok 30kSteps 29 74%±3% $6.52 30k 29 gemini-3.8-flash[high] 74%±1% Avg cost $2.36Out tok 143kSteps 166"
- `clm_2d9fb7740370` — "DeepSWE v1.1 puts GPT-6 Astra at xhigh, Gemini 3.8 Flash at high, and Claude Opus 5 at max in a three-way tie at 74% pass@1 on costs of $6.52, $2.36, and $11.84 per task." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "gpt-6-astra[xhigh] 74%±3% Avg cost $6.52Out tok 30kSteps 29 74%±3% $6.52 30k 29 gemini-3.8-flash[high] 74%±1% Avg cost $2.36Out tok 143kSteps 166 74%±1% $2.36 143k 166 claude-opus-5[max] 74%±4% Avg cost $11.84Out tok 118kSteps 99 74%±4%…"
- `clm_a50b6a0ab8de` — "GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "24 per task at max effort, compared to 45 for GPT-5.6 Sol and 60 turns per task for Claude Fable 5.1 and Claude Opus 5."
- `clm_458be0d9c81d` — "On Terminal-Bench v4.0 GPT-6 Astra's xhigh setting scores above its max setting (59.6% against 59.1%), so a model's highest labelled effort is not automatically its best-scoring one." · p 0.80 · active · 1 support · 0 contradict
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "GPT-6 Astra (xhigh) scores the highest on Terminal-Bench v4.0 with a score of 59.6%, followed by GPT-6 Astra (max) with a score of 59.1%"

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
- 2026-09-14 support_update `clm_094644aafda5` (src_28e09fc746e0)
- 2026-09-14 new_claim `clm_458be0d9c81d` (src_28e09fc746e0)
- 2026-09-14 new_claim `clm_13f4f5cb2042` (src_c197533a04c8)
- 2026-09-14 support_update `clm_3d8a0aa2d11b` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_a75b4d41b36f` (src_3fd111830533)
- 2026-09-14 new_claim `clm_f88d52405cba` (src_3fd111830533)
- 2026-09-14 new_claim `clm_70222fe06a5d` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_2d9fb7740370` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_4f24f36ff7b8` (src_74863c70ef6c)

## Related

- → uses [[effort-level]] (0.98)
- → related_to [[terminal-bench]] (0.83)
- → related_to [[aa-omniscience]] (0.81)
- → related_to [[claude-fable-5-1]] (0.81)
- [[artificial-analysis]] — 8 shared claims
- [[claude-fable-5-1]] — 7 shared claims
- [[effort-level]] — 5 shared claims
- [[gpt-5-6-sol]] — 5 shared claims
- [[claude-opus-5]] — 4 shared claims
- [[aa-omniscience]] — 1 shared claim
- [[apex-agents]] — 1 shared claim
- [[automationbench]] — 1 shared claim
- [[deepswe]] — 1 shared claim
- [[gemini-3-8-flash]] — 1 shared claim
- [[gpt-5-6-luna]] — 1 shared claim
- [[gpt-5-6-terra]] — 1 shared claim
- [[guardrail]] — 1 shared claim
- [[hallucination]] — 1 shared claim
- [[terminal-bench]] — 1 shared claim
- DeepSeek V4.1 Flash (no page yet)
