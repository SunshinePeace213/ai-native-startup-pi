---
type: system
status: current
created: 2026-08-30
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_claude_code_review]
claim_ids: [clm_6eec31c28d54, clm_a5e46d967548, clm_2694489a1d99, clm_af89d912506c, clm_ff40be194490, clm_1d63b8bcc9f0, clm_f9c48402e71b, clm_9a9fdcc6650d, clm_ec129411785a, clm_2f55b8fed89b]
confidence: 0.95
stale_after: 2029-11-02
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# Claude Code Review

> **In here:** The Claude Code Review check run always completes with a neutral conclusion so it never blocks merging through branch protection rules; · 10 claims, confidence 0.95.

## Current understanding

- Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI (0.99)
- A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter (0.99)
- The Claude Code Review check run always completes with a neutral conclusion so it never blocks merging through branch protection rules; gating merges on findings means reading the severity breakdown from the check run output in your own CI (0.94)
- Code Review never starts on a pull request from a fork automatically, regardless of the repository's Review Behavior setting: only an `@claude review` comment starts one (0.94)
- Code Review tags each finding with one of three severities: Important, a bug that should be fixed before merging; Nit, a minor issue worth fixing but not blocking; and Pre-existing, a bug that exists in the codebase but was not introduced by this PR (0.94)
- Code Review reads two guidance files with different force: CLAUDE.md is shared project context whose newly introduced violations are flagged as nits, while REVIEW.md is review-only instruction handed to the agents that find and verify findings and consulted by the ones that rank and report them (0.94)
- Code Review is billed on token usage, averaging $15-25 per review and scaling with PR size, codebase complexity, and how many issues require verification, and is billed separately through usage credits rather than counting against a plan's included usage (0.93)
- Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset — and the set is shared across every Claude GitHub feature, so an organization that wants only Contents, Issues, and Pull requests must create a custom app that covers the Claude Code GitHub Action alone, leaving Code Review and web auto-fix on the official app (0.93)
- Reviewing on every push runs the most Code Reviews and costs the most, while Manual mode suits high-traffic repositories where specific PRs are opted in or review starts only once a PR is ready (0.93)
- REVIEW.md can tune how a review behaves on an already-reviewed PR — a rule such as suppressing new nits after the first review and posting Important findings only stops a one-line fix from reaching round seven on style alone (0.93)

## Evidence

- `clm_6eec31c28d54` — "Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI." · p 0.99 · active · 2 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin is one layer in a defense-in-depth approach. It catches issues earliest, while code is still in the editor, but it is not a guarantee and does not replace later checks. A typical stack:"
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The Claude Security plugin is the on-demand deep-scan layer in a defense-in-depth stack, alongside the [security guidance plugin](/docs/en/security-guidance), [`/security-review`](/docs/en/commands#all-commands), [Code…"
- `clm_a5e46d967548` — "A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter" · p 0.99 · active · 2 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "ask it to report everything and filter in a separate pass instead"
  - `src_1d5f4c9615f1` Code Review: "When a review runs, multiple agents analyze the diff and surrounding code in parallel on Anthropic infrastructure."
- `clm_2694489a1d99` — "The Claude Code Review check run always completes with a neutral conclusion so it never blocks merging through branch protection rules; gating merges on findings means reading the severity breakdown from the check run output in your own CI." · p 0.94 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "The check run always completes with a neutral conclusion so it never blocks merging through branch protection rules. If you want to gate merges on Code Review findings, read the severity breakdown from the check run output in your own CI."
- `clm_af89d912506c` — "Code Review never starts on a pull request from a fork automatically, regardless of the repository's Review Behavior setting: only an `@claude review` comment starts one." · p 0.94 · active · 1 support · 0 contradict · when: for pull requests from forks
  - `src_1d5f4c9615f1` Code Review: "Claude doesn't review a pull request from a fork automatically, regardless of the repository's **Review Behavior** setting. To start one, comment `@claude review` on the pull request."
- `clm_ff40be194490` — "Code Review tags each finding with one of three severities: Important, a bug that should be fixed before merging; Nit, a minor issue worth fixing but not blocking; and Pre-existing, a bug that exists in the codebase but was not introduced by this PR." · p 0.94 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "| 🔴 | Important | A bug that should be fixed before merging | | 🟡 | Nit | A minor issue, worth fixing but not blocking | | 🟣 | Pre-existing | A bug that exists in the codebase but was not introduced by this PR |"
- `clm_1d63b8bcc9f0` — "Code Review reads two guidance files with different force: CLAUDE.md is shared project context whose newly introduced violations are flagged as nits, while REVIEW.md is review-only instruction handed to the agents that find and verify findings and consulted by the ones that rank and report them." · p 0.94 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "* **`CLAUDE.md`**: shared project instructions that Claude Code uses for all tasks, not just reviews. Code Review reads it as project context and flags newly introduced violations as nits."
- `clm_f9c48402e71b` — "Code Review is billed on token usage, averaging $15-25 per review and scaling with PR size, codebase complexity, and how many issues require verification, and is billed separately through usage credits rather than counting against a plan's included usage." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "Code Review is billed based on token usage. Each review averages \$15-25 in cost, scaling with PR size, codebase complexity, and how many issues require verification."
- `clm_9a9fdcc6650d` — "Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset — and the set is shared across every Claude GitHub feature, so an organization that wants only Contents, Issues, and Pull requests must create a custom app that covers the Claude Code GitHub Action alone, leaving Code Review and web auto-fix on the official app." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "When you install the app, you accept its full permission set. GitHub doesn't let you accept a subset."
- `clm_ec129411785a` — "Reviewing on every push runs the most Code Reviews and costs the most, while Manual mode suits high-traffic repositories where specific PRs are opted in or review starts only once a PR is ready." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "Reviewing on every push runs the most reviews and costs the most. Manual mode is useful for high-traffic repos where you want to opt specific PRs into review, or to only start reviewing your PRs once they're ready."
- `clm_2f55b8fed89b` — "REVIEW.md can tune how a review behaves on an already-reviewed PR — a rule such as suppressing new nits after the first review and posting Important findings only stops a one-line fix from reaching round seven on style alone." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "**Re-review convergence**: tell Claude how to behave when a PR has already been reviewed."

## Timeline

- 2026-08-23 new_claim `clm_a5e46d967548` (src_26d415487f93)
- 2026-08-30 new_claim `clm_6eec31c28d54` (src_99ad4fe8f1dd)
- 2026-08-30 support_update `clm_6eec31c28d54` (src_2eb7a799d8a7)
- 2026-08-30 support_update `clm_a5e46d967548` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_ff40be194490` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_2694489a1d99` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_1d63b8bcc9f0` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_2f55b8fed89b` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_f9c48402e71b` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_ec129411785a` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_af89d912506c` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_9a9fdcc6650d` (src_7962dafdd21b)

## Related

- → uses [[review-md]] (0.94)
- → uses [[schema-layer]] (0.94)
- → depends_on [[claude-github-app]] (0.93)
- → uses [[subagents]] (0.93)
- ← applies_to [[review-md]] (0.93)
- → part_of [[defense-in-depth]] (0.93)
- [[review-md]] — 2 shared claims
- [[claude-code-github-action]] — 1 shared claim
- [[claude-github-app]] — 1 shared claim
- [[claude-opus-5]] — 1 shared claim
- [[claude-security-plugin]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[defense-in-depth]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
- [[security-review]] — 1 shared claim
- [[subagents]] — 1 shared claim
