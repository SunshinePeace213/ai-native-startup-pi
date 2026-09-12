---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/chats/crystallize-placement-and-push-auth.md, title: "Where a crystallize belongs, and why pushes touching a workflow file were refused", id: src_a503e85dd88c}
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_state_layer]
claim_ids: [clm_f3c9a3215ea4, clm_11592f0abfb3, clm_7efaede7ba35, clm_a0b912ad50ca, clm_38f894daef7f, clm_826354f2bdf0, clm_2bb1cab4a5e8, clm_ccececdb9e58, clm_877c740dd0fb, clm_a91dceb8a749, clm_2c4f52e16820, clm_d9fe1d507413, clm_4de35163e2a6, clm_a94c83fea089, clm_c0aec8aa0fdd, clm_d55e8a20db3b, clm_c3528b922fca, clm_4c34c8aabbe3, clm_55773f910713, clm_553b9901d78c]
confidence: 0.84
stale_after: 2026-10-15
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# state layer

> **In here:** state layer — 20 claims, confidence 0.84, 8 sources.

## Current understanding

- When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale — rather than the old claim sitting in place with a note (0.99)
- Search that scales combines four retrieval streams — BM25 for exact names and terms, vector search for semantic similarity, graph traversal for structural dependencies, and state search over claims, entities, confidence, and evidence — fused with reciprocal rank fusion, because each stream catches what the others miss (0.99)
- A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything (0.96)
- A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion (0.96)
- The state stream's stopword table, inherited from a standard English list, carried the word own itself and silently removed the very token prefix matching exists to expand, until the build dropped it from the list (0.90)
- The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims (0.89)
- An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships (0.83)
- The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships (0.83)
- Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth (0.83)
- A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline — and every load-bearing claim is shown at its confidence instead of stated as settled truth (0.83)
- Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid — because probabilities saturate too easily while log-odds lets independent sources accumulate naturally (0.83)
- The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page (0.81)
- The ledgers are marked for union merge and the views are not: a union in either direction yields the same views only because the fold is a total order on the rows themselves rather than on their position in the file, and a conflict in a view or a page is repaired by rebuilding and re-rendering rather than by hand (0.79)
- The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb and a protected path is denied (0.79)
- Ledger rows fold in (timestamp, run_id, file order), made causal by an engine invariant that stamps every write run strictly after the newest replayed ledger stamp — max(now, newest + 1 second) — so runs never tie inside one checkout and the run_id component only ever orders runs from two independent branches (0.79)
- The state layer's write lock is useful for what it records rather than only for what it excludes: the holder writes its process id, actor, verb, and start time into the lock file, so a second writer's refusal names who holds it, and a stale record left by a crashed holder is informational because the kernel released the advisory lock with the process (0.77)
- The inbox separates authorship of a proposal from responsibility for the write: an actor with no permission to apply may still write a proposal, and the drain records the run against the actor that applied it rather than the one that wrote the file (0.77)
- Sorting the ledger readers moved only evidence lists on the live vault — 20 of 44 entity rows and 11 of 100 relationship rows, each the same multiset re-ordered — while the claims, unresolved-conflicts, and snapshot views stayed byte-identical and no entity resolution moved (0.76)
- The retriever's state stream folds inflections with a fixed rule set — entities to entity, owns to own, rendering to render — and matches a folded query token of three or more characters by prefix, so own reaches owner and ownership (0.76)
- A crystallize's knowledge lands wherever its commit lands, so a commit riding a feature branch reaches the wiki only when that branch merges and a reworked or abandoned stack takes the knowledge with it; the ledgers' union merge helps on merge and does nothing for a branch that never merges (0.75)

