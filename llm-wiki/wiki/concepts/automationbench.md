---
type: concept
status: current
created: 2026-09-14
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/automationbench-aa.md, title: "AutomationBench-AA: Agentic SaaS Workflow Benchmark", id: src_3fd111830533}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_automationbench]
claim_ids: [clm_88c22c65b789, clm_92b3a86d8330, clm_ee0d5631610d, clm_a75b4d41b36f, clm_8fe47fd4b851, clm_94d2e622e45b]
confidence: 0.82
stale_after: 2027-01-03
last_rendered: 2026-09-14T19:58:09Z
review_required: false
---

# AutomationBench

> **In here:** Each AutomationBench-AA task run is capped at roughly 50 tool-using turns against simulated Gmail, Salesforce, Slack, Zendesk, Jira, HubSpot and similar apps reached through REST API tools · 6 claims, confidence 0.82.

## Current understanding

- AutomationBench-AA's headline metric is the average share of a task's objectives completed without guardrail violations, not the fully-completed-task percentage Zapier's own hosted leaderboard reports, so the two leaderboards' numbers are not comparable (0.83)
- AutomationBench evaluates agents on cross-application SaaS workflows drawn from Zapier's platform in which the agent must discover the right REST endpoints itself, follow layered business rules, and work among irrelevant and misleading records, graded programmatically on the final environment state alone (0.83)
- AutomationBench scores a task 0 whenever any guardrail is violated and otherwise credits the share of objectives completed, where guardrails are the checks that already held before the agent acted (0.83)
- On AutomationBench-AA DeepSeek V4.1 Flash leads at 68.9%, ahead of GPT-6 Astra at max on 68.5% and at xhigh on 67.2% (0.83)
- Each AutomationBench-AA task run is capped at roughly 50 tool-using turns against simulated Gmail, Salesforce, Slack, Zendesk, Jira, HubSpot and similar apps reached through REST API tools (0.81)
- AutomationBench's own paper reports the best frontier models scoring below 10% on fully completed tasks, which sits beside Artificial Analysis's 68.9% leader only because the two measure different things — whole tasks against share of objectives (0.80)

## Evidence

- `clm_88c22c65b789` — "AutomationBench-AA's headline metric is the average share of a task's objectives completed without guardrail violations, not the fully-completed-task percentage Zapier's own hosted leaderboard reports, so the two leaderboards' numbers are not comparable." · p 0.83 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "Unlike Zapier's own hosted AutomationBench leaderboard, which reports the percentage of tasks completed fully, AutomationBench-AA uses a headline metric representing the average share of each task's objectives a model completes without…"
- `clm_92b3a86d8330` — "AutomationBench evaluates agents on cross-application SaaS workflows drawn from Zapier's platform in which the agent must discover the right REST endpoints itself, follow layered business rules, and work among irrelevant and misleading records, graded programmatically on the final environment state alone." · p 0.83 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "Drawing on real workflow patterns from Zapier's platform, tasks span Sales, Marketing, Operations, Support, Finance, and HR domains."
- `clm_ee0d5631610d` — "AutomationBench scores a task 0 whenever any guardrail is violated and otherwise credits the share of objectives completed, where guardrails are the checks that already held before the agent acted." · p 0.83 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "Guardrails are the checks that already hold before the agent acts; every other check is an objective. A task scores 0 if any guardrail is violated, otherwise the score is the share of objectives completed."
- `clm_a75b4d41b36f` — "On AutomationBench-AA DeepSeek V4.1 Flash leads at 68.9%, ahead of GPT-6 Astra at max on 68.5% and at xhigh on 67.2%." · p 0.83 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "DeepSeek V4.1 Flash (Reasoning, Max Effort) scores the highest on AutomationBench-AA with a score of 68.9%, followed by GPT-6 Astra (max) with a score of 68.5% and GPT-6 Astra (xhigh) with a score of 67.2%."
- `clm_8fe47fd4b851` — "Each AutomationBench-AA task run is capped at roughly 50 tool-using turns against simulated Gmail, Salesforce, Slack, Zendesk, Jira, HubSpot and similar apps reached through REST API tools." · p 0.81 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "Each task presents simulated SaaS application environments reached through REST API tools (e.g., Gmail, Google Sheets, Google Drive, Salesforce, Slack, Zendesk, HelpCrunch, Intercom, HelpScout, Jira, HubSpot, Freshdesk, Twilio, DocuSign)."
- `clm_94d2e622e45b` — "AutomationBench's own paper reports the best frontier models scoring below 10% on fully completed tasks, which sits beside Artificial Analysis's 68.9% leader only because the two measure different things — whole tasks against share of objectives." · p 0.80 · active · 1 support · 0 contradict
  - `src_3fd111830533` AutomationBench-AA: Agentic SaaS Workflow Benchmark: "Even the best frontier models currently score below 10%."

## Timeline

- 2026-09-14 new_claim `clm_92b3a86d8330` (src_3fd111830533)
- 2026-09-14 new_claim `clm_ee0d5631610d` (src_3fd111830533)
- 2026-09-14 new_claim `clm_88c22c65b789` (src_3fd111830533)
- 2026-09-14 new_claim `clm_a75b4d41b36f` (src_3fd111830533)
- 2026-09-14 new_claim `clm_94d2e622e45b` (src_3fd111830533)
- 2026-09-14 new_claim `clm_8fe47fd4b851` (src_3fd111830533)

## Related

- ← produces Zapier (no page yet) (0.83)
- ← related_to DeepSeek V4.1 Flash (no page yet) (0.83)
- ← uses [[artificial-analysis]] (0.83)
- → uses [[guardrail]] (0.83)
- [[artificial-analysis]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
- [[guardrail]] — 1 shared claim
- DeepSeek V4.1 Flash (no page yet)
- Zapier (no page yet)
