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
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
  - {resource: llm-wiki/raw/notes/llm-wiki-review-2026-08-22.md, title: "llm-wiki review — 2026-08-22", id: src_af0433facf9d}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_claim]
claim_ids: [clm_783a8d83a795, clm_f3c9a3215ea4, clm_11592f0abfb3, clm_64cae6b2f5df, clm_7efaede7ba35, clm_a0b912ad50ca, clm_9e583518b455, clm_61c5c8ab49ab, clm_3995926311e1, clm_2bb1cab4a5e8, clm_877c740dd0fb, clm_a91dceb8a749, clm_2c4f52e16820, clm_30151137c491, clm_d9fe1d507413, clm_10573df70548, clm_b78683e15c8a, clm_3dcfe79f8689, clm_774c0f6c78f5]
confidence: 0.87
stale_after: 2026-10-07
last_rendered: 2026-09-05T16:35:43Z
review_required: false
---

# claim

> **In here:** The entity claim status merged into claim because a claim's status is a property of the claim and not a separate concept; its page stopped rendering and its name and alias joined claim's aliases · 19 claims, confidence 0.87.

## Current understanding

- The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex — is the most important file in the system, the thing that turns a generic LLM into a disciplined knowledge worker: it encodes how the wiki is structured and what workflows to follow when ingesting, answering, or maintaining, plus which entity and relationship types exist in the domain, what quality standards apply, how to handle contradictions, and what is private versus shared (1.00)
- When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note (0.99)
- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- The pattern has three layers — the raw sources, the wiki, and the schema (0.99)
- A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything (0.96)
- A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion (0.96)
- Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages (0.96)
- A human supports observation lands as a support_update and never marks a claim reviewed; only a human_override transition adds the claim to the engine's reviewed set, so a confirmation that carries no override leaves the claim in the review queue and its pages marked review_required (0.91)
- Trust status travels with the data all the way into the synthesized answer: any claim or concept cited with a status other than current is flagged inline rather than presented as settled fact, instead of the status being silently dropped at read time (0.83)
- An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships (0.83)
- Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth (0.83)
- A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline — and every load-bearing claim is shown at its confidence instead of stated as settled truth (0.83)
- Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid — because probabilities saturate too easily while log-odds lets independent sources accumulate naturally (0.83)
- Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required — and the operation vocabulary is new_claim, support_update, contradiction_update, scope_split, exception_addition, supersession, decay_update, promotion, archival, rejection, and human_override (0.83)
- The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page (0.81)
- Retraction is keyed on the run identifier stamped on every row a run appends, so rows written before the governance layer carry none and are permanent: asking to reverse the vault's one pre-existing entity merge returns a refusal naming it as not retractable, and the only way to change a pre-governance belief is a new observation that contradicts or supersedes it (0.79)
- Undo is stack-ordered for belief runs because probability and status come from each transition's recorded after-snapshot while log-odds replay as deltas — removing a run from the middle would leave later claims carrying a snapshot their own history no longer produces — while a merge or an observation-less registration carries no belief and reverses from any position (0.79)
- The entity claim status merged into claim because a claim's status is a property of the claim and not a separate concept; its page stopped rendering and its name and alias joined claim's aliases (0.76)
- Ordering two same-second runs by the hex of their run_id can replay a support or a supersession before the claim it targets exists — thirteen core tests hit a KeyError on it, and an inbox drain produces dependent runs inside one wall-clock second by construction (0.75)

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
- `clm_64cae6b2f5df` — "The pattern has three layers — the raw sources, the wiki, and the schema" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "There are three layers: **Raw sources** — your curated collection of source documents."
  - `src_48f57237f6ef` LLM Wiki v2: "The three-layer architecture (raw sources, wiki, schema) works. The operations (ingest, query, lint) cover the basics."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "1. **Raw Sources** — immutable `:Source` nodes. Original text, never modified after ingest. 2. **Graph Wiki** — the maintained layer. `:Concept` nodes (a synthesized entity or topic, with a prose `summary`"
