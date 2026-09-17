---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
  - {resource: llm-wiki/raw/docs/claude-code/scheduled-tasks.md, title: "Run prompts on a schedule", id: src_1aeabecafdc5}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_scheduled_tasks]
claim_ids: [clm_5780564b3c9e, clm_bd185ee1d648, clm_be385c8101a7, clm_6b4415ff0398, clm_d3c8688a9a26, clm_69d3afaff11e]
confidence: 0.92
stale_after: 2027-01-10
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# scheduled tasks

> **In here:** GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity · 6 claims, confidence 0.92.

## Current understanding

- GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity (0.93)
- Scheduled tasks created inside a Claude Code session are session-scoped: they stop when a new conversation starts, and only unexpired ones return on --resume or --continue (0.93)
- A recurring session-scoped task expires 7 days after creation — firing one last time and then deleting itself — which bounds how long a forgotten loop can run (0.93)
- Supplying an interval to /loop makes Claude convert it into a cron expression and run the prompt on that fixed schedule, confirming the cadence and the job ID (0.93)
- Session-scoped tasks fire only while Claude Code is running and idle, so closing the terminal stops them, though backgrounding the session carries /loop tasks into a background session that keeps running (0.92)
- Three tools sit under session scheduling: CronCreate schedules a task from a 5-field cron expression, CronList shows every task with its ID and prompt, and CronDelete cancels one by ID (0.89)

## Evidence

- `clm_5780564b3c9e` — "GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity."
- `clm_bd185ee1d648` — "Scheduled tasks created inside a Claude Code session are session-scoped: they stop when a new conversation starts, and only unexpired ones return on --resume or --continue." · p 0.93 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "Tasks are session-scoped: they live in the current conversation and stop when you start a new one."
- `clm_be385c8101a7` — "A recurring session-scoped task expires 7 days after creation — firing one last time and then deleting itself — which bounds how long a forgotten loop can run." · p 0.93 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "Recurring tasks automatically expire 7 days after creation. The task fires one final time, then deletes itself. This bounds how long a forgotten loop can run."
- `clm_6b4415ff0398` — "Supplying an interval to /loop makes Claude convert it into a cron expression and run the prompt on that fixed schedule, confirming the cadence and the job ID." · p 0.93 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "When you supply an interval, Claude converts it to a cron expression, schedules the job, and confirms the cadence and job ID."
- `clm_d3c8688a9a26` — "Session-scoped tasks fire only while Claude Code is running and idle, so closing the terminal stops them, though backgrounding the session carries /loop tasks into a background session that keeps running." · p 0.92 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "Tasks only fire while Claude Code is running and idle. Closing the terminal or letting the session exit stops them firing."
- `clm_69d3afaff11e` — "Three tools sit under session scheduling: CronCreate schedules a task from a 5-field cron expression, CronList shows every task with its ID and prompt, and CronDelete cancels one by ID." · p 0.89 · active · 1 support · 0 contradict
  - `src_1aeabecafdc5` Run prompts on a schedule: "| `CronCreate` | Schedule a new task. Accepts a 5-field cron expression, the prompt to run, and whether it recurs or fires once. | | `CronList` | List all scheduled tasks with their IDs, schedules, and prompts."

## Timeline

- 2026-08-23 new_claim `clm_6b4415ff0398` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_69d3afaff11e` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_bd185ee1d648` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_d3c8688a9a26` (src_1aeabecafdc5)
- 2026-08-23 new_claim `clm_be385c8101a7` (src_1aeabecafdc5)
- 2026-08-30 new_claim `clm_5780564b3c9e` (src_7962dafdd21b)

## Related

- ← related_to [[claude-code-github-action]] (0.93)
- ← produces [[loop-command]] (0.93)
- ← produces cron tools (no page yet) (0.92)
- [[loop-command]] — 3 shared claims
- [[claude-code]] — 2 shared claims
- [[claude-code-github-action]] — 1 shared claim
- cron tools (no page yet)
