// classifyTarget / classifyWrite — where a path lands, on a real scratch workspace.
//
// P1  protected roots: /, every Linux system root, the macOS roots, /mnt/<drive> and its
//     Windows/Users subfolders, ~ and $HOME, ~/.ssh and files under it — bare, with a
//     trailing slash, or with a trailing glob (/*, /.*, /**)
// P2  a critical file (/etc/passwd, /etc/sudoers.d/x, /boot/x, macOS /private/etc/…)
// P3  variables: `$VAR/` and `$VAR/*` collapse to / (deny-class); bare `$VAR` and
//     `$VAR/sub` are unverified (ask-class); $HOME expands and is the home root
// P4  the workspace root itself (`.`, its absolute path, `..` from a child, `/.*` at the
//     root) is workspace-root; `*` in the root is workspace (dotfiles survive)
// P5  inside the workspace: a regenerable directory anywhere in the path is artifact
//     (node_modules, dist, .venv, __pycache__, coverage, x.egg-info, config extras);
//     anything else is workspace
// P6  outside the workspace is outside; /tmp/<sub>, ~/.Trash, ~/.cache are scratch;
//     bare /tmp is a protected root; a symlink that escapes is classified by its real
//     target and a path whose lexical form is outside stays outside whatever it
//     resolves to (the stricter form wins); a relative path resolves against cwd, not
//     the workspace. The scratch workspace lives under tmpdir, so "outside" there
//     reads as scratch — the tests assert the boundary, not the /tmp accident.
// P7  classifyWrite: a critical file or anything under /etc, /usr, /boot, /System, ~/.ssh
//     is protected-root/critical; /usr/local and /tmp are open; a shell profile is
//     "scratch" (the ask class); a symlink to a protected file is caught by realpath
// P8  garbage never throws: empty, whitespace, a lone `-`, a non-string

import { describe, expect, test } from "bun:test";
import { symlinkSync } from "node:fs";
import { join } from "node:path";

import {
  type PathKind,
  classifyTarget,
  classifyWrite,
  expandHome,
} from "@ext/destructive-guard/paths";

import { scratchWorkspace } from "../fixture";

const ws = scratchWorkspace();
const kind = (operand: string, env = ws.env) => classifyTarget(operand, env).kind;

describe("P1 protected roots", () => {
  test.each([
    "/",
    "/*",
    "/.*",
    "/etc",
    "/etc/",
    "/etc/*",
    "/usr",
    "/usr/local",
    "/var",
    "/var/lib",
    "/var/log",
    "/home",
    "/root",
    "/boot",
    "/tmp",
    "/tmp/*",
    "/opt",
    "/Users",
    "/System",
    "/Library",
    "/Applications",
    "/Volumes",
    "/Volumes/*",
    "/private",
    "/private/etc",
    "/opt/homebrew",
    "/mnt/c",
    "/mnt/c/",
    "/mnt/c/*",
    "/mnt/d/Users",
    "/mnt/c/Windows",
    "/mnt/c/Program Files",
    "~",
    "~/",
    "~/*",
    "$HOME",
    "${HOME}/",
    "~/.ssh",
    "~/.ssh/id_rsa",
    "~/.gnupg/",
    "~/.aws/credentials",
  ])("%s", (operand) => {
    expect(kind(operand)).toBe("protected-root");
  });
  test("a deeper system path is not the root", () => {
    expect(kind("/etc/nginx")).toBe("outside");
    expect(kind("/mnt/c/Users/me/proj")).toBe("outside");
  });
  test("a config extra root is protected", () => {
    const env = { ...ws.env, extraProtectedRoots: [join(ws.outside, "data")] };
    expect(classifyTarget(join(ws.outside, "data"), env).detail).toContain(
      "destructive-guard.json",
    );
  });
});

describe("P2 critical files", () => {
  test.each([
    "/etc/passwd",
    "/etc/shadow",
    "/etc/sudoers",
    "/etc/sudoers.d/ops",
    "/etc/fstab",
    "/etc/cron.d/x",
    "/boot/vmlinuz",
    "/private/etc/passwd",
    "/etc/ssh/sshd_config",
    "/System/Library/x",
  ])("%s", (operand) => {
    expect(kind(operand)).toBe("critical-file");
  });
  test("a .bak beside a critical file is not the file", () => {
    expect(kind("/etc/passwd.bak")).toBe("outside");
  });
});

describe("P3 variables", () => {
  test.each(["$DIR/", "$DIR/*", "${DIR}/", "${DIR:-}/", "$1/", "$DIR//"])(
    "%s collapses to /",
    (operand) => {
      expect(kind(operand)).toBe("variable-collapses");
    },
  );
  test.each(["$DIR", "$DIR/build", "${DIR}/x", "$@", "$1", "$TMPDIR/x"])(
    "%s is unverified",
    (operand) => {
      expect(kind(operand)).toBe("variable");
    },
  );
  test("a variable later in the path is still unverified", () => {
    expect(kind("./build/$NAME")).toBe("variable");
  });
  test("$HOME expands", () => {
    expect(expandHome("$HOME/x", "/h")).toBe("/h/x");
    expect(expandHome("${HOME}", "/h")).toBe("/h");
    expect(expandHome("~/x", "/h")).toBe("/h/x");
    expect(expandHome("$HOMEDIR/x", "/h")).toBe("$HOMEDIR/x");
  });
});

