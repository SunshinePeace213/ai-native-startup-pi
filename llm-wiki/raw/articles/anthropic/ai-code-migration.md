---
source: https://claude.com/blog/ai-code-migration
fetched: 2026-08-23
author: Anthropic (Claude blog)
last_modified: 2026-07-16
---
> **In here:** Six-step AI-agent process for large language-to-language code migrations · Bun's Zig-to-Rust and an internal Python-to-TypeScript port as worked examples · best-practice loop-design lessons (rulebook, adversarial review, mechanical work queue)

# How Anthropic runs large-scale code migrations with Claude Code

Subtitle: a step-by-step guide to running large code migrations with AI agents, including Bun's million-line Zig-to-Rust port.

Published July 16, 2026. Blog categories: Claude Code, Enterprise AI. Product: Claude Code.

**Note on this archive:** this page is rendered by client-side JavaScript, and this session's local HTML-to-text tooling was found to fabricate body text not present in the fetched HTML (a data-integrity problem, not a copyright one). To keep this archive strictly grounded in verifiable source content, the sections below are a structurally faithful, paraphrased account of the article — headings follow the source order, and every number, name, and link below was confirmed to appear in the live page. This is not a verbatim reproduction of the article's prose; consult the canonical URL above for exact wording.

## What is an AI code migration?

The article opens by framing "code migration" projects — porting a production codebase to a new language — as historically multi-year efforts. It states that in the last month, individual developers at Anthropic migrated 10 code packages (tens to hundreds of thousands of lines each) using Claude Fable 5, Claude Opus 4.8, and dynamic workflows, and that the piece covers two of those migrations plus best practices drawn from them. It defines an AI code migration as one where engineers write migration rules and verification loops and agents translate, compile, and test code until the new version's behavior matches the original — compressing multi-year projects into weeks. The article's stated core insight: "you don't fix the code. You fix the process (loop) that produced the code."

The two worked examples:

- **Jarred Sumner**, co-founder of Bun and Member of Technical Staff at Anthropic, used Claude Code to migrate Bun from Zig to Rust — a million lines of code produced in less than two weeks, with 100% of Bun's existing test suite passing in CI before merge, and 19 regressions surfaced (and fixed) after merge. The Rust port shipped inside Claude Code in June.
- **Mike Krieger**, co-lead of Anthropic Labs, migrated a Python codebase to 165,000 lines of TypeScript over a weekend, involving hundreds of agents, eight phase gates, three adversarial review rounds, and a final parity check diffing every command's output against the Python original.

## Why and when to migrate languages

The article discusses why teams launch migrations (a known trade-off becoming limiting, a better approach emerging, or the original ecosystem shrinking), using Jarred's original choice of Zig for Bun — chosen for C-level performance with simplicity while building solo pre-LLM — as an example, noting Bun's CLI now gets over 10 million monthly downloads. It argues AI-assisted migration lowers the career and cost risk that made these "mega-projects" hard to justify (worst case is now discarding a branch, not living with 90% parity), while still noting such projects cost tens to hundreds of thousands of dollars or more. Specific costs cited: the Bun migration consumed 5.9 billion uncached input tokens and 690 million output tokens, roughly $165,000 at API pricing; the main portion of Mike's port was 27 million tokens.

A figure captioned "Jarred's million-line PR" (screenshot) appears in this section.

The article states the migration case no longer needs to be existential — Mike's project was prompted by a slow compile step: producing the internal tool's single-binary release with the Python toolchain took roughly eight minutes per platform (about 30 minutes across the full build matrix); after the TypeScript port, the same compile takes about two seconds, the binary starts 6x faster, and a separate deployment pipeline could be retired.

## Why AI changes the code migration math

