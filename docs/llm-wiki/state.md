# llm-wiki State Layer

Sources register, observations carry verbatim evidence, claims carry belief, and every page under a
shelf is rendered from that state. Page schema, raw layer, secrets, and search are [standards.md](standards.md).

## Layout

```text
llm-wiki/
├── raw/                                immutable evidence
├── governance.json                     tracked · roles × verbs · governance-v1
├── schemas/                            JSON Schema 2020-12 · source · observation · claim · entity · relationship · transition · merge · audit · retraction · governance
├── states/                             belief layer
│   ├── sources.jsonl                   ledger · source registrations
│   ├── observations/<source_id>.jsonl  ledger · one file per source
│   ├── transitions.jsonl               ledger · every belief change, decay rows included
│   ├── merges.jsonl                    ledger · human entity merges
│   ├── audit_log.jsonl                 ledger · one row per write run or denial
│   ├── retractions.jsonl               ledger · retract / restore rows
│   ├── inbox/<actor-slug>-<stamp>-<hex6>.jsonl   tracked, transient proposals
│   ├── .lock                           gitignored · flock target, holder written inside
│   ├── claims.jsonl · entities.jsonl · relationships.jsonl · unresolved_conflicts.jsonl   views
│   └── snapshot.json                   view · counts, as_of, arithmetic version
├── retrieval/fusion_config.json        tracked · fusion configuration
├── evals/                              retrieval and governance golden sets · cases and runners
└── wiki/<shelf>/<slug>.md              rendered pages
```

- `scripts/llm-wiki/state.py` — the engine, and the only writer under `states/`: `register` · `validate` · `apply` (`--inbox` drains `states/inbox/` in name order, one run per file) · `decay` · `merge` · `unmerge` · `undo` · `redo` · `rebuild` · `slice` · `status`, plus the read-only `queue` · `review` · `inbox` · `audit`.
- `scripts/llm-wiki/render.py` — the renderer, and the only writer under the shelves and of the index rows: `render` · `check`. The audit ledger is the one file under `states/` the renderer also appends to.
- `scripts/llm-wiki/graph.py` — read-only over the views: `neighbors` · `path` · `impact` · `check`. It writes nothing under `llm-wiki/`.
- `scripts/llm-wiki/retrieve.py` — read-only over the views, the ledgers, the rendered pages, and qmd: `search` · `eval` · `check`. Contract: [retrieval.md](retrieval.md).
- `scripts/llm-wiki/lint.py` — the deterministic page gate: the page schema, citations, wikilinks, images, and the two governance checks. It writes nothing.
- `scripts/llm-wiki/common.py` — layout, constants, ledger I/O, entity resolution, graph loading and walks, transition dates, span and hash helpers. The five scripts import it; none imports another.
- Every write verb runs as a *run*: an actor (`--actor`, env `LLM_WIKI_ACTOR`, default `agent:unattributed`) resolved to a role in `llm-wiki/governance.json`, refused with exit 3 and one denied audit row when the policy says no, serialized on `states/.lock`, stamped as `run_id` on every row it appends, and recorded in `states/audit_log.jsonl`. `merge`, `unmerge`, `undo`, and `redo` also take `--by human:<name>`.
- Every verb takes `--root <repo-root>` (default: the working directory); `--root` and `--actor` are global flags and precede the verb.
- The LLM never writes under `states/` beyond a proposal into `states/inbox/`, and never under a shelf; it writes the extraction file and the log entry, nothing else.

## Ledgers and views

