# Retrieval Evals

The live golden set over this vault. `retrieval_cases.jsonl` holds the cases;
`uv run scripts/llm-wiki/retrieve.py eval` runs them. The contract is
[retrieval.md](../../.claude/rules/llm-wiki/retrieval.md).

## Families

Every case names one family.

| Family | Tests |
| --- | --- |
| `exact-token` | a figure, identifier, or error string reaches the claim whose evidence quotes it |
| `paraphrase` | a question sharing no words with the claim still reaches it |
| `structure` | a claim on an edge from the question's entity is reached by the walk |
| `history` | what used to hold, and what replaced it |
| `current-fact` | what the wiki believes now, and how sure it is |
| `flags` | a flagged claim reaches the answer carrying its flag |

## Fields

`case_id` · `family` · `query` · `intent` · `k` · `needs` · exactly one
expectation · optional `expect_status`.

- `intent` is one of `factual`, `structural`, `historical`, `exploratory`. It sets
  the weights, the hops, and whether frozen claims are candidates: a case whose
  target is `superseded`, `archived`, or `rejected` must declare `historical`.
- `k` follows the intent — 5 for `factual` and `exploratory`, 10 for `structural`
  and `historical`, whose answers sit deeper.
- `needs` names the streams that must have run: the stream the case really tests,
  or `[]` when any stream may find the target.
- The expectation is `expect_claims` (ids), `expect_keys` (claim keys),
  `expect_pages` (a path among a result claim's pages), or `expect_flag`
  (`{"key" | "claim_id", "flag"}` where the flag is `needs_review`, `disputed`,
  `stale`, `archived`, `superseded`, or `rejected`).
- Name every claim that genuinely answers the question, not only the best one —
  a structural question is answered by any claim on a matching edge.
- Query the vault before writing a case: `state.py slice` for a claim,
  `graph.py neighbors` for an entity's edge claims. A target that
  resolves to nothing is a `check` finding.
- Write the query as a question, not as a quotation of the claim's own text.

## Runners

- **Contract tests** — `uv run pytest tests/harness-layer/test_retrieve.py`
  over the fixture vault and the replaying fake qmd in
  `tests/harness-layer/fixtures/llm-wiki-retrieve/`. Runs in CI with no qmd
  installed, and pins the per-case reciprocal ranks.
- **The live set** — `uv run scripts/llm-wiki/retrieve.py eval [--json]` over this
  vault, with qmd on `PATH` and its index current (`qmd update && qmd embed`).
  Warm qmd with one typed `vec:` query first; the first embedding call is slow.
- **A retune** — three tables, in this order: the **baseline**, recorded before any
  code or config changed; the **code alone** under the old config, an
  `--root <scratch> eval` where `<scratch>/llm-wiki/` is a copy of this vault whose
  `fusion_config.json` carries the old block; then **code and config** together.
  Run every one from the repo root so qmd's index resolves. Each table carries both
  aggregate lines and the per-family lines, and a family that loses ground between
  two of them is recorded with its judgment, never tuned away in the same run. A
  baseline recorded afterwards is not a baseline.

Run `uv run scripts/llm-wiki/retrieve.py check` before any of them — it validates
the config against its schema, every case target against the vault, and every case
query against the vault's own text.

## Contamination

A pilot's own sources quote the questions the pilot probed with, and a case whose
query the vault repeats measures the vault, not the retriever. `check` normalizes
every case query — whitespace collapsed, lowercased — and looks for it in every file
under `raw/` and `wiki/`; a verbatim hit is a finding, cleared by rephrasing the
query, never by editing the archive it sits in.

Retargeted for that reason, the build notes and the session archive of the phase-5
pilot having quoted both queries, and the rendered pages having quoted them again
through the observations those sources carry:

| Case | Was | Now |
| --- | --- | --- |
| `str_005_between_raw_and_wiki` | what sits between the raw layer and the wiki layer | which entity connects the raw layer to the wiki layer |
| `hist_004_ownership_who_used_to_own` | who used to own the wiki layer | which actor was once credited with owning the wiki layer |

## Recorded losses — 2026-08-23

The audit-fix build re-measured the set in four tables (baseline → code alone →
code and config → after the engine rebuild). Fused moved 0.5252 / 0.85 → 0.4854 /
0.82; corpus-alone rose 0.5237 / 0.79 → 0.5510 / 0.74. Judgments, not retunes:

- `structure` 0.8333 → 0.6000 and `paraphrase` 0.4571 → 0.4214: the `by_overlap`
  tiebreak now folds the query as it folds the documents, and three near-ties
  flipped (`str_002` lost rank 1 to a claim scoring 0.0677 against its 0.0670).
  The comparison is now correct; the ranks were held by an inconsistency.
- `flag_001` rank 7 → unranked: the superseded ownership claim is the case #128
  already names — two of four streams reach it — and the rebuild that stopped
  `contradicts` observations from raising edge confidence moved three edge
  probabilities and the graph stream's order with them. Fix is recall in the
  streams (#128), not weight.
- Two cases retargeted for contamination (above) answer at lower ranks than the
  quoted phrasings did; that gap was the leak, not retrieval.

The floor is the post-rebuild live pair, 0.485376 / 0.823529.

## No skips

`eval` exits 1 on any skipped or malformed case, and on a fused run under the
config's `floor`. A case whose `needs` stream did not run is a failure, never a
silent pass: fix the environment or the case, never
the `needs` list. Two expectations, none, an unknown family, an unknown intent, or
a target that resolves to nothing are all malformed.

Record a losing family or a poor rank as a finding with its judgment. Never retune
a weight or retarget a case to move a rank in the same run. A case whose expectation
stops holding — a flag a review settled, a claim a verdict rejected — is retargeted
with its reason recorded; that is forced, not a rank move.
