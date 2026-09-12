---
source: https://gist.githubusercontent.com/ahumanft/6c96385be6ca4af578cc9b20e0f79e66/raw/a8dd9e7ca2fd8d5dcbf966b0ca5349d523ff2a92/LLM-Wiki-V3.md
fetched: 2026-08-18
author: ahumanft
---
> **In here:** why LLMs are stateless and wikis must be built around that · segmenting ingestion/librarian/linter roles like a real library · explicit vs. implicit schema triggers and cache rewarming for long sessions

# LLM Wiki V3: Segmentation

> Karpathy gave us the foundation.
> Rohitg00 warned us what breaks.
> V3 is how you structure it to scale.

This is a concept document in the same spirit as V1 and V2.

V1 was intentionally vague. Build on it.
V2 was intentionally open. Solve it.
V3 is intentionally incomplete. Segment it.

---

## Start here: everything is stateless

Before anything else, name the constraint every builder is working inside but nobody says out loud.

There is no such thing as a stateful LLM by itself. Stateful LLM systems are built around a stateless model call.

The context window is not memory. It is a temporary working surface. Tokens at the top grow cold as the window fills. Instructions fade. Context drifts. What looks like continuity — in Claude, in GPT, in any model — is the provider actively managing that stateless surface behind the scenes. Pruning it. Compacting it. Injecting summaries to rewarm scope. Building reference structures so the important things stay warm long enough to be useful.

A mini wiki inside the conversation.

Once you understand this, everything about wiki design changes. You stop trying to build systems that hold everything. You start building systems that keep the right things warm at the right moment.

That is what V3 is about.

---

## The chain so far

### V1 — Karpathy's LLM Wiki

V1 gave us the smallest complete loop for an LLM-maintained knowledge system.

```text
raw sources → ingest → wiki pages → query → answers
                ↑                      ↓
              schema                  lint
                ↑                      ↓
              index ←————————————————— log
```

The LLM is the compiler. Feed it raw sources. It compiles them once into structured wiki pages. Future queries read the compiled wiki instead of re-deriving knowledge from scratch every time. Knowledge compounds.

Karpathy's wiki was specialized by design. He engaged with each piece of material personally — reading it, talking through it, deciding what mattered. That is a narrow, deliberate ingestion filter. The schema stays focused. The LLM never gets overwhelmed because the scope never gets out of hand.

V1 is not a complete scaling architecture. It is a portable pattern.

### V2 — LLM Wiki v2 (rohitg00)

V2 looked at V1 running in production and asked what breaks as it scales.

The findings are real — knowledge goes stale, confidence is flat, indexes grow too large, automation has no guard rails, multi-agent work has no coordination layer, schemas accumulate complexity until they start to fail.

V2 proposed mechanisms: confidence scoring, supersession, forgetting curves, consolidation tiers, hybrid search, knowledge graphs, crystallization.

Those mechanisms are correct in theory. But V2 has an unspoken assumption baked into almost all of them — that one schema, one index, and one ingest pipeline can be made smart enough to handle everything. Stack enough complexity onto that foundation and the LLM does not get smarter. It gets overwhelmed. It starts hallucinating. The schema that was supposed to govern everything becomes the thing that breaks everything.

V2 is not wrong. It just left the architectural answer open.

---

## The failure mode nobody named

V2's failure modes are not data problems. They are segmentation failures.

When a wiki grows, the instinct is to add more to the existing structure. More rules in the schema. More entries in the index. More mechanisms in the pipeline. You are stacking more weight onto the same foundation. At some point the foundation cannot hold it.

The answer is not a stronger foundation. The answer is more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry.

Segmentation. Not as a folder structure. Not as a tagging convention. As a design philosophy applied to everything: ingestion, schemas, roles, prompts, retrieval, lint. Every component stays narrow enough that the LLM executing it can do so reliably without drifting.

Everything V2 warns about is a symptom of the same underlying problem. Too much stacked on too little structure. Segmentation is the reinforcement that lets you build up.

---

## Two contrasting examples

The clearest way to understand segmentation is to see it at both ends of the spectrum.

**Karpathy's V1 — the restricted section.**

