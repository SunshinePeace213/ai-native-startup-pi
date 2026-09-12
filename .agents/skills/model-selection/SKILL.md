---
name: model-selection
description: >-
  Stamps a model and effort on a task, an agent, or a workflow stage from the
  repo's roster, and decides what to raise when the output misses — the model
  or the effort. Use whenever a model has to be chosen or changed: which model
  for X, is sonnet enough, this is too expensive, use a cheaper one, the
  reviewer keeps failing it, redo it on a better model, what effort should
  this run at; when a plan, agent file, or `.pi/settings.json` needs a `model`
  or `thinking` value; and when a run bailed early, skipped files, or came
  back confidently wrong; and when one model is proposed in place of another
  for a role. Fire even when no model is named — "make this cheaper", "why
  did it give up", "can a smaller one do this" are this. Not for writing the
  agent file itself (meta-agent), not for prompt or context fixes to try
  before any escalation, not for whether to adopt or drop a provider at all
  (a strategy question — grilling), and not for evaluating whether a skill
  helps (agent-self-evals).
---

# Model selection

Agents stamp models by habit: the session's own model everywhere, a cheaper
tier "to save tokens", the same tier again after a failed review, a bigger
model when the run only needed more effort. This skill routes every choice
through one roster and one diagnosis, and records the stamp where it takes
effect — never in a template, task, or command.

## Steps

1. **Read `references/roster.md`** — the tiers, their axes, and the effort
   ladder. Every number there carries the wiki claim it rests on; a figure
   with no claim behind it is a house judgment and says so.

2. **Classify the work** on one row:

   | Work | Default | Why |
   | --- | --- | --- |
   | Orchestrator, planner, anything that judges or consolidates | `opus` at the provider default | Anthropic's own rule: *start with Opus 5 for most workloads* |
   | Delegated, scoped implementation; review fixes; guarded mechanical flows | `sonnet` at the provider default | The subagent workhorse |
   | Long-horizon autonomous run that `opus` at higher effort still fails; deep specs | `fable` | Anthropic's escalation trigger, verbatim |
   | Fable-grade coding or long-horizon knowledge work where per-task cost matters; the second-opinion reviewer for Claude-authored code | `astra` | Ties Fable 5.1 at ~40–60 % of its cost per task; a different model family reviews |
   | Utility micro-task — eligibility, classification, summary, scoring | `luna` (fallback `haiku`) | Cheapest tier with 1M context and effort control; Haiku has neither |
   | Presentation-heavy deliverable — slides, spreadsheets | `sol` | Highest Presentation Elo of any model |
   | Anything user-facing (UI, copy, API design) | a tier with taste ≥ 7 | |

3. **Stamp the effort** at the provider's default and move from there:
   `high` on Claude, `medium` on GPT, nothing on Haiku (it has no effort
   parameter — a stamp on it sets nothing). Step down for routine,
   precisely specified work; step up for demanding agentic or
   capability-sensitive work. A step that must run unattended end to end, or
   whose job is verification, never goes below `medium`. Never stamp below
   the default to save tokens.

4. **Write the stamp where it binds**: `.pi/settings.json` →
   `subagents.agentOverrides.<agent>.model` for an agent; the plan's task row
   for a workflow stage; `--model provider/id:<effort>` for a one-off run.
   Model IDs are `anthropic/claude-<name>` and `openai-codex/gpt-<name>` as
   `pi --list-models` prints them. An agent file never carries a `model`.

5. **When the output misses, diagnose before escalating.** First check the
   prompt, the context, and the scoping — a task that shouldn't need
   escalation is usually starved upstream. Then pick the axis by the failure:

   | It… | Raise |
   | --- | --- |
   | didn't *know* enough — subtle bug, unfamiliar domain, confidently wrong however much context it had | the **model** |
   | didn't *try* hard enough — skipped a file, skipped the tests, bailed mid-task, checked back in early | the **effort** |

   Astra's known failure is the second kind: it takes far fewer turns than
   Claude (24 vs 60 per task) — raise its effort before switching model.

6. **Escalate one tier, never retry the same one.** A fix that failed a review
   round moves up one step on the axis step 5 named. Standing permission: if a
   cheaper tier's output misses the bar, redo it on a smarter tier without
   asking — judge the output, not the price tag. When torn between two tiers,
   take the higher. When axes conflict for anything that ships:
   intelligence > taste > cost. Cost is a tie-breaker only; this overrides any
   global token budget in this repo.

7. **Re-stamp on a model change.** Effort names are shared across models but
   not amounts — Sonnet 5 `medium` ≈ Sonnet 4.6 `high`; GPT `medium` is a
   default, Claude `medium` is a step down. Carrying a level over is a bug.

## Output

```text
<task or agent> → <model id>:<effort>
  row: <the roster row it matched>
  because: <one line — the failure diagnosed, or the work classified>
  written to: <.pi/settings.json path | plan row | command line>
```

## Gotchas

- `fable` at `low` still outscores a cheaper tier at higher effort for similar
  per-task cost — weigh it before stamping `sonnet` or `luna` on work that
  needs judgment. But at `low` Fable 5.1 skips search and retrieval tools it
  would otherwise call; a task that must look things up runs at `medium`+.
- `terra` is dominated: for every Terra effort there is a Luna or Sol setting
  that is smarter for the same cost or as smart for less. It is not on the
  roster.
- Haiku's knowledge cutoff is Feb 2025 — a year behind Sonnet's — and its
  context is 200K. It stays only as the fallback when Luna is unavailable,
  until a head-to-head eval settles it.
- Through Pi's `openai-codex` provider the GPT context is 272K, not the API's
  1.05M; above 272K the API bills 2× input and 1.5× output for the whole
  request anyway.
- `sol`'s $4/$20 is promotional through 21 Nov 2026 (list $5/$30) — re-stamp
  after. `none` effort works on GPT-5.6 and returns HTTP 400 on Astra.
- Fable 5.1 cache reads are $0.25/MTok (0.025×), four times cheaper than every
  other Claude model — a long session on a stable prefix pays far below
  sticker, which is why per-task cost, not list price, is the roster's axis.
- The two Artificial Analysis articles use different index versions; scores
  across them do not compare. Within one article they do.
