---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/pi/prompt-templates.md, title: "Prompt Templates", id: src_0bc77feb25be}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_prompt_template]
claim_ids: [clm_86f2c89fbcb1, clm_f36a84a463a4, clm_3a1463613521, clm_80cbc04f7602, clm_f74708e2c8eb]
confidence: 0.93
stale_after: 2027-02-01
last_rendered: 2026-09-11T19:57:10Z
review_required: false
---

# prompt template

> **In here:** Pi does not walk subdirectories when discovering prompt templates in a prompts/ directory; nested templates must be added explicitly through settings or a package manifest · 5 claims, confidence 0.93.

## Current understanding

- A Pi prompt template's filename is its command name, so review.md is invoked as /review (0.94)
- Pi's design keeps the agent core small and pushes workflow-specific behavior out into extensions, skills, prompt templates, and packages (0.94)
- Pi does not walk subdirectories when discovering prompt templates in a prompts/ directory; nested templates must be added explicitly through settings or a package manifest (0.93)
- A Pi prompt template's argument-hint frontmatter field shows expected arguments in autocomplete, angle brackets marking required arguments and square brackets optional ones (0.93)
- Pi prompt templates take shell-style argument substitution, including a default form where ${1:-default} falls back when the first argument is absent or empty (0.93)

## Evidence

- `clm_86f2c89fbcb1` — "A Pi prompt template's filename is its command name, so review.md is invoked as /review." · p 0.94 · active · 1 support · 0 contradict
  - `src_0bc77feb25be` Prompt Templates: "The filename becomes the command name. `review.md` becomes `/review`."
- `clm_f36a84a463a4` — "Pi's design keeps the agent core small and pushes workflow-specific behavior out into extensions, skills, prompt templates, and packages." · p 0.94 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "Pi keeps the core small and pushes workflow-specific behavior into extensions, skills, prompt templates, and packages."
- `clm_3a1463613521` — "Pi does not walk subdirectories when discovering prompt templates in a prompts/ directory; nested templates must be added explicitly through settings or a package manifest." · p 0.93 · active · 1 support · 0 contradict
  - `src_0bc77feb25be` Prompt Templates: "Template discovery in `prompts/` is non-recursive."
- `clm_80cbc04f7602` — "A Pi prompt template's argument-hint frontmatter field shows expected arguments in autocomplete, angle brackets marking required arguments and square brackets optional ones." · p 0.93 · active · 1 support · 0 contradict
  - `src_0bc77feb25be` Prompt Templates: "Use `argument-hint` in frontmatter to show expected arguments in autocomplete. Use `<angle brackets>` for required arguments and `[square brackets]` for optional ones:"
- `clm_f74708e2c8eb` — "Pi prompt templates take shell-style argument substitution, including a default form where ${1:-default} falls back when the first argument is absent or empty." · p 0.93 · active · 1 support · 0 contradict
  - `src_0bc77feb25be` Prompt Templates: "`${1:-default}` uses arg 1 when present/non-empty, otherwise `default`"

## Timeline

- 2026-09-11 new_claim `clm_86f2c89fbcb1` (src_0bc77feb25be)
- 2026-09-11 new_claim `clm_f74708e2c8eb` (src_0bc77feb25be)
- 2026-09-11 new_claim `clm_80cbc04f7602` (src_0bc77feb25be)
- 2026-09-11 new_claim `clm_3a1463613521` (src_0bc77feb25be)
- 2026-09-11 new_claim `clm_f36a84a463a4` (src_ab670f25c35e)

## Related

- → produces [[slash-command]] (0.94)
- [[pi]] — 5 shared claims
- [[pi-extension]] — 1 shared claim
- [[slash-command]] — 1 shared claim
