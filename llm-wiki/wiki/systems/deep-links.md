---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/deep-links.md, title: "Launch sessions from links", id: src_b72a74a8d21c}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_deep_links]
claim_ids: [clm_03dee19f46e9, clm_4791dc634e24, clm_8da3fbe3b018, clm_3c39024e8a0d, clm_5d4da4170187, clm_6b48da9eac6c]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# deep links

> **In here:** Markdown renderers that allow only http and https links strip the claude-cli:// scheme, and GitHub does this in READMEs, issues, pull requests, and wikis so the link renders as its bare label · 6 claims, confidence 0.92.

## Current understanding

- A deep link is a claude-cli:// URL that opens Claude Code in a new terminal window and can carry a working directory and a prompt to pre-fill (0.94)
- A deep link never executes anything on its own: it only chooses a directory and fills the prompt box, and nothing reaches the model until the user reads the filled-in text and presses Enter (0.93)
- Claude Code registers the claude-cli:// handler with macOS, Linux, and Windows on the first prompt sent in an interactive session, and starting a session without sending a prompt does not register it (0.93)
- Markdown renderers that allow only http and https links strip the claude-cli:// scheme, and GitHub does this in READMEs, issues, pull requests, and wikis so the link renders as its bare label (0.92)
- A deep link's q parameter carries the URL-encoded text to pre-fill in the prompt box, uses %0A for line breaks, and is capped at 5,000 characters (0.89)
- A deep link sets its working directory with either cwd or repo, and when both are passed cwd takes precedence and repo is ignored even if the cwd path does not exist (0.89)

## Evidence

- `clm_03dee19f46e9` — "A deep link is a claude-cli:// URL that opens Claude Code in a new terminal window and can carry a working directory and a prompt to pre-fill." · p 0.94 · active · 1 support · 0 contradict
  - `src_b72a74a8d21c` Launch sessions from links: "A deep link is a `claude-cli://` URL that opens Claude Code in a new terminal window. The URL can carry a working directory and a prompt to pre-fill."
- `clm_4791dc634e24` — "A deep link never executes anything on its own: it only chooses a directory and fills the prompt box, and nothing reaches the model until the user reads the filled-in text and presses Enter." · p 0.93 · active · 1 support · 0 contradict
  - `src_b72a74a8d21c` Launch sessions from links: "A deep link never executes anything on its own. The link only chooses a directory and fills the prompt box."
- `clm_8da3fbe3b018` — "Claude Code registers the claude-cli:// handler with macOS, Linux, and Windows on the first prompt sent in an interactive session, and starting a session without sending a prompt does not register it." · p 0.93 · active · 1 support · 0 contradict · when: on macOS, Linux, and Windows
  - `src_b72a74a8d21c` Launch sessions from links: "Claude Code registers the `claude-cli://` handler with your operating system on macOS, Linux, and Windows when you send your first prompt of an interactive session."
- `clm_3c39024e8a0d` — "Markdown renderers that allow only http and https links strip the claude-cli:// scheme, and GitHub does this in READMEs, issues, pull requests, and wikis so the link renders as its bare label." · p 0.92 · active · 1 support · 0 contradict · when: on GitHub-rendered Markdown
  - `src_b72a74a8d21c` Launch sessions from links: "Some Markdown renderers only allow `http` and `https` links and strip other URL schemes. GitHub does this in READMEs, issues, pull requests, and wikis: `[label](claude-cli://...)` renders as just `label`, with no link and the URL removed."
- `clm_5d4da4170187` — "A deep link's q parameter carries the URL-encoded text to pre-fill in the prompt box, uses %0A for line breaks, and is capped at 5,000 characters." · p 0.89 · active · 1 support · 0 contradict
  - `src_b72a74a8d21c` Launch sessions from links: "Text to pre-fill in the prompt box. [URL-encode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) the value. Use `%0A` for line breaks in multi-line prompts. Maximum 5,000 characters."
- `clm_6b48da9eac6c` — "A deep link sets its working directory with either cwd or repo, and when both are passed cwd takes precedence and repo is ignored even if the cwd path does not exist." · p 0.89 · active · 1 support · 0 contradict
  - `src_b72a74a8d21c` Launch sessions from links: "`cwd` and `repo` are [two ways to set the working directory](#choose-between-cwd-and-repo). If you pass both, `cwd` takes precedence and `repo` is ignored, even if the `cwd` path does not exist."

## Timeline

- 2026-08-23 new_claim `clm_03dee19f46e9` (src_b72a74a8d21c)
- 2026-08-23 new_claim `clm_5d4da4170187` (src_b72a74a8d21c)
- 2026-08-23 new_claim `clm_6b48da9eac6c` (src_b72a74a8d21c)
- 2026-08-23 new_claim `clm_4791dc634e24` (src_b72a74a8d21c)
- 2026-08-23 new_claim `clm_8da3fbe3b018` (src_b72a74a8d21c)
- 2026-08-23 new_claim `clm_3c39024e8a0d` (src_b72a74a8d21c)

## Related

- → part_of [[claude-code]] (0.94)
- → depends_on [[claude-code]] (0.93)
- [[claude-code]] — 2 shared claims
