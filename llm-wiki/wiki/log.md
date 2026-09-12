# Wiki Log

<!-- markdownlint-disable MD024 -->

Append-only history of writes to the wiki. Only `ingest`, `crystallize`,
`review`, `lint`, `undo`, and `promote` write here; `query` is read-only and
never adds an entry.

Ingest entries, the payload line after the heading:

```text
## [YYYY-MM-DD] ingest | <title> | <raw-path>

lane: <deep|light> · observations: <n> · claims: +<new> ~<updated> · rendered: <pages or none>
```

Lint entries:

```text
## [YYYY-MM-DD] lint | <summary>

missing-pages: <comma-list or none> · mechanical-fixes: <N> · decay: <stale>/<archived>
```

Crystallize entries, the ingest payload line:

```text
## [YYYY-MM-DD] crystallize | <title> | <raw-path>

lane: <deep|light> · observations: <n> · claims: +<new> ~<updated> · rendered: <pages or none>
```

Review entries:

```text
## [YYYY-MM-DD] review | <N> presented | <summary>

confirmed: <N> · corrected: <N> · rejected: <N> · skipped: <N>
```

Undo entries:

```text
## [YYYY-MM-DD] undo | <run_id> | <verb reversed> | <reason>

rows: <n> · views: <changed|unchanged> · rendered: <pages or none>
```

Promote entries:

```text
## [YYYY-MM-DD] promote | <title> | <shared-raw-path>

lane: deep · observations: <n> · claims: +<new> ~<updated> · rendered: <pages or none>
```

## [2026-08-20] ingest | LLM Wiki | llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/systems/index-md.md, llm-wiki/wiki/workflows/ingest.md, llm-wiki/wiki/workflows/lint.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/systems/log-md.md, llm-wiki/wiki/workflows/query.md, llm-wiki/wiki/concepts/rag.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-20] ingest | LLM Wiki v2 | llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md

lane: deep · observations: 12 · claims: +9 ~3 · rendered: llm-wiki/wiki/concepts/confidence-scoring.md, llm-wiki/wiki/concepts/hybrid-search.md, llm-wiki/wiki/systems/index-md.md, llm-wiki/wiki/workflows/ingest.md, llm-wiki/wiki/concepts/knowledge-graph.md, llm-wiki/wiki/workflows/lint.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/memory-lifecycle.md, llm-wiki/wiki/concepts/rag.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-20] ingest | LLM Wiki v3: A State-Space Knowledge System | llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md

lane: deep · observations: 12 · claims: +7 ~6 · rendered: llm-wiki/wiki/systems/belief-updater.md, llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/concepts/confidence-scoring.md, llm-wiki/wiki/concepts/evidence-span.md, llm-wiki/wiki/concepts/hybrid-search.md, llm-wiki/wiki/concepts/knowledge-graph.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/memory-lifecycle.md, llm-wiki/wiki/concepts/observation.md, llm-wiki/wiki/workflows/query.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/rendered-page.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/state-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/systems/transition-ledger.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-20] ingest | LLM Wiki V3: Segmentation | llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md

lane: deep · observations: 12 · claims: +8 ~4 · rendered: llm-wiki/wiki/concepts/cache-rewarming.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/explicit-triggers.md, llm-wiki/wiki/systems/index-md.md, llm-wiki/wiki/workflows/ingest.md, llm-wiki/wiki/workflows/librarian.md, llm-wiki/wiki/workflows/lint.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/systems/log-md.md, llm-wiki/wiki/workflows/query.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/segmentation.md, llm-wiki/wiki/concepts/statelessness.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-21] ingest | graphwiki: an LLM Wiki pattern for graph databases | llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md

lane: deep · observations: 12 · claims: +4 ~6 · rendered: llm-wiki/wiki/people/andrej-karpathy.md, llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/concepts/claim-status.md, llm-wiki/wiki/concepts/embeddings.md, llm-wiki/wiki/concepts/entity-extraction.md, llm-wiki/wiki/concepts/entity-resolution.md, llm-wiki/wiki/concepts/graph-traversal.md, llm-wiki/wiki/projects/graphwiki.md, llm-wiki/wiki/concepts/hybrid-search.md, llm-wiki/wiki/workflows/ingest.md, llm-wiki/wiki/concepts/knowledge-graph.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/memory-lifecycle.md, llm-wiki/wiki/workflows/query.md, llm-wiki/wiki/concepts/rag.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/rendered-page.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/segmentation.md, llm-wiki/wiki/concepts/state-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/systems/transition-ledger.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-21] lint | log-odds-v2 pilot — dated sources, decay at now, graph check, typed edges on every page

missing-pages: none · mechanical-fixes: 35 · decay: 0/0

## [2026-08-21] lint | hybrid-retrieval pilot — retrieval check over 20 eval cases, decay unchanged, one merge candidate for review

missing-pages: none · mechanical-fixes: 0 · decay: 0/0

