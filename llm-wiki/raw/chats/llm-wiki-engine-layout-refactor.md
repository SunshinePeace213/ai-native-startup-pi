---
source: session:llm-wiki-engine-layout-refactor
date: 2026-08-23
author: ringo
title: Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer
---

# Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer

> **In here:** what the refactor session worked out — where the engine's scripts and tests now live, why the sibling-import model survived the move untouched, the pytest import mode the mirrored folders forced, and the two things the rename broke that only showed up when the suite ran.

## Asked

Group the llm-wiki engine's six scripts under `scripts/llm-wiki/` and drop the `llm_wiki_` prefix that only existed to compensate for the missing folder, then move the engine's tests out of `tests/harness-layer/` — the engine is a product layer, not harness tooling — and update every live reference without touching the historical record.

## Found

The engine's scripts run as PEP 723 `uv run --script` entries and reach each other through `import llm_wiki_common`, which resolves only because Python puts the running script's own directory on `sys.path`. Moving the six files together into one folder preserves that model exactly: the import shortens to `import common` and nothing about how the scripts are launched changes.

A hyphenated `scripts/llm-wiki/` folder cannot be a Python package, and that is the point rather than a cost — nothing imports these modules as `scripts.llm_wiki`, and the hyphen stops anyone from starting to.

Mirroring module names into per-layer test folders collides on basenames: `tests/llm-wiki/test_common.py` and `tests/harness-layer/hooks/auto-format/test_common.py` cannot both be imported under pytest's default prepend mode, which reported `import file mismatch` and interrupted collection. The hyphenated directory names rule out the usual `__init__.py` fix, because `llm-wiki` and `auto-format` are not Python identifiers. Switching to `--import-mode=importlib` resolved the collision but broke the two cross-module test imports that prepend mode had been supplying — `test_governance.py` importing `test_state.py`, and `test_offline.py` importing `test_wiring.py` — so a `pythonpath` entry per directory is what keeps both working.

The renderer embeds the graph script's own filename in the pages it writes: the `## Related` overflow line reads `graph.py neighbors <entity_id>`. Renaming the script therefore drifts every rendered page carrying that line, and `render.py check` caught it as `drift in Related` on one page. The repair is a re-render through the renderer, which owns those files, never a hand edit.

The engine was never on `main` at all. It lives on the `feat/karphany-wiki-layer-v3` branch behind an open draft PR, so a branch cut from `main` by `gh issue develop` contained none of the files to move, and the work had to stack on that branch instead.

A commit touching `.github/workflows/ci.yml` is refused over HTTPS when the OAuth token lacks the `workflow` scope. The same push succeeds over SSH, which is the protocol the account already reports for git operations.

## Decided

The six scripts live at `scripts/llm-wiki/{common,state,render,graph,retrieve,lint}.py`, matching the `llm-wiki/` grouping that `.claude/hooks/`, `.claude/commands/`, and `.claude/rules/` already use.

The engine's tests live under a top-level `tests/llm-wiki/`, with its fixtures at `tests/llm-wiki/fixtures/` and its hook tests at `tests/llm-wiki/hooks/`. The shared hook fixtures moved up to `tests/conftest.py` so the harness-layer and llm-wiki hook directories use one copy rather than a duplicate.

`specs/**/*.md`, `llm-wiki/wiki/`, and `ai-docs/` keep the old paths. The spec markdown and pilot reports are historical evidence of what was true when they were written, and the wiki's own pages are state-layer owned — they follow through a crystallize and a re-render rather than a hand edit.

## Open

The claim recorded under `llm-wiki.engine.root-flag` still quotes the engine at its old path, and the two render and retrieve test fixtures carry a copy of the live `index.md` banner naming `scripts/llm_wiki_render.py`; the fixtures stay in step with the live page rather than diverging ahead of it.

Whether the remaining non-wiki scripts — `spec_lint.py`, `impl_lint.py`, `check_commit_messages.py`, `fleet.sh` — should group under a `scripts/harness-layer/` folder by the same argument was left for a separate change.
