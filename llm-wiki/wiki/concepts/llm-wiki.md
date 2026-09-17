---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/chats/crystallize-placement-and-push-auth.md, title: "Where a crystallize belongs, and why pushes touching a workflow file were refused", id: src_a503e85dd88c}
  - {resource: llm-wiki/raw/chats/llm-wiki-engine-layout-refactor.md, title: "Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer", id: src_157432f58354}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-review-2026-08-22.md, title: "llm-wiki review — 2026-08-22", id: src_af0433facf9d}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_llm_wiki]
claim_ids: [clm_783a8d83a795, clm_f3c9a3215ea4, clm_11592f0abfb3, clm_68d42ae34cc5, clm_64cae6b2f5df, clm_a645efcafb39, clm_8268e86d6097, clm_7efaede7ba35, clm_a0b912ad50ca, clm_9e583518b455, clm_1970186e8e8b, clm_1036b815fa78, clm_e4478d9f00c6, clm_688a5a02a006, clm_105c92df6add, clm_16c890a2aae1, clm_eeb7b7aa9290, clm_ccececdb9e58, clm_fd6b4187fcae, clm_03243c5df8d3, clm_d8e8392dd4ee, clm_877c740dd0fb, clm_d72e29d3a5de, clm_511e5a08009b, clm_64d1c38ec74a, clm_d9fe1d507413, clm_b6682585a170, clm_49f55182d4b0, clm_bb16c12eb6cd, clm_e77a37176207]
confidence: 0.87
stale_after: 2027-07-19
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# LLM Wiki

> **In here:** In the LLM Wiki pattern the LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files that sits between a reader and their raw sources · 29 claims, confidence 0.87.

## Current understanding

- The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex — is the most important file in the system, the thing that turns a generic LLM into a disciplined knowledge worker: it encodes how the wiki is structured and what workflows to follow when ingesting, answering, or maintaining, plus which entity and relationship types exist in the domain, what quality standards apply, how to handle contradictions, and what is private versus shared (1.00)
- When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note (0.99)
- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents (0.99)
- The pattern has three layers — the raw sources, the wiki, and the schema (0.99)
- RAG retrieves chunks at query time and so rediscovers knowledge from scratch on every question, accumulating nothing between queries (0.96)
- An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages (0.96)
- A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything (0.96)
- A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion (0.96)
- Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages (0.96)
- A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page, missing cross-references, and data gaps a web search could fill (0.96)
- In the LLM Wiki pattern the LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files that sits between a reader and their raw sources — rather than only retrieving from those sources at query time (0.84)
- The raw layer is immutable — the LLM reads from it but never modifies it — and it is the source of truth for everything built above it (0.83)
- There is no such thing as a stateful LLM by itself: every stateful LLM system is built around a stateless model call, which is the constraint every wiki builder is working inside (0.83)
- Past roughly 100-200 pages index.md becomes too long for the LLM to read in one pass, so it is kept only as a human-readable catalog while real search takes over as the primary retrieval mechanism (0.83)
- When a wiki outgrows its structure the answer is not a stronger foundation but more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry (0.83)
- A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows (0.83)
- The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships (0.83)
- An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages (0.83)
- A wiki that never forgets becomes noisy, so a retention curve lets facts that were important once but have not been accessed or reinforced in months gradually fade — deprioritized rather than deleted (0.82)
- The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction (0.82)
- Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth (0.82)
- Observations consolidate up four tiers — working memory for recent unprocessed observations, episodic memory for compressed session summaries, semantic memory for cross-session facts, and procedural memory for workflows and patterns — each tier more compressed, more confident, and longer-lived than the one below it (0.82)
- Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed (0.82)
- The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them (0.82)
- The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page (0.81)
- The engine's six scripts live together under scripts/llm-wiki/ as common.py, state.py, render.py, graph.py, retrieve.py, and lint.py; because they run as PEP 723 uv run --script entries that reach each other through the running script's own directory on sys.path, moving them together preserves the launch model exactly and the sibling import shortens to import common (0.76)
- The engine's tests live under a top-level tests/llm-wiki/ rather than inside tests/harness-layer/, because the engine is a product layer and not harness tooling, with its fixtures and hook tests alongside and the shared hook fixtures lifted to tests/conftest.py so both hook directories use one copy (0.76)
- A crystallize runs in the session that holds the conversation because the conversation is its input; a later session reading the finished diff recovers what changed but not what was tried, so findings that left no artifact are lost (0.76)