## [2026-08-22] ingest | Phase 5 build findings — what the retune and the loops measured | llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md

lane: deep · observations: 8 · claims: +6 ~2 · rendered: llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/concepts/confidence-scoring.md, llm-wiki/wiki/concepts/embeddings.md, llm-wiki/wiki/concepts/graph-traversal.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/hybrid-search.md, llm-wiki/wiki/workflows/ingest.md, llm-wiki/wiki/concepts/knowledge-graph.md, llm-wiki/wiki/workflows/lint.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/rag.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/state-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-22] review | 2 presented | schema.role confirmed with a human support and an override to active; claim status merged into claim

confirmed: 1 · corrected: 1 · rejected: 0 · skipped: 0

## [2026-08-22] crystallize | llm-wiki Phase 5 automation build — what the session asked, found, and decided | llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md

lane: deep · observations: 8 · claims: +5 ~2 · rendered: llm-wiki/wiki/systems/belief-updater.md, llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/concepts/golden-set.md, llm-wiki/wiki/concepts/graph-traversal.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/hybrid-search.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/state-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-22] promote | Phase 6 governance build notes — the fold key, the guards, and what the loops measured | llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/belief-updater.md, llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/concepts/entity-resolution.md, llm-wiki/wiki/concepts/golden-set.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/hybrid-search.md, llm-wiki/wiki/concepts/knowledge-graph.md, llm-wiki/wiki/concepts/segmentation.md, llm-wiki/wiki/concepts/state-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/systems/transition-ledger.md

## [2026-08-22] ingest | Phase 6 governance build notes — the guard defects and the sandbox refusal | llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md

lane: deep · observations: 3 · claims: +3 ~0 · rendered: llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/segmentation.md, llm-wiki/wiki/systems/write-guard.md

## [2026-08-22] ingest | Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach | llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/belief-updater.md, llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/concepts/entity-resolution.md, llm-wiki/wiki/workflows/ingest.md, llm-wiki/wiki/concepts/observation.md, llm-wiki/wiki/concepts/rendered-page.md, llm-wiki/wiki/concepts/state-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/systems/transition-ledger.md

## [2026-08-22] undo | run_ce55be273425 | apply | pilot: exercise the reversal path on the newest live belief run

rows: 10 · views: changed · rendered: llm-wiki/wiki/systems/belief-updater.md, llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/concepts/entity-resolution.md, llm-wiki/wiki/workflows/ingest.md, llm-wiki/wiki/concepts/observation.md, llm-wiki/wiki/concepts/rendered-page.md, llm-wiki/wiki/concepts/state-layer.md, llm-wiki/wiki/concepts/supersession.md, llm-wiki/wiki/systems/transition-ledger.md

## [2026-08-23] crystallize | Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer | llm-wiki/raw/chats/llm-wiki-engine-layout-refactor.md

lane: deep · observations: 6 · claims: +5 ~1 · rendered: llm-wiki/wiki/systems/belief-updater.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/rendered-page.md, llm-wiki/wiki/concepts/wiki-layer.md

## [2026-08-23] crystallize | Where a crystallize belongs, and why pushes touching a workflow file were refused | llm-wiki/raw/chats/crystallize-placement-and-push-auth.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/concepts/claim.md, llm-wiki/wiki/workflows/crystallization.md, llm-wiki/wiki/workflows/git-workflow.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/workflows/librarian.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/observation.md, llm-wiki/wiki/workflows/query.md, llm-wiki/wiki/concepts/raw-layer.md, llm-wiki/wiki/concepts/rendered-page.md, llm-wiki/wiki/concepts/state-layer.md

## [2026-08-23] ingest | The Founder's Playbook: Building an AI-Native Startup | llm-wiki/raw/books/founders-playbook/index.md

lane: deep · observations: 12 · claims: +11 ~0 · rendered: llm-wiki/wiki/concepts/agentic-coding.md, llm-wiki/wiki/concepts/ai-native-startup.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/concepts/founder.md, llm-wiki/wiki/workflows/idea-stage.md, llm-wiki/wiki/workflows/launch-stage.md, llm-wiki/wiki/workflows/mvp-stage.md, llm-wiki/wiki/workflows/scale-stage.md, llm-wiki/wiki/concepts/schema-layer.md

## [2026-08-23] ingest | Prompting Claude Fable 5 | llm-wiki/raw/docs/anthropic/prompting-claude-fable-5.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/systems/claude-fable-5.md, llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/context-window.md

## [2026-08-23] ingest | Prompting Claude Opus 5 | llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/systems/claude-opus-5.md, llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/adaptive-thinking.md

## [2026-08-23] ingest | Prompting Claude Sonnet 5 | llm-wiki/raw/docs/anthropic/prompting-claude-sonnet-5.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/systems/claude-sonnet-5.md, llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/concepts/adaptive-thinking.md