The article credits Claude Fable 5 (described as Anthropic's most capable generally-available model) and Opus 4.8 with being particularly good at delegating, directing, and verifying parallel agent workstreams. It lists why large migrations suit this: the work parallelizes across many independent files/units; the old code is a clear, comprehensive spec; large codebases usually have a built-in referee (an existing test suite) that lets agents grind against objective ground truth; failing compiler/test runs generate the next work-queue item automatically; and the process is designed so drift/edge cases become rules the next agent follows rather than silent divergence. Both Jarred and Mike are said to have used Fable for key steps, particularly in an "advisory pattern" mixing model classes to manage token consumption.

## Six steps for large code migrations

The article says this process has been generalized across languages/scenarios, points to Jarred's own blog post and to a public "Migration starter kit" repository (github.com/anthropics/code-migration-kit-with-claude-code) as a generalized template — explicitly noting the kit is not literally what these specific ports ran on.

### Prerequisites

Before starting, the article says you need a strong "judge" able to evaluate original and target code on equal terms, built by: categorizing existing tests into those expressible as external calls versus those tied to internals that won't port; rewriting the portable ones into assertions runnable against both codebases (checked by adversarial agents so rewrites don't weaken assertions); and validating the judge itself against both correct and deliberately broken code. Jarred had a large existing test suite in a third language; Mike instead built a parity harness of seven real-world scenarios and treated any behavioral difference as a bug.

