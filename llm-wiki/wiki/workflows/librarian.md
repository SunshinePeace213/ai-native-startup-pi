---
type: workflow
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/chats/crystallize-placement-and-push-auth.md, title: "Where a crystallize belongs, and why pushes touching a workflow file were refused", id: src_a503e85dd88c}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_librarian]
claim_ids: [clm_b615b87a6731, clm_11e28d02ab4f, clm_eeb7b7aa9290, clm_fd6b4187fcae, clm_bb16c12eb6cd]
confidence: 0.81
stale_after: 2027-07-19
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# librarian

> **In here:** Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's… · 5 claims, confidence 0.81.

## Current understanding

- Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in (0.83)
- After a certain number of turns or a token threshold the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward — key documents get flagged for re-reference, and the team gets a lightweight reorientation before continuing (0.83)
- A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows (0.83)
- An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages (0.83)
- A crystallize runs in the session that holds the conversation because the conversation is its input; a later session reading the finished diff recovers what changed but not what was tried, so findings that left no artifact are lost (0.76)

## Evidence

- `clm_b615b87a6731` — "Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "This is not just token economy. It is bias prevention. The team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in."
- `clm_11e28d02ab4f` — "After a certain number of turns or a token threshold the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward — key documents get flagged for re-reference, and the team gets a lightweight reorientation before continuing." · p 0.83 · active · 1 support · 0 contradict · when: for complex multi-agent systems running long sessions, and overkill for a simple wiki
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "After a certain number of turns or a token threshold, the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward. Key documents get flagged for re-reference."
- `clm_eeb7b7aa9290` — "A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously. Those are separate jobs done by separate people with separate workflows. The library works because the roles are segmented."
- `clm_fd6b4187fcae` — "An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages" · p 0.83 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "An example flow: the LLM reads the source, discusses key takeaways with you, writes a summary page in the wiki, updates the index, updates relevant entity and concept pages across the wiki, and appends an entry to the log."
  - exception — when for a broad, uncurated file-system corpus of thousands of files rather than a small personally curated collection: For a broad, uncurated corpus the goal of ingestion is findability rather than deep indexing: a good title and a clean summary is enough for a librarian to locate the file later, and trying to do more at that stage wastes tokens and produces dirty data that poisons retrieval downstream (`obs_8e2a1e93b171`)
- `clm_bb16c12eb6cd` — "A crystallize runs in the session that holds the conversation because the conversation is its input; a later session reading the finished diff recovers what changed but not what was tried, so findings that left no artifact are lost" · p 0.76 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "A crystallize takes the conversation as its input, so it can only run where that conversation exists."

## Timeline

- 2026-08-20 new_claim `clm_fd6b4187fcae` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_eeb7b7aa9290` (src_b585de1a26bb)
- 2026-08-20 exception_addition `clm_fd6b4187fcae` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_b615b87a6731` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_11e28d02ab4f` (src_b585de1a26bb)
- 2026-08-23 new_claim `clm_bb16c12eb6cd` (src_a503e85dd88c)

## Related

- → applies_to [[context-window]] (0.80)
- → applies_to [[query]] (0.80)
- ← applies_to [[segmentation]] (0.80)
- → part_of [[llm-wiki]] (0.80)
- → produces [[cache-rewarming]] (0.80)
- ← applies_to [[ingest]] (0.79)
- [[llm-wiki]] — 3 shared claims
- [[context-window]] — 2 shared claims
- [[ingest]] — 2 shared claims
- [[segmentation]] — 2 shared claims
- [[cache-rewarming]] — 1 shared claim
- [[crystallization]] — 1 shared claim
- [[explicit-triggers]] — 1 shared claim
- [[index-md]] — 1 shared claim
- [[lint]] — 1 shared claim
- [[log-md]] — 1 shared claim
- [[query]] — 1 shared claim
- [[statelessness]] — 1 shared claim
