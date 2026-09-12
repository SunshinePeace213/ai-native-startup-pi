---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/develop-tests.md, title: "develop-tests", id: src_7d6dea537b6b}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_success_criteria]
claim_ids: [clm_85885dc591e0, clm_ae4031c6eca1, clm_c922d469be19, clm_22be390669cc]
confidence: 0.93
stale_after: 2029-11-05
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# success criteria

> **In here:** Success criteria should use quantitative metrics or well-defined qualitative scales; qualitative measures earn their place only when applied consistently alongside quantitative ones · 4 claims, confidence 0.93.

## Current understanding

- Building an LLM application starts by defining success criteria and then designing evaluations that measure against them, and this criteria-then-evals cycle is central to prompt engineering (0.93)
- Success criteria should use quantitative metrics or well-defined qualitative scales; qualitative measures earn their place only when applied consistently alongside quantitative ones (0.93)
- Success targets should rest on industry benchmarks, prior experiments, AI research, or expert knowledge, and never exceed what current frontier models can realistically do (0.93)
- Most LLM use cases need evaluation along several success criteria at once rather than a single metric (0.93)

## Evidence

- `clm_85885dc591e0` — "Building an LLM application starts by defining success criteria and then designing evaluations that measure against them, and this criteria-then-evals cycle is central to prompt engineering." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "Building a successful LLM-based application starts with clearly defining your success criteria and then designing evaluations to measure performance against them. This cycle is central to prompt engineering."
- `clm_ae4031c6eca1` — "Success criteria should use quantitative metrics or well-defined qualitative scales; qualitative measures earn their place only when applied consistently alongside quantitative ones." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "**Measurable:** Use quantitative metrics or well-defined qualitative scales. Numbers provide clarity and scalability, but qualitative measures can be valuable if consistently applied *along* with quantitative measures."
- `clm_c922d469be19` — "Success targets should rest on industry benchmarks, prior experiments, AI research, or expert knowledge, and never exceed what current frontier models can realistically do." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "**Achievable:** Base your targets on industry benchmarks, prior experiments, AI research, or expert knowledge. Your success metrics should not be unrealistic to current frontier model capabilities."
- `clm_22be390669cc` — "Most LLM use cases need evaluation along several success criteria at once rather than a single metric." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "Most use cases need multidimensional evaluation along several success criteria."

## Timeline

- 2026-09-02 new_claim `clm_85885dc591e0` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_ae4031c6eca1` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_c922d469be19` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_22be390669cc` (src_7d6dea537b6b)

## Related

- ← depends_on [[eval-suite]] (0.93)
- [[eval-suite]] — 2 shared claims
