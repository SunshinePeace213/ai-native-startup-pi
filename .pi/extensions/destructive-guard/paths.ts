// Where a path lands: the target classification behind the rm / find / mv / chmod
// refinements and the write-tool guard. The two axes the whole guard sorts on
// are decided here — is the target recoverable, and how far does the blast
// reach — for one path at a time. Pure except for the lenient realpath, which
// only reads the filesystem to follow symlinks (a symlink aimed outside the
// workspace is classified by where it points, not where it sits).

import { existsSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import type { GuardEnv } from "./types";

// --- Protected roots ----------------------------------------------------------

/** Linux roots, macOS roots, and the WSL drive mounts. The bare root, `root/`, and `root/*` match. */
const LINUX_ROOTS = [
  "/",
  "/bin",
  "/boot",
  "/dev",
  "/etc",
  "/home",
  "/lib",
  "/lib32",
  "/lib64",
  "/nix",
  "/opt",
  "/proc",
  "/root",
  "/run",
  "/sbin",
  "/snap",
  "/srv",
  "/sys",
  "/tmp",
  "/usr",
  "/usr/local",
  "/var",
  "/var/lib",
  "/var/log",
  "/var/tmp",
];

const MACOS_ROOTS = [
  "/Applications",
  "/Library",
  "/System",
  "/Users",
  "/Volumes",
  "/cores",
  "/opt/homebrew",
  "/private",
  "/private/etc",
  "/private/tmp",
  "/private/var",
];

const WSL_MOUNT =
  /^\/mnt\/[A-Za-z](?:\/(?:Windows|Users|Program Files(?: \(x86\))?|ProgramData))?$/;

/** Under $HOME: the home itself and the directories whose loss is a key or identity loss. */
const HOME_ROOTS = ["", ".ssh", ".gnupg", ".aws", ".kube", ".config/gcloud", ".azure"];

/** Directories any build regenerates — an `rm -rf` here inside the workspace is allowed. */
const ARTIFACT_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "tmp",
  "temp",
  ".tmp",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  ".parcel-cache",
  ".svelte-kit",
  ".angular",
  ".dart_tool",
  "coverage",
  ".nyc_output",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
  ".hypothesis",
  ".tox",
  ".nox",
  ".venv",
  "venv",
  ".eggs",
  "target",
  ".gradle",
  "obj",
  "bin",
]);

/** Scratch parents: deleting inside them asks rather than denies, though they sit outside the workspace. */
const SCRATCH_PARENTS = ["/tmp", "/var/tmp", "/private/tmp", "/private/var/tmp"];
const HOME_SCRATCH = [".Trash", ".cache", ".local/share/Trash"];

// --- Critical files -------------------------------------------------------------

/** Files whose overwrite, truncation, or deletion locks the machine, breaks boot, or grants privilege. */
const CRITICAL_EXACT = new Set([
  "/etc/passwd",
  "/etc/shadow",
  "/etc/gshadow",
  "/etc/group",
  "/etc/sudoers",
  "/etc/fstab",
  "/etc/hosts",
  "/etc/resolv.conf",
  "/etc/ssh/sshd_config",
  "/etc/nsswitch.conf",
  "/etc/ld.so.conf",
  "/etc/ld.so.preload",
  "/etc/wsl.conf",
]);
const CRITICAL_PREFIXES = [
  "/etc/sudoers.d/",
  "/etc/cron",
  "/etc/pam.d/",
  "/etc/security/",
  "/etc/ssh/",
  "/etc/systemd/",
  "/etc/ld.so.conf.d/",
  "/boot/",
  "/System/",
  "/Library/LaunchDaemons/",
  "/Library/LaunchAgents/",
  "/Library/Security/",
];

/** Shell profile and environment files: a write persists into every future shell. */
const PROFILE_FILES = new Set([
  ".bashrc",
  ".bash_profile",
  ".bash_login",
  ".profile",
  ".zshrc",
  ".zprofile",
  ".zshenv",
  ".zlogin",
  ".config/fish/config.fish",
]);
const SYSTEM_PROFILE = new Set([
  "/etc/profile",
  "/etc/environment",
  "/etc/bash.bashrc",
  "/etc/zshrc",
  "/etc/zprofile",
]);

// --- Helpers --------------------------------------------------------------------

/** `~`, `~/x`, `$HOME/x`, `${HOME}/x` → absolute. Other variables stay as written. */
export function expandHome(path: string, home: string): string {
  if (path === "~" || path.startsWith("~/")) return join(home, path.slice(2));
  const match = /^\$(?:\{HOME\}|HOME)(\/.*)?$/.exec(path);
  if (match) return join(home, match[1] ?? "");
  return path;
}

/** macOS keeps /etc, /tmp, /var as symlinks into /private; compare on the canonical spelling. */
function canonicalDarwin(path: string): string {
  return path.replace(/^\/private(\/(?:etc|tmp|var)(?:\/|$))/, "$1");
}

