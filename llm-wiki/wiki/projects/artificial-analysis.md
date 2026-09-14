---
type: project
status: current
created: 2026-09-12
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/automationbench-aa.md, title: "AutomationBench-AA: Agentic SaaS Workflow Benchmark", id: src_3fd111830533}
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/articles/artificial-analysis/gpt-5-6-has-landed.md, title: "GPT-5.6 benchmarks across Intelligence, Speed and Cost", id: src_c49e34d6a671}
  - {resource: llm-wiki/raw/articles/artificial-analysis/omniscience.md, title: "AA-Omniscience: Knowledge and Hallucination Benchmark", id: src_c197533a04c8}
  - {resource: llm-wiki/raw/articles/artificial-analysis/terminalbench-v4-0.md, title: "Terminal-Bench v4.0 Benchmark Leaderboard", id: src_28e09fc746e0}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_artificial_analysis]
claim_ids: [clm_094644aafda5, clm_3d8a0aa2d11b, clm_6a1bf4c90bea, clm_88c22c65b789, clm_ab79a21fe203, clm_4ed7faf79e21, clm_94f937808acc, clm_b33fcb0a8223, clm_2b15ffa95160, clm_3cf4d9ede51e, clm_a50b6a0ab8de, clm_d79a4bcae597, clm_e4d11c464ecb, clm_f527db1617d8, clm_da97be70653e, clm_f16689ccb5bd]
confidence: 0.83
stale_after: 2027-04-19
last_rendered: 2026-09-14T19:58:09Z
review_required: false
---

# Artificial Analysis

> **In here:** Artificial Analysis — 16 claims, confidence 0.83, 5 sources.

## Current understanding

- On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1% (0.96)
- GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose (0.95)
- Artificial Analysis runs all 66 Terminal-Bench v4.0 tasks itself and reports pass@1 averaged over three repeats per task (0.83)
- AutomationBench-AA's headline metric is the average share of a task's objectives completed without guardrail violations, not the fully-completed-task percentage Zapier's own hosted leaderboard reports, so the two leaderboards' numbers are not comparable (0.83)
- Artificial Analysis cross-plots the AA-Omniscience Index against its Intelligence Index to show that knowledge reliability does not track overall intelligence-index rank (0.81)
- At max effort GPT-6 Astra uses about 27k output tokens per Intelligence Index task, roughly a third of Claude Fable 5.1's 78k for the same score (0.81)
- GPT-6 Astra gains about 90 Elo on AA-Briefcase long-horizon knowledge work over GPT-5.6 Sol but loses Presentation Quality Elo, where Sol at max still leads every model (0.81)
- On Artificial Analysis's indices GPT-6 Astra ties Claude Fable 5.1 for first place — 53 on the Intelligence Index and 62 on the Coding Agent Index — at roughly 40% and 60% of Fable's cost per task respectively (0.81)
- On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5 (0.81)
- On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54) (0.81)
- GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol (0.81)
- GPT-5.6 Sol at max has the highest Presentation Elo of any model on AA-Briefcase — its PowerPoint and Excel outputs are the most visually attractive — while ranking second to Claude Fable 5 overall (0.80)
- GPT-5.6 Terra is dominated: at every Terra effort level there is a Luna or Sol effort level that is more intelligent at no extra cost or equally intelligent at lower cost, because Luna and Sol are always on the Pareto frontier ahead of Terra (0.80)
- On Artificial Analysis Intelligence Index v4.1 GPT-5.6 Sol at max scores 59, one point below Claude Fable 5, at about one third of the cost per task ($1.04); Terra and Luna score 55 and 51 at $0.55 and $0.21 per task (0.80)
- GPT-5.6 Luna at max matches or exceeds GLM-5.2 at max and Gemini 3.5 Flash on the Intelligence Index at lower cost, scoring 51 at $0.21 per task (0.79)
- On Artificial Analysis Coding Agent Index v1.1 GPT-5.6 Sol at max in Codex scores 80, leading all three evaluations, with Terra and Luna at 77 and 75 at about 60% and 80% lower per-task cost — an earlier index version whose scores are not comparable with the later Astra-era index (0.79)

## Evidence