If you have ever read Harry Potter, you know the Hogwarts library has a restricted section. You do not browse it casually. You go there deliberately, with purpose, because what lives there requires careful handling.

Karpathy's wiki is the restricted section. Every piece of material is personally curated. Every ingestion is deliberate. The schema is tight. The human is in the loop constantly. The result is a deeply indexed, highly queryable knowledge base for research that genuinely matters.

This is not a system you build for a thousand files. This is a system you build for the fifty documents that define your thinking on a subject. Expensive in human attention. Worth every bit of that cost for the right use case.

**A broad file system wiki — the open stacks.**

On the other end: thousands of files. Scripts, research notes, markdown, configs, outputs, half-finished ideas. Nobody is curating this manually. Nobody should be.

The ingestion rule here is almost the opposite of Karpathy's. Do not read the whole file. Read just enough to understand what it is. The title probably tells you most of it. Read the first few lines. Write a three to five sentence summary. Classify it. Tag it. That is it. Nothing more.

The goal is not deep indexing. The goal is findability. A good title and a clean summary is enough for a librarian to locate it later. Trying to do more at this stage wastes tokens and produces dirty data that poisons retrieval downstream.

Two completely different ingestion strategies. Both correct. Both segmented for their purpose. Both can coexist in the same system — the restricted section living inside the broader library, untouched and fully functional, nothing breaking because neither interferes with the other.

---

## The library

A V3 wiki operates like a real library. Not metaphorically. Operationally.

A real library has specialized roles. Nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously. Those are separate jobs done by separate people with separate workflows. The library works because the roles are segmented.

A V3 wiki has the same structure.

**The ingestor** brings in new material. Its only job is classification — summary, tags, category. It reads as little as it needs to. It does not synthesize. It does not cross-reference. It files and moves on.

**The librarian** handles retrieval. When a request comes in it searches by title, by summary, by tags. It tracks what gets checked out frequently and what sits untouched. Over time those access patterns become signal — documents that get pulled repeatedly are candidates for deeper indexing or easier navigation. The librarian does not answer questions. It routes them.

**The linter** keeps the collection healthy. It deduplicates. It flags outdated entries. It makes sure the same document did not get filed under three different titles. It runs on its own schedule, not as part of every query.

---

## Why the librarian matters

When an agent team goes into the wiki to find their own research context, something subtle happens.

It can work. A well-scoped agent that reinforces its objective as it navigates can come back with good material. But there is a real risk. As the agent searches — reading, evaluating, following references, deciding what is relevant — its context fills. By the time it returns, it may have drifted from the original objective. It may bring back material that is tangentially related but not quite right. And that muddied context, delivered fresh to the waiting team, can bias the whole group before actual work begins. The team inherits the agent's drift.

The librarian pattern separates that risk out entirely.

The team states the objective and waits. The librarian handles retrieval in its own context — searching, filtering, scoping. The team receives clean pre-scoped material delivered fresh alongside the original objective. They start the actual work with both things warm in the window and nothing in between.

This is not just token economy. It is bias prevention. The team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in.

Sometimes two librarians run in parallel — one for local knowledge, one for web retrieval — so neither gets cold on a large request. Segmentation applies to the librarians too.

---

## Cache rewarming: keeping scope alive in long sessions

As sessions grow longer and systems grow more complex, tokens go cold faster than the work gets done.

You can rewarm them.

Anthropic does this in Claude Code with automatic compaction — injecting a structured summary back into context when the window fills, so the model does not lose the thread. The important context gets compressed and reinjected. Scope is restored.

The same pattern applies in wiki systems. After a certain number of turns or a token threshold, the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward. Key documents get flagged for re-reference. The team gets a lightweight reorientation before continuing.

Explicit triggers that rewarm implicit context before it drifts. This is the same principle as good schema design applied at the session level: do not rely on implicit context staying warm on its own. Build the reinforcement in.

For simple wikis this is overkill. For complex multi-agent systems running long sessions, it is the difference between a team that finishes clean and one that quietly loses the thread halfway through.

---

## What this means for V2

Everything V2 describes still applies. The mechanisms are real. The warnings are valid.

