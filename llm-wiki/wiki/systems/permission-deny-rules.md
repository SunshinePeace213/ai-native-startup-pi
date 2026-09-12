---
type: system
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/large-codebases.md, title: "Set up Claude Code in a monorepo or large codebase", id: src_5ed7c226af31}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_permission_deny_rules]
claim_ids: [clm_df3973d5ddfb, clm_22b2026c78fb]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# permission deny rules

> **In here:** `Read` deny rules in `permissions.deny` stop Claude Code from opening checked-in paths such as a vendored SDK or committed generated code, which `.gitignore` alone does not cover · 2 claims, confidence 0.92.

## Current understanding

- Deny rules cover Claude Code's built-in file tools and recognized Bash file commands given a denied path as an argument, but Claude still sees denied paths in the output of a Bash search such as `grep -r` or `find` (0.93)
- `Read` deny rules in `permissions.deny` stop Claude Code from opening checked-in paths such as a vendored SDK or committed generated code, which `.gitignore` alone does not cover (0.91)

## Evidence

- `clm_df3973d5ddfb` — "Deny rules cover Claude Code's built-in file tools and recognized Bash file commands given a denied path as an argument, but Claude still sees denied paths in the output of a Bash search such as `grep -r` or `find`." · p 0.93 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "Deny rules cover Claude's built-in file tools and recognized Bash file commands, including `cat`, `head`, `grep`, and `find`, when a denied path is passed as an argument."
- `clm_22b2026c78fb` — "`Read` deny rules in `permissions.deny` stop Claude Code from opening checked-in paths such as a vendored SDK or committed generated code, which `.gitignore` alone does not cover." · p 0.91 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "For paths that are checked in, such as a vendored SDK or committed generated code, add `Read` deny rules in `permissions.deny` to block Claude from opening those files."

## Timeline

- 2026-08-23 new_claim `clm_22b2026c78fb` (src_5ed7c226af31)
- 2026-08-23 new_claim `clm_df3973d5ddfb` (src_5ed7c226af31)

## Related

- [[claude-code]] — 2 shared claims
