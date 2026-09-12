---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/pi/rpc.md, title: "RPC Mode", id: src_3c01fb9c03bd}
  - {resource: llm-wiki/raw/docs/pi/sdk.md, title: "SDK", id: src_0954e1c03a59}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_rpc_mode]
claim_ids: [clm_11c6703901c8, clm_09bf6ccb11c0, clm_2fe3fab7d249, clm_149a0483eb0e, clm_e467f67072a9, clm_d1b8f5a83af4]
confidence: 0.93
stale_after: 2027-02-01
last_rendered: 2026-09-11T20:02:51Z
review_required: false
---

# RPC mode

> **In here:** In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI · 6 claims, confidence 0.93.

## Current understanding

- Pi's RPC mode runs the agent headlessly behind a JSON protocol over stdin and stdout, the embedding path for other applications, IDEs, and custom UIs (0.94)
- Node's readline is not protocol-compliant for Pi's RPC mode because it also splits on U+2028 and U+2029, which are legal inside JSON strings (0.93)
- Pi's RPC mode uses strict JSONL framing with LF as the only record delimiter, so clients split on newline alone and merely tolerate a trailing carriage return (0.93)
- Pi's RPC mode carries extension dialogs as a request/response sub-protocol: a dialog method emits an extension_ui_request on stdout and blocks until the client returns a matching extension_ui_response on stdin (0.93)
- In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI (0.93)
- Pi offers RPC mode over the CLI as the subprocess-based integration path for callers who do not want to build against the SDK (0.92)

## Evidence

- `clm_11c6703901c8` — "Pi's RPC mode runs the agent headlessly behind a JSON protocol over stdin and stdout, the embedding path for other applications, IDEs, and custom UIs." · p 0.94 · active · 1 support · 0 contradict
  - `src_3c01fb9c03bd` RPC Mode: "RPC mode enables headless operation of the coding agent via a JSON protocol over stdin/stdout. This is useful for embedding the agent in other applications, IDEs, or custom UIs."
- `clm_09bf6ccb11c0` — "Node's readline is not protocol-compliant for Pi's RPC mode because it also splits on U+2028 and U+2029, which are legal inside JSON strings." · p 0.93 · active · 1 support · 0 contradict
  - `src_3c01fb9c03bd` RPC Mode: "In particular, Node `readline` is not protocol-compliant for RPC mode because it also splits on `U+2028` and `U+2029`, which are valid inside JSON strings."
- `clm_2fe3fab7d249` — "Pi's RPC mode uses strict JSONL framing with LF as the only record delimiter, so clients split on newline alone and merely tolerate a trailing carriage return." · p 0.93 · active · 1 support · 0 contradict
  - `src_3c01fb9c03bd` RPC Mode: "RPC mode uses strict JSONL semantics with LF (`\n`) as the only record delimiter."
- `clm_149a0483eb0e` — "Pi's RPC mode carries extension dialogs as a request/response sub-protocol: a dialog method emits an extension_ui_request on stdout and blocks until the client returns a matching extension_ui_response on stdin." · p 0.93 · active · 1 support · 0 contradict
  - `src_3c01fb9c03bd` RPC Mode: "**Dialog methods** (`select`, `confirm`, `input`, `editor`): emit an `extension_ui_request` on stdout and block until the client sends back an `extension_ui_response` on stdin with the matching `id`."
- `clm_e467f67072a9` — "In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI." · p 0.93 · active · 1 support · 0 contradict · when: in RPC mode
  - `src_3c01fb9c03bd` RPC Mode: "Note: `ctx.mode` is `"rpc"` and `ctx.hasUI` is `true` in RPC mode because the dialog and fire-and-forget methods are functional via the extension UI sub-protocol."
- `clm_d1b8f5a83af4` — "Pi offers RPC mode over the CLI as the subprocess-based integration path for callers who do not want to build against the SDK." · p 0.92 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "For subprocess-based integration without building with the SDK, use the CLI directly:"

## Timeline

- 2026-09-11 new_claim `clm_d1b8f5a83af4` (src_0954e1c03a59)
- 2026-09-11 new_claim `clm_11c6703901c8` (src_3c01fb9c03bd)
- 2026-09-11 new_claim `clm_2fe3fab7d249` (src_3c01fb9c03bd)
- 2026-09-11 new_claim `clm_09bf6ccb11c0` (src_3c01fb9c03bd)
- 2026-09-11 new_claim `clm_149a0483eb0e` (src_3c01fb9c03bd)
- 2026-09-11 new_claim `clm_e467f67072a9` (src_3c01fb9c03bd)

## Related

- ← produces [[pi]] (0.94)
- ← uses [[pi-extension]] (0.93)
- → related_to [[pi-sdk]] (0.92)
- [[pi]] — 6 shared claims
- [[pi-extension]] — 2 shared claims
- [[non-interactive-mode]] — 1 shared claim
- [[pi-sdk]] — 1 shared claim
- [[tui]] — 1 shared claim
