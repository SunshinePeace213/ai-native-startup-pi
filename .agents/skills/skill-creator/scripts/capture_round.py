#!/usr/bin/env python3
"""Grade an interviewing skill from the question round it emits, without answering it.

Usage: uv run --no-project scripts/capture_round.py <skill> <evals.json> [--no-skills] [runs]

Headless Pi has no `ask_user_question` tool: the model calls it anyway and the
call fails with `Tool ask_user_question not found`. The arguments are emitted
in `tool_execution_start` *before* that error, so the round a skill would have
asked is fully observable even though it can never be answered.

This runs each case, captures the first round, and grades it against the
skill's own written contract with deterministic checks — no LLM judge, and
every FAIL quotes the offending value. Runs stop at the captured round, so a
skill that writes only after a verdict never reaches its writes.

Checks a case may list in `checks`:
  round_captured          at least one ask_user_question call was made
  round_absent            no round was asked (for an empty queue: nothing to present)
  skill_loaded            the target SKILL.md was read before the round
  questions_1_4           1-4 questions per call
  options_2_4             every question carries 2-4 options
  header_len              every header is 1-16 characters
  question_endswith_qmark every question ends in '?'
  options_have_description every option carries a non-empty description
  recommended_first       a '(Recommended)' option exists and sits first
  no_reserved_labels      no option labelled Other / Type something. / Next
  looked_up_first         a read/grep/bash call preceded the round
  no_writes_before_round  no write/edit/state-mutating call preceded the round
  forbidden_patterns      no question text matches case['forbidden_patterns']
  required_patterns       the round matches every case['required_patterns']
"""

import json
import os
import re
import subprocess
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
RESERVED = {"other", "type something.", "type something", "next"}
MAX_TOOLS = 14  # grilling looks facts up first; the round follows those calls
TIMEOUT = 420
WRITE_TOOLS = {"write", "edit"}
LOOKUP_TOOLS = {"read", "bash", "grep", "find", "glob"}


def run_case(case, skill, no_skills):
    """Drive one prompt and return the captured round plus the tool trace."""
    cmd = ["pi", "--mode", "json", "-a", "--no-session"]
    if no_skills:
        cmd.append("--no-skills")
    cmd += ["--", case["prompt"]]
    env = {**os.environ, **(case.get("env") or {})}
    p = subprocess.Popen(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        cwd=case.get("cwd") or ROOT,
        env=env,
        text=True,
    )
    trace, round_, skill_loaded, n = [], None, False, 0
    watchdog = threading.Timer(TIMEOUT, p.kill)
    watchdog.start()
    try:
        for line in p.stdout:
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                continue
            if e.get("type") == "agent_end":
                break
            if e.get("type") != "tool_execution_start":
                continue
            tool, args = e.get("toolName"), e.get("args") or {}
            trace.append(tool)
            n += 1
            if tool == "read" and f"{skill}/SKILL.md" in str(args.get("path", "")):
                skill_loaded = True
            if tool == "ask_user_question":
                qs = args.get("questions")
                if isinstance(qs, str):
                    try:
                        qs = json.loads(qs)
                    except json.JSONDecodeError:
                        qs = []
                round_ = qs or []
                break
            if n >= MAX_TOOLS:
                break
    finally:
        watchdog.cancel()
        p.kill()
        p.wait()
    return {"round": round_, "trace": trace, "skill_loaded": skill_loaded}


