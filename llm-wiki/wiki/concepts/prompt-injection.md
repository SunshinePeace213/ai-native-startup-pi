---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
  - {resource: llm-wiki/raw/docs/pi/security.md, title: "Security", id: src_38afec4a51af}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_prompt_injection]
claim_ids: [clm_1d75feeedff1, clm_d444268af3b9, clm_16f6ac707152, clm_1ff93b651fdd, clm_29042914eda1, clm_385d1519d31d, clm_59f21cecd99c, clm_17700ca94539, clm_4a3a128f14d1, clm_81614d317c70, clm_3d6594729375, clm_c89a24eb7edc]
confidence: 0.93
stale_after: 2029-10-09
last_rendered: 2026-09-11T19:52:50Z
review_required: false
---

# prompt injection

> **In here:** Before deploying, an agent should be tested with documents, emails, and tool outputs that deliberately contain injection attempts, confirming Claude ignores them and the screening and confirmation… · 12 claims, confidence 0.93.

## Current understanding

- Third-party content should reach Claude only inside tool_result blocks, never in the system prompt or plain user text, because Claude is trained to treat instructions appearing inside tool results with appropriate skepticism (0.94)
- Because Claude treats tool-result content as untrusted data, an application's own instructions placed there may be ignored or flagged as injection; they belong in a user turn following the tool_result block or, on supported models, a mid-conversation system message (0.94)
- The system prompt should state explicitly that content returned from tools, documents, or searches is untrusted data that must never override the system prompt or the user's original request (0.93)
- Wrapping third-party strings in a JSON object rather than concatenating them into free-form text gives unambiguous delimiters, so an attacker cannot close a quote or tag to break out into an instruction context (0.93)
- Pi treats prompt injection from repository files, comments, documentation, context files, or build output as expected local-agent risk that it cannot reliably prevent (0.93)
- Least privilege limits what a successful injection can do: withhold secrets Claude does not need, run tools in sandboxed environments, and scope permissions as narrowly as possible (0.93)
- Jailbreaks and direct prompt injection treat the application's own user as the adversary crafting bypass inputs, while indirect prompt injection has a trusted user but adversarial instructions inside third-party content Claude processes such as web pages, emails, documents, and tool results (0.93)
- Before deploying, an agent should be tested with documents, emails, and tool outputs that deliberately contain injection attempts, confirming Claude ignores them and the screening and confirmation steps catch the rest (0.93)
- Every MCP server must be verified as trusted before it is connected, because a server that fetches external content can expose the session to prompt injection (0.93)
- Making the nature and origin of untrusted content explicit, in the tool description or the result's structure, helps Claude calibrate how much to trust any directives embedded in it (0.93)
- Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block (0.93)
- Robust protection against jailbreaks and prompt injection comes from layering strategies, such as a directive-carrying system prompt combined with a harmlessness screen tool whose verdict is a structured boolean (0.92)

## Evidence

