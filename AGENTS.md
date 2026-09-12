## Tooling & Runtime

- **Python**: always `uv` (Astral UV) — `uv run`, `uv sync`, `uv add`; never raw `python` or `pip`.
- **JavaScript/TypeScript**: always `bun` — `bun install`, `bun add`, `bun run <script>`, `bun test`; never raw `npm`, `npx`, or `node`.
- **JS/TS checks**: `bun run typecheck` (tsc 7, the only `typescript`) covers `.ts`/`.tsx`; `bun run lint` (ESLint 9) covers `.js`/`.jsx`/`.mjs`/`.cjs` only — typescript-eslint is deliberately absent, see [docs/setup.md](docs/setup.md#typescript).
- **Safe delete**: never `rm -rf`. Move to trash instead: `mv <target> ~/.Trash/`.
- **Fresh clone**: [docs/setup.md](docs/setup.md) — toolchain, Pi packages, env file, dependencies, trust, search index.
- **Done means verified**: `bun run check` (typecheck · lint · format · `bun test` · `uv run pytest`) before reporting a task complete, and quote its output; a failing check is fixed in the code, never in the check.
- **Tests**: contract first, cases derived from it, outcomes not paths — the `agent-self-evals` skill; layout, harness, and commands in [docs/testing.md](docs/testing.md). Code under `.pi/extensions/` and `scripts/` gets tests under `tests/`; a skill or subagent gets evals beside it.

## Knowledge Base

- **Leads, not answers**: the llm-wiki extension rides the top leads in with every prompt; `read` a page before citing it and follow its `sources:` into `llm-wiki/raw/` when the source's own words matter; thin or off-target leads are normal and never stretch into a citation.
- **Go deeper on demand**: a question the leads only graze → the `llm-wiki-librarian` subagent for the full four-stream slice; an answer that must carry citations → `/skill:llm-wiki-query`.
- **Write back**: a source the KB lacks → `/skill:llm-wiki-ingest <url>`; a session that worked something out worth keeping → `/skill:llm-wiki-crystallize`; claims and merges waiting on a human → `/skill:llm-wiki-review`; drift, staleness, or a health check → `/skill:llm-wiki-lint`.
- **Conflicts repair, never linger**: the wiki carries the latest evidence while a doc executes the action in flight — on conflict, fix the stale side in the same session: a doc outdated against a well-supported claim gets edited citing that claim, a wrong claim gets a correcting observation via `/skill:llm-wiki-review`; never blend them, and never let a `disputed` or flagged claim drive a decision unflagged.
- **Single writers**: `scripts/llm-wiki/state.py` is the only writer under `llm-wiki/states/`, `render.py` the only writer of shelf pages and `index.md`; the extension blocks a direct edit and names the verb to run instead.
- **Search surfaces**: the retriever and the `qmd` CLI are the only search over `llm-wiki/`, never ad-hoc `grep`/`find`.
- **Operating the layer**: [standards.md](docs/llm-wiki/standards.md) (layers, schema, secrets, search) · [state.md](docs/llm-wiki/state.md) (the engine) · [retrieval.md](docs/llm-wiki/retrieval.md) (fused search) · [qmd-index.md](docs/llm-wiki/qmd-index.md) (the index).

## Harness

- **Skills**: the llm-wiki verbs are `.agents/skills/llm-wiki-*`; authoring a skill runs through `skill-creator`, a subagent through `meta-agent`.
- **Subagents**: `.pi/agents/` holds `llm-wiki-librarian` (retrieval, read-only) and `source-archiver` (one URL to one raw archive); skills launch them foreground with `subagent({ agent, task, async: false })` and read the result inline. Model choice lives in `.pi/settings.json`, never in an agent file.
- **Extension**: `.pi/extensions/llm-wiki/` is the one project extension — session queue, prompt grounding, the write guard, the unregistered-archive reminder; it never writes under `llm-wiki/` and never calls a model. `bun test tests/pi/llm-wiki` covers its four hooks and the engine bridge.
