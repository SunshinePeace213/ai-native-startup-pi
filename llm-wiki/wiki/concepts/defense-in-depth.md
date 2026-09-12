---
type: concept
status: current
created: 2026-08-30
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_defense_in_depth]
claim_ids: [clm_6eec31c28d54, clm_c2a645612a2d, clm_d0b62d961db6, clm_c89a24eb7edc]
confidence: 0.95
stale_after: 2029-10-09
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# defense in depth

> **In here:** Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep… · 4 claims, confidence 0.95.

## Current understanding

- Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI (0.99)
- None of the security-guidance plugin's layers block writes or commits: findings reach the writing Claude as instructions it addresses in conversation, and the review model can miss issues, so the plugin is one layer of defense in depth rather than a complete security solution (0.94)
- The Claude Security plugin does not replace existing source-code security tools: it reasons about code the way a human security researcher would, which complements the deterministic checks static analysis and dependency scanning provide (0.93)
- Robust protection against jailbreaks and prompt injection comes from layering strategies, such as a directive-carrying system prompt combined with a harmlessness screen tool whose verdict is a structured boolean (0.92)

## Evidence

- `clm_6eec31c28d54` — "Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI." · p 0.99 · active · 2 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin is one layer in a defense-in-depth approach. It catches issues earliest, while code is still in the editor, but it is not a guarantee and does not replace later checks. A typical stack:"
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The Claude Security plugin is the on-demand deep-scan layer in a defense-in-depth stack, alongside the [security guidance plugin](/docs/en/security-guidance), [`/security-review`](/docs/en/commands#all-commands), [Code…"
- `clm_c2a645612a2d` — "None of the security-guidance plugin's layers block writes or commits: findings reach the writing Claude as instructions it addresses in conversation, and the review model can miss issues, so the plugin is one layer of defense in depth rather than a complete security solution." · p 0.94 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "None of the layers block writes or commits. Findings reach the writing Claude as instructions, Claude addresses them in the conversation, and the review model can miss issues."
- `clm_d0b62d961db6` — "The Claude Security plugin does not replace existing source-code security tools: it reasons about code the way a human security researcher would, which complements the deterministic checks static analysis and dependency scanning provide." · p 0.93 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The plugin doesn't replace your existing source-code security tools."
- `clm_c89a24eb7edc` — "Robust protection against jailbreaks and prompt injection comes from layering strategies, such as a directive-carrying system prompt combined with a harmlessness screen tool whose verdict is a structured boolean." · p 0.92 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "By layering these strategies, you create a robust defense against jailbreaking and prompt injections, ensuring your Claude-powered applications maintain the highest standards of safety and compliance."

## Timeline

- 2026-08-30 new_claim `clm_c2a645612a2d` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_6eec31c28d54` (src_99ad4fe8f1dd)
- 2026-08-30 support_update `clm_6eec31c28d54` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_d0b62d961db6` (src_2eb7a799d8a7)
- 2026-09-02 new_claim `clm_c89a24eb7edc` (src_ba6d75fadd1b)

## Related

- ← part_of [[claude-security-plugin]] (1.00)
- ← part_of [[security-guidance-plugin]] (1.00)
- ← part_of [[claude-code-review]] (0.93)
- ← part_of [[security-review]] (0.93)
- → applies_to [[jailbreak]] (0.92)
- → applies_to [[prompt-injection]] (0.92)
- [[claude-security-plugin]] — 2 shared claims
- [[security-guidance-plugin]] — 2 shared claims
- [[claude-code-review]] — 1 shared claim
- [[jailbreak]] — 1 shared claim
- [[prompt-injection]] — 1 shared claim
- [[security-review]] — 1 shared claim
