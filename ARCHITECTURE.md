# Architecture

A Pi development harness and an evidence-backed knowledge base. Read this before
navigating unfamiliar areas or changing component boundaries; operating instructions
live in [AGENTS.md](AGENTS.md).

## Project structure

The marked block is generated from existing tracked and non-ignored untracked paths.
Folder descriptions come from
[tree.config.json](.pi/extensions/architecture-sync/tree.config.json), not a model.
Large KB areas are collapsed; local caches, runtime artifacts, private content, and
symlinks are omitted. This is a project map, not a complete filesystem inventory or
proof that the implementation is healthy.

<!-- architecture-tree:start -->
```text
ai-native-startup/
├── .agents/ — Reusable agent workflows
│   └── skills/ — Task-specific skills and their evals
│       ├── agent-self-evals/ — Contract-first test and eval design
│       ├── commit-message/ — Commit message formatting and validation
│       ├── grilling/ — Structured requirement interviews
│       ├── llm-wiki-crystallize/ — Preserve session findings in the KB
│       ├── llm-wiki-ingest/ — Archive and file external sources
│       ├── llm-wiki-lint/ — KB maintenance and health checks
│       ├── llm-wiki-query/ — Evidence-backed KB answers
│       ├── llm-wiki-review/ — Human review of flagged knowledge
│       ├── meta-agent/ — Subagent authoring and validation
│       ├── meta-install/ — Checkout bootstrap and setup health checks
│       ├── model-selection/ — Model and effort selection policy
│       └── skill-creator/ — Skill authoring and evaluation
├── .pi/ — Project-local Pi resources
│   ├── agents/ — Delegated agent definitions
│   │   └── evals/ — Subagent behavior evals
│   ├── extensions/ — Deterministic Pi lifecycle integrations
│   │   ├── access-guard/ — Sensitive-file and vendored-path access guard on every tool call
│   │   ├── architecture-sync/ — Described repository tree generation and synchronization
│   │   ├── destructive-guard/ — Deny/ask gate on destructive bash, write, and edit calls
│   │   ├── fast-search/ — ripgrep and fd as the grep and find tools, spawned directly
│   │   ├── llm-wiki/ — KB grounding, reminders, and write protection
│   │   └── ui-customization-soriza/ — Pi chrome: S/Z header, theme picker, and the emoji statusline
│   ├── themes/ — Pi colour themes (disler's set plus deep-purple)
│   └── settings.json — Default tool set and persistent agent model overrides
├── docs/ — Task-specific operating references
│   └── llm-wiki/ — KB standards, contracts, and operations
├── llm-wiki/ — Evidence-backed knowledge base
│   ├── evals/ — Retrieval cases and governance coverage notes
│   ├── raw/ — Immutable source archives (collapsed)
│   ├── retrieval/ — Retrieval fusion configuration
│   ├── schemas/ — State and governance JSON schemas (collapsed)
│   ├── states/ — Engine-maintained ledgers, views, and proposal inbox (collapsed)
│   └── wiki/ — Rendered knowledge pages, index, and operation log (collapsed)
├── scripts/ — Repository command-line utilities
│   └── llm-wiki/ — State engine, renderer, graph, retrieval, and validation
├── tests/ — Deterministic verification on scratch fixtures
│   ├── docs/ — Repository documentation reference checks
│   ├── pi/ — Pi extension contracts
│   │   ├── _harness/ — Shared extension test doubles
│   │   ├── access-guard/ — Sensitive, vendored, and toggle contract tests
│   │   ├── architecture-sync/ — Tree, CLI, and lifecycle contract tests
│   │   ├── destructive-guard/ — Parser, path, catalog, config, and hook contract tests
│   │   ├── fast-search/ — grep, find, binary resolution, and live rg/fd contracts
│   │   ├── llm-wiki/ — KB extension hook and bridge tests
│   │   └── ui-customization-soriza/ — Header, picker, terminal sync, statusline, and theme file contracts
│   └── scripts/ — Python CLI contract tests
│       └── llm-wiki/ — State engine tests using isolated vaults
├── AGENTS.md — Essential constraints and reference routing
├── ARCHITECTURE.md — Repository map and component boundaries
├── package.json — Bun dependencies and verification commands
└── pyproject.toml — Python dependencies and test configuration
```
<!-- architecture-tree:end -->

## Components and responsibilities

- **Skills** own task triggers, workflows, references, and behavioral evals.
  **Agents** own delegated task contracts; persistent model overrides live in
  `.pi/settings.json`. Model-selection policy stays in its skill, not this map.
- **KB extension:** `index.ts` wires lifecycle hooks, `engine.ts` bridges to Python
  CLIs, `guard.ts` checks protected write targets, and `format.ts` formats messages.
  It never writes under `llm-wiki/` and never calls a model.
