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
│       ├── model-selection/ — Model and effort selection policy
│       └── skill-creator/ — Skill authoring and evaluation
├── .pi/ — Project-local Pi resources
│   ├── agents/ — Delegated agent definitions
│   │   └── evals/ — Subagent behavior evals
│   ├── extensions/ — Deterministic Pi lifecycle integrations
│   │   ├── architecture-sync/ — Described repository tree generation and synchronization
│   │   └── llm-wiki/ — KB grounding, reminders, and write protection
│   └── settings.json — Persistent agent model overrides
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
│   │   ├── architecture-sync/ — Tree, CLI, and lifecycle contract tests
│   │   └── llm-wiki/ — KB extension hook and bridge tests
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
- **Architecture extension:** `tree.ts` is the shared generator and bounded writer;
  `cli.ts` exposes it through Bun; `index.ts` supplies commands and optional
  `agent_settled` synchronization. It owns only the marked block above and never
  touches KB content. Descriptions and the rest of this document are maintained
  in authorized edits.
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
| Bootstrap or reconfigure a checkout | [Setup](docs/setup.md) |
| Verify a change or understand coverage | [Testing](docs/testing.md) |
| Operate or troubleshoot this generated map | [Architecture sync](docs/architecture-sync.md) |
| Choose a KB operation and understand its side effects | [KB operations](docs/llm-wiki/operations.md) |
| Archive, citation, privacy, and page conventions | [KB standards](docs/llm-wiki/standards.md) |
| Engine and rendering contracts | [State](docs/llm-wiki/state.md) |
| Search, ranking, and live eval contracts | [Retrieval](docs/llm-wiki/retrieval.md) |
| Index lifecycle and model changes | [qmd index](docs/llm-wiki/qmd-index.md) |

Update these explanations when responsibilities change. A synchronized tree does
not automatically validate architectural prose or refresh a model's context.
