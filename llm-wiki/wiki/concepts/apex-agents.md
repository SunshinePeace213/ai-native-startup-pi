---
type: concept
status: current
created: 2026-09-14
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/mercor/apex-agents-leaderboard.md, title: "The AI Productivity Index for Agents", id: src_3858898cebb3}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_apex_agents]
claim_ids: [clm_6ffd89b14afe, clm_d98f2aacd3b1, clm_bab3a2b15a6d, clm_e137fbb880ba, clm_1477650fe609, clm_70222fe06a5d, clm_a97ab413dd9a, clm_d8b15a451f1b, clm_624be223e15d, clm_e91072f63538]
confidence: 0.82
stale_after: 2026-12-07
last_rendered: 2026-09-14T19:58:09Z
review_required: false
---

# APEX-Agents

> **In here:** APEX-Agents ranks on Mean Score, the average share of rubric criteria passed, while Pass@1 counts only tasks scoring 100% of the rubric on a single attempt · 10 claims, confidence 0.82.

## Current understanding

- APEX-Agents ranks on Mean Score, the average share of rubric criteria passed, while Pass@1 counts only tasks scoring 100% of the rubric on a single attempt (0.83)
- APEX-Agents holds 31 worlds comprising 240 tasks with their grading rubrics, each world a data-rich project scenario built by practising professionals (0.83)
- APEX-Agents tests whether AI agents can complete multi-hour professional tasks across investment banking, corporate law, and management consulting using the real tools in Google Suite (0.83)
- APEX-Agents grades the quality of completed work with expert-authored rubrics scored by an LM judge rather than by programmatic environment checks (0.83)
- On the APEX-Agents investment-banking job Gemini 3.7 Flash leads at 71.3, ahead of Claude Opus 5 at 66.6 and Grok 4.6 at 65 (0.81)
- On the APEX-Agents corporate-lawyer job GPT-6 Astra leads at 73.4, ahead of Claude Fable 5.1 at 71.9 and Claude Opus 5 at 70 (0.81)
- On the APEX-Agents management-consultant job Gemini 3.8 Flash leads at 77.5, ahead of Claude Fable 5.1 at 71.6 and Gemini 3.7 Flash at 68.8 (0.81)
- APEX-Agents publishes its eval harness and an open sample subset while keeping the full task set private so models cannot be trained on it (0.81)
- On APEX-Agents 1.1 Claude Fable 5.1 leads Pass@1 at 68.6 while Gemini 3.7 Flash leads Mean Score at 79.4, so the benchmark's two metrics put different models first (0.81)
- The top five APEX-Agents Pass@1 results span 64.7 to 68.6 with reported errors of ±4.9 to ±5.6, so the ordering at the top of the leaderboard sits inside its own error bars (0.80)

## Evidence

- `clm_6ffd89b14afe` — "APEX-Agents ranks on Mean Score, the average share of rubric criteria passed, while Pass@1 counts only tasks scoring 100% of the rubric on a single attempt." · p 0.83 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "Mean Score measures the average percentage of criteria that are passed for all tasks in the benchmark. It is the primary metric used to rank the APEX-Agents leaderboard."
- `clm_d98f2aacd3b1` — "APEX-Agents holds 31 worlds comprising 240 tasks with their grading rubrics, each world a data-rich project scenario built by practising professionals." · p 0.83 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "There are 31 worlds in APEX-agents, comprising 240 tasks and grading rubrics."
- `clm_bab3a2b15a6d` — "APEX-Agents tests whether AI agents can complete multi-hour professional tasks across investment banking, corporate law, and management consulting using the real tools in Google Suite." · p 0.83 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "Tests whether AI agents can complete multi-hour professional tasks across investment banking, corporate law, and management consulting, using real tools in Google Suite."
- `clm_e137fbb880ba` — "APEX-Agents grades the quality of completed work with expert-authored rubrics scored by an LM judge rather than by programmatic environment checks." · p 0.83 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "APEX-Agents evaluates the quality of completed work. Model outputs are graded using expert-authored rubrics with an LM judge."
- `clm_1477650fe609` — "On the APEX-Agents investment-banking job Gemini 3.7 Flash leads at 71.3, ahead of Claude Opus 5 at 66.6 and Grok 4.6 at 65." · p 0.81 · active · 1 support · 0 contradict · when: investment banking analyst job
  - `src_3858898cebb3` The AI Productivity Index for Agents: "Top displayed scores: Gemini 3.7 Flash 71.3, Opus 5 66.6, Grok 4.6 65"
