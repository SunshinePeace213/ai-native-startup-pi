---
type: system
status: current
created: 2026-09-12
updated: 2026-09-12
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/gpt-5-6-has-landed.md, title: "GPT-5.6 benchmarks across Intelligence, Speed and Cost", id: src_c49e34d6a671}
  - {resource: llm-wiki/raw/articles/openai/gpt-5-6-price-performance.md, title: "Advancing the price-performance frontier with GPT‑5.6", id: src_5bc744d7e0e1}
  - {resource: llm-wiki/raw/articles/openai/gpt-5-6.md, title: "gpt-5-6", id: src_6556cffbfc4e}
  - {resource: llm-wiki/raw/docs/openai/guides-reasoning.md, title: "Reasoning models", id: src_7fcd56977d57}
  - {resource: llm-wiki/raw/docs/openai/models-gpt-5-6-sol.md, title: "GPT-5.6 Sol", id: src_2799e7222597}
  - {resource: llm-wiki/raw/docs/openai/models-gpt-5-6-terra.md, title: "GPT-5.6 Terra", id: src_98f727f71ddd}
generated: {by: process:llm-wiki-render, at: 2026-09-12}
entity_ids: [ent_gpt_5_6_terra]
claim_ids: [clm_9e0cb2a46473, clm_bc1e9b43db6a, clm_6111a2f83575, clm_dabd79929390, clm_60ac29d854e8, clm_c9de5ea3f012, clm_bd0ee904fec9, clm_d921886ba1bb, clm_e4d11c464ecb, clm_f527db1617d8, clm_f16689ccb5bd, clm_10eddef12f8d]
confidence: 0.86
stale_after: 2026-11-21
last_rendered: 2026-09-12T20:30:33Z
review_required: false
---

# GPT-5.6 Terra

> **In here:** GPT-5.6 Terra is the balanced tier, corresponding to the mini tier of earlier GPT-5 families · 12 claims, confidence 0.86.

## Current understanding

- GPT-5.6 Terra is the balanced tier, corresponding to the mini tier of earlier GPT-5 families (0.92)
- GPT-5.6 Terra costs $2 per million input tokens, $0.20 cached input, and $12 per million output tokens (0.92)
- OpenAI's own routing rule is to start with gpt-6-astra for most reasoning workloads, drop to gpt-5.6-terra for lower cost, and to gpt-5.6-luna for the lowest cost and latency (0.92)
- Every GPT-5.6 model — Sol, Terra, and Luna — carries a 1,050,000-token context window, 128,000 max output tokens, and a February 16, 2026 knowledge cutoff (0.92)
- GPT-5.6 Sol, Terra, and Luna accept reasoning.effort none, low, medium, high, xhigh, and max, with medium as the default (0.92)
- On GPT-5.6 models an omitted reasoning.effort defaults to medium, which OpenAI calls the default configuration for most workloads and a well-balanced point on the latency, performance, and cost curve (0.92)
- The GPT-5.6 family is three tiers: Sol the flagship, Terra a balanced model for everyday work, and Luna the most cost-efficient model (0.83)
- On July 30, 2026 OpenAI cut GPT-5.6 Luna's price by 80% and GPT-5.6 Terra's by 20%, and the cuts also apply to how Codex usage counts against subscriptions (0.82)
- GPT-5.6 Terra is dominated: at every Terra effort level there is a Luna or Sol effort level that is more intelligent at no extra cost or equally intelligent at lower cost, because Luna and Sol are always on the Pareto frontier ahead of Terra (0.80)
- On Artificial Analysis Intelligence Index v4.1 GPT-5.6 Sol at max scores 59, one point below Claude Fable 5, at about one third of the cost per task ($1.04); Terra and Luna score 55 and 51 at $0.55 and $0.21 per task (0.80)
- On Artificial Analysis Coding Agent Index v1.1 GPT-5.6 Sol at max in Codex scores 80, leading all three evaluations, with Terra and Luna at 77 and 75 at about 60% and 80% lower per-task cost — an earlier index version whose scores are not comparable with the later Astra-era index (0.79)
- GPT-5.6's non-promotional list prices per million input/output tokens are Sol $5/$30, Terra $2.50/$15, and Luna $1/$6, with a 90% cache-read discount and OpenAI's first cache-write premium at 1.25x input (0.78)

## Evidence

- `clm_9e0cb2a46473` — "GPT-5.6 Terra is the balanced tier, corresponding to the mini tier of earlier GPT-5 families." · p 0.92 · active · 1 support · 0 contradict
  - `src_98f727f71ddd` GPT-5.6 Terra: "GPT-5.6 Terra is designed for workloads that balance intelligence and cost. It roughly corresponds to the mini model tier used in earlier GPT-5 families."
- `clm_bc1e9b43db6a` — "GPT-5.6 Terra costs $2 per million input tokens, $0.20 cached input, and $12 per million output tokens." · p 0.92 · active · 1 support · 0 contradict
  - `src_98f727f71ddd` GPT-5.6 Terra: "| Input | $2 | 1M tokens |"
- `clm_6111a2f83575` — "OpenAI's own routing rule is to start with gpt-6-astra for most reasoning workloads, drop to gpt-5.6-terra for lower cost, and to gpt-5.6-luna for the lowest cost and latency." · p 0.92 · active · 1 support · 0 contradict
  - `src_7fcd56977d57` Reasoning models: "Start with `gpt-6-astra` for most reasoning workloads."
