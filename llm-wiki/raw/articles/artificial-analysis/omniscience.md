---
source: https://artificialanalysis.ai/evaluations/omniscience
fetched: 2026-09-15
author: Artificial Analysis
---
> **In here:** AA-Omniscience Index/Accuracy/Hallucination-Rate leaderboards across 30-of-525 evaluated models · domain and software-engineering-language breakdowns, token usage, and cost · benchmark methodology, arXiv publication abstract, and example questions

# AA-Omniscience: Knowledge and Hallucination Benchmark

Compare AI model performance on AA-Omniscience: Knowledge and Hallucination Benchmark. A benchmark measuring factual recall and hallucination across various economically relevant domains.

## Background

AA-Omniscience is a knowledge and hallucination benchmark that rewards accuracy, punishes bad guesses and provides a comprehensive view of which models produce factually reliable outputs across different domains.

The benchmark contains 6,000 questions across 6 major domains, derived from authoritative academic and industry sources and generated automatically using an LLM-based question generation agent to ensure unambiguity, scalability and factual precision.

## Methodology

All evaluations are conducted independently by Artificial Analysis. More information can be found on the [Intelligence Benchmarking Methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking) page (see the "AA-Omniscience" section: `/methodology/intelligence-benchmarking#aa-omniscience`).

## Publication

