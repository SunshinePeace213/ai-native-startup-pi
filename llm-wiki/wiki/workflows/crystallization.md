---
type: workflow
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/chats/crystallize-placement-and-push-auth.md, title: "Where a crystallize belongs, and why pushes touching a workflow file were refused", id: src_a503e85dd88c}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_crystallization]
claim_ids: [clm_9e583518b455, clm_bb16c12eb6cd, clm_553b9901d78c]
confidence: 0.82
stale_after: 2027-05-11
last_rendered: 2026-08-23T10:25:46Z
review_required: false
---

# crystallization

> **In here:** crystallization — 3 claims, confidence 0.82, 3 sources.

## Current understanding

- Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages (0.96)
- A crystallize runs in the session that holds the conversation because the conversation is its input; a later session reading the finished diff recovers what changed but not what was tried, so findings that left no artifact are lost (0.76)
- A crystallize's knowledge lands wherever its commit lands, so a commit riding a feature branch reaches the wiki only when that branch merges and a reworked or abandoned stack takes the knowledge with it; the ledgers' union merge helps on merge and does nothing for a branch that never merges (0.75)

## Evidence

- `clm_9e583518b455` — "Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "The important insight: **good answers can be filed back into the wiki as new pages.** A comparison you asked for, an analysis, a connection you discovered — these are valuable and shouldn't disappear into chat history."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A debugging session, research thread, or architecture conversation becomes a source."
- `clm_bb16c12eb6cd` — "A crystallize runs in the session that holds the conversation because the conversation is its input; a later session reading the finished diff recovers what changed but not what was tried, so findings that left no artifact are lost" · p 0.76 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "A crystallize takes the conversation as its input, so it can only run where that conversation exists."
- `clm_553b9901d78c` — "A crystallize's knowledge lands wherever its commit lands, so a commit riding a feature branch reaches the wiki only when that branch merges and a reworked or abandoned stack takes the knowledge with it; the ledgers' union merge helps on merge and does nothing for a branch that never merges" · p 0.75 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "The knowledge nevertheless lands wherever the commit lands. A crystallize committed onto a feature branch reaches the wiki only when that branch merges, so a stack that is reworked or abandoned takes the knowledge with it."

## Timeline

- 2026-08-20 new_claim `clm_9e583518b455` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_9e583518b455` (src_758247b58186)
- 2026-08-23 new_claim `clm_bb16c12eb6cd` (src_a503e85dd88c)
- 2026-08-23 new_claim `clm_553b9901d78c` (src_a503e85dd88c)

## Related

- → produces [[observation]] (0.78)
- ← produces [[query]] (0.78)
- → produces [[raw-layer]] (0.78)
- → part_of [[llm-wiki]] (0.76)
- → produces [[state-layer]] (0.75)
- [[llm-wiki]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[librarian]] — 1 shared claim
- [[observation]] — 1 shared claim
- [[query]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
- [[rendered-page]] — 1 shared claim
- [[state-layer]] — 1 shared claim
