---
type: system
status: current
created: 2026-08-22
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_write_guard]
claim_ids: [clm_a94c83fea089, clm_cc642856daba, clm_f7a4e979038d, clm_44f0d124c01f]
confidence: 0.74
stale_after: 2026-09-27
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# write guard

> **In here:** The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb… · 4 claims, confidence 0.74.

## Current understanding

- The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb and a protected path is denied (0.78)
- Three defects in a text-matching Bash guard came from tokenization rather than policy: mv was treated as destination-only though it removes its source, a multi-line payload guarded only its first line because the tokenizer eats newlines, and a verb glued to a bracket was never recognised (0.73)
- A path guard that normalizes only lexically leaves a symlinked private segment unguarded — inside a worktree whose private segment is a symlink to the root checkout every private path resolved outside the worktree root, and the fix matches both the lexical path and its realpath (0.73)
- A cross-model builder's workspace sandbox refused the one file that registers its own hooks — the patch came back as writing outside of the project — so a reviewer wrote the mirror entries afterwards (0.71)

## Evidence

- `clm_a94c83fea089` — "The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb and a protected path is denied" · p 0.78 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The guards match text; they do not sandbox. The documented consequence is that an unquoted heredoc body naming both a write verb and a protected path is denied even though nothing is being written to that path"
- `clm_cc642856daba` — "Three defects in a text-matching Bash guard came from tokenization rather than policy: mv was treated as destination-only though it removes its source, a multi-line payload guarded only its first line because the tokenizer eats newlines, and a verb glued to a bracket was never recognised" · p 0.73 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "`mv <protected> /tmp/x` was allowed, and worse, pinned as allowed by the generated test, though `mv` removes its source exactly like `rm` does; `mv` now yields every operand while `cp` stays destination-only."
- `clm_f7a4e979038d` — "A path guard that normalizes only lexically leaves a symlinked private segment unguarded — inside a worktree whose private segment is a symlink to the root checkout every private path resolved outside the worktree root, and the fix matches both the lexical path and its realpath" · p 0.73 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The first was the worst: inside a worktree whose private segment is the symlink this same build's worktree hook creates, every private path resolved back to the root checkout and therefore fell outside the worktree root"
- `clm_44f0d124c01f` — "A cross-model builder's workspace sandbox refused the one file that registers its own hooks — the patch came back as writing outside of the project — so a reviewer wrote the mirror entries afterwards" · p 0.71 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The guard family was built by a Codex model through a wrapper, and the one edit its sandbox refused was `.codex/hooks.json` — the file that registers the guards on the Codex side."

## Timeline

- 2026-08-22 new_claim `clm_a94c83fea089` (src_4863372048fa)
- 2026-08-22 new_claim `clm_f7a4e979038d` (src_4863372048fa)
- 2026-08-22 new_claim `clm_cc642856daba` (src_4863372048fa)
- 2026-08-22 new_claim `clm_44f0d124c01f` (src_4863372048fa)

## Related

- → part_of [[hooks]] (0.99)
- → applies_to [[state-layer]] (0.79)
- → applies_to [[segmentation]] (0.77)
- [[hooks]] — 4 shared claims
- [[segmentation]] — 1 shared claim
- [[state-layer]] — 1 shared claim
