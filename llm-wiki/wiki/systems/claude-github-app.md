---
type: system
status: current
created: 2026-08-30
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_claude_github_app]
claim_ids: [clm_a11730c808c1, clm_9a9fdcc6650d]
confidence: 0.93
stale_after: 2029-11-30
last_rendered: 2026-08-30T09:30:07Z
review_required: false
---

# Claude GitHub App

> **In here:** Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset · 2 claims, confidence 0.93.

## Current understanding

- GitHub does not trigger workflows on commits made with the default `GITHUB_TOKEN`, so passing it as the action's `github_token` stops CI from running on Claude's commits; omitting it lets the action authenticate as the Claude GitHub App instead (0.93)
- Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset — and the set is shared across every Claude GitHub feature, so an organization that wants only Contents, Issues, and Pull requests must create a custom app that covers the Claude Code GitHub Action alone, leaving Code Review and web auto-fix on the official app (0.93)

## Evidence

- `clm_a11730c808c1` — "GitHub does not trigger workflows on commits made with the default `GITHUB_TOKEN`, so passing it as the action's `github_token` stops CI from running on Claude's commits; omitting it lets the action authenticate as the Claude GitHub App instead." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "GitHub doesn't trigger workflows on commits made with the default `GITHUB_TOKEN`."
- `clm_9a9fdcc6650d` — "Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset — and the set is shared across every Claude GitHub feature, so an organization that wants only Contents, Issues, and Pull requests must create a custom app that covers the Claude Code GitHub Action alone, leaving Code Review and web auto-fix on the official app." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "When you install the app, you accept its full permission set. GitHub doesn't let you accept a subset."

## Timeline

- 2026-08-30 new_claim `clm_9a9fdcc6650d` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_a11730c808c1` (src_7962dafdd21b)

## Related

- ← depends_on [[claude-code-github-action]] (0.99)
- ← depends_on [[claude-code-review]] (0.93)
- [[claude-code-github-action]] — 2 shared claims
- [[claude-code-review]] — 1 shared claim
