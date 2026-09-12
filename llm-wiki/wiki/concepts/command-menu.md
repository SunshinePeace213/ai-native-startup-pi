---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/commands.md, title: "Commands", id: src_63b61512d6ab}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_command_menu]
claim_ids: [clm_256e3568a77d, clm_714f78c08bf2, clm_f39d19cef3a9]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# command menu

> **In here:** After a typo the command menu highlights nothing and still lists the close matches, so pressing Enter submits the text as typed and reports an Unknown command error instead of running the nearest… · 3 claims, confidence 0.92.

## Current understanding

- After a typo the command menu highlights nothing and still lists the close matches, so pressing Enter submits the text as typed and reports an Unknown command error instead of running the nearest match (0.92)
- A few available commands are kept out of Claude Code's slash-command menu by design and a partial name never surfaces them; the command is listed only once its full name is typed, and submitting that full name runs it (0.92)
- Claude Code highlights the top suggestion in the slash-command menu only when the typed letters match a command's name or alias from the start of the name or of a word within it, ignoring the ':', '_', and '-' separators (0.91)

## Evidence

- `clm_256e3568a77d` — "After a typo the command menu highlights nothing and still lists the close matches, so pressing Enter submits the text as typed and reports an Unknown command error instead of running the nearest match." · p 0.92 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "**After a typo**: Claude Code highlights nothing. The close matches stay listed, and you can pick one with `Tab` or the arrow keys, but `Enter` submits your text as typed and reports [Unknown command](/docs/en/errors#unknown-command)."
- `clm_714f78c08bf2` — "A few available commands are kept out of Claude Code's slash-command menu by design and a partial name never surfaces them; the command is listed only once its full name is typed, and submitting that full name runs it." · p 0.92 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "**Hidden commands**: Claude Code keeps a few available commands, such as `/heapdump`, out of the menu by design."
- `clm_f39d19cef3a9` — "Claude Code highlights the top suggestion in the slash-command menu only when the typed letters match a command's name or alias from the start of the name or of a word within it, ignoring the ':', '_', and '-' separators." · p 0.91 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "**Highlighting**: Claude Code highlights the top suggestion only when the letters after the `/` match a command's name or alias, from the start of the name or from a word within it, ignoring the `:`, `_`, and `-` separators."

## Timeline

- 2026-08-23 new_claim `clm_f39d19cef3a9` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_256e3568a77d` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_714f78c08bf2` (src_63b61512d6ab)

## Related

- [[claude-code]] — 3 shared claims
- [[slash-command]] — 1 shared claim
