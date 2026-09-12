---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/claude-code/tools-reference.md, title: "Tools reference", id: src_ab9f8f38615f}
  - {resource: llm-wiki/raw/docs/pi/containerization.md, title: "Containerization", id: src_02faa5c62172}
  - {resource: llm-wiki/raw/docs/pi/extensions.md, title: "Extensions", id: src_a49af96a95e8}
  - {resource: llm-wiki/raw/docs/pi/packages.md, title: "Pi Packages", id: src_1589290f55f3}
  - {resource: llm-wiki/raw/docs/pi/security.md, title: "Security", id: src_38afec4a51af}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_sandbox]
claim_ids: [clm_a9cd0f68d4eb, clm_ad0fdc5c03ce, clm_385d1519d31d, clm_918dd20a3e91, clm_11421224af57, clm_cfe96221e72b, clm_b89352b18fc5, clm_c381a5766221, clm_d417dcb427ab, clm_a52988da66af, clm_ea3893719806, clm_fba2df5be733]
confidence: 0.90
stale_after: 2027-01-29
last_rendered: 2026-09-11T20:02:51Z
review_required: false
---

# sandbox

> **In here:** Sandboxes give agents safe operating environments: rather than executing locally, the harness connects to a sandbox to run code, inspect files, and install dependencies in isolation · 12 claims, confidence 0.90.

## Current understanding

- Pi's project trust decides only whether project-local settings, resources, packages, and extensions are loaded; it is not a sandbox and places no limit on what tools may do once a session is running (0.94)
- Pi ships no built-in sandbox: its built-in tools read, write, edit, and run shell commands with the permissions of the pi process, and extensions are TypeScript modules running at those same permissions (0.94)
- Least privilege limits what a successful injection can do: withhold secrets Claude does not need, run tools in sandboxed environments, and scope permissions as narrowly as possible (0.93)
- Isolating Pi takes one of two shapes: run the whole pi process inside an isolated environment, or run pi on the host and route tool execution into one (0.93)
- Pi packages run with full system access — extensions execute arbitrary code and skills can direct the model to run executables — so third-party package source should be reviewed before installing (0.93)
- Pi extensions run with the user's full system permissions and can execute arbitrary code, so only trusted sources should be installed (0.93)
- Pi omits an in-process sandbox deliberately, on the reasoning that a partial one reads as a security boundary while still depending on the host shell, filesystem, package managers, credentials, and extension code, so real isolation has to come from the OS or a virtualization boundary (0.93)
- Read and Edit deny rules reach only the file commands Claude Code recognizes inside Bash, not arbitrary subprocesses that open files themselves, so OS-level enforcement across every process requires enabling the sandbox (0.93)
- Docker Sandboxes keeps the provider credential off the container: the sandbox holds only a sentinel value and the sbx proxy swaps in the real credential on egress to api.anthropic.com (0.93)
- Authenticating from inside a Docker Sandboxes sandbox defeats the credential-proxy model, because /login writes a real token into the container (0.92)
- Sandboxes give agents safe operating environments: rather than executing locally, the harness connects to a sandbox to run code, inspect files, and install dependencies in isolation (0.78)
- A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution (0.78)

## Evidence

- `clm_a9cd0f68d4eb` — "Pi's project trust decides only whether project-local settings, resources, packages, and extensions are loaded; it is not a sandbox and places no limit on what tools may do once a session is running." · p 0.94 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "Project trust controls whether pi loads project-local settings, resources, packages, and extensions. It is not a sandbox and it does not restrict what the model can ask tools to do after you start working in a directory."
- `clm_ad0fdc5c03ce` — "Pi ships no built-in sandbox: its built-in tools read, write, edit, and run shell commands with the permissions of the pi process, and extensions are TypeScript modules running at those same permissions." · p 0.94 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "Pi does not include a built-in sandbox. Built-in tools can read files, write files, edit files, and run shell commands with the permissions of the pi process. Extensions are TypeScript modules that run with the same permissions."
- `clm_385d1519d31d` — "Least privilege limits what a successful injection can do: withhold secrets Claude does not need, run tools in sandboxed environments, and scope permissions as narrowly as possible." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Limit Claude's access to sensitive data and actions.** Apply the principle of least privilege so that a successful injection can do minimal damage: don't give Claude access to secrets it doesn't need, run tools in sandboxed…"
- `clm_918dd20a3e91` — "Isolating Pi takes one of two shapes: run the whole pi process inside an isolated environment, or run pi on the host and route tool execution into one." · p 0.93 · active · 1 support · 0 contradict
  - `src_02faa5c62172` Containerization: "There are two general options. You can either 1. run the whole `pi` process inside an isolated environment, or 2. run `pi` on the host and route tool execution into an isolated environment."
