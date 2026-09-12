---
source: https://pi.dev/docs/latest/skills
also: https://pi.dev/docs/latest/prompt-templates · https://pi.dev/docs/latest/packages
fetched: 2026-09-12
---

# Skills in Pi

Pi implements the Agent Skills standard (see `agent-skills-standard.md`) and is
lenient: most violations warn and still load. What follows is only what Pi adds
or changes.

## Where Pi finds skills

| Scope | Path | Notes |
| --- | --- | --- |
| Global | `~/.agents/skills/` | Cross-harness location; also read by Codex |
| Global | `~/.pi/agent/skills/` | Pi-only |
| Project | `.agents/skills/` | In `cwd` and every ancestor up to the git root. **This repo's location.** |
| Project | `.pi/skills/` | Pi-only |
| Package | `skills/` dir or `pi.skills` in `package.json` | Installed with `pi install` |
| Settings | `"skills": [paths]` in `settings.json` | Bridge other harnesses, e.g. `"../.claude/skills"` |
| CLI | `--skill <path>` | Repeatable; loads even with `--no-skills` |

Discovery rules:

- Any directory containing `SKILL.md` is discovered recursively in every location.
- In `.agents/skills/` root `.md` files are ignored; nested `.md` files inside
  grouping folders load when they carry skill frontmatter.
- Project skills load **only after the project is trusted**. Interactive Pi asks
  on first start; `/trust` saves the decision. Non-interactive runs (`-p`,
  `--mode json`) never prompt — pass `-a` / `--approve` to trust for one run,
  or the project's skills are silently absent.
- Name collision across locations: warn, keep the first one found.
- `/reload` picks up a new or edited skill without restarting.

## How a skill reaches the model

1. At startup Pi reads `name` and `description` of every skill and lists them in
   the system prompt as `<available_skills>` entries, each with its absolute
   `<location>`.
2. When a task matches, the model loads the full `SKILL.md` with `read` (or
   `bash` when `read` is off). **Models do not always do this** even when the
   description matches — the description has to make the case, and the user
   can force it.
3. The model follows the body, resolving `scripts/`, `references/`, `assets/`
   paths relative to the `<location>` directory. There is no `$SKILL_DIR`
   variable; the absolute path in the catalog is the base.

Every skill also registers as a slash command: `/skill:<name>` loads it, and
`/skill:<name> some args` appends `User: some args` after the body. Disable the
commands with `"enableSkillCommands": false`.

## Frontmatter Pi honours

The standard fields (`name`, `description`, `license`, `compatibility`,
`metadata`, `allowed-tools`) plus:

| Field | Effect |
| --- | --- |
| `disable-model-invocation: true` | Hidden from the system prompt; only `/skill:<name>` loads it. Use for anything that sends, deploys, or spends. |

Unknown fields are ignored. Pi does **not** enforce that `name` matches the
directory (the standard does) — match it anyway so the skill works elsewhere.

## Validation outcomes

| Problem | Result |
| --- | --- |
| Name over 64 chars, bad characters, edge or double hyphens | Warns, still loads |
| Description over 1024 chars | Warns, still loads |
| Missing or empty description | **Not loaded** |
| Malformed frontmatter | **Not loaded**, warning |
| Other `.md` files without skill frontmatter | Ignored silently |

## Prompt templates — the other authored artifact

A prompt template is one Markdown file under `.pi/prompts/<name>.md` (or
`~/.pi/agent/prompts/`), invoked as `/name`. Optional frontmatter `description`
and `argument-hint`; body supports `$1`, `$@`, `${1:-default}`, `${@:2}`.
Discovery is non-recursive. It carries no bundled files and never fires on its
own — the user types it. When behavior should load on the model's own judgment,
or needs scripts and references, it is a skill instead.

## Packaging skills

A directory with a `skills/` folder is already a Pi package:
`pi install ./path` (add `-l` for project settings) or
`pi install git:github.com/user/repo@tag`. A `pi` manifest in `package.json`
can list `skills` globs explicitly; add the `pi-package` keyword for the
gallery. Packages run with full system access — review before installing.
