---
type: concept
status: current
created: 2026-08-26
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md, title: "Demystifying evals for AI agents", id: src_e66d966eb39d}
  - {resource: llm-wiki/raw/docs/anthropic/develop-tests.md, title: "develop-tests", id: src_7d6dea537b6b}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_eval_suite]
claim_ids: [clm_85885dc591e0, clm_a59434ccdb74, clm_22be390669cc, clm_324724ac8847, clm_a4e665de3823, clm_3726a8f5038f, clm_f2a36e88d3ab]
confidence: 0.88
stale_after: 2027-08-08
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# eval suite

> **In here:** eval suite — 7 claims, confidence 0.88, 2 sources.

## Current understanding

- Building an LLM application starts by defining success criteria and then designing evaluations that measure against them, and this criteria-then-evals cycle is central to prompt engineering (0.93)
- More eval questions with slightly lower-signal automated grading beat fewer questions graded by hand at high quality (0.93)
- Most LLM use cases need evaluation along several success criteria at once rather than a single metric (0.93)
- Evals should mirror the real-world task distribution and deliberately include edge cases such as irrelevant or nonexistent input, overly long input, harmful chat input, and cases where even humans struggle to agree (0.92)
- Writing hundreds of eval test cases by hand is hard, so Claude can generate more from a baseline set of example cases (0.92)
- An initial eval set of 20-50 simple tasks drawn from real failures is enough to start, because early in agent development each change has a large enough effect that small samples suffice (0.76)
- An eval set must cover both the cases where a behavior should occur and the cases where it should not, because one-sided evals create one-sided optimization — testing only that the agent searches when it should yields an agent that searches for almost everything (0.76)

## Evidence

- `clm_85885dc591e0` — "Building an LLM application starts by defining success criteria and then designing evaluations that measure against them, and this criteria-then-evals cycle is central to prompt engineering." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "Building a successful LLM-based application starts with clearly defining your success criteria and then designing evaluations to measure performance against them. This cycle is central to prompt engineering."
- `clm_a59434ccdb74` — "More eval questions with slightly lower-signal automated grading beat fewer questions graded by hand at high quality." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "3. **Prioritize volume over quality:** More questions with slightly lower signal automated grading is better than fewer questions with high-quality human hand-graded evals."
- `clm_22be390669cc` — "Most LLM use cases need evaluation along several success criteria at once rather than a single metric." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "Most use cases need multidimensional evaluation along several success criteria."
- `clm_324724ac8847` — "Evals should mirror the real-world task distribution and deliberately include edge cases such as irrelevant or nonexistent input, overly long input, harmful chat input, and cases where even humans struggle to agree." · p 0.92 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "1. **Be task-specific:** Design evals that mirror your real-world task distribution. Don't forget to factor in edge cases!"
- `clm_a4e665de3823` — "Writing hundreds of eval test cases by hand is hard, so Claude can generate more from a baseline set of example cases." · p 0.92 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "Writing hundreds of test cases can be hard to do by hand! Get Claude to help you generate more from a baseline set of example test cases."
- `clm_3726a8f5038f` — "An initial eval set of 20-50 simple tasks drawn from real failures is enough to start, because early in agent development each change has a large enough effect that small samples suffice." · p 0.76 · active · 1 support · 0 contradict · when: in early agent development
  - `src_e66d966eb39d` Demystifying evals for AI agents: "In reality, 20-50 simple tasks drawn from real failures is a great start."
- `clm_f2a36e88d3ab` — "An eval set must cover both the cases where a behavior should occur and the cases where it should not, because one-sided evals create one-sided optimization — testing only that the agent searches when it should yields an agent that searches for almost everything." · p 0.76 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "Test both the cases where a behavior *should* occur and where it *shouldn't*. One-sided evals create one-sided optimization."

## Timeline

- 2026-08-26 new_claim `clm_3726a8f5038f` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_f2a36e88d3ab` (src_e66d966eb39d)
- 2026-09-02 new_claim `clm_85885dc591e0` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_22be390669cc` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_324724ac8847` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_a59434ccdb74` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_a4e665de3823` (src_7d6dea537b6b)

## Related

- → depends_on [[success-criteria]] (0.93)
- ← part_of [[eval-task]] (0.91)
- [[eval-task]] — 2 shared claims
- [[success-criteria]] — 2 shared claims
- [[grader]] — 1 shared claim
