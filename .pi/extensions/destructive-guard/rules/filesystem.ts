// Destructive file operations. The rm rule is the one whose tier moves with the
// target — see DELETE_TIER in _shared: a protected root, an unverified variable
// that would collapse to /, the workspace itself, or anything outside it is
// denied; the workspace's own files ask; a regenerable artifact is allowed.

import { options } from "../normalize";
import type { RefineInput, Refinement, Rule } from "../types";
import {
  ALLOW,
  BLOCKDEV,
  classifyAll,
  CRITICAL_FILE,
  DELETE_TIER,
  fold,
  merge,
  needsVerb,
  OB,
  re,
  REC_R,
  REDIR_OR_TEE,
  RUN_IT_YOURSELF,
  SEG,
  verb,
  withVerb,
} from "./_shared";

const TRASH =
  "mv <target> ~/.Trash/  (AGENTS.md safe-delete policy) — or scope the delete to a path you own.";

function refineRm(input: RefineInput): Refinement | undefined {
  const segments = withVerb(input, "rm");
  if (!segments.length) return ALLOW;
  return merge(
    segments.map((segment) => {
      const { flags, operands } = options(segment.args);
      if (flags.has("--no-preserve-root")) {
        return {
          tier: "deny",
          detail: "--no-preserve-root exists only to delete /",
          targets: operands,
        };
      }
      const recursive = flags.has("-r") || flags.has("-R") || flags.has("--recursive");
      if (segment.operandsUnknown) {
        return {
          tier: recursive ? "ask" : "allow",
          detail: "the paths arrive on stdin (xargs) and cannot be read here",
        };
      }
      if (!recursive) {
        // A single-file rm only matters when the file is system or key material.
        const classified = classifyAll(operands, input.env, (cls) =>
          cls.kind === "critical-file" || cls.kind === "protected-root" ? "deny" : "allow",
        );
        return fold(classified, RUN_IT_YOURSELF);
      }
      if (!operands.length) return ALLOW;
      const classified = classifyAll(operands, input.env);
      const folded = fold(classified, TRASH);
      if (folded?.tier === "ask") {
        folded.detail = `${folded.detail} — tracked files restore from git, untracked ones do not`;
      }
      return folded;
    }),
  );
}

function refineFind(input: RefineInput): Refinement | undefined {
  const segments = withVerb(input, "find");
  if (!segments.length) return ALLOW;
  return merge(
    segments.map((segment) => {
      const destructive = segment.args.some(
        (arg, i) =>
          arg === "-delete" ||
          ((arg === "-exec" || arg === "-execdir" || arg === "-ok") &&
            /^(?:.*\/)?rm$/.test(segment.args[i + 1] ?? "")),
      );
      if (!destructive) return ALLOW;
      const starts: string[] = [];
      for (const arg of segment.args) {
        if (arg.startsWith("-") || arg === "(" || arg === "!") break;
        starts.push(arg);
      }
      if (!starts.length) starts.push(".");
      // A predicate narrows what find deletes, so a start path at the workspace root asks
      // instead of denying; a protected root or anything outside still denies.
      const classified = classifyAll(starts, input.env, (cls) =>
        cls.kind === "workspace-root" ? "ask" : DELETE_TIER[cls.kind],
      );
      return fold(
        classified,
        "List the matches first (drop -delete), then remove them deliberately.",
      );
    }),
  );
}

function refineMv(input: RefineInput): Refinement | undefined {
  const segments = withVerb(input, "mv");
  if (!segments.length) return ALLOW;
  return merge(
    segments.map((segment) => {
      const { operands } = options(segment.args);
      if (operands.some((op) => op === "/dev/null")) {
        return {
          tier: "deny",
          detail: "mv into /dev/null discards the source with no trace",
          targets: operands,
        };
      }
      // mv removes its source, so every operand counts — not only the destination.
      return fold(
        classifyAll(operands, input.env, (cls) =>
          cls.kind === "protected-root" ||
          cls.kind === "critical-file" ||
          cls.kind === "workspace-root" ||
          cls.kind === "variable-collapses"
            ? "deny"
            : "allow",
        ),
        RUN_IT_YOURSELF,
      );
    }),
  );
}

function refineRsync(input: RefineInput): Refinement | undefined {
  const segments = withVerb(input, "rsync");
  if (!segments.length) return ALLOW;
  return merge(
    segments.map((segment) => {
      if (!segment.args.some((arg) => arg.startsWith("--delete"))) return ALLOW;
      const { operands } = options(segment.args);
      const dest = operands[operands.length - 1];
      if (dest === undefined || dest.includes(":"))
        return { tier: "ask", detail: "the destination is remote or unknown" };
      const [classified] = classifyAll([dest], input.env);
      if (!classified) return ALLOW;
      const tier = DELETE_TIER[classified.cls.kind] === "deny" ? "deny" : "ask";
      return {
        tier,
        detail: `--delete removes everything in ${classified.cls.absolute ?? dest} that the source lacks`,
        targets: [dest],
      };
    }),
  );
}

function refineShred(input: RefineInput): Refinement | undefined {
  const segments = withVerb(input, "shred");
  if (!segments.length) return ALLOW;
  return merge(
    segments.map((segment) => {
      const { operands } = options(segment.args);
      if (operands.some((op) => /^\/dev\/(?!null$|zero$|std)/.test(op))) {
        return {
          tier: "deny",
          detail: "shred on a device node destroys the whole disk or partition",
          targets: operands,
        };
      }
      return fold(
        classifyAll(operands, input.env),
        "Shred is irreversible by design; approve only for a file that must not be recoverable.",
      );
    }),
  );
}

