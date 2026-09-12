---
source: session:crystallize-placement-and-push-auth
date: 2026-08-23
author: ringo
title: Where a crystallize belongs, and why pushes touching a workflow file were refused
---

# Where a crystallize belongs, and why pushes touching a workflow file were refused

> **In here:** what the session worked out after the engine refactor landed — why a crystallize runs in the session that holds the conversation rather than a fresh one, why its commit should not ride a feature branch, the root cause of the repeated push refusal, and the guard rule that stops an agent rewriting a pushed branch.

## Asked

Whether the crystallize pass should run in the session that did the work or in a new one, and how to stop the push refusal that kept recurring.

## Found

A crystallize takes the conversation as its input, so it can only run where that conversation exists. Reading the finished diff and commit log instead recovers what changed but not what was tried: four of the six observations from the preceding refactor left no artifact at all — that pytest's default prepend mode had reported `import file mismatch` before the import mode changed, that switching to importlib fixed the collision but broke two cross-module test imports, that the branch's base had none of the files to move, and that renaming a script drifted a rendered page. Those are the load-bearing findings, and a later session would file only "the engine moved and the tests moved".

Separating the role, the way retrieval is separated into a librarian to keep navigational drift out of the first read, does not transfer to a crystallize: retrieval can be done from cold and a distillation cannot.

The knowledge nevertheless lands wherever the commit lands. A crystallize committed onto a feature branch reaches the wiki only when that branch merges, so a stack that is reworked or abandoned takes the knowledge with it. The state ledgers are marked `merge=union` in `.gitattributes`, which is what makes two branches' appends both survive — but a union merge helps on merge and does nothing for a branch that never merges.

The push refusal was never an authentication failure. Host-scoped credential helpers in the user's `~/.gitconfig` route every HTTPS push to GitHub through the CLI's OAuth token, that token carried no `workflow` scope, and GitHub refuses any push whose diff touches `.github/workflows/` from an OAuth App token lacking it — a policy rejection returned after the credentials were accepted. It looked intermittent only because it fires on the pushed diff rather than on the branch, so it appears the moment a workflow file is anywhere in the range being pushed.

Pushing the same commits over SSH succeeds, because an SSH key is not an OAuth token and the scope restriction never applies to it. The clone had drifted into a mixed state worth noticing on its own: the CLI already reported SSH as this host's git protocol while the remote URL was still HTTPS.

The destructive-command guard's `git-force-push` rule carries the action `ask` and matches `--force`, `-f`, and `--force-with-lease` alike. An `ask` resolves to a block when no human is present to answer, so an agent working unattended cannot rewrite a branch it has already pushed, and the rewrite has to be handed back to the human.

## Decided

The crystallize workflow runs in the session that holds the conversation. What moves elsewhere is its commit, onto a branch cut from the same base so the wiki update merges independently of the work that produced it.

The clone's remote was repointed at SSH, which removes the scope restriction permanently for this checkout. Adding the missing scope to the CLI token remains the complementary fix for anywhere HTTPS is still wanted, and it needs an interactive device-code flow.

## Open

The CLI's global git protocol default is still HTTPS, so a freshly cloned checkout can reintroduce the same refusal until its remote is repointed.

Whether a crystallize commit should routinely target the base branch rather than the working branch — making it a standing convention rather than a per-session judgment — is unsettled.
