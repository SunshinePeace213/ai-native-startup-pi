---
source: https://agentskills.io/skill-creation/evaluating-skills
also: https://agentskills.io/skill-creation/optimizing-descriptions
fetched: 2026-08-25
---

# Evaluating a skill

Two separate questions, two separate loops. **Does it trigger?** is decided by
the description alone. **Does it help?** is decided by the body. Fix each with
its own evidence.

## Output quality — does the body help?

### Test cases

`evals/evals.json` inside the skill directory:

```json
{
  "skill_name": "csv-analyzer",
  "evals": [
    {
      "id": 1,
      "prompt": "I have monthly sales in data/sales_2025.csv — top 3 months by revenue as a bar chart?",
      "expected_output": "A bar chart of the top 3 months with labeled axes.",
      "files": ["evals/files/sales_2025.csv"],
      "assertions": [
        "The output includes a chart image file",
        "The chart shows exactly 3 months",
        "Both axes are labeled"
      ]
    }
  ]
}
```

Start with 2–3 cases. Vary phrasing and detail, cover one boundary condition,
and use realistic context (paths, column names, backstory). Add `assertions`
only after the first run shows what "good" looks like: verifiable and specific
("valid JSON", "at least 3 recommendations"), not vague ("is good") or brittle
(exact wording).

### Runs

Run each case twice from a clean session — **with** the skill and **without**
it (or against a snapshot of the previous version). Pi has no subagents, so a
fresh session per run:

```bash
# with the skill (project skills need trust in non-interactive mode)
pi -a --no-session -p "<prompt>"
# without it
pi --no-skills --no-session -p "<prompt>"
```

Save outputs under `<skill>-workspace/iteration-N/eval-<id>/{with_skill,without_skill}/outputs/`
with a `timing.json` (`total_tokens`, `duration_ms` from the session footer or
`--mode json` usage events).

### Grade, aggregate, analyze

Grade every assertion PASS or FAIL with quoted evidence — no benefit of the
doubt. Mechanical checks go in a script; judgment calls go to an LLM. Aggregate
per configuration into `benchmark.json` and read the delta: what the skill costs
in time and tokens against what it buys in pass rate. Then:

- Drop assertions that pass in both configurations — the model did not need the skill.
- Investigate assertions that fail in both — broken assertion or impossible case.
- Study what passes only with the skill — that is the value; know which line delivers it.
- Tighten instructions where results flip between runs.
- Have a human review each output and record actionable feedback; empty feedback is a pass.

### Iterate

Give the failed assertions, the human feedback, the execution transcripts, and
the current `SKILL.md` to an LLM and ask for changes that generalize, keep the
skill lean, explain the why, and bundle repeated work into `scripts/`. Apply,
rerun as `iteration-N+1`, regrade. Stop when feedback stays empty or gains
plateau.

## Triggering — does the description fire?

Only `name` and `description` are in context when the model decides. A
description that reads as a summary loses to one that reads as a trigger.

Write it imperative ("Use when…"), around user intent not mechanics, pushy
about contexts where the user never names the domain, and precise about the
boundary with neighbouring skills. Under 1024 characters.

### Eval queries

`evals/trigger-eval.json`, about 20 entries, half and half:

```json
[
  { "query": "…", "should_trigger": true },
  { "query": "…", "should_trigger": false }
]
```

Should-trigger queries vary phrasing, explicitness, detail, and complexity; the
useful ones are where the skill would help but the query never says so.
Should-not-trigger queries are **near-misses** that share vocabulary but need
something else — obviously irrelevant queries test nothing.

### Measure

Run `scripts/probe_trigger.py <skill-name> <queries.json>` from the skill root
(see `SKILL.md`). It runs each query through Pi, watches for the read of the
target `SKILL.md`, and reports two numbers. Read them separately:

| Signal | Meaning | Fix |
| --- | --- | --- |
| Low recall, low false-fire | Too narrow | Find what the missed queries share and name that category — not their keywords |
| High false-fire | Stealing a neighbour's work | State what the skill does *not* do and route the neighbour by name |

Runs are nondeterministic: three runs per query with a 0.5 threshold is the
standard; one run is a cheap first pass.

### Avoid overfitting

Split queries ~60/40 into train and validation, proportionally mixed, fixed
across iterations. Revise on train failures only; pick the iteration with the
best validation pass rate — it may not be the last. Five iterations is usually
enough; if nothing improves, the queries are the problem. Finish with 5–10
fresh queries as an honest check.
