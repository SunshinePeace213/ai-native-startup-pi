---
type: workflow
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md, title: "The AI-Native SDLC playbook", id: src_c65435745c66}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_ai_native_sdlc]
claim_ids: [clm_a6c8b8853219, clm_fcb622036271, clm_0e4a65e960de, clm_82f6244bbaa4, clm_d21c16986b36, clm_79c9cb09913d, clm_076f6360ca74]
confidence: 0.83
stale_after: 2028-04-01
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# AI-native SDLC

> **In here:** Once the build phase runs faster than the traditional lifecycle allows, the bottleneck moves to the steps on either side of it — plan, review and test, and deploy — which still run at human speed · 7 claims, confidence 0.83.

## Current understanding

- The committed artifact is the thread running through the AI-native lifecycle: every stage ends by writing one to version control and the next stage begins by reading it, which makes the chain of commits the audit trail of who asked for what, what the agent produced, and who approved it (0.83)
- The AI-native SDLC groups its plays into six non-linear stages — Plan, Design, Build, Test, Deploy, Maintain — arranged as a loop with AI embedded at each point rather than as a linear flow of handoffs (0.83)
- Evals are the AI-native equivalent of stage-gate QA: the suite runs in CI on a schedule and on any change to CLAUDE.md, skills, or hooks, because that configuration steers the agent and deserves the regression testing code gets — with each production incident becoming a permanent eval (0.83)
- In the closed maintenance loop detection stays entirely deterministic with no model involved — Claude is invoked only once a control band is breached, and the tier sets what it may do: log at one sigma, read-only diagnosis at two, and action confined to a PR or a pre-approved runbook at three (0.83)
- The governing principle for an agent in the pipeline is that it may act up to the production gate and cannot pass it: branch protection turns anything the agent writes into a PR with no direct path to main, and separation of duties holds because the agent that wrote the code has no way to approve it (0.83)
- Once the build phase runs faster than the traditional lifecycle allows, the bottleneck moves to the steps on either side of it — plan, review and test, and deploy — which still run at human speed (0.81)
- The traditional controls stop matching reality once agents write most of the diff: reviewing each line by hand made sense when a person had written it and cannot keep up afterwards, while governance costs rise because exceptions still route through committees meeting weekly or monthly (0.81)

## Evidence

- `clm_a6c8b8853219` — "The committed artifact is the thread running through the AI-native lifecycle: every stage ends by writing one to version control and the next stage begins by reading it, which makes the chain of commits the audit trail of who asked for what, what the agent produced, and who approved it" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "For the early stages, .md files are the predominant artifact because a product owner and an agent can both read and act on the same file. From Build onward, the artifact is code and its records."
- `clm_fcb622036271` — "The AI-native SDLC groups its plays into six non-linear stages — Plan, Design, Build, Test, Deploy, Maintain — arranged as a loop with AI embedded at each point rather than as a linear flow of handoffs" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The plays are the core of the playbook and are grouped into six non-linear stages (Plan, Design, Build, Test, Deploy, Maintain), which together cover the complete lifecycle."
- `clm_0e4a65e960de` — "Evals are the AI-native equivalent of stage-gate QA: the suite runs in CI on a schedule and on any change to CLAUDE.md, skills, or hooks, because that configuration steers the agent and deserves the regression testing code gets — with each production incident becoming a permanent eval" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The suite runs non-interactively in CI on a schedule and on any change to `CLAUDE.md`, skills or hooks, since that configuration steers the agent and deserves the regression testing that code gets."
- `clm_82f6244bbaa4` — "In the closed maintenance loop detection stays entirely deterministic with no model involved — Claude is invoked only once a control band is breached, and the tier sets what it may do: log at one sigma, read-only diagnosis at two, and action confined to a PR or a pre-approved runbook at three" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "Detection stays deterministic. Claude is invoked once a band is breached, and the tier sets what it may do."
- `clm_d21c16986b36` — "The governing principle for an agent in the pipeline is that it may act up to the production gate and cannot pass it: branch protection turns anything the agent writes into a PR with no direct path to main, and separation of duties holds because the agent that wrote the code has no way to approve it" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The governing principle is that the agent may act up to the production gate and cannot pass it."
- `clm_79c9cb09913d` — "Once the build phase runs faster than the traditional lifecycle allows, the bottleneck moves to the steps on either side of it — plan, review and test, and deploy — which still run at human speed" · p 0.81 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The bottleneck moves to the steps to the left and right of the build phase. This is mainly plan, review/test, and deploy, which still run at human speed."
- `clm_076f6360ca74` — "The traditional controls stop matching reality once agents write most of the diff: reviewing each line by hand made sense when a person had written it and cannot keep up afterwards, while governance costs rise because exceptions still route through committees meeting weekly or monthly" · p 0.81 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "Reviewing each line by hand made sense when a person had written it, but it can't keep up once agents write most of the diff."

## Timeline

- 2026-08-23 new_claim `clm_79c9cb09913d` (src_c65435745c66)
- 2026-08-23 new_claim `clm_076f6360ca74` (src_c65435745c66)
- 2026-08-23 new_claim `clm_a6c8b8853219` (src_c65435745c66)
- 2026-08-23 new_claim `clm_fcb622036271` (src_c65435745c66)
- 2026-08-23 new_claim `clm_0e4a65e960de` (src_c65435745c66)
- 2026-08-23 new_claim `clm_d21c16986b36` (src_c65435745c66)
- 2026-08-23 new_claim `clm_82f6244bbaa4` (src_c65435745c66)

## Related

- → uses [[agent-loops]] (0.83)
- → uses [[hooks]] (0.83)
- → uses [[verification-loop]] (0.83)
- → applies_to [[code-review]] (0.81)
- [[agent-loops]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
