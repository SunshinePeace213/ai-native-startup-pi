# qmd Index

Operating the local search index behind `llm-wiki/`. What a *searcher* needs —
the collections, scoping, and the leads-not-answers contract — lives in
[standards.md](standards.md); this file is for whoever builds, seeds, or
repairs the index.

## Build and rebuild

- Config and database live in `.qmd/` at the repo root — gitignored,
  project-local, machine-local, and absent from a fresh clone. A missing index
  is the normal state of a new checkout, never an error.
- `bash scripts/qmd-setup.sh` creates both collections (`wiki` over
  `llm-wiki/wiki`, `raw` over `llm-wiki/raw`), attaches their context
  descriptions, and indexes the layer. It is idempotent — re-run it whenever
  the collections look wrong.
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

Chosen once in `.env` (see `.env.sample`) and read only when the setup script
creates the index. qmd records them in `.qmd/index.yml` and reads them from
there afterwards. Changing the embedding model means a full `qmd embed -f`.

A vector's dimension is fixed by the model that produced it, and a mismatch
degrades search with no error — so a copied index keeps its source's models
rather than re-deriving them.

## Consumers

| Surface | Access | Notes |
| --- | --- | --- |
| `qmd` CLI | read + write | `query`, `search`, `vsearch`, `get`, `status` to read; `update` and `embed` are the only write path |
| `retrieve.py` | read | `qmd search` and a typed `vec:` query per stream, `--no-rerank`; skips the stream and says so when the binary or index is missing |
| the llm-wiki extension | read | grounds every prompt through `retrieve.py` with the `bm25` and `state` streams only, so no model loads |

Every search is a CLI call scoped with `-c <collection>`; add `--full-path`
when a hit feeds `read`. `LLM_WIKI_QMD` names the binary when it is not on
`PATH`.
