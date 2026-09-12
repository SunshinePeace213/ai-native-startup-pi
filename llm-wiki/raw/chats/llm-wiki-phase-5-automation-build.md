---
source: session:llm-wiki-phase-5-automation-build
date: 2026-08-22
author: ringo
title: llm-wiki Phase 5 automation build — what the session asked, found, and decided
---

# llm-wiki Phase 5 automation build — what the session asked, found, and decided

> **In here:** what the build session for the llm-wiki automation plan worked out — the measured effect of the stopword fix, why a human confirmation needs an override to close a review, the merge of claim status into claim, and the questions the retune leaves open.

## Asked

Build the Phase 5 automation plan on the branch without a worktree and without the Codex gate: the read-only queue and review verbs, a hook family that reports and never writes, the crystallize and review commands, the weekly routine prompt, the retriever's folding, prefixes, and path seeds under the fusion-v2 config, a golden set past thirty cases with its baseline recorded first, and a pilot of every loop on the live vault.

## Found

Dropping the word own from the retriever's stopword table moved the superseded ownership claim on "who used to own the wiki layer" from rank 22 to rank 5: once the token reached the state stream it matched ownership by prefix, the claim took state rank 1 and graph rank 1, and it carried the highest reciprocal-rank score in the result, 0.0549, sitting fifth only on its belief multiplier of 1.178 against the leaders' 1.28.

A human supports observation lands as a support_update and never marks a claim reviewed; only a human_override transition adds the claim to the engine's reviewed set. The first Confirm on the schema-role claim raised its probability to 0.9996 and left it in the review queue with seven pages still marked review_required.

The engine's --root flag is global and precedes the verb, so the hooks run the queue as `uv run scripts/llm_wiki_state.py --root <root> queue --json`; the verb-first order the plan wrote exits 2 with unrecognized arguments.

The retrieve test fixture has never satisfied rebuild --check: its views carry hand-authored log-odds, entity ids, exceptions, and a supersession that a rebuild would overwrite, so fixture rows are hand-authored and held by schema validation, render check, and the suite instead.

Every hand-off was re-run at the lead's seat before its checkpoint, and two of the eight came back wrong in ways their builders had reported as done: the stopword that removed the prefix rule's token, and the confirmation that never closed the review.

## Decided

Confirm and Restore file a human supports observation with the claim's current text plus an override to status active, so the engine lands the override and closes the review while the numbers stay untouched; the state rule's verdict table carries the override on that row.

The entity claim status merged into claim, because a claim's status is a property of the claim and not a separate concept; its page stopped rendering and its name and alias joined claim's aliases.

The word own left the stopword table because the plan's worked example requires it; the guardrail that query tokens stay unchanged describes the fold's reach, not the tokenizer's table.

The weekly routine's creation facts name the model by its alias, opus, because a dated model id is banned under the harness directory.

## Open

Whether the historical profile should read the belief a claim held before its supersession: the retune and the stopword fix put the superseded claim fifth, and the remaining gap to rank one is the belief multiplier alone.

How path seeds should treat a graph that holds a direct edge beside the chain it summarises: the shortest path between the raw layer and the wiki layer is one hop, so the state layer is never seeded and the connective claim answers at rank ten through the endpoints.

Three golden-set cases that targeted the needs_review flag on the schema-role claim lost their target when the claim was confirmed; they retarget to the vault's one remaining flag, the superseded ownership claim.
