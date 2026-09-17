// Shell text → something a rule can read. Two views of one command:
//
//   normalize(command)  the quote-normalized string the regex patterns scan:
//                       syntactic ' and " dropped (so `rm -'r'f x` reads `rm -rf x`),
//                       an operator inside quotes turned into a space (so `"a|b"` is
//                       never a pipe), a backslash-newline joined.
//   segments(command)   the simple commands, split on unquoted ; && || | & newline
//                       ( ) { } $( and backticks, each with its wrappers peeled
//                       (sudo, env, xargs, nohup, timeout …) and a `sh -c "…"` or
//                       `eval …` body parsed as more segments.
//
// Lessons from the earlier guards, kept on purpose: a newline is a separator
// like `;` (a multi-line payload is not "its first line"), a verb glued to a
// bracket is still a verb, and a heredoc body is scanned as text — the false
// positive of a heredoc that names a destructive verb is accepted. Pure O(n)
// string work; nothing here executes, expands, or reads the filesystem.

import type { Segment } from "./types";

const MAX_NESTING = 3;

/** Drop syntactic quotes and neutralize quoted operators, keeping everything else verbatim. */
export function normalize(command: string): string {
  const out: string[] = [];
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i] as string;
    if (ch === "\\" && !inSingle && command[i + 1] === "\n") {
      out.push(" ");
      i += 1;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if ((inSingle || inDouble) && "<>|&;".includes(ch)) {
      out.push(" ");
      continue;
    }
    out.push(ch);
  }
  return out.join("");
}

type Token = { text: string; op: boolean };

const TWO_CHAR_OPS = new Set(["&&", "||", "|&", ";;", "$("]);
const ONE_CHAR_OPS = new Set([";", "|", "&", "\n", "(", ")", "`"]);

/** `{` and `}` separate only as bash reserved words — standing alone — so `{}` stays a placeholder. */
function braceIsOp(command: string, i: number, inWord: boolean): boolean {
  if (inWord) return false;
  const next = command[i + 1];
  if (command[i] === "{") return next === undefined || /[\s;]/.test(next);
  return next === undefined || /[\s;&|)]/.test(next);
}

/** Split into words and operators with POSIX quote and escape handling. */
export function tokenize(command: string): Token[] {
  const tokens: Token[] = [];
  let current = "";
  let inWord = false;
  const flush = () => {
    if (inWord) tokens.push({ text: current, op: false });
    current = "";
    inWord = false;
  };
  let i = 0;
  while (i < command.length) {
    const ch = command[i] as string;
    if (ch === "'") {
      const end = command.indexOf("'", i + 1);
      const close = end === -1 ? command.length : end;
      current += command.slice(i + 1, close);
      inWord = true;
      i = close + 1;
      continue;
    }
    if (ch === '"') {
      i += 1;
      while (i < command.length && command[i] !== '"') {
        const c = command[i] as string;
        const next = command[i + 1];
        if (c === "\\" && next !== undefined && '"\\$`\n'.includes(next)) {
          if (next !== "\n") current += next;
          i += 2;
          continue;
        }
        current += c;
        i += 1;
      }
      inWord = true;
      i += 1;
      continue;
    }
    if (ch === "\\") {
      const next = command[i + 1];
      if (next !== undefined && next !== "\n") {
        current += next;
        inWord = true;
      }
      i += 2;
      continue;
    }
    const pair = command.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(pair)) {
      flush();
      tokens.push({ text: pair, op: true });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.has(ch) || ((ch === "{" || ch === "}") && braceIsOp(command, i, inWord))) {
      flush();
      tokens.push({ text: ch, op: true });
      i += 1;
      continue;
    }
    if (ch === "#" && !inWord) {
      // A comment runs to the end of the line; the line break still separates.
      const nl = command.indexOf("\n", i);
      i = nl === -1 ? command.length : nl;
      continue;
    }
    if (/\s/.test(ch)) {
      flush();
      i += 1;
      continue;
    }
    current += ch;
    inWord = true;
    i += 1;
  }
  flush();
  return tokens;
}

function splitSegments(tokens: Token[]): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    if (token.op) {
      if (current.length) result.push(current);
      current = [];
    } else current.push(token.text);
  }
  if (current.length) result.push(current);
  return result;
}

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh", "fish", "busybox"]);
const PASSTHROUGH = new Set([
  "nohup",
  "time",
  "command",
  "builtin",
  "exec",
  "caffeinate",
  "unbuffer",
  "chronic",
  "setsid",
  "strace",
  "ltrace",
]);
/** Wrappers whose listed short flags take a value in the next token. */
const WRAPPER_FLAGS: Record<string, Set<string>> = {
  sudo: new Set(["-u", "-g", "-p", "-C", "-D", "-h", "-r", "-t", "-T", "-U"]),
  doas: new Set(["-u", "-C"]),
  env: new Set(["-u", "-C", "-S"]),
  nice: new Set(["-n"]),
  ionice: new Set(["-c", "-n", "-p", "-P", "-u"]),
  stdbuf: new Set(["-i", "-o", "-e"]),
  xargs: new Set(["-I", "-n", "-P", "-d", "-a", "-L", "-s", "-E", "-i", "-l"]),
  timeout: new Set(["-s", "-k"]),
  chroot: new Set(["--userspec", "--groups"]),
};

