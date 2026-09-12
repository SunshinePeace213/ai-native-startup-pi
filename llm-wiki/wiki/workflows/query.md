---
type: workflow
status: current
created: 2026-08-20
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_query]
claim_ids: [clm_9e583518b455, clm_1970186e8e8b, clm_3995926311e1, clm_b615b87a6731, clm_64d1c38ec74a]
confidence: 0.88
stale_after: 2028-05-04
last_rendered: 2026-08-23T10:25:46Z
review_required: false
---

# query

> **In here:** Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page · 5 claims, confidence 0.88.

## Current understanding

- Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages (0.96)
- A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page, missing cross-references, and data gaps a web search could fill (0.96)
- Trust status travels with the data all the way into the synthesized answer: any claim or concept cited with a status other than current is flagged inline rather than presented as settled fact, instead of the status being silently dropped at read time (0.83)
- Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in (0.83)
- The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them (0.82)

## Evidence

- `clm_9e583518b455` — "Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "The important insight: **good answers can be filed back into the wiki as new pages.** A comparison you asked for, an analysis, a connection you discovered — these are valuable and shouldn't disappear into chat history."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A debugging session, research thread, or architecture conversation becomes a source."
- `clm_1970186e8e8b` — "A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page, missing cross-references, and data gaps a web search could fill" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "Look for: contradictions between pages, stale claims that newer sources have superseded, orphan pages with no inbound links, important concepts mentioned but lacking their own page, missing cross-references, data gaps that could be filled…"
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "**The linter** keeps the collection healthy. It deduplicates. It flags outdated entries. It makes sure the same document did not get filed under three different titles. It runs on its own schedule, not as part of every query."
- `clm_3995926311e1` — "Trust status travels with the data all the way into the synthesized answer: any claim or concept cited with a status other than current is flagged inline rather than presented as settled fact, instead of the status being silently dropped at read time." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Any `:Claim` or `:Concept` cited with `status != current` must be flagged inline ("X is declarative *[disputed — see claim-2]*") rather than presented as settled fact"
- `clm_b615b87a6731` — "Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "This is not just token economy. It is bias prevention. The team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in."
- `clm_64d1c38ec74a` — "The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them" · p 0.82 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**log.md** is chronological. It's an append-only record of what happened and when — ingests, queries, lint passes."

## Timeline

- 2026-08-20 new_claim `clm_64d1c38ec74a` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_9e583518b455` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_1970186e8e8b` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_9e583518b455` (src_758247b58186)
- 2026-08-20 new_claim `clm_b615b87a6731` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_1970186e8e8b` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_3995926311e1` (src_09c828d1c803)

## Related

- ← uses [[llm-wiki]] (0.83)
- → cites [[claim]] (0.82)
- ← produces [[log-md]] (0.82)
- ← applies_to [[librarian]] (0.80)
- ← related_to [[lint]] (0.79)
- → produces [[crystallization]] (0.78)
- [[llm-wiki]] — 3 shared claims
- [[claim]] — 2 shared claims
- [[lint]] — 2 shared claims
- [[rendered-page]] — 2 shared claims
- [[context-window]] — 1 shared claim
- [[crystallization]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[librarian]] — 1 shared claim
- [[log-md]] — 1 shared claim
- [[observation]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
