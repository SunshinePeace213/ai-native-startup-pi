# qmd Index

Operating the local search index behind `llm-wiki/`. What a *searcher* needs —
the collections, scoping, and the leads-not-answers contract — lives in
[standards.md](standards.md); this file is for whoever builds, seeds, or
repairs the index.

## Build and rebuild

- Config and database live in `.qmd/` at the repo root — gitignored,
  project-local, machine-local, and absent from a fresh clone. A missing index
  is the normal state of a new checkout, never an error.
- `bash .agents/skills/meta-install/scripts/qmd-setup.sh` creates both
  collections (`wiki` over `llm-wiki/wiki`, `raw` over `llm-wiki/raw`), attaches
  their context descriptions, downloads any missing model, and indexes the
  layer. It is idempotent — re-run it whenever the collections look wrong, and
  `--check` runs its health check alone. It ships with the
  [meta-install skill](../../.agents/skills/meta-install/SKILL.md), which owns
  first-time setup.
- qmd finds the index by walking up from the working directory, so it is
  scoped by directory, not by git branch: checking out another branch in the
  same directory keeps the same index.

## Freshness

- Anything that writes under `llm-wiki/` ends with `qmd update && qmd embed`.
  Both are content-hash incremental, so run them unconditionally rather than
  guessing what changed.
- After a branch merges, re-run the pair in the main checkout — a merge
  updates the markdown, never the index.
- Embeddings are keyed by content hash, so they survive re-indexing and
  collection edits. Only new or changed text is ever re-embedded.

## Models

A human configures model variables using `.env.sample`; the agent does not read
`.env` or `.envrc`. The setup script receives exported `QMD_*_MODEL` values through
its environment. Explicit values override recorded models on reruns as well as
initial creation. Without explicit overrides, an existing project index retains
its models; first-time seeding can inherit models from the global index.

qmd uses the recorded models in `.qmd/index.yml`. Setup may download models,
replace collections, and re-embed changed content. An embedding-dimension mismatch
triggers a full `qmd embed -f`; this can be expensive. Reconfiguration is an explicit
maintenance operation, not a harmless read-only troubleshooting command.

If the binary/index is unavailable during a query, keep the retriever's available
state/graph evidence and report skipped coverage. Request setup when needed; do not
repair or download models as an incidental part of a read-only task.

## Consumers

| Surface | Access | Notes |
| --- | --- | --- |
| `qmd` CLI | read + write | `query`, `search`, `vsearch`, `get`, `status` to read; `update` and `embed` are the only write path |
| `retrieve.py` | read | `qmd search` and a typed `vec:` query per stream, `--no-rerank`; skips the stream and says so when the binary or index is missing |
| the llm-wiki extension | read | grounds every prompt through `retrieve.py` with the `bm25` and `state` streams only, so no model loads |

Every search is a CLI call scoped with `-c <collection>`; add `--full-path`
when a hit feeds `read`. `LLM_WIKI_QMD` names the binary when it is not on
`PATH`.
