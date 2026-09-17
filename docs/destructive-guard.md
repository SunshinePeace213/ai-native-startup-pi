# Destructive guard

`.pi/extensions/destructive-guard` is the deny/ask gate on every `bash`, `write`, and
`edit` call. It replaces the Claude Code `destructive-guard` hook (the `sensitive-files`
hook is replaced by `access-guard`). Pi ships no sandbox and no permission popups: the
`tool_call` return value is the only choke point, and `ctx.ui.select()` inside it is the
popup.

## The policy

Two axes decide every rule, not how scary the command looks:

- **Reversibility** — does state survive somewhere afterwards (git, a backup, a rebuild)?
- **Blast radius** — the workspace, the machine, or shared infrastructure?

| Verdict | When | Examples |
| --- | --- | --- |
| **allow** | recoverable, or inside the workspace and regenerable | `rm -rf node_modules`, `git push`, `docker run --rm` |
| **ask** | irreversible but scoped to the workspace, or reversible but outside it — the human holds the context the agent lacks | `rm -rf src`, `git reset --hard`, `DROP TABLE`, `docker prune`, `terraform destroy`, `curl \| sh`, `sudo` |
| **deny** | endangers the machine's ability to boot or be reached, damages shared state, or a mistaken "yes" is catastrophic | `rm -rf /`, `dd of=/dev/sda`, `mkfs`, fork bomb, `chown -R /`, `csrutil disable`, `wsl --unregister` |

Deny exists even though a dialog exists because a dialog is only a control when the human
has both context and attention. For the catastrophic class the guard hands the *execution*
to the human — the agent cannot type into your terminal, and neither can a prompt
injection that reached it. A deny is deterministic and audited; an ask is a bet on
attention.

### `rm` by target

The old hook denied every `rm -rf`, which trained agents to reach for `find -delete` and
`shutil.rmtree` — evasion by a well-intentioned agent, invisible to the guard. The rule
now moves with the target:

| Target | Verdict |
| --- | --- |
| a protected root (`/`, `/etc`, `~`, `$HOME`, `/Users`, `/System`, `/mnt/c`, `/Volumes/*`, `/opt/homebrew`, `~/.ssh` …) or a critical file | deny |
| an unverified variable that collapses to `/` (`"$DIR/"`, `$X/*`) | deny |
| the workspace root itself (`.`, `./`, `./.*`) — `.git` goes with it | deny |
| outside the workspace | deny |
| `$VAR`, `$VAR/sub`, `xargs rm`, `/tmp/<sub>`, `~/.Trash/*` | ask |
| inside the workspace (tracked files restore from git, untracked do not) | ask, with a git recovery count on the card |
| a regenerable directory inside the workspace (`node_modules`, `dist`, `build`, `.venv`, `__pycache__`, `coverage`, `target` …) | allow |

`mv <target> ~/.Trash/` stays the habit AGENTS.md teaches; the guard enforces the boundary.

### No human present

In `-p`, `--mode json`, and subagent sessions `ctx.hasUI` is false and a dialog would
silently no-op. The ask tier therefore resolves to a block whose reason names the config
key that would allow it. `"headless": "allow"` in the config runs ask-tier commands
unprompted with an audit line — for CI, not for a session nobody is watching.

## The approval card

```
⚠ destructive-guard — approval needed
  rm -rf src/migrations

  rule     filesystem/rm
  why      rm has no undo; a recursive delete of the wrong root wipes the OS, your home, or the Windows drive.
  target   /home/me/proj/src/migrations is inside the workspace — tracked files restore from git, untracked ones do not
  recovery 39 tracked (restorable) · 3 untracked → PERMANENT
  agent    "regenerating from the schema"  ← its claim, unverified

  › Approve once
    Approve for this session (same rule + targets)
    Deny — tell the agent the safe alternative
    Deny and stop this turn
```

The agent is told (through the system prompt) to put `# why: <reason>` above a
destructive command; the card shows it labelled as a claim. "Deny — tell the agent the
safe alternative" feeds the rule's fix back as the block reason and forbids equivalents, so
the agent self-corrects instead of retrying. Esc is a decline.

## Configuration — `.pi/destructive-guard.json`

Optional. Every field is optional; a malformed file falls back to the defaults with a
warning at session start.

```json
{
  "allow": ["sudo", "git-clean-force"],
  "ask": [],
  "deny": ["git-force-push"],
  "protectedRoots": ["/srv/data"],
  "artifacts": ["out"],
  "headless": "deny",
  "audit": ".pi/logs/destructive-guard.jsonl"
}
```

- `allow` / `ask` / `deny` re-map a rule's *fired* tier by id; they never fire a rule that
  did not match. A deny-tier rule under `allow` or `ask` is announced at every session
  start and in the footer status.
- `protectedRoots` (`~` and `$HOME` expand) and `artifacts` extend the path classifier.
- `audit` is an append-only JSONL trail of every non-allow verdict and every human
  decision (`false` disables). The default path is gitignored.

## The command

| `/destructive-guard …` | What |
| --- | --- |
| *(none)* | rule counts, workspace, platform, ask-tier state, overrides, audit path |
| `ask off` / `ask on` | lift or re-arm the ask tier for this session — deny never lifts |
| `forget` | drop the session's "approve for this session" memory |
| `test <command>` | the verdict for a command without running it — the way to check a rule |

## What it is not

Text matching over tool inputs, not a sandbox. A script the agent wrote, a Makefile
target, or an interpreter one-liner the interpreter rules do not recognise can still do
what a rule names. The interpreter rules, the `sh -c` / `eval` parsing, and the
system-prompt note narrow that gap; they do not close it. A guard bug fails **open and
loud**: the call runs, `ui.notify` says so, and the audit line reads `internal-error` —
a thrown `tool_call` handler would otherwise block every call.

## Changing a rule

Rules are data in `rules/<family>.ts`: `id`, `family`, `tier`, `pattern` (scanned on
quote-normalized text, never anchored), `title`, `why`, `fix`, and an optional `refine`
that reads the parsed segments and may move the tier either way. Every verb-anchored rule
carries `needsVerb(...)` so the verb must be what a segment runs, not a word in an `echo`.
Add the row to `tests/pi/destructive-guard/engine/verdict.test.ts` under the tier it must
land on, and one under `V3 allow` for the benign spelling it must not catch. Then
`bun test tests/pi/destructive-guard/engine`.