## Evidence

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active · 5 support · 1 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**The schema** — a document (e.g."
  - `src_48f57237f6ef` LLM Wiki v2: "The original implies this but it's worth being direct: **the schema document (CLAUDE.md, AGENTS.md) is the most important file in the system.** It's what turns a generic LLM into a disciplined knowledge worker."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "An LLM extracts candidate `:Concept`s and `:Claim`s **against the fixed schema** — giving the extractor a schema to fill produces structured, typed output; asking it to "extract triples" does not."
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
- `clm_f3c9a3215ea4` — "When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The new one should explicitly supersede it. Linked, timestamped, old version preserved but marked stale."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A transition where a newer claim replaces an older claim while preserving historical lineage."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Two claims linked by `CONTRADICTS` with no resolution are both `disputed`. When a later source resolves the conflict, the losing claim flips to `superseded`"
- `clm_11592f0abfb3` — "Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss" · p 0.99 · active · 3 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The best approach combines three streams: - **BM25** (keyword matching with stemming and synonym expansion) - **Vector search** (semantic similarity via embeddings) - **Graph traversal** (entity-aware relationship walking)"
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "- BM25 for exact names and terms - vector search for semantic similarity - graph traversal for structural dependencies - state search for claims, entities, confidence, and evidence"
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Flat RAG (top-k over cosine similarity to the raw question) retrieved all necessary documents for only 4/6 — it reliably misses the "bridge" document when that document isn't itself semantically close to the question text."
  - exception — when on a small, densely-connected corpus: Graph traversal's multi-hop recall win comes at a precision cost: on a small, densely-connected corpus 3 of 6 questions pulled 5-6 of the 8 documents (precision as low as 0.33), and precision on bigger, sparser graphs — including how many hops is too many — is untested (`obs_a7f3eecc8079`)
  - exception — when on a historical question whose target only two of the four streams return: Reciprocal rank fusion decides the top of a historical answer by vote count before belief enters, so a superseded claim only two streams reach loses to claims every stream found at middling ranks and no rerank weight on current belief lifts it (`obs_c7739b40d9ef`)
- `clm_68d42ae34cc5` — "The wiki is a persistent, compounding artifact: its cross-references already exist and its synthesis already reflects every source read, so a question is answered from compiled knowledge rather than re-derived from raw documents" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "This is the key difference: **the wiki is a persistent, compounding artifact.** The cross-references are already there."
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Future queries read the compiled wiki instead of re-deriving knowledge from scratch every time. Knowledge compounds."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Inspired by [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), which proposes a persistent, LLM-maintained knowledge base that compounds over time instead of re-deriving answers from raw sources on…"
- `clm_64cae6b2f5df` — "The pattern has three layers — the raw sources, the wiki, and the schema" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "There are three layers: **Raw sources** — your curated collection of source documents."
  - `src_48f57237f6ef` LLM Wiki v2: "The three-layer architecture (raw sources, wiki, schema) works. The operations (ingest, query, lint) cover the basics."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "1. **Raw Sources** — immutable `:Source` nodes. Original text, never modified after ingest. 2. **Graph Wiki** — the maintained layer. `:Concept` nodes (a synthesized entity or topic, with a prose `summary`"
- `clm_a645efcafb39` — "RAG retrieves chunks at query time and so rediscovers knowledge from scratch on every question, accumulating nothing between queries" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "This works, but the LLM is rediscovering knowledge from scratch on every question. There's no accumulation."
  - `src_48f57237f6ef` LLM Wiki v2: "The core insight is correct: **stop re-deriving, start compiling.** RAG retrieves and forgets. A wiki accumulates and compounds."
- `clm_8268e86d6097` — "An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions — each carrying a type, attributes, and typed relationships to other entities, rather than only writing prose into pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "It should extract structured entities. People, projects, libraries, concepts, files, decisions. Each entity gets a type, attributes, and relationships to other entities."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "The original pattern stores the maintained layer as markdown pages with freeform links. This variant stores it as a property graph, so the "cross-references" a markdown wiki approximates with links become real, typed, queryable edges"
- `clm_7efaede7ba35` — "A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Every fact in the wiki should carry a confidence score: how many sources support it, how recently it was confirmed, whether anything contradicts it."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "This avoids pretending that one float captures everything."
- `clm_a0b912ad50ca` — "A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The LLM should propose which claim is more likely correct based on source recency, source authority, and the number of supporting observations. The human can override, but the default behavior should usually be right."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Contradictions should not be hidden."
- `clm_9e583518b455` — "Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "The important insight: **good answers can be filed back into the wiki as new pages.** A comparison you asked for, an analysis, a connection you discovered — these are valuable and shouldn't disappear into chat history."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A debugging session, research thread, or architecture conversation becomes a source."
- `clm_1970186e8e8b` — "A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page, missing cross-references, and data gaps a web search could fill" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "Look for: contradictions between pages, stale claims that newer sources have superseded, orphan pages with no inbound links, important concepts mentioned but lacking their own page, missing cross-references, data gaps that could be filled…"
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "**The linter** keeps the collection healthy. It deduplicates. It flags outdated entries. It makes sure the same document did not get filed under three different titles. It runs on its own schedule, not as part of every query."
- `clm_1036b815fa78` — "In the LLM Wiki pattern the LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files that sits between a reader and their raw sources — rather than only retrieving from those sources at query time" · p 0.84 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "Instead of just retrieving from raw documents at query time, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files that sits between you and the raw sources."
- `clm_e4478d9f00c6` — "The raw layer is immutable — the LLM reads from it but never modifies it — and it is the source of truth for everything built above it" · p 0.83 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "These are immutable — the LLM reads from them but never modifies them. This is your source of truth."
- `clm_688a5a02a006` — "There is no such thing as a stateful LLM by itself: every stateful LLM system is built around a stateless model call, which is the constraint every wiki builder is working inside." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "There is no such thing as a stateful LLM by itself. Stateful LLM systems are built around a stateless model call."
- `clm_105c92df6add` — "Past roughly 100-200 pages index.md becomes too long for the LLM to read in one pass, so it is kept only as a human-readable catalog while real search takes over as the primary retrieval mechanism" · p 0.83 · active · 1 support · 0 contradict · when: past roughly 100-200 pages — beyond the scale at which the index can be read in one pass
  - `src_48f57237f6ef` LLM Wiki v2: "This works up to maybe 100-200 pages. Beyond that, the index itself becomes too long for the LLM to read in one pass, and you need real search."
- `clm_16c890a2aae1` — "When a wiki outgrows its structure the answer is not a stronger foundation but more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "The answer is not a stronger foundation. The answer is more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry."
- `clm_eeb7b7aa9290` — "A wiki works the way a real library does, with the roles segmented: nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously — those are separate jobs done by separate people with separate workflows." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Nobody asks the librarian to also receive shipments, catalog new arrivals, and repair damaged books simultaneously. Those are separate jobs done by separate people with separate workflows. The library works because the roles are segmented."
- `clm_ccececdb9e58` — "The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Do not let the LLM merely write the wiki. Let the LLM observe evidence, let the state model update belief, and let the wiki render the current understanding."
- `clm_fd6b4187fcae` — "An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log — a single source might touch 10-15 wiki pages" · p 0.83 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "An example flow: the LLM reads the source, discusses key takeaways with you, writes a summary page in the wiki, updates the index, updates relevant entity and concept pages across the wiki, and appends an entry to the log."
  - exception — when for a broad, uncurated file-system corpus of thousands of files rather than a small personally curated collection: For a broad, uncurated corpus the goal of ingestion is findability rather than deep indexing: a good title and a clean summary is enough for a librarian to locate the file later, and trying to do more at that stage wastes tokens and produces dirty data that poisons retrieval downstream (`obs_8e2a1e93b171`)
- `clm_03243c5df8d3` — "A wiki that never forgets becomes noisy, so a retention curve lets facts that were important once but have not been accessed or reinforced in months gradually fade — deprioritized rather than deleted" · p 0.82 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Implement a retention curve: facts that were important once but haven't been accessed or reinforced in months should gradually fade. Not deleted, but deprioritized."
- `clm_d8e8392dd4ee` — "The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction" · p 0.82 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The human should still be in the loop for curation and direction. But the bookkeeping, the part that makes people abandon wikis, should be fully automated."
  - exception — when for the deep lane, which turns a source into belief: Automation stops at the light lane: the weekly routine files only the light-lane channels and the deep lane stays a session's command (`obs_da678a69fac4`)
- `clm_877c740dd0fb` — "Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth" · p 0.82 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "The LLM does not decide truth. It outputs a noisy observation. The updater decides how belief changes."
- `clm_d72e29d3a5de` — "Observations consolidate up four tiers — working memory for recent unprocessed observations, episodic memory for compressed session summaries, semantic memory for cross-session facts, and procedural memory for workflows and patterns — each tier more compressed, more confident, and longer-lived than the one below it" · p 0.82 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "- **Working memory**: recent observations, not yet processed - **Episodic memory**: session summaries, compressed from raw observations - **Semantic memory**: cross-session facts, consolidated from episodes - **Procedural memory**…"
- `clm_511e5a08009b` — "Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed" · p 0.82 · active · 1 support · 0 contradict · when: at moderate scale — roughly 100 sources and hundreds of pages
  - `src_6711dfc0cddd` LLM Wiki: "When answering a query, the LLM reads the index first to find relevant pages, then drills into them."
- `clm_64d1c38ec74a` — "The wiki is operated through three operations — ingest, query, and lint — and log.md keeps an append-only chronological record of every one of them" · p 0.82 · active · 1 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**log.md** is chronological. It's an append-only record of what happened and when — ingests, queries, lint passes."
- `clm_d9fe1d507413` — "The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page" · p 0.81 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Separate source, observation, belief, and rendered page."
- `clm_b6682585a170` — "The engine's six scripts live together under scripts/llm-wiki/ as common.py, state.py, render.py, graph.py, retrieve.py, and lint.py; because they run as PEP 723 uv run --script entries that reach each other through the running script's own directory on sys.path, moving them together preserves the launch model exactly and the sibling import shortens to import common" · p 0.76 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The engine's scripts run as PEP 723 `uv run --script` entries and reach each other through `import llm_wiki_common`, which resolves only because Python puts the running script's own directory on `sys.path`."
- `clm_49f55182d4b0` — "The engine's tests live under a top-level tests/llm-wiki/ rather than inside tests/harness-layer/, because the engine is a product layer and not harness tooling, with its fixtures and hook tests alongside and the shared hook fixtures lifted to tests/conftest.py so both hook directories use one copy" · p 0.76 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The engine's tests live under a top-level `tests/llm-wiki/`, with its fixtures at `tests/llm-wiki/fixtures/` and its hook tests at `tests/llm-wiki/hooks/`."
- `clm_bb16c12eb6cd` — "A crystallize runs in the session that holds the conversation because the conversation is its input; a later session reading the finished diff recovers what changed but not what was tried, so findings that left no artifact are lost" · p 0.76 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "A crystallize takes the conversation as its input, so it can only run where that conversation exists."

## Contradictions

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake."

## Superseded

- `clm_e77a37176207` — "The LLM owns the wiki layer entirely — creating pages, updating them when new sources arrive, maintaining cross-references, and keeping everything consistent — while the human reads it and never writes it" · superseded by `clm_ccececdb9e58` on 2026-08-20

## Timeline

- 2026-08-20 new_claim `clm_1036b815fa78` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_a645efcafb39` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_68d42ae34cc5` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_64cae6b2f5df` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_e4478d9f00c6` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_e77a37176207` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_783a8d83a795` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_64d1c38ec74a` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_fd6b4187fcae` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_9e583518b455` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_1970186e8e8b` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_511e5a08009b` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_a645efcafb39` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_783a8d83a795` (src_48f57237f6ef)
- 2026-08-20 scope_split `clm_105c92df6add` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_7efaede7ba35` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_f3c9a3215ea4` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_03243c5df8d3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_d72e29d3a5de` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_8268e86d6097` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_d8e8392dd4ee` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_a0b912ad50ca` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_ccececdb9e58` (src_758247b58186)
- 2026-08-20 supersession `clm_e77a37176207` (src_758247b58186)
- 2026-08-20 new_claim `clm_877c740dd0fb` (src_758247b58186)
- 2026-08-20 support_update `clm_7efaede7ba35` (src_758247b58186)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_758247b58186)
- 2026-08-20 support_update `clm_a0b912ad50ca` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 support_update `clm_9e583518b455` (src_758247b58186)
- 2026-08-20 new_claim `clm_d9fe1d507413` (src_758247b58186)
- 2026-08-20 new_claim `clm_688a5a02a006` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_16c890a2aae1` (src_b585de1a26bb)
- 2026-08-20 contradiction_update `clm_783a8d83a795` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_eeb7b7aa9290` (src_b585de1a26bb)
- 2026-08-20 exception_addition `clm_fd6b4187fcae` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_1970186e8e8b` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_68d42ae34cc5` (src_09c828d1c803)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_09c828d1c803)
- 2026-08-20 support_update `clm_8268e86d6097` (src_09c828d1c803)
- 2026-08-20 support_update `clm_783a8d83a795` (src_09c828d1c803)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_09c828d1c803)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-08-21 exception_addition `clm_d8e8392dd4ee` (src_21d1317cc326)
- 2026-08-21 support_update `clm_783a8d83a795` (src_af0433facf9d)
- 2026-08-21 human_override `clm_783a8d83a795` (human:ringo)
- 2026-08-23 new_claim `clm_b6682585a170` (src_157432f58354)
- 2026-08-23 new_claim `clm_49f55182d4b0` (src_157432f58354)
- 2026-08-23 new_claim `clm_bb16c12eb6cd` (src_a503e85dd88c)

