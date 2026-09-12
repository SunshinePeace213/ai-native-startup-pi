---
name: commit-message
description: >-
  Writes this repo's git commit messages — `<emoji> <type>(<scope>): <description>`
  with the gitmoji and the Conventional-Commits type, an optional why-not-what
  body, and a `Refs #N` footer — validates the draft with a bundled checker,
  then commits the staged changes. Use whenever finished work should enter git
  history: the user says commit this, save my changes, check this in, get it
  into git, i'm done with X, land it, write the commit, or asks what the
  message should say; also for a PR title or squash-merge message, since
  `main` keeps only those. Fire even when the user never says commit or
  message and only wants the work recorded. Not for branching, rebasing,
  merging, tagging, pushing, or opening the PR; not for a PR description or
  changelog; and not for setting up commitlint, hooks, or git config.
---

# Commit message

Every commit and every PR / squash title in this repo reads
`<emoji> <type>(<scope>): <description>`: a literal gitmoji **and** the
Conventional-Commits type, so commitlint keeps parsing. The model's defaults
get this wrong in four ways — a `:shortcode:`, a `Signed-off-by:` or
`Co-Authored-By:` trailer, a missing scope, and a footer that is not exactly
`Refs #N` — so the draft always goes through `scripts/check_message.py`.

## Types

| Emoji | Type | Use for |
| --- | --- | --- |
| ✨ | `feat` | a new feature |
| 🐛 | `fix` | a bug fix |
| 📝 | `docs` | documentation only |
| 🎨 | `style` | structure/formatting, no logic change |
| ♻️ | `refactor` | neither fixes a bug nor adds a feature |
| ⚡️ | `perf` | a performance improvement |
| ✅ | `test` | adding or correcting tests |
| 🔧 | `chore` | tooling, build, config, CI, dependencies, maintenance |

The table is closed. CI, build, and dependency work are `🔧 chore(ci)`,
`chore(build)`, `chore(deps)`. A revert takes the reverted commit's own type
with `revert` in the description (`🐛 fix(retriever): revert fused-score cap`).
`🎨` for `style` is deliberate — in gitmoji `💄` means UI/CSS work.

## Format

```text
<emoji> <type>(<scope>)[!]: <description>
                                            ← blank line
<body: why, not what — only when the diff does not explain itself>
                                            ← blank line
[BREAKING CHANGE: <what breaks and what replaces it>]
Refs #N
```

- **Subject** ≤ 72 characters. Type and scope lowercase; scope required, named
  after the area the change touches — a top-level directory or subsystem
  (`llm-wiki`, `skills`, `agents`, `extension`, `docs`, `ci`, `deps`).
  Description starts lowercase (proper nouns and code keep their case),
  imperative mood — reads as "this commit will …" — no trailing period.
- **Body** optional. Motivation and consequences, never a restatement of the
  diff; bullets allowed; wrapped at 72.
- **Breaking change**: `!` after the scope **and** a `BREAKING CHANGE:` footer
  line, above `Refs`. The emoji stays the type's own.
- **Footer** `Refs #N` naming the change's issue, last line, blank line before
  it. Every `/sdlc:intent` change has an issue. A change the user takes outside
  the chain has none and commits without a footer.
- **Never** a `Signed-off-by:` or `Co-Authored-By:` trailer; never `git commit -s`.

## Steps

1. `git status --short` and `git diff --cached --stat`. Nothing staged → show
   the status and ask which paths to stage; never `git add -A` or `git add .`
   on your own. Untracked scratch, `.env`, or build output never goes in.
2. Read the staged diff (`git diff --cached`). Pick the type from what the
   change **does** for the user, not from which files it touches: a doc edit
   that fixes a wrong command is still `docs`; a test added for a fix ships in
   the `fix` commit. The diff spans two types → name the pieces and offer to
   commit them separately by staging paths; declined → one commit under the
   dominant type, the rest mentioned in the body.
3. Issue number: parse the current branch (`git branch --show-current`) for a
   leading or embedded number — `123-add-thing`, `feat/123-add-thing`,
   `issue-123`. None found → ask once: outside-the-chain change (no footer) or
   which issue. Never invent a number.
4. Write the draft to a temp file (`.git/COMMIT_DRAFT` is fine) and run
   `uv run --no-project scripts/check_message.py .git/COMMIT_DRAFT`. Fix every
   `✗` line, rerun until `✓`.
5. Show the message, then `git commit -F .git/COMMIT_DRAFT`. Quote the
   resulting `git log -1 --format='%h %s'` line back.

For a PR title or squash-merge message: same subject rules, subject line only,
checked with `--squash`; the `Refs #N` goes in the PR body, not the title.

## Output

```text
✨ feat(skills): add commit-message skill

Commits drafted by hand kept landing with `:sparkles:` shortcodes and
sign-off trailers that commitlint rejects. The skill drafts from the
staged diff and checks the message before committing.

Refs #12
```

```text
🐛 fix(llm-wiki): keep state.py the only writer under states/
```

## Gotchas

- Literal emoji, never `:sparkles:` — the shortcode is what most examples
  online use and what commitlint does not parse.
- `⚡️` and `♻️` carry a variation selector; the checker accepts either form,
  copy them from the table.
- `Refs #N` — no colon, capital R, one space, one footer. `Refs: #4`,
  `refs #4`, `Closes #4` all fail.
- Every `/sdlc:intent` change has an issue; a missing number on such a branch
  is a question, not a reason to drop the footer.
- The repo squash-merges to `main`, so the PR title is the message history
  keeps — hold it to the same rules as a commit subject.
