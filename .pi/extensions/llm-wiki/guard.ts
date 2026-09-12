// The write guard: which llm-wiki paths a session may never write by hand, and
// which paths a bash command writes. Pure functions; index.ts wires them to
// tool_call. Only a parsed, catalog-confirmed destination is a denial — any
// doubt is an allow.

import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const SHELVES = new Set([
  "concepts",
  "projects",
  "people",
  "decisions",
  "systems",
  "workflows",
  "questions",
]);

const BOUNDARIES = new Set([";", "&&", "||", "|", "(", ")"]);
const REDIRECT_RE = /^\d*(>>?)(.*)$/;

/** The single-writer denial for a repo-relative path, or null when it is open. */
export function denialFor(rel: string): string | null {
  if (rel === "llm-wiki/governance.json") {
    return (
      "llm-wiki/governance.json is the tracked write policy — the human changes it " +
      "in a reviewed edit; never edit it from a session"
    );
  }
  const parts = rel.split("/");
  if (parts[0] !== "llm-wiki") return null;
  const segment = parts.slice(1);
  if (segment[0] === "states") {
    if (segment[1] === "inbox") return null;
    return (
      `${rel} is written only by scripts/llm-wiki/state.py — run the verb ` +
      "(apply · decay · merge · undo · rebuild); never edit the file"
    );
  }
  const shelf = segment[1];
  if (
    segment[0] === "wiki" &&
    shelf !== undefined &&
    (shelf === "index.md" || SHELVES.has(shelf))
  ) {
    return `${rel} is written only by scripts/llm-wiki/render.py — run render; never edit the file`;
  }
  return null;
}

/** realpath that tolerates a path whose tail does not exist yet (a new file). */
export function realpathLenient(path: string): string {
  let head = path;
  const tail: string[] = [];
  while (!existsSync(head)) {
    const parent = dirname(head);
    if (parent === head) return path;
    tail.unshift(basename(head));
    head = parent;
  }
  try {
    return join(realpathSync(head), ...tail);
  } catch {
    return path;
  }
}

/**
 * The denial for a path a tool is about to write, or null. `root` is the
 * project root holding llm-wiki/; a relative path resolves against `cwd`.
 * Both the lexical form and the symlink-resolved form are checked, so an
 * alias aimed at a protected file is caught too.
 */
export function protectedPath(path: string, root: string, cwd?: string): string | null {
  if (typeof path !== "string" || !path.trim()) return null;
  let candidate = path.trim();
  if (candidate === "~" || candidate.startsWith("~/")) {
    candidate = join(homedir(), candidate.slice(2));
  }
  if (!isAbsolute(candidate)) candidate = resolve(cwd ?? root, candidate);
  const lexical = resolve(candidate);
  const forms = [lexical, realpathLenient(lexical)];
  const roots = [resolve(root), realpathLenient(resolve(root))];
  for (const form of forms) {
    for (const base of roots) {
      const rel = relative(base, form);
      if (!rel || rel.startsWith("..") || isAbsolute(rel)) continue;
      const denial = denialFor(rel.split(sep).join("/"));
      if (denial) return denial;
    }
  }
  return null;
}

/** Expose unquoted command boundaries so one write verb cannot borrow another's path. */
export function spaceBoundaries(command: string): string {
  const out: string[] = [];
  let quote = "";
  let escaped = false;
  let i = 0;
  while (i < command.length) {
    const ch = command[i];
    if (ch === undefined) break;
    if (escaped) {
      out.push(ch);
      escaped = false;
      i += 1;
      continue;
    }
    if (ch === "\\" && quote !== "'") {
      out.push(ch);
      escaped = true;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      if (!quote) quote = ch;
      else if (quote === ch) quote = "";
      out.push(ch);
      i += 1;
      continue;
    }
    if (!quote && ch === ">") {
      const op = command.startsWith(">>", i) ? ">>" : ">";
      out.push(" ", op, " ");
      i += op.length;
      continue;
    }
    if (!quote && (ch === ";" || ch === "|" || ch === "&")) {
      const pair = command.slice(i, i + 2);
      const op = pair === "&&" || pair === "||" ? pair : ch;
      out.push(" ", op, " ");
      i += op.length;
      continue;
    }
    if (!quote && (ch === "(" || ch === ")" || ch === "\r" || ch === "\n")) {
      // A newline starts a new simple command just as `;` does.
      out.push(" ", ch === "(" || ch === ")" ? ch : ";", " ");
      i += 1;
      continue;
    }
    out.push(ch);
    i += 1;
  }
  return out.join("");
}