## Evidence

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
- `clm_7efaede7ba35` — "A claim's confidence is not one number — the belief layer keeps its dimensions separate, tracking semantic confidence, source authority, extraction quality, recency weight, and agreement score, and combines them into a single observation weight rather than pretending one float captures everything" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "Every fact in the wiki should carry a confidence score: how many sources support it, how recently it was confirmed, whether anything contradicts it."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "This avoids pretending that one float captures everything."
- `clm_a0b912ad50ca` — "A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The LLM should propose which claim is more likely correct based on source recency, source authority, and the number of supporting observations. The human can override, but the default behavior should usually be right."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Contradictions should not be hidden."
- `clm_38f894daef7f` — "The state stream's stopword table, inherited from a standard English list, carried the word own itself and silently removed the very token prefix matching exists to expand, until the build dropped it from the list" · p 0.90 · active · 2 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The stopword table the stream inherited from a standard English list carried the word own itself, which silently removed the token the mechanism exists for until the build dropped it from the list."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "Dropping the word own from the retriever's stopword table moved the superseded ownership claim on "who used to own the wiki layer" from rank 22 to rank 5: once the token reached the state stream it matched ownership by prefix, the claim…"
- `clm_826354f2bdf0` — "The retriever's graph stream seeds the shortest path between the question's named entities, so a direct edge bypasses the entity on the longer chain: the live graph's direct wiki layer to raw layer edge leaves the state layer unseeded for what sits between the raw layer and the wiki layer, and the connective claim answers only at rank ten through the endpoints' own claims" · p 0.89 · active · 2 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "Path seeds follow the shortest path between the question's named entities."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "How path seeds should treat a graph that holds a direct edge beside the chain it summarises: the shortest path between the raw layer and the wiki layer is one hop, so the state layer is never seeded and the connective claim answers at…"
- `clm_2bb1cab4a5e8` — "An observation is a structured claim the LLM extracts from a source — a noisy semantic measurement of what that source says, never truth — so it may be wrong and is filed with full attribution: source id, verbatim evidence span, confidence, extractor model and prompt version, timestamp, claim key, stance, entities, and relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "A structured claim extracted by the LLM from a source. It is a noisy semantic measurement, not truth."
- `clm_ccececdb9e58` — "The LLM does not write the wiki: it observes evidence, the state model updates belief, and the wiki renders the current understanding — markdown pages are human-readable renderings of the belief state rather than the primary source of truth, which is raw immutable evidence plus structured observations, probabilistic belief state, transition history, and graph relationships" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Do not let the LLM merely write the wiki. Let the LLM observe evidence, let the state model update belief, and let the wiki render the current understanding."
- `clm_877c740dd0fb` — "Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "The LLM does not decide truth. It outputs a noisy observation. The updater decides how belief changes."
- `clm_a91dceb8a749` — "A wiki page is generated from the current belief state rather than treated as unmanaged truth: its frontmatter carries the entity ids, claim ids, confidence, sources, last-rendered timestamp, and review flag, its body follows fixed sections — current understanding, evidence, open questions, contradictions, superseded claims, related entities, timeline" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Markdown pages should be generated from the current belief state, not treated as unmanaged truth."
- `clm_2c4f52e16820` — "Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid" · p 0.83 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Probabilities saturate too easily. If several independent sources support the same claim, log-odds lets evidence accumulate more naturally."
- `clm_d9fe1d507413` — "The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page" · p 0.81 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Separate source, observation, belief, and rendered page."
- `clm_4de35163e2a6` — "The ledgers are marked for union merge and the views are not: a union in either direction yields the same views only because the fold is a total order on the rows themselves rather than on their position in the file, and a conflict in a view or a page is repaired by rebuilding and re-rendering rather than by hand" · p 0.79 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "That works only because the fold is a total order on the rows themselves rather than on their position in the file, so a union merge in either direction yields the same views byte for byte."
- `clm_a94c83fea089` — "The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb and a protected path is denied" · p 0.79 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The guards match text; they do not sandbox. The documented consequence is that an unquoted heredoc body naming both a write verb and a protected path is denied even though nothing is being written to that path"
- `clm_c0aec8aa0fdd` — "Ledger rows fold in (timestamp, run_id, file order), made causal by an engine invariant that stamps every write run strictly after the newest replayed ledger stamp — max(now, newest + 1 second) — so runs never tie inside one checkout and the run_id component only ever orders runs from two independent branches" · p 0.79 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The resolution kept the plan's key and gave the engine the invariant that makes it causal: a write run's stamp is strictly after the newest stamp on any replayed ledger row, computed as `max(now, newest + 1 second)`."
- `clm_d55e8a20db3b` — "The state layer's write lock is useful for what it records rather than only for what it excludes: the holder writes its process id, actor, verb, and start time into the lock file, so a second writer's refusal names who holds it, and a stale record left by a crashed holder is informational because the kernel released the advisory lock with the process" · p 0.77 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "What makes it useful in practice is not the exclusion but the record: on acquiring the lock the holder writes its own process id, actor, verb, and start time into the file, so the second writer's refusal names who is holding it instead of…"
- `clm_c3528b922fca` — "The inbox separates authorship of a proposal from responsibility for the write: an actor with no permission to apply may still write a proposal, and the drain records the run against the actor that applied it rather than the one that wrote the file" · p 0.77 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "That split is what lets an actor propose work it is not permitted to land. The weekly routine has no permission to apply on the shared segment, but nothing stops it writing a proposal;"
- `clm_4c34c8aabbe3` — "Sorting the ledger readers moved only evidence lists on the live vault — 20 of 44 entity rows and 11 of 100 relationship rows, each the same multiset re-ordered — while the claims, unresolved-conflicts, and snapshot views stayed byte-identical and no entity resolution moved" · p 0.76 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "On a scratch copy the diff was exact — 20 of 44 entity rows moved and 11 of 100 relationship rows moved, and in every case the only field that changed was an evidence list."
- `clm_55773f910713` — "The retriever's state stream folds inflections with a fixed rule set — entities to entity, owns to own, rendering to render — and matches a folded query token of three or more characters by prefix, so own reaches owner and ownership" · p 0.76 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The retriever's state stream folds inflections with a fixed rule set (entities → entity, owns → own, rendering → render) and matches a folded query token of three or more characters by prefix, so own reaches owner and ownership."
- `clm_553b9901d78c` — "A crystallize's knowledge lands wherever its commit lands, so a commit riding a feature branch reaches the wiki only when that branch merges and a reworked or abandoned stack takes the knowledge with it; the ledgers' union merge helps on merge and does nothing for a branch that never merges" · p 0.75 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "The knowledge nevertheless lands wherever the commit lands. A crystallize committed onto a feature branch reaches the wiki only when that branch merges, so a stack that is reworked or abandoned takes the knowledge with it."

