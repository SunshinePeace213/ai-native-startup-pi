---
source: https://www.mercor.com/apex/apex-agents-leaderboard/
fetched: 2026-09-15
author: Mercor
---
> **In here:** APEX-Agents leaderboard rankings (Pass@1 / Mean Score) across frontier models · methodology for the long-horizon agentic benchmark · per-job task breakdowns (corporate law, management consulting, investment banking) with sample prompts and grading criteria

# The AI Productivity Index for Agents

The AI Productivity Index for Agents (APEX-Agents) measures whether frontier AI agents can execute long-horizon, cross-application tasks across three jobs in professional services.

**Benchmark:** APEX-Agents 1.1
**Description:** Tests whether AI agents can complete multi-hour professional tasks across investment banking, corporate law, and management consulting, using real tools in Google Suite.

- Blog post: https://www.mercor.com/blog/introducing-apex-agents-1-1
- Paper: https://arxiv.org/abs/2601.14242
- Code (eval harness): https://github.com/Mercor-Intelligence/apex_loop_truncated_tools_agent
- Data: https://huggingface.co/datasets/mercor/apex-agents-v1.1
- Archipelago (agent execution/eval infra): https://github.com/Mercor-Intelligence/archipelago

## About APEX-Agents

We created APEX-Agents to evaluate agents on the real day-to-day work of professionals: investment banking analysts, management consultants, and corporate lawyers. The tasks require agents to reason, demonstrate advanced knowledge, use multiple applications, and plan over long horizons.

APEX-Agents was built in three steps. First, industry professionals created a data-rich world, based on a unique project scenario. Second, they created realistic, challenging tasks using the files from within the world. Third, we gave agents access so they could execute the tasks (with all of the software that a human would use).

There are 31 worlds in APEX-agents, comprising 240 tasks and grading rubrics. The entire APEX-agents dataset is available open-source, along with Archipelago, our infra service for executing and evaluating agent trajectories.

## The APEX-Agents leaderboard

Available harness: **Loop** (`loop_truncated_tools_agent`)
Available metrics: **Pass@1** and **Mean Score** (chart axis range for both: 0–100)

Mean Score measures the average percentage of criteria that are passed for all tasks in the benchmark. It is the primary metric used to rank the APEX-Agents leaderboard. Pass@1 measures the percentage of tasks that an agent successfully completes on a single attempt (i.e., scores 100% on the rubric).

Full leaderboard (Loop harness), sorted by Pass@1 as displayed on the page:

| Model | Provider | Effort | Pass@1 | Pass@1 error | Mean Score | Mean Score error | Release date | n samples |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fable 5.1 (`claude-fable-5.1`) | Anthropic | max | 68.6 | ±4.9 | 77.1 | ±4.3 | 2026-09-01 | 959 |
| Gemini 3.7 Flash (`gemini-3.7-flash`) | Google | high | 67.8 | ±5.1 | 79.4 | ±3.8 | 2026-08-13 | 952 |
| Grok 4.6 (`grok-4-6-xhigh`) | xAI | xhigh | 65.3 | — | 77.3 | — | 2026-08-12 | 960 |
| Opus 5 (`claude-opus-5`) | Anthropic | max | 65.8 | ±5.1 | 77 | ±4 | 2026-07-24 | 956 |
| GPT-6 Astra (`gpt-6-astra-max`) | OpenAI | max | 64.7 | ±5.6 | 75.1 | ±4.6 | 2026-09-03 | 959 |
| Gemini 3.8 Flash (`gemini-3.8-flash`) | Google | high | 64.3 | — | 74.6 | — | 2026-09-02 | 949 |
| Fable 5 (`claude-fable-5`) | Anthropic | max | 63.6 | — | 74.5 | — | 2026-06-09 | 959 |
| GPT-5.6 Terra (`gpt-5.6-terra-max`) | OpenAI | max | 58.2 | — | 71.8 | — | 2026-07-09 | 958 |
| Muse Spark 1.3 (`muse-spark-1-3`) | Meta | xhigh | 57.8 | — | 69.9 | — | 2026-09-02 | 955 |
| GLM-5.3 (`glm-5-3`) | Zhipu | max | 56.6 | — | 66.2 | — | 2026-08-14 | 960 |
| Grok 4.5 (`grok-4-5`) | xAI | high | 56.2 | — | 70.5 | — | 2026-07-08 | 960 |
| GPT-5.5 (`gpt-5.5-xhigh`) | OpenAI | xhigh | 55.1 | — | 70.3 | — | 2026-04-23 | 959 |
| Sonnet 5 (`claude-sonnet-5-max`) | Anthropic | max | 54.5 | — | 67.4 | — | 2026-06-30 | 958 |
| GLM-5.3-Flash (`glm-5-3-flash`) | Zhipu | max | 52.8 | — | 66.8 | — | 2026-08-26 | 957 |
| GPT-5.4 (`responses/gpt-5.4`) | OpenAI | xhigh | 52.4 | — | 68.2 | — | 2026-03-05 | 958 |
| GPT-5.6 Sol (`gpt-5-6-sol-max-pro`) | OpenAI | max | 51.4 | — | 65.2 | — | 2026-07-09 | 955 |
| Kimi K3 (`kimi-k3`) | Kimi | max | 50.6 | — | 64 | — | 2026-07-27 | 960 |
| Opus 4.7 (`claude-opus-4-7`) | Anthropic | max | 49.2 | — | 63.1 | — | 2026-04-16 | 960 |
| Opus 4.8 (`claude-opus-4-8`) | Anthropic | max | 48.9 | — | 64.4 | — | 2026-05-28 | 961 |
| DeepSeek-V4-Pro-0813 (`deepseek-v4-pro-08-13`) | DeepSeek | max | 47.3 | — | 62.3 | — | 2026-08-13 | 849 |
| Gemini 3.6 Flash (`gemini-3.6-flash`) | Google | high | 46.9 | — | 63.4 | — | 2026-07-21 | 956 |
| Opus 4.6 (`claude-opus-4-6-max`) | Anthropic | max | 46.3 | — | 61.8 | — | 2026-02-05 | 955 |
| Muse Spark 1.2 (`muse-spark-1-2`) | Meta | xhigh | 36.4 | — | 51.7 | — | 2026-08-05 | 960 |
| Gemini 3.5 Flash (`gemini-3.5-flash`) | Google | high | 27.5 | — | 44.3 | — | 2026-05-19 | 959 |

*(Error columns beyond the top eight rows were not shown in the page data; "—" indicates no error value was supplied for that row.)*

## Jobs evaluated in APEX-Agents

APEX-Agents currently covers three professional-services jobs. Each job page has its own URL under `https://www.mercor.com/apex/apex-agents-leaderboard/<slug>/`.

### Corporate Lawyer

- Slug: `corporate-lawyer-agent`
- Category: Law · Date: Jan 2026 · Tasks: 160
- Firms referenced: Latham & Watkins, Skadden, Cravath
- Description: Drafts and reviews contracts, conducts legal research, and advises clients on regulatory and transactional matters. Collaborates with partners on litigation, mergers and acquisitions, and compliance while managing heavy workloads across cases.
- SEO title: Legal AI Agent Benchmark, Corporate Law: APEX-Agents | Mercor
- SEO description: Benchmark AI productivity on long-horizon legal tasks, built by experts from Big Law firms. See how AI performs on legal research, contracts, and review.
- Top displayed scores: GPT-6 Astra 73.4, Fable 5.1 71.9, Opus 5 70
- Source info: Provided with big law associate task data.
- Project scenario: Outside legal counsel (from LNG Shipping Inc) are working on behalf of Blue Anchor Capital Partners to form a fully financed, tax-efficient joint venture to construct, own, and operate a fleet of LNG carriers by contributing a shipbuilding contract and securing $80 million in financing or a guaranteed loan agreement.
- Sample prompt: "BlueAnchor wants to get the JV Agreement signed today. Can you send me back a message with a list of items that need to be added, changed, or removed to prepare a final execution version? Limit the list to the displayed top-level section-heading sequence, orphaned subsection or paragraph labels on single-item provisions, and incomplete signer-name fields in signature blocks. Do not take into consideration the following: (1) lack of definition for any capitalized terms, (2) wrong cross references, (3) unspecified Trigger Event/Date, and (4) substantive drafting or commercial issues in the body of the agreement."
- Grading criteria (sample):
  - States that the maximum potential liability for Star Tankers International Ltd. under the Oil Pollution Act is $56,709,300
  - States that the maximum potential liability for Cooper/Jeffries Energy Corporation under the Oil Pollution Act is $56,709,300
  - States that neither Star Tankers International Ltd. nor Cooper/Jeffries Energy Corporation have greater potential liability under the Oil Pollution Act as their maximum liability is equal

