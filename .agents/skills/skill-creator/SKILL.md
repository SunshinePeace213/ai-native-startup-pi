---
name: skill-creator
description: >-
  Authors, fixes, and packages Pi skills, and decides where a piece of behavior
  belongs — skill, prompt template, AGENTS.md convention, or extension. Use
  when the user wants to create, edit, or package a skill or SKILL.md; says
  "make it stick", "make this reusable", "turn what we just did into something
  for next time", "i keep re-explaining this", or wants Pi to "just know" a
  workflow; reports that a skill never loads on its own, only works via
  /skill:name, or fires too eagerly; or is unsure which artifact a behavior
  should become. Fire even when the user never says "skill" and only describes
  a repeatable workflow worth keeping. Not for using an existing skill on a
  task, not for writing a prompt template or extension the user has already
  chosen by name, and not for answering questions about how skills work —
  those come from the Pi docs, not from this skill.
---

# Skill Creator

A skill is a **trigger plus a body that loads on demand**. The `description`
decides whether it ever fires; the body is what the model reads once it does.
Two separate problems, each with its own way of being wrong — so this flow
grounds the body in real material, interviews until nothing is assumed, and
measures the trigger instead of trusting the prose.

## 1. Load the knowledge

Read these before asking anything; several answers are already in them.

| Read | For |
| --- | --- |
| `references/pi-skills.md` | Where Pi finds skills, trust, `/skill:name`, `disable-model-invocation`, prompt templates, packaging |
| `references/agent-skills-standard.md` | Frontmatter caps, progressive disclosure, best practices, instruction patterns, scripts |
| `references/evaluation.md` | Only when you reach step 6 — output evals and the description loop |

## 2. Ground it in real expertise

A skill written from general knowledge yields "handle errors appropriately".
Before any question, gather what the agent would not know on its own:

- **This conversation** — if the workflow was just performed, extract the tools
  used, the sequence, the formats in and out, and every correction the user
  made. Those corrections are the first gotchas.
- **Project artifacts** — runbooks, schemas, config, review comments, past
  fixes. Read them; do not ask the user to summarize what is on disk.

If the agent already does the whole task well without help, say so — the skill
may not be worth its context.

## 3. Grill until the frontier is empty

Read `../grilling/SKILL.md` (sibling of this skill) and run its rounds through
`ask_user_question`. The design tree it has to cover:

- **The one job** — what the skill enables that the model does not already do well.
- **The triggers** — the contexts and phrasings that should route here, and
  the near-misses that should not.
- **The output** — a file, a diff, a report, a conversation; its exact shape.
- **The boundaries** — what looks like this job but belongs to another skill,
  a template, or an extension.
- **The material** — references, scripts, templates, or example files it must carry.
- **Side effects** — anything that writes, sends, deploys, or spends.

Put what the conversation already settled back as confirmations, not open
questions. Nothing gets written while a branch is open.

## 4. Route

| Build | When |
| --- | --- |
| **Skill** — `.agents/skills/<name>/SKILL.md` | Pi should reach for it on its own, or it needs `scripts/`, `references/`, or `assets/` |
| **Prompt template** — `.pi/prompts/<name>.md` | The user types `/name` themself, it is a single prompt, no bundled files |
| **`AGENTS.md` line** | A convention that must hold in every session, not a task |
| **Extension** | Needs a real tool, a command with UI, or an event hook — out of scope here; say so and stop |

A skill also gets `/skill:<name>` for free, so "the user types it" alone does
not make it a template; bundled files or model-driven activation make it a skill.

## 5. Draft

Copy `assets/SKILL.template.md` to `.agents/skills/<name>/SKILL.md` and fill it
from the settled answers. House rules:

- `name` is kebab-case and **equals the directory name**.
- The description is imperative and pushy: what it does, when to use it
  including phrasings that never name the domain, and what it is not for with
  the neighbour named. Under 1024 characters.
- Body under 500 lines; anything the model needs only sometimes goes to
  `references/` with the condition that loads it stated in the body.
- Bundled paths are relative to the skill root; Pi resolves them from the
  `<location>` it lists in the system prompt.
- Scripts run through `uv run` (Python) or `bun` (JS/TS), are non-interactive,
  and fail with a message that says how to fix the input.
- A skill that sends, deploys, or spends gets `disable-model-invocation: true`.
- State what to do, not why a design was chosen; keep decision history out.

Then validate, fix, repeat until clean:

```bash
uv run --no-project scripts/validate_skill.py .agents/skills/<name>
```

## 6. Prove it helps

Write 2–3 cases into `.agents/skills/<name>/evals/evals.json` (shape in
`references/evaluation.md`), run each once with the skill and once with
`--no-skills`, grade with quoted evidence, and keep only the instructions that
moved an assertion from fail to pass. A skill whose output is a question round
is graded by its captured arguments instead:

```bash
uv run --no-project .agents/skills/skill-creator/scripts/capture_round.py \
  <name> .agents/skills/<name>/evals/evals.json [--no-skills]
```

A case that must not touch live state points `env.LLM_WIKI_ROOT` (or its
equivalent) at a throwaway root built through the owning tool's own CLI, never
by hand-writing its files. One execute-then-revise pass is the
minimum; skip it only for a skill with no output to compare.

## 7. Prove it triggers

A skill that never fires is a file the user has to remember to type. Write 20
queries — 10 that should fire, 10 near-misses that share vocabulary but belong
elsewhere — into `.agents/skills/<name>/evals/trigger-eval.json` (this skill's
own `evals/trigger-eval.json` is the layout), then from the project root:

```bash
uv run --no-project .agents/skills/skill-creator/scripts/probe_trigger.py <name> \
  .agents/skills/<name>/evals/trigger-eval.json
```

Read the two numbers separately: low recall means the description is too
narrow — name the category the missed queries share, not their keywords; high
false-fire means it is stealing a neighbour's work — say what it is not for and
route the neighbour by name. Revise, rerun, at most five rounds. Descriptions
grow during this loop; recheck the 1024 cap.

## 8. Place and reload

Project scope is `.agents/skills/<name>/`; a skill that is personal rather than
about this project goes to `~/.agents/skills/<name>/`. Run `/reload` in Pi to
pick it up, then `/skill:<name>` once to confirm it expands. To share the whole
set, the repo is already installable with `pi install ./path -l`.

## Gotchas

- Project skills load only after the project is trusted. Non-interactive runs
  never prompt: pass `-a` or the skill is silently absent and every probe
  reports zero.
- `pi --mode json` scripted from a shell blocks at startup, printing nothing,
  when stdin is inherited or stdout is redirected to a file. Feed it
  `</dev/null` and read stdout through a pipe; the probe does this. All-zeros
  with `first=None` on every query is this hang, not a description finding.
- Pi warns on a name collision and keeps the **first** skill found — check
  global `~/.agents/skills/` before reusing a name.
- A missing or empty `description` is the one frontmatter error that stops the
  skill loading entirely; everything else only warns.
- Even a matching description does not guarantee the model reads the body.
  Measure it; do not assume.
- `ask_user_question` is absent in non-interactive runs, but not silently: the
  model still calls it and the call fails with `Tool ask_user_question not
  found`. The arguments are emitted in `tool_execution_start` *before* that
  error, so the round a skill would have asked is fully observable — grade an
  interviewing skill from those captured arguments with
  `scripts/capture_round.py` rather than from a text fallback. Only the first
  round is reachable this way; answering one, and so testing rounds 2+, needs
  a stub tool.