- `sources.jsonl`, `observations/<source_id>.jsonl`, `transitions.jsonl`, `merges.jsonl`, `audit_log.jsonl`, and `retractions.jsonl` are append-only ledgers: append rows, never rewrite one. The sources ledger folds to the latest row per id. Every row a write run appends carries that run's `run_id`.
- Rows fold in `(timestamp, run_id, file order)` — sources by `ingested_at`, observations by `extracted_at`, transitions and merges by `timestamp` — so a union merge in either order yields the same views.
- A retracted run's rows are skipped by every reader — the fold, `queue`, and `register` alike — so an archive whose registration was undone is back in the queue and registers again; a row with no `run_id` is always replayed. `undo` appends the retraction, `redo` lifts it, and nothing is ever deleted or edited. A belief run — `apply`, `decay`, or a register whose source carries observations — is retractable only while it is the newest live one; a merge or an observation-less register goes from any position.
- `claims`, `entities`, `relationships`, `unresolved_conflicts` (`{claim_id, opened_by, opened_at}`), and `snapshot` are views — `rebuild` reproduces each byte-identically from the ledgers, and a view's `as_of` is the newest ledger timestamp, never the wall clock.
- `rebuild --check` is the ledgers↔views integrity check and carries `audit --check`, the rows↔runs one; `check` is the state↔pages check — a re-render byte diff, the volatile dates' ordering (`created ≤ updated ≤ last_rendered`, `updated` no older than the newest transition), and every cited observation id resolving — and `graph.py check` the graph one; lint runs all of them. Parallel sessions merge by union plus `rebuild`.

## Identifiers

| Record | Id | Derivation |
| --- | --- | --- |
| source | `src_<12hex>` | sha256 of the repo-relative archive path |
| observation | `obs_<12hex>` | sha256 of `source_id · claim_key · stance · evidence_span`, plus the `override` when present |
| claim | `clm_<12hex>` | sha256 of `claim_key · creating observation_id` |
| entity | `ent_<slug>` | name lowercased, non-alphanumerics collapsed to `_` |
| relationship | `rel_<12hex>` | sha256 of `subject · canonical predicate · object · qualifiers` |
| transition | `tr_<12hex>` | sha256 of `observation_id · operation · claim_id` |
| decay transition | `tr_<12hex>` | sha256 of `claim_id · decay_update · timestamp` (no observation) |
| merge | `mrg_<12hex>` | sha256 of `from_entity · into_entity` |
| run | `run_<12hex>` | sha256 of `actor · verb · timestamp · the input hashes · the views hash before` |
| retraction | `rtr_<12hex>` | sha256 of `target_run_id · action · timestamp` |

Timestamps are `YYYY-MM-DDTHH:MM:SSZ`.

## Claims and keys

- A `claim_key` is dotted lowercase, 2–5 segments, most general first. Read `status --keys` before extracting and reuse an existing key whenever the observation bears on the same question.
- Conditions decide matching: two sides overlap when their normalized conditions intersect, or when either is empty.
- An exception appends to the matched claim and leaves its numbers alone; a scope split creates a sibling under the same key, both carrying `siblings`; supersession freezes the old claim (`superseded`, `superseded_by`) and nothing moves it afterwards.
- Statuses are `candidate`, `active`, `disputed`, `stale`, `archived`, `superseded`, plus `rejected` from a human override only. `stale` and `archived` are written by `decay` and stay matchable: support revives a `stale` claim to `active` at `P_ACTIVE` (else it stays `stale`) and an `archived` one to `active` at `P_ACTIVE` (else `candidate`); every support resets `last_confirmed_at`. A page counts `candidate`, `active`, `disputed`, and `stale` claims; `archived` counts for nothing.
- `decay_profile` is derived at fold: the newest supporting observation that carries one wins, else `CHANNEL_DECAY_PROFILE` of the creating observation's source channel.
- A mention resolves to the first-seen entity whose normalized name or alias equals the mention's normalized name, else starts a new entity; a mention's own aliases point at its entity for later mentions and never fold it into another. `merges.jsonl` rows replay after that folding, in ledger order, and a chain resolves transitively. Claims' `entity_ids`, relationship endpoints, and pages all go through this resolution.

## Extraction contract

`extract-v2` — one JSON object per line, the observation record without `observation_id` and `extracted_at`; `apply` mints both.

