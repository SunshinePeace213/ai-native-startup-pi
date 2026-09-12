---
type: system
status: current
created: 2026-08-30
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_claude_security_plugin]
claim_ids: [clm_6eec31c28d54, clm_dd01cdbb984a, clm_0b9ff75db6fc, clm_594603b49144, clm_e08ab1bdbc30, clm_3c7492d09031, clm_0cab2ba4f37b, clm_276d872e5414, clm_d0b62d961db6, clm_b423f79733bb]
confidence: 0.94
stale_after: 2029-11-02
last_rendered: 2026-08-30T09:30:07Z
review_required: false
---

# Claude Security plugin

> **In here:** Claude Security scans are nondeterministic — two scans of the same code can surface different findings · 10 claims, confidence 0.94.

## Current understanding

- Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI (0.99)
- Claude Security scans are nondeterministic — two scans of the same code can surface different findings — so scans should run regularly and each report is attributed to the exact code and settings it covered by its revision stamp (0.94)
- Findings only appear in a Claude Security report after independent verifier agents analyze them, which keeps reports short and worth reading (0.94)
- Claude Security never applies a patch automatically: each patch is drafted in a scratch copy of the repository so source files stay untouched, and applying one is always the human's decision, in its own pull request (0.94)
- Every Claude Security patch is reviewed by an agent independent of the one that wrote it, and is written only when that review can vouch that the change addresses the one finding, introduces no new vulnerability, and leaves behavior otherwise unchanged; otherwise the user gets a short note explaining why instead of a patch (0.94)
- The Claude Security plugin runs a multi-agent vulnerability scan of a codebase inside a Claude Code session: a team of Claude agents maps the architecture, builds a threat model, hunts for vulnerabilities, and independently reviews every finding before writing the report (0.94)
- On a large repository, Claude Security should scan one focused area at a time rather than the whole tree, and the report's coverage section states what was and was not examined (0.93)
- Each Claude Security scan writes a revision stamp recording which commit was scanned, at what effort, whether uncommitted changes were part of the scanned tree, and how thoroughly the run was verified, so a report is always tied to the code it describes (0.93)
- The Claude Security plugin does not replace existing source-code security tools: it reasons about code the way a human security researcher would, which complements the deterministic checks static analysis and dependency scanning provide (0.93)
- Fable 5's cybersecurity safety classifiers block certain model activities during a Claude Security scan and automatically downgrade them to Opus; this is expected and the scan should still complete successfully (0.93)

## Evidence

- `clm_6eec31c28d54` — "Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep scan, Code Review on pull requests, and existing static analysis and dependency scanners in CI." · p 0.99 · active · 2 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin is one layer in a defense-in-depth approach. It catches issues earliest, while code is still in the editor, but it is not a guarantee and does not replace later checks. A typical stack:"
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The Claude Security plugin is the on-demand deep-scan layer in a defense-in-depth stack, alongside the [security guidance plugin](/docs/en/security-guidance), [`/security-review`](/docs/en/commands#all-commands), [Code…"
- `clm_dd01cdbb984a` — "Claude Security scans are nondeterministic — two scans of the same code can surface different findings — so scans should run regularly and each report is attributed to the exact code and settings it covered by its revision stamp." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "Scans are nondeterministic: two scans of the same code can surface different findings. Run scans regularly, and use the revision stamps to attribute each report to the exact code and settings it covered."
- `clm_0b9ff75db6fc` — "Findings only appear in a Claude Security report after independent verifier agents analyze them, which keeps reports short and worth reading." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "Findings only appear in the report after independent verifier agents analyze them, which keeps reports short and worth reading."
- `clm_594603b49144` — "Claude Security never applies a patch automatically: each patch is drafted in a scratch copy of the repository so source files stay untouched, and applying one is always the human's decision, in its own pull request." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "Each patch is drafted in a scratch copy of your repository, so your source files stay untouched until you apply a patch yourself."
- `clm_e08ab1bdbc30` — "Every Claude Security patch is reviewed by an agent independent of the one that wrote it, and is written only when that review can vouch that the change addresses the one finding, introduces no new vulnerability, and leaves behavior otherwise unchanged; otherwise the user gets a short note explaining why instead of a patch." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "A patch is written only when that review can vouch that the change addresses the one finding, introduces no new vulnerability, and leaves behavior otherwise unchanged."
- `clm_3c7492d09031` — "The Claude Security plugin runs a multi-agent vulnerability scan of a codebase inside a Claude Code session: a team of Claude agents maps the architecture, builds a threat model, hunts for vulnerabilities, and independently reviews every finding before writing the report." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The Claude Security plugin runs a multi-agent vulnerability scan of your codebase inside a Claude Code session."
- `clm_0cab2ba4f37b` — "On a large repository, Claude Security should scan one focused area at a time rather than the whole tree, and the report's coverage section states what was and was not examined." · p 0.93 · active · 1 support · 0 contradict · when: on a large repository
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "On a large repository, scan one area at a time instead of the whole tree. Pick one of the focused scopes the plugin offers, such as your API layer or your authentication code, and the run sizes itself to what you pick."
- `clm_276d872e5414` — "Each Claude Security scan writes a revision stamp recording which commit was scanned, at what effort, whether uncommitted changes were part of the scanned tree, and how thoroughly the run was verified, so a report is always tied to the code it describes." · p 0.93 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "**`CLAUDE-SECURITY-REVISION-<commit>.json`**: the revision stamp, recording which commit was scanned, at what effort, whether uncommitted changes were part of the scanned tree, and how thoroughly the run was verified, so a report is…"
- `clm_d0b62d961db6` — "The Claude Security plugin does not replace existing source-code security tools: it reasons about code the way a human security researcher would, which complements the deterministic checks static analysis and dependency scanning provide." · p 0.93 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The plugin doesn't replace your existing source-code security tools."
- `clm_b423f79733bb` — "Fable 5's cybersecurity safety classifiers block certain model activities during a Claude Security scan and automatically downgrade them to Opus; this is expected and the scan should still complete successfully." · p 0.93 · active · 1 support · 0 contradict · when: when running on Claude Fable 5
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "Due to Fable 5's cybersecurity safety classifiers, certain model activities will be blocked and automatically downgraded to Opus. This is expected, and the scan should still complete successfully."

## Timeline

- 2026-08-30 new_claim `clm_6eec31c28d54` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_3c7492d09031` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_0b9ff75db6fc` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_dd01cdbb984a` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_276d872e5414` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_e08ab1bdbc30` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_594603b49144` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_0cab2ba4f37b` (src_2eb7a799d8a7)
- 2026-08-30 support_update `clm_6eec31c28d54` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_d0b62d961db6` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_b423f79733bb` (src_2eb7a799d8a7)

## Related

- → uses [[subagents]] (1.00)
- → part_of [[defense-in-depth]] (1.00)
- → depends_on [[human-in-the-loop]] (0.94)
- → part_of [[claude-code]] (0.94)
- → applies_to [[monorepo]] (0.93)
- → produces [[effort-level]] (0.93)
- → uses [[claude-fable-5]] (0.93)
- [[subagents]] — 3 shared claims
- [[defense-in-depth]] — 2 shared claims
- [[claude-code]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[claude-fable-5]] — 1 shared claim
- [[effort-level]] — 1 shared claim
- [[human-in-the-loop]] — 1 shared claim
- [[monorepo]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
- [[security-review]] — 1 shared claim
