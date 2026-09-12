---
type: system
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/docs/claude-code/scheduled-tasks.md, title: "Run prompts on a schedule", id: src_1aeabecafdc5}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_loop_command]
claim_ids: [clm_1b9bffef36d2, clm_59b11e9c72c2, clm_be385c8101a7, clm_3e4818ada12a, clm_6b4415ff0398, clm_d3c8688a9a26]
confidence: 0.95
stale_after: 2029-09-29
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# loop command

> **In here:** The /loop bundled skill re-runs a prompt on repeat for as long as the Claude Code session stays open, and both the interval and the prompt are optional · 6 claims, confidence 0.95.

## Current understanding

- A loop's polling or run interval should be matched to how often the underlying thing actually changes, alongside explicit success and stop criteria defined up front (0.98)
- A time-based loop has two surfaces: /loop runs the prompt repeatedly at intervals locally, while /schedule moves the same recurring routine to cloud infrastructure so it no longer depends on a local session staying open (0.98)
- A recurring session-scoped task expires 7 days after creation — firing one last time and then deleting itself — which bounds how long a forgotten loop can run (0.93)
- The /loop bundled skill re-runs a prompt on repeat for as long as the Claude Code session stays open, and both the interval and the prompt are optional (0.93)
- Supplying an interval to /loop makes Claude convert it into a cron expression and run the prompt on that fixed schedule, confirming the cadence and the job ID (0.93)
- Session-scoped tasks fire only while Claude Code is running and idle, so closing the terminal stops them, though backgrounding the session carries /loop tasks into a background session that keeps running (0.92)

## Evidence

- `clm_1b9bffef36d2` — "A loop's polling or run interval should be matched to how often the underlying thing actually changes, alongside explicit success and stop criteria defined up front" · p 0.98 · active · 2 support · 0 contradict
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "Match a loop's polling/run interval to how often the underlying thing actually changes."
  - `src_1aeabecafdc5` Run prompts on a schedule: "When you omit the interval, Claude chooses one dynamically instead of running on a fixed cron schedule."
- `clm_59b11e9c72c2` — "A time-based loop has two surfaces: /loop runs the prompt repeatedly at intervals locally, while /schedule moves the same recurring routine to cloud infrastructure so it no longer depends on a local session staying open" · p 0.98 · active · 2 support · 0 contradict · when: for time-based loops
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "`/loop` runs the prompt repeatedly at intervals locally; `/schedule` moves the same kind of recurring routine to cloud infrastructure so it doesn't depend on a local session staying open."
  - `src_1aeabecafdc5` Run prompts on a schedule: "For scheduling that survives independently of any session, use [Routines](/docs/en/routines) to create a routine on the cloud, set up a [Desktop scheduled task](/docs/en/desktop-scheduled-tasks), or use [GitHub…"
- `clm_be385c8101a7` — "A recurring session-scoped task expires 7 days after creation — firing one last time and then deleting itself — which bounds how long a forgotten loop can run." · p 0.93 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "Recurring tasks automatically expire 7 days after creation. The task fires one final time, then deletes itself. This bounds how long a forgotten loop can run."
- `clm_3e4818ada12a` — "The /loop bundled skill re-runs a prompt on repeat for as long as the Claude Code session stays open, and both the interval and the prompt are optional." · p 0.93 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "The `/loop` [bundled skill](/docs/en/commands) is the quickest way to run a prompt on repeat while the session stays open. Both the interval and the prompt are optional, and what you provide determines how the loop behaves."
- `clm_6b4415ff0398` — "Supplying an interval to /loop makes Claude convert it into a cron expression and run the prompt on that fixed schedule, confirming the cadence and the job ID." · p 0.93 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "When you supply an interval, Claude converts it to a cron expression, schedules the job, and confirms the cadence and job ID."
- `clm_d3c8688a9a26` — "Session-scoped tasks fire only while Claude Code is running and idle, so closing the terminal stops them, though backgrounding the session carries /loop tasks into a background session that keeps running." · p 0.92 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "Tasks only fire while Claude Code is running and idle. Closing the terminal or letting the session exit stops them firing."

## Timeline

- 2026-08-23 new_claim `clm_1b9bffef36d2` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_59b11e9c72c2` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_3e4818ada12a` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_6b4415ff0398` (src_1aeabecafdc5)
- 2026-08-23 support_update `clm_1b9bffef36d2` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_d3c8688a9a26` (src_1aeabecafdc5)
- 2026-08-23 support_update `clm_59b11e9c72c2` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_be385c8101a7` (src_1aeabecafdc5)

## Related

- → part_of [[claude-code]] (0.93)
- → produces [[scheduled-tasks]] (0.93)
- [[scheduled-tasks]] — 3 shared claims
- [[agent-loops]] — 2 shared claims
- [[claude-code]] — 2 shared claims
- [[skills]] — 1 shared claim
- desktop scheduled tasks (no page yet)
- routines (no page yet)
