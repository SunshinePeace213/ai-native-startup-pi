---
type: system
status: current
created: 2026-08-30
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/papers/llm-as-judge-cross-model-review-guide.md, title: "Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder", id: src_521f898b9896}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_security_guidance_plugin]
claim_ids: [clm_6282902285c5, clm_6eec31c28d54, clm_894efdaa13ce, clm_bc2e48f39a13, clm_c2a645612a2d, clm_e0eb3e2d4116, clm_3aa60c4741c6, clm_0d2e125d097a, clm_f6f929cedc0a]
confidence: 0.95
stale_after: 2029-11-30
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# security guidance plugin

> **In here:** The security-guidance plugin's two extension points — a Markdown guidance file for the model-backed reviews and a YAML or JSON patterns file for the per-edit string match · 9 claims, confidence 0.95.

## Current understanding

- Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not (1.00)
- Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI (0.99)
- The security-guidance plugin is built entirely on Claude Code hooks, the mechanism for running your own code at specific points in Claude's loop (0.94)
- The security-guidance plugin reviews Claude's work at three points at different depths: a fast per-edit pattern match with no model call, an end-of-turn background model review of everything the turn changed, and a deeper agentic review on each commit or push Claude makes that reads surrounding code (0.94)
- None of the security-guidance plugin's layers block writes or commits: findings reach the writing Claude as instructions it addresses in conversation, and the review model can miss issues, so the plugin is one layer of defense in depth rather than a complete security solution (0.94)
- The commit and push review layer fires only on commits and pushes Claude makes through its Bash tool, so commits the user runs from their own shell, including the `!` shell escape inside a session, are never reviewed (0.94)
- The security-guidance plugin's two extension points — a Markdown guidance file for the model-backed reviews and a YAML or JSON patterns file for the per-edit string match — are additive only: they can add checks but cannot disable built-in ones (0.93)
- Rules in the plugin's guidance file are guidance for the reviewer rather than deterministic guardrails — the plugin surfaces violations as findings for Claude to fix but does not block writes or guarantee every violation is caught, so hard enforcement needs a blocking hook or a CI check (0.93)
- After each turn the plugin diffs everything that changed in the working tree during the turn — including changes from Claude's edit tools, Bash commands, and subagents — and sends it to a separate background Claude review focused on security, re-prompting Claude with any findings (0.93)

## Evidence

- `clm_6282902285c5` — "Inside a loop, code review belongs to a second agent, because an agent reviewing its own output carries a bias a separate reviewer does not" · p 1.00 · active · 3 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Use a second agent for code review to reduce the bias of an agent reviewing its own output."
  - `src_521f898b9896` Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder: "Claude self-review: unchanged at 91.4%"
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin does not ask the same Claude instance that wrote the code to grade itself. The per-edit check is a deterministic string match with no model involved."
- `clm_6eec31c28d54` — "Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI." · p 0.99 · active · 2 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin is one layer in a defense-in-depth approach. It catches issues earliest, while code is still in the editor, but it is not a guarantee and does not replace later checks. A typical stack:"
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The Claude Security plugin is the on-demand deep-scan layer in a defense-in-depth stack, alongside the [security guidance plugin](/docs/en/security-guidance), [`/security-review`](/docs/en/commands#all-commands), [Code…"
- `clm_894efdaa13ce` — "The security-guidance plugin is built entirely on Claude Code hooks, the mechanism for running your own code at specific points in Claude's loop." · p 0.94 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin is built entirely on [hooks](/docs/en/hooks), the mechanism for running your own code at specific points in Claude's loop. It registers:"
- `clm_bc2e48f39a13` — "The security-guidance plugin reviews Claude's work at three points at different depths: a fast per-edit pattern match with no model call, an end-of-turn background model review of everything the turn changed, and a deeper agentic review on each commit or push Claude makes that reads surrounding code." · p 0.94 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "* [On each file edit](#on-each-file-edit): a fast pattern match for risky calls, with no model call * [At the end of each turn](#at-the-end-of-each-turn): a background model review of everything that turn changed * [On each commit or push…"
- `clm_c2a645612a2d` — "None of the security-guidance plugin's layers block writes or commits: findings reach the writing Claude as instructions it addresses in conversation, and the review model can miss issues, so the plugin is one layer of defense in depth rather than a complete security solution." · p 0.94 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "None of the layers block writes or commits. Findings reach the writing Claude as instructions, Claude addresses them in the conversation, and the review model can miss issues."
- `clm_e0eb3e2d4116` — "The commit and push review layer fires only on commits and pushes Claude makes through its Bash tool, so commits the user runs from their own shell, including the `!` shell escape inside a session, are never reviewed." · p 0.94 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "This layer fires only on commits and pushes Claude makes through its Bash tool. Commits you run from your own shell, including the `!` shell escape inside a session, are not reviewed."
- `clm_3aa60c4741c6` — "The security-guidance plugin's two extension points — a Markdown guidance file for the model-backed reviews and a YAML or JSON patterns file for the per-edit string match — are additive only: they can add checks but cannot disable built-in ones." · p 0.93 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin has two extension points: a Markdown guidance file for the model-backed reviews, and a YAML or JSON patterns file for the per-edit string match. Both are additive."
- `clm_0d2e125d097a` — "Rules in the plugin's guidance file are guidance for the reviewer rather than deterministic guardrails — the plugin surfaces violations as findings for Claude to fix but does not block writes or guarantee every violation is caught, so hard enforcement needs a blocking hook or a CI check." · p 0.93 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "These rules are guidance for the reviewer, not deterministic guardrails. The plugin surfaces violations as findings for Claude to fix, but it does not block writes or guarantee every violation is caught."
- `clm_f6f929cedc0a` — "After each turn the plugin diffs everything that changed in the working tree during the turn — including changes from Claude's edit tools, Bash commands, and subagents — and sends it to a separate background Claude review focused on security, re-prompting Claude with any findings." · p 0.93 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "After each turn, the plugin computes a git diff of everything that changed in the working tree during the turn, including changes from Claude's edit tools, Bash commands, and subagents, and sends it to a separate Claude review focused on…"

## Timeline

- 2026-08-23 new_claim `clm_6282902285c5` (src_d0a8a3247101)
- 2026-08-28 support_update `clm_6282902285c5` (src_521f898b9896)
- 2026-08-30 new_claim `clm_bc2e48f39a13` (src_99ad4fe8f1dd)
- 2026-08-30 support_update `clm_6282902285c5` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_c2a645612a2d` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_3aa60c4741c6` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_0d2e125d097a` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_894efdaa13ce` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_f6f929cedc0a` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_e0eb3e2d4116` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_6eec31c28d54` (src_99ad4fe8f1dd)
- 2026-08-30 support_update `clm_6eec31c28d54` (src_2eb7a799d8a7)

## Related

- → part_of [[defense-in-depth]] (1.00)
- → depends_on [[bash-tool]] (0.94)
- → depends_on [[hooks]] (0.94)
- → part_of [[claude-code]] (0.94)
- → applies_to [[subagents]] (0.93)
- → related_to [[hooks]] (0.93)
- → uses [[claude-code]] (0.93)
- [[claude-code]] — 2 shared claims
- [[defense-in-depth]] — 2 shared claims
- [[hooks]] — 2 shared claims
- [[agent-loops]] — 1 shared claim
- [[bash-tool]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[claude-security-plugin]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[cross-model-review]] — 1 shared claim
- [[llm-as-judge]] — 1 shared claim
- [[security-review]] — 1 shared claim
- [[subagents]] — 1 shared claim
