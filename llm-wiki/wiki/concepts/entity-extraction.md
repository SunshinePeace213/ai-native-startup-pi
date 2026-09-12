---
type: concept
status: current
created: 2026-08-20
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/notes/llm-wiki-review-2026-08-22.md, title: "llm-wiki review — 2026-08-22", id: src_af0433facf9d}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_entity_extraction]
claim_ids: [clm_783a8d83a795, clm_8268e86d6097]
confidence: 0.98
stale_after: 2030-06-22
last_rendered: 2026-08-23T09:04:00Z
review_required: false
---

# entity extraction

> **In here:** entity extraction — 2 claims, confidence 0.98, 5 sources.

## Current understanding

- The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex — is the most important file in the system, the thing that turns a generic LLM into a disciplined knowledge worker: it encodes how the wiki is structured and what workflows to follow when ingesting, answering, or maintaining, plus which entity and relationship types exist in the domain, what quality standards apply, how to handle contradictions, and what is private versus shared (1.00)
- An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages (0.96)

## Evidence

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active · 5 support · 1 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**The schema** — a document (e.g."
  - `src_48f57237f6ef` LLM Wiki v2: "The original implies this but it's worth being direct: **the schema document (CLAUDE.md, AGENTS.md) is the most important file in the system.** It's what turns a generic LLM into a disciplined knowledge worker."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "An LLM extracts candidate `:Concept`s and `:Claim`s **against the fixed schema** — giving the extractor a schema to fill produces structured, typed output; asking it to "extract triples" does not."
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
- `clm_8268e86d6097` — "An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "It should extract structured entities. People, projects, libraries, concepts, files, decisions. Each entity gets a type, attributes, and relationships to other entities."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "The original pattern stores the maintained layer as markdown pages with freeform links. This variant stores it as a property graph, so the "cross-references" a markdown wiki approximates with links become real, typed, queryable edges"

## Contradictions

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake."

## Timeline

- 2026-08-20 new_claim `clm_783a8d83a795` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_783a8d83a795` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_8268e86d6097` (src_48f57237f6ef)
- 2026-08-20 contradiction_update `clm_783a8d83a795` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_8268e86d6097` (src_09c828d1c803)
- 2026-08-20 support_update `clm_783a8d83a795` (src_09c828d1c803)
- 2026-08-21 support_update `clm_783a8d83a795` (src_af0433facf9d)
- 2026-08-21 human_override `clm_783a8d83a795` (human:ringo)

## Related

- → part_of [[ingest]] (0.95)
- → uses [[schema-layer]] (0.82)
- → produces [[knowledge-graph]] (0.79)
- [[graphwiki]] — 2 shared claims
- [[ingest]] — 2 shared claims
- [[llm-wiki]] — 2 shared claims
- [[claim]] — 1 shared claim
- [[graph-traversal]] — 1 shared claim
- [[knowledge-graph]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[segmentation]] — 1 shared claim
- [[wiki-layer]] — 1 shared claim
