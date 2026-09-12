---
type: system
status: current
created: 2026-08-30
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/chats/single-trunk-git-policy.md, title: "single-trunk-git-policy", id: src_0fe13652a5fb}
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_claude_code_github_action]
claim_ids: [clm_2fedaa32c347, clm_a24f7a9f7e2d, clm_37e3016361bd, clm_5780564b3c9e, clm_a11730c808c1, clm_cd7280e98da5, clm_fe663417d914, clm_6934fabe9f66, clm_98edccb4d232, clm_9a9fdcc6650d, clm_bd5e3c93d364, clm_8bb2293a40b7, clm_4ffa0158f2ea, clm_77863e0e9135]
confidence: 0.91
stale_after: 2027-05-24
last_rendered: 2026-09-05T20:34:34Z
review_required: false
---

# Claude Code GitHub Action

> **In here:** On public repositories GitHub withholds secrets from runs triggered by fork pull requests, so a workflow-based review runs only on pull requests from branches in the same repository · 14 claims, confidence 0.91.

## Current understanding

- On public repositories GitHub withholds secrets from runs triggered by fork pull requests, so a workflow-based review runs only on pull requests from branches in the same repository (0.93)
- Before Claude starts, the action runs two checks on the triggering actor and fails the run when either rejects it: on issue and pull request events the triggering user must have write access to the repository, and on every event a bot actor is rejected unless listed in `allowed_bots`, which keeps bots from triggering Claude in a loop (0.93)
- For a secret shared across repositories, authenticate with a Claude Console API key rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude setup-token` (0.93)
- GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity (0.93)
- GitHub does not trigger workflows on commits made with the default `GITHUB_TOKEN`, so passing it as the action's `github_token` stops CI from running on Claude's commits; omitting it lets the action authenticate as the Claude GitHub App instead (0.93)
- A workflow can avoid storing a long-lived Anthropic secret entirely by authenticating through workload identity federation, where the action exchanges the workflow's GitHub OpenID Connect token for Claude API access through a Claude Console service account (0.93)
- The Claude Code GitHub Action detects how to run from the workflow: with no `prompt` input it runs interactive, waiting for the `@claude` trigger phrase in a comment, review, or new issue; with a `prompt` input it runs in automation mode without waiting for a mention, reporting to the workflow run log by default (0.93)
- With a plain-text prompt the action gives Claude no shell or GitHub API access until the workflow grants the tools the prompt needs, through `--allowedTools` in `claude_args` or a `permissions.allow` rule in the `settings` input; invoking a skill instead lets Claude use the tools its `allowed-tools` frontmatter grants (0.93)
- The action's `prompt` input accepts a skill invocation as well as plain text: a repository skill needs `actions/checkout` before the action step so its files are on the runner, while a plugin skill is installed with the `plugin_marketplaces` and `plugins` inputs and invoked by its namespaced name (0.93)
- Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset — and the set is shared across every Claude GitHub feature, so an organization that wants only Contents, Issues, and Pull requests must create a custom app that covers the Claude Code GitHub Action alone, leaving Code Review and web auto-fix on the official app (0.93)
- A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts inline comments only when `--allowedTools` in `claude_args` names it (0.93)
- Each action run consumes both GitHub Actions minutes and API tokens, and both are capped by giving Claude clearer context and limiting how much work a run can do — `--max-turns` in `claude_args`, workflow-level timeouts, and GitHub's concurrency controls (0.93)
- The Claude Code GitHub Action refuses to run when the workflow file on the branch differs from the copy on the repository's default branch, skipping the action step so no report comment is written and any gate that reads one then fails the run (0.75)
- A trunk that is not the repository's default branch costs on four fronts at once: a squash outside the default branch never auto-closes its issue, issue_comment and workflow_run workflows only ever run from the default branch, new pull requests default to the wrong base, and workflow validation compares against the default branch (0.75)

## Evidence

- `clm_2fedaa32c347` — "On public repositories GitHub withholds secrets from runs triggered by fork pull requests, so a workflow-based review runs only on pull requests from branches in the same repository." · p 0.93 · active · 1 support · 0 contradict · when: on public repositories
  - `src_7962dafdd21b` Claude Code GitHub Actions: "On public repositories, GitHub withholds secrets from runs triggered by fork pull requests, so the review runs only on pull requests from branches in the same repository."
- `clm_a24f7a9f7e2d` — "Before Claude starts, the action runs two checks on the triggering actor and fails the run when either rejects it: on issue and pull request events the triggering user must have write access to the repository, and on every event a bot actor is rejected unless listed in `allowed_bots`, which keeps bots from triggering Claude in a loop." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "* **Write access**: on issue and pull request events, the triggering user must have write access to the repository. To allow specific users without write access, set `allowed_non_write_users` and pass your own `github_token` input."
- `clm_37e3016361bd` — "For a secret shared across repositories, authenticate with a Claude Console API key rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude setup-token`." · p 0.93 · active · 1 support · 0 contradict · when: for a secret shared across repositories
  - `src_7962dafdd21b` Claude Code GitHub Actions: "For a secret shared across repositories, authenticate with an API key from the [Claude Console](https://platform.claude.com) rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude…"
