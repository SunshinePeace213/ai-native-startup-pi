// sensitive — the tool_call hook of .pi/extensions/access-guard, secret-bearing files.
//
// S1  read/write/edit naming a cataloged basename (.env, id_rsa, *.pem, *.tfstate,
//     master.key) → blocked; the reason names the category and the standing policy
// S2  a path under a cataloged directory (~/.aws/, ~/.ssh/, ~/.pi/agent/auth.json) →
//     blocked for read, ls, grep, and find alike; the directory itself counts, a
//     look-alike (/.awsome/, /etc/shadowy) does not
// S3  a template name (.env.sample) passes — unless it is a symlink to a live secret
//     or sits inside a cataloged directory
// S4  a bash command referencing a cataloged file as its own token — inside quotes or
//     an interpreter one-liner too — → blocked; a longer name (.environment), a token
//     that merely contains the fragment (data.aws/), or a template passes
// S5  a grep glob or find pattern clearly targeting a cataloged family (.env*,
//     secrets.*, id_r[s]a*) → blocked; a broad glob (*.ts, **/*.md, src/**) passes
// S6  the env denial names a readable template beside the target or at the project
//     root when one exists — never a template-named alias of a live secret — else
//     says to ask the user
// S7  `/access-guard vendored off` leaves every sensitive denial in force
// S8  a non-string path, a missing field, an unknown tool, or an input whose reading
//     throws → passes, the last one with a visible warning (fail open)

import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { guard } from "../fixture";

const BLOCKED: Array<[id: string, tool: string, input: Record<string, unknown>, names: string]> = [
  ["S1 read .env", "read", { path: ".env" }, "Environment files"],
  ["S1 write .env", "write", { path: ".env", content: "" }, "Environment files"],
  ["S1 edit .envrc", "edit", { path: ".envrc", edits: [] }, "Environment files"],
  ["S1 read an ssh key by name", "read", { path: "/srv/keys/id_rsa" }, "SSH & auth keys"],
  ["S1 read a pem", "read", { path: "certs/server.pem" }, "Certificates"],
  ["S1 read terraform state", "read", { path: "infra/prod.tfstate" }, "CI/CD"],
  [
    "S1 read master.key reports the literal's family",
    "read",
    { path: "config/master.key" },
    "Framework",
  ],
  ["S1 write a sqlite db", "write", { path: "data/app.sqlite", content: "" }, "Database"],
  ["S2 read under ~/.aws", "read", { path: "/home/u/.aws/credentials" }, "Cloud provider"],
  ["S2 ls the ~/.ssh directory itself", "ls", { path: "/home/u/.ssh" }, "SSH"],
  [
    "S2 grep with path inside ~/.kube",
    "grep",
    { pattern: "token", path: "/home/u/.kube" },
    "Cloud",
  ],
  ["S2 find under ~/.gnupg", "find", { pattern: "*", path: "/home/u/.gnupg" }, "Certificates"],
  ["S2 read Pi's own auth store", "read", { path: "~/.pi/agent/auth.json" }, "AI-tool auth"],
  [
    "S2 read cargo's current credentials name",
    "read",
    { path: "/home/u/.cargo/credentials.toml" },
    "Package-manager",
  ],
  [
    "S3 a template-named symlink to a live secret",
    "read",
    { path: ".env.example" },
    "Environment files",
  ],
  [
    "S3 a template inside a cataloged directory",
    "read",
    { path: "/home/u/.aws/.env.example" },
    "Cloud provider",
  ],
  ["S4 bash cat .env", "bash", { command: "cat .env" }, "Environment files"],
  ["S4 bash quoted path", "bash", { command: `cat "$HOME/.ssh/id_ed25519"` }, "SSH"],
  [
    "S4 bash interpreter one-liner",
    "bash",
    { command: `python -c "open('.env').read()"` },
    "Environment files",
  ],
  ["S4 bash env assignment", "bash", { command: "FOO=.env bun run x" }, "Environment files"],
  ["S4 bash relative dot-directory", "bash", { command: "cat .aws/credentials" }, "Cloud provider"],
  ["S4 bash ls the directory itself", "bash", { command: "ls ~/.ssh" }, "SSH"],
  ["S4 bash /etc/shadow", "bash", { command: "sudo cat /etc/shadow" }, "Browser & OS"],
  ["S5 grep glob .env*", "grep", { pattern: "KEY", glob: ".env*" }, "Environment files"],
  ["S5 grep glob secrets.*", "grep", { pattern: "x", glob: "**/secrets.*" }, "Framework"],
  ["S5 find with a character class", "find", { pattern: "id_r[s]a*" }, "SSH"],
  ["S5 find suffix-anchored core", "find", { pattern: "secret.p*m*" }, "Certificates"],
];

