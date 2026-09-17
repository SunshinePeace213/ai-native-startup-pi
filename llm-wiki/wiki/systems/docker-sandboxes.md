---
type: system
status: current
created: 2026-09-11
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/pi/containerization.md, title: "Containerization", id: src_02faa5c62172}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_docker_sandboxes]
claim_ids: [clm_d417dcb427ab, clm_a52988da66af]
confidence: 0.92
stale_after: 2027-01-29
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# Docker Sandboxes

> **In here:** Docker Sandboxes — 2 claims, confidence 0.92, 1 source.

## Current understanding

- Docker Sandboxes keeps the provider credential off the container: the sandbox holds only a sentinel value and the sbx proxy swaps in the real credential on egress to api.anthropic.com (0.92)
- Authenticating from inside a Docker Sandboxes sandbox defeats the credential-proxy model, because /login writes a real token into the container (0.91)

## Evidence

- `clm_d417dcb427ab` — "Docker Sandboxes keeps the provider credential off the container: the sandbox holds only a sentinel value and the sbx proxy swaps in the real credential on egress to api.anthropic.com." · p 0.92 · active · 1 support · 0 contradict · when: under the Docker Sandboxes pattern
  - `src_02faa5c62172` Containerization: "Unlike the Plain Docker pattern above, the provider credential is not passed into the container. The sandbox receives a sentinel value instead, and the `sbx` proxy substitutes the real credential on egress to `api.anthropic.com`."
- `clm_a52988da66af` — "Authenticating from inside a Docker Sandboxes sandbox defeats the credential-proxy model, because /login writes a real token into the container." · p 0.91 · active · 1 support · 0 contradict · when: under the Docker Sandboxes pattern
  - `src_02faa5c62172` Containerization: "Do not authenticate from inside the sandbox: `/login` there writes a real token into the container and defeats the proxy model."

## Timeline

- 2026-09-11 new_claim `clm_d417dcb427ab` (src_02faa5c62172)
- 2026-09-11 new_claim `clm_a52988da66af` (src_02faa5c62172)

## Related

- ← uses [[pi]] (0.93)
- [[pi]] — 2 shared claims
- [[sandbox]] — 2 shared claims