## Related

- ← part_of [[wiki-layer]] (1.00)
- ← part_of [[raw-layer]] (0.99)
- ← part_of [[schema-layer]] (0.99)
- ← authored [[andrej-karpathy]] (0.96)
- → related_to [[rag]] (0.95)
- ← part_of [[lint]] (0.94)
- → uses [[lint]] (0.83)
- → uses [[query]] (0.83)
- ← extends [[graphwiki]] (0.82)
- ← applies_to [[statelessness]] (0.80)
- ← extends ahumanft (no page yet) (0.80)
- ← extends [[segmentation]] (0.80)
- … 10 more edges — `graph.py neighbors ent_llm_wiki`
- [[claim]] — 9 shared claims
- [[state-layer]] — 7 shared claims
- [[ingest]] — 6 shared claims
- [[raw-layer]] — 5 shared claims
- [[belief-updater]] — 4 shared claims
- [[graphwiki]] — 4 shared claims
- [[knowledge-graph]] — 4 shared claims
- [[lint]] — 4 shared claims
- [[memory-lifecycle]] — 4 shared claims
- [[observation]] — 4 shared claims
- [[segmentation]] — 4 shared claims
- [[wiki-layer]] — 4 shared claims
- [[index-md]] — 3 shared claims
- [[librarian]] — 3 shared claims
- [[query]] — 3 shared claims
- [[rag]] — 3 shared claims
- [[rendered-page]] — 3 shared claims
- [[schema-layer]] — 3 shared claims
- [[supersession]] — 3 shared claims
- [[andrej-karpathy]] — 2 shared claims
- [[confidence-scoring]] — 2 shared claims
- [[crystallization]] — 2 shared claims
- [[entity-extraction]] — 2 shared claims
- [[graph-traversal]] — 2 shared claims
- [[hooks]] — 2 shared claims
- [[hybrid-search]] — 2 shared claims
- [[log-md]] — 2 shared claims
- [[embeddings]] — 1 shared claim
- [[statelessness]] — 1 shared claim
- [[transition-ledger]] — 1 shared claim
- ahumanft (no page yet)
- consolidation tiers (no page yet)
- HousamKak (no page yet)
- lucianfialho (no page yet)
- retention curve (no page yet)
- rohitg00 (no page yet)
