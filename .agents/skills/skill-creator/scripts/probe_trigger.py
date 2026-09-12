#!/usr/bin/env python3
"""Measure whether an installed Pi skill or subagent gets picked on its own per query.

Usage: uv run --no-project scripts/probe_trigger.py <name> <queries.json> [runs] [model]

Runs every query through `pi --mode json` from the project root, with project
trust approved so `.agents/skills/` and `.pi/agents/` load, and watches the
event stream for the first tool call that routes to the artifact: a `read` of
`<name>/SKILL.md` (or a `bash` naming it) for a skill, or a `subagent` call
whose `agent` — or whose workflowScript — names the agent. The session is
killed as soon as the verdict is known so no query runs to completion. Reports
recall on the should-trigger half and the false-fire rate on the rest — read
them separately.
"""

import json
import os
import re
import subprocess
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SKILL = sys.argv[1]
QUERIES = Path(sys.argv[2])
RUNS = int(sys.argv[3]) if len(sys.argv) > 3 else 1
MODEL = sys.argv[4] if len(sys.argv) > 4 else None
MAX_TOOLS = 6  # the verdict is decided well inside this many calls
TIMEOUT = 150  # seconds; a model that wanders into `find /` must not stall the sweep
TARGET = f"{SKILL}/SKILL.md"
# <root>/.agents/skills/<skill>/scripts/probe_trigger.py -> the project root.
ROOT = Path(__file__).resolve().parents[4]


def _reads_skill(tool, args):
    """True when the call loads the skill, or delegates to an agent of that name."""
    args = args or {}
    if tool == "read":
        return TARGET in str(args.get("path", ""))
    if tool == "bash":
        return TARGET in str(args.get("command", ""))
    if tool == "subagent":
        if str(args.get("agent", "")).split(".")[-1] == SKILL:
            return True
        return (
            re.search(
                rf"""agent:\s*["']{re.escape(SKILL)}["']""", str(args.get("workflowScript", ""))
            )
            is not None
        )
    return False


def probe(query):
    cmd = ["pi", "--mode", "json", "-a", "--no-session"]
    if MODEL:
        cmd += ["--model", MODEL]
    cmd += ["--", query]
    # stdin must be closed and stdout must be a pipe: with an inherited stdin or a
    # file on stdout, pi blocks at startup and never emits the session header.
    p = subprocess.Popen(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        cwd=ROOT,
        env=os.environ,
        text=True,
    )
    triggered, first_tool, n_tools = False, None, 0
    watchdog = threading.Timer(TIMEOUT, p.kill)
    watchdog.start()
    try:
        for line in p.stdout:
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                continue
            if e.get("type") != "tool_execution_start":
                continue
            n_tools += 1
            tool = e.get("toolName")
            first_tool = first_tool or tool
            if _reads_skill(tool, e.get("args")):
                triggered = True
                break
            if n_tools >= MAX_TOOLS:
                break
    finally:
        watchdog.cancel()
        p.kill()
        p.wait()
    return triggered, first_tool


def main():
    items = json.loads(QUERIES.read_text())
    jobs = [(i, r) for i, _ in enumerate(items) for r in range(RUNS)]
    with ThreadPoolExecutor(max_workers=4) as ex:
        outcomes = list(ex.map(lambda j: probe(items[j[0]]["query"]), jobs))

    per_query = []
    for i, item in enumerate(items):
        hits = [o for (qi, _), o in zip(jobs, outcomes, strict=True) if qi == i]
        rate = sum(t for t, _ in hits) / RUNS
        first = hits[0][1]
        per_query.append({**item, "trigger_rate": rate, "first_tool": first})
        want = item["should_trigger"]
        mark = "pass" if (rate >= 0.5) == want else "FAIL"
        wanted = "fire" if want else "skip"
        snippet = item["query"][:80]
        print(f"{mark}  want={wanted}  rate={rate:.2f}  first={first}  {snippet}", flush=True)

    pos = [q for q in per_query if q["should_trigger"]]
    neg = [q for q in per_query if not q["should_trigger"]]
    recall = sum(q["trigger_rate"] >= 0.5 for q in pos) / max(len(pos), 1)
    false_fire = sum(q["trigger_rate"] >= 0.5 for q in neg) / max(len(neg), 1)
    print(
        f"\nrecall {recall:.2f} on {len(pos)} should-fire · "
        f"false-fire {false_fire:.2f} on {len(neg)} should-skip · runs/query {RUNS}"
    )
    out = QUERIES.with_suffix(".results.json")
    out.write_text(
        json.dumps(
            {
                "skill": SKILL,
                "runs": RUNS,
                "recall": recall,
                "false_fire": false_fire,
                "queries": per_query,
            },
            indent=2,
        )
    )
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
