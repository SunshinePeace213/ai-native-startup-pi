---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
  - {resource: llm-wiki/raw/notes/llm-wiki-review-2026-08-22.md, title: "llm-wiki review — 2026-08-22", id: src_af0433facf9d}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_segmentation]
claim_ids: [clm_783a8d83a795, clm_16c890a2aae1, clm_eeb7b7aa9290, clm_fd6b4187fcae, clm_338407819b19, clm_f7a4e979038d]
confidence: 0.82
stale_after: 2026-10-07
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# segmentation

> **In here:** When a wiki outgrows its structure the answer is not a stronger foundation but more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry · 6 claims, confidence 0.82.

## Current understanding

- The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex — is the most important file in the system, the thing that turns a generic LLM into a disciplined knowledge worker: it encodes how the wiki is structured and what workflows to follow when ingesting, answering, or maintaining, plus which entity and relationship types exist in the domain, what quality standards apply, how to handle contradictions, and what is private versus shared (1.00)
- When a wiki outgrows its structure the answer is not a stronger foundation but more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry (0.83)
- A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows (0.83)
- An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages (0.83)
- The union retriever measures the previous phase's live numbers exactly — fused MRR 0.519188 at recall 0.794118 over the 34-case golden set — because nothing in the scoring path was tuned: the config only changed its version string and gained a private collections block, and the eval reads the shared segment alone (0.74)
- A path guard that normalizes only lexically leaves a symlinked private segment unguarded — inside a worktree whose private segment is a symlink to the root checkout every private path resolved outside the worktree root, and the fix matches both the lexical path and its realpath (0.73)

## Evidence

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active · 5 support · 1 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**The schema** — a document (e.g."
  - `src_48f57237f6ef` LLM Wiki v2: "The original implies this but it's worth being direct: **the schema document (CLAUDE.md, AGENTS.md) is the most important file in the system.** It's what turns a generic LLM into a disciplined knowledge worker."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "An LLM extracts candidate `:Concept`s and `:Claim`s **against the fixed schema** — giving the extractor a schema to fill produces structured, typed output; asking it to "extract triples" does not."
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
- `clm_16c890a2aae1` — "When a wiki outgrows its structure the answer is not a stronger foundation but more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "The answer is not a stronger foundation. The answer is more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry."
- `clm_eeb7b7aa9290` — "A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously. Those are separate jobs done by separate people with separate workflows. The library works because the roles are segmented."
- `clm_fd6b4187fcae` — "An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages" · p 0.83 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "An example flow: the LLM reads the source, discusses key takeaways with you, writes a summary page in the wiki, updates the index, updates relevant entity and concept pages across the wiki, and appends an entry to the log."
  - exception — when for a broad, uncurated file-system corpus of thousands of files rather than a small personally curated collection: For a broad, uncurated corpus the goal of ingestion is findability rather than deep indexing: a good title and a clean summary is enough for a librarian to locate the file later, and trying to do more at that stage wastes tokens and produces dirty data that poisons retrieval downstream (`obs_8e2a1e93b171`)
- `clm_338407819b19` — "The union retriever measures the previous phase's live numbers exactly — fused MRR 0.519188 at recall 0.794118 over the 34-case golden set — because nothing in the scoring path was tuned: the config only changed its version string and gained a private collections block, and the eval reads the shared segment alone" · p 0.74 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The retrieval floor for this phase was Phase 5's live numbers, fused MRR 0.519188 at recall 0.794118 over the 34-case golden set."
- `clm_f7a4e979038d` — "A path guard that normalizes only lexically leaves a symlinked private segment unguarded — inside a worktree whose private segment is a symlink to the root checkout every private path resolved outside the worktree root, and the fix matches both the lexical path and its realpath" · p 0.73 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The first was the worst: inside a worktree whose private segment is the symlink this same build's worktree hook creates, every private path resolved back to the root checkout and therefore fell outside the worktree root"

## Contradictions

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake."

## Timeline

- 2026-08-20 new_claim `clm_783a8d83a795` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_fd6b4187fcae` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_783a8d83a795` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_16c890a2aae1` (src_b585de1a26bb)
- 2026-08-20 contradiction_update `clm_783a8d83a795` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_eeb7b7aa9290` (src_b585de1a26bb)
- 2026-08-20 exception_addition `clm_fd6b4187fcae` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_783a8d83a795` (src_09c828d1c803)
- 2026-08-21 support_update `clm_783a8d83a795` (src_af0433facf9d)
- 2026-08-21 human_override `clm_783a8d83a795` (human:ringo)
- 2026-08-22 new_claim `clm_338407819b19` (src_4863372048fa)
- 2026-08-22 new_claim `clm_f7a4e979038d` (src_4863372048fa)

## Related

- → applies_to [[librarian]] (0.80)
- → extends [[llm-wiki]] (0.80)
- → applies_to [[ingest]] (0.79)
- → applies_to [[hybrid-search]] (0.79)
- ← applies_to [[write-guard]] (0.77)
- → applies_to [[schema-layer]] (0.21) *[disputed]*
- [[llm-wiki]] — 4 shared claims
- [[ingest]] — 3 shared claims
- [[librarian]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[entity-extraction]] — 1 shared claim
- [[golden-set]] — 1 shared claim
- [[graphwiki]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[hybrid-search]] — 1 shared claim
- [[index-md]] — 1 shared claim
- [[lint]] — 1 shared claim
- [[log-md]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[write-guard]] — 1 shared claim
- ahumanft (no page yet)
