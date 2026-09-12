---
source: https://agentskills.io/specification
also: https://agentskills.io/skill-creation/best-practices · https://agentskills.io/skill-creation/using-scripts
fetched: 2026-08-25
---

# The Agent Skills standard, distilled

## Layout

```
skill-name/
├── SKILL.md        # required: frontmatter + instructions
├── scripts/        # executable code the agent runs
├── references/     # docs loaded on demand
└── assets/         # templates, schemas, images
```

## Frontmatter

| Field | Required | Constraint |
| --- | --- | --- |
| `name` | yes | 1–64 chars, `a-z`, `0-9`, `-`; no leading, trailing, or double hyphen; **equals the directory name** |
| `description` | yes | 1–1024 chars; what it does *and* when to use it, with the keywords a task would carry |
| `license` | no | License name or bundled file |
| `compatibility` | no | ≤500 chars; only when the skill needs a product, package, or network |
| `metadata` | no | String-to-string map; keep keys distinctive |
| `allowed-tools` | no | Space-separated pre-approved tools; experimental |

The body has no format rules. Recommended: step-by-step instructions, examples
of input and output, common edge cases.

## Progressive disclosure

| Tier | Loaded | Budget |
| --- | --- | --- |
| Metadata | always, every skill | ~100 tokens |
| `SKILL.md` body | on activation | under 500 lines, under 5,000 tokens |
| `scripts/`, `references/`, `assets/` | when the body says to | as needed |

Tell the agent *when* to load each file — "read `references/errors.md` if the
API returns non-200" beats "see references/". Keep references one level deep;
use relative paths from the skill root.

## Best practices

**Start from real expertise.** A skill generated from general knowledge yields
"handle errors appropriately". Feed it project material instead: a task just
completed in conversation (the steps that worked, the corrections the user made,
the formats in and out), or existing runbooks, schemas, review comments, and
incident fixes.

**Add what the agent lacks, omit what it knows.** For every line ask "would the
agent get this wrong without it?" If not, cut it. If the agent already does the
whole task well without the skill, the skill is not adding value.

**Design coherent units.** Scope like a function: too narrow forces several
skills to load for one task; too broad cannot activate precisely.

**Aim for moderate detail.** Concise stepwise guidance with one working example
beats exhaustive coverage; leave most edge cases to the agent's judgment.

**Match specificity to fragility.** Freedom plus the *why* where several
approaches are valid; exact commands where an operation is fragile or a sequence
must hold. Calibrate each section on its own.

**Provide defaults, not menus.** Pick one tool, mention the alternative in a
clause.

**Favor procedures over declarations.** Teach how to approach the class of
problem, not the answer to one instance.

## Patterns worth reusing

- **Gotchas** — environment facts that defy reasonable assumptions, kept in
  `SKILL.md` where they are read before the trap. Every correction the user
  makes during use is a gotcha candidate.
- **Output templates** — a concrete structure in a fenced block; long or
  conditional ones live in `assets/`.
- **Checklists** — for multi-step flows with dependencies or gates.
- **Validation loops** — do, run a validator (script, checklist, or reference),
  fix, repeat until it passes.
- **Plan-validate-execute** — for batch or destructive work: write a plan
  artifact, validate it against the source of truth, then run.
- **Bundled scripts** — when runs keep reinventing the same logic, write it
  once under `scripts/`.

## Scripts

Prefer a one-off runner when a package already does the job: `uvx pkg@ver`,
`bunx pkg@ver`, `npx pkg@ver`. For bundled scripts: self-contained or with
declared inline dependencies (PEP 723 header run by `uv run`), non-interactive,
`--help`, structured output, clear error messages that say how to fix the input.
