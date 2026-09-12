# Architecture Sync

Read this when changing the repository map, folder descriptions, or its Pi lifecycle
integration. The output is [ARCHITECTURE.md](../ARCHITECTURE.md); the implementation
is [.pi/extensions/architecture-sync/](../.pi/extensions/architecture-sync/).

## Ownership

- `tree.ts` generates a deterministic directory tree from Git path metadata and updates
  only the block between the architecture-tree markers. It is shared by the extension
  and CLI; there is no Python dependency for architecture synchronization.
- `tree.config.json` owns the stable project label, depth (1–6), collapsed subtrees,
  selected files, and path-keyed one-line descriptions. Edit this file to explain a
  folder. New folders appear automatically with `Purpose not documented yet` and a
  diagnostic naming the missing description; the generator does not invent meaning.
- Explanations outside the block remain manually maintained. Synchronizing paths does
  not validate the architecture, test results, or model context.

## Inventory policy

The inventory contains existing tracked paths plus non-ignored untracked paths, so
new work appears before staging and tracked deletions disappear. The generator never
stages anything. Empty directories are not represented, since Git does not track them.
It reads path metadata, configuration, and the target document, never source/archive
contents. Root files appear only when selected in the config.

Dependencies, build output, caches, `.env`/`.envrc`, `.pi/subagents/`, Obsidian metadata,
and `llm-wiki/private/` are excluded even if accidentally tracked. Symlinks and unsafe
path spellings are excluded, and symlinked config/documents are refused. These exclusions
are a bounded project-map policy, not a general secret scanner. Keep sensitive files
out of Git. Configured collapsed areas prevent the map expanding into the KB corpus.

## Commands

Run from this checkout, or pass `--root PATH` to the CLI for another checkout:

```bash
bun run architecture:print
bun run architecture:check
bun run architecture:sync
bun .pi/extensions/architecture-sync/cli.ts --check --root /path/to/worktree
```

`print` never changes files. `check` exits 0 when the tree is current and 1 on drift;
invalid configuration, markers, Git failures, or write failures exit 2. Missing folder
descriptions are reported separately; they do not prevent a structural refresh.
`sync` replaces only the marked block, preserves surrounding text and newline style,
and leaves content and mtime untouched on a no-op.

`bun run check` includes the read-only architecture check, never automatic repair.
Run sync before verification or committing structural changes; a callback after the
agent has already answered cannot retroactively validate that answer or an earlier commit.

## Pi lifecycle

Requires Pi's `agent_settled` event (verified with 0.85.1). Trusted project extensions
load from `.pi/extensions/`; use `/reload` after editing them. Each extension instance
starts check-only, including embedded and subprocess subagents.

- `/architecture-sync` or `/architecture-sync check`: inspect without writing.
- `/architecture-sync sync`: explicitly update the tree now.
- `/architecture-sync auto`: enable updates for this editing session only.
- `/architecture-sync pause`: return to check-only mode.
- `pi --architecture-read-only`: refuse both auto opt-in and explicit sync in Pi.
  CLI sync is an independent explicit command, not controlled by this Pi flag.

Automatic permission is instance-local, not saved in project configuration or inherited
by a child. A session without writing tools, an untrusted context, or a process marked
`PI_SUBAGENT_CHILD=1` cannot opt in. No natural-language classifier decides permission;
use pause/the read-only flag for review-only workflows.

`before_agent_start` captures the projected map; low-level turns/retries/follow-ups do
not write it. At `agent_settled`, the extension updates only if the projection changed,
a successful potentially mutating tool ran, the context is still idle, and automatic
writes remain permitted. Content-only changes and unchanged read-only runs are no-ops.
A check-only run that changes structure gets a reminder rather than a repair. A map
already stale before the run is repaired through explicit sync, not by a read-only task.

Any `subagent` tool call conservatively pauses automatic writes, including management
calls. Pi's settled event is not a fleet-completion signal. The supervisor must join
all writers, run sync, and explicitly re-enable auto if desired. Unknown external
writers cannot be detected reliably: use separate worktrees or pause auto while they run.
Shutdown invalidates pending automatic writes; reload starts check-only again.

Changes and failures are recorded as session entries, displayed through available UI,
and supplied as a next-turn notice. They never trigger a model turn, ingestion, staging,
commits, or index maintenance. The extension does not automatically load the architecture
body into context; read it when the routing rule requires it.

## Concurrency and recovery

The Pi adapter uses the per-file mutation queue; the shared writer also takes an exclusive
`architecture-sync.lock` directory in Git's per-worktree administrative directory. It
re-reads the document under the lock, refuses detected concurrent edits, and replaces it
atomically with a same-directory temporary file. Cooperating sync writers are serialized
by refusal/retry; this is not a transaction lock over arbitrary editors or source files.

A held lock, malformed or duplicate markers, merge conflicts, or a failed Git command
leaves the document unmodified. Failure is reported, not retried in a model loop. A hard
process kill can leave the empty lock directory or temporary file behind. After verifying
that no sync process is active, locate the lock with
`git rev-parse --git-path architecture-sync.lock` and remove only that empty directory
with `rmdir`; move any abandoned `.architecture-sync-*.tmp` file to trash. Then rerun
check/sync. Never break an active writer's lock.

## Verification

`bun test tests/pi/architecture-sync` covers the CLI, scratch-Git generation, worktree
isolation, and lifecycle contracts. See [testing.md](testing.md) for the complete suite.
No live model evaluation is necessary for generation: descriptions are curated data and
all transformations are deterministic. Model adherence to AGENTS.md is a separate eval.
