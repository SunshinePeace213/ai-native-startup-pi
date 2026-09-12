# Grading an existing suite

Load this when the user asks whether tests are any good, or before extending a
suite someone else (an agent, usually) wrote. Verdict every case, then list the
contract lines with no case at all.

## Verdicts

| Verdict | The tell | Fix |
| --- | --- | --- |
| `contract` | Cites (or plainly maps to) a guarantee a caller or user observes; has a should-not sibling | keep |
| `path-lock` | Asserts a helper's intermediate value, a call sequence, or an export that exists only for the test | delete; cover the guarantee through the public caller |
| `prose-lock` | Exact-matches human/model-facing wording | loosen to the facts the text must carry |
| `quirk-lock` | The comment beside it admits the value is an artefact | delete |
| `one-sided` | Its table or describe block expects one verdict everywhere | add the opposite rows |
| `orphan` | No contract line explains why it matters | delete, or write the missing line if it turns out to be real |

Four questions per case, in order — the first "no" is the verdict:

1. Which contract line is this? (none → `orphan`)
2. Would a *correct* refactor of the implementation leave it green? (no → `path-lock` / `quirk-lock`)
3. Is the assertion on something observable at the seam — return value, message, status, disk, exit code? (no → `path-lock`)
4. Is the text being matched machine-parsed? (no, and exact → `prose-lock`)

Then per describe block: does it contain both verdicts? (no → `one-sided`)

## Worked examples from this repo

From `.pi/extensions/llm-wiki/guard.test.ts` and `format.test.ts` as they stood
before the standard existed — real material, not invented.

**`contract` — keep**

```ts
test("a symlink aimed at a protected file is caught through its real path", () => {
  symlinkSync(join(root, "llm-wiki", "states", "claims.jsonl"), join(root, "alias.jsonl"));
  expect(protectedPath("alias.jsonl", root, root)).toContain("state.py");
});
```

Guarantee: a protected file is protected under every name. Observable at the
seam the hook calls. Has passing siblings (raw/, outside-project).

**`contract` — the best one in the file**

```ts
test("a protected target inside a pipeline is found end to end", () => {
  const denial = bashTargets("cd x && echo 1 >> llm-wiki/states/claims.jsonl")
    .map((target) => protectedPath(target, root, root)).find(Boolean);
  expect(denial).toContain("state.py");
});
```

This is what the hook actually promises. Most of the other `bashTargets` cases
could fold into rows of this shape.

**`path-lock` — delete**

```ts
expect(spaceBoundaries("echo '>' > f")).toBe("echo '>'  >  f");
```

`spaceBoundaries` is an intermediate normalisation, exported only to be
reached. The double space is a detail of the current pass. No user or model
ever sees this string. Un-export; the guarantee ("quoted operators are not
operators") is covered by a `bashTargets` row.

**`quirk-lock` — delete**

```ts
// A quoted operator is a plain word; it lands as a harmless path token beside the real target.
expect(bashTargets("echo '>' > f")).toEqual([">", "f"]);
```

The comment concedes `">"` is an artefact, then asserts it. A refactor that
stops emitting it would fail a test that admits it does not matter. The real
guarantee is "`f` is found", so: `expect(bashTargets(...)).toContain("f")`.

Same shape:

```ts
expect(bashTargets("sed -i s/a/b/ llm-wiki/states/sources.jsonl"))
  .toEqual(["s/a/b/", "llm-wiki/states/sources.jsonl"]);
```

Locks the sed pattern leaking into targets as if it were spec.

**`prose-lock` — loosen**

```ts
expect(block).toContain("2 archives under llm-wiki/raw/ wait: 1 unregistered · 1 filed light");
```

```ts
test("singular wording", () => {
  expect(formatQueue({ total: 1, ... })).toContain("1 archive under llm-wiki/raw/ waits");
});
```

The contract is: the model reading the block learns the total, each path, and
the verb to run. Every copy edit currently fails a test carrying no
information. Loosen to `toContain("2")`, `toContain(row.path)`,
`toContain("/skill:llm-wiki-ingest --queue")`. Delete the singular case —
two experts would not agree it is a guarantee.

**`contract` — exact match is right here**

```ts
expect(block.startsWith("<llm-wiki-queue>")).toBe(true);
expect(block.endsWith("</llm-wiki-queue>")).toBe(true);
```

The tags are a machine-parsed format the extension and the model both key
on. Exact is correct.

**Half and half**

```ts
expect(block).toContain("  a.b · p 0.91 · disputed · ⚠ disputed, needs_review");
```

That key, probability (2 dp), status, and flags all appear is contract. That
they are joined by ` · ` with two leading spaces is prose. Split into four
`toContain`s on the facts.

## What was missing — the inverted-coverage finding

`index.ts` opens with the extension's actual contract: *"calls no model,
writes nothing, and fails open everywhere except a confirmed protected
path."* At review time:

- `engine.ts` fail-open — uv missing, non-zero exit, killed, unparsable
  stdout, wrong shape — **0 cases** across 5 branches.
- The four hooks — `session_start`, `input`→`before_agent_start`,
  `tool_call`, `tool_result` — **0 cases**.
- The negative "sends nothing when queue and inbox are both empty" — **0**.

Meanwhile ~10 cases sat on private string helpers. Coverage was inverted
against risk. When grading a suite, the "Not covered" section is the part
the author most needs to read.

## Report shape

```text
## <file>
| case | verdict | fix |
| "spaceBoundaries exposes operators…" | path-lock | delete; covered by bashTargets rows |
| "singular wording" | prose-lock | delete |
| … | | |

## Not covered
- E1 fail-open on exec throw / code≠0 / killed / bad JSON / wrong shape — 0 cases
- H3 tool_call blocks write/edit/bash on protected path — 0 cases through the hook
```
