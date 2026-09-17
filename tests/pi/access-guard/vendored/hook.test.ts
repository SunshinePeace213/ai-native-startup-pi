// vendored — the tool_call hook of .pi/extensions/access-guard, generated trees.
//
// V1  write/edit inside a vendored tree (node_modules, .venv, __pycache__, dist,
//     .git) or onto a lockfile → blocked; the reason names the segment and a way
//     forward; read of the same path passes
// V2  a bash command that rewrites content inside a vendored tree — redirect, tee,
//     sed -i, cp onto, mv into, a heredoc's redirect, tar -C — → blocked, the verb named
// V3  removing or moving a removable node as a whole (rm -rf dist, mv node_modules
//     ~/.Trash/x) passes; removing a file inside it, or the .git root, is blocked
// V4  a relative target after `cd`, one inside `sh -c`, and one reached through a
//     symlink to the tree → blocked through the resolved path; a heredoc body that
//     merely mentions a vendored path is not a target
// V5  a regular file named like an output dir (./build), a source path (src/build.ts),
//     an unterminated quote, and a program that writes on its own (bun install,
//     python x.py) → pass

import { describe, expect, test } from "bun:test";

import { guard } from "../fixture";

const BLOCKED: Array<[id: string, tool: string, input: Record<string, unknown>, names: string]> = [
  [
    "V1 edit inside node_modules",
    "edit",
    { path: "node_modules/pkg/index.js", edits: [] },
    "node_modules",
  ],
  [
    "V1 write a new file inside node_modules",
    "write",
    { path: "node_modules/pkg/patch.js", content: "" },
    "node_modules",
  ],
  [
    "V1 write into site-packages",
    "write",
    { path: ".venv/lib/python3.12/site-packages/x.py", content: "" },
    ".venv",
  ],
  [
    "V1 write into a global site-packages",
    "write",
    { path: "/usr/lib/python3/dist-packages/x.py", content: "" },
    "dist-packages",
  ],
  [
    "V1 write a pycache entry",
    "write",
    { path: "src/__pycache__/app.cpython-312.pyc", content: "" },
    "__pycache__",
  ],
  ["V1 edit build output", "edit", { path: "dist/out.js", edits: [] }, "dist"],
  ["V1 edit the lockfile", "edit", { path: "bun.lock", edits: [] }, "lockfile"],
  ["V1 write uv.lock", "write", { path: "uv.lock", content: "" }, "lockfile"],
  ["V1 edit .git/config", "edit", { path: ".git/config", edits: [] }, ".git"],
  ["V1 write a git hook by hand", "write", { path: ".git/hooks/pre-commit", content: "" }, ".git"],
  [
    "V1 absolute path into another checkout's node_modules",
    "write",
    { path: "/home/u/other/node_modules/x/i.js", content: "" },
    "node_modules",
  ],
  [
    "V2 bash redirect into node_modules",
    "bash",
    { command: "echo x > node_modules/pkg/index.js" },
    "redirect",
  ],
  [
    "V2 bash append into .venv",
    "bash",
    { command: "echo x >> .venv/lib/python3.12/site-packages/x.py" },
    "redirect",
  ],
  [
    "V2 bash tee in a pipeline",
    "bash",
    { command: "cat a | tee node_modules/pkg/index.js" },
    "tee",
  ],
  ["V2 bash sed -i", "bash", { command: "sed -i 's/a/b/' node_modules/pkg/index.js" }, "sed"],
  ["V2 bash cp onto", "bash", { command: "cp fix.js node_modules/pkg/index.js" }, "cp"],
  ["V2 bash mv into", "bash", { command: "mv fix.js node_modules/pkg/" }, "mv"],
  [
    "V2 bash heredoc redirect",
    "bash",
    { command: "cat <<EOF > node_modules/pkg/index.js\nx\nEOF" },
    "redirect",
  ],
  [
    "V2 bash tar -C into the tree",
    "bash",
    { command: "tar -xzf pkg.tgz -C node_modules/pkg" },
    "tar",
  ],
  ["V2 bash redirect onto the lockfile", "bash", { command: "printf '' > bun.lock" }, "bun.lock"],
  ["V3 bash rm a file inside dist", "bash", { command: "rm dist/out.js" }, "dist"],
  [
    "V3 bash rm a package inside node_modules",
    "bash",
    { command: "rm -r node_modules/pkg" },
    "node_modules",
  ],
  [
    "V3 bash mv a file out of node_modules",
    "bash",
    { command: "mv node_modules/pkg/index.js /tmp/x" },
    "node_modules",
  ],
  ["V3 bash rm -rf .git is never a regeneration", "bash", { command: "rm -rf .git" }, ".git"],
  [
    "V4 bash cd then relative redirect",
    "bash",
    { command: "cd node_modules/pkg && echo x > index.js" },
    "node_modules",
  ],
  [
    "V4 bash sh -c wrapper",
    "bash",
    { command: "sh -c 'echo x > node_modules/pkg/index.js'" },
    "node_modules",
  ],
  [
    "V4 write through a symlink to the tree",
    "write",
    { path: "deps/pkg/index.js", content: "" },
    "node_modules",
  ],
  [
    "V4 bash redirect through the symlink",
    "bash",
    { command: "echo x > deps/pkg/index.js" },
    "node_modules",
  ],
];

