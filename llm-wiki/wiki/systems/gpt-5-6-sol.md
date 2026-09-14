---
type: system
status: current
created: 2026-09-12
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/articles/artificial-analysis/gpt-5-6-has-landed.md, title: "GPT-5.6 benchmarks across Intelligence, Speed and Cost", id: src_c49e34d6a671}
  - {resource: llm-wiki/raw/articles/artificial-analysis/omniscience.md, title: "AA-Omniscience: Knowledge and Hallucination Benchmark", id: src_c197533a04c8}
  - {resource: llm-wiki/raw/articles/artificial-analysis/terminalbench-v4-0.md, title: "Terminal-Bench v4.0 Benchmark Leaderboard", id: src_28e09fc746e0}
  - {resource: llm-wiki/raw/articles/openai/gpt-5-6.md, title: "gpt-5-6", id: src_6556cffbfc4e}
  - {resource: llm-wiki/raw/docs/openai/guides-reasoning.md, title: "Reasoning models", id: src_7fcd56977d57}
  - {resource: llm-wiki/raw/docs/openai/models-gpt-5-6-sol.md, title: "GPT-5.6 Sol", id: src_2799e7222597}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_gpt_5_6_sol]
claim_ids: [clm_094644aafda5, clm_3d8a0aa2d11b, clm_37bde4514ecc, clm_f555a40cd92e, clm_dabd79929390, clm_60ac29d854e8, clm_c9de5ea3f012, clm_bd0ee904fec9, clm_94f937808acc, clm_3cf4d9ede51e, clm_a50b6a0ab8de, clm_d79a4bcae597, clm_e4d11c464ecb, clm_f527db1617d8, clm_34a7772523ea, clm_f16689ccb5bd, clm_10eddef12f8d]
confidence: 0.85
stale_after: 2026-11-21
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# GPT-5.6 Sol

> **In here:** GPT-5.6 Sol is the flagship of the GPT-5.6 family and corresponds to the unsuffixed model tier of earlier GPT-5 families; the gpt-5.6 alias routes to it · 17 claims, confidence 0.85.

## Current understanding

- On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1% (0.96)
- GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose (0.95)
- GPT-5.6 Sol is the flagship of the GPT-5.6 family and corresponds to the unsuffixed model tier of earlier GPT-5 families; the gpt-5.6 alias routes to it (0.92)
- GPT-5.6 Sol costs $4 per million input tokens, $0.40 cached input, and $20 per million output tokens under promotional pricing guaranteed at least through November 21, 2026 (0.92)
- Every GPT-5.6 model — Sol, Terra, and Luna — carries a 1,050,000-token context window, 128,000 max output tokens, and a February 16, 2026 knowledge cutoff (0.92)
- GPT-5.6 Sol, Terra, and Luna accept reasoning.effort none, low, medium, high, xhigh, and max, with medium as the default (0.92)
- On GPT-5.6 models an omitted reasoning.effort defaults to medium, which OpenAI calls the default configuration for most workloads and a well-balanced point on the latency, performance, and cost curve (0.92)
- The GPT-5.6 family is three tiers: Sol the flagship, Terra a balanced model for everyday work, and Luna the most cost-efficient model (0.83)
- GPT-6 Astra gains about 90 Elo on AA-Briefcase long-horizon knowledge work over GPT-5.6 Sol but loses Presentation Quality Elo, where Sol at max still leads every model (0.81)
- On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54) (0.81)
- GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol (0.81)
- GPT-5.6 Sol at max has the highest Presentation Elo of any model on AA-Briefcase — its PowerPoint and Excel outputs are the most visually attractive — while ranking second to Claude Fable 5 overall (0.80)
- GPT-5.6 Terra is dominated: at every Terra effort level there is a Luna or Sol effort level that is more intelligent at no extra cost or equally intelligent at lower cost, because Luna and Sol are always on the Pareto frontier ahead of Terra (0.80)
- On Artificial Analysis Intelligence Index v4.1 GPT-5.6 Sol at max scores 59, one point below Claude Fable 5, at about one third of the cost per task ($1.04); Terra and Luna score 55 and 51 at $0.55 and $0.21 per task (0.80)
- On Agents' Last Exam, a benchmark of long-running professional workflows across 55 fields, OpenAI reports GPT-5.6 Sol at 53.6, 13.1 points above Claude Fable 5, and 11.4 points above it even at medium effort at about a quarter of the estimated cost (0.79)
- On Artificial Analysis Coding Agent Index v1.1 GPT-5.6 Sol at max in Codex scores 80, leading all three evaluations, with Terra and Luna at 77 and 75 at about 60% and 80% lower per-task cost — an earlier index version whose scores are not comparable with the later Astra-era index (0.79)
- GPT-5.6's non-promotional list prices per million input/output tokens are Sol $5/$30, Terra $2.50/$15, and Luna $1/$6, with a 90% cache-read discount and OpenAI's first cache-write premium at 1.25x input (0.78)

