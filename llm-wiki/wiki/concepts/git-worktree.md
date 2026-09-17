---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/large-codebases.md, title: "Set up Claude Code in a monorepo or large codebase", id: src_5ed7c226af31}
  - {resource: llm-wiki/raw/docs/claude-code/worktrees.md, title: "Run parallel sessions with worktrees", id: src_0979d158a4cf}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_git_worktree]
claim_ids: [clm_bf04596b7d87, clm_0e89a8901cee, clm_65a77d75d064, clm_51eafce71275, clm_08f7ec090a90, clm_0b4380115a9f, clm_ab1aa0679c1d, clm_27ed2b92268c, clm_fa3bd1f7b469]
confidence: 0.91
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# git worktree

> **In here:** git worktree — 9 claims, confidence 0.91, 2 sources.

## Current understanding

- A git worktree is a separate working directory with its own files and branch that shares the repository's history and remote, so each Claude Code session running in one never touches another session's files (0.94)
- A subagent's temporary worktree is removed automatically when the subagent finishes without changes, while one holding changes stays on disk until a periodic sweep can remove it without losing work (0.93)
- While a session is isolated in a worktree, Claude Code blocks any Edit, Write, or NotebookEdit that targets the main checkout, and any Bash, PowerShell, or Monitor command whose working directory resolves there or cannot be verified to stay outside it (0.93)
- On exiting an interactive worktree session a clean worktree from an unnamed session is removed along with its branch automatically, while a named session or a worktree holding work prompts the user to keep or remove it (0.92)
- Passing `--worktree` or `-w` with a name starts Claude in an isolated worktree created under `.claude/worktrees/<name>/` at the repository root, on a new branch named `worktree-<name>` (0.90)
- A Claude Code worktree checks out the entire repository by default, and the `worktree.sparsePaths` setting narrows it with git sparse-checkout to only the listed directories plus root-level files (0.90)
- Subagents can run in their own worktrees so parallel edits don't conflict, either by asking Claude to use worktrees for its agents or by adding `isolation: worktree` to a custom subagent's frontmatter (0.90)
- A worktree is a fresh checkout, so gitignored files carrying local configuration are absent until a `.worktreeinclude` file in the project root lists them for copying into each new worktree (0.89)
- Entering a worktree path outside the repository's `.claude/worktrees/` directory always asks for approval — no EnterWorktree permission rule or "don't ask again" choice suppresses it, only bypassPermissions mode — because the move takes the session's working directory, write access, and project configuration with it (0.89)

## Evidence

- `clm_bf04596b7d87` — "A git worktree is a separate working directory with its own files and branch that shares the repository's history and remote, so each Claude Code session running in one never touches another session's files." · p 0.94 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "A [git worktree](https://git-scm.com/docs/git-worktree) is a separate working directory with its own files and branch, sharing the same repository history and remote as your main checkout."
- `clm_0e89a8901cee` — "A subagent's temporary worktree is removed automatically when the subagent finishes without changes, while one holding changes stays on disk until a periodic sweep can remove it without losing work." · p 0.93 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "Each subagent gets a temporary worktree that Claude Code removes automatically when the subagent finishes without changes;"
- `clm_65a77d75d064` — "While a session is isolated in a worktree, Claude Code blocks any Edit, Write, or NotebookEdit that targets the main checkout, and any Bash, PowerShell, or Monitor command whose working directory resolves there or cannot be verified to stay outside it." · p 0.93 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "* **File edits**: Claude Code blocks an `Edit`, `Write`, or `NotebookEdit` that targets a path in the main checkout."
- `clm_51eafce71275` — "On exiting an interactive worktree session a clean worktree from an unnamed session is removed along with its branch automatically, while a named session or a worktree holding work prompts the user to keep or remove it." · p 0.92 · active · 1 support · 0 contradict · when: for interactive sessions
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "* **The worktree is clean**: for an unnamed session, Claude removes the worktree and its branch automatically."
- `clm_08f7ec090a90` — "Passing `--worktree` or `-w` with a name starts Claude in an isolated worktree created under `.claude/worktrees/<name>/` at the repository root, on a new branch named `worktree-<name>`." · p 0.90 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "Pass `--worktree` or `-w` with a name to create an isolated worktree and start Claude in it. By default, the worktree is created under `.claude/worktrees/<name>/` at your repository root, on a new branch named `worktree-<name>`"
- `clm_0b4380115a9f` — "A Claude Code worktree checks out the entire repository by default, and the `worktree.sparsePaths` setting narrows it with git sparse-checkout to only the listed directories plus root-level files." · p 0.90 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "The `--worktree` flag starts a session in a new git worktree so changes stay isolated from your main checkout. By default it checks out the entire repository."
- `clm_ab1aa0679c1d` — "Subagents can run in their own worktrees so parallel edits don't conflict, either by asking Claude to use worktrees for its agents or by adding `isolation: worktree` to a custom subagent's frontmatter." · p 0.90 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "Subagents can run in their own worktrees so parallel edits don't conflict."
- `clm_27ed2b92268c` — "A worktree is a fresh checkout, so gitignored files carrying local configuration are absent until a `.worktreeinclude` file in the project root lists them for copying into each new worktree." · p 0.89 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "A worktree is a fresh checkout, so untracked files like `.env` or `.env.local` from your main repository are not present. To copy them automatically when Claude creates a worktree, add a `.worktreeinclude` file to your project root."
- `clm_fa3bd1f7b469` — "Entering a worktree path outside the repository's `.claude/worktrees/` directory always asks for approval — no EnterWorktree permission rule or "don't ask again" choice suppresses it, only bypassPermissions mode — because the move takes the session's working directory, write access, and project configuration with it." · p 0.89 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "When Claude enters a path outside the repository's `.claude/worktrees/` directory, Claude Code asks for your approval first, because the move takes the session's working directory, write access, and project configuration such as…"

## Timeline

- 2026-08-23 new_claim `clm_bf04596b7d87` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_08f7ec090a90` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_fa3bd1f7b469` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_65a77d75d064` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_ab1aa0679c1d` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_0e89a8901cee` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_51eafce71275` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_27ed2b92268c` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_0b4380115a9f` (src_5ed7c226af31)

## Related

- ← uses [[subagents]] (0.93)
- [[claude-code]] — 7 shared claims
- [[subagents]] — 2 shared claims
- [[permission-mode]] — 1 shared claim
