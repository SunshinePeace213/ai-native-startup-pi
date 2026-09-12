---
type: workflow
status: current
created: 2026-08-25
updated: 2026-08-28
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/best-practices.md, title: "Best practices for skill creators", id: src_58c8a3f32b3f}
  - {resource: llm-wiki/raw/docs/agent-skills/evaluating-skills.md, title: "Evaluating skill output quality", id: src_43d7ded295ed}
  - {resource: llm-wiki/raw/docs/agent-skills/optimizing-descriptions.md, title: "Optimizing skill descriptions", id: src_2435d7ebda83}
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-08-28}
entity_ids: [ent_skill_evaluation]
claim_ids: [clm_13a8429fc3d7, clm_5b11d3ad951c, clm_67dc00c85c0b, clm_0335d473cad6, clm_42bb868ef1cb, clm_e531bde51ac9, clm_f112d81f86c1, clm_e3e5baaddc59, clm_de14bf30813a, clm_5c17d8431d06, clm_4d6095eefb88, clm_016c426f3348, clm_5be2fb3d0b5d, clm_197c7673976d, clm_20c02c1a02c6, clm_21cd55d9f5b1, clm_64cb36f40ff5]
confidence: 0.88
stale_after: 2028-11-17
last_rendered: 2026-08-28T15:07:26Z
review_required: false
---

# skill evaluation

> **In here:** skill evaluation — 17 claims, confidence 0.88, 4 sources.

## Current understanding

- Grading requires concrete evidence quoted from the output for a PASS rather than the benefit of the doubt, and the assertions themselves are reviewed for being too easy, too hard, or unverifiable (0.98)
- Optimizing a description against every query overfits it to those phrasings, so the query set splits into a train set that guides revisions and a held-out validation set that checks whether improvements generalize (0.88)
- Because model behavior is nondeterministic, each query should run several times (three is a reasonable start) and be scored on trigger rate against a threshold rather than a single pass or fail (0.88)
- The valuable negative test cases are near-misses that share keywords or concepts with the skill but need something different, because they test whether the description is precise rather than merely broad (0.88)
- Revising a description means addressing the general category the failed queries represent rather than pasting in their specific keywords, which is overfitting (0.88)
- A trigger eval set should run to about 20 realistic queries, 8-10 labeled should-trigger and 8-10 should-not-trigger, varied in phrasing, explicitness, detail, and complexity (0.88)
- The best description is selected by validation pass rate and may not be the last one produced, since a later iteration can overfit the train set; five iterations is usually enough (0.88)
- Even a single pass of running a skill against real tasks and revising from the results noticeably improves quality, and complex domains often benefit from several passes (0.88)
- The core eval pattern runs each test case twice — once with the skill and once without it or with the previous version — so the skill's contribution is measured against a baseline rather than assumed (0.87)
- Skill authors should read agent execution traces rather than only final outputs, because wasted steps point to instructions that are too vague, instructions that do not apply, or too many options offered without a clear default (0.87)
- Assertions are verifiable statements about the output and are written after the first round of outputs, because what good looks like is often unknown until the skill has run (0.87)
- Assertions that pass in both the with-skill and without-skill configurations should be removed or replaced: they inflate the with-skill pass rate without reflecting any skill value (0.87)
- Skill evals should start at 2-3 test cases and expand later, rather than over-investing in a large set before the first round of results is seen (0.87)
- Each eval run must start from a clean context with no leftover state from previous runs or from skill development, so the agent follows only what SKILL.md tells it; subagents give this isolation naturally and otherwise a separate session per run is needed (0.87)
- The benchmark delta states what the skill costs in time and tokens against what it buys in pass rate, so a skill adding 13 seconds for 50 points of pass rate is worth it while one doubling tokens for 2 points may not be (0.87)
- The eval loop stops when results are satisfactory, human feedback is consistently empty, or iterations stop yielding meaningful improvement (0.86)
- Comparing two skill versions benefits from blind comparison — an LLM judge scoring both outputs without knowing which version produced which — because two outputs can pass every assertion yet differ in overall quality (0.86)

## Evidence