## [2026-08-23] ingest | Choosing a Claude model and effort level in Claude Code | llm-wiki/raw/articles/anthropic/claude-model-and-effort-level-in-claude-code.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/decisions/model-selection.md

## [2026-08-23] ingest | The new rules of context engineering for Claude 5 generation models | llm-wiki/raw/articles/anthropic/the-new-rules-of-context-engineering-for-claude-5-generation-models.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/concepts/context-engineering.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/schema-layer.md

## [2026-08-23] ingest | Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents | llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/systems/rules.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/context-window.md

## [2026-08-23] ingest | A harness for every task: dynamic workflows in Claude Code | llm-wiki/raw/articles/anthropic/a-harness-for-every-task-dynamic-workflows-in-claude-code.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/workflows/dynamic-workflows.md, llm-wiki/wiki/concepts/adversarial-verification.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/context-window.md

## [2026-08-23] ingest | Building verification loops in Claude Code with skills | llm-wiki/raw/articles/anthropic/building-verification-loops-in-claude-code-with-skills.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/concepts/agentic-coding.md

## [2026-08-23] ingest | Loop engineering: Getting started with loops | llm-wiki/raw/articles/anthropic/getting-started-with-loops.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/workflows/dynamic-workflows.md

## [2026-08-23] ingest | Using Claude Code: The unreasonable effectiveness of HTML | llm-wiki/raw/articles/anthropic/using-claude-code-the-unreasonable-effectiveness-of-html.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/concepts/html-output-format.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/workflows/verification-loop.md

## [2026-08-23] ingest | How Anthropic runs large-scale code migrations with Claude Code | llm-wiki/raw/articles/anthropic/ai-code-migration.md

lane: deep · observations: 10 · claims: +10 ~0 · rendered: llm-wiki/wiki/workflows/code-migration.md, llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/concepts/adversarial-verification.md, llm-wiki/wiki/decisions/model-selection.md

## [2026-08-23] ingest | The AI-Native SDLC playbook | llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/workflows/ai-native-sdlc.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/workflows/agent-loops.md

## [2026-08-23] ingest | A field guide to Claude Fable 5: Finding your unknowns | llm-wiki/raw/articles/anthropic/a-field-guide-to-claude-fable-finding-your-unknowns.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/concepts/unknowns.md, llm-wiki/wiki/systems/claude-fable-5.md, llm-wiki/wiki/concepts/agentic-coding.md, llm-wiki/wiki/concepts/context-engineering.md, llm-wiki/wiki/workflows/code-review.md

## [2026-08-23] undo | run_e05a70d1de13 | apply | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 60 · views: changed · rendered: none

## [2026-08-23] undo | run_6ef98ad8e831 | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_3978f66a71b1 | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_6af3a7fcb9f1 | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_4a24f8c529c6 | apply | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 70 · views: changed · rendered: none

## [2026-08-23] undo | run_e204c36dc868 | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_1d4affd90651 | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_cc84484edd2c | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_102f887a9c9e | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_311087546c25 | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] undo | run_3559acf0a5b4 | apply | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 72 · views: changed · rendered: none

## [2026-08-23] undo | run_7229cf277de1 | register | assets relocated into raw/assets per the standard; archives re-registered at their new hashes

rows: 1 · views: changed · rendered: none

## [2026-08-23] ingest | The new rules of context engineering for Claude 5 generation models | llm-wiki/raw/articles/anthropic/the-new-rules-of-context-engineering-for-claude-5-generation-models.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/concepts/context-engineering.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/schema-layer.md

## [2026-08-23] ingest | Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents | llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/systems/rules.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/context-window.md

## [2026-08-23] ingest | A harness for every task: dynamic workflows in Claude Code | llm-wiki/raw/articles/anthropic/a-harness-for-every-task-dynamic-workflows-in-claude-code.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/workflows/dynamic-workflows.md, llm-wiki/wiki/concepts/adversarial-verification.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/context-window.md

## [2026-08-23] ingest | Building verification loops in Claude Code with skills | llm-wiki/raw/articles/anthropic/building-verification-loops-in-claude-code-with-skills.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/concepts/agentic-coding.md

## [2026-08-23] ingest | Loop engineering: Getting started with loops | llm-wiki/raw/articles/anthropic/getting-started-with-loops.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/workflows/dynamic-workflows.md

## [2026-08-23] ingest | Using Claude Code: The unreasonable effectiveness of HTML | llm-wiki/raw/articles/anthropic/using-claude-code-the-unreasonable-effectiveness-of-html.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/concepts/html-output-format.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/workflows/verification-loop.md

## [2026-08-23] ingest | How Anthropic runs large-scale code migrations with Claude Code | llm-wiki/raw/articles/anthropic/ai-code-migration.md

lane: deep · observations: 10 · claims: +10 ~0 · rendered: llm-wiki/wiki/workflows/code-migration.md, llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/concepts/adversarial-verification.md, llm-wiki/wiki/decisions/model-selection.md