- `clm_5780564b3c9e` — "GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity."
- `clm_a11730c808c1` — "GitHub does not trigger workflows on commits made with the default `GITHUB_TOKEN`, so passing it as the action's `github_token` stops CI from running on Claude's commits; omitting it lets the action authenticate as the Claude GitHub App instead." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "GitHub doesn't trigger workflows on commits made with the default `GITHUB_TOKEN`."
- `clm_cd7280e98da5` — "A workflow can avoid storing a long-lived Anthropic secret entirely by authenticating through workload identity federation, where the action exchanges the workflow's GitHub OpenID Connect token for Claude API access through a Claude Console service account." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "To avoid storing a long-lived secret entirely, authenticate through workload identity federation, where the Claude Code GitHub Action exchanges the workflow's GitHub OpenID Connect (OIDC) token for Claude API access through a Claude…"
- `clm_fe663417d914` — "The Claude Code GitHub Action detects how to run from the workflow: with no `prompt` input it runs interactive, waiting for the `@claude` trigger phrase in a comment, review, or new issue; with a `prompt` input it runs in automation mode without waiting for a mention, reporting to the workflow run log by default." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "* **Interactive mode**: when the workflow provides no `prompt` input, Claude waits for the trigger phrase, `@claude` by default, in an issue or pull request comment, in a pull request review, or in the body or title of a newly opened…"
- `clm_6934fabe9f66` — "With a plain-text prompt the action gives Claude no shell or GitHub API access until the workflow grants the tools the prompt needs, through `--allowedTools` in `claude_args` or a `permissions.allow` rule in the `settings` input; invoking a skill instead lets Claude use the tools its `allowed-tools` frontmatter grants." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "For a plain-text prompt, Claude has no shell or GitHub API access until you grant the tools the prompt needs, with `--allowedTools` in `claude_args` or a [`permissions.allow` rule](/docs/en/permissions#permission-rule-syntax) in the…"
- `clm_98edccb4d232` — "The action's `prompt` input accepts a skill invocation as well as plain text: a repository skill needs `actions/checkout` before the action step so its files are on the runner, while a plugin skill is installed with the `plugin_marketplaces` and `plugins` inputs and invoked by its namespaced name." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "* For a skill in your repository's `.claude/skills/` directory, run `actions/checkout` before the `anthropics/claude-code-action` step so the skill files are available on the runner, then pass `/skill-name` as the `prompt`."
- `clm_9a9fdcc6650d` — "Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset — and the set is shared across every Claude GitHub feature, so an organization that wants only Contents, Issues, and Pull requests must create a custom app that covers the Claude Code GitHub Action alone, leaving Code Review and web auto-fix on the official app." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "When you install the app, you accept its full permission set. GitHub doesn't let you accept a subset."
- `clm_bd5e3c93d364` — "A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts inline comments only when `--allowedTools` in `claude_args` names it." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "**`claude_args`**: keep this line even though the skill's own `allowed-tools` frontmatter names the same tool, because the Claude Code GitHub Action starts the MCP server that posts inline comments only when `--allowedTools` in…"
- `clm_8bb2293a40b7` — "Each action run consumes both GitHub Actions minutes and API tokens, and both are capped by giving Claude clearer context and limiting how much work a run can do — `--max-turns` in `claude_args`, workflow-level timeouts, and GitHub's concurrency controls." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "* Write specific `@claude` requests so Claude needs fewer turns to finish * Use issue templates to provide context up front * Keep your `CLAUDE.md` concise, since Claude reads it on every run * Set `--max-turns` in `claude_args` to limit…"
- `clm_4ffa0158f2ea` — "The Claude Code GitHub Action refuses to run when the workflow file on the branch differs from the copy on the repository's default branch, skipping the action step so no report comment is written and any gate that reads one then fails the run" · p 0.75 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "The Claude Code GitHub Action refuses to run when the workflow file on the branch differs from the copy on the repository's default branch: the run logged "Workflow validation failed."
- `clm_77863e0e9135` — "A trunk that is not the repository's default branch costs on four fronts at once: a squash outside the default branch never auto-closes its issue, issue_comment and workflow_run workflows only ever run from the default branch, new pull requests default to the wrong base, and workflow validation compares against the default branch" · p 0.75 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "`main` was the default branch while `dev` was the trunk, and that one mismatch produced most of the friction: `/sdlc:ship` had to close each issue by hand because a squash outside the default branch never auto-closes, workflows triggered…"

## Timeline

- 2026-08-30 new_claim `clm_fe663417d914` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_a24f7a9f7e2d` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_9a9fdcc6650d` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_cd7280e98da5` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_37e3016361bd` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_a11730c808c1` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_98edccb4d232` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_6934fabe9f66` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_bd5e3c93d364` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_2fedaa32c347` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_8bb2293a40b7` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_5780564b3c9e` (src_7962dafdd21b)
- 2026-09-05 new_claim `clm_77863e0e9135` (src_0fe13652a5fb)
- 2026-09-05 new_claim `clm_4ffa0158f2ea` (src_0fe13652a5fb)

## Related

- → depends_on [[claude-github-app]] (0.99)
- → uses [[oauth]] (0.99)
- → depends_on [[mcp-server]] (0.93)
- → related_to [[scheduled-tasks]] (0.93)
- → uses [[allowed-tools]] (0.93)
- → uses [[claude-code]] (0.93)
- → uses [[plugin]] (0.93)
- → uses [[skills]] (0.93)
- → uses [[schema-layer]] (0.93)
- ← depends_on [[security-review]] (0.75)
- → depends_on [[trunk]] (0.75)
- [[allowed-tools]] — 2 shared claims
- [[claude-github-app]] — 2 shared claims
- [[oauth]] — 2 shared claims
- [[skills]] — 2 shared claims
- [[claude-code]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[mcp-server]] — 1 shared claim
- [[plugin]] — 1 shared claim
- [[scheduled-tasks]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[security-review]] — 1 shared claim
- [[trunk]] — 1 shared claim
