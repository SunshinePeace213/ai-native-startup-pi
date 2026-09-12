---
type: concept
status: current
created: 2026-08-28
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_cross_model_review]
claim_ids: [clm_6282902285c5, clm_c66b3e6a6e03, clm_833e0f66fd4d]
confidence: 0.92
stale_after: 2029-01-11
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# cross-model review

> **In here:** Review direction matters: in Xiang et al.'s LiveCodeBench study Claude reviewing Codex raised accuracy from 71.6% to 89.7% while Codex reviewing Claude lowered it from 91.4% to 82.8%, so the… · 3 claims, confidence 0.92.

## Current understanding

- Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not (1.00)
- Review direction matters: in Xiang et al.'s LiveCodeBench study Claude reviewing Codex raised accuracy from 71.6% to 89.7% while Codex reviewing Claude lowered it from 91.4% to 82.8%, so the strongest model belongs in the judge seat rather than the author seat (0.88)
- A panel of smaller judges from disjoint model families outperforms a single large judge, shows less intra-model bias, and costs over seven times less (0.87)

## Evidence

- `clm_6282902285c5` — "Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not" · p 1.00 · active · 3 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Use a second agent for code review to reduce the bias of an agent reviewing its own output."
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Claude self-review: unchanged at 91.4%"
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin does not ask the same Claude instance that wrote the code to grade itself. The per-edit check is a deterministic string match with no model involved."
- `clm_c66b3e6a6e03` — "Review direction matters: in Xiang et al.'s LiveCodeBench study Claude reviewing Codex raised accuracy from 71.6% to 89.7% while Codex reviewing Claude lowered it from 91.4% to 82.8%, so the strongest model belongs in the judge seat rather than the author seat." · p 0.88 · active · 1 support · 0 contradict · when: on one LiveCodeBench study of Claude Opus 4.7 and Codex GPT-5.5 whose reviewer could not run tests
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Claude reviewing Codex: 71.6% → 89.7% (+18 pts, p=.001)"
- `clm_833e0f66fd4d` — "A panel of smaller judges from disjoint model families outperforms a single large judge, shows less intra-model bias, and costs over seven times less." · p 0.87 · active · 1 support · 0 contradict · when: when the panel's judges come from disjoint model families
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "outperforms a single large judge, exhibits less intra-model bias due to its composition of disjoint model families, and does so while being over seven times less expensive."

## Timeline

- 2026-08-23 new_claim `clm_6282902285c5` (src_d0a8a3247101)
- 2026-08-28 new_claim `clm_c66b3e6a6e03` (src_521f898b9896)
- 2026-08-28 new_claim `clm_833e0f66fd4d` (src_521f898b9896)
- 2026-08-28 support_update `clm_6282902285c5` (src_521f898b9896)
- 2026-08-30 support_update `clm_6282902285c5` (src_99ad4fe8f1dd)

## Related

- → uses [[llm-as-judge]] (0.98)
- [[llm-as-judge]] — 3 shared claims
- [[agent-loops]] — 1 shared claim
- [[claude-code]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