const OPEN: Array<[id: string, tool: string, input: Record<string, unknown>]> = [
  ["S1 read a source file", "read", { path: "src/app.ts" }],
  ["S1 write a source file", "write", { path: "src/new.ts", content: "" }],
  ["S1 read a .envy file (longer name)", "read", { path: "notes/.envy" }],
  ["S2 a look-alike directory", "read", { path: "/home/u/.awsome/notes.txt" }],
  ["S2 a look-alike file", "read", { path: "/etc/shadowy" }],
  ["S2 ls the project root", "ls", { path: "." }],
  ["S2 grep over the project", "grep", { pattern: "TODO", path: "." }],
  ["S3 read the sample template", "read", { path: ".env.sample" }],
  ["S3 edit the sample template", "edit", { path: ".env.sample", edits: [] }],
  ["S4 bash cat the template", "bash", { command: "cat .env.example" }],
  ["S4 bash a longer name", "bash", { command: "cat .environment" }],
  ["S4 bash a token containing the fragment", "bash", { command: "cat data.aws/file" }],
  ["S4 bash an ordinary command", "bash", { command: "bun run check 2>&1 | tail" }],
  ["S4 bash git status", "bash", { command: "git status --short" }],
  ["S5 grep broad glob", "grep", { pattern: "x", glob: "*.ts" }],
  ["S5 find broad pattern", "find", { pattern: "**/*.md" }],
  ["S5 find a directory sweep", "find", { pattern: "src/**" }],
  ["S5 grep glob exact template", "grep", { pattern: "x", glob: ".env.example" }],
  ["S5 grep glob README*", "grep", { pattern: "x", glob: "README*" }],
  ["S8 non-string path", "read", { path: 42 }],
  ["S8 missing path", "read", {}],
  ["S8 unknown tool", "fetch_content", { url: "file:///home/u/.ssh/id_rsa" }],
];

describe("sensitive blocks", () => {
  for (const [id, tool, input, names] of BLOCKED) {
    test(id, async () => {
      const verdict = await guard().call(tool, input);
      expect(verdict).toMatchObject({ block: true });
      expect(verdict?.reason).toContain(names);
      expect(verdict?.reason).toContain("Policy:");
    });
  }
});

describe("sensitive passes", () => {
  for (const [id, tool, input] of OPEN) {
    test(id, async () => {
      expect(await guard().call(tool, input)).toBeUndefined();
    });
  }
});

describe("sensitive guidance and toggles", () => {
  test("S6 the env denial names the readable template at the project root, not the alias", async () => {
    const g = guard();
    const verdict = await g.call("read", { path: ".env" });
    expect(verdict?.reason).toContain(g.project.at(".env.sample"));
    expect(verdict?.reason).not.toContain(".env.example");
  });

  test("S6 the env denial names the template beside the target first", async () => {
    const g = guard();
    await Bun.write(g.project.at("notes/.env.template"), "");
    await Bun.write(g.project.at("notes/.env"), "X=1");
    const verdict = await g.call("read", { path: "notes/.env" });
    expect(verdict?.reason).toContain(g.project.at("notes/.env.template"));
  });

  test("S6 without a template anywhere the denial says to ask the user", async () => {
    const bare = mkdtempSync(join(tmpdir(), "access-guard-bare-"));
    const verdict = await guard(bare).call("read", { path: "/srv/elsewhere/.env" });
    expect(verdict?.reason).toContain("no template found");
  });

  test("S7 vendored off leaves the sensitive guard in force", async () => {
    const g = guard();
    await g.command("vendored off");
    expect(await g.call("read", { path: ".env" })).toMatchObject({ block: true });
    expect(await g.call("bash", { command: "cat ~/.aws/credentials" })).toMatchObject({
      block: true,
    });
  });

  test("S7 asking to turn sensitive off is refused", async () => {
    const g = guard();
    await g.command("sensitive off");
    expect(g.ctx.notifications.some((n) => n.type === "warning")).toBe(true);
    expect(await g.call("read", { path: ".env" })).toMatchObject({ block: true });
  });

  test("S8 an input whose reading throws passes with a warning", async () => {
    const g = guard();
    const input = {
      get path(): string {
        throw new Error("boom");
      },
    };
    expect(await g.call("read", input)).toBeUndefined();
    expect(
      g.ctx.notifications.some((n) => n.type === "warning" && n.message.includes("boom")),
    ).toBe(true);
  });
});
