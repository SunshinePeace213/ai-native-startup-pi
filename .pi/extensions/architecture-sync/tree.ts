// Shared by the Pi lifecycle adapter and the Bun CLI. No model calls, file-content
// discovery, staging, or KB writes. Git supplies path metadata; config supplies meaning.
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, realpath, rename, rmdir, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const CONFIG = ".pi/extensions/architecture-sync/tree.config.json";
export const DOCUMENT = "ARCHITECTURE.md";
const START = "<!-- architecture-tree:start -->";
const END = "<!-- architecture-tree:end -->";
const MAX_DOCUMENT_BYTES = 256 * 1024;
const BLOCKED_PARTS = new Set([
  ".git",
  "node_modules",
  ".venv",
  "__pycache__",
  ".pytest_cache",
  ".ruff_cache",
  ".qmd",
  ".cache",
  "dist",
  "coverage",
  ".env",
  ".envrc",
  ".obsidian",
]);
const BLOCKED_PREFIXES = ["llm-wiki/private", ".pi/subagents", ".pi/agent-sessions"];
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export type Exec = (command: string, args: string[]) => Promise<string>;
export const exec: Exec = async (command, args) => {
  const result = await run(command, args, {
    timeout: 5_000,
    maxBuffer: 16 * 1024 * 1024,
    encoding: "utf8",
  });
  return result.stdout;
};

interface Config {
  name: string;
  depth: number;
  collapsed: string[];
  files: string[];
  descriptions: Record<string, string>;
}
export interface Snapshot {
  root: string;
  tree: string;
  missingDescriptions: string[];
}
export interface Result extends Snapshot {
  changed: boolean;
}

function safePath(path: string): boolean {
  return (
    !!path &&
    !isAbsolute(path) &&
    !path.includes("\\") &&
    !/[\x00-\x1f\x7f`]/.test(path) &&
    path.split("/").every((part) => !!part && part !== "." && part !== "..")
  );
}
function excluded(path: string): boolean {
  return (
    !safePath(path) ||
    path
      .split("/")
      .some(
        (part) => BLOCKED_PARTS.has(part) || (part.startsWith(".env.") && part !== ".env.sample"),
      ) ||
    BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  );
}
function oneLine(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 160 &&
    !/[\x00-\x1f\x7f`]/.test(value)
  );
}
function configFrom(value: unknown): Config {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid architecture config");
  const c = value as Record<string, unknown>;
  if (
    !oneLine(c.name) ||
    c.name.includes("/") ||
    c.name.includes("\\") ||
    !Number.isInteger(c.depth) ||
    Number(c.depth) < 1 ||
    Number(c.depth) > 6
  )
    throw new Error("Architecture config requires a name and depth from 1 to 6");
  for (const key of ["collapsed", "files"])
    if (
      !Array.isArray(c[key]) ||
      !(c[key] as unknown[]).every((p) => typeof p === "string" && safePath(p))
    )
      throw new Error(`Architecture config ${key} must contain repository-relative paths`);
  if (
    !c.descriptions ||
    typeof c.descriptions !== "object" ||
    Array.isArray(c.descriptions) ||
    !Object.entries(c.descriptions).every(([p, text]) => safePath(p) && oneLine(text))
  )
    throw new Error("Architecture descriptions must map paths to short single-line text");
  return c as unknown as Config;
}

export async function findRoot(cwd: string, execute: Exec = exec): Promise<string> {
  return realpath(
    (await execute("git", ["-C", resolve(cwd), "rev-parse", "--show-toplevel"])).trim(),
  );
}

// Reject symlink ancestors too: checking only the leaf would still read or write
// through a linked .pi/ directory. All missing/symlinked inventory paths are omitted.
async function ordinaryPath(root: string, path: string): Promise<boolean> {
  let current = root;
  try {
    for (const part of path.split("/")) {
      current = join(current, part);
      if ((await lstat(current)).isSymbolicLink()) return false;
    }
    return true;
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return false;
    throw error;
  }
}
async function loadConfig(root: string): Promise<Config> {
  if (!(await ordinaryPath(root, CONFIG))) throw new Error(`Missing or symlinked ${CONFIG}`);
  const path = join(root, CONFIG);
  const stat = await lstat(path);
  if (!stat.isFile() || stat.size > MAX_DOCUMENT_BYTES)
    throw new Error("Architecture config must be a regular file under 256 KiB");
  return configFrom(JSON.parse(await readFile(path, "utf8")));
}

