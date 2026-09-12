---
source: https://claude.com/blog/claude-model-and-effort-level-in-claude-code
fetched: 2026-08-23
author: Lydia Hallie
last_modified: 2026-07-07
---
> **In here:** how model weights vs. steering vs. effort level work · when to pick a larger model vs. more effort · Fable/Opus/Sonnet specialist-expert-generalist framing.

# Choosing a Claude model and effort level in Claude Code

**Publication Date:** July 7, 2026
**Author:** Lydia Hallie

---

## Key Takeaways

- Claude model selection determines the fixed weights and overall capability range. While context can steer responses, the model's knowledge base remains set during training.

- Effort encompasses more than thinking time—it controls the total work Claude performs, including files read, tools used, and task completion steps before checking in.

- Select smaller models for routine tasks; larger models for complex or ambiguous problems. Begin with default effort levels and adjust based on work patterns rather than individual tasks.

- If Claude has adequate context and still fails, a more capable model is needed. If it skipped steps or abandoned tasks prematurely, increase effort level.

---

## How Model Selection Works

When you send a request, Claude Code assembles your message with system prompts, tool definitions, CLAUDE.md files, conversation history, and relevant files into a single API request.

On the server, the text undergoes **tokenization**—converting text into integer tokens mapped to the model's fixed vocabulary. The model's job involves predicting the next token by computing probabilities across its entire vocabulary.

What enables these predictions are the **weights** (parameters)—billions of numbers organized in matrices containing all the model's learned knowledge. These weights remain frozen after training; nothing in your prompt or context modifies them.

"The weights of each model are set during training, and by the time you're sending requests they're read-only."

Your prompt and context can **steer** predictions but cannot add to the weights themselves. If a library didn't exist during training, providing its documentation works through steering for that request only—the model hasn't retained permanent knowledge.

Hallucinations occur when weights produce plausible-seeming token sequences based on training patterns, not genuine knowledge gaps.

**Changing the model swaps which set of frozen weights handles your request.** This determines both capability and per-token output cost.

---

## How Claude Code Effort Level Works

When Claude Code works on tasks, generated tokens fall into categories:

- **Thinking:** reasoning visible before and between actions
- **Tool calls:** structured blocks naming tools like Read or Edit
- **Text to you:** plans, progress updates, summaries

All are ordinary output tokens from the same generation loop, billed identically.

The effort level is sent alongside your prompt as a model input. The model was trained to understand effort-specific behaviors, with this learning encoded in frozen weights.

"This is considered on every turn and results in more tokens to produce higher confidence answers."

At higher effort levels, Claude typically creates detailed plans, though these adjust dynamically as actions yield results. If initial steps resolve issues, Claude skips unnecessary remaining steps rather than artificially inflating token usage.

Overthinking during model training degrades effectiveness, so the team carefully manages this.

---

## Picking an Effort Level

For most tasks, **use the model's default effort level**. This represents where Claude scales token usage according to typical user preferences.

Think of effort as a manual override for scaling thoroughness or speed based on domain or work type—consider it a general preference rather than task-by-task adjustment.

Recent testing showed Claude Opus 4.8 at default effort produces better results for comparable token counts versus Opus 4.7 at default settings for identical tasks.

---

## What to Change When Claude Gets It Wrong

Before adjusting settings, examine provided context. Is the prompt vague? Does Claude lack necessary tools or skills?

The question becomes: did Claude lack knowledge or insufficient effort?

### Model Selection: The Problem Was Too Hard

Choose larger models for genuinely difficult problems—subtle bugs, unfamiliar domains, architecture decisions. Larger models handle ambiguity better; specific instructions suit smaller models.

"If Claude has all the pertinent context and clearly tried and still got it wrong, that's a signal to pick a larger model."

### Effort: Claude Didn't Try Hard Enough

Increase effort if Claude skipped files, avoided running tests, or neglected verification—especially if below the model's default level.

---

## Model Comparison Framework

**Fable as specialist:** Has seen nearly unprecedented problems
**Opus as expert:** Deep experience with similar challenges
**Sonnet as generalist:** Highly capable across domains

Opus at low effort resembles consulting an expert for five minutes—valuable pattern recognition but surface-level code review.

Sonnet at high effort functions like an all-afternoon consultation from an excellent generalist—thorough specific-code understanding without pattern-recognition advantages.

Fable even at low effort spotlights problems others miss—that specialist recognition justifies premium costs for genuinely complex work.

---

## Effort, Model, and Token Consumption

On routine work at identical effort, both models typically succeed. Larger models consume extra tokens through verification at higher per-token costs, making smaller models economical for routine stretches.

On harder multi-step work, equations differ. Smaller models grind toward capability limits through iterations while larger models reach equivalent quality faster. Per-token costs increase with larger models, but total per-task costs may decrease on genuinely difficult tasks where smaller models cannot succeed regardless of effort.

Fable pulls furthest ahead on extended multi-step work, accomplishing tasks Opus and Sonnet cannot complete at any effort level.

Effort determines how far Claude **will travel** along capability curves, not how far it **must travel** to complete tasks.

**max_tokens** represents the only hard cap, truncating responses mid-stream when reached. Softer controls—task budgets or prompts requesting brevity—guide the model more effectively than hard limits.

---

## Start with Defaults, Then Adjust

Most of the time, neither setting requires active consideration. When results miss targets, ask whether Claude lacked knowledge or showed insufficient effort, then adjust accordingly.

For efficiency techniques, consult "[Maximizing the value of your Claude Code sessions](https://claude.com/blog/maximizing-the-value-of-your-claude-code-sessions)."

---

## Related Articles

- **Aug 13, 2026:** "Self-service data analytics in Slack: how Anthropic deploys Claude Tag for ad-hoc questions"
- **Jul 24, 2026:** "The new rules of context engineering for Claude 5 generation models"
- **Aug 21, 2026:** "The AI-Native SDLC playbook"
- **Aug 20, 2026:** "The Claude Code guide for startups"
