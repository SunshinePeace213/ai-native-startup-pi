---
type: workflow
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-field-guide-to-claude-fable-finding-your-unknowns.md, title: "A field guide to Claude Fable 5: Finding your unknowns", id: src_10f512f5f8de}
  - {resource: llm-wiki/raw/articles/anthropic/building-verification-loops-in-claude-code-with-skills.md, title: "Building verification loops in Claude Code with skills", id: src_8e30f40dbfb8}
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md, title: "The AI-Native SDLC playbook", id: src_c65435745c66}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-sonnet-5.md, title: "prompting-claude-sonnet-5", id: src_b6f0e67933fe}
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_code_review]
claim_ids: [clm_6282902285c5, clm_a5e46d967548, clm_03b217447be4, clm_c7ce91b72814, clm_f7b27a70fcaa, clm_076f6360ca74]
confidence: 0.90
stale_after: 2028-04-01
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# code review

> **In here:** Lower measured recall from a code-review harness tuned for an earlier model is a harness effect rather than a capability regression: the model investigates just as deeply but converts fewer… · 6 claims, confidence 0.90.

## Current understanding

- Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not (1.00)
- A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter (0.99)
- Lower measured recall from a code-review harness tuned for an earlier model is a harness effect rather than a capability regression: the model investigates just as deeply but converts fewer investigations into reported findings, so precision rises while recall falls (0.93)
- Applying a solidified verification chain to every PR is what transitions verification from personal habit to team infrastructure, so PR-wide gates should be deferred while the processes behind them are still in flux (0.82)
- Reading the diffs after a long session gives only a light understanding because much of the behavior depends on existing code paths, so the closing move is to have Claude quiz you on the change and merge only after passing it (0.82)
- The traditional controls stop matching reality once agents write most of the diff: reviewing each line by hand made sense when a person had written it and cannot keep up afterwards, while governance costs rise because exceptions still route through committees meeting weekly or monthly (0.81)

## Evidence

- `clm_6282902285c5` — "Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not" · p 1.00 · active · 3 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Use a second agent for code review to reduce the bias of an agent reviewing its own output."
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Claude self-review: unchanged at 91.4%"
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin does not ask the same Claude instance that wrote the code to grade itself. The per-edit check is a deterministic string match with no model involved."
- `clm_a5e46d967548` — "A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter" · p 0.99 · active · 2 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "ask it to report everything and filter in a separate pass instead"
  - `src_1d5f4c9615f1` Code Review: "When a review runs, multiple agents analyze the diff and surrounding code in parallel on Anthropic infrastructure."
- `clm_03b217447be4` — "Lower measured recall from a code-review harness tuned for an earlier model is a harness effect rather than a capability regression: the model investigates just as deeply but converts fewer investigations into reported findings, so precision rises while recall falls" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "This can show up as the model doing the same depth of investigation but converting fewer investigations into reported findings, especially on lower-severity bugs."
- `clm_c7ce91b72814` — "Applying a solidified verification chain to every PR is what transitions verification from personal habit to team infrastructure, so PR-wide gates should be deferred while the processes behind them are still in flux" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "This transitions verification from personal to team infrastructure. Defer PR-wide gates while processes remain in flux."
- `clm_f7b27a70fcaa` — "Reading the diffs after a long session gives only a light understanding because much of the behavior depends on existing code paths, so the closing move is to have Claude quiz you on the change and merge only after passing it" · p 0.82 · active · 1 support · 0 contradict · when: post implementation
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "Asking Claude to quiz me about the change after giving me a bunch of context helps me understand what happens. I only merge after I pass the quiz perfectly."
- `clm_076f6360ca74` — "The traditional controls stop matching reality once agents write most of the diff: reviewing each line by hand made sense when a person had written it and cannot keep up afterwards, while governance costs rise because exceptions still route through committees meeting weekly or monthly" · p 0.81 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "Reviewing each line by hand made sense when a person had written it, but it can't keep up once agents write most of the diff."

## Timeline

- 2026-08-23 new_claim `clm_a5e46d967548` (src_26d415487f93)
- 2026-08-23 new_claim `clm_03b217447be4` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_c7ce91b72814` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_6282902285c5` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_f7b27a70fcaa` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_076f6360ca74` (src_c65435745c66)
- 2026-08-28 support_update `clm_6282902285c5` (src_521f898b9896)
- 2026-08-30 support_update `clm_6282902285c5` (src_99ad4fe8f1dd)
- 2026-08-30 support_update `clm_a5e46d967548` (src_1d5f4c9615f1)

## Related

- → applies_to [[claude-sonnet-5]] (0.93)
- → applies_to [[claude-opus-5]] (0.91)
- ← related_to [[verification-loop]] (0.82)
- ← related_to [[unknowns]] (0.82)
- ← applies_to [[ai-native-sdlc]] (0.81)
- ← uses [[agent-loops]] (0.78)
- [[agent-loops]] — 1 shared claim
- [[ai-native-sdlc]] — 1 shared claim
- [[claude-code]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[claude-opus-5]] — 1 shared claim
- [[claude-sonnet-5]] — 1 shared claim
- [[cross-model-review]] — 1 shared claim
- [[llm-as-judge]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[unknowns]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
