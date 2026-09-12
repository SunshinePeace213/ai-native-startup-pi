---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/large-codebases.md, title: "Set up Claude Code in a monorepo or large codebase", id: src_5ed7c226af31}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_monorepo]
claim_ids: [clm_0cab2ba4f37b, clm_7e83c9cc911e, clm_79a68b09eff3, clm_cbe1bfbfb2c0]
confidence: 0.93
stale_after: 2029-10-26
last_rendered: 2026-08-30T09:30:07Z
review_required: false
---

# monorepo

> **In here:** monorepo — 4 claims, confidence 0.93, 2 sources.

## Current understanding

- On a large repository, Claude Security should scan one focused area at a time rather than the whole tree, and the report's coverage section states what was and was not examined (0.93)
- Starting Claude Code inside a package loads that package's CLAUDE.md alongside the repository root's, leaving sibling packages' instructions out of context (0.93)
- A single CLAUDE.md at the root of a large codebase either grows to cover every subsystem's conventions, spending context on instructions unrelated to the current task, or stays too generic to be useful (0.93)
- Claude Code works at any repository size, but as a codebase grows its small-project defaults fill the context window with instructions and file reads unrelated to the task, costing tokens and degrading performance (0.93)

## Evidence

- `clm_0cab2ba4f37b` — "On a large repository, Claude Security should scan one focused area at a time rather than the whole tree, and the report's coverage section states what was and was not examined." · p 0.93 · active · 1 support · 0 contradict · when: on a large repository
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "On a large repository, scan one area at a time instead of the whole tree. Pick one of the focused scopes the plugin offers, such as your API layer or your authentication code, and the run sizes itself to what you pick."
- `clm_7e83c9cc911e` — "Starting Claude Code inside a package loads that package's CLAUDE.md alongside the repository root's, leaving sibling packages' instructions out of context." · p 0.93 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "When you start Claude from `packages/api/`, it loads both `packages/api/CLAUDE.md` and the root `CLAUDE.md`. Claude sees the local instructions alongside the repository-wide rules, with no instructions from `packages/web/` in context."
- `clm_79a68b09eff3` — "A single CLAUDE.md at the root of a large codebase either grows to cover every subsystem's conventions, spending context on instructions unrelated to the current task, or stays too generic to be useful." · p 0.93 · active · 1 support · 0 contradict · when: in a large codebase or monorepo
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "In a large codebase, a single CLAUDE.md at the repository root tends to either grow to cover every subsystem's conventions, costing context on instructions unrelated to the current task, or stay too generic to be useful."
- `clm_cbe1bfbfb2c0` — "Claude Code works at any repository size, but as a codebase grows its small-project defaults fill the context window with instructions and file reads unrelated to the task, costing tokens and degrading performance." · p 0.93 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "A large codebase can be one repository with millions of lines or a monorepo with many packages."

## Timeline

- 2026-08-23 new_claim `clm_cbe1bfbfb2c0` (src_5ed7c226af31)
- 2026-08-23 new_claim `clm_79a68b09eff3` (src_5ed7c226af31)
- 2026-08-23 new_claim `clm_7e83c9cc911e` (src_5ed7c226af31)
- 2026-08-30 new_claim `clm_0cab2ba4f37b` (src_2eb7a799d8a7)

## Related

- ← applies_to [[claude-security-plugin]] (0.93)
- [[claude-code]] — 2 shared claims
- [[context-window]] — 2 shared claims
- [[schema-layer]] — 2 shared claims
- [[claude-security-plugin]] — 1 shared claim
