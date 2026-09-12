---
type: workflow
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/books/founders-playbook/index.md, title: "The Founder's Playbook: Building an AI-Native Startup", id: src_72a67c0111dc}
  - {resource: llm-wiki/raw/chats/single-trunk-git-policy.md, title: "single-trunk-git-policy", id: src_0fe13652a5fb}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/hooks.md, title: "Hooks reference", id: src_af0a3c9de51d}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_security_review]
claim_ids: [clm_6eec31c28d54, clm_71a4b67427f6, clm_3998bab92a34, clm_5cbba3ebb17e, clm_4ffa0158f2ea]
confidence: 0.89
stale_after: 2027-06-21
last_rendered: 2026-09-05T20:28:25Z
review_required: false
---

# security review

> **In here:** Agentic coding tools generate code that works, not code that is inherently secure, and security defects carry no natural feedback loop because they stay invisible until exploited · 5 claims, confidence 0.89.

## Current understanding

- Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI (0.99)
- Command hooks run shell commands with the user's full permissions and can modify, delete, or read anything that user account can reach, so every hook command should be reviewed and tested before it is configured (0.94)
- Claude Fable 5.1's safety classifiers produce fewer false positives than Claude Fable 5's did at launch and finding vulnerabilities in source code is permitted, but compile-check phrasing, lesser-known programming languages, and base64 in tool output still make a refusal stop reason more likely (0.93)
- Agentic coding tools generate code that works, not code that is inherently secure, and security defects carry no natural feedback loop because they stay invisible until exploited — so a security review before any user touches the product is the minimum responsible threshold for shipping an MVP (0.84)
- The Claude Code GitHub Action refuses to run when the workflow file on the branch differs from the copy on the repository's default branch, skipping the action step so no report comment is written and any gate that reads one then fails the run (0.75)

## Evidence

- `clm_6eec31c28d54` — "Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI." · p 0.99 · active · 2 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin is one layer in a defense-in-depth approach. It catches issues earliest, while code is still in the editor, but it is not a guarantee and does not replace later checks. A typical stack:"
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The Claude Security plugin is the on-demand deep-scan layer in a defense-in-depth stack, alongside the [security guidance plugin](/docs/en/security-guidance), [`/security-review`](/docs/en/commands#all-commands), [Code…"
- `clm_71a4b67427f6` — "Command hooks run shell commands with the user's full permissions and can modify, delete, or read anything that user account can reach, so every hook command should be reviewed and tested before it is configured." · p 0.94 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Command hooks execute shell commands with your full user permissions. They can modify, delete, or access any files your user account can access. Review and test all hook commands before adding them to your configuration."
- `clm_3998bab92a34` — "Claude Fable 5.1's safety classifiers produce fewer false positives than Claude Fable 5's did at launch and finding vulnerabilities in source code is permitted, but compile-check phrasing, lesser-known programming languages, and base64 in tool output still make a refusal stop reason more likely." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1's safety classifiers produce fewer false positives than Claude Fable 5's did at launch, and finding vulnerabilities in source code is permitted."
- `clm_5cbba3ebb17e` — "Agentic coding tools generate code that works, not code that is inherently secure, and security defects carry no natural feedback loop because they stay invisible until exploited — so a security review before any user touches the product is the minimum responsible threshold for shipping an MVP" · p 0.84 · active · 1 support · 0 contradict
  - `src_72a67c0111dc` The Founder's Playbook: Building an AI-Native Startup: "The hard truth is that agentic coding tools generate code that works, not code that is inherently secure. Functional code is easy, because either the feature works or it doesn't."
- `clm_4ffa0158f2ea` — "The Claude Code GitHub Action refuses to run when the workflow file on the branch differs from the copy on the repository's default branch, skipping the action step so no report comment is written and any gate that reads one then fails the run" · p 0.75 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "The Claude Code GitHub Action refuses to run when the workflow file on the branch differs from the copy on the repository's default branch: the run logged "Workflow validation failed."

## Timeline

- 2026-08-23 new_claim `clm_5cbba3ebb17e` (src_72a67c0111dc)
- 2026-08-23 new_claim `clm_71a4b67427f6` (src_af0a3c9de51d)
- 2026-08-30 new_claim `clm_6eec31c28d54` (src_99ad4fe8f1dd)
- 2026-08-30 support_update `clm_6eec31c28d54` (src_2eb7a799d8a7)
- 2026-09-02 new_claim `clm_3998bab92a34` (src_9f2ae1e705ce)
- 2026-09-05 new_claim `clm_4ffa0158f2ea` (src_0fe13652a5fb)

## Related

- ← applies_to [[claude-fable-5-1]] (0.93)
- → part_of [[defense-in-depth]] (0.93)
- → applies_to [[mvp-stage]] (0.84)
- ← related_to [[agentic-coding]] (0.84)
- → depends_on [[claude-code-github-action]] (0.75)
- [[agentic-coding]] — 1 shared claim
- [[claude-code]] — 1 shared claim
- [[claude-code-github-action]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[claude-fable-5-1]] — 1 shared claim
- [[claude-security-plugin]] — 1 shared claim
- [[defense-in-depth]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[mvp-stage]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