## [2026-08-23] ingest | The AI-Native SDLC playbook | llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/workflows/ai-native-sdlc.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/workflows/verification-loop.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/workflows/agent-loops.md

## [2026-08-23] ingest | A field guide to Claude Fable 5: Finding your unknowns | llm-wiki/raw/articles/anthropic/a-field-guide-to-claude-fable-finding-your-unknowns.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/concepts/unknowns.md, llm-wiki/wiki/systems/claude-fable-5.md, llm-wiki/wiki/concepts/agentic-coding.md, llm-wiki/wiki/concepts/context-engineering.md, llm-wiki/wiki/workflows/code-review.md

## [2026-08-23] ingest | Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook | llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/concepts/agentic-workflow.md, llm-wiki/wiki/people/andrew-ng.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/entity-resolution.md, llm-wiki/wiki/concepts/graph-architecture.md, llm-wiki/wiki/concepts/knowledge-graph.md, llm-wiki/wiki/concepts/multi-agent-collaboration.md, llm-wiki/wiki/concepts/orchestrator-workers.md, llm-wiki/wiki/concepts/planning.md, llm-wiki/wiki/concepts/reflection.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/workflows/verification-loop.md

## [2026-08-23] ingest | The Anatomy of an Agent Harness | llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/agent-harness.md, llm-wiki/wiki/concepts/context-rot.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/filesystem.md, llm-wiki/wiki/concepts/sandbox.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/task-harness-fit.md, llm-wiki/wiki/concepts/tool-use.md, llm-wiki/wiki/concepts/planning.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/workflows/verification-loop.md

## [2026-08-23] ingest | The Art of Loop Engineering | llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/loop-engineering.md, llm-wiki/wiki/concepts/agent-trace.md, llm-wiki/wiki/concepts/agent-harness.md, llm-wiki/wiki/concepts/human-in-the-loop.md, llm-wiki/wiki/concepts/tool-use.md, llm-wiki/wiki/projects/langchain.md, llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/workflows/event-driven-loop.md, llm-wiki/wiki/workflows/hill-climbing-loop.md, llm-wiki/wiki/workflows/verification-loop.md

## [2026-08-23] ingest | How to Build a Custom Agent Harness | llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md

lane: deep · observations: 12 · claims: +11 ~1 · rendered: llm-wiki/wiki/concepts/middleware.md, llm-wiki/wiki/concepts/agent-harness.md, llm-wiki/wiki/concepts/context-engineering.md, llm-wiki/wiki/concepts/context-rot.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/human-in-the-loop.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/task-harness-fit.md, llm-wiki/wiki/projects/langchain.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/workflows/agent-loops.md

## [2026-08-23] ingest | Orchestrate teams of Claude Code sessions | llm-wiki/raw/docs/claude-code/agent-teams.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/concepts/agent-teams.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/team-lead.md, llm-wiki/wiki/systems/claude-code.md

## [2026-08-23] ingest | Share session output as artifacts | llm-wiki/raw/docs/claude-code/artifacts.md

lane: deep · observations: 10 · claims: +10 ~0 · rendered: llm-wiki/wiki/systems/artifacts.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/mcp-connector.md

## [2026-08-23] ingest | CLI reference | llm-wiki/raw/docs/claude-code/cli-reference.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/concepts/print-mode.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/session.md, llm-wiki/wiki/concepts/system-prompt.md, llm-wiki/wiki/systems/claude-agent-sdk.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/output-styles.md

## [2026-08-23] ingest | Commands | llm-wiki/raw/docs/claude-code/commands.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/concepts/command-menu.md, llm-wiki/wiki/concepts/slash-command.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/mcp-server.md, llm-wiki/wiki/systems/skills.md

## [2026-08-23] ingest | Message your other Claude Code sessions | llm-wiki/raw/docs/claude-code/cross-session-messaging.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/concepts/cross-session-messaging.md, llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/listagents.md, llm-wiki/wiki/systems/sendmessage.md

## [2026-08-23] ingest | Launch sessions from links | llm-wiki/raw/docs/claude-code/deep-links.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/deep-links.md

## [2026-08-23] ingest | Keep Claude working toward a goal | llm-wiki/raw/docs/claude-code/goal.md

lane: deep · observations: 8 · claims: +7 ~1 · rendered: llm-wiki/wiki/concepts/completion-condition.md, llm-wiki/wiki/concepts/goal-evaluator.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/goal-command.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/workflows/verification-loop.md

## [2026-08-23] ingest | Run Claude Code programmatically | llm-wiki/raw/docs/claude-code/headless.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/bare-mode.md, llm-wiki/wiki/concepts/non-interactive-mode.md, llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/print-mode.md, llm-wiki/wiki/concepts/workspace-trust.md, llm-wiki/wiki/systems/claude-agent-sdk.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/systems/mcp-server.md