- `clm_1d75feeedff1` — "Third-party content should reach Claude only inside tool_result blocks, never in the system prompt or plain user text, because Claude is trained to treat instructions appearing inside tool results with appropriate skepticism." · p 0.94 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Put untrusted content only in tool results.** Deliver third-party content to Claude inside `tool_result` blocks, never in `system` prompts or plain user `text` blocks."
- `clm_d444268af3b9` — "Because Claude treats tool-result content as untrusted data, an application's own instructions placed there may be ignored or flagged as injection; they belong in a user turn following the tool_result block or, on supported models, a mid-conversation system message." · p 0.94 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Don't put your own instructions in tool results.** Because Claude treats tool-result content as untrusted data, instructions you place there may be ignored or flagged as a potential injection."
- `clm_16f6ac707152` — "The system prompt should state explicitly that content returned from tools, documents, or searches is untrusted data that must never override the system prompt or the user's original request." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **State the policy in your system prompt.** Tell Claude explicitly that content returned from tools, documents, or searches is untrusted data and must never override the system prompt or the user's original request."
- `clm_1ff93b651fdd` — "Wrapping third-party strings in a JSON object rather than concatenating them into free-form text gives unambiguous delimiters, so an attacker cannot close a quote or tag to break out into an instruction context." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **JSON-encode untrusted content.** Where possible, wrap third-party strings in a JSON object rather than concatenating them into free-form text."
- `clm_29042914eda1` — "Pi treats prompt injection from repository files, comments, documentation, context files, or build output as expected local-agent risk that it cannot reliably prevent." · p 0.93 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "Prompt injection from repository files, comments, documentation, context files, or build output is expected local-agent risk and cannot be reliably prevented by pi."
- `clm_385d1519d31d` — "Least privilege limits what a successful injection can do: withhold secrets Claude does not need, run tools in sandboxed environments, and scope permissions as narrowly as possible." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Limit Claude's access to sensitive data and actions.** Apply the principle of least privilege so that a successful injection can do minimal damage: don't give Claude access to secrets it doesn't need, run tools in sandboxed…"
- `clm_59f21cecd99c` — "Jailbreaks and direct prompt injection treat the application's own user as the adversary crafting bypass inputs, while indirect prompt injection has a trusted user but adversarial instructions inside third-party content Claude processes such as web pages, emails, documents, and tool results." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Jailbreaks and direct prompt injection**, where the *user* of your application is the adversary and crafts inputs intended to bypass your guardrails."
- `clm_17700ca94539` — "Before deploying, an agent should be tested with documents, emails, and tool outputs that deliberately contain injection attempts, confirming Claude ignores them and the screening and confirmation steps catch the rest." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Red-team your own agent.** Before deploying, test your workflow with documents, emails, and tool outputs that deliberately contain injection attempts, and confirm that Claude ignores them and that your screening and confirmation steps…"
- `clm_4a3a128f14d1` — "Every MCP server must be verified as trusted before it is connected, because a server that fetches external content can expose the session to prompt injection." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Verify you trust each server before connecting it. Servers that fetch external content can expose you to [prompt injection risk](/docs/en/security#protect-against-prompt-injection)."
- `clm_81614d317c70` — "Making the nature and origin of untrusted content explicit, in the tool description or the result's structure, helps Claude calibrate how much to trust any directives embedded in it." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Tell Claude what the content is and where it came from.** In the tool's `description`, or in the structure of the result itself, make the nature and source of the content explicit: for example, that it is the body of an inbound email…"
- `clm_3d6594729375` — "Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "Run each tool, pass its raw output to a small classifier call with Claude Haiku 4.5, and only return the content as a `tool_result` block if the screen reports no injection attempt."
- `clm_c89a24eb7edc` — "Robust protection against jailbreaks and prompt injection comes from layering strategies, such as a directive-carrying system prompt combined with a harmlessness screen tool whose verdict is a structured boolean." · p 0.92 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "By layering these strategies, you create a robust defense against jailbreaking and prompt injections, ensuring your Claude-powered applications maintain the highest standards of safety and compliance."

## Timeline

- 2026-08-23 new_claim `clm_4a3a128f14d1` (src_9e7c0cb34402)
- 2026-09-02 new_claim `clm_59f21cecd99c` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_1d75feeedff1` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_81614d317c70` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_16f6ac707152` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_1ff93b651fdd` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_d444268af3b9` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_385d1519d31d` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_3d6594729375` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_17700ca94539` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_c89a24eb7edc` (src_ba6d75fadd1b)
- 2026-09-11 new_claim `clm_29042914eda1` (src_38afec4a51af)

## Related

- ← applies_to [[tool-results]] (0.94)
- ← applies_to [[sandbox]] (0.93)
- ← applies_to [[system-prompt]] (0.93)
- ← related_to [[jailbreak]] (0.93)
- ← related_to [[pi]] (0.93)
- ← applies_to [[claude-haiku-4-5]] (0.93)
- ← applies_to [[defense-in-depth]] (0.92)
- [[tool-results]] — 4 shared claims
- [[jailbreak]] — 2 shared claims
- [[claude-haiku-4-5]] — 1 shared claim
- [[defense-in-depth]] — 1 shared claim
- [[mcp-server]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[sandbox]] — 1 shared claim
- [[structured-outputs]] — 1 shared claim
- [[system-prompt]] — 1 shared claim