- [View on arXiv](https://arxiv.org/abs/2511.13029) — paper ID 2511.13029
- Dataset also published on Hugging Face as `ArtificialAnalysis/AA-Omniscience-Public`

**AA-Omniscience: Evaluating Cross-Domain Knowledge Reliability in Large Language Models**
Declan Jackson, William Keating, George Cameron, and Micah Hill-Smith.

### Abstract

> Existing language model evaluations primarily measure general capabilities, yet reliable use of these models across a range of domains demands factual accuracy and recognition of knowledge gaps. We introduce AA-Omniscience, a benchmark designed to measure both factual recall and knowledge calibration across 6,000 questions. Questions are derived from authoritative academic and industry sources, and cover 42 economically relevant topics within six different domains. The evaluation measures a model's AA-Omniscience Index, a bounded metric (-100 to 100) measuring factual recall that jointly penalizes hallucinations and rewards abstention when uncertain, with 0 equating to a model that answers questions correctly as much as it does incorrectly. Among evaluated models, Claude 4.1 Opus attains the highest score (4.8), making it one of only three models to score above zero. These results reveal persistent factuality and calibration weaknesses across frontier models. Performance also varies by domain, with the models from three different research labs leading across the six domains. This performance variability suggests models should be chosen according to the demands of the use case rather than general performance for tasks where knowledge is important.

*(Note: the abstract text above is reproduced verbatim from the source page, describing the original evaluation run whose top scorer was Claude 4.1 Opus at 4.8. The live leaderboard tables below reflect the page's current data snapshot, which includes newer models with higher scores than described in the abstract.)*

## AA-Omniscience Index

AA-Omniscience Index (higher is better) measures knowledge reliability and hallucination. It rewards correct answers, penalizes hallucinations, and has no penalty for refusing to answer. Scores range from -100 to 100, where 0 means as many correct as incorrect answers, and negative scores mean more incorrect than correct.

Leaderboard shows 30 of 525 models; the top 20 charted values are:

| Model | AA-Omniscience Index |
| --- | --- |
| GPT-6 Astra (high) | 43.73 |
| Claude Fable 5.1 (max with fallback) | 43.45 |
| GPT-6 Astra (xhigh) | 43.42 |
| GPT-6 Astra (max) | 43.40 |
| Claude Fable 5 (with fallback) | 43.30 |
| Claude Fable 5.1 (xhigh with fallback) | 42.38 |
| GPT-6 Astra (medium) | 42.22 |
| Claude Fable 5.1 (high with fallback) | 40.80 |
| Claude Opus 5 (max) | 37.07 |
| Grok 4.6 (high) | 30.48 |
| Gemini 3.8 Flash (high) | 29.55 |
| Muse Spark 1.3 (max) | 25.00 |
| GPT-5.6 Sol (max) | 21.97 |
| Kimi K3 (max) | 19.70 |
| GLM-5.3 (max) | 14.30 |
| GLM-5.3-Flash | 7.47 |
| Gemini 3.5 Flash-Lite | 5.23 |
| Qwen3.8 2.4T A95B | 4.32 |
| Inkling | 2.00 |
| MiniMax-M3 | 1.35 |

## AA-Omniscience Accuracy

Share of questions answered correctly (top 20 charted values):

| Model | Accuracy |
| --- | --- |
| Claude Fable 5.1 (max with fallback) | 67.2% |
| Claude Fable 5.1 (xhigh with fallback) | 66.2% |
| Claude Fable 5 (with fallback) | 65.4% |
| Claude Fable 5.1 (high with fallback) | 64.9% |
| GPT-6 Astra (max) | 62.6% |
| GPT-6 Astra (xhigh) | 61.9% |
| GPT-6 Astra (high) | 61.1% |
| Claude Opus 5 (max) | 60.9% |
| GPT-6 Astra (medium) | 60.6% |
| GPT-5.6 Sol (max) | 59.4% |
| Gemini 3.8 Flash (high) | 54.6% |
| DeepSeek V4 Pro 0813 (max) | 49.1% |
| Grok 4.6 (high) | 48.2% |
| Kimi K3 (max) | 47.6% |
| GPT-5.6 Terra (max) | 46.8% |
| DeepSeek V4.1 Flash (max) | 46.4% |
| Muse Spark 1.3 (max) | 43.6% |
| GPT-5.6 Luna (max) | 42.7% |
| Inkling | 41.6% |
| GLM-5.3 (max) | 33.9% |

## AA-Omniscience Hallucination Rate

Share of incorrect answers among all non-abstained answers — lower is better (top 20 charted values):

| Model | Hallucination Rate |
| --- | --- |
| MiniMax-M3 | 18.4% |
| K2 Horizon 375B A23B | 25.9% |
| GLM-5.3-Flash | 27.6% |
| GLM-5.3 (max) | 29.6% |
| Nemotron 3 Ultra | 29.7% |
| Qwen3.8 27B (xhigh) | 30.3% |
| Muse Spark 1.3 (max) | 32.9% |
| Grok 4.6 (high) | 34.3% |
| Gemini 3.5 Flash-Lite | 34.4% |
| Qwen3.8 2.4T A95B | 39.2% |
| GPT-6 Astra (high) | 44.8% |
| GPT-6 Astra (medium) | 46.5% |
| GPT-6 Astra (xhigh) | 48.3% |
| GPT-6 Astra (max) | 51.3% |
| Kimi K3 (max) | 53.2% |
| Gemini 3.8 Flash (high) | 55.2% |
| Claude Opus 5 (max) | 60.8% |
| Claude Fable 5 (with fallback) | 63.6% |
| Inkling | 67.7% |
| Claude Fable 5.1 (high with fallback) | 68.8% |

## AA-Omniscience Index vs. Artificial Analysis Intelligence Index

The page cross-plots the AA-Omniscience Index against the general-purpose Artificial Analysis Intelligence Index (v4.3), illustrating that knowledge reliability does not track overall intelligence-index rank.

## Detailed Domain Score — AA-Omniscience Index Across Domains (Normalized)

Per-domain scores are normalized within each domain (top model in each domain = 1.0). Domains: Business, Humanities & Social Sciences, Science, Engineering & Mathematics, Health, Law, Software Engineering (SWE). Selected models (normalized values, 0–1 scale):

| Model | Business | Health | Humanities & Social Sciences | Law | Science, Eng. & Math | Software Engineering (SWE) |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Fable 5.1 (max with fallback) | 0.940 | 0.952 | 0.978 | 0.979 | 0.991 | 1.000 |
| Claude Fable 5.1 (xhigh with fallback) | 0.947 | 0.917 | 0.952 | 1.000 | 0.976 | 0.975 |
| GPT-6 Astra (max) | 0.995 | 0.988 | 1.000 | 0.971 | 0.911 | 0.974 |

*(20 models are charted in total on the live page; the table above is a representative excerpt — see the source URL for the full normalized grid across all six domains.)*

## Software Engineering Deep Dive — AA-Omniscience Index Across Languages (Normalized)

Per-language scores normalized within each language (top model per language = 1.0). Languages covered: C, R, Go, PHP, Dart, HTML, Java, Rust, Julia, Swift, Kotlin, Python, JavaScript, TypeScript. Selected models (normalized values, 0–1 scale):

| Model | C | R | Go | PHP | Dart | HTML | Java | Rust | Julia | Swift | Kotlin | Python | JavaScript | TypeScript |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Fable 5.1 (max with fallback) | 1.000 | 1.000 | 0.975 | 0.931 | 1.000 | 0.938 | 0.954 | 0.977 | 0.975 | 0.938 | 0.986 | 1.000 | 0.992 | 0.955 |
| Claude Fable 5.1 (xhigh with fallback) | 0.965 | 0.936 | 0.988 | 0.986 | 0.962 | 0.846 | 0.960 | 0.907 | 0.926 | 1.000 | 0.986 | 0.979 | 0.898 | 0.963 |

*(20 models are charted in total on the live page; the table above is a representative excerpt — see the source URL for the full normalized grid across all fourteen languages.)*

## AA-Omniscience Index Question Breakdown

The page's "Question Breakdown" panels list example evaluation questions grouped by domain: Business, Humanities & Social Sciences, Science, Engineering & Mathematics, Health, Law, Software Engineering (SWE).

## Model Size (Open Weights Models Only)

The page charts, for open-weights models only:

- AA-Omniscience Index vs. Total Parameters
- AA-Omniscience Accuracy vs. Total Parameters
- AA-Omniscience Hallucination Rate vs. Total Parameters

## Token Usage — AA-Omniscience Index: Token Usage

Median evaluation token usage split into answer, reasoning, and input tokens (selected models):

| Model | Answer Tokens | Reasoning Tokens | Input Tokens |
| --- | --- | --- | --- |
| GPT-6 Astra (medium) | 115,584 | 1,538,306 | 740,990 |
| Claude Fable 5.1 (high with fallback) | 298,686 | 2,057,969 | 1,036,803 |
| GPT-6 Astra (high) | 113,144 | 3,004,696 | 740,990 |

*(20 models are charted in total on the live page.)*

## Cost — AA-Omniscience Index: Cost Breakdown

Evaluation cost (USD) split into answer, reasoning, and input cost (selected models):

| Model | Answer Cost | Reasoning Cost | Input Cost |
| --- | --- | --- | --- |
| GLM-5.3-Flash | $0.26 | $3.21 | $0.11 |
| gpt-oss-120b (high) | $0.05 | $6.79 | $0.11 |
| Gemini 3.5 Flash-Lite | $0.18 | $18.20 | $0.22 |

*(20 models are charted in total on the live page.)*

## Score vs. Release Date

The page charts AA-Omniscience Index against each model's release date, showing the trend of the metric over successive model releases.

## Example Tasks

1. **Domain:** Software Engineering (SWE) · **Topic:** JavaScript · **Subtopic:** JavaScript frontend frameworks
   > In React's Canary Fragment refs API, which FragmentInstance method returns a flat array of DOMRect objects for all children?

2. **Domain:** Health · **Topic:** Medicine · **Subtopic:** Pharmacy
   > In what year was the Nobel Prize in Medicine awarded to Domagk for discovering prontosil's chemotherapeutic value?

3. **Domain:** Business · **Topic:** Economics · **Subtopic:** Macroeconomics
   > Over what years did Roubini and Sachs examine 15 OECD countries when assessing trends in tax-to-GDP ratios?

## Explore Evaluations (related benchmarks linked from this page)

- **Artificial Analysis Intelligence Index v4.3** — A composite benchmark aggregating ten challenging evaluations to provide a holistic measure of AI capabilities across mathematics, science, coding, and reasoning.
- **Artificial Analysis Openness Index** — A composite measure providing an industry standard to communicate model openness for users and developers.
- **AA-Briefcase: Agentic Knowledge Work Benchmark** — A private evaluation developed by Artificial Analysis for frontier agentic capability in long-horizon knowledge work, testing agents on realistic business workflows that require deliverables such as spreadsheets, presentations, and memos.
