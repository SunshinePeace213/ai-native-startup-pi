---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/agent-teams.md, title: "Orchestrate teams of Claude Code sessions", id: src_67017872e4a4}
  - {resource: llm-wiki/raw/docs/claude-code/cross-session-messaging.md, title: "Message your other Claude Code sessions", id: src_10e9043d62f0}
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
  - {resource: llm-wiki/raw/docs/claude-code/hooks-guide.md, title: "Automate actions with hooks", id: src_3466a5945e1e}
  - {resource: llm-wiki/raw/docs/claude-code/permission-modes.md, title: "Choose a permission mode", id: src_4a22e1f99f87}
  - {resource: llm-wiki/raw/docs/claude-code/sub-agents.md, title: "Create custom subagents", id: src_5671f6c73f3d}
  - {resource: llm-wiki/raw/docs/claude-code/workflows.md, title: "Orchestrate subagents at scale with dynamic workflows", id: src_d6586d5c5c4f}
  - {resource: llm-wiki/raw/docs/claude-code/worktrees.md, title: "Run parallel sessions with worktrees", id: src_0979d158a4cf}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_permission_mode]
claim_ids: [clm_c6f907387ca6, clm_0db4ee93154e, clm_1dae05957203, clm_826adcc8fb72, clm_1cbbd4529c24, clm_7c3de0c5639e, clm_614484c4baab, clm_64b87a2b64e4, clm_77037ce59207, clm_06937874202e, clm_34217cbae0d3, clm_54afb768c457, clm_29d91a7cbb32, clm_3dcf6b089b87, clm_9d7ccdfee9ae, clm_fa3bd1f7b469, clm_55681f67bc76, clm_e5824e43202d, clm_ce1b361863a3]
confidence: 0.92
stale_after: 2027-01-10
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# permission mode

> **In here:** A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs · 19 claims, confidence 0.92.

## Current understanding