- 3–12 load-bearing observations per deep source, every `evidence_span` verbatim from the archive; whitespace runs are the only normalization.
- Every entity is typed into one of the seven shelves — `concept`, `project`, `person`, `decision`, `system`, `workflow`, `question` — and a relationship's subject and object are named in the record's entities. Reuse an existing entity's name or alias from `status --keys` for the same thing.
- Every `relationships[].predicate` is one of `CANONICAL_PREDICATES`; `extract-v1` rows stay valid as written and map to the canonical set at view build.
- `decay_profile` is optional — one of `architecture_decision`, `project_status`, `bug_report`, `user_preference`, `meeting_note`, `implementation_detail`, `external_fact`, `default` — set when the source makes the claim's horizon plain.
- `privacy` is `public` or `internal`; `extractor` is `{model: <model>, prompt_version: extract-v2}`. A human files the same record with `extractor.model: human:<name>` and `prompt_version: manual`; only such a record may carry `override: {status, reason}`.

## Update table

| Observation | Matching claim | Transition | Effect |
| --- | --- | --- | --- |
| any stance | none under the key | `new_claim` | create; `active` if p ≥ P_ACTIVE else `candidate` |
| `supports` `defines` `new_claim` | overlapping conditions | `support_update` | `+w`; candidate → active at P_ACTIVE; disputed → active at P_ACTIVE closes the conflict; stale → active at P_ACTIVE; archived → active at P_ACTIVE else candidate |
| `modifies` | overlapping | `support_update` | `+w` and `current_text` ← observation text |
| `contradicts` | overlapping, or either side unconditioned | `contradiction_update` | `−w`; p < P_ACTIVE → `disputed` + conflict row; else active with `needs_review` |
| `contradicts` | both conditioned, disjoint | `scope_split` | sibling claim created under the same key; both `siblings` linked; parent untouched |
| `creates_exception` | overlapping | `exception_addition` | exception appended; numbers untouched |
| `supersedes` | overlapping | `supersession` | new claim created (`supersedes` link); old `−w`, `superseded`, `superseded_by`, frozen |
| any, `human:<name>` | any | as above, or `human_override` | authority 1.0; an `override` sets status, numbers untouched; the observation still joins the claim's evidence and a supporting stance resets `last_confirmed_at` |
| none — `decay --as-of` | every non-frozen claim | `decay_update` | `log_odds × 0.5^(elapsed / H)` from `max(last_confirmed_at, last_decayed_at)`; a row only when \|Δp\| ≥ DECAY_MIN_DELTA or the status changes; active → `stale` below P_ACTIVE; active, stale, candidate → `archived` below P_ARCHIVE; `disputed` moves in number only |
| none — `merge <from> <into>` | — | a `merges.jsonl` row, no transition | every mention of `from` resolves to `into`; `from`'s name and aliases join `into`'s aliases; `into.merged_from` lists `from` |

Matching picks, among non-superseded and non-rejected claims under the key, the one whose normalized conditions intersect
the observation's (both empty counts as overlap); on equal overlap and probability the first-seen claim wins. Entity type on disagreement is the majority over observations, first-seen on ties.

Relationship status is stance-aware: `active` while any of its claims is `candidate`, `active`, `stale`, or `archived`; `disputed` when every asserting
observation has stance `contradicts`, or when its claims are all `disputed`; `superseded` when all its claims are `superseded` or `rejected`. A `contradicts`
observation subtracts its weight from the edge's and the entities' log-odds and lands in the edge's `contradicting_observations`. Predicates are
canonical at view build through `PREDICATE_CANON` — an unknown legacy word falls to `related_to` and `graph.py check` notes it.

## Arithmetic

