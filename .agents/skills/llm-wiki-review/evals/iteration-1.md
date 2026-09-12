# llm-wiki-review — iteration 1

Graded from the captured `ask_user_question` arguments
(`scripts/capture_round.py`). Two cases, one run each, with the skill and with
`--no-skills`. Both cases point `LLM_WIKI_ROOT` at a throwaway vault, so no
live ledger is touched; runs stop at the captured round, before any verdict
exists to write.

| config | checks passed |
| --- | --- |
| with_skill | 12 / 12 |
| without_skill | 4 / 12 |

## What the skill buys

Case 1 (one disputed claim in the vault):

- with the skill — `trace=['read','read','bash','bash','read','ask_user_question']`,
  a round headed `'Claim 1/1'` with 4 described options, naming the claim.
- without it — 14 tool calls, `trace=[bash × 13,'read']`, and **no round at
  all**. The model explored the repo instead of presenting anything.

## Boundary case

Case 2 runs against an empty vault and asserts `round_absent`: with nothing
flagged, the skill must report an empty queue rather than invent claims to
present. It passes in both configurations.

## Caveats

- `skill_loaded` is not meaningful under `--no-skills`: case 2 recorded a
  `read` of the SKILL.md path while exploring, so the check passed in a
  configuration where the skill was not active. Read it only in the
  with-skill column.
- The verdict-to-observation path is still untested. These runs stop at the
  round because the tool cannot be answered headless; filing a `human:<name>`
  observation needs either a stub tool or a verdict-replay case that supplies
  the decisions in the prompt.

## Fixture

`build_fixture.py` seeds a vault through the engine's own CLI — register, then
a `new_claim` and a `contradicts` observation on one key — producing a real
disputed claim (`p 0.50`, both stances recorded). Spans must appear verbatim
in the archive or `apply` refuses with exit 2.
