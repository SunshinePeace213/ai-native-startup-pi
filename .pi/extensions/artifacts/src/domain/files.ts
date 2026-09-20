// The rules for an artifact's supporting files — the stylesheets, scripts,
// data and images published beside its page and served under the same frame
// path, so the page reaches them by a relative URL. They are Claude Code's:
// a published path is relative and stays inside the artifact; two names at
// the root are the platform's; a file's media type comes from its path's
// extension for the common web types and must be stated otherwise; a text
// file holds at most 16 MiB, a binary one 15 MiB, a version 255 files and
// 64 MiB of them. A publish names only what changes: a path it leaves out is
// kept, `null` removes one; on an artifact made from a type, the paths it came
// with are read-only. Pure, so both processes apply the same rules — the pi
// side before it reads a byte, the server before it writes one.

import type { FileMap } from "./types";

const MIB = 1024 * 1024;

export const MAX_FILE_ENTRIES = 255;
export const MAX_TEXT_FILE_BYTES = 16 * MIB;
export const MAX_BINARY_FILE_BYTES = 15 * MIB;
export const MAX_VERSION_FILE_BYTES = 64 * MIB;
export const MAX_PUBLISHED_PATH = 512;
/** A text file this small is handed to the model inline; a larger one by size and type. */
export const INLINE_TEXT_BYTES = 64 * 1024;

/** At the artifact's root these are the platform's: the page itself, and Claude Code's update hook. */
export const RESERVED_PATHS: readonly string[] = ["index.html", "preflight.js"];

/** The extensions whose media type needs no stating: Claude Code's list. */
const TYPE_BY_EXTENSION: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  webmanifest: "application/manifest+json",
  txt: "text/plain",
  md: "text/markdown",
  xml: "application/xml",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  wasm: "application/wasm",
};

const TOKEN = "[a-z0-9][a-z0-9!#$&^_.+-]{0,126}";
const BARE_TYPE_RE = new RegExp(`^(${TOKEN})/(${TOKEN})$`);
const SERVABLE_FAMILIES: readonly string[] = ["text", "image", "audio", "video", "font", "model"];
const SERVABLE_APPLICATIONS: readonly string[] = [
  "json",
  "javascript",
  "xml",
  "pdf",
  "wasm",
  "zip",
  "gzip",
  "octet-stream",
];
const STRUCTURED_SUFFIX_RE = /\+(json|xml)$/;
const TEXT_APPLICATIONS: readonly string[] = ["json", "javascript", "xml"];

/** A bare `type/subtype` a browser can be served: no parameters, no multipart, nothing exotic. */
export function isServableType(type: string): boolean {
  const m = BARE_TYPE_RE.exec(type);
  if (!m) return false;
  const family = m[1] as string;
  const subtype = m[2] as string;
  if (SERVABLE_FAMILIES.includes(family)) return true;
  return (
    family === "application" &&
    (SERVABLE_APPLICATIONS.includes(subtype) || STRUCTURED_SUFFIX_RE.test(subtype))
  );
}

/** Whether a type holds UTF-8 text: what a page may publish as a string, and what is served with a charset. */
export function isTextType(type: string): boolean {
  const [family, subtype = ""] = type.split("/");
  if (family === "text") return true;
  if (family === "image") return subtype === "svg+xml";
  return (
    family === "application" &&
    (TEXT_APPLICATIONS.includes(subtype) || STRUCTURED_SUFFIX_RE.test(subtype))
  );
}

/** The media type a published path's extension implies, or null when it must be stated. */
export function typeFromPath(path: string): string | null {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return null;
  const extension = name.slice(dot + 1).toLowerCase();
  return Object.hasOwn(TYPE_BY_EXTENSION, extension)
    ? (TYPE_BY_EXTENSION[extension] as string)
    : null;
}

// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\x00-\x1f\x7f]/;

/** Why a published path is refused, or null when it is one. */
export function pathProblem(path: string): string | null {
  const name = JSON.stringify(path);
  if (!path) return "a published path cannot be empty";
  if (path.length > MAX_PUBLISHED_PATH)
    return `a published path is at most ${MAX_PUBLISHED_PATH} characters`;
  if (path.startsWith("/"))
    return `${name} has a leading slash; a published path is relative to the page`;
  if (path.includes("\\")) return `${name} has a backslash; a published path uses forward slashes`;
  if (CONTROL_RE.test(path)) return `${name} has a control character`;
  const segments = path.split("/");
  if (segments.includes("..") || segments.includes("."))
    return `${name} has a "." or ".." segment; a published path stays inside the artifact`;
  if (segments.includes("")) return `${name} has an empty segment`;
  if (RESERVED_PATHS.includes(path))
    return `${name} is reserved: index.html is the page itself (publish it with file_path) and preflight.js is the platform's`;
  return null;
}

/** What one file of a publish is, before its bytes matter: its size, and its type when stated. */
export interface FileChange {
  bytes: number;
  contentType?: string;
}

