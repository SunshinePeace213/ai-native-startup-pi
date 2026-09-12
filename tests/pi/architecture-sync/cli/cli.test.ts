// C1 --print/check are read-only; stale checks exit 1; --write repairs and check then passes.
// C2 malformed input, Git failures and invalid documents exit nonzero without partial writes.
// C3 explicit --root and nested cwd target that checkout, never the CLI's source checkout.
import { expect, test } from "bun:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { fixture } from "../fixture";

const run = promisify(execFile);
const CLI = resolve(".pi/extensions/architecture-sync/cli.ts");
async function cli(cwd: string, ...args: string[]) {
  try {
    const result = await run(process.execPath, [CLI, ...args], {
      cwd,
      timeout: 10_000,
      encoding: "utf8",
    });
    return { ...result, code: 0 };
  } catch (error) {
    const result = error as { stdout: string; stderr: string; code: number };
    return { stdout: result.stdout, stderr: result.stderr, code: result.code };
  }
}

test("C1 print/check never mutate and write is followed by a clean check", async () => {
  const f = fixture(),
    before = f.read();
  expect((await cli(f.root, "--print")).stdout).toContain("src/ — Application source");
  const stale = await cli(f.root, "--check");
  expect(stale.code).toBe(1);
  expect(stale.stderr).toContain("architecture:sync");
  expect(f.read()).toBe(before);
  expect((await cli(f.root, "--write")).code).toBe(0);
  expect((await cli(f.root, "--check")).code).toBe(0);
});

for (const args of [[], ["--write", "--check"], ["--unknown"], ["--root"]])
  test(`C2 invalid args ${args.join(" ")} do not change the document`, async () => {
    const f = fixture(),
      before = f.read();
    expect((await cli(f.root, ...args)).code).toBe(2);
    expect(f.read()).toBe(before);
  });

test("C2 invalid markers are a failure, not a successful repair", async () => {
  const f = fixture();
  f.put("ARCHITECTURE.md", "Manual document without markers\n");
  expect((await cli(f.root, "--write")).code).toBe(2);
  expect(f.read()).toBe("Manual document without markers\n");
});

test("C3 --root overrides cwd and nested cwd resolves correctly", async () => {
  const f = fixture(),
    g = fixture(),
    original = f.read();
  expect((await cli(f.root, "--write", "--root", g.root)).code).toBe(0);
  expect(f.read()).toBe(original);
  expect(g.read()).not.toBe(original);
  expect((await cli(`${g.root}/src/api`, "--check")).code).toBe(0);
});
