---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/cli-reference.md, title: "CLI reference", id: src_716248fd9713}
  - {resource: llm-wiki/raw/docs/pi/environment-variables.md, title: "Environment Variables", id: src_7f85c02fc39f}
  - {resource: llm-wiki/raw/docs/pi/sdk.md, title: "SDK", id: src_0954e1c03a59}
  - {resource: llm-wiki/raw/docs/pi/session-format.md, title: "Session File Format", id: src_92c377275d79}
  - {resource: llm-wiki/raw/docs/pi/sessions.md, title: "Sessions", id: src_6888abe7e7b7}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_session]
claim_ids: [clm_3e71ac2b4ab0, clm_1ca09b98434f, clm_16beff4fdac1, clm_bf4a18007e2f, clm_ca4184507217, clm_108f88ad9156, clm_fc7bcaeb694d, clm_39ba7e3822d8, clm_8a1d3d106aae, clm_be8b43ff7593, clm_64156597f767, clm_a1a7d67456ed, clm_87f54b7b4618]
confidence: 0.92
stale_after: 2027-01-10
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# session

> **In here:** A Pi session file is JSONL where each line is a typed JSON object, and entries form a tree through id and parentId so branching happens in place rather than by creating new files · 13 claims, confidence 0.92.

## Current understanding

- A Pi session file is JSONL where each line is a typed JSON object, and entries form a tree through id and parentId so branching happens in place rather than by creating new files (0.94)
- A Pi session is a tree whose every entry carries an id and parentId with the current position as the active leaf, so /tree can jump back to any earlier point and continue from there inside the same file (0.93)
- Pi's runtime API is the layer for replacing the active session and rebuilding cwd-bound state, and it is the same one the built-in interactive, print, and RPC modes run on (0.93)
- Pi session files carry a version in the header and older ones migrate automatically to the current version, v3, when loaded (0.92)
- Pi auto-saves every session to ~/.pi/agent/sessions/ organized by working directory, one JSONL file per session holding a tree structure (0.92)
- When /tree leaves one branch for another, Pi can summarize the abandoned branch and attach that summary at the new position, carrying the context forward without replaying the whole branch (0.92)
- In Pi, /tree keeps alternative branches together in one session file while /fork and /clone each split the work into a separate session file (0.92)
- Pi resolves the PI_* session variables when each shell command starts, so switching model or reasoning level reaches the next shell command without restarting Pi (0.92)
- A Pi CustomEntry persists extension state in the session file without taking part in the LLM context (0.92)
- A Pi compaction entry must carry firstKeptEntryId, naming the oldest entry retained: rebuilding context swaps the summarized entries for the summary and keeps everything from that entry onward (0.92)
- A Pi CustomMessageEntry is the extension-injected counterpart that does enter the LLM context, unlike a CustomEntry (0.92)
- claude --resume takes a session ID or name or shows an interactive picker, and when given an ID it searches the current project directory and its git worktrees first, then every other project on the machine (0.89)
- claude --continue loads the most recent conversation in the current directory but skips background sessions, sessions created with claude -p or the Agent SDK, and sessions whose first prompt was /loop; adding -p brings those excluded sessions back into scope (0.89)

## Evidence

- `clm_3e71ac2b4ab0` — "A Pi session file is JSONL where each line is a typed JSON object, and entries form a tree through id and parentId so branching happens in place rather than by creating new files." · p 0.94 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "Sessions are stored as JSONL (JSON Lines) files. Each line is a JSON object with a `type` field. Session entries form a tree structure via `id`/`parentId` fields, enabling in-place branching without creating new files."
- `clm_1ca09b98434f` — "A Pi session is a tree whose every entry carries an id and parentId with the current position as the active leaf, so /tree can jump back to any earlier point and continue from there inside the same file." · p 0.93 · active · 1 support · 0 contradict
  - `src_6888abe7e7b7` Sessions: "Sessions are stored as trees. Every entry has an `id` and `parentId`, and the current position is the active leaf. `/tree` lets you jump to any previous point and continue from there without creating a new file."
- `clm_16beff4fdac1` — "Pi's runtime API is the layer for replacing the active session and rebuilding cwd-bound state, and it is the same one the built-in interactive, print, and RPC modes run on." · p 0.93 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "Use the runtime API when you need to replace the active session and rebuild cwd-bound runtime state. This is the same layer used by the built-in interactive, print, and RPC modes."
- `clm_bf4a18007e2f` — "Pi session files carry a version in the header and older ones migrate automatically to the current version, v3, when loaded." · p 0.92 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "Existing sessions are automatically migrated to the current version (v3) when loaded."
- `clm_ca4184507217` — "Pi auto-saves every session to ~/.pi/agent/sessions/ organized by working directory, one JSONL file per session holding a tree structure." · p 0.92 · active · 1 support · 0 contradict
  - `src_6888abe7e7b7` Sessions: "Sessions auto-save to `~/.pi/agent/sessions/`, organized by working directory. Each session is a JSONL file with a tree structure."