## Timeline

- 2026-08-20 new_claim `clm_11592f0abfb3` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_7efaede7ba35` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_f3c9a3215ea4` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_a0b912ad50ca` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_ccececdb9e58` (src_758247b58186)
- 2026-08-20 new_claim `clm_2bb1cab4a5e8` (src_758247b58186)
- 2026-08-20 new_claim `clm_877c740dd0fb` (src_758247b58186)
- 2026-08-20 new_claim `clm_2c4f52e16820` (src_758247b58186)
- 2026-08-20 support_update `clm_7efaede7ba35` (src_758247b58186)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_758247b58186)
- 2026-08-20 support_update `clm_a0b912ad50ca` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_758247b58186)
- 2026-08-20 new_claim `clm_a91dceb8a749` (src_758247b58186)
- 2026-08-20 new_claim `clm_d9fe1d507413` (src_758247b58186)
- 2026-08-20 support_update `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 exception_addition `clm_11592f0abfb3` (src_09c828d1c803)
- 2026-08-20 support_update `clm_f3c9a3215ea4` (src_09c828d1c803)
- 2026-08-21 new_claim `clm_55773f910713` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_38f894daef7f` (src_21d1317cc326)
- 2026-08-21 exception_addition `clm_11592f0abfb3` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_826354f2bdf0` (src_21d1317cc326)
- 2026-08-21 support_update `clm_38f894daef7f` (src_e261dc10ac79)
- 2026-08-21 support_update `clm_826354f2bdf0` (src_e261dc10ac79)
- 2026-08-22 new_claim `clm_c0aec8aa0fdd` (src_4863372048fa)
- 2026-08-22 new_claim `clm_4c34c8aabbe3` (src_4863372048fa)
- 2026-08-22 new_claim `clm_a94c83fea089` (src_4863372048fa)
- 2026-08-22 new_claim `clm_d55e8a20db3b` (src_e689bfca564a)
- 2026-08-22 new_claim `clm_c3528b922fca` (src_e689bfca564a)
- 2026-08-22 new_claim `clm_4de35163e2a6` (src_e689bfca564a)
- 2026-08-23 new_claim `clm_553b9901d78c` (src_a503e85dd88c)

## Related

- ← uses [[hybrid-search]] (0.98)
- → depends_on [[raw-layer]] (0.93)
- ← depends_on [[wiki-layer]] (0.93)
- ← depends_on [[rendered-page]] (0.93)
- ← part_of [[transition-ledger]] (0.93)
- ← applies_to [[belief-updater]] (0.93)
- ← part_of [[confidence-scoring]] (0.79)
- ← applies_to [[write-guard]] (0.79)
- ← part_of [[knowledge-graph]] (0.79)
- ← produces [[rendered-page]] (0.79)
- → part_of [[llm-wiki]] (0.78)
- ← part_of [[observation]] (0.77)
- … 1 more edges — `graph.py neighbors ent_state_layer`
- [[claim]] — 9 shared claims
- [[llm-wiki]] — 7 shared claims
- [[belief-updater]] — 5 shared claims
- [[observation]] — 5 shared claims
- [[hybrid-search]] — 4 shared claims
- [[rendered-page]] — 4 shared claims
- [[supersession]] — 4 shared claims
- [[confidence-scoring]] — 3 shared claims
- [[knowledge-graph]] — 3 shared claims
- [[raw-layer]] — 3 shared claims
- [[transition-ledger]] — 3 shared claims
- [[wiki-layer]] — 3 shared claims
- [[evidence-span]] — 2 shared claims
- [[graph-traversal]] — 2 shared claims
- [[memory-lifecycle]] — 2 shared claims
- [[crystallization]] — 1 shared claim
- [[embeddings]] — 1 shared claim
- [[entity-resolution]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[rag]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[write-guard]] — 1 shared claim
- HousamKak (no page yet)
