# Setup

Bootstrap a fresh clone in order. Installs, trust decisions, model downloads, and
index reconfiguration have side effects; do not run setup incidentally during a
read-only review. Preserve existing configuration when returning to an old checkout.

## 1. Toolchain

```bash
command -v uv bun qmd direnv pi
```

Install whatever the check does not print:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh   # uv
curl -fsSL https://bun.sh/install | bash          # bun
bun install -g @tobilu/qmd                        # qmd, needs bun first
```

`direnv` comes from the OS package manager (`sudo apt install direnv`,
`brew install direnv`). `pi` is the coding agent this repo is built for; install
it per <https://pi.dev>, then the three packages the harness expects, globally:

```bash
pi install npm:pi-subagents                       # the subagent tool (.pi/agents/)
pi install npm:pi-web-access                      # web_search + fetch_content for source-archiver
pi install npm:@juicesharp/rpiv-ask-user-question # ask_user_question for llm-wiki-review
```

`uv` and `bun` install into `~/.local/bin` and `~/.bun/bin`. If a freshly
installed binary is still not on `PATH`, reopen the shell.

## 2. Environment file

```bash
[ -e .env ] || [ -L .env ] || cp .env.sample .env
direnv allow
```

Existing `.env` files and symlinks are preserved. A human should merge newly needed
keys from the sample rather than replacing local values.

`.env.sample` is the committed catalog of repository environment variables.
The `QMD_*` model variables are optional — left unset, qmd resolves its own
defaults (embeddinggemma-300M, Qwen3-Reranker-0.6B): smaller and weaker than the
sample's Qwen3-8B models, but they need no configuration and no large downloads.
`.env` and `.envrc` are gitignored and never read by the agent.

## 3. Dependencies

```bash
bun install
uv sync
```

### TypeScript

The repo runs **TypeScript 7.0.2** — the Go-native compiler — as the only
installed `typescript`. Typing for Bun's built-ins comes from `@types/bun`,
and `tsconfig.json` follows Bun's recommended baseline
([bun.com/docs/typescript](https://bun.com/docs/typescript)).

Two consequences are easy to trip over, so they are written down here:

- **`"types": ["bun"]` is load-bearing.** From TypeScript 6 on, `types`
  defaults to `[]` instead of pulling in every `@types/*` package. Remove that
  line and `Bun`, `bun:test`, and `Request` all stop resolving
  ([bun.com/docs/typescript-6](https://bun.com/docs/typescript-6)).
- **`typescript-eslint` is deliberately not installed.** TypeScript 7 ships
  only `lib/tsc.js`; it dropped the programmatic compiler API (`exports["."]`
  now resolves to a version string) that typescript-eslint loads, and its peer
  range is still `>=4.8.4 <6.1.0`
  ([typescript-eslint#12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518)).
  ESLint 9 has no TS parser of its own, so `.ts`/`.tsx` sit outside the ESLint
  globs and `tsc` is what checks them. Re-adding `typescript-eslint` means
  pinning `typescript` back to 6.x.

Verify both halves:

```bash
bun run typecheck   # tsc 7.0.2 --noEmit
bun run lint        # eslint over .js/.jsx/.mjs/.cjs
bun test            # tests/pi — the extension hooks against a fake Pi
```

## 4. Trust the project

Project skills (`.agents/skills/`), agents (`.pi/agents/`), settings, and extensions
load only after Pi trusts the folder. Review the project before trusting it. Open
`pi` in the repo, run `/trust`, then restart for that decision to take effect.
Non-interactive runs can explicitly approve the project with `-a`:

```bash
pi -a -p "/skill:llm-wiki-query what does the wiki know about pi skills"
```

For existing trusted sessions, `/reload` picks up extension edits. The architecture
extension starts check-only; `/architecture-sync auto` enables automatic tree updates
for one editing session. See [architecture-sync.md](architecture-sync.md) for modes,
folder descriptions, and writer boundaries. Architecture maintenance is TypeScript
and requires Bun/Git, not the old Python helper.

## 5. Search index

```bash
bash scripts/qmd-setup.sh
```

Builds `.qmd/` over `llm-wiki/` and prints `qmd status` when it finishes. Done
means non-zero file counts for both the `wiki` and `raw` collections. The
first run on a machine with no prior qmd index embeds the whole vault and is
slow. Operating the index afterwards is [llm-wiki/qmd-index.md](llm-wiki/qmd-index.md).

## 6. Check the layer

```bash
uv run scripts/llm-wiki/state.py status
uv run scripts/llm-wiki/state.py rebuild --check
uv run scripts/llm-wiki/render.py check
uv run scripts/llm-wiki/lint.py
```

These check state and page integrity, not model quality or complete retrieval coverage.
Additional read-only diagnostics and mutating workflows are in
[KB operations](llm-wiki/operations.md). Component responsibilities are in
[ARCHITECTURE.md](../ARCHITECTURE.md).

## 7. Run the suite

```bash
bun run architecture:check  # read-only; sync explicitly if structure changed
bun run check         # typecheck · lint · format · architecture · bun test · pytest
bun run eval:retrieval  # the retrieval golden set; needs qmd and its models
```

`uv run pytest` drives the engine on a scratch vault per test and never
touches `llm-wiki/`. Layout and conventions: [testing.md](testing.md).
