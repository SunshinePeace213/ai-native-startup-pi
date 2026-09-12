# KB Operations

Read this before querying or changing the knowledge base. Content conventions live in
[standards.md](standards.md); engine and rendering semantics in [state.md](state.md).

## Choose the operation

| Need | Use | Side effects |
| --- | --- | --- |
| Answer from stored knowledge | `llm-wiki-query` | Read-only |
| Retrieve context for planning | `llm-wiki-librarian` | Read-only |
| Archive and file an external source | `llm-wiki-ingest` | KB and index writes |
| Preserve session findings | `llm-wiki-crystallize` | KB and index writes |
| Settle claims or entity merges | `llm-wiki-review` | Human judgments, then writes |
| Age claims and repair the layer | `llm-wiki-lint` | Decay, repairs, log and index writes |

Load the matching skill and follow its procedure. A queue reminder reports work;
it does not authorize processing. New sources or useful findings may be proposed for
write-back, but are filed only when requested or within an authorized workflow.

## Read-only diagnostics

These inspect the current layer without repairing it:

```bash
uv run scripts/llm-wiki/state.py status
uv run scripts/llm-wiki/state.py rebuild --check
uv run scripts/llm-wiki/render.py check
uv run scripts/llm-wiki/graph.py check
uv run scripts/llm-wiki/retrieve.py check
uv run scripts/llm-wiki/lint.py
```

The mutating `llm-wiki-lint` skill is not equivalent to the read-only `lint.py` script.
Report failures and missing search coverage. An absent index does not prove that no
relevant knowledge exists. Do not build or repair the index during a read-only task
without authorization; [qmd-index.md](qmd-index.md) describes maintenance.

## Write boundaries

- Engine operations maintain state ledgers and views; render runs also append audit
  records. Never patch these records directly.
- Rendering owns type-folder pages and `wiki/index.md`.
- Authorized workflows may create proposals in `states/inbox/`. A proposal is neither
  an applied observation nor a human verdict.
- Authorized workflows create raw archives and append `wiki/log.md`. Filed archives
  are immutable; corrections are new evidence.
- Governance changes require a human-reviewed edit. A denied operation stops the
  workflow; never impersonate a human or bypass the owning operation.

After authorized KB writes, perform the owning skill's checks and index refresh.
Report content verification and index refresh separately. The architecture extension
only lists Git path metadata and writes its root document; it does not operate this layer.

## Conflicting evidence

Compare sources, dates, conditions, and repository behavior. Do not automatically
prefer a wiki page, a project document, or a confidence score. Correct supported
in-scope discrepancies through their owning mechanisms; otherwise report both sides
and the decision needed. Human judgments belong in the review workflow, never in
hand-edited generated pages.