/** realpath that tolerates a tail that does not exist yet. */
export function realpathLenient(path: string): string {
  let head = path;
  const tail: string[] = [];
  while (!existsSync(head)) {
    const parent = dirname(head);
    if (parent === head) return path;
    tail.unshift(basename(head));
    head = parent;
  }
  try {
    return join(realpathSync(head), ...tail);
  } catch {
    return path;
  }
}

/** Trailing `/`, `/*`, `/.*`, `/.[!.]*`, `/..?*`, `/**` collapse onto the directory they empty. */
function stripGlobTail(path: string): { path: string; glob: boolean } {
  const match = /^(.*?)\/+(?:\*\*?|\.\*|\.\[!?\^?\.\]\*?|\.\.\?\*)?\/?$/.exec(path);
  if (match && match[1] !== undefined && match[1] !== path) {
    const glob = path.length > match[1].length + 1;
    return { path: match[1] === "" ? "/" : match[1], glob };
  }
  return { path, glob: false };
}

function isProtectedRoot(absolute: string, env: GuardEnv): string | undefined {
  const canonical = canonicalDarwin(absolute);
  if (LINUX_ROOTS.includes(canonical)) return `${absolute} is a protected system root`;
  if (MACOS_ROOTS.includes(absolute)) return `${absolute} is a protected macOS root`;
  if (WSL_MOUNT.test(absolute)) return `${absolute} is a Windows drive mount — the whole drive`;
  for (const sub of HOME_ROOTS) {
    const dir = join(env.home, sub);
    if (sub === "" && absolute === dir) return `${absolute} is your home directory`;
    if (sub !== "" && (absolute === dir || absolute.startsWith(`${dir}/`))) {
      return `${absolute} holds keys or credentials that cannot be regenerated`;
    }
  }
  for (const extra of env.extraProtectedRoots ?? []) {
    if (absolute === extra) return `${absolute} is protected by .pi/destructive-guard.json`;
  }
  return undefined;
}

function isCriticalFile(absolute: string): boolean {
  const canonical = canonicalDarwin(absolute);
  if (CRITICAL_EXACT.has(canonical)) return true;
  return CRITICAL_PREFIXES.some((prefix) => canonical.startsWith(prefix));
}

function isProfile(absolute: string, home: string): boolean {
  if (SYSTEM_PROFILE.has(canonicalDarwin(absolute))) return true;
  const rel = relative(home, absolute);
  return !rel.startsWith("..") && PROFILE_FILES.has(rel.split(sep).join("/"));
}

function isScratch(absolute: string, home: string): boolean {
  for (const parent of SCRATCH_PARENTS) {
    if (absolute.startsWith(`${parent}/`) && absolute.length > parent.length + 1) return true;
  }
  for (const sub of HOME_SCRATCH) {
    const parent = join(home, sub);
    if (absolute === parent || absolute.startsWith(`${parent}/`)) return true;
  }
  return false;
}

type Where = "root" | "inside" | "outside";

/** Where the path sits relative to the workspace; the stricter of its lexical and real forms wins. */
function containment(absolute: string, env: GuardEnv): Where {
  const roots = [resolve(env.workspace), realpathLenient(resolve(env.workspace))];
  const results: Where[] = [absolute, realpathLenient(absolute)].map((form) => {
    let where: Where = "outside";
    for (const root of roots) {
      const rel = relative(root, form);
      if (rel === "") return "root";
      if (!rel.startsWith("..") && !isAbsolute(rel)) where = "inside";
    }
    return where;
  });
  if (results.includes("outside")) return "outside";
  if (results.includes("root")) return "root";
  return "inside";
}

/** System trees a write/edit tool may never touch. /usr/local, /opt, /tmp, /var and the homes stay open. */
const WRITE_DENY_DIRS = [
  "/bin",
  "/boot",
  "/dev",
  "/etc",
  "/lib",
  "/lib32",
  "/lib64",
  "/nix",
  "/proc",
  "/root",
  "/sbin",
  "/snap",
  "/sys",
  "/usr",
  "/System",
  "/Library",
];
const WRITE_ALLOW_UNDER = ["/usr/local", "/Library/Caches", "/Library/Logs"];

function writeDenyDir(absolute: string): string | undefined {
  const canonical = canonicalDarwin(absolute);
  if (WRITE_ALLOW_UNDER.some((open) => canonical === open || canonical.startsWith(`${open}/`))) {
    return undefined;
  }
  if (/^\/mnt\/[A-Za-z]\/Windows(?:\/|$)/.test(canonical)) return "/mnt/<drive>/Windows";
  return WRITE_DENY_DIRS.find((dir) => canonical === dir || canonical.startsWith(`${dir}/`));
}

function isArtifact(absolute: string, env: GuardEnv): boolean {
  const rel = relative(resolve(env.workspace), absolute).split(sep);
  const extra = new Set(env.extraArtifacts ?? []);
  return rel.some(
    (part) => ARTIFACT_DIRS.has(part) || extra.has(part) || part.endsWith(".egg-info"),
  );
}

