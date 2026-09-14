---
type: concept
status: current
created: 2026-08-28
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md, title: "Demystifying evals for AI agents", id: src_e66d966eb39d}
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/articles/mercor/apex-agents-leaderboard.md, title: "The AI Productivity Index for Agents", id: src_3858898cebb3}
  - {resource: llm-wiki/raw/docs/agent-skills/evaluating-skills.md, title: "Evaluating skill output quality", id: src_43d7ded295ed}
  - {resource: llm-wiki/raw/docs/anthropic/develop-tests.md, title: "develop-tests", id: src_7d6dea537b6b}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_llm_as_judge]
claim_ids: [clm_6282902285c5, clm_13a8429fc3d7, clm_f43cd5af876f, clm_5a01a3ddf329, clm_925363fcc08f, clm_b1082dcbaa9d, clm_31458f476385, clm_75116a77e501, clm_73819c5676f0, clm_9732a5b1a77d, clm_9aaf86ca5c78, clm_b6340e4f2211, clm_c66b3e6a6e03, clm_d3e2b15c99a9, clm_e9cb063c90b5, clm_833e0f66fd4d, clm_e137fbb880ba, clm_b37ede827723]
confidence: 0.90
stale_after: 2027-07-25
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# LLM-as-judge

> **In here:** An LLM-as-judge grader needs close calibration against human experts, an explicit way out such as returning "Unknown" when it lacks information, and one isolated judge per rubric dimension rather… · 18 claims, confidence 0.90.

## Current understanding

- Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not (1.00)
- Grading requires concrete evidence quoted from the output for a PASS rather than the benefit of the doubt, and the assertions themselves are reviewed for being too easy, too hard, or unverifiable (0.98)
- Choose deterministic graders wherever possible, model-based graders where they are necessary or add flexibility, and human graders judiciously for additional validation (0.97)
- Asking an LLM grader to reason before producing its score, then discarding the reasoning, increases evaluation performance, especially for tasks requiring complex judgment (0.93)
- An LLM grader should be constrained to an empirical output such as only 'correct' or 'incorrect' or a 1-5 scale, because purely qualitative evaluations are hard to assess quickly and at scale (0.93)
- LLM-based grading needs detailed, clear rubrics with concrete pass conditions, and a single use case or even one success criterion may need several rubrics for holistic evaluation (0.92)
- Binary pass/fail verdicts per rubric criterion are more reproducible and debuggable than a 1–10 score, because a model cannot hold a stable absolute scale across runs and human inter-rater reliability on a 1–5 scale is only about 0.45–0.60 (0.89)
- Raw accuracy misleads on an imbalanced review set: when 80% of outputs pass, a judge that always says pass scores 80% accuracy with κ near zero, so agreement is reported with precision and recall on defect detection beside it (0.89)
- LLM judges reward length — GPT-4 picked the longer answer more than 90% of the time once lengths differed by over 20% — so a rubric penalizes length and grades binary per-criterion properties instead of overall quality (0.88)
- A judge is validated against a golden set of 30–50 self-labelled examples using chance-adjusted agreement (Cohen's κ), with about 0.6 as the practical floor and 0.8 as ship-ready (0.88)
- Superficial "master key" tokens such as a bare colon or "Let's solve step by step" flip judges to PASS with false-positive rates as high as 80%, which is why every finding must carry a quoted line and adversarial garbage outputs belong in the golden set (0.88)
- A judge favors its own model family's output — GPT-4's recall was 0.945 on human-favorable answers versus 0.425 on human-unfavorable ones, and GPT-4o's win rate fell 13 points when judged blind — so the judge comes from a different family or is at least blinded to the author (0.88)
- Review direction matters: in Xiang et al.'s LiveCodeBench study Claude reviewing Codex raised accuracy from 71.6% to 89.7% while Codex reviewing Claude lowered it from 91.4% to 82.8%, so the strongest model belongs in the judge seat rather than the author seat (0.88)
- Told the requester's opinion, LLMs affirm whichever side the user takes in 48% of moral-conflict cases and debate framing elicits two to three times more agreement, so a judge prompt states no opinion and frames the question neutrally (0.88)
- LLM judges prefer whichever answer sits in a given slot — only GPT-4 stayed above 60% consistent when two answers were swapped — so pairwise judging runs both orders or shuffles the options (0.88)
- A panel of smaller judges from disjoint model families outperforms a single large judge, shows less intra-model bias, and costs over seven times less (0.87)
- APEX-Agents grades the quality of completed work with expert-authored rubrics scored by an LM judge rather than by programmatic environment checks (0.83)
- An LLM-as-judge grader needs close calibration against human experts, an explicit way out such as returning "Unknown" when it lacks information, and one isolated judge per rubric dimension rather than a single judge grading every dimension at once (0.76)

## Evidence

- `clm_6282902285c5` — "Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not" · p 1.00 · active · 3 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Use a second agent for code review to reduce the bias of an agent reviewing its own output."
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Claude self-review: unchanged at 91.4%"
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin does not ask the same Claude instance that wrote the code to grade itself. The per-edit check is a deterministic string match with no model involved."
- `clm_13a8429fc3d7` — "Grading requires concrete evidence quoted from the output for a PASS rather than the benefit of the doubt, and the assertions themselves are reviewed for being too easy, too hard, or unverifiable." · p 0.98 · active · 2 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "**Require concrete evidence for a PASS.** Don't give the benefit of the doubt."
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "force the judge to quote the exact offending line for every issue. This one trick kills most hallucinated criticism and most token-gaming."
- `clm_f43cd5af876f` — "Choose deterministic graders wherever possible, model-based graders where they are necessary or add flexibility, and human graders judiciously for additional validation." · p 0.97 · active · 2 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "We recommend choosing deterministic graders where possible, LLM graders where necessary or for additional flexibility, and using human graders judiciously for additional validation."
  - `src_7d6dea537b6b` develop-tests: "1. **Code-based grading:** Fastest and most reliable, extremely scalable, but also lacks nuance for more complex judgments that require less rule-based rigidity."
- `clm_5a01a3ddf329` — "Asking an LLM grader to reason before producing its score, then discarding the reasoning, increases evaluation performance, especially for tasks requiring complex judgment." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "* **Encourage reasoning:** Ask the LLM to reason first before producing an evaluation score, and then discard the reasoning. This increases evaluation performance, particularly for tasks requiring complex judgment."
- `clm_925363fcc08f` — "An LLM grader should be constrained to an empirical output such as only 'correct' or 'incorrect' or a 1-5 scale, because purely qualitative evaluations are hard to assess quickly and at scale." · p 0.93 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "* **Empirical or specific:** For example, instruct the LLM to output only 'correct' or 'incorrect', or to judge from a scale of 1–5. Purely qualitative evaluations are hard to assess quickly and at scale."
- `clm_b1082dcbaa9d` — "LLM-based grading needs detailed, clear rubrics with concrete pass conditions, and a single use case or even one success criterion may need several rubrics for holistic evaluation." · p 0.92 · active · 1 support · 0 contradict
  - `src_7d6dea537b6b` develop-tests: "* **Have detailed, clear rubrics:** "The answer should always mention 'Acme Inc.' in the first sentence. If it does not, the answer is automatically graded as 'incorrect.'""
- `clm_31458f476385` — "Binary pass/fail verdicts per rubric criterion are more reproducible and debuggable than a 1–10 score, because a model cannot hold a stable absolute scale across runs and human inter-rater reliability on a 1–5 scale is only about 0.45–0.60." · p 0.89 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "A "7/10" is noise — the model can't hold a stable absolute scale across runs, and human inter-rater reliability on 1–5 helpfulness sits around 0.45–0.60 to begin with."
- `clm_75116a77e501` — "Raw accuracy misleads on an imbalanced review set: when 80% of outputs pass, a judge that always says pass scores 80% accuracy with κ near zero, so agreement is reported with precision and recall on defect detection beside it." · p 0.89 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "If 80% of your outputs pass, a judge that always says "pass" scores 80% accuracy but κ ≈ 0 — it's guessing."
- `clm_73819c5676f0` — "LLM judges reward length — GPT-4 picked the longer answer more than 90% of the time once lengths differed by over 20% — so a rubric penalizes length and grades binary per-criterion properties instead of overall quality." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "GPT-4 picked the longer answer >90% of the time when length differed >20% (Saito et al. 2023)"
- `clm_9732a5b1a77d` — "A judge is validated against a golden set of 30–50 self-labelled examples using chance-adjusted agreement (Cohen's κ), with about 0.6 as the practical floor and 0.8 as ship-ready." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Practical floor ≈ 0.6; ship-ready ≈ 0.8."
- `clm_9aaf86ca5c78` — "Superficial "master key" tokens such as a bare colon or "Let's solve step by step" flip judges to PASS with false-positive rates as high as 80%, which is why every finding must carry a quoted line and adversarial garbage outputs belong in the golden set." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: ""master key" tokens produce **false-positive rates as high as 80%**"
- `clm_b6340e4f2211` — "A judge favors its own model family's output — GPT-4's recall was 0.945 on human-favorable answers versus 0.425 on human-unfavorable ones, and GPT-4o's win rate fell 13 points when judged blind — so the judge comes from a different family or is at least blinded to the author." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "GPT-4 recall 0.945 (human-favorable) vs 0.425 (human-unfavorable), a 0.520 gap (Wataoka et al. 2024); GPT-4o's win rate dropped 13 pts when judged blind"
- `clm_c66b3e6a6e03` — "Review direction matters: in Xiang et al.'s LiveCodeBench study Claude reviewing Codex raised accuracy from 71.6% to 89.7% while Codex reviewing Claude lowered it from 91.4% to 82.8%, so the strongest model belongs in the judge seat rather than the author seat." · p 0.88 · active · 1 support · 0 contradict · when: on one LiveCodeBench study of Claude Opus 4.7 and Codex GPT-5.5 whose reviewer could not run tests
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Claude reviewing Codex: 71.6% → 89.7% (+18 pts, p=.001)"
- `clm_d3e2b15c99a9` — "Told the requester's opinion, LLMs affirm whichever side the user takes in 48% of moral-conflict cases and debate framing elicits two to three times more agreement, so a judge prompt states no opinion and frames the question neutrally." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "LLMs affirm whichever side the user takes in **48%** of moral-conflict cases (ELEPHANT, Cheng et al. 2025); debate framing elicits 2–3× more than direct questions"
- `clm_e9cb063c90b5` — "LLM judges prefer whichever answer sits in a given slot — only GPT-4 stayed above 60% consistent when two answers were swapped — so pairwise judging runs both orders or shuffles the options." · p 0.88 · active · 1 support · 0 contradict · when: when judging pairwise
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Only GPT-4 stayed >60% consistent when the two answers were swapped (Zheng et al. 2023, MT-Bench); weaker judges far worse"
- `clm_833e0f66fd4d` — "A panel of smaller judges from disjoint model families outperforms a single large judge, shows less intra-model bias, and costs over seven times less." · p 0.87 · active · 1 support · 0 contradict · when: when the panel's judges come from disjoint model families
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "outperforms a single large judge, exhibits less intra-model bias due to its composition of disjoint model families, and does so while being over seven times less expensive."
- `clm_e137fbb880ba` — "APEX-Agents grades the quality of completed work with expert-authored rubrics scored by an LM judge rather than by programmatic environment checks." · p 0.83 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "APEX-Agents evaluates the quality of completed work. Model outputs are graded using expert-authored rubrics with an LM judge."
- `clm_b37ede827723` — "An LLM-as-judge grader needs close calibration against human experts, an explicit way out such as returning "Unknown" when it lacks information, and one isolated judge per rubric dimension rather than a single judge grading every dimension at once." · p 0.76 · active · 1 support · 0 contradict · when: for model-based graders
  - `src_e66d966eb39d` Demystifying evals for AI agents: "LLM-as-judge graders should be closely calibrated with human experts to gain confidence that there is little divergence between the human grading and model grading."

## Timeline

- 2026-08-23 new_claim `clm_6282902285c5` (src_d0a8a3247101)
- 2026-08-25 new_claim `clm_13a8429fc3d7` (src_43d7ded295ed)
- 2026-08-26 new_claim `clm_f43cd5af876f` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_b37ede827723` (src_e66d966eb39d)
- 2026-08-28 new_claim `clm_31458f476385` (src_521f898b9896)
- 2026-08-28 support_update `clm_13a8429fc3d7` (src_521f898b9896)
- 2026-08-28 new_claim `clm_e9cb063c90b5` (src_521f898b9896)
- 2026-08-28 new_claim `clm_73819c5676f0` (src_521f898b9896)
- 2026-08-28 new_claim `clm_b6340e4f2211` (src_521f898b9896)
- 2026-08-28 new_claim `clm_d3e2b15c99a9` (src_521f898b9896)
- 2026-08-28 new_claim `clm_9aaf86ca5c78` (src_521f898b9896)
- 2026-08-28 new_claim `clm_9732a5b1a77d` (src_521f898b9896)
- 2026-08-28 new_claim `clm_75116a77e501` (src_521f898b9896)
- 2026-08-28 new_claim `clm_c66b3e6a6e03` (src_521f898b9896)
- 2026-08-28 new_claim `clm_833e0f66fd4d` (src_521f898b9896)
- 2026-08-28 support_update `clm_6282902285c5` (src_521f898b9896)
- 2026-08-30 support_update `clm_6282902285c5` (src_99ad4fe8f1dd)
- 2026-09-02 support_update `clm_f43cd5af876f` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_b1082dcbaa9d` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_925363fcc08f` (src_7d6dea537b6b)
- 2026-09-02 new_claim `clm_5a01a3ddf329` (src_7d6dea537b6b)
- 2026-09-14 new_claim `clm_e137fbb880ba` (src_3858898cebb3)

## Related

- ← applies_to [[judge-bias]] (1.00)
- → part_of [[grader]] (1.00)
- ← applies_to [[judge-calibration]] (0.98)
- ← uses [[cross-model-review]] (0.98)
- ← uses [[apex-agents]] (0.83)
- [[judge-bias]] — 5 shared claims
- [[cross-model-review]] — 3 shared claims
- [[grader]] — 3 shared claims
- [[judge-calibration]] — 2 shared claims
- [[agent-evaluation]] — 1 shared claim
- [[agent-loops]] — 1 shared claim
- [[apex-agents]] — 1 shared claim
- [[claude-code]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
- [[skill-evaluation]] — 1 shared claim