- `ARITHMETIC = "log-odds-v2"`
- `PRIOR_LOG_ODDS = 0.0`
- `S_MAX = 0.98`
- `P_ACTIVE = 0.70`
- `P_ARCHIVE = 0.55`
- `RECENCY_HALF_LIFE_DAYS = 730`
- `RECENCY_FLOOR = 0.3`
- `RECENCY_UNKNOWN = 1.0`
- `DECAY_MIN_DELTA = 0.005`
- `EXTRACTION_QUALITY = 1.0`
- `HUMAN_AUTHORITY = 1.0`
- `MIN_CLAIMS_PER_PAGE = 2`
- `AUTHORITY = {"docs": 0.90, "papers": 0.85, "books": 0.80, "meetings": 0.75, "articles": 0.70, "code-sessions": 0.65, "notes": 0.60, "chats": 0.55, "screenshots": 0.50}`
- `CHANNEL_DECAY_PROFILE = {"docs": "external_fact", "papers": "external_fact", "books": "external_fact", "articles": "external_fact", "meetings": "meeting_note", "code-sessions": "implementation_detail", "notes": "default", "chats": "default", "screenshots": "default"}`
- `DECAY_HALF_LIFE_DAYS = {"architecture_decision": 730, "external_fact": 730, "default": 365, "user_preference": 365, "project_status": 120, "meeting_note": 120, "implementation_detail": 90, "bug_report": 30}`
- `CANONICAL_PREDICATES = ("part_of", "uses", "depends_on", "produces", "extends", "replaces", "contradicts", "authored", "owns", "applies_to", "cites", "related_to")`
- `IMPACT_DIRECTION = {"uses": "reverse", "depends_on": "reverse", "extends": "reverse", "applies_to": "reverse", "cites": "reverse", "part_of": "both", "produces": "forward"}`

```text
recency = 1.0 for a human observation or an unknown created_at,
          else max(RECENCY_FLOOR, 0.5 ^ (max(0, extracted_at.date − created_at) / RECENCY_HALF_LIFE_DAYS))
s = min(confidence × authority × recency × EXTRACTION_QUALITY, S_MAX)
w = ln((1 + s) / (1 − s))
support: log_odds += w · contradiction: log_odds −= w · p = 1 / (1 + e^−log_odds)
decay: log_odds ← log_odds × 0.5 ^ (elapsed_days / DECAY_HALF_LIFE_DAYS[profile])
worked: s = 0.69 → w = 1.70 → p = 0.845 · two such → 0.967 · an equal contradiction → 0.50
recency: age 0 → 1.0 · 730 d → 0.5 · 2190 d → 0.3 · an article at confidence 0.98 lands at p 0.843 undated, p 0.672 (candidate) from a 730-day-old source
decay: L 1.68 on H 730 → p 0.699 (stale) after one half-life, archived once L < logit(P_ARCHIVE) = 0.2007 (≈ 2237 d); the first row lands on day 24 (Δp 0.0051), not every week
```

Authority comes from the source's raw folder; a `human:<name>` observation uses `HUMAN_AUTHORITY` in its place and recency 1.0.
Recency reads `created_at` and `extracted_at` from the ledgers, never the wall clock; `decay` reads `--as-of`, which defaults to now and
never precedes the newest ledger stamp. `P_ACTIVE` decides candidate/active, active/disputed, and active/stale; `P_ARCHIVE` decides archived.
Claims replay the weights and decay factors their transitions recorded and never move retroactively; entity and relationship confidences
are recomputed from the ledgers under the current arithmetic on every rebuild. `impact` walks only the predicates in `IMPACT_DIRECTION`:
`reverse` — a change in the object reaches the subject; `forward` — a change in the subject reaches the object; `both` — either way.

## Rendering contract

`render-v2` — `scripts/llm-wiki/render.py` writes every page under a shelf. Page = entity, shelf = entity type,
slug from `entity_id`; an entity gets a page once it has `MIN_CLAIMS_PER_PAGE` claims that are `candidate`, `active`, `disputed`, or `stale`.

