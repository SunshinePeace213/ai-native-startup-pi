---
type: concept
status: current
created: 2026-08-26
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md, title: "Demystifying evals for AI agents", id: src_e66d966eb39d}
  - {resource: llm-wiki/raw/docs/anthropic/develop-tests.md, title: "develop-tests", id: src_7d6dea537b6b}
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_grader]
claim_ids: [clm_f43cd5af876f, clm_a59434ccdb74, clm_bd622b78c195, clm_31458f476385, clm_01fcc1cff38a, clm_6fe59dcba5d2, clm_d804422af101, clm_b37ede827723]
confidence: 0.85
stale_after: 2027-07-25
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# grader

> **In here:** grader — 8 claims, confidence 0.85, 3 sources.

## Current understanding

- Choose deterministic graders wherever possible, model-based graders where they are necessary or add flexibility, and human graders judiciously for additional validation (0.97)
- More eval questions with slightly lower-signal automated grading beat fewer questions graded by hand at high quality (0.93)
- Human grading is the most flexible and highest-quality eval method but slow and expensive, so it should be avoided where a code-based or LLM-based grader can do the job (0.93)
- Binary pass/fail verdicts per rubric criterion are more reproducible and debuggable than a 1–10 score, because a model cannot hold a stable absolute scale across runs and human inter-rater reliability on a 1–5 scale is only about 0.45–0.60 (0.89)
- A good eval task is one where two domain experts would independently reach the same pass/fail verdict; ambiguity in the task specification turns into noise in the metric (0.77)
- Grade what the agent produced rather than the path it took: checking that an agent followed a specific sequence of tool calls makes brittle tests, because agents regularly find valid approaches the eval designer did not anticipate (0.77)
- Reading transcripts and grades from many trials is the only way to know whether the graders work: a failed task's transcript shows whether the agent made a genuine mistake or the grader rejected a valid solution (0.77)
- An LLM-as-judge grader needs close calibration against human experts, an explicit way out such as returning "Unknown" when it lacks information, and one isolated judge per rubric dimension rather than a single judge grading every dimension at once (0.76)

## Evidence

- `clm_f43cd5af876f` — "Choose deterministic graders wherever possible, model-based graders where they are necessary or add flexibility, and human graders judiciously for additional validation." · p 0.97 · active · 2 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "We recommend choosing deterministic graders where possible, LLM graders where necessary or for additional flexibility, and using human graders judiciously for additional validation."
  - `src_7d6dea537b6b` develop-tests: "1. **Code-based grading:** Fastest and most reliable, extremely scalable, but also lacks nuance for more complex judgments that require less rule-based rigidity."
- `clm_a59434ccdb74` — "More eval questions with slightly lower-signal automated grading beat fewer questions graded by hand at high quality." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "3. **Prioritize volume over quality:** More questions with slightly lower signal automated grading is better than fewer questions with high-quality human hand-graded evals."
- `clm_bd622b78c195` — "Human grading is the most flexible and highest-quality eval method but slow and expensive, so it should be avoided where a code-based or LLM-based grader can do the job." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "2. **Human grading:** Most flexible and high quality, but slow and expensive. Avoid if possible."
- `clm_31458f476385` — "Binary pass/fail verdicts per rubric criterion are more reproducible and debuggable than a 1–10 score, because a model cannot hold a stable absolute scale across runs and human inter-rater reliability on a 1–5 scale is only about 0.45–0.60." · p 0.89 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "A "7/10" is noise — the model can't hold a stable absolute scale across runs, and human inter-rater reliability on 1–5 helpfulness sits around 0.45–0.60 to begin with."
- `clm_01fcc1cff38a` — "A good eval task is one where two domain experts would independently reach the same pass/fail verdict; ambiguity in the task specification turns into noise in the metric." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "A good task is one where two domain experts would independently reach the same pass/fail verdict. Could they pass the task themselves? If not, the task needs refinement. Ambiguity in task specifications becomes noise in metrics."
- `clm_6fe59dcba5d2` — "Grade what the agent produced rather than the path it took: checking that an agent followed a specific sequence of tool calls makes brittle tests, because agents regularly find valid approaches the eval designer did not anticipate." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "So as not to unnecessarily punish creativity, it’s often better to grade what the agent produced, not the path it took."
- `clm_d804422af101` — "Reading transcripts and grades from many trials is the only way to know whether the graders work: a failed task's transcript shows whether the agent made a genuine mistake or the grader rejected a valid solution." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "You won't know if your graders are working well unless you read the transcripts and grades from many trials."
- `clm_b37ede827723` — "An LLM-as-judge grader needs close calibration against human experts, an explicit way out such as returning "Unknown" when it lacks information, and one isolated judge per rubric dimension rather than a single judge grading every dimension at once." · p 0.76 · active · 1 support · 0 contradict · when: for model-based graders
  - `src_e66d966eb39d` Demystifying evals for AI agents: "LLM-as-judge graders should be closely calibrated with human experts to gain confidence that there is little divergence between the human grading and model grading."

## Timeline

- 2026-08-26 new_claim `clm_f43cd5af876f` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_6fe59dcba5d2` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_b37ede827723` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_01fcc1cff38a` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_d804422af101` (src_e66d966eb39d)
- 2026-08-28 new_claim `clm_31458f476385` (src_521f898b9896)
- 2026-09-02 new_claim `clm_a59434ccdb74` (src_7d6dea537b6b)
- 2026-09-02 support_update `clm_f43cd5af876f` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_bd622b78c195` (src_7d6dea537b6b)

## Related

- ← part_of [[llm-as-judge]] (1.00)
- → applies_to [[agent-trace]] (0.77)
- → applies_to [[eval-task]] (0.77)
- ← uses [[agent-evaluation]] (0.77)
- → uses [[agent-trace]] (0.77)
- [[llm-as-judge]] — 3 shared claims
- [[agent-trace]] — 2 shared claims
- [[agent-evaluation]] — 1 shared claim
- [[eval-suite]] — 1 shared claim
- [[eval-task]] — 1 shared claim