## [2026-08-23] ingest | Hooks reference | llm-wiki/raw/docs/claude-code/hooks.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/context-engineering.md, llm-wiki/wiki/concepts/permission-system.md, llm-wiki/wiki/concepts/workspace-trust.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/workflows/security-review.md

## [2026-08-23] ingest | Automate actions with hooks | llm-wiki/raw/docs/claude-code/hooks-guide.md

lane: deep · observations: 9 · claims: +7 ~2 · rendered: llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/permission-system.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md

## [2026-08-23] ingest | Set up Claude Code in a monorepo or large codebase | llm-wiki/raw/docs/claude-code/large-codebases.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/git-worktree.md, llm-wiki/wiki/concepts/monorepo.md, llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/permission-deny-rules.md, llm-wiki/wiki/systems/skills.md

## [2026-08-23] ingest | Connect Claude Code to tools via MCP | llm-wiki/raw/docs/claude-code/mcp.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/mcp-installation-scope.md, llm-wiki/wiki/concepts/mcp-tool.md, llm-wiki/wiki/concepts/permission-rule.md, llm-wiki/wiki/concepts/slash-command.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/systems/mcp-server.md

## [2026-08-23] ingest | How Claude remembers your project | llm-wiki/raw/docs/claude-code/memory.md

lane: deep · observations: 9 · claims: +7 ~2 · rendered: llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/systems/auto-memory.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/rules.md, llm-wiki/wiki/systems/skills.md

## [2026-08-23] ingest | Model configuration | llm-wiki/raw/docs/claude-code/model-config.md

lane: deep · observations: 12 · claims: +10 ~2 · rendered: llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/concepts/model-alias.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/decisions/model-selection.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/claude-fable-5.md, llm-wiki/wiki/systems/claude-sonnet-5.md

## [2026-08-23] ingest | Choose a permission mode | llm-wiki/raw/docs/claude-code/permission-modes.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/concepts/auto-mode.md, llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/permission-rule.md, llm-wiki/wiki/systems/auto-mode-classifier.md, llm-wiki/wiki/systems/claude-code.md

## [2026-08-23] ingest | Run prompts on a schedule | llm-wiki/raw/docs/claude-code/scheduled-tasks.md

lane: deep · observations: 8 · claims: +6 ~2 · rendered: llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/loop-command.md, llm-wiki/wiki/systems/scheduled-tasks.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/workflows/agent-loops.md

## [2026-08-23] ingest | Claude Code settings | llm-wiki/raw/docs/claude-code/settings.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/concepts/managed-settings.md, llm-wiki/wiki/concepts/permission-rule.md, llm-wiki/wiki/concepts/settings-file.md, llm-wiki/wiki/concepts/workspace-trust.md, llm-wiki/wiki/systems/claude-code.md

## [2026-08-23] ingest | Extend Claude with skills | llm-wiki/raw/docs/claude-code/skills.md

lane: deep · observations: 12 · claims: +9 ~2 · rendered: llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/tool-use.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/skills.md

## [2026-08-23] ingest | Create custom subagents | llm-wiki/raw/docs/claude-code/sub-agents.md

lane: deep · observations: 8 · claims: +6 ~2 · rendered: llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/skills.md

## [2026-08-23] ingest | Tools reference | llm-wiki/raw/docs/claude-code/tools-reference.md

lane: deep · observations: 10 · claims: +10 ~0 · rendered: llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/permission-rule.md, llm-wiki/wiki/concepts/sandbox.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/bash-tool.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/edit-tool.md, llm-wiki/wiki/systems/read-tool.md

## [2026-08-23] ingest | Orchestrate subagents at scale with dynamic workflows | llm-wiki/raw/docs/claude-code/workflows.md

lane: deep · observations: 10 · claims: +7 ~3 · rendered: llm-wiki/wiki/concepts/adversarial-verification.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/workflow-runtime.md, llm-wiki/wiki/workflows/dynamic-workflows.md

## [2026-08-23] ingest | Run parallel sessions with worktrees | llm-wiki/raw/docs/claude-code/worktrees.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/concepts/git-worktree.md, llm-wiki/wiki/concepts/permission-mode.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md

## [2026-08-23] lint | all mechanical checks clean; 8 classes for review

missing-pages: none · mechanical-fixes: 0 · decay: 0/0

## [2026-08-25] ingest | Agent Skills Overview | llm-wiki/raw/docs/agent-skills/home.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/projects/agent-skills.md, llm-wiki/wiki/systems/skills.md

## [2026-08-25] ingest | Specification | llm-wiki/raw/docs/agent-skills/specification.md

lane: deep · observations: 10 · claims: +10 ~0 · rendered: llm-wiki/wiki/concepts/allowed-tools.md, llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/concepts/skill-scripts.md, llm-wiki/wiki/projects/agent-skills.md

## [2026-08-25] ingest | Quickstart | llm-wiki/raw/docs/agent-skills/quickstart.md

lane: deep · observations: 4 · claims: +4 ~0 · rendered: llm-wiki/wiki/concepts/agents-skills.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/projects/agent-skills.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/skills.md

