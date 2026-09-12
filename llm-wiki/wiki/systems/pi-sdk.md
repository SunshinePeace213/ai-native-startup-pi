---
type: system
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/pi/sdk.md, title: "SDK", id: src_0954e1c03a59}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_pi_sdk]
claim_ids: [clm_3869fb899ba0, clm_16beff4fdac1, clm_1d62f096ecfe, clm_695fbe157cd4, clm_d1b8f5a83af4]
confidence: 0.93
stale_after: 2027-01-29
last_rendered: 2026-09-11T20:02:51Z
review_required: false
---

# pi SDK

> **In here:** Pi's SDK gives programmatic access to the agent for embedding it in other applications, building custom interfaces, or wiring it into automated workflows · 5 claims, confidence 0.93.

## Current understanding

- Pi's SDK gives programmatic access to the agent for embedding it in other applications, building custom interfaces, or wiring it into automated workflows (0.94)
- Pi's runtime API is the layer for replacing the active session and rebuilding cwd-bound state, and it is the same one the built-in interactive, print, and RPC modes run on (0.93)
- createAgentSession() draws extensions, skills, prompt templates, themes, and context files from a ResourceLoader, defaulting to DefaultResourceLoader with standard discovery when none is supplied (0.93)
- In Pi's SDK preflightResult fires before prompt() resolves and reports acceptance only; prompt() resolves after the whole accepted run including retries, and post-acceptance failures surface through the event and message stream instead (0.92)
- Pi offers RPC mode over the CLI as the subprocess-based integration path for callers who do not want to build against the SDK (0.92)

## Evidence

- `clm_3869fb899ba0` — "Pi's SDK gives programmatic access to the agent for embedding it in other applications, building custom interfaces, or wiring it into automated workflows." · p 0.94 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "The SDK provides programmatic access to pi's agent capabilities. Use it to embed pi in other applications, build custom interfaces, or integrate with automated workflows."
- `clm_16beff4fdac1` — "Pi's runtime API is the layer for replacing the active session and rebuilding cwd-bound state, and it is the same one the built-in interactive, print, and RPC modes run on." · p 0.93 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "Use the runtime API when you need to replace the active session and rebuild cwd-bound runtime state. This is the same layer used by the built-in interactive, print, and RPC modes."
- `clm_1d62f096ecfe` — "createAgentSession() draws extensions, skills, prompt templates, themes, and context files from a ResourceLoader, defaulting to DefaultResourceLoader with standard discovery when none is supplied." · p 0.93 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "`createAgentSession()` uses a `ResourceLoader` to supply extensions, skills, prompt templates, themes, and context files. If you do not provide one, it uses `DefaultResourceLoader` with standard discovery."
- `clm_695fbe157cd4` — "In Pi's SDK preflightResult fires before prompt() resolves and reports acceptance only; prompt() resolves after the whole accepted run including retries, and post-acceptance failures surface through the event and message stream instead." · p 0.92 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "It fires before `prompt()` resolves. `prompt()` still resolves only after the full accepted run finishes, including retries."
- `clm_d1b8f5a83af4` — "Pi offers RPC mode over the CLI as the subprocess-based integration path for callers who do not want to build against the SDK." · p 0.92 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "For subprocess-based integration without building with the SDK, use the CLI directly:"

## Timeline

- 2026-09-11 new_claim `clm_3869fb899ba0` (src_0954e1c03a59)
- 2026-09-11 new_claim `clm_1d62f096ecfe` (src_0954e1c03a59)
- 2026-09-11 new_claim `clm_16beff4fdac1` (src_0954e1c03a59)
- 2026-09-11 new_claim `clm_695fbe157cd4` (src_0954e1c03a59)
- 2026-09-11 new_claim `clm_d1b8f5a83af4` (src_0954e1c03a59)

## Related

- → part_of [[pi]] (0.94)
- → uses [[pi-extension]] (0.93)
- ← related_to [[rpc-mode]] (0.92)
- [[pi]] — 5 shared claims
- [[pi-extension]] — 1 shared claim
- [[rpc-mode]] — 1 shared claim
- [[session]] — 1 shared claim