const OPEN: Array<[id: string, tool: string, input: Record<string, unknown>]> = [
  ["V1 read inside node_modules", "read", { path: "node_modules/pkg/index.js" }],
  ["V1 read the lockfile", "read", { path: "bun.lock" }],
  ["V1 grep inside node_modules", "grep", { pattern: "x", path: "node_modules/pkg" }],
  ["V1 write a source file", "write", { path: "src/new.ts", content: "" }],
  ["V2 bash cat from node_modules", "bash", { command: "cat node_modules/pkg/index.js" }],
  [
    "V2 bash cp out of node_modules",
    "bash",
    { command: "cp node_modules/pkg/index.js /tmp/copy.js" },
  ],
  ["V2 bash redirect into a source file", "bash", { command: "echo x > src/out.ts" }],
  ["V2 bash stderr dup is not a target", "bash", { command: "bun test 2>&1 | tail" }],
  ["V3 bash rm -rf dist", "bash", { command: "rm -rf dist" }],
  ["V3 bash rm -rf node_modules", "bash", { command: "rm -rf node_modules && bun install" }],
  [
    "V3 bash mv node_modules to the trash",
    "bash",
    { command: "mv node_modules ~/.Trash/node_modules-1" },
  ],
  ["V3 bash rm the lockfile to regenerate", "bash", { command: "rm bun.lock && bun install" }],
  [
    "V4 heredoc body mentioning a vendored path",
    "bash",
    { command: "cat <<EOF > README.md\nrun: echo hi > dist/out\nEOF" },
  ],
  ["V5 edit the build script", "edit", { path: "build", edits: [] }],
  ["V5 write a source file named build.ts", "write", { path: "src/build.ts", content: "" }],
  ["V5 unterminated quote", "bash", { command: "echo x > 'node_modules/pkg/index.js" }],
  ["V5 bun install", "bash", { command: "bun install" }],
  ["V5 bun patch is the sanctioned route", "bash", { command: "bun patch pkg" }],
  [
    "V5 a program writing on its own",
    "bash",
    { command: "python fix.py node_modules/pkg/index.js" },
  ],
  ["V5 git commit writes .git through git", "bash", { command: "git commit -m x" }],
];

describe("vendored blocks", () => {
  for (const [id, tool, input, names] of BLOCKED) {
    test(id, async () => {
      const verdict = await guard().call(tool, input);
      expect(verdict).toMatchObject({ block: true });
      expect(verdict?.reason).toContain(names);
    });
  }
});

describe("vendored passes", () => {
  for (const [id, tool, input] of OPEN) {
    test(id, async () => {
      expect(await guard().call(tool, input)).toBeUndefined();
    });
  }
});

describe("vendored guidance", () => {
  test("V1 the dependency denial points at the package manager, not the copy", async () => {
    const verdict = await guard().call("edit", { path: "node_modules/pkg/index.js", edits: [] });
    expect(verdict?.reason).toMatch(/pin|upgrade|patch/i);
    expect(verdict?.reason).toContain("/access-guard vendored off");
  });

  test("V1 the lockfile denial names the install command", async () => {
    const verdict = await guard().call("edit", { path: "bun.lock", edits: [] });
    expect(verdict?.reason).toMatch(/bun install|uv lock/);
  });

  test("V1 a nested cwd still resolves against the tree", async () => {
    const base = guard();
    const nested = guard(base.project.at("src"));
    const verdict = await nested.call("write", {
      path: "../node_modules/pkg/index.js",
      content: "",
    });
    expect(verdict).toMatchObject({ block: true });
  });
});
