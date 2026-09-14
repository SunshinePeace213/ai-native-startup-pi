---
type: concept
status: current
created: 2026-09-14
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/automationbench-aa.md, title: "AutomationBench-AA: Agentic SaaS Workflow Benchmark", id: src_3fd111830533}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_guardrail]
claim_ids: [clm_ee0d5631610d, clm_f88d52405cba]
confidence: 0.82
stale_after: 2026-12-20
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# guardrail

> **In here:** AutomationBench scores a task 0 whenever any guardrail is violated and otherwise credits the share of objectives completed, where guardrails are the checks that already held before the agent acted · 2 claims, confidence 0.82.

## Current understanding

- AutomationBench scores a task 0 whenever any guardrail is violated and otherwise credits the share of objectives completed, where guardrails are the checks that already held before the agent acted (0.83)
- On AutomationBench-AA GPT-6 Astra at max completes 88.8% of objectives but scores only 41.6% strict and 68.5% headline while breaking 0.444 guardrails per task, so policy adherence rather than task competence is what the benchmark exposes (0.81)

## Evidence

- `clm_ee0d5631610d` — "AutomationBench scores a task 0 whenever any guardrail is violated and otherwise credits the share of objectives completed, where guardrails are the checks that already held before the agent acted." · p 0.83 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "Guardrails are the checks that already hold before the agent acts; every other check is an objective. A task scores 0 if any guardrail is violated, otherwise the score is the share of objectives completed."
- `clm_f88d52405cba` — "On AutomationBench-AA GPT-6 Astra at max completes 88.8% of objectives but scores only 41.6% strict and 68.5% headline while breaking 0.444 guardrails per task, so policy adherence rather than task competence is what the benchmark exposes." · p 0.81 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "| GPT-6 Astra (max) | 68.5% | 41.6% | 88.8% | 292 | 0.444 | 22822 | 657 | 13826 | 53882 |"

## Timeline

- 2026-09-14 new_claim `clm_ee0d5631610d` (src_3fd111830533)
- 2026-09-14 new_claim `clm_f88d52405cba` (src_3fd111830533)

## Related

- ← uses [[automationbench]] (0.83)
- [[automationbench]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