- `clm_094644aafda5` — "On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1%." · p 0.96 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra scores 59% on Terminal-Bench v4.0, ahead of Claude Fable 5.1 (52%) and 19 points ahead of GPT-5.6 Sol (40%)."
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "GPT-6 Astra (xhigh) scores the highest on Terminal-Bench v4.0 with a score of 59.6%, followed by GPT-6 Astra (max) with a score of 59.1% and Claude Fable 5.1 (Adaptive Reasoning, Xhigh Effort, Default Fallback) with a score of 55.1%."
- `clm_3d8a0aa2d11b` — "GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose." · p 0.95 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "This is driven by a significant decrease in hallucination rate from 92% to 51% at max effort."
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "| GPT-6 Astra (high) | 44.8% | | GPT-6 Astra (medium) | 46.5% | | GPT-6 Astra (xhigh) | 48.3% | | GPT-6 Astra (max) | 51.3% |"
- `clm_6a1bf4c90bea` — "Artificial Analysis runs all 66 Terminal-Bench v4.0 tasks itself and reports pass@1 averaged over three repeats per task." · p 0.83 · active · 1 support · 0 contradict
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "We run all 66 Terminal-Bench v4.0 tasks and report pass@1 averaged over three repeats per task."
- `clm_88c22c65b789` — "AutomationBench-AA's headline metric is the average share of a task's objectives completed without guardrail violations, not the fully-completed-task percentage Zapier's own hosted leaderboard reports, so the two leaderboards' numbers are not comparable." · p 0.83 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "Unlike Zapier's own hosted AutomationBench leaderboard, which reports the percentage of tasks completed fully, AutomationBench-AA uses a headline metric representing the average share of each task's objectives a model completes without…"
- `clm_ab79a21fe203` — "Artificial Analysis cross-plots the AA-Omniscience Index against its Intelligence Index to show that knowledge reliability does not track overall intelligence-index rank." · p 0.81 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "The page cross-plots the AA-Omniscience Index against the general-purpose Artificial Analysis Intelligence Index (v4.3), illustrating that knowledge reliability does not track overall intelligence-index rank."
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
- `clm_a50b6a0ab8de` — "GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "24 per task at max effort, compared to 45 for GPT-5.6 Sol and 60 turns per task for Claude Fable 5.1 and Claude Opus 5."
- `clm_d79a4bcae597` — "GPT-5.6 Sol at max has the highest Presentation Elo of any model on AA-Briefcase — its PowerPoint and Excel outputs are the most visually attractive — while ranking second to Claude Fable 5 overall." · p 0.80 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) ranks second only to Claude Fable 5 (max) in AA-Briefcase, and has the highest Presentation Elo of any model."
- `clm_e4d11c464ecb` — "GPT-5.6 Terra is dominated: at every Terra effort level there is a Luna or Sol effort level that is more intelligent at no extra cost or equally intelligent at lower cost, because Luna and Sol are always on the Pareto frontier ahead of Terra." · p 0.80 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "Notably, Luna and Sol are always on the Pareto frontier ahead of Terra."
- `clm_f527db1617d8` — "On Artificial Analysis Intelligence Index v4.1 GPT-5.6 Sol at max scores 59, one point below Claude Fable 5, at about one third of the cost per task ($1.04); Terra and Luna score 55 and 51 at $0.55 and $0.21 per task." · p 0.80 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) scores 1 point below Claude Fable 5 (max) in the Artificial Analysis Intelligence Index at 59 points, at approximately one third of the cost. GPT-5.6 Terra (max) and Luna (max) score 55 and 51 respectively"
- `clm_da97be70653e` — "GPT-5.6 Luna at max matches or exceeds GLM-5.2 at max and Gemini 3.5 Flash on the Intelligence Index at lower cost, scoring 51 at $0.21 per task." · p 0.79 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Luna (max) matches or exceeds the intelligence of GLM-5.2 (max) and Gemini 3.5 Flash at a lower cost."
- `clm_f16689ccb5bd` — "On Artificial Analysis Coding Agent Index v1.1 GPT-5.6 Sol at max in Codex scores 80, leading all three evaluations, with Terra and Luna at 77 and 75 at about 60% and 80% lower per-task cost — an earlier index version whose scores are not comparable with the later Astra-era index." · p 0.79 · active · 1 support · 0 contradict · when: Coding Agent Index v1.1, pre-Astra
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) in Codex scores 80 in the Index, leading in all three evaluations"

## Timeline

- 2026-09-12 new_claim `clm_b33fcb0a8223` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_3cf4d9ede51e` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_2b15ffa95160` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_4ed7faf79e21` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_a50b6a0ab8de` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_3d8a0aa2d11b` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_94f937808acc` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_094644aafda5` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_f527db1617d8` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_e4d11c464ecb` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_da97be70653e` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_f16689ccb5bd` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_d79a4bcae597` (src_c49e34d6a671)
- 2026-09-14 support_update `clm_094644aafda5` (src_28e09fc746e0)
- 2026-09-14 new_claim `clm_6a1bf4c90bea` (src_28e09fc746e0)
- 2026-09-14 support_update `clm_3d8a0aa2d11b` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_ab79a21fe203` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_88c22c65b789` (src_3fd111830533)

## Related

- → uses [[automationbench]] (0.83)
- → uses [[terminal-bench]] (0.83)
- → produces [[aa-omniscience]] (0.81)
- [[gpt-5-6-sol]] — 9 shared claims
- [[gpt-6-astra]] — 8 shared claims
- [[claude-fable-5-1]] — 6 shared claims
- [[gpt-5-6-luna]] — 4 shared claims
- [[claude-opus-5]] — 3 shared claims
- [[gpt-5-6-terra]] — 3 shared claims
- [[claude-fable-5]] — 2 shared claims
- [[terminal-bench]] — 2 shared claims
- [[aa-omniscience]] — 1 shared claim
- [[automationbench]] — 1 shared claim
- [[hallucination]] — 1 shared claim
