"""Ledgers and views — docs/llm-wiki/state.md § Ledgers and views, § Layout.

L1  append-only: after any write verb, every byte a ledger held before is still there at the
    same offset; a read verb appends nothing anywhere
L2  run stamping: every row a write run appends carries that run's run_id, and audit_log
    holds exactly one row per write run; a read verb leaves no audit row
L3  views are derived: `rebuild --check` passes after every verb; a hand-edited view fails it
    and `rebuild` restores it byte for byte; a view's as_of is the newest ledger stamp
L5  fold: a retracted register puts its archive back in the queue and it registers again;
    a row with no run_id (legacy) is replayed, never skipped
L9  governance: an actor whose role lacks the verb is refused with exit 3, one denied audit
    row, and no ledger row
"""

from __future__ import annotations

import json

from conftest import AGENT, HUMAN, ROUTINE, Vault, assert_prefix_intact, last_run, two_observations


def test_L1_write_verbs_only_append(vault: Vault) -> None:
    source_id, register_run = vault.register()
    before = vault.ledgers()
    apply_run = last_run(vault.apply(two_observations(source_id)))
    after_apply = vault.ledgers()
    assert_prefix_intact(before, after_apply)

    vault.state("undo", apply_run, "--by", HUMAN, "--reason", "L1")
    after_undo = vault.ledgers()
    assert_prefix_intact(after_apply, after_undo)

    vault.state("decay", "--as-of", "2030-01-01T00:00:00Z")
    assert_prefix_intact(after_undo, vault.ledgers())


def test_L1_read_verbs_touch_nothing(seeded: tuple[Vault, str, str, str]) -> None:
    vault, *_ = seeded
    before = vault.ledgers() | vault.views()
    for verb in (
        ["status"],
        ["queue"],
        ["review"],
        ["audit"],
        ["inbox"],
        ["slice", "--entity", "ent_engine"],
    ):
        vault.state(*verb, actor=None)
    assert vault.ledgers() | vault.views() == before


def test_L2_every_appended_row_carries_its_run_and_audit_has_one_row_per_run(
    seeded: tuple[Vault, str, str, str],
) -> None:
    vault, _, register_run, apply_run = seeded
    stamped = [(ledger, row) for ledger, row in vault.rows() if ledger != "audit_log.jsonl"]
    assert stamped, "seed appended nothing"
    assert all("run_id" in row for _, row in stamped)
    assert {row["run_id"] for _, row in stamped} == {register_run, apply_run}
    audit = vault.audit_rows()
    assert sorted(r["run_id"] for r in audit) == sorted([register_run, apply_run])
    assert vault.state("audit", "--check", actor=None).returncode == 0


def test_L2_read_verbs_leave_no_audit_row(seeded: tuple[Vault, str, str, str]) -> None:
    vault, *_ = seeded
    n = len(vault.audit_rows())
    vault.state("status", actor=None)
    vault.state("queue", actor=None)
    vault.state("rebuild", "--check", actor=None)
    assert len(vault.audit_rows()) == n


def test_L3_views_replay_byte_identical_after_every_verb(vault: Vault) -> None:
    source_id, _ = vault.register()
    apply_run = last_run(vault.apply(two_observations(source_id)))
    assert vault.state("rebuild", "--check", actor=None).returncode == 0
    vault.state("merge", "ent_renderer", "ent_engine", "--by", HUMAN, "--reason", "L3")
    assert vault.state("rebuild", "--check", actor=None).returncode == 0
    vault.state("undo", apply_run, "--by", HUMAN, "--reason", "L3")
    assert vault.state("rebuild", "--check", actor=None).returncode == 0


def test_L3_a_hand_edited_view_is_caught_and_restored(seeded: tuple[Vault, str, str, str]) -> None:
    vault, *_ = seeded
    pristine = vault.views()
    claims = vault.states / "claims.jsonl"
    claims.write_bytes(claims.read_bytes().replace(b'"active"', b'"disputed"', 1))
    assert vault.views() != pristine
    assert vault.state("rebuild", "--check", actor=None, check=False).returncode == 1
    vault.state("rebuild")
    assert vault.views() == pristine


def test_L3_as_of_is_the_newest_ledger_stamp_not_the_clock(
    seeded: tuple[Vault, str, str, str],
) -> None:
    vault, *_ = seeded
    stamps = [
        row.get("timestamp") or row.get("extracted_at") or row.get("ingested_at")
        for ledger, row in vault.rows()
        if ledger != "audit_log.jsonl"
    ]
    snapshot = json.loads((vault.states / "snapshot.json").read_text(encoding="utf-8"))
    assert snapshot["as_of"] == max(s for s in stamps if s)


def test_L5_a_retracted_register_returns_the_archive_to_the_queue(vault: Vault) -> None:
    _, register_run = vault.register()
    assert vault.json("queue")["unregistered"] == []
    vault.state("undo", register_run, "--by", HUMAN, "--reason", "L5")
    queue = vault.json("queue")
    assert [r["path"] for r in queue["unregistered"]] == ["llm-wiki/raw/notes/probe.md"]
    source_id, _ = vault.register()
    assert vault.json("queue")["unregistered"] == []
    assert vault.counts()["sources"] == 1
    assert source_id


def test_L5_a_row_with_no_run_id_is_replayed(seeded: tuple[Vault, str, str, str]) -> None:
    vault, *_ = seeded
    sources = vault.states / "sources.jsonl"
    legacy = json.loads(sources.read_text(encoding="utf-8").splitlines()[0])
    legacy.pop("run_id")
    legacy["source_id"] = "src_legacy000000"
    legacy["path"] = "llm-wiki/raw/notes/legacy.md"
    legacy["hash"] = "sha256:" + "0" * 64
    with sources.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(legacy) + "\n")
    vault.state("rebuild")
    assert vault.counts()["sources"] == 2


def test_L9_a_role_without_the_verb_is_refused_with_one_denied_row_and_no_ledger_row(
    seeded: tuple[Vault, str, str, str],
) -> None:
    vault, source_id, _, _ = seeded
    ledgers_before = {k: v for k, v in vault.ledgers().items() if k != "audit_log.jsonl"}
    audit_before = len(vault.audit_rows())
    result = vault.apply(two_observations(source_id), actor=ROUTINE, check=False)
    assert result.returncode == 3
    assert {k: v for k, v in vault.ledgers().items() if k != "audit_log.jsonl"} == ledgers_before
    audit = vault.audit_rows()
    assert len(audit) == audit_before + 1
    assert audit[-1]["outcome"] == "denied"


def test_L9_a_role_with_the_verb_proceeds(vault: Vault) -> None:
    source_id, _ = vault.register(actor=AGENT)
    assert vault.apply(two_observations(source_id), actor=AGENT).returncode == 0
    assert vault.counts()["claims"] == 2
