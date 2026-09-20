// Reading what the model asks to publish, bounded to the project: the page,
// its supporting files (the tool's `files` and `root`), and the page `ask`
// generates when the model supplies questions instead of a file. The bound
// itself is here too, for every path either tool is given to read or write.

import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

import { type FileChange, isRefusal, planFiles } from "../../domain/files";
import type { FileUpload, SourceKind } from "../../domain/types";
import type { ArtifactParams } from "./schema";

export interface SourceFile {
  kind: SourceKind;
  source: string;
  /** Relative to the project, for the result line. */
  path: string;
}

/** A path the model named, resolved through its symlinks and refused when it leaves the project. */
export function insideProject(
  cwd: string,
  filePath: string,
  base = cwd,
): { real: string; rel: string } {
  const absolute = isAbsolute(filePath) ? filePath : resolve(base, filePath);
  if (!existsSync(absolute)) throw new Error(`file not found: ${filePath}`);
  const real = realpathSync(absolute);
  const root = realpathSync(cwd);
  const rel = relative(root, real);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(
      `${filePath} is outside the project (${root}); the artifact tools read and write only under it`,
    );
  }
  return { real, rel };
}

/**
 * A directory the model named to write into, which need not exist yet: the
 * part of it that does exist is resolved through its symlinks, and that is
 * what has to be inside the project.
 */
export function outputDirInside(cwd: string, dir: string): string {
  const absolute = isAbsolute(dir) ? dir : resolve(cwd, dir);
  let existing = absolute;
  while (!existsSync(existing)) existing = dirname(existing);
  const { real } = insideProject(cwd, existing);
  return join(real, relative(existing, absolute));
}

export function readSourceFile(cwd: string, filePath: string): SourceFile {
  const { real, rel } = insideProject(cwd, filePath);
  const ext = extname(real).toLowerCase();
  const kind: SourceKind | null =
    ext === ".html" || ext === ".htm" ? "html" : ext === ".md" ? "md" : null;
  if (!kind) throw new Error(`${filePath} must be .html, .htm, or .md`);
  return { kind, source: readFileSync(real, "utf8"), path: rel };
}

interface Entry {
  published: string;
  /** Null removes the published path. */
  source: string | null;
  contentType?: string;
}

function entries(files: NonNullable<ArtifactParams["files"]>): Entry[] {
  if (Array.isArray(files))
    return files.map((f) => ({ published: f.path, source: f.path, contentType: f.contentType }));
  return Object.entries(files).map(([published, value]) =>
    value === null || typeof value === "string"
      ? { published, source: value }
      : { published, source: value.from, contentType: value.contentType },
  );
}

/**
 * The tool's `files`, read and encoded for the wire. The rules are applied to
 * each source's size before a byte of it is read, so an oversized file is
 * refused here and never sent; the server applies them again to the whole
 * version, with the files it keeps.
 */
export function readPublishFiles(
  cwd: string,
  files: ArtifactParams["files"],
  root: string | undefined,
): Record<string, FileUpload | null> | undefined {
  if (!files) {
    if (root !== undefined) throw new Error("root is the base directory of files; pass files");
    return undefined;
  }
  const base = root === undefined ? cwd : insideProject(cwd, root).real;
  if (!statSync(base).isDirectory()) throw new Error(`root ${root} is not a directory`);
  const sources = new Map<string, string>();
  const changes: Record<string, FileChange | null> = {};
  for (const entry of entries(files)) {
    if (entry.source === null) {
      changes[entry.published] = null;
      continue;
    }
    const { real } = insideProject(cwd, entry.source, base);
    const stat = statSync(real);
    if (!stat.isFile()) throw new Error(`${entry.source} is not a file`);
    sources.set(entry.published, real);
    changes[entry.published] = { bytes: stat.size, contentType: entry.contentType };
  }
  const plan = planFiles({}, changes);
  if (isRefusal(plan)) throw new Error(plan.message);
  return Object.fromEntries(
    Object.entries(changes).map(([published, change]) => [
      published,
      change && {
        base64: readFileSync(sources.get(published) as string).toString("base64"),
        contentType: change.contentType,
      },
    ]),
  );
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** One column on the platform's ground, dark when the viewer or the system is: what a page must bring itself. */
const QUESTIONS_STYLE =
  'body{font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
  ".ask{max-width:760px;margin:0 auto;padding:40px 24px 64px}" +
  ".ask h1{font-size:1.75rem;line-height:1.2;margin:0 0 .8em}" +
  "@media (prefers-color-scheme:dark){:root:not([data-theme=light]){color-scheme:dark}:root:not([data-theme=light]) body{background:#1f1e1d;color:#f0eee6}}" +
  ":root[data-theme=dark]{color-scheme:dark}:root[data-theme=dark] body{background:#1f1e1d;color:#f0eee6}";

/** The page `ask` generates; the runtime renders the questions form into the marked element. */
export const questionsPage = (title: string): string =>
  `<title>${escapeHtml(title)}</title>\n<style>${QUESTIONS_STYLE}</style>\n` +
  `<main class="ask"><h1>${escapeHtml(title)}</h1>\n<div data-artifact-questions></div></main>`;