// --- Classification -------------------------------------------------------------

export type PathKind =
  | "protected-root"
  | "critical-file"
  | "variable-collapses"
  | "variable"
  | "workspace-root"
  | "artifact"
  | "workspace"
  | "scratch"
  | "outside"
  | "unknown";

export interface PathClass {
  kind: PathKind;
  detail: string;
  /** The absolute form, when one could be computed. */
  absolute?: string;
}

/**
 * Classify one operand a delete-like verb would consume. `cwd` is where the
 * command runs; `env.workspace` is the boundary. Variables other than $HOME are
 * not expanded — a path whose value depends on one is classified by what an
 * empty value would make it.
 */
export function classifyTarget(operand: string, env: GuardEnv): PathClass {
  const raw = operand.trim();
  if (!raw) return { kind: "unknown", detail: "an empty operand" };
  const expanded = expandHome(raw, env.home);
  if (/^\$/.test(expanded)) {
    const match = /^(\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_]*|\$[@*#?$!0-9])(.*)$/.exec(expanded);
    const rest = match?.[2] ?? "";
    const name = match?.[1] ?? expanded;
    if (/^\/+(?:\*|\.\*)?\/?$/.test(rest)) {
      return {
        kind: "variable-collapses",
        detail: `${name} is unverified — if it is empty or unset this is a delete of /`,
      };
    }
    return {
      kind: "variable",
      detail: rest
        ? `${name} is unverified — if it is empty this becomes ${rest}`
        : `${name} is unverified — its value cannot be read here`,
    };
  }
  if (/^[*]+$/.test(expanded) || expanded === "./*" || expanded === "./**") {
    const cwd = resolve(env.cwd);
    const where = containment(cwd, env);
    if (where === "outside")
      return {
        kind: "outside",
        detail: `everything in ${cwd}, outside the workspace`,
        absolute: cwd,
      };
    if (isArtifact(cwd, env))
      return {
        kind: "artifact",
        detail: `everything in ${cwd}, a regenerable directory`,
        absolute: cwd,
      };
    return { kind: "workspace", detail: `everything in ${cwd} (dotfiles survive)`, absolute: cwd };
  }
  const stripped = stripGlobTail(expanded);
  const absolute = isAbsolute(stripped.path)
    ? resolve(stripped.path)
    : resolve(env.cwd, stripped.path);
  const rootDetail = isProtectedRoot(absolute, env);
  if (rootDetail) return { kind: "protected-root", detail: rootDetail, absolute };
  if (isCriticalFile(absolute)) {
    return { kind: "critical-file", detail: `${absolute} is a critical system file`, absolute };
  }
  if (expanded.includes("$")) {
    return {
      kind: "variable",
      detail: `${raw} depends on a variable that cannot be read here`,
      absolute,
    };
  }
  const where = containment(absolute, env);
  if (where === "root") {
    return {
      kind: "workspace-root",
      detail: `${absolute} is the workspace root itself (.git included)`,
      absolute,
    };
  }
  if (where === "outside") {
    if (isScratch(absolute, env.home)) {
      return {
        kind: "scratch",
        detail: `${absolute} is scratch space outside the workspace`,
        absolute,
      };
    }
    return { kind: "outside", detail: `${absolute} is outside the workspace`, absolute };
  }
  if (isArtifact(absolute, env)) {
    return { kind: "artifact", detail: `${absolute} is a regenerable build artifact`, absolute };
  }
  return { kind: "workspace", detail: `${absolute} is inside the workspace`, absolute };
}

/** A path a write/edit tool is about to change: deny for system state, ask for a shell profile. */
export function classifyWrite(path: string, env: GuardEnv): PathClass | undefined {
  if (typeof path !== "string" || !path.trim()) return undefined;
  const expanded = expandHome(path.trim(), env.home);
  const absolute = isAbsolute(expanded) ? resolve(expanded) : resolve(env.cwd, expanded);
  for (const form of [absolute, realpathLenient(absolute)]) {
    if (isCriticalFile(form)) {
      return { kind: "critical-file", detail: `${form} is a critical system file`, absolute: form };
    }
    // A profile — the user's or the system-wide one — asks; it is reversible, just persistent.
    if (isProfile(form, env.home)) {
      return {
        kind: "scratch",
        detail: `${form} is a shell profile — a write persists into every future shell`,
        absolute: form,
      };
    }
    const systemDir = writeDenyDir(form);
    if (systemDir !== undefined) {
      return {
        kind: "protected-root",
        detail: `${form} is under the system tree ${systemDir}`,
        absolute: form,
      };
    }
    for (const sub of HOME_ROOTS.slice(1)) {
      const dir = join(env.home, sub);
      if (form === dir || form.startsWith(`${dir}/`)) {
        return {
          kind: "protected-root",
          detail: `${form} holds keys or credentials`,
          absolute: form,
        };
      }
    }
  }
  return undefined;
}

export const ARTIFACTS = ARTIFACT_DIRS;