export async function capture(cwd: string, execute: Exec = exec): Promise<Snapshot> {
  const root = await findRoot(cwd, execute);
  const config = await loadConfig(root);
  const listing = await execute("git", [
    "-C",
    root,
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ]);
  if (listing && !listing.endsWith("\0"))
    throw new Error("Incomplete Git path inventory; refusing to generate a partial map");
  const entries = new Map<string, boolean>(); // true = directory
  for (const path of new Set(listing.split("\0").filter(Boolean))) {
    if (excluded(path)) continue;
    // Path metadata only; never read source/KB contents to guess descriptions.
    if (!(await ordinaryPath(root, path))) continue;
    const isDir = (await lstat(join(root, path))).isDirectory();
    const parts = path.split("/");
    const levels = Math.min(config.depth, parts.length - (isDir ? 0 : 1));
    for (let depth = 1; depth <= levels; depth++) {
      const parent = parts.slice(0, depth).join("/");
      entries.set(parent, true);
      if (config.collapsed.includes(parent)) break;
    }
    if (
      !isDir &&
      config.files.includes(path) &&
      parts.length <= config.depth &&
      !config.collapsed.some((p) => path.startsWith(`${p}/`))
    )
      entries.set(path, false);
  }
  const children = new Map<string, string[]>();
  for (const path of entries.keys()) {
    const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    children.set(parent, [...(children.get(parent) ?? []), path]);
  }
  const lines = ["```text", `${config.name}/`];
  const missingDescriptions: string[] = [];
  function walk(parent: string, prefix: string) {
    const paths = (children.get(parent) ?? []).sort(
      (a, b) => Number(entries.get(b)) - Number(entries.get(a)) || compare(a, b),
    );
    paths.forEach((path, i) => {
      const last = i === paths.length - 1;
      const directory = entries.get(path);
      const name = path.slice(path.lastIndexOf("/") + 1);
      let description = Object.hasOwn(config.descriptions, path)
        ? config.descriptions[path]
        : undefined;
      if (directory && !description) {
        description = "Purpose not documented yet";
        missingDescriptions.push(path);
      }
      lines.push(
        `${prefix}${last ? "└── " : "├── "}${name}${directory ? "/" : ""}${description ? ` — ${description}` : ""}`,
      );
      if (directory) walk(path, prefix + (last ? "    " : "│   "));
    });
  }
  walk("", "");
  lines.push("```");
  return { root, tree: lines.join("\n"), missingDescriptions };
}

async function readDocument(root: string): Promise<string> {
  if (!(await ordinaryPath(root, DOCUMENT))) throw new Error(`Missing or symlinked ${DOCUMENT}`);
  const path = join(root, DOCUMENT);
  const stat = await lstat(path);
  if (!stat.isFile() || stat.size > MAX_DOCUMENT_BYTES)
    throw new Error(`${DOCUMENT} must be a regular file under 256 KiB`);
  return readFile(path, "utf8");
}
function replaceTree(text: string, tree: string): string {
  if (/^(<<<<<<<|=======|>>>>>>>)(?: |\r?$)/m.test(text))
    throw new Error(`${DOCUMENT} has merge-conflict markers`);
  const lines = text.match(/[^\n]*(?:\n|$)/g) ?? [];
  let offset = 0;
  const starts: number[] = [],
    ends: number[] = [];
  for (const line of lines) {
    const content = line.replace(/\r?\n$/, "");
    if (content === START) starts.push(offset + line.length);
    if (content === END) ends.push(offset);
    offset += line.length;
  }
  const start = starts[0],
    end = ends[0];
  if (
    starts.length !== 1 ||
    ends.length !== 1 ||
    start === undefined ||
    end === undefined ||
    start >= end
  )
    throw new Error(`${DOCUMENT} requires exactly one ordered architecture-tree marker pair`);
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  return text.slice(0, start) + tree.replaceAll("\n", newline) + newline + text.slice(end);
}

export async function architecture(
  cwd: string,
  mode: "print" | "check" | "write",
  execute: Exec = exec,
  allowed: () => boolean = () => true,
): Promise<Result> {
  const root = await findRoot(cwd, execute);
  if (mode !== "write") {
    const snapshot = await capture(root, execute);
    if (mode === "print") return { ...snapshot, changed: false };
    const before = await readDocument(root);
    return { ...snapshot, changed: replaceTree(before, snapshot.tree) !== before };
  }
  const lockName = (
    await execute("git", ["-C", root, "rev-parse", "--git-path", "architecture-sync.lock"])
  ).trim();
  const lock = resolve(root, lockName);
  // Git's per-worktree administrative directory also works when .git is a file.
  try {
    await mkdir(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new Error("Architecture sync lock is held; finish the other writer before retrying");
    throw error;
  }
  let temporary: string | undefined;
  try {
    const snapshot = await capture(root, execute);
    if (!allowed()) throw new Error("Architecture sync cancelled before writing");
    const before = await readDocument(root);
    const next = replaceTree(before, snapshot.tree);
    if (next === before) return { ...snapshot, changed: false };
    const doc = join(root, DOCUMENT);
    const canonical = await realpath(doc);
    if (relative(root, canonical).startsWith(`..${sep}`) || dirname(canonical) !== root)
      throw new Error("Architecture target escaped the checkout");
    temporary = join(root, `.architecture-sync-${randomUUID()}.tmp`);
    const handle = await open(temporary, "wx", (await lstat(doc)).mode & 0o777);
    try {
      await handle.writeFile(next, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    if ((await readDocument(root)) !== before)
      throw new Error(`${DOCUMENT} changed concurrently; retry after its editor finishes`);
    if (!allowed()) throw new Error("Architecture sync cancelled before replacement");
    await rename(temporary, doc);
    temporary = undefined;
    return { ...snapshot, changed: true };
  } finally {
    if (temporary) await unlink(temporary);
    await rmdir(lock);
  }
}
