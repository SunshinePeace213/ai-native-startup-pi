---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-field-guide-to-claude-fable-finding-your-unknowns.md, title: "A field guide to Claude Fable 5: Finding your unknowns", id: src_10f512f5f8de}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_unknowns]
claim_ids: [clm_3222da2fb17d, clm_b0580ea608cd, clm_d1a780400436, clm_3b50c521dcf6, clm_67bf5b559bfc, clm_8ca11f550bd7, clm_c1edb617029a, clm_f7b27a70fcaa]
confidence: 0.82
stale_after: 2028-04-16
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# unknowns

> **In here:** Unknowns are the gap between the map — the prompts, skills, and context given to Claude · 8 claims, confidence 0.82.

## Current understanding

- Unknowns are the gap between the map — the prompts, skills, and context given to Claude — and the territory of the codebase and its real constraints, and they sort into four kinds: known knowns, known unknowns, unknown knowns, and unknown unknowns (0.82)
- No amount of planning removes the unknown unknowns waiting in the work, so the implementation session keeps an implementation-notes file logging the decisions and deviations it made, which feeds the next attempt (0.82)
- Every explainer, brainstorm, interview, prototype, and reference is a cheap way to find out what you did not know before it becomes expensive to fix, which is why a long-horizon task coming back wrong usually means more time defining unknowns rather than a better prompt (0.82)
- Claude Fable is the first model where the quality of the work is bottlenecked by the human's ability to clarify its unknowns rather than by the model's capability (0.82)
- The best reference when you cannot describe what you want is source code: pointing Fable at a folder that already implements the behavior gives much richer detail around markup and structure than a screenshot, even when the reference is in a different language (0.82)
- Reducing and planning for your unknowns is the skill of agentic coding — the best agentic coders have relatively few unknowns and assume the rest — and it is a skill that improves by working with Claude (0.82)
- Instructing Claude fails in both directions: too specific and it follows the instructions even where a pivot would be more appropriate, too vague and it falls back on industry best practices that may not fit the task (0.82)
- Reading the diffs after a long session gives only a light understanding because much of the behavior depends on existing code paths, so the closing move is to have Claude quiz you on the change and merge only after passing it (0.82)

## Evidence

- `clm_3222da2fb17d` — "Unknowns are the gap between the map — the prompts, skills, and context given to Claude — and the territory of the codebase and its real constraints, and they sort into four kinds: known knowns, known unknowns, unknown knowns, and unknown unknowns" · p 0.82 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "The difference between the map and the territory is what I call _unknowns_. When Claude runs into an unknown, it needs to make a decision based on its best guess of what I want."
- `clm_b0580ea608cd` — "No amount of planning removes the unknown unknowns waiting in the work, so the implementation session keeps an implementation-notes file logging the decisions and deviations it made, which feeds the next attempt" · p 0.82 · active · 1 support · 0 contradict · when: during implementation
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "But the truth is that no matter how much planning you do, there are always unknown unknowns lurking."
- `clm_d1a780400436` — "Every explainer, brainstorm, interview, prototype, and reference is a cheap way to find out what you did not know before it becomes expensive to fix, which is why a long-horizon task coming back wrong usually means more time defining unknowns rather than a better prompt" · p 0.82 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "Every explainer, brainstorm, interview, prototype, and reference is a cheap way to find out what you didn't know before it gets expensive to fix."
- `clm_3b50c521dcf6` — "Claude Fable is the first model where the quality of the work is bottlenecked by the human's ability to clarify its unknowns rather than by the model's capability" · p 0.82 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "Claude Fable is the first model where I find the quality of the work is bottlenecked by my ability to clarify its unknowns."
- `clm_67bf5b559bfc` — "The best reference when you cannot describe what you want is source code: pointing Fable at a folder that already implements the behavior gives much richer detail around markup and structure than a screenshot, even when the reference is in a different language" · p 0.82 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "While you can include diagrams, documentation or pictures, the absolute best reference is _source code_."
- `clm_8ca11f550bd7` — "Reducing and planning for your unknowns is the skill of agentic coding — the best agentic coders have relatively few unknowns and assume the rest — and it is a skill that improves by working with Claude" · p 0.82 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "In many ways, reducing and planning for your unknowns is the **skill** of agentic coding. But luckily, this is a skill you can improve at, by working with Claude."
- `clm_c1edb617029a` — "Instructing Claude fails in both directions: too specific and it follows the instructions even where a pivot would be more appropriate, too vague and it falls back on industry best practices that may not fit the task" · p 0.82 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "If you are too specific, Claude will follow your instructions even when a pivot may be more appropriate."
- `clm_f7b27a70fcaa` — "Reading the diffs after a long session gives only a light understanding because much of the behavior depends on existing code paths, so the closing move is to have Claude quiz you on the change and merge only after passing it" · p 0.82 · active · 1 support · 0 contradict · when: post implementation
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "Asking Claude to quiz me about the change after giving me a bunch of context helps me understand what happens. I only merge after I pass the quiz perfectly."

## Timeline

- 2026-08-23 new_claim `clm_3b50c521dcf6` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_3222da2fb17d` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_8ca11f550bd7` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_c1edb617029a` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_67bf5b559bfc` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_b0580ea608cd` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_f7b27a70fcaa` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_d1a780400436` (src_10f512f5f8de)

## Related

- → applies_to [[claude-fable-5]] (0.82)
- ← depends_on [[claude-fable-5]] (0.82)
- → part_of [[agentic-coding]] (0.82)
- → related_to [[code-review]] (0.82)
- → related_to [[context-engineering]] (0.82)
- [[claude-fable-5]] — 2 shared claims
- [[agentic-coding]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[context-engineering]] — 1 shared claim