/** Why a set of files is refused, in the codes a page's own publish distinguishes. */
export interface FileRefusal {
  code: "invalid_content" | "too_large" | "read_only_path";
  message: string;
}

/** What a publish does to the files of the version before it. */
export interface FilePlan {
  /** Carried over as they are. */
  kept: FileMap;
  /** The media type each path named with content is stored under. */
  written: Record<string, string>;
  /** Paths the version before had and this one drops. */
  removed: string[];
}

export const isRefusal = (result: object): result is FileRefusal => "code" in result;

/** A precondition that no longer holds: the hash a write expected to replace, and the file's hash now (null: no such file). */
export interface ConflictPath {
  path: string;
  expected: string | null;
  actual: string | null;
}

/** A file that differs between two versions: its hash now, or null when it is gone. */
export interface ChangedFile {
  path: string;
  sha256: string | null;
}

const hashAt = (files: FileMap, path: string): string | null =>
  Object.hasOwn(files, path) ? (files[path] as FileMap[string]).sha256 : null;

/**
 * A page's per-file preconditions against the files there now. A pin is the
 * sha256 of the copy the write replaces, or null when the write creates the
 * file; the ones that fail come back with what is really there.
 */
export function failedPreconditions(
  current: FileMap,
  pins: Record<string, string | null>,
): ConflictPath[] {
  return Object.entries(pins)
    .map(([path, expected]) => ({ path, expected, actual: hashAt(current, path) }))
    .filter((pin) => pin.expected !== pin.actual);
}

/** What other writers did between two versions: every path outside `except` whose content differs or is gone. */
export function changedFiles(base: FileMap, current: FileMap, except: string[]): ChangedFile[] {
  return [...new Set([...Object.keys(base), ...Object.keys(current)])]
    .filter((path) => !except.includes(path) && hashAt(base, path) !== hashAt(current, path))
    .sort()
    .map((path) => ({ path, sha256: hashAt(current, path) }));
}

const mib = (bytes: number) => `${(bytes / MIB).toFixed(1)} MiB`;

/**
 * Lays a publish's changes over the current files: named paths are added or
 * replaced, `null` removes one (a path that is not there stays not there),
 * every other path is kept. Refused as a whole, with the first reason, when
 * a path, a type, a size or the resulting set breaks a rule — or when a path
 * is one of `readOnly`, the paths an artifact made from a type keeps as the
 * type's: its page among them, which no files publish ever names.
 */
export function planFiles(
  current: FileMap,
  changes: Record<string, FileChange | null>,
  readOnly: readonly string[] = [],
): FilePlan | FileRefusal {
  const kept: FileMap = { ...current };
  const written: Record<string, string> = {};
  const removed: string[] = [];
  let writtenBytes = 0;
  const fixed = Object.keys(changes).filter((path) => readOnly.includes(path));
  if (fixed.length) {
    return {
      code: "read_only_path",
      message: `${fixed.map((path) => JSON.stringify(path)).join(", ")} ${fixed.length === 1 ? "is" : "are"} the type's, and read-only on an artifact made from a type; nothing was published — drop ${fixed.length === 1 ? "that path" : "those paths"} and publish the rest`,
    };
  }
  for (const [path, change] of Object.entries(changes)) {
    const problem = pathProblem(path);
    if (problem) return { code: "invalid_content", message: problem };
    if (Object.hasOwn(kept, path)) {
      delete kept[path];
      if (change === null) removed.push(path);
    }
    if (change === null) continue;
    const type = change.contentType ?? typeFromPath(path);
    if (!type) {
      return {
        code: "invalid_content",
        message: `${JSON.stringify(path)} has no extension this platform knows; state its contentType`,
      };
    }
    if (!isServableType(type)) {
      return {
        code: "invalid_content",
        message: `${JSON.stringify(type)} (for ${JSON.stringify(path)}) is not a media type a browser is served: a bare type such as text/csv or image/png, no parameters`,
      };
    }
    const limit = isTextType(type) ? MAX_TEXT_FILE_BYTES : MAX_BINARY_FILE_BYTES;
    if (change.bytes > limit) {
      return {
        code: "too_large",
        message: `${JSON.stringify(path)} is ${mib(change.bytes)}; a ${isTextType(type) ? "text" : "binary"} file is at most ${mib(limit)}`,
      };
    }
    written[path] = type;
    writtenBytes += change.bytes;
  }
  const count = Object.keys(kept).length + Object.keys(written).length;
  if (count > MAX_FILE_ENTRIES) {
    return {
      code: "too_large",
      message: `the version would hold ${count} files; at most ${MAX_FILE_ENTRIES}`,
    };
  }
  const total = Object.values(kept).reduce((sum, f) => sum + f.bytes, writtenBytes);
  if (total > MAX_VERSION_FILE_BYTES) {
    return {
      code: "too_large",
      message: `the version's files would total ${mib(total)}; at most ${mib(MAX_VERSION_FILE_BYTES)}`,
    };
  }
  return { kept, written, removed };
}