Confidence scoring works when it is scoped to a specific ingestion pipeline with a defined standard. Crystallization works when the librarian knows which documents have been accessed enough to warrant deep indexing. Supersession works when the linter has a clean enough catalog to detect duplicates. Hybrid search works when the librarian is routing queries through the right filter before retrieval begins.

None of these fail because the mechanisms are wrong. They fail when you try to run all of them through one undifferentiated schema on one undifferentiated pile of data.

Segment the system and V2's mechanisms work exactly as intended.

---

## Schema design: explicit triggers, implicit configuration

Segmentation applies to schemas too. This is where configuration gets hard and where most systems quietly break.

The instinct when writing a schema is to put everything in it. Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake.

Two kinds of instructions behave differently under context pressure.

**Explicit instructions hold.** A defined trigger, a defined action, a defined expected output. The model does not interpret it. It executes it.

**Implicit instructions drift.** Broad behavioral guidance goes cold as context fills. The model stops attending to it. The behavior disappears quietly, usually right when it matters most.

The solution is to keep schemas explicit and use explicit triggers to invoke implicit guidance at exactly the right moment.

Here is what that looks like for a librarian role:

```text
LIBRARIAN SCHEMA

1. Request received.
   → Read: dewey-decimal-system.md
   [explicit: orientation to the filing system]

2. Before searching.
   → Read: how-to-gather-relevant-materials.md
   [explicit: defined procedure, no judgment required]

3. Search and retrieve. Leave results at the desk.
   [Stack one: direct matches]

4. After retrieval complete.
   → Read: how-to-find-context-that-isnt-obvious.md
   [implicit: judgment, thinking beyond direct matches]

5. Search again. Leave results at the desk.
   [Stack two: non-obvious candidates]

6. Read stack one. Read stack two.
   Add anything from stack two now verified relevant into stack one.
   Return stack one to the team.
   [explicit: mechanical, no interpretation]
```

Step one orients the librarian to the filing system before anything else. Step two is a defined procedure — how to search — with no judgment calls, purely explicit. Step four is the only implicit step: it invites the model to think beyond the obvious, at exactly the moment that judgment is needed and the structured work is already done. Step six is mechanical and explicit — compare, verify, return. No interpretation.

One implicit step. Everything else explicit. The implicit instruction arrives at the seam between structured work and judgment work — after the first pass is complete, before the second pass begins. That timing is not accidental. Implicit instructions that arrive too early get buried under orientation. Too late and the model's habits are already set.

Getting trigger timing right is one of the harder design problems in segmented wiki systems. Implicit instructions invoked at the wrong moment introduce variance. The model starts interpreting instead of executing. That is where wiki corruption begins quietly — misclassified files, drifting summaries, a linter that stops catching what it should.

The working principle: explicit schema stays minimal and structural. Implicit charters carry judgment and culture. Explicit triggers connect the two at the right moment in the workflow. Never passively loaded. Always invoked on demand.

---

## What is left open

This is a concept, not a finished system.

Some pieces are working. Early ingestion pipelines. A librarian that routes and tracks. Some segmentation between research teams and build teams. The restricted section coexisting with the broader collection. But the full architecture described here is what is being worked toward, not what has shipped.

V2 gives the mechanism layer. V3 gives the segmentation layer. Neither is complete on its own.

The part that genuinely needs more work — from me and from anyone building in this space — is the configuration of segmentation itself. Segmentation works inside a segment. But how segments communicate, how handoffs are governed, what rules exist at the boundaries between them — that is the hardest part. That is where schemas and navigation get complex fast. That is the open problem worth investigating and discussing.

If you are building something in this space, reach out in the comments. If you have solved a piece of this, I want to hear it. If you have questions or ideas, same thing.

---

## The V3 principle

V1 showed us the wiki as compiler.

V2 showed us what breaks when the compiler tries to do too much.

V3 shows us how to build a system where nothing ever has to do too much.

Segment the ingestion. Segment the roles. Segment the retrieval. Keep every context narrow enough to stay warm. Protect your execution teams from bias and drift. Rewarm scope before it fades.

A wiki is not just a knowledge store. It is an execution system. Treat it like one.

Everything is stateless. Design around it.

---

*This document builds on [Andrej Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) and [LLM Wiki v2](https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2) by rohitg00. Everything in both documents still applies. This adds the segmentation layer that lets them scale.*