- **Access-guard extension:** `index.ts` wires `tool_call` and the `/access-guard`
  command; `guard.ts` is the decision; `denial.ts` writes the reason the model sees;
  `catalog/` holds the sensitive-file and vendored-path families as data; `match/`
  compiles them (`path.ts` for tool paths in lexical and real form, `command.ts` for
  bash text, `glob.ts` for grep/find patterns, `shell.ts` for the paths a bash
  command rewrites). Sensitive files are denied to every tool and cannot be toggled;
  vendored trees are denied to writes only, with a user-typed session toggle. It is
  a tripwire on tool inputs, not a sandbox, and fails open on its own errors.
- **Destructive-guard extension:** `index.ts` wires `tool_call` (bash, write, edit),
  `before_agent_start`, `session_start`, and the `/destructive-guard` command;
  `engine.ts` is the pure verdict; `normalize.ts` reads shell text into segments
  (wrappers peeled, `sh -c` and `eval` bodies parsed); `paths.ts` classifies a target
  by recoverability and blast radius; `rules/` holds the catalog as data, one file per
  family, with `rm`/`find`/`mv`/`chmod` refined by target; `prompt.ts` writes the
  approval card and the block reasons; `session.ts`, `audit.ts`, `config.ts`,
  `inspect.ts` are the session memory, the JSONL trail, `.pi/destructive-guard.json`,
  and the git recovery hint. Deny never runs from an agent; ask is a dialog, or a
  block with nobody present. Policy in [docs/destructive-guard.md](docs/destructive-guard.md).
- **Fast-search extension:** `index.ts` registers `grep` and `find` over Pi's built-in
  tools of the same name and owns the `session_start` probe and `/fast-search`;
  `binaries.ts` resolves ripgrep and fd (Pi's managed `~/.pi/agent/bin`, then PATH,
  `fdfind` included); `run.ts` is the one spawn, streamed and stopped at the result
  limit; `grep/` and `find/` each hold the schema, the pure argv planner, and the tool;
  `output.ts` applies the shared byte cap and notices. The tools expose the binaries'
  real options under the names the harness already uses, keep the built-in result
  shapes so the built-in renderers apply, and fail with an install hint when a binary
  is missing rather than searching nothing. `.pi/settings.json` enables `grep`, `find`,
  and `ls` for this project.
- **Architecture extension:** `tree.ts` is the shared generator and bounded writer;
  `cli.ts` exposes it through Bun; `index.ts` supplies commands and optional
  `agent_settled` synchronization. It owns only the marked block above and never
  touches KB content. Descriptions and the rest of this document are maintained
  in authorized edits.
- **UI extension (`ui-customization-soriza`):** `index.ts` wires Pi's lifecycle to
  three features sharing one TUI handle — `header/` (the S/Z monogram and repo
  line), `theme/` (picker, cycling, the 🎨 status with its swatch, terminal colour
  sync), and `statusline/` (the emoji footer: `render.ts` is pure, `quota.ts` and
  `quota-fetch.ts` read the Anthropic and OpenAI subscription usage with tokens Pi
  resolves in memory, `quota-store.ts` caches them with backoff, `git.ts` and
  `stats.ts` supply the tree and session figures, `format.ts` fits prioritised
  segments into the width and aligns the context/provider rows as one grid).
  `tokens/` owns the session's context length and the badge the footer pins to
  its bottom-right corner, kept apart from layout so counting can change alone. It
  paints only with theme tokens, never blocks render on I/O, and persists nothing.
- **State engine:** Python CLIs apply observations and maintain state. Rendering
  derives pages and index rows, and appends render audit records. Graph and retrieval
  commands inspect the layer. qmd maintains the separate machine-local search index.
- **Verification:** Bun tests cover deterministic extensions and documentation;
  pytest drives the engine on scratch vaults. Behavioral and live retrieval evals
  are separate from the code suite.

## Knowledge flow

```text
source archives → extracted observations → state ledgers/views → rendered pages
                                            ↓                       ↓
                                      graph/retrieval ← qmd indexes
                                            ↓
                                    cited answers and prompt leads
```

Skills coordinate authorized writes. Read-only queries do not repair state or
refresh indexes. Filed raw archives are immutable; corrections arrive as new
evidence. Current governance grants shared-segment access only. Private-segment
machinery exists in the implementation but is not enabled for private writes by
the current policy; its existence is not permission to use it or proof of readiness.

## Reference map

| Need | Reference |
| --- | --- |
| Bootstrap or reconfigure a checkout | [meta-install skill](.agents/skills/meta-install/SKILL.md) |
| Verify a change or understand coverage | [Testing](docs/testing.md) |
| Operate or troubleshoot this generated map | [Architecture sync](docs/architecture-sync.md) |
| Choose a KB operation and understand its side effects | [KB operations](docs/llm-wiki/operations.md) |
| Archive, citation, privacy, and page conventions | [KB standards](docs/llm-wiki/standards.md) |
| Engine and rendering contracts | [State](docs/llm-wiki/state.md) |
| Search, ranking, and live eval contracts | [Retrieval](docs/llm-wiki/retrieval.md) |
| Index lifecycle and model changes | [qmd index](docs/llm-wiki/qmd-index.md) |

Update these explanations when responsibilities change. A synchronized tree does
not automatically validate architectural prose or refresh a model's context.