def grade(case, obs):
    """Deterministic checks; every failure carries the value that caused it."""
    r, trace = obs["round"], obs["trace"]
    before = trace[:-1] if trace and trace[-1] == "ask_user_question" else trace
    out = []

    def add(name, ok, ev):
        out.append({"check": name, "pass": bool(ok), "evidence": str(ev)[:220]})

    for name in case.get("checks", []):
        if name == "round_captured":
            add(name, r is not None, f"trace={trace}")
        elif name == "round_absent":
            add(name, r is None, f"asked anyway: {json.dumps(r)[:180]}" if r else f"trace={trace}")
        elif name == "skill_loaded":
            add(name, obs["skill_loaded"], f"trace={trace}")
        elif name == "looked_up_first":
            add(name, any(t in LOOKUP_TOOLS for t in before), f"before_round={before}")
        elif name == "no_writes_before_round":
            bad = [t for t in before if t in WRITE_TOOLS]
            add(name, not bad, f"writes_before_round={bad}")
        elif r is None:
            add(name, False, "no round captured")
        elif name == "questions_1_4":
            add(name, 1 <= len(r) <= 4, f"{len(r)} questions")
        elif name == "options_2_4":
            bad = [q.get("header") for q in r if not 2 <= len(q.get("options") or []) <= 4]
            add(name, not bad, f"out-of-range: {bad}" if bad else f"{[len(q.get('options') or []) for q in r]}")
        elif name == "header_len":
            bad = [q.get("header") for q in r if not 1 <= len(q.get("header") or "") <= 16]
            add(name, not bad, f"bad headers: {bad}" if bad else f"{[q.get('header') for q in r]}")
        elif name == "question_endswith_qmark":
            bad = [q.get("header") for q in r if not (q.get("question") or "").strip().endswith("?")]
            add(name, not bad, f"missing '?': {bad}" if bad else "all end in '?'")
        elif name == "options_have_description":
            bad = [o.get("label") for q in r for o in q.get("options") or [] if not (o.get("description") or "").strip()]
            add(name, not bad, f"no description: {bad}" if bad else "all described")
        elif name == "recommended_first":
            bad = []
            for q in r:
                opts = q.get("options") or []
                labels = [o.get("label") or "" for o in opts]
                rec = [i for i, lb in enumerate(labels) if "(recommended)" in lb.lower()]
                if not rec or rec[0] != 0:
                    bad.append(f"{q.get('header')!r}->{labels[:1]}")
            add(name, not bad, f"not recommended-first: {bad}" if bad else "every question leads with (Recommended)")
        elif name == "no_reserved_labels":
            bad = [o.get("label") for q in r for o in q.get("options") or [] if (o.get("label") or "").strip().lower() in RESERVED]
            add(name, not bad, f"reserved: {bad}" if bad else "none")
        elif name == "forbidden_patterns":
            blob = json.dumps(r).lower()
            hit = [p for p in case.get("forbidden_patterns", []) if re.search(p.lower(), blob)]
            add(name, not hit, f"asked for a discoverable fact: {hit}" if hit else "none matched")
        elif name == "required_patterns":
            blob = json.dumps(r).lower()
            miss = [p for p in case.get("required_patterns", []) if not re.search(p.lower(), blob)]
            add(name, not miss, f"missing: {miss}" if miss else "all present")
        else:
            add(name, False, "unknown check")
    return out


def main():
    argv = [a for a in sys.argv[1:] if a != "--no-skills"]
    no_skills = "--no-skills" in sys.argv
    skill, path = argv[0], Path(argv[1])
    spec = json.loads(path.read_text())
    cases = spec["evals"] if isinstance(spec, dict) else spec

    with ThreadPoolExecutor(max_workers=3) as ex:
        observed = list(ex.map(lambda c: run_case(c, skill, no_skills), cases))

    label = "without_skill" if no_skills else "with_skill"
    results, total, passed = [], 0, 0
    for case, obs in zip(cases, observed, strict=True):
        graded = grade(case, obs)
        n_ok = sum(g["pass"] for g in graded)
        total += len(graded)
        passed += n_ok
        print(f"\n[{label}] case {case['id']}: {n_ok}/{len(graded)} — {case['prompt'][:70]}")
        for g in graded:
            print(f"  {'PASS' if g['pass'] else 'FAIL'}  {g['check']:<24} {g['evidence']}")
        results.append({"id": case["id"], "checks": graded, "trace": obs["trace"]})

    print(f"\n[{label}] {passed}/{total} checks passed")
    out = path.with_name(f"{path.stem}.{label}.results.json")
    out.write_text(json.dumps({"skill": skill, "config": label, "passed": passed, "total": total, "cases": results}, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
