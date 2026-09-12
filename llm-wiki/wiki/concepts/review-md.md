---
type: concept
status: current
created: 2026-08-30
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_review_md]
claim_ids: [clm_43f9d9a54a11, clm_1d63b8bcc9f0, clm_e7b69d4a42b4, clm_a02b62bcf985, clm_2f55b8fed89b]
confidence: 0.93
stale_after: 2029-11-02
last_rendered: 2026-08-30T09:30:07Z
review_required: false
---

# REVIEW.md

> **In here:** The review agents read REVIEW.md as-is: @ import syntax is not expanded and referenced files are not read along with it, so every rule to be enforced must sit directly in the file · 5 claims, confidence 0.93.

## Current understanding

- The review agents read REVIEW.md as-is: @ import syntax is not expanded and referenced files are not read along with it, so every rule to be enforced must sit directly in the file (0.94)
- Code Review reads two guidance files with different force: CLAUDE.md is shared project context whose newly introduced violations are flagged as nits, while REVIEW.md is review-only instruction handed to the agents that find and verify findings and consulted by the ones that rank and report them (0.94)
- A long REVIEW.md dilutes the rules that matter most, so it should carry only instructions that change review behavior, with general project context left in CLAUDE.md (0.93)
- The local /code-review follows CLAUDE.md like any Claude Code session but does not read REVIEW.md, and a background review applies its --fix edits outside the session's checkpoints so /rewind does not undo them (0.93)
- REVIEW.md can tune how a review behaves on an already-reviewed PR — a rule such as suppressing new nits after the first review and posting Important findings only stops a one-line fix from reaching round seven on style alone (0.93)

## Evidence

- `clm_43f9d9a54a11` — "The review agents read REVIEW.md as-is: @ import syntax is not expanded and referenced files are not read along with it, so every rule to be enforced must sit directly in the file." · p 0.94 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "The agents read the file's text as-is, so `REVIEW.md` is plain instructions: [`@` import syntax](/docs/en/memory#import-additional-files) is not expanded, and referenced files are not read along with it."
- `clm_1d63b8bcc9f0` — "Code Review reads two guidance files with different force: CLAUDE.md is shared project context whose newly introduced violations are flagged as nits, while REVIEW.md is review-only instruction handed to the agents that find and verify findings and consulted by the ones that rank and report them." · p 0.94 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "* **`CLAUDE.md`**: shared project instructions that Claude Code uses for all tasks, not just reviews. Code Review reads it as project context and flags newly introduced violations as nits."
- `clm_e7b69d4a42b4` — "A long REVIEW.md dilutes the rules that matter most, so it should carry only instructions that change review behavior, with general project context left in CLAUDE.md." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "Length has a cost: a long `REVIEW.md` dilutes the rules that matter most. Keep it to instructions that change review behavior, and leave general project context in `CLAUDE.md`."
- `clm_a02b62bcf985` — "The local /code-review follows CLAUDE.md like any Claude Code session but does not read REVIEW.md, and a background review applies its --fix edits outside the session's checkpoints so /rewind does not undo them." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "The review follows your `CLAUDE.md` like any Claude Code session, but it doesn't read [`REVIEW.md`](#review-md)."
- `clm_2f55b8fed89b` — "REVIEW.md can tune how a review behaves on an already-reviewed PR — a rule such as suppressing new nits after the first review and posting Important findings only stops a one-line fix from reaching round seven on style alone." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "**Re-review convergence**: tell Claude how to behave when a PR has already been reviewed."

## Timeline

- 2026-08-30 new_claim `clm_1d63b8bcc9f0` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_e7b69d4a42b4` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_43f9d9a54a11` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_2f55b8fed89b` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_a02b62bcf985` (src_1d5f4c9615f1)

## Related

- ← uses [[claude-code-review]] (0.94)
- → related_to [[schema-layer]] (0.93)
- → applies_to [[claude-code-review]] (0.93)
- [[schema-layer]] — 3 shared claims
- [[claude-code-review]] — 2 shared claims
- [[claude-code]] — 1 shared claim
- [[subagents]] — 1 shared claim
