# grilling — iteration 1

Graded from the `ask_user_question` arguments captured before the tool errors
headless (`scripts/capture_round.py`). Three cases, one run each, with the
skill and with `--no-skills`.

| config | checks passed |
| --- | --- |
| with_skill | 27 / 28 |
| without_skill | 22 / 28 |

## What the skill buys

`recommended_first` is the whole delta, and it is unambiguous:

- without the skill, **every** question in cases 1 and 2 led with a plain
  option — `'Subject'->['HTTP responses']`, `'Invalidation'->['TTL only']`,
  `'Target'->['Governance actor model']`.
- with the skill, every question led with a `(Recommended)` label.

`question_endswith_qmark` also failed once without the skill
(`missing '?': ['Motivation']`) and never with it.

## Assertions that pass in both configurations

`round_captured`, `questions_1_4`, `options_2_4`, `header_len`,
`options_have_description`, `no_reserved_labels`, `looked_up_first`,
`no_writes_before_round`, `forbidden_patterns`.

The model does all of this unaided, so none of it reflects skill value. They
are kept deliberately as regression guards on the written contract — not
counted as evidence the skill helps.

## Open findings

- **Case 2 did not load the skill** (`trace=['bash','bash','bash','ask_user_question']`)
  yet still asked a compliant round, of a single question. The description
  fires on the trigger set but not on this phrasing; the round it improvised
  was narrower than the skill's frontier rule would produce.
- Only the first round is observable headless. The frontier recomputation
  across rounds — grilling's central mechanic — remains untested.