## [2026-08-25] ingest | Best practices for skill creators | llm-wiki/raw/docs/agent-skills/best-practices.md

lane: deep · observations: 11 · claims: +11 ~0 · rendered: llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/workflows/skill-evaluation.md

## [2026-08-25] ingest | Optimizing skill descriptions | llm-wiki/raw/docs/agent-skills/optimizing-descriptions.md

lane: deep · observations: 9 · claims: +9 ~0 · rendered: llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/workflows/skill-evaluation.md

## [2026-08-25] ingest | Evaluating skill output quality | llm-wiki/raw/docs/agent-skills/evaluating-skills.md

lane: deep · observations: 11 · claims: +11 ~0 · rendered: llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/workflows/skill-evaluation.md

## [2026-08-25] ingest | Using scripts in skills | llm-wiki/raw/docs/agent-skills/using-scripts.md

lane: deep · observations: 11 · claims: +11 ~0 · rendered: llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/concepts/skill-scripts.md

## [2026-08-25] ingest | How to add skills support to your agent | llm-wiki/raw/docs/agent-skills/adding-skills-support.md

lane: deep · observations: 11 · claims: +11 ~0 · rendered: llm-wiki/wiki/concepts/agents-skills.md, llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/concepts/skill-catalog.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/concepts/skill-scripts.md, llm-wiki/wiki/projects/agent-skills.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/skills.md

## [2026-08-25] ingest | Client Showcase | llm-wiki/raw/docs/agent-skills/clients.md

lane: light · observations: 0 · claims: +0 ~0 · rendered: none

## [2026-08-26] ingest | Demystifying evals for AI agents | llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/agent-evaluation.md, llm-wiki/wiki/concepts/agent-harness.md, llm-wiki/wiki/concepts/agent-trace.md, llm-wiki/wiki/concepts/eval-suite.md, llm-wiki/wiki/concepts/eval-task.md, llm-wiki/wiki/concepts/grader.md

## [2026-08-28] ingest | Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder | llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md

lane: deep · observations: 12 · claims: +10 ~2 · rendered: llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/concepts/cross-model-review.md, llm-wiki/wiki/concepts/grader.md, llm-wiki/wiki/concepts/judge-bias.md, llm-wiki/wiki/concepts/judge-calibration.md, llm-wiki/wiki/concepts/llm-as-judge.md, llm-wiki/wiki/workflows/skill-evaluation.md

## [2026-08-30] ingest | Catch security issues as Claude writes code | llm-wiki/raw/docs/claude-code/security-guidance.md

lane: deep · observations: 9 · claims: +8 ~1 · rendered: llm-wiki/wiki/systems/security-guidance-plugin.md, llm-wiki/wiki/concepts/defense-in-depth.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/systems/bash-tool.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/claude-code-review.md, llm-wiki/wiki/systems/claude-security-plugin.md, llm-wiki/wiki/workflows/security-review.md, llm-wiki/wiki/workflows/code-review.md, llm-wiki/wiki/workflows/agent-loops.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/cross-model-review.md, llm-wiki/wiki/concepts/llm-as-judge.md

## [2026-08-30] ingest | Scan your codebase for vulnerabilities | llm-wiki/raw/docs/claude-code/claude-security.md

lane: deep · observations: 10 · claims: +9 ~1 · rendered: llm-wiki/wiki/systems/claude-security-plugin.md, llm-wiki/wiki/concepts/defense-in-depth.md, llm-wiki/wiki/concepts/human-in-the-loop.md, llm-wiki/wiki/concepts/monorepo.md, llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-fable-5.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/claude-code-review.md, llm-wiki/wiki/systems/security-guidance-plugin.md, llm-wiki/wiki/workflows/security-review.md

## [2026-08-30] ingest | Code Review | llm-wiki/raw/docs/claude-code/code-review.md

lane: deep · observations: 12 · claims: +11 ~1 · rendered: llm-wiki/wiki/systems/claude-code-review.md, llm-wiki/wiki/concepts/review-md.md, llm-wiki/wiki/concepts/schema-layer.md, llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/claude-opus-5.md, llm-wiki/wiki/workflows/code-review.md

## [2026-08-30] ingest | Claude Code GitHub Actions | llm-wiki/raw/docs/claude-code/github-actions.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/systems/claude-code-github-action.md, llm-wiki/wiki/systems/claude-github-app.md, llm-wiki/wiki/systems/mcp-server.md, llm-wiki/wiki/systems/plugin.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/systems/scheduled-tasks.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/claude-code-review.md, llm-wiki/wiki/concepts/allowed-tools.md, llm-wiki/wiki/concepts/oauth.md, llm-wiki/wiki/concepts/schema-layer.md

## [2026-08-30] ingest | Skill Creation | llm-wiki/raw/docs/.claude/skills/skill-creation/SKILL.md

