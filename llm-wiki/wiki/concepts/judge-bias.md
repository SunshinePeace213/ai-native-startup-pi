---
type: concept
status: current
created: 2026-08-28
updated: 2026-08-28
sources:
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-08-28}
entity_ids: [ent_judge_bias]
claim_ids: [clm_73819c5676f0, clm_9aaf86ca5c78, clm_b6340e4f2211, clm_d3e2b15c99a9, clm_e9cb063c90b5]
confidence: 0.88
stale_after: 2029-02-23
last_rendered: 2026-08-28T15:07:26Z
review_required: false
---

# judge bias

> **In here:** LLM judges reward length — GPT-4 picked the longer answer more than 90% of the time once lengths differed by over 20% · 5 claims, confidence 0.88.

## Current understanding

- LLM judges reward length — GPT-4 picked the longer answer more than 90% of the time once lengths differed by over 20% — so a rubric penalizes length and grades binary per-criterion properties instead of overall quality (0.88)
- Superficial "master key" tokens such as a bare colon or "Let's solve step by step" flip judges to PASS with false-positive rates as high as 80%, which is why every finding must carry a quoted line and adversarial garbage outputs belong in the golden set (0.88)
- A judge favors its own model family's output — GPT-4's recall was 0.945 on human-favorable answers versus 0.425 on human-unfavorable ones, and GPT-4o's win rate fell 13 points when judged blind — so the judge comes from a different family or is at least blinded to the author (0.88)
- Told the requester's opinion, LLMs affirm whichever side the user takes in 48% of moral-conflict cases and debate framing elicits two to three times more agreement, so a judge prompt states no opinion and frames the question neutrally (0.88)
- LLM judges prefer whichever answer sits in a given slot — only GPT-4 stayed above 60% consistent when two answers were swapped — so pairwise judging runs both orders or shuffles the options (0.88)

## Evidence

- `clm_73819c5676f0` — "LLM judges reward length — GPT-4 picked the longer answer more than 90% of the time once lengths differed by over 20% — so a rubric penalizes length and grades binary per-criterion properties instead of overall quality." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "GPT-4 picked the longer answer >90% of the time when length differed >20% (Saito et al. 2023)"
- `clm_9aaf86ca5c78` — "Superficial "master key" tokens such as a bare colon or "Let's solve step by step" flip judges to PASS with false-positive rates as high as 80%, which is why every finding must carry a quoted line and adversarial garbage outputs belong in the golden set." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: ""master key" tokens produce **false-positive rates as high as 80%**"
- `clm_b6340e4f2211` — "A judge favors its own model family's output — GPT-4's recall was 0.945 on human-favorable answers versus 0.425 on human-unfavorable ones, and GPT-4o's win rate fell 13 points when judged blind — so the judge comes from a different family or is at least blinded to the author." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "GPT-4 recall 0.945 (human-favorable) vs 0.425 (human-unfavorable), a 0.520 gap (Wataoka et al. 2024); GPT-4o's win rate dropped 13 pts when judged blind"
- `clm_d3e2b15c99a9` — "Told the requester's opinion, LLMs affirm whichever side the user takes in 48% of moral-conflict cases and debate framing elicits two to three times more agreement, so a judge prompt states no opinion and frames the question neutrally." · p 0.88 · active · 1 support · 0 contradict
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "LLMs affirm whichever side the user takes in **48%** of moral-conflict cases (ELEPHANT, Cheng et al. 2025); debate framing elicits 2–3× more than direct questions"
- `clm_e9cb063c90b5` — "LLM judges prefer whichever answer sits in a given slot — only GPT-4 stayed above 60% consistent when two answers were swapped — so pairwise judging runs both orders or shuffles the options." · p 0.88 · active · 1 support · 0 contradict · when: when judging pairwise
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Only GPT-4 stayed >60% consistent when the two answers were swapped (Zheng et al. 2023, MT-Bench); weaker judges far worse"

## Timeline

- 2026-08-28 new_claim `clm_e9cb063c90b5` (src_521f898b9896)
- 2026-08-28 new_claim `clm_73819c5676f0` (src_521f898b9896)
- 2026-08-28 new_claim `clm_b6340e4f2211` (src_521f898b9896)
- 2026-08-28 new_claim `clm_d3e2b15c99a9` (src_521f898b9896)
- 2026-08-28 new_claim `clm_9aaf86ca5c78` (src_521f898b9896)

## Related

- → applies_to [[llm-as-judge]] (1.00)
- [[llm-as-judge]] — 5 shared claims
