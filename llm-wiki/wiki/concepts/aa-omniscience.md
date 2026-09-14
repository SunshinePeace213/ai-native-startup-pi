---
type: concept
status: current
created: 2026-09-14
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/omniscience.md, title: "AA-Omniscience: Knowledge and Hallucination Benchmark", id: src_c197533a04c8}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_aa_omniscience]
claim_ids: [clm_2c4bdb241a8e, clm_796c94171245, clm_ab79a21fe203, clm_13f4f5cb2042, clm_e935faab6134, clm_23530aed6e2b]
confidence: 0.81
stale_after: 2026-12-07
last_rendered: 2026-09-14T19:58:09Z
review_required: false
---

# AA-Omniscience

> **In here:** The AA-Omniscience paper reports Claude 4.1 Opus as the top scorer at 4.8 and only three models above zero, far below the live leaderboard's 43.73 leader, so the published headline result no longer… · 6 claims, confidence 0.81.

## Current understanding

- The AA-Omniscience Index is a bounded -100 to 100 metric over 6,000 questions that jointly penalizes hallucinations and rewards abstention, with 0 meaning a model answers correctly as often as incorrectly (0.83)
- AA-Omniscience performance varies by domain with models from three different labs leading across its six domains, so models should be chosen for the demands of the use case rather than by general performance where knowledge matters (0.81)
- Artificial Analysis cross-plots the AA-Omniscience Index against its Intelligence Index to show that knowledge reliability does not track overall intelligence-index rank (0.81)
- On the AA-Omniscience Index GPT-6 Astra (high) leads at 43.73, with Claude Fable 5.1 (max with fallback) at 43.45 and two further GPT-6 Astra settings at 43.42 and 43.40 — the top four inside a third of a point (0.81)
- The AA-Omniscience paper reports Claude 4.1 Opus as the top scorer at 4.8 and only three models above zero, far below the live leaderboard's 43.73 leader, so the published headline result no longer describes the current standings (0.80)
- Claude Fable 5.1 (max with fallback) leads AA-Omniscience accuracy at 67.2%, ahead of GPT-6 Astra (max) at 62.6%, even though Astra leads the Index — accuracy alone does not decide knowledge reliability (0.80)

## Evidence

- `clm_2c4bdb241a8e` — "The AA-Omniscience Index is a bounded -100 to 100 metric over 6,000 questions that jointly penalizes hallucinations and rewards abstention, with 0 meaning a model answers correctly as often as incorrectly." · p 0.83 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "The evaluation measures a model's AA-Omniscience Index, a bounded metric (-100 to 100) measuring factual recall that jointly penalizes hallucinations and rewards abstention when uncertain, with 0 equating to a model that answers questions…"
- `clm_796c94171245` — "AA-Omniscience performance varies by domain with models from three different labs leading across its six domains, so models should be chosen for the demands of the use case rather than by general performance where knowledge matters." · p 0.81 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "Performance also varies by domain, with the models from three different research labs leading across the six domains."
- `clm_ab79a21fe203` — "Artificial Analysis cross-plots the AA-Omniscience Index against its Intelligence Index to show that knowledge reliability does not track overall intelligence-index rank." · p 0.81 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "The page cross-plots the AA-Omniscience Index against the general-purpose Artificial Analysis Intelligence Index (v4.3), illustrating that knowledge reliability does not track overall intelligence-index rank."
- `clm_13f4f5cb2042` — "On the AA-Omniscience Index GPT-6 Astra (high) leads at 43.73, with Claude Fable 5.1 (max with fallback) at 43.45 and two further GPT-6 Astra settings at 43.42 and 43.40 — the top four inside a third of a point." · p 0.81 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "| GPT-6 Astra (high) | 43.73 | | Claude Fable 5.1 (max with fallback) | 43.45 | | GPT-6 Astra (xhigh) | 43.42 | | GPT-6 Astra (max) | 43.40 |"
- `clm_e935faab6134` — "The AA-Omniscience paper reports Claude 4.1 Opus as the top scorer at 4.8 and only three models above zero, far below the live leaderboard's 43.73 leader, so the published headline result no longer describes the current standings." · p 0.80 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "Among evaluated models, Claude 4.1 Opus attains the highest score (4.8), making it one of only three models to score above zero."
- `clm_23530aed6e2b` — "Claude Fable 5.1 (max with fallback) leads AA-Omniscience accuracy at 67.2%, ahead of GPT-6 Astra (max) at 62.6%, even though Astra leads the Index — accuracy alone does not decide knowledge reliability." · p 0.80 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "| Claude Fable 5.1 (max with fallback) | 67.2% | | Claude Fable 5.1 (xhigh with fallback) | 66.2% | | Claude Fable 5 (with fallback) | 65.4% | | Claude Fable 5.1 (high with fallback) | 64.9% | | GPT-6 Astra (max) | 62.6% |"

## Timeline

- 2026-09-14 new_claim `clm_2c4bdb241a8e` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_13f4f5cb2042` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_23530aed6e2b` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_ab79a21fe203` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_796c94171245` (src_c197533a04c8)
- 2026-09-14 new_claim `clm_e935faab6134` (src_c197533a04c8)

## Related

- → applies_to [[hallucination]] (0.83)
- → applies_to [[model-selection]] (0.81)
- ← produces [[artificial-analysis]] (0.81)
- ← related_to [[gpt-6-astra]] (0.81)
- [[claude-fable-5-1]] — 2 shared claims
- [[artificial-analysis]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
- [[hallucination]] — 1 shared claim
- [[model-selection]] — 1 shared claim
