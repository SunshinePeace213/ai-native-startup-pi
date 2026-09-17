# Testing

How this repo verifies what it builds. The standard — contract first, cases
derived from it, outcomes not paths — is the `agent-self-evals` skill; this
page is the architecture that standard runs on.

## One rule, two instruments

| It is | Instrument | Lives in | Runs |
| --- | --- | --- | --- |
| Deterministic code — `.pi/extensions/`, `scripts/` | `bun test` · `uv run pytest` | `tests/` | every `bun run check` |
| Model-driven behaviour — a skill, a subagent, the retriever's ranking | eval tasks with graders | beside the artifact: `evals/` | on change, from a clean session |

An extension is code even though it serves a model: its hooks return values
and send messages, and those are the outcomes. What the model then does with
them is behaviour, and belongs to the skill's or agent's evals.

## Layout

```text
tests/
├── pi/                              bun test — one directory per extension
│   ├── _harness/                    extension-agnostic doubles
│   │   ├── fake-pi.ts               ExtensionAPI: records handlers, captures sendMessage, routes exec;
│   │   │                            anything unstubbed throws
│   │   ├── fake-ctx.ts              ExtensionContext: cwd, hasUI, records ui.setStatus
│   │   ├── scripted-exec.ts         exec by verb, plus the fail-open matrix every hook must survive
│   │   └── scratch-layer.ts         a throwaway project with a minimal llm-wiki/ and engine marker
│   ├── llm-wiki/                    one directory per user-observable feature = one hook
│   │   ├── write-guard/hook.test.ts     tool_call
│   │   ├── grounding/hook.test.ts       input → before_agent_start
│   │   ├── queue/hook.test.ts           session_start
│   │   ├── archive-reminder/hook.test.ts tool_result
│   │   └── engine-bridge/bridge.test.ts the exec seam the hooks share
│   ├── access-guard/                one directory per policy, on a scratch project with
│   │   │                            a live secret, its template, a vendored tree, symlinks
│   │   ├── fixture.ts               the scratch project and the wired extension
│   │   ├── sensitive/hook.test.ts   tool_call — secret-bearing files, every tool
│   │   ├── vendored/hook.test.ts    tool_call — generated trees, writes only
│   │   └── toggle/command.test.ts   /access-guard session toggle
│   └── fast-search/                 the grep and find tools with both seams scripted
│       ├── fixture.ts               scripted probe and runner, the wired extension
│       ├── grep/tool.test.ts        params → ripgrep argv, rows, limits, errors
│       ├── find/tool.test.ts        params → fd argv, rows, limits, errors
│       ├── binaries/probe.test.ts   session_start status, /fast-search, resolution order
│       └── live/binaries.test.ts    the real rg and fd on a scratch repo; skipped when absent
│   └── destructive-guard/           one directory per layer, on a scratch workspace with
│       │                            .git, src/, node_modules/, a home, and an escaping symlink
│       ├── fixture.ts               the workspace, a scriptable select dialog, the wired extension
│       ├── parser/normalize.test.ts N1–N7  quotes · separators · wrappers · sh -c · # why:
│       ├── paths/classify.test.ts   P1–P8  roots · critical files · variables · workspace · symlinks
│       ├── engine/verdict.test.ts   V1–V7  every rule's deny / ask / allow rows · config overrides
│       ├── config/parse.test.ts     C1–C6  .pi/destructive-guard.json · findWorkspace
│       └── hook/tool_call.test.ts   H1–H10 dialog flow · headless · audit · write/edit · /destructive-guard
└── scripts/
    └── llm-wiki/                    pytest — the engine, driven through its CLI on a scratch vault
        ├── conftest.py              Vault: run a verb, read ledgers/views/audit as bytes
        ├── fixtures/raw/notes/      the archive every test registers
        ├── test_ledgers.py          L1–L3, L5, L9   append-only · run stamps · rebuild · fold · governance
        ├── test_reversibility.py    L4, L5b         undo/redo · refusals · readers survive
        ├── test_resolution.py       L6              entity resolution · merge/unmerge
        ├── test_coordination.py     L7              the lock · racing writers · inbox drain
        └── test_provenance.py       L8              render · check · drift

llm-wiki/evals/                      the retrieval golden set and the governance family docs
.agents/skills/<name>/evals/         trigger-eval.json · evals.json — a skill's own evals
.pi/agents/evals/<name>.*.json       a subagent's own evals
```

Every test file opens with its numbered contract; every case is named
`<ID> <scenario>` so a failure reads as the guarantee that broke.

## Commands