lane: deep · observations: 10 · claims: +8 ~2 · rendered: llm-wiki/wiki/projects/agent-skills.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/systems/rules.md, llm-wiki/wiki/workflows/skill-creation.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/slash-command.md, llm-wiki/wiki/concepts/subagents.md

## [2026-08-30] undo | run_7935864bda3d | apply reversed | skill-creation SKILL.md is a repo skill, not wiki knowledge

rows: 20 · views: changed · rendered: llm-wiki/wiki/projects/agent-skills.md, llm-wiki/wiki/systems/claude-code.md, llm-wiki/wiki/systems/hooks.md, llm-wiki/wiki/concepts/llm-wiki.md, llm-wiki/wiki/concepts/progressive-disclosure.md, llm-wiki/wiki/systems/rules.md, llm-wiki/wiki/concepts/skill-description.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/slash-command.md, llm-wiki/wiki/concepts/subagents.md (removed llm-wiki/wiki/workflows/skill-creation.md)

## [2026-08-30] undo | run_a664044c5363 | register reversed | skill-creation SKILL.md is a repo skill, not wiki knowledge

rows: 1 · views: changed · rendered: none

## [2026-09-01] ingest | SDLC lessons digest — recurring mistake classes | llm-wiki/raw/notes/sdlc-lessons-digest-2026-09.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/concepts/ai-native-startup.md, llm-wiki/wiki/workflows/sdlc-pipeline.md

## [2026-09-01] ingest | Shipped changes before the lesson stage | llm-wiki/raw/notes/sdlc-shipped-index-2026-09.md

lane: light · observations: 0 · claims: +0 ~0 · rendered: none

## [2026-09-02] ingest | Prompting Claude Fable 5.1 | llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/agent-harness.md, llm-wiki/wiki/concepts/agentic-coding.md, llm-wiki/wiki/systems/claude-fable-5.md, llm-wiki/wiki/systems/claude-fable-5-1.md, llm-wiki/wiki/systems/edit-tool.md, llm-wiki/wiki/concepts/effort-level.md, llm-wiki/wiki/decisions/model-selection.md, llm-wiki/wiki/workflows/security-review.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/tool-use.md

## [2026-09-02] ingest | Define success criteria and develop tests | llm-wiki/raw/docs/anthropic/develop-tests.md

lane: deep · observations: 12 · claims: +11 ~1 · rendered: llm-wiki/wiki/concepts/agent-evaluation.md, llm-wiki/wiki/concepts/eval-suite.md, llm-wiki/wiki/concepts/grader.md, llm-wiki/wiki/concepts/llm-as-judge.md, llm-wiki/wiki/concepts/success-criteria.md

## [2026-09-02] ingest | Reduce latency | llm-wiki/raw/docs/anthropic/reduce-latency.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/systems/claude-haiku-4-5.md, llm-wiki/wiki/concepts/latency.md, llm-wiki/wiki/decisions/model-selection.md, llm-wiki/wiki/concepts/streaming.md

## [2026-09-02] ingest | Reduce hallucinations | llm-wiki/raw/docs/anthropic/reduce-hallucinations.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/concepts/hallucination.md

## [2026-09-02] ingest | Increase output consistency | llm-wiki/raw/docs/anthropic/increase-consistency.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/concepts/output-consistency.md, llm-wiki/wiki/concepts/prefill.md, llm-wiki/wiki/concepts/rag.md, llm-wiki/wiki/systems/structured-outputs.md, llm-wiki/wiki/concepts/system-prompt.md

## [2026-09-02] ingest | Mitigate jailbreaks and prompt injections | llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md

lane: deep · observations: 12 · claims: +12 ~0 · rendered: llm-wiki/wiki/concepts/defense-in-depth.md, llm-wiki/wiki/concepts/jailbreak.md, llm-wiki/wiki/systems/mcp-server.md, llm-wiki/wiki/concepts/prompt-injection.md, llm-wiki/wiki/concepts/sandbox.md, llm-wiki/wiki/concepts/tool-results.md

## [2026-09-02] ingest | Reduce prompt leak | llm-wiki/raw/docs/anthropic/reduce-prompt-leak.md

lane: deep · observations: 7 · claims: +6 ~0 · rendered: llm-wiki/wiki/concepts/prompt-leak.md

## [2026-09-06] lint | 169 pages · 147 mechanical fixes · 55 findings for review

missing-pages: none · mechanical-fixes: 147 · decay: 0/0

## [2026-09-06] crystallize | Collapsing dev and main into one trunk | llm-wiki/raw/chats/single-trunk-git-policy.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/concepts/branch-protection.md, llm-wiki/wiki/systems/claude-code-github-action.md, llm-wiki/wiki/workflows/git-workflow.md, llm-wiki/wiki/concepts/release-branch.md, llm-wiki/wiki/workflows/security-review.md, llm-wiki/wiki/concepts/trunk.md

