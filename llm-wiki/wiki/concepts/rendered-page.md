---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/chats/llm-wiki-engine-layout-refactor.md, title: "Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer", id: src_157432f58354}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_rendered_page]
claim_ids: [clm_9e583518b455, clm_3995926311e1, clm_ccececdb9e58, clm_a91dceb8a749, clm_d9fe1d507413, clm_4de35163e2a6, clm_278b40546c75, clm_cbe455eb80f8]
confidence: 0.81
stale_after: 2026-09-24
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# rendered page

> **In here:** rendered page — 8 claims, confidence 0.81, 5 sources.

## Current understanding

- Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages (0.96)
- Trust status travels with the data all the way into the synthesized answer: any claim or concept cited with a status other than current is flagged inline rather than presented as settled fact, instead of the status being silently dropped at read time (0.83)
- The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships (0.83)
- A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline — and every load-bearing claim is shown at its confidence instead of stated as settled truth (0.82)
- The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page (0.81)
- The ledgers are marked for union merge and the views are not: a union in either direction yields the same views only because the fold is a total order on the rows themselves rather than on their position in the file, and a conflict in a view or a page is repaired by rebuilding and re-rendering rather than by hand (0.78)
- A rename that moves engine files leaves the historical layers quoting the old paths: spec markdown and pilot reports are evidence of what was true when written, and the wiki's own pages are state-layer owned, so they follow through a crystallize and a re-render rather than a hand edit (0.75)
- The renderer embeds a script's own filename in the pages it writes, so renaming that script drifts every rendered page carrying the line and render check reports it as drift; the repair is a re-render through the renderer that owns those files, never a hand edit (0.71)

## Evidence

- `clm_9e583518b455` — "Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "The important insight: **good answers can be filed back into the wiki as new pages.** A comparison you asked for, an analysis, a connection you discovered — these are valuable and shouldn't disappear into chat history."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A debugging session, research thread, or architecture conversation becomes a source."
- `clm_3995926311e1` — "Trust status travels with the data all the way into the synthesized answer: any claim or concept cited with a status other than current is flagged inline rather than presented as settled fact, instead of the status being silently dropped at read time." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Any `:Claim` or `:Concept` cited with `status != current` must be flagged inline ("X is declarative *[disputed — see claim-2]*") rather than presented as settled fact"
- `clm_ccececdb9e58` — "The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Do not let the LLM merely write the wiki. Let the LLM observe evidence, let the state model update belief, and let the wiki render the current understanding."
- `clm_a91dceb8a749` — "A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline" · p 0.82 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Markdown pages should be generated from the current belief state, not treated as unmanaged truth."
- `clm_d9fe1d507413` — "The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page" · p 0.81 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Separate source, observation, belief, and rendered page."
- `clm_4de35163e2a6` — "The ledgers are marked for union merge and the views are not: a union in either direction yields the same views only because the fold is a total order on the rows themselves rather than on their position in the file, and a conflict in a view or a page is repaired by rebuilding and re-rendering rather than by hand" · p 0.78 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "That works only because the fold is a total order on the rows themselves rather than on their position in the file, so a union merge in either direction yields the same views byte for byte."
- `clm_278b40546c75` — "A rename that moves engine files leaves the historical layers quoting the old paths: spec markdown and pilot reports are evidence of what was true when written, and the wiki's own pages are state-layer owned, so they follow through a crystallize and a re-render rather than a hand edit" · p 0.75 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "`specs/**/*.md`, `llm-wiki/wiki/`, and `ai-docs/` keep the old paths. The spec markdown and pilot reports are historical evidence of what was true when they were written, and the wiki's own pages are state-layer owned"
- `clm_cbe455eb80f8` — "The renderer embeds a script's own filename in the pages it writes, so renaming that script drifts every rendered page carrying the line and render check reports it as drift; the repair is a re-render through the renderer that owns those files, never a hand edit" · p 0.71 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The renderer embeds the graph script's own filename in the pages it writes: the `## Related` overflow line reads `graph.py neighbors <entity_id>`."

## Timeline

- 2026-08-20 new_claim `clm_9e583518b455` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_ccececdb9e58` (src_758247b58186)
- 2026-08-20 new_claim `clm_a91dceb8a749` (src_758247b58186)
- 2026-08-20 support_update `clm_9e583518b455` (src_758247b58186)
- 2026-08-20 new_claim `clm_d9fe1d507413` (src_758247b58186)
- 2026-08-20 new_claim `clm_3995926311e1` (src_09c828d1c803)
- 2026-08-22 new_claim `clm_4de35163e2a6` (src_e689bfca564a)
- 2026-08-23 new_claim `clm_cbe455eb80f8` (src_157432f58354)
- 2026-08-23 new_claim `clm_278b40546c75` (src_157432f58354)

## Related

- → depends_on [[state-layer]] (0.93)
- → cites [[evidence-span]] (0.79)
- → part_of [[wiki-layer]] (0.79)
- → produces [[state-layer]] (0.79)
- ← produces [[belief-updater]] (0.75)
- [[claim]] — 4 shared claims
- [[state-layer]] — 4 shared claims
- [[llm-wiki]] — 3 shared claims
- [[raw-layer]] — 3 shared claims
- [[wiki-layer]] — 3 shared claims
- [[observation]] — 2 shared claims
- [[query]] — 2 shared claims
- [[belief-updater]] — 1 shared claim
- [[crystallization]] — 1 shared claim
- [[evidence-span]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[transition-ledger]] — 1 shared claim
- HousamKak (no page yet)
