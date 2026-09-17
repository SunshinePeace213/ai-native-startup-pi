// What both tools do with the rows they collected: the same byte cap Pi's own
// tools apply, the notices the model reads to widen or narrow the next call,
// and the `./` prefix a `.` search root would otherwise put on every row.

import {
  DEFAULT_MAX_BYTES,
  formatSize,
  type TruncationResult,
  truncateHead,
} from "@earendil-works/pi-coding-agent";

/** Paths as the model will pass them back to `read`: never `./src/x.ts`. */
export function tidyPath(path: string): string {
  return path.startsWith("./") ? path.slice(2) : path;
}

/** A leading `@` is a model habit, not part of any path. */
export function cleanPath(path: string | undefined): string | undefined {
  const trimmed = path?.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

/** Does `path` point at or inside a `.git` directory? Then `.git` must not be excluded. */
export function insideGitDir(path: string | undefined): boolean {
  return path !== undefined && /(^|\/)\.git(\/|$)/.test(path);
}

export interface Finished {
  text: string;
  truncation: TruncationResult | undefined;
}

/** Join the rows, cap the bytes, and append the notices in one bracket. */
export function finish(rows: string[], notices: string[]): Finished {
  const truncation = truncateHead(rows.join("\n"), { maxLines: Number.MAX_SAFE_INTEGER });
  const all = [...notices];
  if (truncation.truncated) all.push(`${formatSize(DEFAULT_MAX_BYTES)} limit reached`);
  const text = all.length ? `${truncation.content}\n\n[${all.join(". ")}]` : truncation.content;
  return { text, truncation: truncation.truncated ? truncation : undefined };
}