- `clm_108f88ad9156` — "When /tree leaves one branch for another, Pi can summarize the abandoned branch and attach that summary at the new position, carrying the context forward without replaying the whole branch." · p 0.92 · active · 1 support · 0 contradict
  - `src_6888abe7e7b7` Sessions: "When `/tree` switches away from one branch to another, pi can summarize the abandoned branch and attach that summary at the new position. This preserves important context from the path you left without replaying the whole branch."
- `clm_fc7bcaeb694d` — "In Pi, /tree keeps alternative branches together in one session file while /fork and /clone each split the work into a separate session file." · p 0.92 · active · 1 support · 0 contradict
  - `src_6888abe7e7b7` Sessions: "Use `/tree` when you want to keep alternatives together. Use `/fork` or `/clone` when you want a separate session file."
- `clm_39ba7e3822d8` — "Pi resolves the PI_* session variables when each shell command starts, so switching model or reasoning level reaches the next shell command without restarting Pi." · p 0.92 · active · 1 support · 0 contradict
  - `src_7f85c02fc39f` Environment Variables: "The values are resolved when each command starts. Switching models or changing the reasoning level therefore affects the next shell command without restarting Pi."
- `clm_8a1d3d106aae` — "A Pi CustomEntry persists extension state in the session file without taking part in the LLM context." · p 0.92 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "Extension state persistence. Does NOT participate in LLM context."
- `clm_be8b43ff7593` — "A Pi compaction entry must carry firstKeptEntryId, naming the oldest entry retained: rebuilding context swaps the summarized entries for the summary and keeps everything from that entry onward." · p 0.92 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "`firstKeptEntryId` is required. It identifies the first entry retained from before the compaction entry. When rebuilding context, Pi replaces older summarized entries with the compaction summary and keeps the range beginning at this entry."
- `clm_64156597f767` — "A Pi CustomMessageEntry is the extension-injected counterpart that does enter the LLM context, unlike a CustomEntry." · p 0.92 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "Extension-injected messages that DO participate in LLM context."
- `clm_a1a7d67456ed` — "claude --resume takes a session ID or name or shows an interactive picker, and when given an ID it searches the current project directory and its git worktrees first, then every other project on the machine." · p 0.89 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "| `--resume`, `-r` | Resume a specific session by ID or name, or show an interactive picker to choose a session. The picker and name search include sessions that added this directory with `/add-dir`."
- `clm_87f54b7b4618` — "claude --continue loads the most recent conversation in the current directory but skips background sessions, sessions created with claude -p or the Agent SDK, and sessions whose first prompt was /loop; adding -p brings those excluded sessions back into scope." · p 0.89 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "| `--continue`, `-c` | Load the most recent conversation in the current directory, skipping [background sessions, sessions created with `claude -p` or the Agent SDK, and sessions whose first prompt was…"

## Timeline

- 2026-08-23 new_claim `clm_87f54b7b4618` (src_716248fd9713)
- 2026-08-23 new_claim `clm_a1a7d67456ed` (src_716248fd9713)
- 2026-09-11 new_claim `clm_ca4184507217` (src_6888abe7e7b7)
- 2026-09-11 new_claim `clm_1ca09b98434f` (src_6888abe7e7b7)
- 2026-09-11 new_claim `clm_fc7bcaeb694d` (src_6888abe7e7b7)
- 2026-09-11 new_claim `clm_108f88ad9156` (src_6888abe7e7b7)
- 2026-09-11 new_claim `clm_39ba7e3822d8` (src_7f85c02fc39f)
- 2026-09-11 new_claim `clm_3e71ac2b4ab0` (src_92c377275d79)
- 2026-09-11 new_claim `clm_bf4a18007e2f` (src_92c377275d79)
- 2026-09-11 new_claim `clm_8a1d3d106aae` (src_92c377275d79)
- 2026-09-11 new_claim `clm_64156597f767` (src_92c377275d79)
- 2026-09-11 new_claim `clm_be8b43ff7593` (src_92c377275d79)
- 2026-09-11 new_claim `clm_16beff4fdac1` (src_0954e1c03a59)

## Related

- ← produces [[pi]] (1.00)
- ← applies_to [[compaction]] (0.93)
- ← uses [[pi-extension]] (0.93)
- → related_to [[context-window]] (0.92)
- [[pi]] — 11 shared claims
- [[claude-code]] — 2 shared claims
- [[context-window]] — 2 shared claims
- [[pi-extension]] — 2 shared claims
- [[bash-tool]] — 1 shared claim
- [[claude-agent-sdk]] — 1 shared claim
- [[compaction]] — 1 shared claim
- [[pi-sdk]] — 1 shared claim