- `clm_11421224af57` — "Pi packages run with full system access — extensions execute arbitrary code and skills can direct the model to run executables — so third-party package source should be reviewed before installing." · p 0.93 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "Pi packages run with full system access. Extensions execute arbitrary code, and skills can instruct the model to perform any action including running executables. Review source code before installing third-party packages."
- `clm_cfe96221e72b` — "Pi extensions run with the user's full system permissions and can execute arbitrary code, so only trusted sources should be installed." · p 0.93 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Extensions run with your full system permissions and can execute arbitrary code. Only install from sources you trust."
- `clm_b89352b18fc5` — "Pi omits an in-process sandbox deliberately, on the reasoning that a partial one reads as a security boundary while still depending on the host shell, filesystem, package managers, credentials, and extension code, so real isolation has to come from the OS or a virtualization boundary." · p 0.93 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "A partial in-process sandbox would be easy to misunderstand as a security boundary while still depending on the host shell, filesystem, package managers, credentials, and extension code."
- `clm_c381a5766221` — "Read and Edit deny rules reach only the file commands Claude Code recognizes inside Bash, not arbitrary subprocesses that open files themselves, so OS-level enforcement across every process requires enabling the sandbox." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "[Read and Edit deny rules](/docs/en/permissions#tool-specific-permission-rules) also apply to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, `sed`, and `grep`, but not to arbitrary subprocesses that read or…"
- `clm_d417dcb427ab` — "Docker Sandboxes keeps the provider credential off the container: the sandbox holds only a sentinel value and the sbx proxy swaps in the real credential on egress to api.anthropic.com." · p 0.93 · active · 1 support · 0 contradict · when: under the Docker Sandboxes pattern
  - `src_02faa5c62172` Containerization: "Unlike the Plain Docker pattern above, the provider credential is not passed into the container. The sandbox receives a sentinel value instead, and the `sbx` proxy substitutes the real credential on egress to `api.anthropic.com`."
- `clm_a52988da66af` — "Authenticating from inside a Docker Sandboxes sandbox defeats the credential-proxy model, because /login writes a real token into the container." · p 0.92 · active · 1 support · 0 contradict · when: under the Docker Sandboxes pattern
  - `src_02faa5c62172` Containerization: "Do not authenticate from inside the sandbox: `/login` there writes a real token into the container and defeats the proxy model."
- `clm_ea3893719806` — "Sandboxes give agents safe operating environments: rather than executing locally, the harness connects to a sandbox to run code, inspect files, and install dependencies in isolation." · p 0.78 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**Sandboxes give agents safe operating environments.** Instead of executing locally, the harness connects to a sandbox to run code, inspect files, install dependencies, and complete tasks. This creates secure, isolated execution."
- `clm_fba2df5be733` — "A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution." · p 0.78 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "- System Prompts - Tools, Skills, MCPs and their descriptions - Bundled Infrastructure (filesystem, sandbox, browser) - Orchestration Logic (subagent spawning, handoffs, model routing) - Hooks/Middleware for deterministic execution…"

## Timeline

- 2026-08-23 new_claim `clm_fba2df5be733` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_ea3893719806` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_c381a5766221` (src_ab9f8f38615f)
- 2026-09-02 new_claim `clm_385d1519d31d` (src_ba6d75fadd1b)
- 2026-09-11 new_claim `clm_a9cd0f68d4eb` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_ad0fdc5c03ce` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_b89352b18fc5` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_918dd20a3e91` (src_02faa5c62172)
- 2026-09-11 new_claim `clm_d417dcb427ab` (src_02faa5c62172)
- 2026-09-11 new_claim `clm_a52988da66af` (src_02faa5c62172)
- 2026-09-11 new_claim `clm_11421224af57` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_cfe96221e72b` (src_a49af96a95e8)

## Related

- → applies_to [[prompt-injection]] (0.93)
- ← uses [[pi]] (0.93)
- → extends [[permission-rule]] (0.93)
- ← related_to [[pi]] (0.93)
- → part_of [[agent-harness]] (0.78)
- ← uses [[agent-harness]] (0.78)
- [[pi]] — 8 shared claims
- [[agent-harness]] — 2 shared claims
- [[docker-sandboxes]] — 2 shared claims
- [[pi-extension]] — 2 shared claims
- [[bash-tool]] — 1 shared claim
- [[filesystem]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[permission-rule]] — 1 shared claim
- [[pi-package]] — 1 shared claim
- [[prompt-injection]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[workspace-trust]] — 1 shared claim
