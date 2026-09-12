---
name: meta-agent
description: >-
  Authors, fixes, and tunes pi-subagents agent files under .pi/agents/, and
  decides whether a behavior should be a subagent at all. Use when the user
  wants a new subagent, says "make an agent that…", "build me a reviewer that
  runs on its own", or "turn this into something I can delegate to"; asks to
  change an agent's description, tools, model, thinking, or context; reports
  that an agent never gets picked, wanders outside its job, comes back
  shallow, or fails to launch; or wants work offloaded because it floods the
  main context. Fire even when the user never says "subagent" — asking to
  delegate, offload, hand off, or "have something else do this and report
  back" is this skill. Not for running or steering existing agents (that is
  the pi-subagents skill), not for skills or prompt templates (skill-creator),
  and not for explaining how subagents work.
---

# Meta-Agent

A subagent is one file — `.pi/agents/<name>.md` — that the parent launches
with `subagent({ agent, task })` in a fresh child session and gets one final
message back. Three surfaces carry it: the `description` decides whether the
parent ever picks it, the frontmatter buys capability and context, and the
body is a contract. The child starts **cold**: no base prompt, no `AGENTS.md`,
no skills, no ambient extensions unless the frontmatter says so.

Writing the body is **subtraction**. The default child model is the parent's
Opus-class model; it already verifies, self-corrects, and calibrates length.
Instructing those behaviors compounds with them. This applies to the agent you
build and to your own conduct here.

## 1. Load the facts

| Read | For |
| --- | --- |
| `references/pi-subagents-agents.md` | Discovery, routing, what reaches the child, tools and extensions, every frontmatter field, overrides, refinement |
| `references/body-contract.md` | The contract shape, what the launch packet carries, subtraction per tier, tuning from runs |
| the closest builtin | `subagent({ action: "eject", agent: "<reviewer\|scout\|worker\|oracle>", agentScope: "project" })`, read it, then delete the copy unless it is the base you keep |

Do not write the frontmatter from memory.

## 2. Ground it

- If the delegation was just performed in this conversation, extract the task
  packet the parent wrote, the tools the child needed, and every correction the
  user made. Those corrections become working rules.
- Run `subagent({ action: "list" })` and check the run history if the request is
  about an existing agent: read what it did, not what the user remembers.

## 3. Grill until the frontier is empty

Read `../grilling/SKILL.md` and run its rounds through `ask_user_question`.
The tree:

- **The one job** — what the child does that the parent should not do inline.
- **The packet** — what the parent hands it at launch: files, diff, plan, URL.
- **Authority** — read-only, writer, or may it commit; one writer per worktree.
- **Context** — fresh or fork; does it need `AGENTS.md`; which skills, if any.
- **Tools** — the allowlist; extension tools force `async: true` or a listed provider.
- **Effort** — the tier it needs and the `thinking` level.
- **Output** — the exact shape the parent reads; a file, or the final message.
- **Escalation** — what it must stop and ask the parent about via `contact_supervisor`.
- **Siblings** — which builtin or existing agent borders this job.

Put what the conversation already settled back as confirmations. Nothing is
written while a branch is open.

## 4. Route

| Build | When |
| --- | --- |
| **Use a builtin as is** | `scout`, `researcher`, `evidence-auditor`, `worker`, `reviewer`, `oracle`, or `delegate` already does the job — say so and stop |
| **Settings override** — `.pi/settings.json` `subagents.agentOverrides.<name>` | A builtin with the wrong model, thinking, tools, or context |
| **Refinement overlay** — `subagent({ action: "refine", agent })` | A builtin that keeps stumbling on one project-specific quirk |
| **New agent** — `.pi/agents/<name>.md` | A role none of the above covers |
| **Prompt template with a `workflowScript`** | A recurring multi-agent sequence; route it, do not author it here |
| **Skill** — `skill-creator` | The procedure runs in the main conversation where the user watches and steers |

## 5. Draft

Copy `assets/AGENT.template.md` to `.pi/agents/<name>.md` and fill it from the
settled answers.

- `description` is the situation that should reach this agent, verb first,
  with the sibling it is not for. Under 512 bytes when `advertise: true`.
- `tools` is a strict allowlist. Read-only roles get `read, grep, find, ls`
  plus `contact_supervisor`; add `bash` only with `completionGuard: false` on
  a non-implementation role.
- `inheritProjectContext: true` for any agent that must follow repo
  conventions; the default is off.
- `thinking` carries effort. No `model` in the file: pin tiers in
  `.pi/settings.json` under `agentOverrides`.
- The body is role sentence, working rules that are true invariants, the
  supervisor stanza only when `contact_supervisor` is in tools, and `## Output`.
  Delete the supervisor stanza otherwise.
- An agent holding `subagent` needs a delegation cap in its body.

Validate, fix, repeat until clean:

```bash
uv run --no-project .agents/skills/meta-agent/scripts/validate_agent.py .pi/agents/<name>.md
```

Then `/reload` and confirm it resolved:
`subagent({ action: "get", agent: "<name>" })`.

## 6. Prove the parent picks it

Only name and description are in front of the parent when it decides. Write
20 queries — 10 that should route to this agent, 10 near-misses that a
sibling owns — into `.pi/agents/evals/<name>.trigger-eval.json` (this skill's
own `evals/trigger-eval.json` is the layout), then from the project root:

```bash
uv run --no-project .agents/skills/skill-creator/scripts/probe_trigger.py <name> \
  .pi/agents/evals/<name>.trigger-eval.json
```

The probe counts a `subagent` call naming the agent. Low recall: the
description is too narrow, name the category the missed queries share. High
false-fire: it is stealing a sibling's work, say what it is not for and route
the sibling by name. Then tune from real runs with the table at the end of
`references/body-contract.md`.

## Gotchas

- Project agents load only after the project is trusted; the probe passes `-a`.
- A name that collides with a builtin shadows it silently. Check
  `subagent({ action: "list" })` before reusing a name.
- An extension tool in `tools` does not load its extension. Foreground
  children never see ambient extensions; the launch fails with a diagnostic.
- `ask_user_question` never reaches a child. A child that needs a decision
  uses `contact_supervisor`; without it, it names the open decision in its
  final message and stops.
- `refine` beats editing a builtin: the overlay survives package updates, the
  edit does not.
