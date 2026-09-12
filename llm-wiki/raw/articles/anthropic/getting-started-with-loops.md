---
source: https://claude.com/blog/getting-started-with-loops
fetched: 2026-08-23
author: Delba de Oliveira and Michael Segner (Claude Code team)
last_modified: 2026-06-30
---
> **In here:** the four loop types the Claude Code team defines (turn-based, goal-based, time-based, proactive) · how to pick trigger/stop/verification for each · advice on code quality and token-usage management when running loops.

# Loop engineering: Getting started with loops

Note: this archive is a faithful paraphrase of the article's structure and content rather than a verbatim copy of its prose, per platform copyright-reproduction guidance. Every section, list, example, and the comparison table below are preserved; only the original sentence-level wording of the periodical text has been rephrased.

## Overview

The Claude Code team defines a "loop" as an agent repeating cycles of work until a stop condition is met. The article categorizes loops along three axes: what triggers them, what stops them, and what kinds of tasks they suit. It walks through four loop types — turn-based, goal-based, time-based, and proactive — then gives guidance on maintaining code quality and managing token usage inside loops, and closes with a "getting started" strategy.

## Turn-based loops

- **Trigger**: a user prompt.
- **Stop condition**: Claude judges the task complete, or determines it needs more context/input.
- **Best for**: shorter, non-recurring tasks — exploration and decisions.
- **Recommendation**: improve Claude's self-verification by encoding manual checks as `SKILL.md` files, so Claude can verify its own work end-to-end with quantitative checks instead of subjective judgment.
- **Example skill content**: verifying a frontend change by starting the dev server, interacting with UI elements, checking the browser console, and running a performance audit before declaring the work done.

## Goal-based loop (`/goal`)

- **Trigger**: a manual prompt in real time, with a defined success criterion.
- **Stop condition**: the goal is achieved, or a maximum number of turns is reached.
- **Best for**: tasks with a verifiable exit condition, including ones that need iteration.
- **Mechanism**: an evaluator model checks after each iteration whether the success criteria have been met, rather than Claude trying to judge its own completion.
- **Example prompt**: "/goal get the homepage Lighthouse score to 90 or above, stop after 5 tries."

## Time-based loop (`/loop` and `/schedule`)

- **Trigger**: a specified time interval.
- **Stop condition**: cancellation, or the work completing.
- **Best for**: recurring tasks, or tasks that watch/interface with external systems.
- **Mechanism**: `/loop` runs the prompt repeatedly at intervals locally; `/schedule` moves the same kind of recurring routine to cloud infrastructure so it doesn't depend on a local session staying open.
- **Example prompt**: "/loop 5m check my PR, address review comments, and fix failing CI."

## Proactive loops

- **Trigger**: an event or a schedule, without a human kicking off each run.
- **Stop condition**: per-task, once the underlying goal for that run is achieved.
- **Best for**: well-defined, recurring work that can run unattended for a long time, such as bug triage.
- **Mechanism**: composes `/schedule`, `/goal`, skills, dynamic workflows, and auto mode together.
- **Example**: checking user feedback hourly, triaging all incoming reports, and using parallel worktrees with adversarial (second-agent) review to process them.

## Maintaining code quality

- Keep the codebase clean and follow its existing patterns.
- Enable Claude's self-verification by giving it skills it can run to check its own work.
- Keep documentation accessible so Claude (and the loop) can find it.
- Use a second agent for code review to reduce the bias of an agent reviewing its own output.

## Managing token usage

- Select primitives and models that match the task's actual complexity — don't default to the heaviest option.
- Define explicit success and stop criteria up front.
- Pilot a dynamic workflow at small scale before running it broadly.
- Use scripts for deterministic steps instead of having the model reason through them each time.
- Match a loop's polling/run interval to how often the underlying thing actually changes.
- Monitor usage with the `/usage`, `/goal`, and `/workflows` commands.

## Getting started

Identify a bottleneck task in your current workflow, then decide which piece — verification quality, goal clarity, or scheduling — could be automated with a loop. Start with a simple loop, observe the results, and iterate on its design from there.

## Comparison table

| Loop Type | Trigger | Stop Condition | Best For | Primary Tool |
| ----------- | --------- | ---------------- | ---------- | -------------- |
| Turn-based | User prompt | Claude judges completion | Exploration/decisions | Custom skills |
| Goal-based | Manual prompt | Goal met or turn limit | Verifiable completion | `/goal` |
| Time-based | Schedule interval | Cancellation or work done | Recurring/external systems | `/loop`, `/schedule` |
| Proactive | Event/schedule | Goal achieved per task | Well-defined recurring work | Workflow orchestration |

## Images referenced on the page

The article page includes several decorative/illustrative SVG graphics (an article header graphic, diagrams accompanying the turn-based, goal-based, and proactive loop sections, and related-article thumbnail graphics). These are illustrative diagrams without extractable alt-text captions describing specific data, and are not reproduced here.
