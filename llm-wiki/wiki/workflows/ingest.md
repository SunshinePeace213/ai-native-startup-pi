---
type: workflow
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
  - {resource: llm-wiki/raw/notes/llm-wiki-review-2026-08-22.md, title: "llm-wiki review — 2026-08-22", id: src_af0433facf9d}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_ingest]
claim_ids: [clm_783a8d83a795, clm_388d45acd4c5, clm_8268e86d6097, clm_eeb7b7aa9290, clm_fd6b4187fcae, clm_d8e8392dd4ee, clm_64d1c38ec74a, clm_c3528b922fca, clm_7c79b30b59bd]
confidence: 0.86
stale_after: 2026-10-15
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# ingest

> **In here:** An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log… · 9 claims, confidence 0.86.

## Current understanding

- The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex — is the most important file in the system, the thing that turns a generic LLM into a disciplined knowledge worker: it encodes how the wiki is structured and what workflows to follow when ingesting, answering, or maintaining, plus which entity and relationship types exist in the domain, what quality standards apply, how to handle contradictions, and what is private versus shared (1.00)
- Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs (0.96)
- An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages (0.96)
- A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows (0.83)
- An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages (0.83)
- The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction (0.82)
- The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them (0.82)
- The inbox separates authorship of a proposal from responsibility for the write: an actor with no permission to apply may still write a proposal, and the drain records the run against the actor that applied it rather than the one that wrote the file (0.76)
- The llm-wiki hooks report and never write: the SessionStart hook prints a queue block only when the engine's read-only queue verb finds an unregistered or unextracted archive, the PostToolUse hook reminds the session that just wrote one, and both fail open to a silent exit 0 when the engine, uv, or the payload is missing (0.74)

## Evidence

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active · 5 support · 1 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**The schema** — a document (e.g."
  - `src_48f57237f6ef` LLM Wiki v2: "The original implies this but it's worth being direct: **the schema document (CLAUDE.md, AGENTS.md) is the most important file in the system.** It's what turns a generic LLM into a disciplined knowledge worker."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "An LLM extracts candidate `:Concept`s and `:Claim`s **against the fixed schema** — giving the extractor a schema to fill produces structured, typed output; asking it to "extract triples" does not."
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
- `clm_388d45acd4c5` — "Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs." · p 0.96 · active · 2 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**2. Two-stage fix (cheap filter + LLM judgment)"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "A second finding fell out of this run: the stage-1 threshold (0.55) that cleanly separated classes on the first domain did *not* transfer — one unrelated pair leaked through as a candidate in the new domain (cosine 0.60, above threshold)."
- `clm_8268e86d6097` — "An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "It should extract structured entities. People, projects, libraries, concepts, files, decisions. Each entity gets a type, attributes, and relationships to other entities."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "The original pattern stores the maintained layer as markdown pages with freeform links. This variant stores it as a property graph, so the "cross-references" a markdown wiki approximates with links become real, typed, queryable edges"
- `clm_eeb7b7aa9290` — "A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously. Those are separate jobs done by separate people with separate workflows. The library works because the roles are segmented."
- `clm_fd6b4187fcae` — "An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages" · p 0.83 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "An example flow: the LLM reads the source, discusses key takeaways with you, writes a summary page in the wiki, updates the index, updates relevant entity and concept pages across the wiki, and appends an entry to the log."
  - exception — when for a broad, uncurated file-system corpus of thousands of files rather than a small personally curated collection: For a broad, uncurated corpus the goal of ingestion is findability rather than deep indexing: a good title and a clean summary is enough for a librarian to locate the file later, and trying to do more at that stage wastes tokens and produces dirty data that poisons retrieval downstream (`obs_8e2a1e93b171`)
- `clm_d8e8392dd4ee` — "The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction" · p 0.82 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The human should still be in the loop for curation and direction. But the bookkeeping, the part that makes people abandon wikis, should be fully automated."
  - exception — when for the deep lane, which turns a source into belief: Automation stops at the light lane: the weekly routine files only the light-lane channels and the deep lane stays a session's command (`obs_da678a69fac4`)
- `clm_64d1c38ec74a` — "The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them" · p 0.82 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**log.md** is chronological. It's an append-only record of what happened and when — ingests, queries, lint passes."
- `clm_c3528b922fca` — "The inbox separates authorship of a proposal from responsibility for the write: an actor with no permission to apply may still write a proposal, and the drain records the run against the actor that applied it rather than the one that wrote the file" · p 0.76 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "That split is what lets an actor propose work it is not permitted to land. The weekly routine has no permission to apply on the shared segment, but nothing stops it writing a proposal;"
- `clm_7c79b30b59bd` — "The llm-wiki hooks report and never write: the SessionStart hook prints a queue block only when the engine's read-only queue verb finds an unregistered or unextracted archive, the PostToolUse hook reminds the session that just wrote one, and both fail open to a silent exit 0 when the engine, uv, or the payload is missing" · p 0.74 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The hooks report and never write. The SessionStart hook prints an `<llm-wiki-queue>` block only when the engine's read-only queue verb finds an unregistered or unextracted archive;"

## Contradictions

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake."

## Timeline

- 2026-08-20 new_claim `clm_783a8d83a795` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_64d1c38ec74a` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_fd6b4187fcae` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_783a8d83a795` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_8268e86d6097` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_d8e8392dd4ee` (src_48f57237f6ef)
- 2026-08-20 contradiction_update `clm_783a8d83a795` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_eeb7b7aa9290` (src_b585de1a26bb)
- 2026-08-20 exception_addition `clm_fd6b4187fcae` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_8268e86d6097` (src_09c828d1c803)
- 2026-08-20 support_update `clm_783a8d83a795` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-20 support_update `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-21 new_claim `clm_7c79b30b59bd` (src_21d1317cc326)
- 2026-08-21 exception_addition `clm_d8e8392dd4ee` (src_21d1317cc326)
- 2026-08-21 support_update `clm_783a8d83a795` (src_af0433facf9d)
- 2026-08-21 human_override `clm_783a8d83a795` (human:ringo)
- 2026-08-22 new_claim `clm_c3528b922fca` (src_e689bfca564a)

## Related

- ← part_of [[entity-extraction]] (0.95)
- → applies_to [[index-md]] (0.83)
- → applies_to [[log-md]] (0.83)
- ← part_of [[entity-resolution]] (0.82)
- ← produces [[log-md]] (0.82)
- → part_of [[llm-wiki]] (0.80)
- ← produces [[hooks]] (0.79)
- → applies_to [[librarian]] (0.79)
- ← applies_to [[segmentation]] (0.79)
- → produces [[observation]] (0.77)
- [[llm-wiki]] — 6 shared claims
- [[graphwiki]] — 3 shared claims
- [[lint]] — 3 shared claims
- [[segmentation]] — 3 shared claims
- [[entity-extraction]] — 2 shared claims
- [[hooks]] — 2 shared claims
- [[knowledge-graph]] — 2 shared claims
- [[librarian]] — 2 shared claims
- [[log-md]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[entity-resolution]] — 1 shared claim
- [[graph-traversal]] — 1 shared claim
- [[index-md]] — 1 shared claim
- [[observation]] — 1 shared claim
- [[query]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[state-layer]] — 1 shared claim
- [[wiki-layer]] — 1 shared claim
