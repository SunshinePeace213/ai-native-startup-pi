// Git: every rule asks. Nothing here can break the machine, but each one
// discards work or rewrites history that other people may hold — and the agent
// cannot know whether the branch was pushed, the stash mattered, or the
// reflog is the only copy.

import type { Rule } from "../types";
import { needsVerb, OB, re, SEG, SEGG, verb } from "./_shared";

const git = (rest: string) => re(`${verb("git")}${SEG}${rest}`);

export const VCS_RULES: Rule[] = [
  {
    id: "git-force-push",
    family: "vcs",
    tier: "ask",
    pattern: git(
      `\\bpush\\b${SEG}(?:--force(?:-with-lease|-if-includes)?\\b|${OB}-[A-Za-z]*f[A-Za-z]*\\b|--mirror\\b)`,
    ),
    title: "git push --force / --mirror",
    why: "a force push overwrites remote history and can discard teammates' commits; --mirror also deletes every remote ref not present locally.",
    fix: "Prefer a normal push; approve only if rewriting the remote branch is intended.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-remote-delete",
    family: "vcs",
    tier: "ask",
    pattern: git(`\\bpush\\b${SEG}(?:--delete\\b|${OB}-d\\b|\\s:[\\w./-]+)`),
    title: "git push deleting a remote branch or tag",
    why: "the ref disappears for everyone; open PRs against it close.",
    fix: "Approve only if deleting the remote ref is intended.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-hard-reset",
    family: "vcs",
    tier: "ask",
    pattern: git(`\\breset\\b${SEG}(?:--hard\\b|--merge\\b|--keep\\b)`),
    title: "git reset --hard",
    why: "throws away every uncommitted change in the working tree and index with no recovery.",
    fix: "Stash or commit first; approve only if discarding local changes is intended.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-discard-worktree",
    family: "vcs",
    tier: "ask",
    // The whole tree (`.` `./` `:/` `*`), optionally after `--`; a single file is allowed.
    // `restore --staged` only unstages unless --worktree is also given.
    pattern: git(
      `\\b(?:checkout|restore(?!${SEGG}--staged\\b(?!${SEGG}--worktree)))\\b${SEG}${OB}(?:--\\s+)?(?:\\.|\\./|:/|\\*)(?!\\S)`,
    ),
    title: "git checkout . / git restore . (discard the working tree)",
    why: "reverts every modified tracked file to HEAD at once; the edits are gone.",
    fix: "Restore the specific files you mean, or stash first.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-clean-force",
    family: "vcs",
    tier: "ask",
    pattern: git(`\\bclean\\b${SEG}(?:--force\\b|${OB}-[A-Za-z]*f[A-Za-z]*\\b)`),
    title: "git clean -f",
    why: "permanently removes untracked files; with -x also ignored ones — build output, local config, .env.",
    fix: "Preview with `git clean -n` first; approve only if the deletion is intended.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-branch-delete",
    family: "vcs",
    tier: "ask",
    pattern: git(
      `\\bbranch\\b${SEG}(?:${OB}-D\\b|${OB}-[a-z]*d[a-z]*\\b${SEG}--force\\b|--delete\\b${SEG}--force\\b)`,
    ),
    title: "git branch -D (force-delete a branch)",
    why: "-D drops a branch even when its commits are merged nowhere; only the reflog remembers them, for a while.",
    fix: "Use -d, which refuses unmerged work; approve only if the commits are meant to go.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-stash-drop",
    family: "vcs",
    tier: "ask",
    pattern: git(`\\bstash\\b${SEG}\\b(?:drop|clear)\\b`),
    title: "git stash drop / clear",
    why: "a dropped stash is unreachable by any ref; clear drops all of them.",
    fix: "`git stash list` first; pop or apply what matters, then drop.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-history-rewrite",
    family: "vcs",
    tier: "ask",
    pattern: git(
      `\\b(?:filter-branch|filter-repo|replace\\b${SEG}--delete|rebase\\b${SEG}(?:--root|-i\\b|--interactive))`,
    ),
    title: "git history rewrite",
    why: "rewriting history changes every commit id and diverges the repo for everyone who pulled it.",
    fix: "Approve only if a history rewrite is intended and nothing downstream has the old commits.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-reflog-expire",
    family: "vcs",
    tier: "ask",
    pattern: git(
      `\\b(?:reflog\\s+(?:expire|delete)\\b|gc\\b${SEG}--prune=(?:now|all)\\b|prune\\b${SEG}--expire=now\\b)`,
    ),
    title: "git reflog expire / gc --prune=now",
    why: "the reflog is the recovery path for every other git rule here; expiring it and pruning makes those losses permanent.",
    fix: "Leave the reflog alone unless disk space is the actual problem.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "git-worktree-remove",
    family: "vcs",
    tier: "ask",
    pattern: git(
      `\\b(?:worktree\\s+remove\\b${SEG}(?:--force\\b|${OB}-f\\b)|submodule\\s+deinit\\b${SEG}(?:--force\\b|${OB}-f\\b))`,
    ),
    title: "git worktree remove --force / submodule deinit -f",
    why: "--force removes a worktree or submodule checkout with uncommitted changes in it.",
    fix: "Commit or stash inside it first, then remove without --force.",
    refine: needsVerb(/^git$/),
  },
  {
    id: "package-publish",
    family: "vcs",
    tier: "ask",
    // --dry-run is the safe route the fix recommends, so it never asks.
    pattern: re(
      `${verb("(?:npm|pnpm|yarn|bun|cargo|twine|uv|gem)")}(?!${SEGG}--dry-run\\b)${SEG}` +
        "\\b(?:publish|unpublish|deprecate|yank|upload|push)\\b",
    ),
    title: "publishing or unpublishing a package",
    why: "a registry publish is public and versions cannot be re-used; unpublish and yank break everyone who depends on it.",
    fix: "Dry-run first (npm publish --dry-run); approve only for a release the user asked for.",
    refine: needsVerb(/^(?:npm|pnpm|yarn|bun|cargo|twine|uv|gem)$/),
  },
];