| Command | What |
| --- | --- |
| `bun test` | every TS test (`bunfig.toml` roots discovery at `tests/`) |
| `bun test tests/pi/llm-wiki` | KB extension |
| `bun test tests/pi/access-guard` | Access guard: sensitive, vendored, and toggle contracts |
| `bun test tests/pi/fast-search` | grep and find tools, binary resolution, and the live rg/fd contracts |
| `bun test tests/pi/destructive-guard` | Destructive guard: parser, paths, catalog, config, and hook contracts |
| `bun test tests/pi/destructive-guard/engine` | The rule catalog alone — run after adding or changing a rule |
| `bun test tests/pi/architecture-sync` | Architecture generator, CLI, and lifecycle contracts |
| `bun test tests/docs` | Local documentation links and heading targets |
| `bun run architecture:check` | Generated map matches the current projected tree; no repairs |
| `uv run pytest` | every Python test, in parallel, each on its own scratch vault |
| `uv run pytest tests/scripts/llm-wiki -k L4` | one contract line |
| `bun run check` | typecheck · lint · format · architecture drift check · `bun test` · `uv run pytest` |
| `bun run eval:retrieval` | the retrieval golden set against the live vault; exits 1 below the floor |

Tests import the code under test by alias — `@ext/llm-wiki/guard`,
`@harness/fake-pi` — set in `tsconfig.json`; Bun resolves them natively.

## Adding a feature to an extension

1. Write the contract: 3–8 `<ID>: <when> → <observable>` lines at the top of
   `tests/pi/<extension>/<feature>/hook.test.ts`.
2. Table-drive the cases in should / should-not pairs; assert on the hook's
   return value, the message sent, the status text, or the disk — never a
   helper's intermediate value. A helper exported only for a test gets
   un-exported and tested through its caller.
3. Every hook that reaches the engine gets the `FAIL_OPEN` matrix from
   `scripted-exec.ts`.
4. `bun run check`, quote the output.

## Architecture and documentation tests

`tests/pi/architecture-sync/` holds `generate/`, `cli/`, and `session/` contracts.
The generator and CLI use scratch Git repositories, including a linked worktree;
the lifecycle tests run against the shared fake Pi. No model or live KB is invoked.
`fixture.ts` is the shared scratch-repository builder.

`tests/docs/references.test.ts` checks local Markdown links and heading targets in
`AGENTS.md`, `ARCHITECTURE.md`, and `docs/`, without executing examples, fetching URLs,
or crawling KB contents. This checks references, not the truth of prose. Markdown
is excluded from Prettier; a passing format check alone does not verify documentation.

Before validating structural changes, run `bun run architecture:sync`. The check
command only detects drift; the after-run Pi callback cannot fix an earlier gate.
Unknown folder descriptions are reported for curation, not inferred from filenames.

## Current coverage and gaps

- The code suite runs locally through `bun run check`; no CI workflow is currently
  checked into this repository.
- The live retrieval golden set is separate and requires qmd/models. The former
  fixture-based retrieval runner under `tests/harness-layer/` is absent. Older
  runner references in `llm-wiki/evals/retrieval_tests.md` are not runnable coverage.
- A directory convention is not proof of eval coverage. The librarian has a
  standalone eval file; `source-archiver` currently does not. Trigger-eval files
  alone do not establish output quality for a skill or its delegated agent.
- AGENTS.md adherence requires clean-session behavioral trials (read-only tasks,
  unrelated KB leads, queue reminders, and generated-block ownership), not exact
  string assertions against the instructions. Those behavioral trials were not
  executed as part of the deterministic architecture implementation.

## Adding another extension

`tests/pi/<extension>/<feature>/…` beside `llm-wiki/`; the harness is shared.
If the extension needs a double the harness lacks, add it to `_harness/` with
the same rule: unstubbed means throw.

## Gotchas

- Bun skips dot-directories: `bun test .pi/extensions/x` matches nothing.
  Tests live under `tests/`.
- `uv run pytest` runs with `-n auto`; a test must never touch the repo's
  own `llm-wiki/` — the `vault` fixture is the only vault a test sees.
- The retrieval eval needs `qmd` with its models; a local `.qmd/index.yml`
  pointing at another checkout, or naming a collection whose path is gone,
  makes every unattended qmd call print a trust prompt ahead of its JSON.
  `bash .agents/skills/meta-install/scripts/qmd-setup.sh` repoints and drops
  those.
- The two docs under `llm-wiki/evals/` name which pytest file proves each
  governance family, and which cases are still unwritten.