- PreToolUse hooks fire ahead of any permission-mode check, so a hook returning a deny decision blocks the tool even under bypassPermissions or --dangerously-skip-permissions (0.93)
- A permission mode sets which actions Claude can take in a session without asking first, and Manual mode stops for approval before most actions that edit files, run shell commands, or reach the network (0.93)
- A running session's permission mode is switched with Shift+Tab in the CLI, the mode indicator in VS Code, or the mode selector in the desktop app (0.93)
- Plan mode lets Claude read files and run shell commands to explore and then write a plan, while edits to source stay blocked until the plan is approved (0.93)
- Permission modes only set the baseline that allow, ask, and deny rules layer on top of: deny rules block in every mode including `bypassPermissions`, where allow rules have no effect at all (0.93)
- The subagents a dynamic workflow spawns always run in acceptEdits mode with file edits auto-approved and inherit the user's tool allowlist, whatever permission mode the session itself is in (0.93)
- Auto mode replaces routine permission prompts with a separate classifier model that reviews each action and blocks anything escalating beyond the request, targeting unrecognized infrastructure, or driven by hostile content Claude read (0.93)
- A parent session running in bypassPermissions, acceptEdits, or auto mode takes precedence over whatever permission mode a subagent declares in its own frontmatter (0.92)
- A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs (0.92)
- A message from another session never counts as the user's consent, so it cannot answer a pending permission prompt, and the receiving Claude is instructed never to change permission settings, `CLAUDE.md`, or other configuration because another session asked (0.91)
- Claude Code tells a receiving agent that a SendMessage message came from another Claude session rather than the user, so a teammate can neither approve a permission prompt on the user's behalf nor relay a denied action through another teammate (0.91)
- Every teammate starts with the lead's permission settings, including --dangerously-skip-permissions, and an individual teammate's mode can only be changed after spawning, never set at spawn time (0.91)
- `bypassPermissions` mode disables permission prompts and safety checks so tool calls execute immediately, including writes to protected paths (0.91)
- `acceptEdits` mode auto-approves file edits plus the common filesystem Bash commands `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, and `sed`, but only for paths inside the working directory or `additionalDirectories` (0.91)
- `dontAsk` mode auto-denies every tool call that would otherwise prompt, leaving Claude only the actions matching `permissions.allow` rules, read-only Bash commands, and calls a `PreToolUse` hook approves (0.91)
- Entering a worktree path outside the repository's `.claude/worktrees/` directory always asks for approval — no EnterWorktree permission rule or "don't ask again" choice suppresses it, only bypassPermissions mode — because the move takes the session's working directory, write access, and project configuration with it (0.91)
- With no `crossSessionInbound` value in effect, a receiving session that prompts for permissions delivers each message and holds one only when the sender bypasses permission prompts, while a receiving session that bypasses prompts holds every message for approval unless the sender also bypasses (0.91)
- Setting `isolatePeerMachines` to `true` requires the user's approval before any message reaches a session beyond this machine, even in `bypassPermissions` mode, and a `true` from any settings scope applies so a checked-in project file can turn the requirement on but not off (0.91)
- The `--allowedTools` flag pre-approves tools for a non-interactive run using permission rule syntax, where a trailing space-asterisk enables prefix matching so `Bash(git diff *)` allows any command starting with `git diff` (0.90)

## Evidence

- `clm_c6f907387ca6` — "PreToolUse hooks fire ahead of any permission-mode check, so a hook returning a deny decision blocks the tool even under bypassPermissions or --dangerously-skip-permissions." · p 0.93 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "`PreToolUse` hooks fire before any permission-mode check, in every [permission mode](/docs/en/permission-modes), including `dontAsk`."
- `clm_0db4ee93154e` — "A permission mode sets which actions Claude can take in a session without asking first, and Manual mode stops for approval before most actions that edit files, run shell commands, or reach the network." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "A permission mode sets which actions Claude can take in a session without asking you first. In Manual mode, Claude Code stops and asks you before most actions that edit files, run shell commands, or reach the network."
- `clm_1dae05957203` — "A running session's permission mode is switched with Shift+Tab in the CLI, the mode indicator in VS Code, or the mode selector in the desktop app." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "Control whether Claude asks before acting. Switch permission modes with Shift+Tab in the CLI, the mode indicator in VS Code, or the mode selector in Desktop."
- `clm_826adcc8fb72` — "Plan mode lets Claude read files and run shell commands to explore and then write a plan, while edits to source stay blocked until the plan is approved." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "Plan mode tells Claude to research and propose changes without making them. Claude reads files, runs shell commands to explore, and writes a plan, but does not edit your source."
- `clm_1cbbd4529c24` — "Permission modes only set the baseline that allow, ask, and deny rules layer on top of: deny rules block in every mode including `bypassPermissions`, where allow rules have no effect at all." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "Modes set the baseline. Layer [permission rules](/docs/en/permissions#manage-permissions) on top to pre-approve or block specific tools. Deny rules block in every mode, including `bypassPermissions`."
- `clm_7c3de0c5639e` — "The subagents a dynamic workflow spawns always run in acceptEdits mode with file edits auto-approved and inherit the user's tool allowlist, whatever permission mode the session itself is in." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "Your permission mode controls only the launch prompt above."
- `clm_614484c4baab` — "Auto mode replaces routine permission prompts with a separate classifier model that reviews each action and blocks anything escalating beyond the request, targeting unrecognized infrastructure, or driven by hostile content Claude read." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "Auto mode lets Claude execute without routine permission prompts."
- `clm_64b87a2b64e4` — "A parent session running in bypassPermissions, acceptEdits, or auto mode takes precedence over whatever permission mode a subagent declares in its own frontmatter." · p 0.92 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "If the parent uses `bypassPermissions` or `acceptEdits`, this takes precedence and can't be overridden."
- `clm_77037ce59207` — "A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs." · p 0.92 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "To set a baseline for the whole session instead of listing individual tools, pass a [permission mode](/docs/en/permission-modes)."
- `clm_06937874202e` — "A message from another session never counts as the user's consent, so it cannot answer a pending permission prompt, and the receiving Claude is instructed never to change permission settings, `CLAUDE.md`, or other configuration because another session asked." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "* **It can't approve anything**: a message from another session never counts as your consent, so it can't answer a pending permission prompt on your behalf."
- `clm_34217cbae0d3` — "Claude Code tells a receiving agent that a SendMessage message came from another Claude session rather than the user, so a teammate can neither approve a permission prompt on the user's behalf nor relay a denied action through another teammate." · p 0.91 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "When one agent sends another a message over `SendMessage`, Claude Code tells the receiving agent the message came from another Claude session, not from you."
- `clm_54afb768c457` — "Every teammate starts with the lead's permission settings, including --dangerously-skip-permissions, and an individual teammate's mode can only be changed after spawning, never set at spawn time." · p 0.91 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Teammates start with the lead's permission settings. If the lead runs with `--dangerously-skip-permissions`, all teammates do too. After spawning, you can change individual teammate modes, but you can't set per-teammate modes at spawn time."
- `clm_29d91a7cbb32` — "`bypassPermissions` mode disables permission prompts and safety checks so tool calls execute immediately, including writes to protected paths." · p 0.91 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "`bypassPermissions` mode disables permission prompts and safety checks so tool calls execute immediately, including writes to [protected paths](#protected-paths)."
- `clm_3dcf6b089b87` — "`acceptEdits` mode auto-approves file edits plus the common filesystem Bash commands `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, and `sed`, but only for paths inside the working directory or `additionalDirectories`." · p 0.91 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "In addition to file edits, `acceptEdits` mode auto-approves common filesystem Bash commands: `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, and `sed`."
- `clm_9d7ccdfee9ae` — "`dontAsk` mode auto-denies every tool call that would otherwise prompt, leaving Claude only the actions matching `permissions.allow` rules, read-only Bash commands, and calls a `PreToolUse` hook approves." · p 0.91 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "If you set `dontAsk` mode, Claude Code auto-denies every tool call that would otherwise prompt you."
- `clm_fa3bd1f7b469` — "Entering a worktree path outside the repository's `.claude/worktrees/` directory always asks for approval — no EnterWorktree permission rule or "don't ask again" choice suppresses it, only bypassPermissions mode — because the move takes the session's working directory, write access, and project configuration with it." · p 0.91 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "When Claude enters a path outside the repository's `.claude/worktrees/` directory, Claude Code asks for your approval first, because the move takes the session's working directory, write access, and project configuration such as…"
- `clm_55681f67bc76` — "With no `crossSessionInbound` value in effect, a receiving session that prompts for permissions delivers each message and holds one only when the sender bypasses permission prompts, while a receiving session that bypasses prompts holds every message for approval unless the sender also bypasses." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "* **The receiving session prompts for permissions**: Claude Code delivers each message. It holds one for your approval only when the sending session identifies itself as bypassing permission prompts."
- `clm_e5824e43202d` — "Setting `isolatePeerMachines` to `true` requires the user's approval before any message reaches a session beyond this machine, even in `bypassPermissions` mode, and a `true` from any settings scope applies so a checked-in project file can turn the requirement on but not off." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "With this set, Claude Code asks for your approval before Claude's message to a session beyond this machine leaves, even in `bypassPermissions` mode, which skips ordinary permission prompts."
- `clm_ce1b361863a3` — "The `--allowedTools` flag pre-approves tools for a non-interactive run using permission rule syntax, where a trailing space-asterisk enables prefix matching so `Bash(git diff *)` allows any command starting with `git diff`." · p 0.90 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "The `--allowedTools` flag uses [permission rule syntax](/docs/en/settings-reference#permission-rule-syntax). The trailing ` *` enables prefix matching, so `Bash(git diff *)` allows any command starting with `git diff`."

## Timeline

- 2026-08-23 new_claim `clm_55681f67bc76` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_06937874202e` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_e5824e43202d` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_7c3de0c5639e` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_fa3bd1f7b469` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_64b87a2b64e4` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_34217cbae0d3` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_54afb768c457` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_c6f907387ca6` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_0db4ee93154e` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_3dcf6b089b87` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_826adcc8fb72` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_614484c4baab` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_9d7ccdfee9ae` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_29d91a7cbb32` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_1cbbd4529c24` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_1dae05957203` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_ce1b361863a3` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_77037ce59207` (src_d5ec157b2e7b)

## Related

- ← applies_to [[permission-rule]] (0.93)
- ← depends_on [[agent-teams]] (0.93)
- ← depends_on [[cross-session-messaging]] (0.92)
- ← depends_on [[subagents]] (0.92)
- ← uses [[non-interactive-mode]] (0.92)
- [[claude-code]] — 17 shared claims
- [[cross-session-messaging]] — 3 shared claims
- [[agent-teams]] — 2 shared claims
- [[non-interactive-mode]] — 2 shared claims
- [[permission-rule]] — 2 shared claims
- [[subagents]] — 2 shared claims
- [[auto-mode]] — 1 shared claim
- [[auto-mode-classifier]] — 1 shared claim
- [[dynamic-workflows]] — 1 shared claim
- [[git-worktree]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[team-lead]] — 1 shared claim
