---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_human_in_the_loop]
claim_ids: [clm_594603b49144, clm_b5487cbd1bcd, clm_23587a9fe68d, clm_ed006b80a855]
confidence: 0.84
stale_after: 2028-02-01
last_rendered: 2026-08-30T09:30:07Z
review_required: false
---

# human in the loop

> **In here:** Expertise that can be codified belongs in the prompt or tools, but sensitive actions such as financial transactions and database operations need live human review · 4 claims, confidence 0.84.

## Current understanding

- Claude Security never applies a patch automatically: each patch is drafted in a scratch copy of the repository so source files stay untouched, and applying one is always the human's decision, in its own pull request (0.94)
- Expertise that can be codified belongs in the prompt or tools, but sensitive actions such as financial transactions and database operations need live human review (0.80)
- Every loop level has natural points where human oversight adds value: an automated grader can check whether links resolve, but it takes a human to notice the framing is wrong for the audience (0.80)
- Policy enforcement such as PII handling, compliance checks, and approval gates must fire on every call regardless of what the model does, so it does not belong in a prompt (0.80)

## Evidence

- `clm_594603b49144` — "Claude Security never applies a patch automatically: each patch is drafted in a scratch copy of the repository so source files stay untouched, and applying one is always the human's decision, in its own pull request." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "Each patch is drafted in a scratch copy of your repository, so your source files stay untouched until you apply a patch yourself."
- `clm_b5487cbd1bcd` — "Expertise that can be codified belongs in the prompt or tools, but sensitive actions such as financial transactions and database operations need live human review." · p 0.80 · active · 1 support · 0 contradict · when: for sensitive actions
  - `src_5b435bf5e144` the-art-of-loop-engineering: "Some expertise should be codified in the prompt/tools themselves, but for sensitive actions, live human review is essential (think financial transactions, DB operations, etc)."
- `clm_23587a9fe68d` — "Every loop level has natural points where human oversight adds value: an automated grader can check whether links resolve, but it takes a human to notice the framing is wrong for the audience." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "Automation doesn't mean removing humans from the loop. At every level, there are natural points where human oversight adds value. An automated grader can check whether links resolve;"
- `clm_ed006b80a855` — "Policy enforcement such as PII handling, compliance checks, and approval gates must fire on every call regardless of what the model does, so it does not belong in a prompt." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Enforce policies | PII handling, compliance checks, approval gates — these need to fire on every call regardless of what the model does. They don't belong in a prompt. | PIIMiddleware, HumanInTheLoopMiddleware |"

## Timeline

- 2026-08-23 new_claim `clm_23587a9fe68d` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_b5487cbd1bcd` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_ed006b80a855` (src_f7dcee3b42fc)
- 2026-08-30 new_claim `clm_594603b49144` (src_2eb7a799d8a7)

## Related

- ← depends_on [[claude-security-plugin]] (0.94)
- → applies_to [[agent-loops]] (0.80)
- → applies_to [[loop-engineering]] (0.80)
- → part_of [[middleware]] (0.80)
- [[agent-loops]] — 1 shared claim
- [[claude-security-plugin]] — 1 shared claim
- [[loop-engineering]] — 1 shared claim
- [[middleware]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