### Management Consultant

- Slug: `management-consultant-agent`
- Category: Consulting · Date: Jan 2026 · Tasks: 160
- Firms referenced: McKinsey, BCG, Deloitte, Accenture, EY
- Description: Analyzes industries, evaluates markets, and builds strategic or financial models to guide client decisions. Work often includes preparing presentations, drafting reports, and synthesizing research into actionable recommendations.
- SEO title: Management Consulting AI Agent Benchmark: APEX-Agents | Mercor
- SEO description: Benchmark AI agents productivity on management consulting workflows. Multi-step research and strategic analysis tasks, built by experts from MBB and Big Four firms.
- Top displayed scores: Gemini 3.8 Flash 77.5, Fable 5.1 71.6, Gemini 3.7 Flash 68.8
- Source info: Provided with consulting associate task data.
- Project scenario: A team of consultants (from Lurching Consulting group) are working on behalf of (Helios Components) to conduct a comprehensive portfolio review, assessing demand trajectories and competitive capabilities to develop a 5-year business case and strategic roadmap for transitioning product lines from ICE toward hybrid and EV platforms to ensure sustainable 2030 positioning.
- Sample prompt: "Read the attached email from the EM about conducting lifecycle analysis on the SKU data and execute on the analysis in: 4. Data Hygiene / Gaps Log (Associate 2). Can you get back to me with the four lifecycle top-two pairs and the two most-frequent platforms/applications? Give me each lifecycle top-two as an unranked pair, so order within the pair doesn't matter, and report the final two-platform result as an unranked pair too. Supporting percentages are optional, but if you show them, round them to two decimal places."
- Grading criteria (sample):
  - States the potential revenue for the SMB segment in the Accounting industry if it achieved the Target share is $670,508
  - States the percentage points difference between the Target Enterprise share for Consulting Firms and the Actual Enterprise share is 4.
  - States the revenue gap if the company achieved targeted market share from share vs. actual data for Mid-Market in IT Services is $14,331

### Investment Banking Analyst

- Slug: `investment-banking-analyst-agent`
- Category: Finance · Date: Jan 2026 · Tasks: 160
- Firms referenced: Goldman Sachs, Morgan Stanley, JPMorgan, Barclays
- Description: Builds financial models, values companies, and prepares pitch materials for potential deals. Responsibilities include conducting industry research, supporting transaction execution, and producing client-ready presentations under tight deadlines.
- SEO title: Investment Banking AI Agent Benchmark: APEX-Agents | Mercor
- SEO description: Benchmark AI productivity on multi-step investment banking workflows. See the leaderboard to evaluate LLMs on financial modeling, valuation, etc.
- Top displayed scores: Gemini 3.7 Flash 71.3, Opus 5 66.6, Grok 4.6 65
- Source info: Provided with investment banking analyst task data.
- Project scenario: A team of Investment banking advisors (from Vista Equity Partners) are working on behalf of Elastic to conduct a full LBO analysis, including sensitivity analysis and a recommendation, assessing the viability of taking the $12B software company private with a 35% premium and achieving a 20%+ return threshold.
- Sample prompt: "Assess how much certain business drivers must move to bring IRR below 20%. The stock price has fallen to $87.00. Use the LBO model for the info.
  1. Find the critical point (percentages to 2 decimal places) for each of the below business drivers at which rounded IRR would be pushed down to 19.99% from above:
     a) 'Growth rate scale' (correct the approach for Year 1/2)
     b) 'Customer acquisition costs'
     c) 'R&D cost'
     d) 'Debt costs'
     e) 'EBITDA multiple'

  Assumptions and constraints:
  1. EBITDA is not to fall below $91 million for any year. If this threshold is passed the new constraint becomes EBITDA for each individual year instead of the IRR.
  2. 'Debt costs' should be set to 0% for all other sensitivities.

  Create a new sheet that shows values for the five major business drivers."
