"""Entity resolution and merges — docs/llm-wiki/state.md § Identifiers, § Update table.

L6a a mention resolves to the first-seen entity whose normalized name or alias matches;
    a mention matching nothing starts a new entity
L6b `merge <from> <into>` makes every mention of `from` resolve to `into`, folds `from`'s
    name and aliases into `into`'s, and lists `from` in `into.merged_from`; `unmerge`
    restores both — through the ledgers, with the views replaying byte-identical
L6c a merge is a human judgment: `--by` must name a human, an agent identity is refused
    and no merge row lands
"""

from __future__ import annotations

import json

from conftest import AGENT, HUMAN, Vault, observation


def merge_ids(vault: Vault) -> list[str]:
    path = vault.states / "merges.jsonl"
    if not path.exists():
        return []
    return [
        json.loads(line)["merge_id"]
        for line in path.read_text(encoding="utf-8").splitlines()
        if line
    ]


def entities(vault: Vault) -> dict[str, dict]:
    path = vault.states / "entities.jsonl"
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]
    return {row["entity_id"]: row for row in rows}


def test_L6a_a_mention_by_alias_lands_on_the_first_seen_entity(vault: Vault) -> None:
    source_id, _ = vault.register()
    vault.apply(
        [
            observation(source_id, "a.one", "One.", "The engine appends rows"),
            observation(
                source_id,
                "a.two",
                "Two.",
                "never rewrites one",
                entities=[{"name": "State Engine", "type": "system"}],
                relationships=[],
            ),
        ]
    )
    found = entities(vault)
    assert "ent_engine" in found
    assert not any(e["name"] == "State Engine" for e in found.values())
    assert vault.counts()["entities"] == 2  # Engine and Renderer — not a third


def test_L6a_an_unmatched_mention_starts_a_new_entity(vault: Vault) -> None:
    source_id, _ = vault.register()
    vault.apply(
        [
            observation(source_id, "a.one", "One.", "The engine appends rows"),
            observation(
                source_id,
                "a.two",
                "Two.",
                "never rewrites one",
                entities=[{"name": "Retriever", "type": "system"}],
                relationships=[],
            ),
        ]
    )
    assert vault.counts()["entities"] == 3


def test_L6b_merge_folds_and_unmerge_restores_through_the_ledgers(vault: Vault) -> None:
    vault.seed()
    before = vault.belief_views()
    vault.state("merge", "ent_renderer", "ent_engine", "--by", HUMAN, "--reason", "L6b")
    merge_id = merge_ids(vault)[-1]

    found = entities(vault)
    assert "ent_renderer" not in found
    engine = found["ent_engine"]
    assert "ent_renderer" in engine["merged_from"]
    assert "renderer" in {a.lower() for a in engine["aliases"]}
    assert vault.state("rebuild", "--check", actor=None).returncode == 0

    vault.state("unmerge", merge_id, "--by", HUMAN, "--reason", "L6b")
    assert vault.belief_views() == before
    assert vault.state("rebuild", "--check", actor=None).returncode == 0


def test_L6c_a_merge_cannot_be_attributed_to_an_agent(vault: Vault) -> None:
    vault.seed()
    before = merge_ids(vault)
    result = vault.state(
        "merge",
        "ent_renderer",
        "ent_engine",
        "--by",
        AGENT,
        "--reason",
        "L6c",
        actor=None,
        check=False,
    )
    assert result.returncode != 0
    assert "human:" in result.stderr
    assert merge_ids(vault) == before
    assert vault.counts()["entities"] == 2