A diagram of the overall six-step, gated loop (following mainly Jarred's methodology) appears here; the article notes Mike used a similar loop structure but ran the whole migration end-to-end, revised rules/workflow, and reran it, discarding output twice before keeping the third run.

### Step 1 — Create the rulebook, dependency map, and gap inventory

Described as building an inventory of places needing refactoring (not just translation), a rulebook for translation, and a dependency map to sequence workstreams — with the rulebook required before the gap inventory, and the two audited jointly.

- **Rulebook**: shape depends on whether the target code keeps the same structure (Jarred's case — mostly lookup tables mapping types/idioms, deferring hard cases to the gap inventory) or is redesigned (Mike's case — a design document). Jarred built his by talking policy decisions through with Claude and using eight subagents, each reviewing for one of eight failure-mode categories from his own intuition.
- **Dependency map**: needed to batch files correctly for parallel migration; Claude Code agents build this via a deterministic script, using a review-and-fix loop from the starter kit's prompt.
- **Gap inventory and skeptic reviewers**: covers requirements the new language imposes that the old one didn't. For Zig→Rust this was manual memory management — the article contrasts a Zig function that silently requires the caller to remember to free a buffer (compiles fine if you forget) against Rust's ownership model, where forgetting to free needs no explicit call and double-free/use-after-move don't compile. For Python→TypeScript the gap was implicit vs. explicit interfaces — the article contrasts a Python `register(handler)` function that accepts anything with `.setup()`/`.run()` (discoverable only by reading the whole codebase) against a TypeScript version requiring an explicit `Handler`/`RunResult` interface before it compiles. Jarred inventoried gaps up front; Mike translated first and audited gaps afterward, and the article suggests you may need both approaches.

### Step 2 — Stress-test the rules

A "shakedown cruise" mini-migration. Jarred ran three files through one agent using the rulebook, three files through an agent translating "like a senior Rust engineer," and a third agent diffing the two to generate new rules — catching two critical issues before they could propagate across all 1,448 files. The article says this line-by-line comparison approach only works for structure-preserving migrations; for a redesign like Mike's, the equivalent is adversarial review of the design document plus a disposable end-to-end run. Translated files from this step are thrown away regardless — the goal is refining rules, not progress.

### Step 3 — Translate everything

Runs the same implement/review/fix multi-agent loop for the remaining steps. Implementer work can go to smaller models while reviewers use larger ones — Mike fanned out 12 subagents on Claude Sonnet for the main migration. The work queue is mechanical: a batch script checks which translated files exist on disk and slices the rest into batches, making the migration resumable by construction. Agents that are overly cautious get a blunt prompt reminding them the compiler will catch mistakes later; anything a translator can't confidently execute gets flagged `// TODO(port): <reason>` for step 4. Two adversarial reviewers check implementer work in separate contexts, with disagreements escalated to a third agent; a recurring mistake across files gets fixed by adding a sentence to the rulebook and regenerating the affected batch, rather than hand-patching code. The article notes a design choice: Mike ran the TypeScript compiler inside every loop (fast, seconds), while Jarred deferred the compiler to the next step entirely because Cargo builds take minutes.

### Steps 4, 5, 6 — Compile, run, and match behavior

Covered together as sharing the same loop architecture with progressively less human judgment needed (step 4 sometimes dissolves into step 3).

- **Step 4 (compile)**: Jarred used an orchestrator script invoking the compiler once across the workspace, with "fixer agents" working the error list in parallel under adversarial review, rebuilding repeatedly. Reviewing the error list surfaced systemic issues — e.g., thousands of Rust module errors after fixing cyclic imports that Zig's lazy compilation had tolerated, fixed by encoding logic to classify which dependencies to delete, move, or restructure.
- **Step 5 (run/smoke test)**: crashes from smoke tests are grouped by root cause and reviewed by adversarial subagents.
- **Step 6 (match behavior)**: translated, compiled, smoke-tested files are sharded and run against the prerequisite test suite; "fixer agents" address failures by comparing both codebases, checked by adversarial reviewers. A "build daemon" script is introduced as the only process allowed to rebuild the binary — fixers write patches, the daemon batches them, rebuilds once, reruns affected tests, and feeds results back, serializing the most expensive operation. Repeated failures across many tests get fixed upstream by amending the rule that produced the bug and regenerating only the files it touched. For codebases without a built-out test suite (Mike's situation), Claude built a small script running seven real-world scenarios against both the port and the original, with a fix agent per failing scenario until all seven passed — then Claude designed its own end-to-end test suite and ran it autonomously overnight for four nights running, fixing what broke each time and catching edge cases no scenario list predicted. The article's stated lesson: a missing test suite doesn't block this step — if you can't inherit a referee, have Claude build one, since the original codebase remains the ground truth either way.

## Code migrations best practices

Presented as a bullet list of lessons that held across projects:

- Don't follow the guide blindly — treat it as a starting point and plan your specific migration with Claude first.
- Don't focus on individual failures — that's the loop's job; keep attention on patterns.
- Make review adversarial and verification mechanical — let scripts (compiler, diff, test suite) be the referee.
- Don't use the largest model for everything — reserve it for reviewers and rule-writing, and use smaller models for high-volume implementation.
- Front-load the human hours into the rulebook and stress test; most of what follows is queues burning down.
- Make the work queue mechanical and resumable — "done" should mean the output file exists on disk.

## Review loop results, not code

Jarred's Bun migration is now in production. The article reports trade-offs and results: about 4% of the Rust code sits inside "unsafe" blocks (mostly single-line pointer operations at C/C++ boundaries); every memory leak the team's tooling can detect has been fixed, with one benchmark of 2,000 repeated builds dropping from 6,745 MB to 609 MB of memory; the binary is 19% smaller on Linux and Windows; and cross-language optimization made it 2–5% faster across HTTP serving and real-world workloads like `next build` and `tsc`. It closes by inviting readers to reconsider a long-deferred migration and ask Claude what the process would look like for their codebase.

## Related links cited in the article

- Bun's own write-up: [Bun in Rust](https://bun.com/blog/bun-in-rust) (and its ["just be really smart and don't make mistakes"](https://bun.com/blog/bun-in-rust#just-be-really-smart-and-don-t-make-mistakes) section)
- [Migration starter kit](https://github.com/anthropics/code-migration-kit-with-claude-code) (generalized template, not what these specific ports ran on), including:
  - [Rulebook template](https://github.com/anthropics/code-migration-kit-with-claude-code/blob/main/templates/RULEBOOK.md)
  - [Dependency-map prompt](https://github.com/anthropics/code-migration-kit-with-claude-code/blob/main/prompts/01-dependency-map.md)
  - [Gap-inventory prompt](https://github.com/anthropics/code-migration-kit-with-claude-code/blob/main/prompts/02-gap-inventory.md)
  - [Stress-test prompt](https://github.com/anthropics/code-migration-kit-with-claude-code/blob/main/prompts/03-stress-test.md)
  - [Translation-kickoff prompt](https://github.com/anthropics/code-migration-kit-with-claude-code/blob/main/prompts/04-translation-kickoff.md)
  - [Build daemon script](https://github.com/anthropics/code-migration-kit-with-claude-code/blob/main/scripts/build_daemon.sh)
- [Code-modernization plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-modernization) — for legacy modernization and framework upgrades rather than language ports
- [Introducing dynamic workflows in Claude Code](https://claude.com/blog/introducing-dynamic-workflows-in-claude-code)

## Images

The article's live page carries at least two content figures: a screenshot captioned "Jarred's million-line PR" and a diagram of the six-step migration loop with review gates (plus per-step illustrations for steps 1–6). This session's fetch tooling could not confirm stable, directly downloadable image URLs for these figures from the static HTML (the page loads its CMS assets client-side); they are not localized in this archive. Consult the canonical URL for the images.
