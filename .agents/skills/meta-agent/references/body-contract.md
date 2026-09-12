---
source: pi-subagents 0.67 bundled skill references/prompting-and-roles.md · builtin agents/*.md
fetched: 2026-09-12
---

# The body is a contract

The Markdown after the frontmatter is the child's entire system prompt (unless
`systemPromptMode: append`). Every line recurs on every turn the child runs,
and the child starts cold. Write the contract, then stop.

## Shape

```markdown
You are `<name>`: <one sentence — the job and the lens it works through>.

<What it reads first, if the launch packet names files: "Read the supplied
context, plan, and task paths before anything else.">

## Working rules
- <true invariants only: no edits for a review role, one writer per worktree,
  escalate unapproved decisions, never spawn subagents unless `subagent` is
  in its tools>

## Supervisor coordination            ← only when `contact_supervisor` is in tools
If runtime bridge instructions identify a safe supervisor target and you are
blocked or need a decision, use `contact_supervisor` with
`reason: "need_decision"` and wait for the reply. Use
`reason: "progress_update"` only for discoveries that change the plan. Do not
send routine completion handoffs; return normally. If `contact_supervisor` is
unavailable, report the blocking decision in your final response.

## Output
<Exactly what returns to the parent, in what shape. The parent sees only this.>
```

That is a complete agent. The builtin `reviewer`, `scout`, `worker`, and
`oracle` are this shape at production length; eject the closest one and read
it before drafting.

## What the parent's task packet carries

The parent writes the task at launch. It is expected to be cold-start
complete: goal, target and `cwd`, authority boundary, context or evidence,
success criteria, validation, output, stop rules. So the agent body does
**not** restate per-task facts; it states the role's standing rules and the
output shape, and trusts the packet for the rest. If the body finds itself
listing "inputs", the launch packet is where those belong.

## Add a section only when its trigger fires

| Section | Add it only when |
| --- | --- |
| `## Process` | Order is load-bearing: irreversible steps, a regulated sequence, a handoff another agent depends on |
| `## Edge cases` | The right move on missing or ambiguous input is not inferable (no diff, target absent, scope wider than the budget) |
| `## Review types` / `## Not for` | The role borders a sibling and the boundary is not obvious from the description |

Triggering lives in the frontmatter `description`; never add "when to use
me" to the body.

## Subtraction for the model tier

Delete first, then add. The default child model is the parent's model, an
Opus-class model in this deployment.

| Tier | Delete | Add |
| --- | --- | --- |
| Strong (Opus-class) | Verification steps, "double-check", "be thorough", "think harder" — it self-verifies and the instruction compounds into wasted turns | A scope constraint (it widens tasks); a delegation cap if it holds `subagent` |
| Fast (Sonnet-class) | Forced cadence; qualitative bars on a finder ("important", "significant") | The explicit scope of each rule — it reads literally |
| Utility (Haiku-class) | Nothing | A precise ordered script; the one tier where prescriptive wins |

Capability is frontmatter: `thinking` buys effort, the model tier buys
knowing. Never write "think harder" into a body.

**Cut on sight**: all-caps MUST/NEVER without a reason, persona bloat, any
line stating what the model already does, and any instruction to explain or
show its own reasoning.

## Tiers by role

Model names are deployment policy and go in `.pi/settings.json`; the agent
file carries only `thinking`.

| Role | Tier | `thinking` |
| --- | --- | --- |
| Scout, recon, mechanical worker | fast | `low`–`medium` |
| Implementation worker | strong | `high` |
| Reviewer, validator | strong, fresh context | `high` |
| Oracle, critic, second opinion | strongest available, read-only | `high` |

```json
{ "subagents": { "agentOverrides": { "scout": { "model": "anthropic/claude-sonnet-5" } } } }
```

## Tuning from runs

| Symptom | Fix |
| --- | --- |
| Wanders outside its job | Tighten `tools`; add the scope constraint to the body |
| Comes back shallow, skips files or checks | Raise `thinking` |
| Confidently wrong on a subtle point | Raise the model tier via `agentOverrides` |
| Ignores repo conventions | `inheritProjectContext: true` |
| Keeps hitting one project quirk | `subagent({ action: "refine", agent })` before editing the file |
| Judged as "made no edits" though review-only | `completionGuard: false` or drop `bash` |
| Fails to launch in foreground | It needs an ambient extension: `async: true` or list the provider |