/** The verb of a head word: its basename, with a glued group brace (`{rm`) dropped. */
function base(word: string): string {
  const bare = word.startsWith("{") && word.length > 1 ? word.slice(1) : word;
  const slash = bare.lastIndexOf("/");
  return slash === -1 ? bare : bare.slice(slash + 1);
}

/** Peel wrappers off one simple command; returns undefined when nothing is left. */
function peel(words: string[]): Segment | undefined {
  const wrappers: string[] = [];
  let operandsUnknown = false;
  let rest = words;
  let guard = 0;
  while (rest.length && guard < 16) {
    guard += 1;
    const head = rest[0] as string;
    if (ASSIGNMENT.test(head)) {
      rest = rest.slice(1);
      continue;
    }
    const verb = base(head);
    if (PASSTHROUGH.has(verb)) {
      wrappers.push(verb);
      rest = rest.slice(1);
      continue;
    }
    const valued = WRAPPER_FLAGS[verb];
    if (valued === undefined) break;
    wrappers.push(verb);
    if (verb === "xargs") operandsUnknown = true;
    let j = 1;
    if (verb === "timeout" || verb === "chroot" || verb === "nice") {
      // timeout [flags] DURATION cmd · chroot [flags] DIR cmd · nice [-n N] cmd
      while (j < rest.length && (rest[j] as string).startsWith("-")) {
        const flag = rest[j] as string;
        j += valued.has(flag) ? 2 : 1;
      }
      if (verb !== "nice") j += 1;
      rest = rest.slice(j);
      continue;
    }
    while (j < rest.length) {
      const word = rest[j] as string;
      if (word === "--") {
        j += 1;
        break;
      }
      if (word.startsWith("-")) {
        j += valued.has(word) ? 2 : 1;
        continue;
      }
      if (verb === "env" && ASSIGNMENT.test(word)) {
        j += 1;
        continue;
      }
      break;
    }
    rest = rest.slice(j);
  }
  const head = rest[0];
  if (head === undefined) return undefined;
  return { verb: base(head), args: rest.slice(1), wrappers, operandsUnknown };
}

/** A shell's `-c` body, or the text `eval` will run, when the segment has one. */
function nestedBody(segment: Segment): string | undefined {
  if (segment.verb === "eval") return segment.args.join(" ");
  if (!SHELLS.has(segment.verb)) return undefined;
  const at = segment.args.indexOf("-c");
  if (at !== -1) return segment.args[at + 1];
  const glued = segment.args.find((arg) => /^-[a-zA-Z]*c$/.test(arg));
  if (glued !== undefined) return segment.args[segment.args.indexOf(glued) + 1];
  return undefined;
}

/** Every simple command in the text, wrappers peeled, nested shell bodies included. */
export function segments(command: string, depth = 0): Segment[] {
  if (typeof command !== "string" || !command.trim()) return [];
  const out: Segment[] = [];
  for (const words of splitSegments(tokenize(command))) {
    const segment = peel(words);
    if (segment === undefined) continue;
    out.push(segment);
    const body = nestedBody(segment);
    if (body !== undefined && depth < MAX_NESTING) out.push(...segments(body, depth + 1));
  }
  return out;
}

/** The `# why: …` (or any leading comment) the agent wrote to explain the command. */
export function agentClaim(command: string): string | undefined {
  const lines = command.split("\n");
  for (const line of lines) {
    const match = /^\s*#\s*(?:why|reason)\s*:\s*(.+?)\s*$/i.exec(line);
    if (match) return match[1];
  }
  const first = lines.find((line) => line.trim().length > 0);
  if (first !== undefined && /^\s*#/.test(first)) return first.replace(/^\s*#\s*/, "").trim();
  return undefined;
}

/**
 * Split option clusters and operands for a coreutils-style verb: `-rf` → r, f;
 * `--recursive` kept whole; `--` ends options. Operands keep their order.
 */
export function options(args: string[]): { flags: Set<string>; operands: string[] } {
  const flags = new Set<string>();
  const operands: string[] = [];
  let done = false;
  for (const arg of args) {
    if (done || arg === "-" || !arg.startsWith("-")) {
      operands.push(arg);
      continue;
    }
    if (arg === "--") {
      done = true;
      continue;
    }
    if (arg.startsWith("--")) {
      flags.add(arg.split("=")[0] as string);
      continue;
    }
    for (const letter of arg.slice(1)) flags.add(`-${letter}`);
  }
  return { flags, operands };
}