- `clm_70222fe06a5d` — "On the APEX-Agents corporate-lawyer job GPT-6 Astra leads at 73.4, ahead of Claude Fable 5.1 at 71.9 and Claude Opus 5 at 70." · p 0.81 · active · 1 support · 0 contradict · when: corporate lawyer job
  - `src_3858898cebb3` The AI Productivity Index for Agents: "Top displayed scores: GPT-6 Astra 73.4, Fable 5.1 71.9, Opus 5 70"
- `clm_a97ab413dd9a` — "On the APEX-Agents management-consultant job Gemini 3.8 Flash leads at 77.5, ahead of Claude Fable 5.1 at 71.6 and Gemini 3.7 Flash at 68.8." · p 0.81 · active · 1 support · 0 contradict · when: management consultant job
  - `src_3858898cebb3` The AI Productivity Index for Agents: "Top displayed scores: Gemini 3.8 Flash 77.5, Fable 5.1 71.6, Gemini 3.7 Flash 68.8"
- `clm_d8b15a451f1b` — "APEX-Agents publishes its eval harness and an open sample subset while keeping the full task set private so models cannot be trained on it." · p 0.81 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "The eval harness is published on GitHub and sample tasks are on HuggingFace, so you can run the same scoring pipeline against your own model. The full task set stays private so that models can't be trained on it."
- `clm_624be223e15d` — "On APEX-Agents 1.1 Claude Fable 5.1 leads Pass@1 at 68.6 while Gemini 3.7 Flash leads Mean Score at 79.4, so the benchmark's two metrics put different models first." · p 0.81 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "| Fable 5.1 (`claude-fable-5.1`) | Anthropic | max | 68.6 | ±4.9 | 77.1 | ±4.3 | 2026-09-01 | 959 | | Gemini 3.7 Flash (`gemini-3.7-flash`) | Google | high | 67.8 | ±5.1 | 79.4 | ±3.8 | 2026-08-13 | 952 |"
- `clm_e91072f63538` — "The top five APEX-Agents Pass@1 results span 64.7 to 68.6 with reported errors of ±4.9 to ±5.6, so the ordering at the top of the leaderboard sits inside its own error bars." · p 0.80 · active · 1 support · 0 contradict
  - `src_3858898cebb3` The AI Productivity Index for Agents: "| Fable 5.1 (`claude-fable-5.1`) | Anthropic | max | 68.6 | ±4.9 | 77.1 | ±4.3 | 2026-09-01 | 959 | | Gemini 3.7 Flash (`gemini-3.7-flash`) | Google | high | 67.8 | ±5.1 | 79.4 | ±3.8 | 2026-08-13 | 952 | | Grok 4.6 (`grok-4-6-xhigh`) |…"

## Timeline

- 2026-09-14 new_claim `clm_bab3a2b15a6d` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_d98f2aacd3b1` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_e137fbb880ba` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_6ffd89b14afe` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_624be223e15d` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_e91072f63538` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_70222fe06a5d` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_a97ab413dd9a` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_1477650fe609` (src_3858898cebb3)
- 2026-09-14 new_claim `clm_d8b15a451f1b` (src_3858898cebb3)

## Related

- ← produces [[mercor]] (0.83)
- → uses [[llm-as-judge]] (0.83)
- ← owns [[mercor]] (0.81)
- [[gemini-3-7-flash]] — 2 shared claims
- [[mercor]] — 2 shared claims
- [[claude-fable-5-1]] — 1 shared claim
- [[gemini-3-8-flash]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
- [[llm-as-judge]] — 1 shared claim
