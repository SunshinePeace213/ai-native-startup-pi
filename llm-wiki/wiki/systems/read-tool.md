---
type: system
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/docs/claude-code/tools-reference.md, title: "Tools reference", id: src_ab9f8f38615f}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_read_tool]
claim_ids: [clm_673360e615f7, clm_f10e48934a62, clm_493ab693d20c]
confidence: 0.93
stale_after: 2029-09-29
last_rendered: 2026-08-23T14:39:21Z
review_required: false
---

# Read tool

> **In here:** The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count · 3 claims, confidence 0.93.

## Current understanding

- A whole-file Read that exceeds the token limit returns only the first page with a `PARTIAL view` notice explaining how to continue with `offset` and `limit`, whereas a read that already passes an explicit `offset` or `limit` and still overflows returns an error instead (0.93)
- In Claude Code an `Edit(...)` allow rule also grants read access to the same path, and a `Read(...)` deny rule also blocks Edit and Write there — including creating a new file — because both write tools change content Claude has to read back (0.93)
- The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count — though newer models may edit an unread file when reading it would need no permission prompt and the Read tool is available (0.92)

## Evidence

- `clm_673360e615f7` — "A whole-file Read that exceeds the token limit returns only the first page with a `PARTIAL view` notice explaining how to continue with `offset` and `limit`, whereas a read that already passes an explicit `offset` or `limit` and still overflows returns an error instead." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "By default, Read returns the file from the start."
- `clm_f10e48934a62` — "In Claude Code an `Edit(...)` allow rule also grants read access to the same path, and a `Read(...)` deny rule also blocks Edit and Write there — including creating a new file — because both write tools change content Claude has to read back." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "An `Edit(...)` allow rule also grants read access to the same path, so you don't need a matching `Read(...)` rule."
- `clm_493ab693d20c` — "The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count — though newer models may edit an unread file when reading it would need no permission prompt and the Read tool is available." · p 0.92 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "**Read-before-edit**: Claude reads the file in the current conversation before editing it, and a read cut short with a [`PARTIAL view` notice](#read-tool-behavior) doesn't count."

## Timeline

- 2026-08-23 new_claim `clm_f10e48934a62` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_493ab693d20c` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_673360e615f7` (src_ab9f8f38615f)

## Related

- ← depends_on [[edit-tool]] (0.92)
- [[edit-tool]] — 2 shared claims
- [[context-window]] — 1 shared claim
- [[permission-rule]] — 1 shared claim
- Write tool (no page yet)