function refinePermissions(input: RefineInput): Refinement | undefined {
  const segments = withVerb(input, "chmod", "chown", "chgrp", "setfacl");
  if (!segments.length) return ALLOW;
  return merge(
    segments.map((segment) => {
      const { flags, operands } = options(segment.args);
      if (!flags.has("-R") && !flags.has("--recursive")) return ALLOW;
      const paths =
        segment.verb === "setfacl"
          ? operands.filter((op) => /^[/.~$]/.test(op))
          : operands.slice(1);
      const worldWritable =
        segment.verb === "chmod" && /^0?777$|^a\+rwx$|^\+rwx$/.test(operands[0] ?? "");
      const classified = classifyAll(paths, input.env, (cls) => {
        if (cls.kind === "protected-root" || cls.kind === "critical-file" || cls.kind === "outside")
          return "deny";
        if (cls.kind === "variable-collapses") return "deny";
        return worldWritable ? "ask" : "allow";
      });
      return fold(
        classified,
        "Scope the change to the directory that needs it, with the least mode that works.",
      );
    }),
  );
}

export const FILESYSTEM_RULES: Rule[] = [
  {
    id: "rm",
    family: "filesystem",
    tier: "ask",
    pattern: re(verb("rm")),
    title: "rm — delete by target",
    why: "rm has no undo; a recursive delete of the wrong root wipes the OS, your home, or the Windows drive.",
    fix: TRASH,
    refine: refineRm,
  },
  {
    id: "find-delete",
    family: "filesystem",
    tier: "ask",
    pattern: re(`${verb("find")}${SEG}(?:-delete\\b|-(?:exec|execdir|ok)\\b${SEG}${verb("rm")})`),
    title: "find -delete / -exec rm",
    why: "find walks the whole tree under its start path and deletes every match, so a loose predicate erases far more than intended.",
    fix: "List the matches first (drop -delete), then remove them deliberately.",
    refine: refineFind,
  },
  {
    id: "mv",
    family: "filesystem",
    tier: "allow",
    pattern: re(verb("mv")),
    title: "mv of a protected root, the workspace, or into /dev/null",
    why: "mv removes its source: moving a system root relocates the whole tree, and /dev/null as a destination is a silent delete.",
    fix: RUN_IT_YOURSELF,
    refine: refineMv,
  },
  {
    id: "rsync-delete",
    family: "filesystem",
    tier: "ask",
    pattern: re(`${verb("rsync")}${SEG}--delete`),
    title: "rsync --delete",
    why: "--delete mirrors the source by removing everything else at the destination; a wrong trailing slash empties the wrong directory.",
    fix: "Run once with --dry-run and read the deletions, or drop --delete.",
    refine: refineRsync,
  },
  {
    id: "shred",
    family: "filesystem",
    tier: "ask",
    pattern: re(verb("shred")),
    title: "shred",
    why: "shred overwrites its target repeatedly so nothing can recover it.",
    fix: "Delete normally if recovery must stay possible.",
    refine: refineShred,
  },
  {
    id: "permissions-recursive",
    family: "permissions",
    tier: "allow",
    pattern: re(`${verb("(?:chmod|chown|chgrp|setfacl)")}(?=${SEG}${REC_R})`),
    title: "recursive chmod / chown / chgrp / setfacl",
    why: "re-permissioning or re-owning a system root breaks sudo, ssh, and every service that checks its files; 777 makes everything world-writable.",
    fix: "Scope the change to the directory that needs it, with the least mode that works.",
    refine: refinePermissions,
  },
  {
    id: "chattr-immutable",
    family: "permissions",
    tier: "ask",
    pattern: re(`${verb("chattr")}${SEG}${OB}-[a-zA-Z]*i`),
    title: "chattr -i (drop the immutable bit)",
    why: "the immutable bit is set on a file precisely so it cannot be changed or deleted; clearing it is the step before doing so.",
    fix: "Leave the bit in place unless the file really must change.",
    refine: needsVerb(/^chattr$/),
  },
  {
    id: "overwrite-critical-file",
    family: "filesystem",
    tier: "deny",
    pattern: re(
      `(?:${REDIR_OR_TEE}|${verb("truncate")}${SEG}\\s|${verb("(?:cp|install|dd)")}${SEG}\\s(?:of=)?)${CRITICAL_FILE}`,
    ),
    title: "overwrite, truncate, or copy onto a critical system file",
    why: "clobbering /etc/passwd, sudoers, fstab, sshd_config or a boot file can lock you out, break boot, or grant privilege.",
    fix: RUN_IT_YOURSELF,
  },
  {
    id: "symlink-critical",
    family: "filesystem",
    tier: "deny",
    pattern: re(`${verb("ln")}(?=${SEG}${OB}-[A-Za-z]*s)(?=${SEG}${CRITICAL_FILE})`),
    title: "symlink involving a critical system file",
    why: "a link at /etc/passwd or /etc/sudoers redirects trusted reads and writes to attacker content.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^ln$/),
  },
  {
    id: "redirect-to-block-device",
    family: "disk",
    tier: "deny",
    pattern: re(`>{1,2}\\s*${BLOCKDEV}`),
    title: "shell redirect onto a raw block device",
    why: "writing onto a disk device corrupts its partition table and filesystems in place.",
    fix: RUN_IT_YOURSELF,
  },
];
