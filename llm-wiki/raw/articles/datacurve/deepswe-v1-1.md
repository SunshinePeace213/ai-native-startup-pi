---
source: https://deepswe.datacurve.ai/blog/deepswe-v1-1
fetched: 2026-09-15
author: Wenqi Huang, Peter Jiang (Datacurve)
last_modified: 2026-09-03
---
> **In here:** DeepSWE v1.1 grading changes (isolated verification, CTRF reports, natural git env) · leaderboard/pass-rate table across models and reasoning efforts · v1 vs v1.1 per-task and per-config score comparison

# DeepSWE v1.1

Updated execution and grading for the same long-horizon engineering tasks.

Wenqi Huang, Peter Jiang · June 14, 2026

DeepSWE v1.1 keeps the same long-horizon engineering tasks as [v1](/blog/deepswe), but updates how agents are executed and scored by grading their committed code in a clean, isolated environment, making results easier to reproduce, audit, and analyze. We also fixed dependency drift and removed flaky tests on some tasks.

With the updated setup, now including Claude Fable 5 and Kimi K2.7 Code, aggregate pass rates and model ordering remain close to v1.

v1.1v1

CostOutput tokensAgent steps

113 tasks · updated September 3, 2026 · [changelog](/changelog)Configs(57/70)

DeepSWE score$0$5.00$100%10%20%30%40%50%60%70%80%Avg cost per taskmost efficient ↗gpt-5.6-lunaMEDIUMgemini-3.5-flashHIGHglm-5.2MAXgemini-3.6-flashHIGHclaude-sonnet-5HIGHclaude-opus-4.8HIGHdeepseek-v4-flashMAXgpt-5.5MEDIUMmuse-spark-1.2XHIGHqwen3.8-maxXHIGHgpt-5.6-solMEDIUMdeepseek-v4-proMAXglm-5.3-flashMAXgemini-3.7-flashMEDIUMgrok-4.6XHIGHkimi-k3MAXclaude-fable-5HIGHglm-5.3MAXclaude-opus-5MAXgemini-3.8-flashHIGHgpt-6-astraXHIGH

v1.1v1

BestAll effort levels

Models(21/28)

Model

Pass@1

Avg cost

Out tok

Steps

gpt-6-astra[xhigh]

74%±3%

Avg cost $6.52Out tok 30kSteps 29

74%±3%

$6.52

30k

29

gemini-3.8-flash[high]

74%±1%

Avg cost $2.36Out tok 143kSteps 166

74%±1%

$2.36

143k

166

claude-opus-5[max]

74%±4%

Avg cost $11.84Out tok 118kSteps 99

74%±4%

$11.84

118k

99

gpt-5.6-sol[max]

73%±3%

Avg cost $6.46Out tok 60kSteps 61

73%±3%

$6.46

60k

61

claude-fable-5[xhigh]

70%±3%

Avg cost $13.41Out tok 80kSteps 68

70%±3%

$13.41

80k

68

glm-5.3[max]

69%±3%

Avg cost $3.99Out tok 80kSteps 124

69%±3%

$3.99

80k

124

kimi-k3[max]

69%±5%

Avg cost $4.65Out tok 81kSteps 98

69%±5%

$4.65

81k

98

grok-4.6[medium]

67%±2%

Avg cost $3.45Out tok 50kSteps 70

67%±2%

$3.45

50k

70

gpt-5.6-luna[max]

67%±4%

Avg cost $0.61Out tok 73kSteps 102

67%±4%

$0.61

73k

102

gpt-5.5[xhigh]

67%±6%

Avg cost $7.23Out tok 46kSteps 82

67%±6%

$7.23

46k

82

gemini-3.7-flash[medium]

65%±3%

Avg cost $2.03Out tok 94kSteps 117

65%±3%

$2.03

94k

117

glm-5.3-flash[max]

63%±4%

Avg cost $0.24Out tok 73kSteps 123

63%±4%

$0.24

73k

123

deepseek-v4-pro[max]

63%±6%

Avg cost $1.67Out tok 106kSteps 155

63%±6%

$1.67

106k

155

claude-opus-4.8[max]

59%±2%

Avg cost $13.22Out tok 135kSteps 120

59%±2%

$13.22

135k

120

qwen3.8-max[xhigh]

57%±3%

Avg cost $3.73Out tok 95kSteps 111

57%±3%

$3.73

95k

111

muse-spark-1.2[xhigh]

55%±2%

Avg cost $3.70Out tok 99kSteps 101

55%±2%

$3.70

99k

101

claude-sonnet-5[max]

54%±4%

Avg cost $26.40Out tok 214kSteps 268

54%±4%

$26.40

214k

268

deepseek-v4-flash[max]

53%±4%

Avg cost $0.46Out tok 108kSteps 153

53%±4%

$0.46

108k

153

gemini-3.6-flash[high]

47%±4%

Avg cost $2.21Out tok 96kSteps 117

47%±4%

$2.21

96k

117

glm-5.2[max]

44%±2%

Avg cost $3.92Out tok 78kSteps 129

44%±2%

$3.92

78k

129

gemini-3.5-flash[high]

36%±4%

