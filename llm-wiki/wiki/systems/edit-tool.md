---
type: system
status: current
created: 2026-08-23
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
  - {resource: llm-wiki/raw/docs/claude-code/tools-reference.md, title: "Tools reference", id: src_ab9f8f38615f}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_edit_tool]
claim_ids: [clm_bcaacdc975c2, clm_f10e48934a62, clm_493ab693d20c]
confidence: 0.93
stale_after: 2029-09-29
last_rendered: 2026-09-02T10:03:36Z
review_required: false
---

# Edit tool

> **In here:** The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count · 3 claims, confidence 0.93.

## Current understanding

- Claude Fable 5.1 is more likely than Claude Fable 5 to rewrite an entire text file rather than make a targeted edit; the resulting file is usually the same, but unless the file is short or most of it is changing the rewrite costs more output tokens and time (0.93)
- In Claude Code an `Edit(...)` allow rule also grants read access to the same path, and a `Read(...)` deny rule also blocks Edit and Write there — including creating a new file — because both write tools change content Claude has to read back (0.93)
- The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count — though newer models may edit an unread file when reading it would need no permission prompt and the Read tool is available (0.92)

## Evidence

- `clm_bcaacdc975c2` — "Claude Fable 5.1 is more likely than Claude Fable 5 to rewrite an entire text file rather than make a targeted edit; the resulting file is usually the same, but unless the file is short or most of it is changing the rewrite costs more output tokens and time." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1 is more likely than Claude Fable 5 to rewrite an entire text file rather than make a targeted edit."
- `clm_f10e48934a62` — "In Claude Code an `Edit(...)` allow rule also grants read access to the same path, and a `Read(...)` deny rule also blocks Edit and Write there — including creating a new file — because both write tools change content Claude has to read back." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "An `Edit(...)` allow rule also grants read access to the same path, so you don't need a matching `Read(...)` rule."
- `clm_493ab693d20c` — "The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count — though newer models may edit an unread file when reading it would need no permission prompt and the Read tool is available." · p 0.92 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "**Read-before-edit**: Claude reads the file in the current conversation before editing it, and a read cut short with a [`PARTIAL view` notice](#read-tool-behavior) doesn't count."

## Timeline

- 2026-08-23 new_claim `clm_f10e48934a62` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_493ab693d20c` (src_ab9f8f38615f)
- 2026-09-02 new_claim `clm_bcaacdc975c2` (src_9f2ae1e705ce)

## Related

- ← applies_to [[permission-rule]] (0.93)
- ← uses [[claude-fable-5-1]] (0.93)
- → depends_on [[read-tool]] (0.92)
- [[read-tool]] — 2 shared claims
- [[claude-fable-5-1]] — 1 shared claim
- [[permission-rule]] — 1 shared claim
- Write tool (no page yet)