- Grading criteria (sample):
  - States that BBDC accretion / dilution is 36.83% for 10.0% Bid Premium and 15.0% Cash Consideration
  - States that BBDC accretion / dilution is 36.41% for 10.0% Bid Premium and 10.0% Cash Consideration
  - States that BBDC accretion / dilution is 33.64% for 20.0% Bid Premium and 10.0% Cash Consideration
  - States that BBDC accretion / dilution is 34.05% for 20.0% Bid Premium and 15.0% Cash Consideration
  - States that TVPG accretion / dilution is 46.05% for 10.0% Bid Premium and 10.0% Cash Consideration
  - States that TVPG accretion / dilution is 44.44% for 10.0% Bid Premium and 15.0% Cash Consideration
  - States that TVPG accretion / dilution is 56.33% for 20.0% Bid Premium and 10.0% Cash Consideration
  - States that TVPG accretion / dilution is 54.73% for 20.0% Bid Premium and 15.0% Cash Consideration

## Frequently Asked Questions

**What is the APEX-Agents benchmark and how does it work?**
The Mercor AI Productivity Index (APEX) is a family of benchmarks that measure how effectively AI models and agents perform economically valuable tasks. APEX-Agents evaluates long-horizon, multi-step workflows across high-value sectors, like corporate law, investment banking, and management consulting. It was developed in collaboration with Box and Harvey.

**Which AI model scores highest on APEX-Agents?**
Rankings can change whenever a frontier model is released. New models are evaluated on APEX-Agents, APEX-SWE, APEX-Accounting and APEX-1 when they ship.

**Who writes the APEX-Agents tasks?**
Practicing professionals from leading firms that the tasks simulate, including attorneys from Latham & Watkins, Skadden, and Cravath; consultants from McKinsey and BCG; and bankers from Goldman Sachs, Morgan Stanley, and JPMorgan.

**How are AI models evaluated on APEX-Agents?**
APEX-Agents evaluates the quality of completed work. Model outputs are graded using expert-authored rubrics with an LM judge.

**What do Mean Score and Pass@1 measure?**
Mean Score measures the average percentage of criteria that are passed for all tasks in the benchmark. It is the primary metric used to rank the APEX-Agents leaderboard. Pass@1 measures the percentage of tasks that an agent successfully completes on a single attempt (i.e., scores 100% on the rubric). Together, they capture models' overall capability and end-to-end task reliability.

**Can I reproduce APEX-Agents results myself?**
Yes, on the open subset. The eval harness is published on GitHub and sample tasks are on HuggingFace, so you can run the same scoring pipeline against your own model. The full task set stays private so that models can't be trained on it.

**Can I license APEX-Agents data for training?**
Yes. Mercor licenses off-the-shelf datasets built by the same expert network. 50,000+ tasks across 30+ domains, with samples available the same day. Learn more about off-the-shelf data.

## Dataset metadata (from page structured data)

- Name: APEX-Agents (alternate name: AI Productivity Index for Agents)
- Identifier: `apex-agents`
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Based on paper: https://arxiv.org/abs/2601.14242
- Creator / publisher: Mercor
- Accessible for free: yes
- Distributions:
  - Hugging Face: https://huggingface.co/datasets/mercor/apex-agents
  - Archipelago (GitHub): https://github.com/Mercor-Intelligence/archipelago
- Sub-datasets (job pages):
  - APEX-Agents: Corporate Lawyer — https://www.mercor.com/apex/apex-agents-leaderboard/corporate-lawyer-agent/
  - APEX-Agents: Management Consultant — https://www.mercor.com/apex/apex-agents-leaderboard/management-consultant-agent/
  - APEX-Agents: Investment Banking Analyst (referenced under the same leaderboard, slug `investment-banking-analyst-agent`)