## Evidence

- `clm_094644aafda5` — "On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1%." · p 0.96 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra scores 59% on Terminal-Bench v4.0, ahead of Claude Fable 5.1 (52%) and 19 points ahead of GPT-5.6 Sol (40%)."
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "GPT-6 Astra (xhigh) scores the highest on Terminal-Bench v4.0 with a score of 59.6%, followed by GPT-6 Astra (max) with a score of 59.1% and Claude Fable 5.1 (Adaptive Reasoning, Xhigh Effort, Default Fallback) with a score of 55.1%."
- `clm_3d8a0aa2d11b` — "GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose." · p 0.95 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "This is driven by a significant decrease in hallucination rate from 92% to 51% at max effort."
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "| GPT-6 Astra (high) | 44.8% | | GPT-6 Astra (medium) | 46.5% | | GPT-6 Astra (xhigh) | 48.3% | | GPT-6 Astra (max) | 51.3% |"
- `clm_37bde4514ecc` — "GPT-5.6 Sol is the flagship of the GPT-5.6 family and corresponds to the unsuffixed model tier of earlier GPT-5 families; the gpt-5.6 alias routes to it." · p 0.92 · active · 1 support · 0 contradict
  - `src_2799e7222597` GPT-5.6 Sol: "GPT-5.6 Sol is a flagship model in the GPT-5.6 family. It roughly corresponds to the unsuffixed model tier used in earlier GPT-5 families."
- `clm_f555a40cd92e` — "GPT-5.6 Sol costs $4 per million input tokens, $0.40 cached input, and $20 per million output tokens under promotional pricing guaranteed at least through November 21, 2026." · p 0.92 · active · 1 support · 0 contradict · when: promotional pricing through 2026-11-21
  - `src_2799e7222597` GPT-5.6 Sol: "GPT-5.6 Sol costs $4 per million input tokens and $20 per million output tokens, a 20% reduction in input pricing and a 33% reduction in output pricing. GPT-5.6 Sol's promotional pricing is available at least through November 21, 2026."
- `clm_dabd79929390` — "Every GPT-5.6 model — Sol, Terra, and Luna — carries a 1,050,000-token context window, 128,000 max output tokens, and a February 16, 2026 knowledge cutoff." · p 0.92 · active · 1 support · 0 contradict
  - `src_2799e7222597` GPT-5.6 Sol: "- Feb 16, 2026 knowledge cutoff"
- `clm_60ac29d854e8` — "GPT-5.6 Sol, Terra, and Luna accept reasoning.effort none, low, medium, high, xhigh, and max, with medium as the default." · p 0.92 · active · 1 support · 0 contradict
  - `src_2799e7222597` GPT-5.6 Sol: "Reasoning.effort supports: none, low, medium (default), high, xhigh, and max."
- `clm_c9de5ea3f012` — "On GPT-5.6 models an omitted reasoning.effort defaults to medium, which OpenAI calls the default configuration for most workloads and a well-balanced point on the latency, performance, and cost curve." · p 0.92 · active · 1 support · 0 contradict
  - `src_7fcd56977d57` Reasoning models: "If you omit `reasoning.effort`, GPT-5.6 defaults to `medium` in both modes."
