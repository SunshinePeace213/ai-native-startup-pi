---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/artifacts.md, title: "Share session output as artifacts", id: src_9e45f4ba4e23}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_artifacts]
claim_ids: [clm_34b4c7629f8c, clm_5fa665e68b63, clm_c31c934c70bd, clm_dc0ebbb9a51b, clm_366126bf4acf, clm_ed1642c941f5, clm_758fc2ddaf23, clm_d26999152815, clm_5e59824148fe, clm_6d413ce21aa5]
confidence: 0.92
stale_after: 2027-02-25
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# artifacts

> **In here:** Artifacts are available on Pro, Max, Team, and Enterprise plans and require a session signed in with /login · 10 claims, confidence 0.92.

## Current understanding

- An artifact is a live, interactive web page that Claude Code publishes from a session to a private URL on claude.ai and updates in place as the session continues (0.94)
- Artifacts are available on Pro, Max, Team, and Enterprise plans and require a session signed in with /login (0.93)
- A newly published artifact is visible only to its author until the author shares it from the Share control in the page header (0.93)
- Each artifact is one self-contained page that Claude Code wraps in an HTML document shell and serves under a strict Content Security Policy, which shapes what the page can do (0.93)
- An artifact is a capture of work rather than an application: with no backend it cannot store form input or serve multiple routes, and calling MCP connectors is its only path to outside data once someone is viewing it (0.93)
- Updating an artifact means Claude edits the underlying file and publishes again to the same URL, so viewers with the page open see the revision in place (0.93)
- Owners on Team and Enterprise plans control artifacts from claude.ai admin settings, and artifact content is stored on Anthropic-operated infrastructure visible only to authenticated members of the publishing organization unless the artifact is shared publicly (0.92)
- A public artifact link opens for anyone on the internet without a claude.ai sign-in, and it is the only sharing route on Pro and Max plans, while on Team and Enterprise plans public sharing stays off until an Owner enables it for the organization (0.92)
- Only an artifact shared within an organization takes comments, which Claude can read and reply to on Team and Enterprise plans with Claude Code v2.1.221 or later (0.90)
- An artifact can call MCP connectors each time someone views it so the page shows current data rather than a snapshot from the session that built it, on Pro, Max, Team, and Enterprise plans with Claude Code v2.1.209 or later (0.90)

## Evidence

- `clm_34b4c7629f8c` — "An artifact is a live, interactive web page that Claude Code publishes from a session to a private URL on claude.ai and updates in place as the session continues." · p 0.94 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "An artifact is a live, interactive web page that Claude Code publishes from your session to a private URL on claude.ai. You open it in a browser, and it updates in place as the session continues."
- `clm_5fa665e68b63` — "Artifacts are available on Pro, Max, Team, and Enterprise plans and require a session signed in with /login." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "Artifacts are available on Pro, Max, Team, and Enterprise plans and require a session signed in with [`/login`](/docs/en/setup#authenticate). See [Availability](#availability) for the full set of requirements."
- `clm_c31c934c70bd` — "A newly published artifact is visible only to its author until the author shares it from the Share control in the page header." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "A new artifact is visible only to you. To share it, open the artifact in your browser and use the **Share** control in the page header."
- `clm_dc0ebbb9a51b` — "Each artifact is one self-contained page that Claude Code wraps in an HTML document shell and serves under a strict Content Security Policy, which shapes what the page can do." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "Each artifact is one self-contained page. Claude Code wraps the file you publish in an HTML document shell and serves it under a strict Content Security Policy (CSP), which shapes what the page can do."
- `clm_366126bf4acf` — "An artifact is a capture of work rather than an application: with no backend it cannot store form input or serve multiple routes, and calling MCP connectors is its only path to outside data once someone is viewing it." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "An artifact is a capture of work, not an application."
- `clm_ed1642c941f5` — "Updating an artifact means Claude edits the underlying file and publishes again to the same URL, so viewers with the page open see the revision in place." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "Ask Claude to revise the page, or let a long-running task republish as it makes progress. Claude edits the underlying file and publishes again to the same URL."
- `clm_758fc2ddaf23` — "Owners on Team and Enterprise plans control artifacts from claude.ai admin settings, and artifact content is stored on Anthropic-operated infrastructure visible only to authenticated members of the publishing organization unless the artifact is shared publicly." · p 0.92 · active · 1 support · 0 contradict · when: on Team and Enterprise plans
  - `src_9e45f4ba4e23` Share session output as artifacts: "Owners on Team and Enterprise plans control artifacts from [claude.ai admin settings](https://claude.ai/admin-settings/claude-code)."
- `clm_d26999152815` — "A public artifact link opens for anyone on the internet without a claude.ai sign-in, and it is the only sharing route on Pro and Max plans, while on Team and Enterprise plans public sharing stays off until an Owner enables it for the organization." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "**Publicly**: share a link that anyone on the internet can open, with no claude.ai sign-in required. On Pro and Max plans, a public link is the only way to share an artifact."
- `clm_5e59824148fe` — "Only an artifact shared within an organization takes comments, which Claude can read and reply to on Team and Enterprise plans with Claude Code v2.1.221 or later." · p 0.90 · active · 1 support · 0 contradict · when: on Team and Enterprise plans
  - `src_9e45f4ba4e23` Share session output as artifacts: "When you share an artifact within your organization, the people you share it with can leave comments on the page, and you can have Claude read those comments and reply to them."
- `clm_6d413ce21aa5` — "An artifact can call MCP connectors each time someone views it so the page shows current data rather than a snapshot from the session that built it, on Pro, Max, Team, and Enterprise plans with Claude Code v2.1.209 or later." · p 0.90 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "An artifact can call [MCP connectors](/docs/en/mcp#use-mcp-servers-from-claude-ai) each time someone views it, so the page shows current data rather than a snapshot from the session that built it."

## Timeline

- 2026-08-23 new_claim `clm_34b4c7629f8c` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_c31c934c70bd` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_ed1642c941f5` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_d26999152815` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_758fc2ddaf23` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_dc0ebbb9a51b` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_366126bf4acf` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_6d413ce21aa5` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_5e59824148fe` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_5fa665e68b63` (src_9e45f4ba4e23)

## Related

- → uses [[mcp-connector]] (0.99)
- → part_of [[claude-code]] (0.94)
- → depends_on Content Security Policy (no page yet) (0.93)
- [[claude-code]] — 5 shared claims
- [[mcp-connector]] — 2 shared claims
- Content Security Policy (no page yet)
