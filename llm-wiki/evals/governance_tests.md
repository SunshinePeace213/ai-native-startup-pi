# Governance Evals

The five families that prove the layer is safe to write to. The contracts are
[state.md](../../.claude/rules/llm-wiki/state.md) and
[standards.md](../../.claude/rules/llm-wiki/standards.md).

## Families

| Family | Proves |
| --- | --- |
| `leakage` | nothing private or secret reaches a tracked path |
| `audit-completeness` | every write run left one audit row, and every row it appended carries that `run_id` |
| `reversibility` | an undone run leaves the vault the run never touched, and `redo` restores it byte for byte |
| `coordination` | two writers on one checkout, and two branches of one vault, end in identical views |
| `provenance` | every rendered page's evidence still resolves to the archive it was quoted from |

## Leakage

Every tracked file under `llm-wiki/` (`private/` excluded) is scanned against
the secrets, PII, and allow patterns in `governance_patterns.json`; a match
prints `FAIL leakage <path> <pattern>` and never the matched text. The privacy
check proves the shared segment holds no `private` or `secret` source or
observation row and no page citing `llm-wiki/private/`. Assemble a fixture
secret at runtime from fragments — never commit a matchable literal.

Runner: `uv run scripts/llm-wiki/lint.py` → `PASS leakage` and `PASS privacy`.

## Audit completeness

Each write verb of the engine and each `render` that wrote leaves exactly one
row in `states/audit_log.jsonl`, and the rows it appended to the other ledgers
carry the same `run_id`. `audit --check` reports complete, fails on a planted
orphan row, counts pre-Phase-6 rows as legacy, and runs inside `rebuild --check`.
A denied verb leaves one `outcome: denied` row and nothing else.

Runner: `uv run pytest tests/llm-wiki/test_governance.py -k "test_audit_"`,
plus `uv run scripts/llm-wiki/state.py audit --check` on this vault.

## Reversibility

`undo` of the newest live belief run leaves the five views equal to those of a
vault built without the run; `redo` restores them byte for byte with the ledgers
two rows longer. A belief run that is not the newest live one is refused by
name; a merge and an observation-less register are undone from any position; a
run whose rows carry no `run_id` is refused as not retractable. `promote`
produces a shared vault byte-identical to the one an in-shared ingest builds and
retracts the private runs that built the source.

Runner: `uv run pytest tests/llm-wiki/test_governance.py -k "test_undo_ or test_promote_"`.

## Coordination

Two write verbs on one checkout serialize on `states/.lock`, and a held lock
exits 3 naming the holder past `lock_timeout_s`. `apply --inbox` drains
`states/inbox/*.jsonl` in name order, one run per file, leaving an invalid file
with its diagnostics. The two-writer drill applies disjoint proposals in two
copies, concatenates the ledgers in both orders, and gets identical views with
every check clean.

Runner: `uv run pytest tests/llm-wiki/test_governance.py -k "test_lock_ or test_inbox_ or test_fold_order_ or test_two_writer_drill"`.

## Provenance

Every source's archive is on disk and hashes to the value its source row
recorded, and every observation's `evidence_span` is still found verbatim in
that archive — so a page's evidence traces to raw text no one has moved or
edited. A fixture vault with a planted broken span — one word changed inside a
quoted passage of a registered archive — fails `check` naming the observation
id and the archive path, and passes again only once the span is requoted from
the archive, never by paraphrasing the archive to match the span.

Runner: `uv run scripts/llm-wiki/render.py check`.
