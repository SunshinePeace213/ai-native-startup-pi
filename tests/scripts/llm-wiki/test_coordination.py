"""Two writers on one checkout — docs/llm-wiki/state.md § Layout ("serialized on
states/.lock"); governance family `coordination`.

L7a a write verb that cannot take states/.lock inside the policy's timeout exits 3 and
    appends nothing; the same verb succeeds once the lock is free
L7b two writers racing on one vault both land, or one waits for the other: afterwards every
    row joins its run, the views replay byte-identical, and both observations are folded
L7c a proposal in states/inbox/ is drained by `apply --inbox` as one run per file, in name
    order, and the inbox is empty afterwards
"""

from __future__ import annotations

import fcntl
import json
from concurrent.futures import ThreadPoolExecutor

from conftest import Vault, two_observations


def test_L7a_a_held_lock_refuses_the_writer_and_frees_it_after(vault: Vault) -> None:
    source_id, _ = vault.register()
    ledgers = {k: v for k, v in vault.ledgers().items() if k != "audit_log.jsonl"}
    lock = vault.states / ".lock"
    with lock.open("a+", encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            held = vault.apply(two_observations(source_id), check=False)
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
    assert held.returncode == 3
    assert {k: v for k, v in vault.ledgers().items() if k != "audit_log.jsonl"} == ledgers

    assert vault.apply(two_observations(source_id)).returncode == 0
    assert vault.counts()["claims"] == 2


def test_L7b_two_racing_writers_leave_a_vault_that_replays(vault: Vault) -> None:
    source_id, _ = vault.register()
    files = []
    for index, row in enumerate(two_observations(source_id)):
        path = vault.root / f"writer-{index}.jsonl"
        path.write_text(json.dumps(row) + "\n", encoding="utf-8")
        files.append(path)

    # Two processes, one lock: the second polls until the first is done (the fixture's
    # lock timeout is 1 s; an apply takes well under that).
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda p: vault.apply_file(p, check=False), files))

    assert [r.returncode for r in results] == [0, 0], [r.stderr for r in results]
    assert vault.counts()["claims"] == 2
    assert vault.state("rebuild", "--check", actor=None).returncode == 0
    assert vault.state("audit", "--check", actor=None).returncode == 0


def test_L7c_the_inbox_drains_in_name_order_one_run_per_file(vault: Vault) -> None:
    source_id, _ = vault.register()
    inbox = vault.states / "inbox"
    first, second = two_observations(source_id)
    (inbox / "b-second.jsonl").write_text(json.dumps(second) + "\n", encoding="utf-8")
    (inbox / "a-first.jsonl").write_text(json.dumps(first) + "\n", encoding="utf-8")
    assert len(vault.json("inbox")["proposals"]) == 2

    runs_before = {r["run_id"] for r in vault.audit_rows()}
    vault.state("apply", "--inbox")
    new_runs = [
        r for r in vault.audit_rows() if r["run_id"] not in runs_before and r["verb"] == "apply"
    ]
    assert len(new_runs) == 2
    assert list(inbox.glob("*.jsonl")) == []
    assert vault.counts()["claims"] == 2

    claims = [
        json.loads(line)
        for line in (vault.states / "claims.jsonl").read_text(encoding="utf-8").splitlines()
        if line
    ]
    first_seen = {c["claim_key"]: c["first_seen"] for c in claims}
    assert first_seen[first["claim_key"]] <= first_seen[second["claim_key"]]
