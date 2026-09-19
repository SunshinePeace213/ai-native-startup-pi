// Reading the file the model asks to publish, bounded to the project, and the
// page `ask` generates when the model supplies questions instead of a file.

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { extname, isAbsolute, relative, resolve } from "node:path";

import type { SourceKind } from "../../shared/types";

export interface SourceFile {
  kind: SourceKind;
  source: string;
  /** Relative to the project, for the result line. */
  path: string;
}

export function readSourceFile(cwd: string, filePath: string): SourceFile {
  const absolute = isAbsolute(filePath) ? filePath : resolve(cwd, filePath);
  if (!existsSync(absolute)) throw new Error(`file not found: ${filePath}`);
  const real = realpathSync(absolute);
  const root = realpathSync(cwd);
  const rel = relative(root, real);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(
      `${filePath} is outside the project (${root}); artifacts publish only files under it`,
    );
  }
  const ext = extname(real).toLowerCase();
  const kind: SourceKind | null =
    ext === ".html" || ext === ".htm" ? "html" : ext === ".md" ? "md" : null;
  if (!kind) throw new Error(`${filePath} must be .html, .htm, or .md`);
  return { kind, source: readFileSync(real, "utf8"), path: rel };
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The runtime renders the questions form into the marked element. */
export const questionsPage = (title: string): string =>
  `<h1>${escapeHtml(title)}</h1>\n<div data-artifact-questions></div>`;
