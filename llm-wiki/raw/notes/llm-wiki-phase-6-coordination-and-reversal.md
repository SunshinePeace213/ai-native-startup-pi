---
source: note:llm-wiki-phase-6-coordination-and-reversal
date: 2026-08-22
author: ringo
sensitivity: internal
title: Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach
---

# Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach

> **In here:** how the Phase 6 governance layer coordinates two writers and reverses a bad write — the lock and its recorded holder, the inbox as the boundary between proposing and applying, and the stack rule that decides which runs undo can reach.

## The lock records its holder rather than merely excluding

Every write verb of the engine and every render that writes takes an exclusive advisory lock on a single file under the state folder, polling for the timeout the tracked policy names and then failing rather than waiting forever. What makes it useful in practice is not the exclusion but the record: on acquiring the lock the holder writes its own process id, actor, verb, and start time into the file, so the second writer's refusal names who is holding it instead of saying only that something is.

The failure mode this leaves is deliberate and cheap. The lock file is never removed, so a crashed holder leaves a stale record behind — but the kernel released the advisory lock with the process, so the next writer takes it immediately and overwrites the record. A stale line in that file is therefore informational, never a lock to break by hand, and no cleanup path is needed.

## The inbox is where proposing stops and applying begins

A proposal is a file of extracted observations dropped into an inbox folder under the state layer, named for the actor that wrote it, a timestamp, and six hex digits. The engine drains that folder in file-name order, one run per file, and removes each file the moment its run lands. An invalid file is left exactly where it is with its diagnostics printed, the drain continues past it, and the whole command exits non-zero at the end — so one bad proposal never costs the good ones in the same batch.

That split is what lets an actor propose work it is not permitted to land. The weekly routine has no permission to apply on the shared segment, but nothing stops it writing a proposal; the file waits until a human or agent session drains the inbox under its own actor, and the run is recorded against the actor that applied it rather than the one that wrote the file. Authorship of the proposal and responsibility for the write are separated on purpose.

## The stack rule is a consequence of replaying recorded snapshots

Undo appends a retraction row rather than deleting anything, and the replay then skips every row the retracted run appended. That is enough to make a merge or an observation-less registration reversible from any position, because neither carries belief. A belief run — an apply, a decay pass, or a registration whose source brought observations — may only be undone while it is the newest live one, and the engine refuses by name otherwise, telling the caller which run to undo first.

The reason is in how the fold works. Probability and status come from each transition's recorded after-snapshot, while log-odds replay as deltas; removing a run from the middle of the stack would leave every later claim carrying a snapshot that its own history no longer produces. The alternative — recomputing probability and status on replay — would move claims retroactively and make a byte-identical rebuild impossible, so it was rejected and recorded as a follow-up rather than shipped behind a flag.

## Rows written before the run record are not retractable

Retraction is keyed on the run identifier stamped on every row a run appends, which means rows that predate the governance layer carry no such identifier and can never be retracted. The vault's one pre-existing entity merge is exactly that case, and asking to reverse it returns a refusal naming it as not retractable rather than a silent no-op. The rule is stated once and enforced everywhere: a row with no run identifier is always replayed, and nothing can take it out.

This is a real limit rather than an oversight, and it is worth stating plainly because it decides what a migration into this layer buys. Everything written after the governance layer landed is reversible under the stack rule; everything written before it is permanent, and the only way to change a pre-governance belief is to file a new observation that contradicts or supersedes it.

## Two branches merge by union, and the fold makes the order irrelevant

The six ledgers are marked for union merge in the repository's attributes, so two branches that both appended rows produce a file holding each side's lines once, in whichever order the merge direction happened to place them. Views and rendered pages take the ordinary three-way merge, and a conflict there is not resolved by hand — it is repaired by rebuilding the views from the merged ledgers and re-rendering.

That works only because the fold is a total order on the rows themselves rather than on their position in the file, so a union merge in either direction yields the same views byte for byte. The drill that proves it applies disjoint work in two copies of a vault, concatenates the ledgers ours-first in one and theirs-first in the other, rebuilds both, and compares every view — and it is the coordination guarantee the whole branching story rests on.