/** POSIX-style word splitting; null when a quote never closes. */
export function shellSplit(command: string): string[] | null {
  const tokens: string[] = [];
  let current = "";
  let inToken = false;
  let i = 0;
  while (i < command.length) {
    const ch = command[i];
    if (ch === undefined) break;
    if (ch === "'") {
      const end = command.indexOf("'", i + 1);
      if (end === -1) return null;
      current += command.slice(i + 1, end);
      inToken = true;
      i = end + 1;
      continue;
    }
    if (ch === '"') {
      i += 1;
      let closed = false;
      while (i < command.length) {
        const c = command[i];
        if (c === undefined) break;
        const escapee = command[i + 1];
        if (c === "\\" && escapee !== undefined && '"\\$`\n'.includes(escapee)) {
          current += escapee;
          i += 2;
          continue;
        }
        if (c === '"') {
          closed = true;
          i += 1;
          break;
        }
        current += c;
        i += 1;
      }
      if (!closed) return null;
      inToken = true;
      continue;
    }
    if (ch === "\\") {
      if (i + 1 < command.length) {
        current += command[i + 1];
        inToken = true;
      }
      i += 2;
      continue;
    }
    if (/\s/.test(ch)) {
      if (inToken) {
        tokens.push(current);
        current = "";
        inToken = false;
      }
      i += 1;
      continue;
    }
    current += ch;
    inToken = true;
    i += 1;
  }
  if (inToken) tokens.push(current);
  return tokens;
}

function segments(tokens: string[]): string[][] {
  const first: string[] = [];
  const result: string[][] = [first];
  let current = first;
  for (const token of tokens) {
    if (BOUNDARIES.has(token)) {
      current = [];
      result.push(current);
    } else current.push(token);
  }
  return result.filter((segment) => segment.length > 0);
}

function redirectTargets(tokens: string[]): string[] {
  const targets: string[] = [];
  tokens.forEach((token, index) => {
    const match = REDIRECT_RE.exec(token);
    if (!match) return;
    const glued = match[2];
    if (glued) targets.push(glued);
    else {
      const next = tokens[index + 1];
      if (next !== undefined) targets.push(next);
    }
  });
  return targets;
}

function verbTargets(tokens: string[]): string[] {
  const head = tokens[0];
  if (head === undefined) return [];
  const verb = basename(head);
  const operands = tokens.slice(1).filter((token) => !token.startsWith("-"));
  if (verb === "cp") return operands.length >= 2 ? operands.slice(-1) : [];
  if (verb === "mv" || verb === "rm" || verb === "truncate" || verb === "tee") return operands;
  if (
    verb === "sed" &&
    tokens.slice(1).some((token) => token.startsWith("--in-place") || token.startsWith("-i"))
  ) {
    return operands;
  }
  if (verb === "dd") {
    return tokens
      .slice(1)
      .filter((token) => token.startsWith("of=") && token.length > 3)
      .map((token) => token.slice(3));
  }
  return [];
}

/** Every path a bash command writes through a redirection or a documented write verb. */
export function bashTargets(command: string): string[] {
  if (typeof command !== "string" || !command.trim()) return [];
  const tokens = shellSplit(spaceBoundaries(command));
  if (tokens === null) return [];
  const targets: string[] = [];
  for (const segment of segments(tokens)) {
    targets.push(...redirectTargets(segment), ...verbTargets(segment));
  }
  return targets.map((target) => target.replace(/^['"]|['"]$/g, ""));
}