- Frontmatter the renderer owns: `type`, `status`, `created`, `updated`, `sources` (`{resource, title, id}` entries), `generated: {by: process:llm-wiki-render, at}`, `entity_ids`, `claim_ids`, `confidence` (mean probability of the counted claims, 2 dp), `stale_after` (present when the page has an active claim: the earliest date one crosses `P_ACTIVE` unconfirmed), `last_rendered`, `review_required`.
- Body order: `# Title`, `> **In here:** …`, `## Current understanding`, `## Evidence`, `## Contradictions`, `## Superseded`, `## Open questions`, `## Timeline`, `## Related`.
- `## Current understanding` is one line per active, stale, or disputed claim — `current_text` in probability order, each followed by its probability in parentheses, disputed ones flagged `*[disputed]*`, stale ones `*[stale since YYYY-MM-DD]*` with the date of the decay row that changed the status.
- The `> **In here:**` line quotes the lead claim — the highest-probability claim sharing a key token with the entity — cut at a sentence boundary within `SUMMARY_LIMIT`; an entity with no such claim gets a deterministic line from its name, claim count, confidence, and source count. Evidence quotes cut at a clause boundary within `SPAN_LIMIT`.
- `## Contradictions` appears only when a rendered claim is disputed or carries contradicting evidence, `## Superseded` only when one is superseded; `## Open questions` carries the candidates, the archived claims (`archived <date> · last confirmed <date> · p`), and the rejected ones (`rejected <date>`).
- `## Timeline` lists every transition of the page's claims; a decay row appears only when it changed a status.
- `## Related` leads with typed edges in both directions — `→`/`←`, canonical predicate, `[[slug]]` or `Name (no page yet)`, probability at two decimals, `*[disputed]*` or `*[superseded]*` — sorted by probability descending, predicate, slug, capped at `RELATED_EDGE_LIMIT` with a line naming `graph.py neighbors <entity_id>`; the shared-claim lines follow. Wikilinks only to pages that exist.
- The renderer maintains the index rows and removes a page whose entity no longer renders — below threshold or merged away. Every rendered page passes `scripts/llm-wiki/lint.py` unchanged. No LLM pass touches a page: a page that reads badly is fixed at extraction.

## Human review

- `apply` lands observations without a human gate; the review surface is `needs_review` on the claim, `unresolved_conflicts.jsonl`, and `review_required` on the page.
- A human corrects by filing a `human:<name>` observation — optionally with `override` — through `validate` → `apply` → `render`, never by editing state or a page; it weighs `HUMAN_AUTHORITY`.
- `graph.py check` proposes entity merge candidates and nothing merges on similarity.
- Reversal is a verb, never an edit: `undo <run_id>` retracts a run, `redo <run_id>` lifts the retraction, and `unmerge <merge_id>` undoes a merge run. Each takes `--by human:<name> --reason <text>`.
- `decay` runs inside `/skill:llm-wiki-lint` only, as its first step.

`review` presents the queue in order — disputed, then contradicted, then stale, and archived only under `--include-archived`; `duplicate` joins them for two live claims under one key with overlapping conditions from two runs.
Each verdict files one `human:<name>` observation citing a dated review note registered under `raw/notes/` as its source:

| Verdict | Records |
| --- | --- |
| Confirm · Restore | `supports` with the claim's current text plus `override: {status: active, reason}` |
| Correct | `supersedes` with the fixed text |
| Reject | `contradicts` plus `override: {status: rejected, reason}` |
| Obsolete | `supports` plus `override: {status: archived, reason}` |
| Merge | `merge <from> <into> --by human:<name> --reason <text>`, not an observation |

## Phase fence

- No any-position retraction of a belief run and no recompute mode: `undo` is stack-ordered.
- No `team` or `project` scope, no lease board, no OS file modes as a boundary, and no query logging: the audit ledger records writes only.
- No `transitions/` or `graph/` folder; no consolidation, memory tiers, or promotion between tiers.
- No LLM-judged entity resolution, embeddings, or similarity auto-merge.
- No PageRank or subgraph matching; the command set is ingest · query · lint · crystallize · review.
- The extension never writes under `llm-wiki/` and never calls a model; no unattended deep lane; `decay` runs inside lint only.
- No reranking model, no LLM or query router inside the retriever, and no `--as-of`.
- No change to the update table, the arithmetic constants, the decay profiles and half-lives, supersession depth, or `EXTRACTION_QUALITY`; no new claim status and no `agreement_score` multiplier. The rendered page contract changes only through this document, never in the renderer alone.
- No hand-written pages: crystallizing a session or an answer means ingesting a `chats/`, `notes/`, or `code-sessions/` source.