## [2026-09-12] ingest | Pi Security | llm-wiki/raw/docs/pi/security.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/workspace-trust.md, llm-wiki/wiki/concepts/sandbox.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/prompt-injection.md, llm-wiki/wiki/concepts/agent-memory.md

## [2026-09-12] ingest | Pi Containerization | llm-wiki/raw/docs/pi/containerization.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/sandbox.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/systems/docker-sandboxes.md

## [2026-09-12] ingest | Pi Sessions | llm-wiki/raw/docs/pi/sessions.md

lane: deep · observations: 4 · claims: +4 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/session.md, llm-wiki/wiki/concepts/context-window.md

## [2026-09-12] ingest | Pi Prompt Templates | llm-wiki/raw/docs/pi/prompt-templates.md

lane: deep · observations: 4 · claims: +4 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/prompt-template.md, llm-wiki/wiki/concepts/slash-command.md

## [2026-09-12] ingest | Pi JSON Event Stream Mode | llm-wiki/raw/docs/pi/json.md

lane: deep · observations: 4 · claims: +4 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/json-event-stream-mode.md, llm-wiki/wiki/concepts/streaming.md

## [2026-09-12] ingest | Pi Keybindings | llm-wiki/raw/docs/pi/keybindings.md

lane: deep · observations: 4 · claims: +4 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/keybindings.md

## [2026-09-12] ingest | Using Pi | llm-wiki/raw/docs/pi/usage.md

lane: deep · observations: 6 · claims: +6 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/prompt-template.md, llm-wiki/wiki/concepts/model-context-protocol.md, llm-wiki/wiki/concepts/subagents.md, llm-wiki/wiki/concepts/agent-memory.md, llm-wiki/wiki/concepts/system-prompt.md, llm-wiki/wiki/concepts/tool-use.md, llm-wiki/wiki/concepts/tui.md

## [2026-09-12] ingest | Pi Settings | llm-wiki/raw/docs/pi/settings.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/settings-file.md

## [2026-09-12] ingest | Pi Compaction and Branch Summarization | llm-wiki/raw/docs/pi/compaction.md

lane: deep · observations: 7 · claims: +7 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/compaction.md, llm-wiki/wiki/concepts/context-window.md, llm-wiki/wiki/concepts/tool-results.md, llm-wiki/wiki/concepts/pi-extension.md

## [2026-09-12] ingest | Pi Skills | llm-wiki/raw/docs/pi/skills.md

lane: deep · observations: 6 · claims: +3 ~3 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/projects/agent-skills.md, llm-wiki/wiki/concepts/skill-md.md, llm-wiki/wiki/concepts/agents-skills.md, llm-wiki/wiki/systems/skills.md, llm-wiki/wiki/concepts/progressive-disclosure.md

## [2026-09-12] ingest | Pi Themes | llm-wiki/raw/docs/pi/themes.md

lane: deep · observations: 4 · claims: +4 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/theme.md, llm-wiki/wiki/concepts/tui.md, llm-wiki/wiki/concepts/adaptive-thinking.md

## [2026-09-12] ingest | Pi Packages | llm-wiki/raw/docs/pi/packages.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/pi-package.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/workspace-trust.md, llm-wiki/wiki/concepts/settings-file.md, llm-wiki/wiki/concepts/sandbox.md

## [2026-09-12] ingest | Pi Environment Variables | llm-wiki/raw/docs/pi/environment-variables.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/systems/bash-tool.md, llm-wiki/wiki/concepts/session.md, llm-wiki/wiki/concepts/system-prompt.md, llm-wiki/wiki/concepts/settings-file.md

## [2026-09-12] ingest | Pi Session File Format | llm-wiki/raw/docs/pi/session-format.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/session.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/compaction.md, llm-wiki/wiki/concepts/context-window.md

## [2026-09-12] ingest | Pi TUI Components | llm-wiki/raw/docs/pi/tui.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/tui.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/theme.md

## [2026-09-12] ingest | Pi Extensions | llm-wiki/raw/docs/pi/extensions.md

lane: deep · observations: 8 · claims: +8 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/tool-use.md, llm-wiki/wiki/concepts/permission-system.md, llm-wiki/wiki/concepts/workspace-trust.md, llm-wiki/wiki/concepts/system-prompt.md, llm-wiki/wiki/concepts/sandbox.md

## [2026-09-12] ingest | Pi SDK | llm-wiki/raw/docs/pi/sdk.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/systems/pi-sdk.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/session.md, llm-wiki/wiki/concepts/rpc-mode.md

## [2026-09-12] ingest | Pi RPC Mode | llm-wiki/raw/docs/pi/rpc.md

lane: deep · observations: 5 · claims: +5 ~0 · rendered: llm-wiki/wiki/systems/pi.md, llm-wiki/wiki/concepts/rpc-mode.md, llm-wiki/wiki/concepts/non-interactive-mode.md, llm-wiki/wiki/concepts/pi-extension.md, llm-wiki/wiki/concepts/tui.md
