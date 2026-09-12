---
type: workflow
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/ai-code-migration.md, title: "How Anthropic runs large-scale code migrations with Claude Code", id: src_40c83dc51471}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_code_migration]
claim_ids: [clm_3d7856c9caeb, clm_63175a6747fc, clm_a06bb81936ef, clm_bbc9bf25bc6d, clm_f90f20a1105f, clm_ff02f6a4cae9, clm_01ab6a8be656, clm_6134d99b8bc9, clm_678bac7431c0, clm_c56a98949824]
confidence: 0.79
stale_after: 2027-11-22
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# code migration

> **In here:** The core discipline of an AI code migration is that you do not fix the code, you fix the loop that produced it: a mistake recurring across files is repaired by adding a sentence to the rulebook and… · 10 claims, confidence 0.79.

## Current understanding

- The core discipline of an AI code migration is that you do not fix the code, you fix the loop that produced it: a mistake recurring across files is repaired by adding a sentence to the rulebook and regenerating the affected batch, never by hand-patching the output (0.79)
- A shakedown-cruise mini-migration stress-tests the rulebook before it propagates, catching critical issues while they are still cheap — and its translated files are thrown away regardless, because the goal of the step is refining rules rather than progress (0.79)
- Migrations at this scale remain expensive: Bun's Zig-to-Rust port consumed 5.9 billion uncached input tokens and 690 million output tokens, roughly $165,000 at API pricing (0.79)
- A build daemon is made the only process allowed to rebuild the binary so the most expensive operation is serialized: fixer agents write patches, the daemon batches them, rebuilds once, reruns the affected tests, and feeds the results back (0.79)
- The migration work queue is mechanical and resumable by construction: a batch script checks which translated files already exist on disk and slices the rest into batches, so done means the output file exists (0.79)
- Large migrations suit agents because the old code is a clear comprehensive spec and the existing test suite is a built-in referee letting agents grind against objective ground truth, with each failing compiler or test run generating the next work-queue item automatically (0.79)
- A migration's prerequisite is a strong judge able to evaluate original and target code on equal terms: portable tests rewritten into assertions runnable against both codebases, adversarial agents checking that the rewrites did not weaken the assertions, and the judge itself validated against both correct and deliberately broken code (0.79)
- A migration should not run the largest model for everything: the large model is reserved for reviewers and rule-writing while smaller models carry the high-volume implementation work (0.79)
- A missing test suite does not block the behavior-matching step: where no referee can be inherited, Claude builds one, because the original codebase remains the ground truth either way (0.79)
- An AI code migration is one where engineers write the migration rules and verification loops while agents translate, compile, and test until the new version's behavior matches the original — compressing what were multi-year projects into weeks (0.79)

## Evidence

- `clm_3d7856c9caeb` — "The core discipline of an AI code migration is that you do not fix the code, you fix the loop that produced it: a mistake recurring across files is repaired by adding a sentence to the rulebook and regenerating the affected batch, never by hand-patching the output" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "escalated to a third agent; a recurring mistake across files gets fixed by adding a sentence to the rulebook and regenerating the affected batch, rather than hand-patching code."
- `clm_63175a6747fc` — "A shakedown-cruise mini-migration stress-tests the rulebook before it propagates, catching critical issues while they are still cheap — and its translated files are thrown away regardless, because the goal of the step is refining rules rather than progress" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "Translated files from this step are thrown away regardless — the goal is refining rules, not progress."
- `clm_a06bb81936ef` — "Migrations at this scale remain expensive: Bun's Zig-to-Rust port consumed 5.9 billion uncached input tokens and 690 million output tokens, roughly $165,000 at API pricing" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "the Bun migration consumed 5.9 billion uncached input tokens and 690 million output tokens, roughly $165,000 at API pricing"
- `clm_bbc9bf25bc6d` — "A build daemon is made the only process allowed to rebuild the binary so the most expensive operation is serialized: fixer agents write patches, the daemon batches them, rebuilds once, reruns the affected tests, and feeds the results back" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "fixers write patches, the daemon batches them, rebuilds once, reruns affected tests, and feeds results back, serializing the most expensive operation"
- `clm_f90f20a1105f` — "The migration work queue is mechanical and resumable by construction: a batch script checks which translated files already exist on disk and slices the rest into batches, so done means the output file exists" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "The work queue is mechanical: a batch script checks which translated files exist on disk and slices the rest into batches, making the migration resumable by construction."
- `clm_ff02f6a4cae9` — "Large migrations suit agents because the old code is a clear comprehensive spec and the existing test suite is a built-in referee letting agents grind against objective ground truth, with each failing compiler or test run generating the next work-queue item automatically" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "large codebases usually have a built-in referee (an existing test suite) that lets agents grind against objective ground truth; failing compiler/test runs generate the next work-queue item automatically"
- `clm_01ab6a8be656` — "A migration's prerequisite is a strong judge able to evaluate original and target code on equal terms: portable tests rewritten into assertions runnable against both codebases, adversarial agents checking that the rewrites did not weaken the assertions, and the judge itself validated against both correct and deliberately broken code" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "rewriting the portable ones into assertions runnable against both codebases (checked by adversarial agents so rewrites don't weaken assertions); and validating the judge itself against both correct and deliberately broken code"
- `clm_6134d99b8bc9` — "A migration should not run the largest model for everything: the large model is reserved for reviewers and rule-writing while smaller models carry the high-volume implementation work" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "Don't use the largest model for everything — reserve it for reviewers and rule-writing, and use smaller models for high-volume implementation."
- `clm_678bac7431c0` — "A missing test suite does not block the behavior-matching step: where no referee can be inherited, Claude builds one, because the original codebase remains the ground truth either way" · p 0.79 · active · 1 support · 0 contradict · when: for codebases without a built-out test suite
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "a missing test suite doesn't block this step — if you can't inherit a referee, have Claude build one, since the original codebase remains the ground truth either way"
- `clm_c56a98949824` — "An AI code migration is one where engineers write the migration rules and verification loops while agents translate, compile, and test until the new version's behavior matches the original — compressing what were multi-year projects into weeks" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "It defines an AI code migration as one where engineers write migration rules and verification loops and agents translate, compile, and test code until the new version's behavior matches the original"

## Timeline

- 2026-08-23 new_claim `clm_3d7856c9caeb` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_c56a98949824` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_ff02f6a4cae9` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_01ab6a8be656` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_63175a6747fc` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_6134d99b8bc9` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_f90f20a1105f` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_bbc9bf25bc6d` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_a06bb81936ef` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_678bac7431c0` (src_40c83dc51471)

## Related

- → depends_on [[verification-loop]] (0.79)
- → uses [[adversarial-verification]] (0.79)
- → uses [[model-selection]] (0.79)
- → uses [[verification-loop]] (0.79)
- [[verification-loop]] — 2 shared claims
- [[adversarial-verification]] — 1 shared claim
- [[model-selection]] — 1 shared claim
