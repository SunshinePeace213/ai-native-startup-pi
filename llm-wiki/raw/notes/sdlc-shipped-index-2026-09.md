---
source: sdlc/index.md @ 7b8c6e5 (folders retired with the lesson-stage cleanup)
fetched: 2026-09-01
---

# Shipped changes before the lesson stage

> **In here:** What each pre-lesson-stage change under `sdlc/` shipped, preserved before those folders were removed — the full artifacts live in git history up to commit 7b8c6e5.

One row per change that landed on `dev` under the old workflow, newest first,
from the retired `sdlc/index.md`:

| Plan | PR | Merged | What shipped |
| --- | --- | --- | --- |
| wiki-layer | #89 | 2026-08-07 | LLM-maintained synthesis wiki over the archived source mirrors |
| self-managing-memory-kb | #69 | 2026-07-27 | Trimmed and restructured the always-loaded rule set |
| codex-hooks-sync | #63 | 2026-07-27 | Mirrored the Claude hook surface into Codex |
| harness-build-split | #38 | 2026-07-21 | Split `harness-build` into build + review commands |
| unknowns-aware-pipeline | #31 | 2026-07-13 | Blindspot pass, deviations log, ship brief |
| sensitive-file-guard | #28 | 2026-07-12 | Denied agent access to secret-bearing files |
| destructive-command-guard | #27 | 2026-07-12 | Pre-execution hook blocking destructive commands |
| per-feature-harness-restructure | #24 | 2026-07-12 | Restructured hooks, tests, and the build workflow per feature |
| security-scan-hook | #22 | 2026-07-12 | Security-scan hook family for agent-written files |
| auto-format-hooks | #20 | 2026-07-11 | Auto-format hooks with worktree lifecycle install |

Five more folders held plan artifacts for the llm-wiki lane without an index
row: llm-wiki-automation, llm-wiki-governance, llm-wiki-hybrid-retrieval,
llm-wiki-state-layer, llm-wiki-time-and-graph — the v3 knowledge layer that
shipped as PR #137 and its predecessors.