Avg cost $3.45Out tok 76kSteps 105

36%±4%

$3.45

76k

105

0%20%40%60%80%

Note: 73 of Claude Fable 5's 2,260 trials did not complete due to [access being suspended by a US government directive](https://www.anthropic.com/news/fable-mythos-access) partway through our sweep. Pass rates are computed over the completed trials.

Wall-clock time is no longer reported as it is highly dependent on external variables like host machine performance and provider load, making it an inconsistent metric.

## Explore

View the benchmark on GitHub, browse every rollout behind the numbers above, or run your own agent against the benchmark.

[Browse trajectories](/data/v1.1/trials)[Run DeepSWE](/run)[GitHub](https://github.com/datacurve-ai/deep-swe)

## What changed

Agent container

Checks out `main` (with future git history deleted), commits to feature branch.

committed diff only

Verifier container

Fresh container. Applies the diff, executes tests, produce CTRF report.

  1. **Isolated Verification:** The agent commits its proposed changes, and we extract the git patch to evaluate in an isolated container, separate from where the agent worked. This follows the same approach as SWE-bench, and keeps grading independent of the agent's runtime environment for reproducible results.
  2. **Structured test reports:** Tests now emit a CTRF report, recording each test that defines a task by name and status. This gives us a per-test view of what passed and failed, useful for analyzing results and spotting partial progress on a task.
  3. **Natural Git Environment:** Rather than operating in detached HEAD mode, we set the `main` branch to the task's starting commit and ensure no future commits are visible. This enables agents to work more naturally from the `main` branch, formulate feature branches, and explicitly commit its changes as it would in normal development.



To elaborate on the git environment: one concern with our previous environment construction method was that if an implementation similar to a task had been merged upstream, the agent could potentially cheat by finding it through `git log`. We conducted a sweep of the tasks' upstream repos to check whether any had implementations similar to our tasks as of June 5th. We found no such instances, meaning results from v1.0 remain free of this form of cheating.

Together, these changes make tasks harder to game. Because we grade only the committed patch in a separate container, some easier shortcuts no longer work: an agent can't monkey-patch the test framework, and because the CTRF report records each task-defining test by name, dropping tests or forcing an early exit shows up as missing or failed results rather than a pass.

## Impact on Results

The chart below compares each model's pass rate under v1 and v1.1. Scores stay close: the ordering at the top is unchanged, and most configurations land within a few points of their v1 result.

gpt-5.5[xhigh]

70%→67%-3.0%

gpt-5.5[high]

62%→64%+2.4%

claude-opus-4.8[max]

58%→59%+0.8%

claude-opus-4.8[xhigh]

58%→54%-3.4%

gpt-5.5[medium]

48%→54%+6.0%

claude-opus-4.8[high]

51%→52%+1.1%

gpt-5.4[xhigh]

56%→52%-3.8%

claude-opus-4.8[medium]

47%→49%+1.3%

claude-sonnet-4.6[high]

32%→30%-1.8%

0%20%40%60%80%

v1v1.1

The 9 configurations run in both versions. Hollow dot is v1, filled dot is v1.1; the change in points is at right.

Taskv1v1.1Difference

abs-module-cache-flags89%89%+0.0%

abs-stepped-slices89%81%-8.3%

actionlint-action-pinning-lint89%89%+0.0%

adaptix-name-mapping-aliases75%78%+2.8%

aiomonitor-task-snapshots-diff89%80%-8.9%

anko-default-function-arguments78%78%+0.0%

anko-typed-variable-bindings53%53%+0.0%

arcane-drift-detection-baselines64%67%+2.2%

arktype-json-schema-refs-dependencies31%42%+11.1%

awilix-async-container-initialization28%31%+2.8%

bandit-incremental-cache-control53%64%+11.1%

bandit-interprocedural-taint-checks61%50%-11.1%

bandit-structured-nosec-directives3%0%-2.8%

boa-hierarchical-evaluation-cancellation51%53%+1.7%

cattrs-partial-structuring-recovery58%67%+8.3%

clack-async-autocomplete-options17%22%+5.1%

claude-code-by-agents-recursive-delegation11%47%+36.1%

cliffy-config-file-parsing39%31%-8.3%

csstree-shorthand-expansion-compression28%33%+5.6%

dasel-html-document-format47%61%+13.9%

dateutil-rfc5545-timezone-interop17%36%+19.4%

drizzle-orm-window-function-builders93%89%-4.4%

dynamodb-toolbox-conditional-attribute-requirements89%83%-5.6%

dynamodb-toolbox-lazy-recursive-schemas60%89%+28.9%

effect-sse-httpapi-streaming20%25%+5.0%

eicrud-keyset-pagination-cursor42%22%-19.4%

etree-xml-diff-patch72%69%-2.8%

expr-try-catch-errors11%19%+8.3%

fastapi-deprecation-response-headers64%56%-8.9%

fastapi-implicit-head-options53%56%+2.2%

fd-deterministic-multi-key-sorting33%44%+11.1%

geo-shapeindex-serialization53%53%+0.0%

go-critic-doc-link-checker58%50%-7.8%

go-genai-streamed-function-args83%75%-8.3%

go-git-worktree-merge-conflicts67%50%-16.7%

goreleaser-retry-publish-auditing59%64%+4.5%

gql-incremental-graphql-delivery6%3%-2.8%

happy-dom-abort-pending-body-reads100%97%-2.8%

happy-dom-deterministic-intersectionobserver19%11%-8.3%

helm-array-merge-strategies19%36%+16.7%

helm-unified-manifest-stream78%81%+2.8%

httpx-deterministic-cookie-store92%89%-2.8%

httpx-multipart-response-parsing73%61%-12.2%

httpx-streaming-json-iteration33%28%-5.6%

igel-persist-feature-schema36%44%+8.9%

ink-grid-box-layout17%17%+0.0%

ipython-session-bundle-replay53%39%-13.9%

katex-multicolumn-array-spans22%19%-2.8%

kcp-go-multiplexed-kcp-streams53%67%+13.3%

kea-atomic-signal-selectors64%55%-9.1%

kgateway-consistent-hash-policy78%64%-13.9%

kombu-single-active-consumer-priority64%64%+0.0%

kombu-virtual-queue-dead-lettering14%22%+8.3%

koota-composite-trait-aspects36%42%+5.6%

koota-deferred-mutation-buffer27%22%-4.4%

koota-entity-snapshot-rollback97%97%+0.0%

koota-pair-relation-tracking19%17%-2.8%

koota-query-predicates22%22%+0.0%

kysely-window-grouping-helpers89%81%-8.3%

langchain-request-coalescing16%25%+9.4%

mashumaro-flattened-dataclass-fields25%25%+0.0%

meriyah-explicit-resource-declarations42%33%-8.3%

mnamer-daemon-watch-lifecycle81%67%-13.9%

mobly-grouped-test-barriers67%61%-5.6%

narwhals-rolling-window-suite33%100%+66.7%

numba-stencil-boundary-modes83%81%-2.3%

obsidian-linter-auto-table-of-contents14%0%-13.9%

obsidian-linter-link-format-conversion25%28%+2.8%

obsidian-linter-scoped-ignore-markers83%72%-11.1%

ofetch-per-origin-circuit-breaker94%83%-11.4%

onedump-dump-encryption-pipeline39%39%+0.0%

opa-rego-rule-profiling53%53%-0.3%

opa-template-string-reconstruction67%69%+2.8%

optique-conditional-option-dependencies28%36%+8.3%

oxvg-structural-selector-preservation14%11%-2.8%

participle-grammar-conflict-analysis42%29%-12.2%

pebble-durability-wait-apis69%69%+0.0%

pest-character-class-coalescing8%14%+5.6%

prometheus-transactional-reload-status3%11%+8.3%

prometheus-typed-label-sorting38%53%+15.0%

psd-tools-blend-range-api80%83%+3.3%

pwntools-tube-multiplexing44%53%+8.3%

python-statemachine-state-data-scoping33%25%-8.3%

query-persist-restored-query-state81%64%-16.7%

quill-shared-toolbar-focus0%19%+19.4%

returns-validated-error-accumulation89%89%+0.0%

scc-bounded-memory-spilling53%67%+13.9%

scriggo-method-declarations78%67%-11.1%

skrub-duration-encoding24%67%+42.2%

sql-formatter-bigquery-pipe-formatting94%89%-5.6%

sqlfmt-create-table-ddl-formatting44%25%-19.4%

sqlite-utils-safe-import-checkpoints64%61%-2.8%

superjson-error-stack-serialization33%32%-1.1%

task-task-graph-export81%86%+5.6%

tengo-callable-instance-isolation64%67%+2.2%

tengo-destructuring-bindings67%75%+8.3%

termenv-preserve-ansi-resets17%9%-7.6%

testem-bail-on-test-failure25%14%-11.1%

testem-per-launcher-reports81%94%+13.9%

textual-kitty-key-phases56%47%-8.3%

textual-richlog-follow-state69%67%-2.8%

tomlkit-toml-table-converters80%75%-5.0%

true-myth-iterable-collection-combinators97%97%+0.0%

ts-pattern-match-each72%67%-5.6%

updo-policy-alerting20%9%-11.4%

valibot-recursive-schema-composition71%72%+1.1%

vitest-duration-sharding75%92%+16.7%

vulture-persistent-analysis-cache83%17%-66.7%

wasmi-trap-coredumps75%86%+11.1%

wazero-multi-module-snapshots69%71%+1.1%

yaegi-go-embed-directives78%58%-19.4%

yjs-map-conflict-detection83%75%-8.3%

ytt-jsonpath-query-api92%88%-3.4%

Each task's pass rate in v1 and v1.1. Click a column to sort.

The 10 configurations run in both versions. Hollow dot is v1, filled dot is v1.1; the change in points is at right.

## Citation

Please cite this work as:
    
    
    @misc{datacurve2026deepswev11,
      title  = {DeepSWE v1.1: a cleaner, more reproducible benchmark for frontier coding agents},
      author = {Wenqi Huang and Peter Jiang},
      year   = {2026},
      url    = {https://github.com/datacurve-ai/deep-swe},
    }
