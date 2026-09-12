---
source: note:llm-wiki-phase-5-build-findings
date: 2026-08-22
author: ringo
title: Phase 5 build findings — what the retune and the loops measured
---

# Phase 5 build findings — what the retune and the loops measured

> **In here:** what the Phase 5 build of the llm-wiki automation measured about the retriever's retune, the hooks, and the loops, written as working notes while it ran.

## The golden set and the baseline it recorded

The golden set grew from 20 to 34 cases across six families. Its baseline under the Phase 4 retriever and the `fusion-v1` config measured fused MRR 0.4657 at recall 0.74 against corpus-alone MRR 0.5647 at recall 0.71. The history family answered 3 of 7 and the structure family 4 of 5 before any retriever change.

Recording that baseline first is what makes the retune measurable. A number taken after the code and the config both moved cannot say which of the two moved it, and the two tables the pilot report carries only mean something because the first one was written to disk before the retriever was touched.

## The rerank block scaled to a third

The `fusion-v2` config scales the rerank block to a third — probability 0.15, authority, recency, and support 0.05 each — so belief acts as a tie-breaker between claims the streams agree on rather than deciding rank one. A claim at p 0.99 with three supports now carries belief 1.2835 where `fusion-v1` gave it 2.17.

The gap between those two numbers is the whole change. Reciprocal rank fusion scores at the top of a short candidate list sit within a few percent of one another, so a multiplier with a 20 percent spread outranks the fusion itself; a multiplier with a 5 percent spread only separates claims the streams already tied.

## Folding, prefixes, and the stopword that removed the token

The retriever's state stream folds inflections with a fixed rule set (entities → entity, owns → own, rendering → render) and matches a folded query token of three or more characters by prefix, so own reaches owner and ownership. The stopword table the stream inherited from a standard English list carried the word own itself, which silently removed the token the mechanism exists for until the build dropped it from the list.

That is the kind of defect a unit test on the folding rules never catches, because the folding rules were right the whole time. The token was correct, the prefix match was correct, and the query still scored nothing because the token was discarded one stage earlier. A stopword list borrowed from prose retrieval is not neutral over a vocabulary of claim keys.

## Vote count decides the top of a historical answer

Reciprocal rank fusion decides the top of a historical answer by vote count before belief enters. The superseded ownership claim on "who used to own the wiki layer" was found by two streams (bm25 at rank 8, state at rank 3, rrf 0.035) and lost to claims every stream found at middling ranks (rrf 0.049 to 0.057). No rerank weight on current belief lifts a superseded claim that only two streams reach.

This bounds what the retune could ever have fixed. Scaling the rerank block down helps a claim that the streams do find and belief then demotes; it does nothing for a claim two of four streams never return. The remedy for the historical family is recall in the streams themselves, not weight on the claims they hand back.

## Path seeds and the edge that bypasses the bridge

Path seeds follow the shortest path between the question's named entities. The live graph holds a direct wiki layer → raw layer edge beside the two-hop chain through the state layer, so the state layer is never seeded for "what sits between the raw layer and the wiki layer", and the connective claim answers at rank ten through the endpoints' own claims.

The mechanism works exactly as specified and still misses, because the question asks for what sits between two entities while the shortest path asks whether anything sits between them at all. On a graph dense enough to hold both a direct edge and the longer chain it summarises, those are different questions.

## The hooks report and never write

The hooks report and never write. The SessionStart hook prints an `<llm-wiki-queue>` block only when the engine's read-only queue verb finds an unregistered or unextracted archive; the PostToolUse hook reminds the session that just wrote one; and both fail open to a silent exit 0 when the engine, uv, or the payload is missing. The weekly routine files only the light-lane channels, and the deep lane stays a session's command.

The division holds because nothing in the automation decides anything. A hook notices and points at a command, the routine files what needs no judgment, and every extraction that turns a source into belief still runs inside a session a human started. That is the property worth keeping when the next loop is added.
