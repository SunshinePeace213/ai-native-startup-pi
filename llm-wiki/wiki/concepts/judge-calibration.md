---
type: concept
status: current
created: 2026-08-28
updated: 2026-08-28
sources:
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-08-28}
entity_ids: [ent_judge_calibration]
claim_ids: [clm_75116a77e501, clm_9732a5b1a77d]
confidence: 0.89
stale_after: 2029-02-23
last_rendered: 2026-08-28T15:07:26Z
review_required: false
---

# judge calibration

> **In here:** Raw accuracy misleads on an imbalanced review set: when 80% of outputs pass, a judge that always says pass scores 80% accuracy with κ near zero, so agreement is reported with precision and recall on… · 2 claims, confidence 0.89.

## Current understanding

- Raw accuracy misleads on an imbalanced review set: when 80% of outputs pass, a judge that always says pass scores 80% accuracy with κ near zero, so agreement is reported with precision and recall on defect detection beside it (0.89)
- A judge is validated against a golden set of 30–50 self-labelled examples using chance-adjusted agreement (Cohen's κ), with about 0.6 as the practical floor and 0.8 as ship-ready (0.88)

## Evidence

- `clm_75116a77e501` — "Raw accuracy misleads on an imbalanced review set: when 80% of outputs pass, a judge that always says pass scores 80% accuracy with κ near zero, so agreement is reported with precision and recall on defect detection beside it." · p 0.89 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "If 80% of your outputs pass, a judge that always says "pass" scores 80% accuracy but κ ≈ 0 — it's guessing."
- `clm_9732a5b1a77d` — "A judge is validated against a golden set of 30–50 self-labelled examples using chance-adjusted agreement (Cohen's κ), with about 0.6 as the practical floor and 0.8 as ship-ready." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Practical floor ≈ 0.6; ship-ready ≈ 0.8."

## Timeline

- 2026-08-28 new_claim `clm_9732a5b1a77d` (src_521f898b9896)
- 2026-08-28 new_claim `clm_75116a77e501` (src_521f898b9896)

## Related

- → applies_to [[llm-as-judge]] (0.98)
- [[llm-as-judge]] — 2 shared claims
