---
type: project
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
entity_ids: [ent_graphwiki]
claim_ids: [clm_783a8d83a795, clm_68d42ae34cc5, clm_64cae6b2f5df, clm_388d45acd4c5, clm_8268e86d6097, clm_0e3aa800f1e4]
confidence: 0.96
stale_after: 2028-06-22
last_rendered: 2026-08-23T09:04:00Z
review_required: false
---

# graphwiki

> **In here:** graphwiki — 6 claims, confidence 0.96, 5 sources.

## Current understanding

- The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex — is the most important file in the system, the thing that turns a generic LLM into a disciplined knowledge worker: it encodes how the wiki is structured and what workflows to follow when ingesting, answering, or maintaining, plus which entity and relationship types exist in the domain, what quality standards apply, how to handle contradictions, and what is private versus shared (1.00)
- The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents (0.99)
- The pattern has three layers — the raw sources, the wiki, and the schema (0.99)
- Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs (0.96)
- An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages (0.96)
- The graph schema is deliberately a small, fixed, generic vocabulary of node labels and relationship types enforced by database constraints: it trades domain expressiveness for query simplicity, and domain nuance lives in node properties rather than in new labels (0.83)

## Evidence

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active · 5 support · 1 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**The schema** — a document (e.g."
  - `src_48f57237f6ef` LLM Wiki v2: "The original implies this but it's worth being direct: **the schema document (CLAUDE.md, AGENTS.md) is the most important file in the system.** It's what turns a generic LLM into a disciplined knowledge worker."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "An LLM extracts candidate `:Concept`s and `:Claim`s **against the fixed schema** — giving the extractor a schema to fill produces structured, typed output; asking it to "extract triples" does not."
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
- `clm_68d42ae34cc5` — "The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "This is the key difference: **the wiki is a persistent, compounding artifact.** The cross-references are already there."
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Future queries read the compiled wiki instead of re-deriving knowledge from scratch every time. Knowledge compounds."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Inspired by [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), which proposes a persistent, LLM-maintained knowledge base that compounds over time instead of re-deriving answers from raw sources on…"
- `clm_64cae6b2f5df` — "The pattern has three layers — the raw sources, the wiki, and the schema" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "There are three layers: **Raw sources** — your curated collection of source documents."
  - `src_48f57237f6ef` LLM Wiki v2: "The three-layer architecture (raw sources, wiki, schema) works. The operations (ingest, query, lint) cover the basics."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "1. **Raw Sources** — immutable `:Source` nodes. Original text, never modified after ingest. 2. **Graph Wiki** — the maintained layer. `:Concept` nodes (a synthesized entity or topic, with a prose `summary`"
- `clm_388d45acd4c5` — "Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets one explicit LLM judgment of whether it is the same real-world entity — scoring F1 1.000 on 45 labeled mention pairs." · p 0.96 · active · 2 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**2. Two-stage fix (cheap filter + LLM judgment)"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "A second finding fell out of this run: the stage-1 threshold (0.55) that cleanly separated classes on the first domain did *not* transfer — one unrelated pair leaked through as a candidate in the new domain (cosine 0.60, above threshold)."
- `clm_8268e86d6097` — "An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "It should extract structured entities. People, projects, libraries, concepts, files, decisions. Each entity gets a type, attributes, and relationships to other entities."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "The original pattern stores the maintained layer as markdown pages with freeform links. This variant stores it as a property graph, so the "cross-references" a markdown wiki approximates with links become real, typed, queryable edges"
- `clm_0e3aa800f1e4` — "The graph schema is deliberately a small, fixed, generic vocabulary of node labels and relationship types enforced by database constraints: it trades domain expressiveness for query simplicity, and domain nuance lives in node properties rather than in new labels." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**Schema** — a small, fixed set of node labels and relationship types (below), enforced with Neo4j constraints."

## Contradictions

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake."

## Timeline

- 2026-08-20 new_claim `clm_68d42ae34cc5` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_64cae6b2f5df` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_783a8d83a795` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_783a8d83a795` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_8268e86d6097` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_b585de1a26bb)
- 2026-08-20 contradiction_update `clm_783a8d83a795` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_09c828d1c803)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_09c828d1c803)
- 2026-08-20 support_update `clm_8268e86d6097` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_0e3aa800f1e4` (src_09c828d1c803)
- 2026-08-20 support_update `clm_783a8d83a795` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-20 support_update `clm_388d45acd4c5` (src_09c828d1c803)
- 2026-08-21 support_update `clm_783a8d83a795` (src_af0433facf9d)
- 2026-08-21 human_override `clm_783a8d83a795` (human:ringo)

## Related

- → uses [[entity-resolution]] (0.96)
- ← authored lucianfialho (no page yet) (0.82)
- → extends [[llm-wiki]] (0.82)
- → uses [[knowledge-graph]] (0.82)
- → uses Neo4j (no page yet) (0.82)
- → uses [[schema-layer]] (0.82)
- ← part_of [[raw-layer]] (0.81)
- ← part_of [[schema-layer]] (0.81)
- ← part_of [[wiki-layer]] (0.81)
- [[knowledge-graph]] — 4 shared claims
- [[llm-wiki]] — 4 shared claims
- [[ingest]] — 3 shared claims
- [[schema-layer]] — 3 shared claims
- [[wiki-layer]] — 3 shared claims
- [[claim]] — 2 shared claims
- [[entity-extraction]] — 2 shared claims
- [[raw-layer]] — 2 shared claims
- [[andrej-karpathy]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[entity-resolution]] — 1 shared claim
- [[graph-traversal]] — 1 shared claim
- [[segmentation]] — 1 shared claim
- lucianfialho (no page yet)
- Neo4j (no page yet)
