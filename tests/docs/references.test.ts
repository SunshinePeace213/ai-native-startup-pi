// D1 local file/heading links in the instruction/reference docs → resolve or fail with location.
// D2 external links and fenced examples → never fetched/executed; real local links remain checked.
// D3 escaped/symlink-outside targets → refused without reading their contents.
import { expect, test } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";

function prose(text: string): string {
  let fence = "";
  return text
    .split(/\r?\n/)
    .map((line) => {
      const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
      if (marker) {
        if (!fence) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = "";
        return "";
      }
      return fence ? "" : line;
    })
    .join("\n");
}
function anchors(text: string): Set<string> {
  const result = new Set<string>();
  const counts = new Map<string, number>();
  for (const match of prose(text).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const base = match[1]!
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/[^\p{L}\p{N}_\-\s]/gu, "")
      .trim()
      .replace(/\s/g, "-");
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    result.add(base + (count ? `-${count}` : ""));
  }
  return result;
}
function inspect(file: string, root: string): string[] {
  const failures: string[] = [];
  const text = prose(readFileSync(file, "utf8"));
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const link = match[1]!;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link)) continue;
    try {
      const [path, fragment] = link.split("#");
      const target = path ? resolve(dirname(file), decodeURIComponent(path)) : file;
      if (!existsSync(target)) {
        failures.push(`${file}: missing ${link}`);
        continue;
      }
      const rel = relative(root, realpathSync(target));
      if (rel === ".." || rel.startsWith(`..${sep}`)) {
        failures.push(`${file}: outside repository ${link}`);
        continue;
      }
      // The KB is not crawled or opened by a docs check, even for heading links.
      if (
        fragment &&
        target.endsWith(".md") &&
        (rel.startsWith(`docs${sep}`) || ["AGENTS.md", "ARCHITECTURE.md"].includes(rel)) &&
        !anchors(readFileSync(target, "utf8")).has(decodeURIComponent(fragment))
      )
        failures.push(`${file}: missing heading ${link}`);
    } catch (error) {
      failures.push(`${file}: invalid ${link}: ${String(error)}`);
    }
  }
  return failures;
}

test("D1 repository instruction and reference links resolve", () => {
  const root = resolve(".");
  const files = [join(root, "AGENTS.md"), join(root, "ARCHITECTURE.md")];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(file);
    }
  }
  walk(join(root, "docs"));
  expect(files.flatMap((file) => inspect(file, root))).toEqual([]);
});

test("D1/D2 local errors fail while external URLs and fenced examples are not visited", () => {
  const root = mkdtempSync(join(tmpdir(), "architecture-docs-test-"));
  const file = join(root, "AGENTS.md");
  writeFileSync(
    file,
    "# Topic\n[valid](#topic)\n[external](https://unreachable.invalid/foo)\n```sh\n[example](missing.md)\n```\n",
  );
  expect(inspect(file, root)).toEqual([]);
  writeFileSync(file, "# Topic\n[bad](#missing)\n[bad-file](missing.md)\n");
  expect(inspect(file, root)).toHaveLength(2);
});

test("D3 an outside symlink is refused instead of inspected", () => {
  const root = mkdtempSync(join(tmpdir(), "architecture-docs-test-"));
  const outside = mkdtempSync(join(tmpdir(), "architecture-docs-outside-"));
  writeFileSync(join(outside, "source.md"), "Not a repository reference");
  symlinkSync(join(outside, "source.md"), join(root, "link.md"));
  const file = join(root, "AGENTS.md");
  writeFileSync(file, "[outside](link.md#anything)");
  expect(inspect(file, root)[0]).toContain("outside repository");
});
