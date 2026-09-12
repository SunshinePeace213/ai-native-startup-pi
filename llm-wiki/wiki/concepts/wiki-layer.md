---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/chats/llm-wiki-engine-layout-refactor.md, title: "Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer", id: src_157432f58354}
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_wiki_layer]
claim_ids: [clm_68d42ae34cc5, clm_64cae6b2f5df, clm_8268e86d6097, clm_826354f2bdf0, clm_ccececdb9e58, clm_a91dceb8a749, clm_278b40546c75, clm_e77a37176207]
confidence: 0.89
stale_after: 2027-01-02
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# wiki layer

> **In here:** A rename that moves engine files leaves the historical layers quoting the old paths: spec markdown and pilot reports are evidence of what was true when written, and the wiki's own pages are… · 7 claims, confidence 0.89.

## Current understanding

- The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents (0.99)
- The pattern has three layers — the raw sources, the wiki, and the schema (0.99)
- An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages (0.96)
- The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims (0.89)
- The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships (0.83)
- A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline — and every load-bearing claim is shown at its confidence instead of stated as settled truth (0.83)
- A rename that moves engine files leaves the historical layers quoting the old paths: spec markdown and pilot reports are evidence of what was true when written, and the wiki's own pages are state-layer owned, so they follow through a crystallize and a re-render rather than a hand edit (0.75)

## Evidence

- `clm_68d42ae34cc5` — "The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "This is the key difference: **the wiki is a persistent, compounding artifact.** The cross-references are already there."
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Future queries read the compiled wiki instead of re-deriving knowledge from scratch every time. Knowledge compounds."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Inspired by [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), which proposes a persistent, LLM-maintained knowledge base that compounds over time instead of re-deriving answers from raw sources on…"
- `clm_64cae6b2f5df` — "The pattern has three layers — the raw sources, the wiki, and the schema" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "There are three layers: **Raw sources** — your curated collection of source documents."
  - `src_48f57237f6ef` LLM Wiki v2: "The three-layer architecture (raw sources, wiki, schema) works. The operations (ingest, query, lint) cover the basics."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "1. **Raw Sources** — immutable `:Source` nodes. Original text, never modified after ingest. 2. **Graph Wiki** — the maintained layer. `:Concept` nodes (a synthesized entity or topic, with a prose `summary`"
- `clm_8268e86d6097` — "An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "It should extract structured entities. People, projects, libraries, concepts, files, decisions. Each entity gets a type, attributes, and relationships to other entities."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "The original pattern stores the maintained layer as markdown pages with freeform links. This variant stores it as a property graph, so the "cross-references" a markdown wiki approximates with links become real, typed, queryable edges"
- `clm_826354f2bdf0` — "The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims" · p 0.89 · active · 2 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "Path seeds follow the shortest path between the question's named entities."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "How path seeds should treat a graph that holds a direct edge beside the chain it summarises: the shortest path between the raw layer and the wiki layer is one hop, so the state layer is never seeded and the connective claim answers at…"
- `clm_ccececdb9e58` — "The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Do not let the LLM merely write the wiki. Let the LLM observe evidence, let the state model update belief, and let the wiki render the current understanding."
- `clm_a91dceb8a749` — "A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Markdown pages should be generated from the current belief state, not treated as unmanaged truth."
- `clm_278b40546c75` — "A rename that moves engine files leaves the historical layers quoting the old paths: spec markdown and pilot reports are evidence of what was true when written, and the wiki's own pages are state-layer owned, so they follow through a crystallize and a re-render rather than a hand edit" · p 0.75 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "`specs/**/*.md`, `llm-wiki/wiki/`, and `ai-docs/` keep the old paths. The spec markdown and pilot reports are historical evidence of what was true when they were written, and the wiki's own pages are state-layer owned"

## Superseded

- `clm_e77a37176207` — "The LLM owns the wiki layer entirely — creating pages, updating them when new sources arrive, maintaining cross-references, and keeping everything consistent — while the human reads it and never writes it" · superseded by `clm_ccececdb9e58` on 2026-08-20

## Timeline

- 2026-08-20 new_claim `clm_68d42ae34cc5` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_64cae6b2f5df` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_e77a37176207` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_8268e86d6097` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_ccececdb9e58` (src_758247b58186)
- 2026-08-20 supersession `clm_e77a37176207` (src_758247b58186)
- 2026-08-20 new_claim `clm_a91dceb8a749` (src_758247b58186)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_09c828d1c803)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_09c828d1c803)
- 2026-08-20 support_update `clm_8268e86d6097` (src_09c828d1c803)
- 2026-08-21 new_claim `clm_826354f2bdf0` (src_21d1317cc326)
- 2026-08-21 support_update `clm_826354f2bdf0` (src_e261dc10ac79)
- 2026-08-23 new_claim `clm_278b40546c75` (src_157432f58354)

## Related

- → part_of [[llm-wiki]] (1.00)
- → depends_on [[raw-layer]] (0.98)
- → related_to [[knowledge-graph]] (0.95)
- → depends_on [[state-layer]] (0.93)
- → part_of [[graphwiki]] (0.81)
- ← part_of [[rendered-page]] (0.79)
- [[raw-layer]] — 5 shared claims
- [[llm-wiki]] — 4 shared claims
- [[graphwiki]] — 3 shared claims
- [[rendered-page]] — 3 shared claims
- [[state-layer]] — 3 shared claims
- [[claim]] — 2 shared claims
- [[graph-traversal]] — 2 shared claims
- [[knowledge-graph]] — 2 shared claims
- [[andrej-karpathy]] — 1 shared claim
- [[entity-extraction]] — 1 shared claim
- [[evidence-span]] — 1 shared claim
- [[hybrid-search]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- HousamKak (no page yet)
- lucianfialho (no page yet)
