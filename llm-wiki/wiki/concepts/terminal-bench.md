---
type: concept
status: current
created: 2026-09-14
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/articles/artificial-analysis/terminalbench-v4-0.md, title: "Terminal-Bench v4.0 Benchmark Leaderboard", id: src_28e09fc746e0}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_terminal_bench]
claim_ids: [clm_094644aafda5, clm_6a1bf4c90bea, clm_ad4d164c2d5b, clm_62267246343e, clm_9a4f05308cbd]
confidence: 0.84
stale_after: 2027-04-26
last_rendered: 2026-09-14T19:58:11Z
review_required: false
---

# Terminal-Bench

> **In here:** Terminal-Bench v4.0 recalibrates compute and time allowances, improves instructions, environments and verifiers, and removes eight tasks that were saturated, refusal-prone, publicly solved, or… · 5 claims, confidence 0.84.

## Current understanding

- On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1% (0.96)
- Artificial Analysis runs all 66 Terminal-Bench v4.0 tasks itself and reports pass@1 averaged over three repeats per task (0.83)
- Terminal-Bench v4.0 is a 66-task agentic terminal benchmark from the Laude Institute, Stanford University researchers, and open-source contributors, spanning software, machine learning, science, operations, security, hardware, and media (0.83)
- Terminal-Bench v4.0 recalibrates compute and time allowances, improves instructions, environments and verifiers, and removes eight tasks that were saturated, refusal-prone, publicly solved, or affected by quality issues, so its scores are not comparable with earlier versions (0.81)
- The publication linked from the Terminal-Bench v4.0 leaderboard describes Terminal-Bench 2.0 and its 89 tasks, not the 66-task v4.0 set the leaderboard scores, so the paper's headline numbers do not describe the scores shown (0.78)

## Evidence

- `clm_094644aafda5` — "On Terminal-Bench v4.0 GPT-6 Astra at xhigh scores 59.6% and at max 59.1%, ahead of Claude Fable 5.1 at xhigh effort on 55.1%." · p 0.96 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra scores 59% on Terminal-Bench v4.0, ahead of Claude Fable 5.1 (52%) and 19 points ahead of GPT-5.6 Sol (40%)."
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "GPT-6 Astra (xhigh) scores the highest on Terminal-Bench v4.0 with a score of 59.6%, followed by GPT-6 Astra (max) with a score of 59.1% and Claude Fable 5.1 (Adaptive Reasoning, Xhigh Effort, Default Fallback) with a score of 55.1%."
- `clm_6a1bf4c90bea` — "Artificial Analysis runs all 66 Terminal-Bench v4.0 tasks itself and reports pass@1 averaged over three repeats per task." · p 0.83 · active · 1 support · 0 contradict
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "We run all 66 Terminal-Bench v4.0 tasks and report pass@1 averaged over three repeats per task."
- `clm_ad4d164c2d5b` — "Terminal-Bench v4.0 is a 66-task agentic terminal benchmark from the Laude Institute, Stanford University researchers, and open-source contributors, spanning software, machine learning, science, operations, security, hardware, and media." · p 0.83 · active · 1 support · 0 contradict
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "Terminal-Bench v4.0 is a harder agentic terminal benchmark from the [Laude Institute](https://www.laude.org/), Stanford University researchers, and open-source contributors."
- `clm_62267246343e` — "Terminal-Bench v4.0 recalibrates compute and time allowances, improves instructions, environments and verifiers, and removes eight tasks that were saturated, refusal-prone, publicly solved, or affected by quality issues, so its scores are not comparable with earlier versions." · p 0.81 · active · 1 support · 0 contradict
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "The v4.0 release recalibrates compute and time allowances, improves the fairness of instructions, environments, and verifiers, and removes eight tasks that were saturated, refusal-prone, publicly solved, or affected by unresolved quality…"
- `clm_9a4f05308cbd` — "The publication linked from the Terminal-Bench v4.0 leaderboard describes Terminal-Bench 2.0 and its 89 tasks, not the 66-task v4.0 set the leaderboard scores, so the paper's headline numbers do not describe the scores shown." · p 0.78 · active · 1 support · 0 contradict
  - `src_28e09fc746e0` Terminal-Bench v4.0 Benchmark Leaderboard: "we present Terminal-Bench 2.0: a carefully curated hard benchmark composed of 89 tasks in computer terminal environments inspired by problems from real workflows."

## Timeline

- 2026-09-12 new_claim `clm_094644aafda5` (src_1a690917c61d)
- 2026-09-14 support_update `clm_094644aafda5` (src_28e09fc746e0)
- 2026-09-14 new_claim `clm_ad4d164c2d5b` (src_28e09fc746e0)
- 2026-09-14 new_claim `clm_62267246343e` (src_28e09fc746e0)
- 2026-09-14 new_claim `clm_6a1bf4c90bea` (src_28e09fc746e0)
- 2026-09-14 new_claim `clm_9a4f05308cbd` (src_28e09fc746e0)

## Related

- ← produces Laude Institute (no page yet) (0.83)
- ← related_to [[gpt-6-astra]] (0.83)
- ← uses [[artificial-analysis]] (0.83)
- [[artificial-analysis]] — 2 shared claims
- [[claude-fable-5-1]] — 1 shared claim
- [[gpt-5-6-sol]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
- Laude Institute (no page yet)