- `clm_dabd79929390` — "Every GPT-5.6 model — Sol, Terra, and Luna — carries a 1,050,000-token context window, 128,000 max output tokens, and a February 16, 2026 knowledge cutoff." · p 0.92 · active · 1 support · 0 contradict
  - `src_2799e7222597` GPT-5.6 Sol: "- Feb 16, 2026 knowledge cutoff"
- `clm_60ac29d854e8` — "GPT-5.6 Sol, Terra, and Luna accept reasoning.effort none, low, medium, high, xhigh, and max, with medium as the default." · p 0.92 · active · 1 support · 0 contradict
  - `src_2799e7222597` GPT-5.6 Sol: "Reasoning.effort supports: none, low, medium (default), high, xhigh, and max."
- `clm_c9de5ea3f012` — "On GPT-5.6 models an omitted reasoning.effort defaults to medium, which OpenAI calls the default configuration for most workloads and a well-balanced point on the latency, performance, and cost curve." · p 0.92 · active · 1 support · 0 contradict
  - `src_7fcd56977d57` Reasoning models: "If you omit `reasoning.effort`, GPT-5.6 defaults to `medium` in both modes."
- `clm_bd0ee904fec9` — "The GPT-5.6 family is three tiers: Sol the flagship, Terra a balanced model for everyday work, and Luna the most cost-efficient model." · p 0.83 · active · 1 support · 0 contradict
  - `src_6556cffbfc4e` gpt-5-6: "our new flagship, **Sol**, alongside **Terra**, a balanced model for everyday work, and **Luna**, our most cost-efficient model."
- `clm_d921886ba1bb` — "On July 30, 2026 OpenAI cut GPT-5.6 Luna's price by 80% and GPT-5.6 Terra's by 20%, and the cuts also apply to how Codex usage counts against subscriptions." · p 0.82 · active · 1 support · 0 contradict
  - `src_5bc744d7e0e1` Advancing the price-performance frontier with GPT‑5.6: "Starting today, GPT‑5.6 Luna, our fastest and most affordable model, will cost 80% less, while GPT‑5.6 Terra, our balanced model for everyday work, will cost 20% less."
- `clm_e4d11c464ecb` — "GPT-5.6 Terra is dominated: at every Terra effort level there is a Luna or Sol effort level that is more intelligent at no extra cost or equally intelligent at lower cost, because Luna and Sol are always on the Pareto frontier ahead of Terra." · p 0.80 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "Notably, Luna and Sol are always on the Pareto frontier ahead of Terra."
- `clm_f527db1617d8` — "On Artificial Analysis Intelligence Index v4.1 GPT-5.6 Sol at max scores 59, one point below Claude Fable 5, at about one third of the cost per task ($1.04); Terra and Luna score 55 and 51 at $0.55 and $0.21 per task." · p 0.80 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) scores 1 point below Claude Fable 5 (max) in the Artificial Analysis Intelligence Index at 59 points, at approximately one third of the cost. GPT-5.6 Terra (max) and Luna (max) score 55 and 51 respectively"
- `clm_f16689ccb5bd` — "On Artificial Analysis Coding Agent Index v1.1 GPT-5.6 Sol at max in Codex scores 80, leading all three evaluations, with Terra and Luna at 77 and 75 at about 60% and 80% lower per-task cost — an earlier index version whose scores are not comparable with the later Astra-era index." · p 0.79 · active · 1 support · 0 contradict · when: Coding Agent Index v1.1, pre-Astra
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) in Codex scores 80 in the Index, leading in all three evaluations"
- `clm_10eddef12f8d` — "GPT-5.6's non-promotional list prices per million input/output tokens are Sol $5/$30, Terra $2.50/$15, and Luna $1/$6, with a 90% cache-read discount and OpenAI's first cache-write premium at 1.25x input." · p 0.78 · active · 1 support · 0 contradict · when: list price before the July 2026 cuts and the Sol promotion
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "Sol, Terra, and Luna are priced at $5/$30, $2.5/$15, and $1/$6 respectively per million input/output tokens."

## Timeline

- 2026-09-12 new_claim `clm_60ac29d854e8` (src_2799e7222597)
- 2026-09-12 new_claim `clm_dabd79929390` (src_2799e7222597)
- 2026-09-12 new_claim `clm_9e0cb2a46473` (src_98f727f71ddd)
- 2026-09-12 new_claim `clm_bc1e9b43db6a` (src_98f727f71ddd)
- 2026-09-12 new_claim `clm_6111a2f83575` (src_7fcd56977d57)
- 2026-09-12 new_claim `clm_c9de5ea3f012` (src_7fcd56977d57)
- 2026-09-12 new_claim `clm_bd0ee904fec9` (src_6556cffbfc4e)
- 2026-09-12 new_claim `clm_d921886ba1bb` (src_5bc744d7e0e1)
- 2026-09-12 new_claim `clm_f527db1617d8` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_e4d11c464ecb` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_f16689ccb5bd` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_10eddef12f8d` (src_c49e34d6a671)

## Related

- → uses [[effort-level]] (0.92)
- [[gpt-5-6-luna]] — 10 shared claims
- [[gpt-5-6-sol]] — 8 shared claims
- [[artificial-analysis]] — 3 shared claims
- [[effort-level]] — 2 shared claims
- [[claude-fable-5]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
