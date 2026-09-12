---
name: grilling
description: >-
  Grill the user relentlessly about a plan, decision, or idea — rounds of
  structured questions through ask_user_question until nothing is left silently
  assumed. Use when the user wants to stress-test their thinking, clear the
  unknowns in a vague or ambiguous request, or says grill me, interview me,
  ask me questions, poke holes, or stress-test this. Also the interview engine
  other skills load before they build anything. Not for a single yes/no
  confirmation, and not for questions whose answer is a fact you can look up.
---

# Grilling

Interview the user until you reach a shared understanding. Map the topic as a
**design tree**: every decision branches into the decisions that hang off it.

## Rounds and the frontier

Work the tree in **rounds**. The **frontier** is every decision whose
prerequisites are already settled — the questions you can ask *now* without
guessing at answers you have not heard yet. Ask the whole frontier in one round,
then wait for the answers before the next round.

Each round the user answers reshapes the tree: settled decisions push the
frontier outward and unblock questions that depended on them. Recompute the
frontier and ask the next round. A question whose answer depends on another
question still open in this round belongs to a *later* round, not this one.

Finding *facts* is your job, never the user's. When a frontier question needs a
fact from the environment, look it up with `read`, `grep`, `find`, or `bash`
before the round goes out; never ask the user for anything you could look up.
The *decisions* are the user's: put each to them and wait.

## Asking a round

Put the round through the `ask_user_question` tool. One call carries up to four
questions; a frontier larger than that goes out as consecutive calls in the same
round, most load-bearing questions first.

For every question:

- `question` is the full question, ending in `?`. `header` is a chip of at most
  16 characters naming the decision.
- 2–4 `options`, each with a `description` that states what the choice means or
  what it costs. Put your recommended answer first and end its label with
  `(Recommended)`.
- Never author an option labelled `Other`, `Type something.`, or `Next` — the
  dialog appends its own free-text row, and those labels are rejected.
- `multiSelect: true` when several answers can hold at once.
- A `preview` on a single-select option when the choices are artifacts the user
  should see side by side — a mockup, a snippet, a config shape.

Read the answers back from the result. A free-text answer, a per-question note,
or a global note can overturn a recommendation or open a branch you had not
drawn; fold it into the tree before the next round.

### When the tool is not available

Non-interactive runs strip `ask_user_question` from the tool list, and some
hosts cannot render it. Then ask the round as text, one block per question, and
wait for the reply:

```
❓ **Q1** - **<question title>**: <question body, including the choices>

➡️ <your recommended answer>

---

❓ **Q2** - ...
```

A result of `User declined to answer questions` is not an answer: say what is
still open and stop.

## Done

The session is done when the frontier is empty: every branch of the design tree
visited, nothing left silently assumed. Close with the settled decisions in a
short list. Do not act on them until the user confirms you have reached a shared
understanding.