describe("P4 the workspace root", () => {
  test.each([".", "./", ws.root, `${ws.root}/`, "./.*", "./.[!.]*"])("%s", (operand) => {
    expect(kind(operand)).toBe("workspace-root");
  });
  test(".. from a child is the root", () => {
    expect(kind("..", { ...ws.env, cwd: join(ws.root, "src") })).toBe("workspace-root");
  });
  test("* at the root is workspace — dotfiles survive", () => {
    expect(kind("*")).toBe("workspace");
    expect(kind("./*")).toBe("workspace");
  });
  test("* in a child is workspace; in an artifact dir it is artifact", () => {
    expect(kind("*", { ...ws.env, cwd: join(ws.root, "src") })).toBe("workspace");
    expect(kind("*", { ...ws.env, cwd: join(ws.root, "node_modules") })).toBe("artifact");
  });
});

describe("P5 inside the workspace", () => {
  test.each([
    "node_modules",
    "node_modules/.cache",
    "./dist",
    "dist/",
    "packages/a/build",
    ".venv",
    "src/__pycache__",
    "coverage",
    "target",
    "foo.egg-info",
    "tmp",
  ])("%s is an artifact", (operand) => {
    expect(kind(operand)).toBe("artifact");
  });
  test.each(["src", "src/", "src/*", "./src/migrations", "src/a.ts", "docs", "README.md"])(
    "%s is workspace",
    (operand) => {
      expect(kind(operand)).toBe("workspace");
    },
  );
  test("a config extra artifact", () => {
    expect(kind("out2", { ...ws.env, extraArtifacts: ["out2"] })).toBe("artifact");
  });
});

describe("P6 outside, scratch, symlinks, cwd", () => {
  test("outside the workspace", () => {
    expect(kind("/srv/app")).toBe("outside");
    expect(kind("/etc/nginx/sites")).toBe("outside");
    expect(kind(ws.outside)).not.toBe("workspace");
  });
  test.each(["/tmp/build-123", "/var/tmp/x", "~/.Trash", "~/.Trash/*", "~/.cache/pip"])(
    "%s is scratch",
    (operand) => {
      expect(kind(operand)).toBe("scratch");
    },
  );
  test("a symlink that escapes is classified by its target, never as workspace", () => {
    expect(kind("escape")).not.toBe("workspace");
    expect(kind("escape/")).not.toBe("workspace");
    expect(classifyTarget("escape", ws.env).absolute).toBe(join(ws.root, "escape"));
  });
  test("a symlink into the workspace from outside: the outside form wins", () => {
    symlinkSync(join(ws.root, "src"), join(ws.outside, "back"));
    expect(kind(join(ws.outside, "back"))).not.toBe("workspace");
  });
  test("a relative operand resolves against cwd", () => {
    expect(kind("migrations", { ...ws.env, cwd: join(ws.root, "src") })).toBe("workspace");
    expect(kind("proj", { ...ws.env, cwd: join(ws.root, "..") })).toBe("workspace-root");
  });
});

describe("P7 classifyWrite", () => {
  test.each([
    ["/etc/passwd", "critical-file"],
    ["/etc/nginx/nginx.conf", "protected-root"],
    ["/usr/lib/x.so", "protected-root"],
    ["/boot/grub/grub.cfg", "critical-file"],
    ["/System/Library/x", "critical-file"],
    ["/Library/LaunchDaemons/x.plist", "critical-file"],
    ["/Library/Preferences/x", "protected-root"],
    ["/mnt/c/Windows/System32/x", "protected-root"],
    ["~/.ssh/authorized_keys", "protected-root"],
    ["~/.bashrc", "scratch"],
    ["~/.zshrc", "scratch"],
    ["/etc/profile", "scratch"],
    ["/etc/environment", "scratch"],
  ])("%s → %s", (path, expected) => {
    expect(classifyWrite(path, ws.env)?.kind).toBe(expected as PathKind);
  });
  test.each([
    "/usr/local/bin/tool",
    "/tmp/x",
    "/opt/app/x",
    "src/a.ts",
    "~/notes.md",
    "/Library/Caches/x",
    "/var/tmp/x",
  ])("%s is open", (path) => {
    expect(classifyWrite(path, ws.env)).toBeUndefined();
  });
  test("a symlink to a critical file is caught by realpath", () => {
    symlinkSync("/etc/passwd", join(ws.root, "pw"));
    expect(classifyWrite(join(ws.root, "pw"), ws.env)?.kind).toBe("critical-file");
  });
});

describe("P8 garbage", () => {
  test.each(["", "   ", "-", "--"])("%j", (operand) => {
    expect(() => classifyTarget(operand, ws.env)).not.toThrow();
  });
  test("a non-string write path is undefined", () => {
    expect(classifyWrite(undefined as unknown as string, ws.env)).toBeUndefined();
  });
});