- `clm_13a8429fc3d7` — "Grading requires concrete evidence quoted from the output for a PASS rather than the benefit of the doubt, and the assertions themselves are reviewed for being too easy, too hard, or unverifiable." · p 0.98 · active · 2 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "**Require concrete evidence for a PASS.** Don't give the benefit of the doubt."
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "force the judge to quote the exact offending line for every issue. This one trick kills most hallucinated criticism and most token-gaming."
- `clm_5b11d3ad951c` — "Optimizing a description against every query overfits it to those phrasings, so the query set splits into a train set that guides revisions and a held-out validation set that checks whether improvements generalize." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "If you optimize the description against all your queries, you risk overfitting — crafting a description that works for these specific phrasings but fails on new ones."
- `clm_67dc00c85c0b` — "Because model behavior is nondeterministic, each query should run several times (three is a reasonable start) and be scored on trigger rate against a threshold rather than a single pass or fail." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "Model behavior is nondeterministic — the same query might trigger the skill on one run but not the next."
- `clm_0335d473cad6` — "The valuable negative test cases are near-misses that share keywords or concepts with the skill but need something different, because they test whether the description is precise rather than merely broad." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "The most valuable negative test cases are **near-misses** — queries that share keywords or concepts with your skill but actually need something different."
- `clm_42bb868ef1cb` — "Revising a description means addressing the general category the failed queries represent rather than pasting in their specific keywords, which is overfitting." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "Avoid adding specific keywords from failed queries — that's overfitting."
- `clm_e531bde51ac9` — "A trigger eval set should run to about 20 realistic queries, 8-10 labeled should-trigger and 8-10 should-not-trigger, varied in phrasing, explicitness, detail, and complexity." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "Aim for about 20 queries: 8-10 that should trigger and 8-10 that shouldn't."
- `clm_f112d81f86c1` — "The best description is selected by validation pass rate and may not be the last one produced, since a later iteration can overfit the train set; five iterations is usually enough." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "Note that the best description may not be the last one you produced; an earlier iteration might have a higher validation pass rate than later ones that overfit to the train set."
- `clm_e3e5baaddc59` — "Even a single pass of running a skill against real tasks and revising from the results noticeably improves quality, and complex domains often benefit from several passes." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "Even a single pass of execute-then-revise noticeably improves quality, and complex domains often benefit from several."
- `clm_de14bf30813a` — "The core eval pattern runs each test case twice — once with the skill and once without it or with the previous version — so the skill's contribution is measured against a baseline rather than assumed." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "The core pattern is to run each test case twice: once **with the skill** and once **without it** (or with a previous version). This gives you a baseline to compare against."
- `clm_5c17d8431d06` — "Skill authors should read agent execution traces rather than only final outputs, because wasted steps point to instructions that are too vague, instructions that do not apply, or too many options offered without a clear default." · p 0.87 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "Read agent execution traces, not just final outputs."
- `clm_4d6095eefb88` — "Assertions are verifiable statements about the output and are written after the first round of outputs, because what good looks like is often unknown until the skill has run." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "Assertions are verifiable statements about what the output should contain or achieve. Add them after you see your first round of outputs — you often don't know what "good" looks like until the skill has run."
- `clm_016c426f3348` — "Assertions that pass in both the with-skill and without-skill configurations should be removed or replaced: they inflate the with-skill pass rate without reflecting any skill value." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "**Remove or replace assertions that always pass in both configurations.** These don't tell you anything useful — the model handles them fine without the skill."
- `clm_5be2fb3d0b5d` — "Skill evals should start at 2-3 test cases and expand later, rather than over-investing in a large set before the first round of results is seen." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "**Start with 2-3 test cases.** Don't over-invest before you've seen your first round of results."
- `clm_197c7673976d` — "Each eval run must start from a clean context with no leftover state from previous runs or from skill development, so the agent follows only what SKILL.md tells it; subagents give this isolation naturally and otherwise a separate session per run is needed." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "Each eval run should start with a clean context — no leftover state from previous runs or from the skill development process."
- `clm_20c02c1a02c6` — "The benchmark delta states what the skill costs in time and tokens against what it buys in pass rate, so a skill adding 13 seconds for 50 points of pass rate is worth it while one doubling tokens for 2 points may not be." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "The `delta` tells you what the skill costs (more time, more tokens) and what it buys (higher pass rate)."
- `clm_21cd55d9f5b1` — "The eval loop stops when results are satisfactory, human feedback is consistently empty, or iterations stop yielding meaningful improvement." · p 0.86 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "Stop when you're satisfied with the results, feedback is consistently empty, or you're no longer seeing meaningful improvement between iterations."
- `clm_64cb36f40ff5` — "Comparing two skill versions benefits from blind comparison — an LLM judge scoring both outputs without knowing which version produced which — because two outputs can pass every assertion yet differ in overall quality." · p 0.86 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "For comparing two skill versions, try **blind comparison**: present both outputs to an LLM judge without revealing which came from which version."

## Timeline

- 2026-08-25 new_claim `clm_e3e5baaddc59` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_5c17d8431d06` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_e531bde51ac9` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_0335d473cad6` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_67dc00c85c0b` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_5b11d3ad951c` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_42bb868ef1cb` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_f112d81f86c1` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_de14bf30813a` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_5be2fb3d0b5d` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_197c7673976d` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_4d6095eefb88` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_13a8429fc3d7` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_20c02c1a02c6` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_016c426f3348` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_64cb36f40ff5` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_21cd55d9f5b1` (src_43d7ded295ed)
- 2026-08-28 support_update `clm_13a8429fc3d7` (src_521f898b9896)

## Related

- → applies_to [[skills]] (1.00)
- → produces [[skill-description]] (0.98)
- → applies_to [[skill-description]] (0.98)
- ← part_of [[skill-description]] (0.88)
- → uses [[skills]] (0.87)
- → uses [[skill-md]] (0.87)
- [[skill-description]] — 5 shared claims
- [[skills]] — 4 shared claims
- [[llm-as-judge]] — 1 shared claim
- [[skill-md]] — 1 shared claim
