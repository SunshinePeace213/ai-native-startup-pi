---
type: concept
status: current
created: 2026-08-26
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md, title: "Demystifying evals for AI agents", id: src_e66d966eb39d}
  - {resource: llm-wiki/raw/docs/anthropic/develop-tests.md, title: "develop-tests", id: src_7d6dea537b6b}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_agent_evaluation]
claim_ids: [clm_f43cd5af876f, clm_5373490044e2, clm_bc4f7b493418, clm_c1d14717d3a5, clm_4d2e996a4f8b]
confidence: 0.81
stale_after: 2027-08-08
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# agent evaluation

> **In here:** No single evaluation layer catches every issue, so the most effective teams combine automated evals for fast iteration, production monitoring for ground truth, and periodic human review for… · 5 claims, confidence 0.81.

## Current understanding

- Choose deterministic graders wherever possible, model-based graders where they are necessary or add flexibility, and human graders judiciously for additional validation (0.97)
- The outcome of a trial is the final state of the environment, not what the agent says it did, so a booking agent's success is whether a reservation exists in the database rather than whether the transcript claims one was made (0.77)
- Evaluating an agent evaluates the agent harness and the model together, not the model alone, because the harness is what processes inputs, orchestrates tool calls, and returns results (0.77)
- Because agent behavior varies between runs, trials aggregate two ways: pass@k measures the chance of at least one success in k attempts and rises with k, while pass^k measures the chance that all k trials succeed and falls with k — use pass@k where one success is enough and pass^k where consistency is essential (0.77)
- No single evaluation layer catches every issue, so the most effective teams combine automated evals for fast iteration, production monitoring for ground truth, and periodic human review for calibration (0.76)

## Evidence

- `clm_f43cd5af876f` — "Choose deterministic graders wherever possible, model-based graders where they are necessary or add flexibility, and human graders judiciously for additional validation." · p 0.97 · active · 2 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "We recommend choosing deterministic graders where possible, LLM graders where necessary or for additional flexibility, and using human graders judiciously for additional validation."
  - `src_7d6dea537b6b` develop-tests: "1. **Code-based grading:** Fastest and most reliable, extremely scalable, but also lacks nuance for more complex judgments that require less rule-based rigidity."
- `clm_5373490044e2` — "The outcome of a trial is the final state of the environment, not what the agent says it did, so a booking agent's success is whether a reservation exists in the database rather than whether the transcript claims one was made." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "A flight-booking agent might say “Your flight has been booked” at the end of the transcript, but the outcome is whether a reservation exists in the environment’s SQL database."
- `clm_bc4f7b493418` — "Evaluating an agent evaluates the agent harness and the model together, not the model alone, because the harness is what processes inputs, orchestrates tool calls, and returns results." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "When we evaluate “an agent,” we’re evaluating the harness *and* the model working together."
- `clm_c1d14717d3a5` — "Because agent behavior varies between runs, trials aggregate two ways: pass@k measures the chance of at least one success in k attempts and rises with k, while pass^k measures the chance that all k trials succeed and falls with k — use pass@k where one success is enough and pass^k where consistency is essential." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "Both metrics are useful, and which to use depends on product requirements: pass@k for tools where one success matters, pass^k for agents where consistency is essential."
- `clm_4d2e996a4f8b` — "No single evaluation layer catches every issue, so the most effective teams combine automated evals for fast iteration, production monitoring for ground truth, and periodic human review for calibration." · p 0.76 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "The most effective teams combine these methods: automated evals for fast iteration, production monitoring for ground truth, and periodic human review for calibration."

## Timeline

- 2026-08-26 new_claim `clm_bc4f7b493418` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_5373490044e2` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_f43cd5af876f` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_c1d14717d3a5` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_4d2e996a4f8b` (src_e66d966eb39d)
- 2026-09-02 support_update `clm_f43cd5af876f` (src_7d6dea537b6b)

## Related

- → applies_to [[agent-harness]] (0.77)
- → uses [[agent-trace]] (0.77)
- → uses [[grader]] (0.77)
- → uses trial (no page yet) (0.77)
- → related_to production monitoring (no page yet) (0.76)
- [[agent-harness]] — 1 shared claim
- [[agent-trace]] — 1 shared claim
- [[grader]] — 1 shared claim
- [[llm-as-judge]] — 1 shared claim
- production monitoring (no page yet)
- trial (no page yet)
