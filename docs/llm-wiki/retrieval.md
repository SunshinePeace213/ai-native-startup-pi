# llm-wiki Retrieval

Four streams over the state layer, fused by reciprocal rank and reranked by the belief the state already
holds. The layer's own contract is [state.md](state.md).

## Layout

- `scripts/llm-wiki/retrieve.py` — `search` · `eval` · `check`. It reads the views, the ledgers,
  the rendered pages, and qmd's collections, writes nothing under `llm-wiki/`, and imports only `common`.
- `llm-wiki/retrieval/fusion_config.json` — the one tracked file under `retrieval/`: the RRF k, the per-intent stream
  weights, the rerank weights and their support cap, the status factors, the pools, the raw window's
  `span_slack`, the collections, the eval `floor`, and where each index lives.
  `llm-wiki/schemas/fusion_config.schema.json` validates it; a missing config is an error and the script bakes in no defaults.
- `llm-wiki/evals/retrieval_tests.md` and `llm-wiki/evals/retrieval_cases.jsonl` — the live golden set.
- qmd owns the BM25 and vector indexes.

## Streams

| Stream | Reads | Finds |
| --- | --- | --- |
| `bm25` | qmd's configured collections, one search per collection | exact names, tokens, and error strings, in pages and archives alike |
| `vec` | the same collections, through one typed vector query | the paraphrase the words miss |
| `graph` | the relationship view, walked from the question's entities and the shortest paths between them | what connects to, depends on, or is affected by them |
| `state` | the claim view and the observation ledgers, in memory | claims whose own key, text, conditions, exceptions, or evidence match, inflections folded and query tokens matched by prefix |

Each stream yields one ranked list of claim ids, and a claim keeps its best rank within a stream. The candidate set is
the live statuses, unless `--history` adds the superseded, archived, and rejected claims. The question reaches qmd
flattened: one line, quotes stripped, 400 characters.

- `bm25` — `qmd search` per configured collection; when the all-terms query returns fewer than `min_hits`, one query per
  query token instead, merged by reciprocal rank. A wiki hit maps to the claim the nearest preceding claim-id line of the
  rendered page names, then to the page's claims by query overlap and probability under `per_page_cap`; `index.md`,
  `log.md`, and pages no entity renders are skipped. An archive hit maps to the observations whose evidence span lies in
  the hit's chunk window, then to their claims.
- `vec` — always the typed `vec:` query with `--no-rerank`, never a bare `qmd query`, `vsearch`, or `expand:`. Its hits
  map as bm25's do. A collection qmd refuses keeps its reason in the stream's partial list and leaves the collections
  that answered standing; the stream skips only when every collection failed, and either way never errors.
- `graph` — seeds are the entities whose name or alias occurs in the question, then the intermediate entities of the
  shortest path between each pair of the first `PATH_PAIR_LIMIT` of them — searched to the intent's hops or two,
  whichever is deeper, so a one-hop intent still finds a bridge — then the entities of the top corpus hits; the shared
  `walk` expands them over every edge in both directions to the intent's hops, following at most `max_fanout` edges per
  entity, truncated for that walk alone.
- `state` — an in-memory Okapi BM25 (`BM25_K1` 1.2, `BM25_B` 0.75) over each candidate claim's key, text, conditions,
  exception effects, entity names and aliases, and supporting evidence spans, rebuilt from the views on every run.
  Nothing is persisted. One fold rule set normalizes this stream's documents and its query, and the same folded query
  tokens decide the overlap order wherever a hit or an entity offers more claims than a cap allows; the question reaches
  qmd unfolded. A folded query token of at least three characters matches every vocabulary token it prefixes.

## Fusion and rerank

- RRF over the streams that returned the claim, under the intent's weights and the config's RRF k.
- Belief then multiplies in what the state knows: probability, source authority, recency of the last confirmation at the
  snapshot's `as_of`, and support count.
- The status factor comes from the `default` table, or from the `historical` one under `--history`.
- `final = rrf × belief × status`, ordered by score, ties broken by claim id. The wall clock never enters a score.

## Intents

| Intent | Answers |
| --- | --- |
| `factual` | what the wiki believes about something, and how sure it is |
| `structural` | what connects to, depends on, or is affected by something |
| `historical` | what used to hold, what changed, what superseded what |
| `exploratory` | a survey of a topic and the ideas around it |

The config holds one weight profile per intent, beside its `hops` and its `history` flag. The caller names the intent
with `--intent`, which defaults to `factual`; the script never classifies.

## Output

- The header names the question, the intent, and every stream that ran or was skipped with its reason.
- One claim per lead: id, key, probability at two decimals, status, and its flags — `*[needs_review]*`,
  `*[disputed]*`, `*[stale since YYYY-MM-DD]*`, `*[archived YYYY-MM-DD]*`, `*[superseded YYYY-MM-DD → clm_…]*`,
  `*[rejected]*`.
- Then the claim's text, its `when:` conditions, `pages:`, `streams:` with each rank and the rrf and final scores, its
  evidence lines, and its exceptions.
- The footer lists the distinct pages and, when the graph stream ran, the edges among the result's entities.
- `--json` carries the same content with six-decimal scores and `hidden_by_history`; `--explain` adds the per-stream
  traces. qmd trouble is a skipped stream with a reason, never a non-zero exit.

## Evals

- Two surfaces: contract tests over a fixture vault with a replaying fake qmd, which run in CI and never skip, and the
  tracked live golden set `eval` runs against the pilot vault.
- A case belongs to one family — `exact-token`, `paraphrase`, `structure`, `history`, `current-fact`, `flags` — carries
  exactly one expectation (`expect_claims`, `expect_keys`, `expect_pages`, or `expect_flag`) plus an optional
  `expect_status`, and names in `needs` the streams that must have run.
- `eval` reports per-case reciprocal rank and the fused versus corpus-alone aggregates, and exits non-zero on any skipped
  or malformed case.
- `check` validates the config against its schema, every case target against the vault, and every case query against
  the vault's own text — a query a file under `raw/` or `wiki/` quotes verbatim is a finding; `/skill:llm-wiki-lint`
  runs it. A losing family is recorded with a judgment, never tuned away in the same run.
- The config's `floor` is the live pair `eval` enforces — a fused run under either number exits non-zero. The reference
  pair is the clean-room measurement of the pre-pilot vault, fused MRR 0.5699 and recall 0.91; the live floor sits below
  it because the pilot's own sources sit in the vault.
- A retune is measured in three tables: the baseline recorded before any code or config changed, then the code alone
  under the old config, then code and config.
- A pilot's own sources never quote an eval case's query: a vault that holds them measures the pilot, not the
  retriever. Record such a run beside a clean-room run on the vault the set was written against.

## Phase fence

- No reranking model, no LLM call, and no query router inside the retriever; no `--as-of`.
- No hand-built BM25, vector, or FTS5 index, and no graph export under `retrieval/`.
- No memory tiers or promotion; no PageRank or subgraph matching.
- The rerank reads a claim's current belief, never a past transition.
