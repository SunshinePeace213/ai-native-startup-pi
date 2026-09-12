---
source: note:llm-wiki-phase-6-governance-build-notes
date: 2026-08-22
author: ringo
sensitivity: internal
title: Phase 6 governance build notes — the fold key, the guards, and what the loops measured
---

# Phase 6 governance build notes — the fold key, the guards, and what the loops measured

> **In here:** what the Phase 6 governance build of the llm-wiki state layer decided about the fold key, what the reordering actually moved, and what the guard family and the union retriever measured, written as working notes while the build ran.

## The fold key and the invariant that makes it safe

The plan asked for ledger rows to fold in `(timestamp, run_id, file order)`. The engine builder shipped `(timestamp, file order)` instead, because the literal key replays a same-second dependent run before the run it depends on: two runs sharing a timestamp order by the hex of their `run_id`, so a support or a supersession can replay before the claim it targets exists. Thirteen core tests hit a `KeyError` on that, and any two dependent runs inside one wall-clock second — which the inbox drain produces by construction — hit it too.

The resolution kept the plan's key and gave the engine the invariant that makes it causal: a write run's stamp is strictly after the newest stamp on any replayed ledger row, computed as `max(now, newest + 1 second)`. Inside one checkout runs can no longer tie, so the `run_id` component of the key only ever orders runs from two independent branches — exactly the cross-branch case the locked decision exists for — and the views come out direction-independent under a union merge. The cost is one extra pass over the five ledgers per write run, and one behavior change: a repeat decay at the newest stamp now fails rather than reporting `unchanged`, because `--as-of` must be strictly later than the newest ledger stamp.

## What the reordering actually moved

Sorting the readers was measured on the live vault before anything else in the engine landed, and it was not free: `rebuild --check` reported the entities and relationships views differing from the ledgers. On a scratch copy the diff was exact — 20 of 44 entity rows moved and 11 of 100 relationship rows moved, and in every case the only field that changed was an evidence list. `source_observations` on the entities, `supporting_observations` on all eleven relationships and `claim_ids` on eight of them: the same multiset, re-ordered. The claims, unresolved-conflicts, and snapshot views were byte-identical.

No entity's name, aliases, `merged_from`, type, page, or confidence changed, and no claim's `entity_ids` moved, so no resolution moved. The cause was three timestamp inversions across the eight per-source observation files, which the old reader concatenated by file name; the sources and transitions ledgers were already ascending. Both views were landed through a single audited rebuild rather than a hand edit, and the render and graph checks stayed clean across it — no page moved.

## Codex could not write its own registration

The guard family was built by a Codex model through a wrapper, and the one edit its sandbox refused was `.codex/hooks.json` — the file that registers the guards on the Codex side. The patch came back as `writing outside of the project`, so the mirror entries were written afterwards by the reviewer instead. It is a small thing and a funny one: the sandbox that stops a coding agent from reaching outside its workspace also stops it from installing its own hooks, and the registration a cross-model builder cannot write is the one that would have governed it.

## The four defects a review pass found in the guards

The reviewer's read of the Codex diff found four real holes, each probed and pinned with a test. The first was the worst: inside a worktree whose private segment is the symlink this same build's worktree hook creates, every private path resolved back to the root checkout and therefore fell outside the worktree root — the whole private segment was unguarded in every worktree. The fix matches both the lexically normalized path and its realpath, which is the technique the repo's existing sensitive-files guard already used.

The other three were in the Bash guard. `mv <protected> /tmp/x` was allowed, and worse, pinned as allowed by the generated test, though `mv` removes its source exactly like `rm` does; `mv` now yields every operand while `cp` stays destination-only. A multi-line Bash payload guarded only its first line, because the tokenizer eats newlines — an unquoted newline now splits a command like a semicolon. And `(rm …)` or `$(truncate …)` glued the verb to a bracket, so the verb was never recognised; brackets joined the boundary set. Everything else the reviewer probed — relative segments, trailing slashes, symlinks into the vault, a working directory outside the root, sibling checkouts, truncated payloads — was already refuted.

## The false positive the guard family accepts, met first-hand

The guards match text; they do not sandbox. The documented consequence is that an unquoted heredoc body naming both a write verb and a protected path is denied even though nothing is being written to that path — and the build lead met it immediately, when the first attempt to append a notes entry through a heredoc that quoted an append probe was blocked by the live guard. The entry landed through a scratch file instead. That is the posture the plan asked for, mirroring the repo's destructive-guard hook: refuse on a confirmed protected path, accept the occasional false positive, and never pretend to be a sandbox. It also means the guard's first observed block in this build was on the build's own author.

## The union retriever landed exactly on the floor

The retrieval floor for this phase was Phase 5's live numbers, fused MRR 0.519188 at recall 0.794118 over the 34-case golden set. The union retriever under the new config measures those figures exactly, on a vault where no private segment contributes to the eval — the eval reads the shared segment alone by contract. Nothing in the scoring path was tuned during the phase; the config changed its version string and gained a private collections block and nothing else, which is why the number is allowed to be a repeat rather than an improvement. A governance phase that moved retrieval at all would have been a phase that did something it was not asked to do.