- `clm_bd0ee904fec9` — "The GPT-5.6 family is three tiers: Sol the flagship, Terra a balanced model for everyday work, and Luna the most cost-efficient model." · p 0.83 · active · 1 support · 0 contradict
  - `src_6556cffbfc4e` gpt-5-6: "our new flagship, **Sol**, alongside **Terra**, a balanced model for everyday work, and **Luna**, our most cost-efficient model."
- `clm_94f937808acc` — "GPT-6 Astra gains about 90 Elo on AA-Briefcase long-horizon knowledge work over GPT-5.6 Sol but loses Presentation Quality Elo, where Sol at max still leads every model." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "but a reduction in Presentation Quality Elo, where GPT-5.6 Sol (max) still leads all models."
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
- `clm_34a7772523ea` — "On Agents' Last Exam, a benchmark of long-running professional workflows across 55 fields, OpenAI reports GPT-5.6 Sol at 53.6, 13.1 points above Claude Fable 5, and 11.4 points above it even at medium effort at about a quarter of the estimated cost." · p 0.79 · active · 1 support · 0 contradict
  - `src_6556cffbfc4e` gpt-5-6: "GPT‑5.6 Sol sets a new high of 53.6, eclipsing Claude Fable 5 (adaptive reasoning) by 13.1 points. Even at medium reasoning, it beats Fable 5 by 11.4 points at roughly one-quarter the estimated cost."
- `clm_f16689ccb5bd` — "On Artificial Analysis Coding Agent Index v1.1 GPT-5.6 Sol at max in Codex scores 80, leading all three evaluations, with Terra and Luna at 77 and 75 at about 60% and 80% lower per-task cost — an earlier index version whose scores are not comparable with the later Astra-era index." · p 0.79 · active · 1 support · 0 contradict · when: Coding Agent Index v1.1, pre-Astra
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) in Codex scores 80 in the Index, leading in all three evaluations"
- `clm_10eddef12f8d` — "GPT-5.6's non-promotional list prices per million input/output tokens are Sol $5/$30, Terra $2.50/$15, and Luna $1/$6, with a 90% cache-read discount and OpenAI's first cache-write premium at 1.25x input." · p 0.78 · active · 1 support · 0 contradict · when: list price before the July 2026 cuts and the Sol promotion
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "Sol, Terra, and Luna are priced at $5/$30, $2.5/$15, and $1/$6 respectively per million input/output tokens."

## Timeline

- 2026-09-12 new_claim `clm_37bde4514ecc` (src_2799e7222597)
- 2026-09-12 new_claim `clm_60ac29d854e8` (src_2799e7222597)
- 2026-09-12 new_claim `clm_f555a40cd92e` (src_2799e7222597)
- 2026-09-12 new_claim `clm_dabd79929390` (src_2799e7222597)
- 2026-09-12 new_claim `clm_c9de5ea3f012` (src_7fcd56977d57)
- 2026-09-12 new_claim `clm_bd0ee904fec9` (src_6556cffbfc4e)
- 2026-09-12 new_claim `clm_34a7772523ea` (src_6556cffbfc4e)
- 2026-09-12 new_claim `clm_3cf4d9ede51e` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_a50b6a0ab8de` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_3d8a0aa2d11b` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_94f937808acc` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_094644aafda5` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_f527db1617d8` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_e4d11c464ecb` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_f16689ccb5bd` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_d79a4bcae597` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_10eddef12f8d` (src_c49e34d6a671)
- 2026-09-14 support_update `clm_094644aafda5` (src_28e09fc746e0)
- 2026-09-14 support_update `clm_3d8a0aa2d11b` (src_c197533a04c8)

## Related

- → uses [[effort-level]] (0.92)
- [[artificial-analysis]] — 9 shared claims
- [[gpt-5-6-luna]] — 8 shared claims
- [[gpt-5-6-terra]] — 8 shared claims
- [[gpt-6-astra]] — 5 shared claims
- [[claude-fable-5]] — 3 shared claims
- [[claude-fable-5-1]] — 3 shared claims
- [[claude-opus-5]] — 2 shared claims
- [[effort-level]] — 2 shared claims
- [[hallucination]] — 1 shared claim
- [[terminal-bench]] — 1 shared claim
