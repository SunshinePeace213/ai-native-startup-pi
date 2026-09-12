"""Reversal — docs/llm-wiki/state.md § Ledgers and views, § Human review; governance family
`reversibility`.

L4a undo of the newest live belief run leaves the belief views (claims, entities,
    relationships, conflicts) byte-identical to the views before that run and moves only
    the snapshot's run counts; redo restores the post-run views byte for byte
L4b undo of a belief run that is not the newest live one is refused with exit 2 and no
    row appended; an observation-less register is undoable from any position
L4c redo of a run whose source registration is retracted is refused with exit 2 and no row
    appended — the register is redone first, then the run
L5b every reader survives every reversal sequence: a retracted register orphans its
    observations, and status/queue/rebuild --check still answer
L4d undo of an already-retracted run, and redo of a live one, are no-ops that still audit
"""

from __future__ import annotations

from conftest import HUMAN, Vault, last_run, observation, two_observations


def test_L4a_undo_restores_pre_run_views_and_redo_restores_post_run_views(vault: Vault) -> None:
    source_id, _ = vault.register()
    before = vault.belief_views()
    apply_run = last_run(vault.apply(two_observations(source_id)))
    after = vault.belief_views()
    after_snapshot = vault.snapshot()
    assert after != before

    vault.state("undo", apply_run, "--by", HUMAN, "--reason", "L4a")
    assert vault.belief_views() == before
    assert vault.snapshot()["runs"] == {"live": after_snapshot["runs"]["live"] - 1, "retracted": 1}

    vault.state("redo", apply_run, "--by", HUMAN, "--reason", "L4a")
    assert vault.belief_views() == after
    assert vault.snapshot() == after_snapshot


def test_L4b_only_the_newest_live_belief_run_is_undoable(vault: Vault) -> None:
    source_id, _ = vault.register()
    first = last_run(vault.apply(two_observations(source_id)[:1]))
    second = last_run(vault.apply(two_observations(source_id)[1:]))
    ledgers = vault.ledgers()

    refused = vault.state("undo", first, "--by", HUMAN, "--reason", "L4b", check=False)
    assert refused.returncode == 2
    assert second in refused.stderr
    assert {k: v for k, v in vault.ledgers().items() if k != "audit_log.jsonl"} == {
        k: v for k, v in ledgers.items() if k != "audit_log.jsonl"
    }

    vault.state("undo", second, "--by", HUMAN, "--reason", "L4b")
    vault.state("undo", first, "--by", HUMAN, "--reason", "L4b")
    assert vault.counts()["claims"] == 0


def test_L4b_an_observation_less_register_is_undoable_from_any_position(vault: Vault) -> None:
    _, register_run = vault.register()
    other = vault.root / "llm-wiki" / "raw" / "notes" / "other.md"
    other.write_text(
        "---\ntitle: Other\n---\n\n# Other\n\n> **In here:** nothing.\n\nA line.\n",
        encoding="utf-8",
    )
    other_id = vault.state("register", "llm-wiki/raw/notes/other.md").stdout.splitlines()[0]
    vault.apply([observation(other_id, "other.key", "A line.", "A line.")])
    vault.state("undo", register_run, "--by", HUMAN, "--reason", "L4b")
    assert vault.counts()["sources"] == 1


def test_L4c_redo_of_a_run_whose_register_is_retracted_is_refused(vault: Vault) -> None:
    source_id, register_run, apply_run = vault.seed()
    vault.state("undo", apply_run, "--by", HUMAN, "--reason", "L4c")
    vault.state("undo", register_run, "--by", HUMAN, "--reason", "L4c")
    ledgers = vault.ledgers()
    views = vault.views()

    refused = vault.state("redo", apply_run, "--by", HUMAN, "--reason", "L4c", check=False)
    assert refused.returncode == 2
    assert register_run in refused.stderr and source_id in refused.stderr
    assert vault.ledgers() == ledgers
    assert vault.views() == views

    vault.state("redo", register_run, "--by", HUMAN, "--reason", "L4c")
    vault.state("redo", apply_run, "--by", HUMAN, "--reason", "L4c")
    assert vault.counts()["claims"] == 2
    assert vault.state("rebuild", "--check", actor=None).returncode == 0


def test_L5b_readers_survive_a_retracted_register_with_retracted_dependents(vault: Vault) -> None:
    _, register_run, apply_run = vault.seed()
    vault.state("undo", apply_run, "--by", HUMAN, "--reason", "L5b")
    vault.state("undo", register_run, "--by", HUMAN, "--reason", "L5b")
    counts = vault.counts()
    assert counts["sources"] == 0 and counts["observations"] == 0 and counts["claims"] == 0
    assert vault.json("queue")["total"] == 1
    assert vault.state("rebuild", "--check", actor=None).returncode == 0


def test_L4d_reversing_twice_is_a_recorded_no_op(vault: Vault) -> None:
    _, _, apply_run = vault.seed()
    vault.state("undo", apply_run, "--by", HUMAN, "--reason", "L4d")
    n = len(vault.audit_rows())
    again = vault.state("undo", apply_run, "--by", HUMAN, "--reason", "L4d")
    assert "unchanged" in again.stdout
    assert len(vault.audit_rows()) == n + 1
    assert vault.counts()["claims"] == 0

    vault.state("redo", apply_run, "--by", HUMAN, "--reason", "L4d")
    live = vault.state("redo", apply_run, "--by", HUMAN, "--reason", "L4d")
    assert "unchanged" in live.stdout
    assert vault.counts()["claims"] == 2