- `clm_7efaede7ba35` — "A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Every fact in the wiki should carry a confidence score: how many sources support it, how recently it was confirmed, whether anything contradicts it."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "This avoids pretending that one float captures everything."
- `clm_a0b912ad50ca` — "A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The LLM should propose which claim is more likely correct based on source recency, source authority, and the number of supporting observations. The human can override, but the default behavior should usually be right."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Contradictions should not be hidden."
- `clm_9e583518b455` — "Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page — a debugging session, research thread, or architecture conversation becomes a raw source, which yields a summary, then observations, then claim updates, and only then new or updated wiki pages" · p 0.96 · active · 2 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "The important insight: **good answers can be filed back into the wiki as new pages.** A comparison you asked for, an analysis, a connection you discovered — these are valuable and shouldn't disappear into chat history."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A debugging session, research thread, or architecture conversation becomes a source."
- `clm_61c5c8ab49ab` — "A human supports observation lands as a support_update and never marks a claim reviewed; only a human_override transition adds the claim to the engine's reviewed set, so a confirmation that carries no override leaves the claim in the review queue and its pages marked review_required" · p 0.91 · active · 2 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "A human supports observation lands as a support_update and never marks a claim reviewed; only a human_override transition adds the claim to the engine's reviewed set."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "Confirm and Restore file a human supports observation with the claim's current text plus an override to status active, so the engine lands the override and closes the review while the numbers stay untouched;"
- `clm_3995926311e1` — "Trust status travels with the data all the way into the synthesized answer: any claim or concept cited with a status other than current is flagged inline rather than presented as settled fact, instead of the status being silently dropped at read time." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "Any `:Claim` or `:Concept` cited with `status != current` must be flagged inline ("X is declarative *[disputed — see claim-2]*") rather than presented as settled fact"
- `clm_2bb1cab4a5e8` — "An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A structured claim extracted by the LLM from a source. It is a noisy semantic measurement, not truth."
- `clm_877c740dd0fb` — "Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "The LLM does not decide truth. It outputs a noisy observation. The updater decides how belief changes."
- `clm_a91dceb8a749` — "A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Markdown pages should be generated from the current belief state, not treated as unmanaged truth."
- `clm_2c4f52e16820` — "Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Probabilities saturate too easily. If several independent sources support the same claim, log-odds lets evidence accumulate more naturally."
- `clm_30151137c491` — "Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Every state update is append-only."
- `clm_d9fe1d507413` — "The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page" · p 0.81 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Separate source, observation, belief, and rendered page."
- `clm_10573df70548` — "Retraction is keyed on the run identifier stamped on every row a run appends, so rows written before the governance layer carry none and are permanent: asking to reverse the vault's one pre-existing entity merge returns a refusal naming it as not retractable, and the only way to change a pre-governance belief is a new observation that contradicts or supersedes it" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "This is a real limit rather than an oversight, and it is worth stating plainly because it decides what a migration into this layer buys. Everything written after the governance layer landed is reversible under the stack rule;"
- `clm_b78683e15c8a` — "Undo is stack-ordered for belief runs because probability and status come from each transition's recorded after-snapshot while log-odds replay as deltas — removing a run from the middle would leave later claims carrying a snapshot their own history no longer produces — while a merge or an observation-less registration carries no belief and reverses from any position" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "The reason is in how the fold works. Probability and status come from each transition's recorded after-snapshot, while log-odds replay as deltas;"
- `clm_3dcfe79f8689` — "The entity claim status merged into claim because a claim's status is a property of the claim and not a separate concept; its page stopped rendering and its name and alias joined claim's aliases" · p 0.76 · active · 1 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "The entity claim status merged into claim, because a claim's status is a property of the claim and not a separate concept; its page stopped rendering and its name and alias joined claim's aliases."
- `clm_774c0f6c78f5` — "Ordering two same-second runs by the hex of their run_id can replay a support or a supersession before the claim it targets exists — thirteen core tests hit a KeyError on it, and an inbox drain produces dependent runs inside one wall-clock second by construction" · p 0.75 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The engine builder shipped `(timestamp, file order)` instead, because the literal key replays a same-second dependent run before the run it depends on: two runs sharing a timestamp order by the hex of their `run_id`, so a support or a…"

