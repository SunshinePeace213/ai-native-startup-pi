---
type: system
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/docs/claude-code/permission-modes.md, title: "Choose a permission mode", id: src_4a22e1f99f87}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_auto_mode_classifier]
claim_ids: [clm_b0a4eda36461, clm_614484c4baab]
confidence: 0.93
stale_after: 2029-10-26
last_rendered: 2026-08-23T14:39:21Z
review_required: false
---

# auto mode classifier

> **In here:** Auto mode replaces routine permission prompts with a separate classifier model that reviews each action and blocks anything escalating beyond the request, targeting unrecognized infrastructure, or… · 2 claims, confidence 0.93.

## Current understanding

- The auto mode classifier approves by default local file operations in the working directory, dependency installs declared in lock files or manifests, reading `.env` and sending those credentials to their matching API, and read-only HTTP requests (0.93)
- Auto mode replaces routine permission prompts with a separate classifier model that reviews each action and blocks anything escalating beyond the request, targeting unrecognized infrastructure, or driven by hostile content Claude read (0.93)

## Evidence

- `clm_b0a4eda36461` — "The auto mode classifier approves by default local file operations in the working directory, dependency installs declared in lock files or manifests, reading `.env` and sending those credentials to their matching API, and read-only HTTP requests." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "**Allowed by default**: * Local file operations in your working directory * Installing dependencies declared in your lock files or manifests * Reading `.env` and sending credentials to their matching API * Read-only HTTP requests"
- `clm_614484c4baab` — "Auto mode replaces routine permission prompts with a separate classifier model that reviews each action and blocks anything escalating beyond the request, targeting unrecognized infrastructure, or driven by hostile content Claude read." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "Auto mode lets Claude execute without routine permission prompts."

## Timeline

- 2026-08-23 new_claim `clm_614484c4baab` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_b0a4eda36461` (src_4a22e1f99f87)

## Related

- ← uses [[auto-mode]] (0.93)
- [[auto-mode]] — 2 shared claims
- [[claude-code]] — 2 shared claims
- [[permission-mode]] — 1 shared claim