## Contradictions

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake."

## Timeline

- 2026-08-20 new_claim `clm_64cae6b2f5df` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_783a8d83a795` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_9e583518b455` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_783a8d83a795` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_7efaede7ba35` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_f3c9a3215ea4` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_a0b912ad50ca` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_2bb1cab4a5e8` (src_758247b58186)
- 2026-08-20 new_claim `clm_877c740dd0fb` (src_758247b58186)
- 2026-08-20 new_claim `clm_2c4f52e16820` (src_758247b58186)
- 2026-08-20 new_claim `clm_30151137c491` (src_758247b58186)
- 2026-08-20 support_update `clm_7efaede7ba35` (src_758247b58186)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_758247b58186)
- 2026-08-20 support_update `clm_a0b912ad50ca` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 new_claim `clm_a91dceb8a749` (src_758247b58186)
- 2026-08-20 support_update `clm_9e583518b455` (src_758247b58186)
- 2026-08-20 new_claim `clm_d9fe1d507413` (src_758247b58186)
- 2026-08-20 contradiction_update `clm_783a8d83a795` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_09c828d1c803)
- 2026-08-20 support_update `clm_783a8d83a795` (src_09c828d1c803)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_3995926311e1` (src_09c828d1c803)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-08-21 support_update `clm_783a8d83a795` (src_af0433facf9d)
- 2026-08-21 human_override `clm_783a8d83a795` (human:ringo)
- 2026-08-21 new_claim `clm_61c5c8ab49ab` (src_e261dc10ac79)
- 2026-08-21 support_update `clm_61c5c8ab49ab` (src_e261dc10ac79)
- 2026-08-21 new_claim `clm_3dcfe79f8689` (src_e261dc10ac79)
- 2026-08-22 new_claim `clm_774c0f6c78f5` (src_4863372048fa)
- 2026-08-22 new_claim `clm_b78683e15c8a` (src_e689bfca564a)
- 2026-08-22 new_claim `clm_10573df70548` (src_e689bfca564a)

## Related

- ← applies_to [[supersession]] (1.00)
- ← produces [[transition-ledger]] (0.99)
- ← applies_to [[belief-updater]] (0.98)
- → applies_to [[claim]] (0.82)
- ← cites [[query]] (0.82)
- → part_of [[claim]] (0.82)
- ← applies_to [[observation]] (0.80)
- ← owns [[belief-updater]] (0.79)
- ← replaces [[supersession]] (0.79)
- ← applies_to [[confidence-scoring]] (0.79)
- [[llm-wiki]] — 9 shared claims
- [[state-layer]] — 9 shared claims
- [[observation]] — 6 shared claims
- [[belief-updater]] — 5 shared claims
- [[supersession]] — 5 shared claims
- [[transition-ledger]] — 5 shared claims
- [[rendered-page]] — 4 shared claims
- [[confidence-scoring]] — 3 shared claims
- [[evidence-span]] — 3 shared claims
- [[knowledge-graph]] — 3 shared claims
- [[raw-layer]] — 3 shared claims
- [[schema-layer]] — 3 shared claims
- [[graphwiki]] — 2 shared claims
- [[memory-lifecycle]] — 2 shared claims
- [[query]] — 2 shared claims
- [[wiki-layer]] — 2 shared claims
- [[crystallization]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[entity-extraction]] — 1 shared claim
- [[entity-resolution]] — 1 shared claim
- [[graph-traversal]] — 1 shared claim
- [[hybrid-search]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[rag]] — 1 shared claim
- [[segmentation]] — 1 shared claim
