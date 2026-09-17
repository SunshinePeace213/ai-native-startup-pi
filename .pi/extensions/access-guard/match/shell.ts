// Which paths a bash command mutates. A small POSIX-style tokenizer — quotes,
// escapes, control and redirection operators, heredoc bodies skipped — feeds a
// table of write verbs. Best effort, biased to fail open: a command the
// tokenizer cannot read (an unclosed quote) yields no targets, and a program
// that writes through its own logic (`python x.py`) is invisible. Every hole
// is a documented decision, not an oversight.
//
// What is tracked beyond the plain case:
//   `cd DIR && …`           later relative targets are resolved under DIR
//   `sh -c '…'`             the inner string is parsed as its own command
//   `cat <<EOF > f … EOF`   the heredoc body is skipped, its redirect is read
//   `$(…)` and `(…)`        parentheses split segments, so the inner command
//                           is scanned like any other

import { join } from "node:path";

/** `content` changes what a file holds; `remove` deletes or moves the node away. */
export type WriteMode = "content" | "remove";

export interface WriteTarget {
  path: string;
  verb: string;
  mode: WriteMode;
}

type Token = { kind: "word"; text: string } | { kind: "op"; text: string };

const CONTROL = new Set([";", "\n", "&&", "||", "|", "|&", "&", "(", ")"]);
const WRITE_REDIRECTS = new Set([">", ">>", ">|", "&>", "&>>", ">&", "<>"]);
const READ_REDIRECTS = new Set(["<", "<<<", "<&"]);
const HEREDOC = new Set(["<<", "<<-"]);
const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh"]);
const WRAPPERS = new Set(["sudo", "command", "nohup", "env", "exec"]);

// --- Tokenizer -----------------------------------------------------------------

function readOperator(source: string, at: number): string | null {
  const rest = source.slice(at, at + 3);
  for (const op of [
    "<<<",
    "<<-",
    "&>>",
    "&&",
    "||",
    "|&",
    ">>",
    ">|",
    ">&",
    "<<",
    "<&",
    "<>",
    "&>",
  ]) {
    if (rest.startsWith(op)) return op;
  }
  const ch = rest[0];
  return ch !== undefined && "><;&|()\n".includes(ch) ? ch : null;
}

/** Tokens, or null when a quote never closes. */
export function tokenize(source: string): Token[] | null {
  const tokens: Token[] = [];
  let word = "";
  let inWord = false;
  let pendingHeredocs: Array<{ delimiter: string; stripTabs: boolean }> = [];
  let expectDelimiter: boolean | null = null;
  let i = 0;
  const n = source.length;

  const flush = () => {
    if (!inWord) return;
    if (expectDelimiter !== null) {
      pendingHeredocs.push({ delimiter: word, stripTabs: expectDelimiter });
      expectDelimiter = null;
    }
    tokens.push({ kind: "word", text: word });
    word = "";
    inWord = false;
  };

  const skipHeredocBodies = () => {
    for (const { delimiter, stripTabs } of pendingHeredocs) {
      for (;;) {
        if (i >= n) return;
        let end = source.indexOf("\n", i);
        if (end === -1) end = n;
        let line = source.slice(i, end);
        if (stripTabs) line = line.replace(/^\t+/, "");
        i = end + 1;
        if (line === delimiter) break;
      }
    }
    pendingHeredocs = [];
  };

  while (i < n) {
    const ch = source[i]!;
    if (ch === "\\") {
      const next = source[i + 1];
      if (next === "\n") {
        i += 2; // line continuation
        continue;
      }
      if (next !== undefined) {
        word += next;
        inWord = true;
      }
      i += 2;
      continue;
    }
    if (ch === "'") {
      const end = source.indexOf("'", i + 1);
      if (end === -1) return null;
      word += source.slice(i + 1, end);
      inWord = true;
      i = end + 1;
      continue;
    }
    if (ch === '"') {
      i += 1;
      let closed = false;
      while (i < n) {
        const c = source[i]!;
        if (c === "\\" && i + 1 < n && '"\\$`\n'.includes(source[i + 1]!)) {
          word += source[i + 1];
          i += 2;
          continue;
        }
        if (c === '"') {
          closed = true;
          i += 1;
          break;
        }
        word += c;
        i += 1;
      }
      if (!closed) return null;
      inWord = true;
      continue;
    }
    // A leading fd number glued to a redirection (`2>`, `1>&`) is part of the operator.
    if (!inWord && /[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9]/.test(source[j]!)) j += 1;
      const op = readOperator(source, j);
      if (op !== null && (op.startsWith(">") || op.startsWith("<"))) {
        tokens.push({ kind: "op", text: op });
        if (HEREDOC.has(op)) expectDelimiter = op === "<<-";
        i = j + op.length;
        continue;
      }
    }
    const op = readOperator(source, i);
    if (op !== null) {
      flush();
      tokens.push({ kind: "op", text: op });
      i += op.length;
      if (HEREDOC.has(op)) expectDelimiter = op === "<<-";
      if (op === "\n" && pendingHeredocs.length) skipHeredocBodies();
      continue;
    }
    if (/\s/.test(ch)) {
      flush();
      i += 1;
      continue;
    }
    word += ch;
    inWord = true;
    i += 1;
  }
  flush();
  return tokens;
}

// --- Segments → targets ---------------------------------------------------------

function segments(tokens: Token[]): Token[][] {
  const out: Token[][] = [];
  let current: Token[] = [];
  for (const token of tokens) {
    if (token.kind === "op" && CONTROL.has(token.text)) {
      if (current.length) out.push(current);
      current = [];
    } else current.push(token);
  }
  if (current.length) out.push(current);
  return out;
}

const isFlag = (word: string) => word.startsWith("-") && word !== "-";
const isAssignment = (word: string) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(word);

/** Split one segment into the redirection targets and the remaining argv. */
function splitSegment(segment: Token[]): { redirects: string[]; argv: string[] } {
  const redirects: string[] = [];
  const argv: string[] = [];
  let index = 0;
  while (index < segment.length) {
    const token = segment[index]!;
    if (token.kind === "word") {
      argv.push(token.text);
      index += 1;
      continue;
    }
    const next = segment[index + 1];
    const operand = next?.kind === "word" ? next.text : undefined;
    if (WRITE_REDIRECTS.has(token.text)) {
      // `>&2` / `>&-` duplicate or close a descriptor; anything else is a file.
      const isDup = token.text === ">&" && operand !== undefined && /^([0-9]+|-)$/.test(operand);
      if (operand !== undefined && !isDup) redirects.push(operand);
      index += operand !== undefined ? 2 : 1;
      continue;
    }
    if (READ_REDIRECTS.has(token.text) || HEREDOC.has(token.text)) {
      index += operand !== undefined ? 2 : 1;
      continue;
    }
    index += 1;
  }
  return { redirects, argv };
}

/** Drop env assignments and wrappers (`sudo`, `env -i`, …) ahead of the real verb. */
function unwrap(argv: string[]): string[] {
  let rest = argv;
  for (;;) {
    while (rest.length && isAssignment(rest[0]!)) rest = rest.slice(1);
    const head = rest[0];
    if (head === undefined) return rest;
    const verb = head.slice(head.lastIndexOf("/") + 1);
    if (!WRAPPERS.has(verb)) return rest;
    rest = rest.slice(1);
    while (rest.length && isFlag(rest[0]!)) rest = rest.slice(1);
  }
}

function operandsOf(args: string[]): string[] {
  return args.filter((arg) => !isFlag(arg));
}

/** The value of `-x VALUE` / `--long=VALUE` / `--long VALUE`, if present. */
function optionValue(args: string[], short: string, long?: string): string | null {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === short || (long !== undefined && arg === long)) return args[index + 1] ?? null;
    if (long !== undefined && arg.startsWith(`${long}=`)) return arg.slice(long.length + 1);
    if (short.length === 2 && arg.startsWith(short) && arg.length > 2 && !arg.startsWith("--")) {
      return arg.slice(2);
    }
  }
  return null;
}

function verbTargets(verb: string, args: string[]): WriteTarget[] {
  const targets: WriteTarget[] = [];
  const content = (path: string) => targets.push({ path, verb, mode: "content" });
  const remove = (path: string) => targets.push({ path, verb, mode: "remove" });
  const operands = operandsOf(args);
  switch (verb) {
    case "rm":
    case "rmdir":
    case "unlink":
      operands.forEach(remove);
      break;
    case "mv": {
      const dest = optionValue(args, "-t", "--target-directory");
      if (dest !== null) {
        operandsOf(args.filter((a) => a !== dest)).forEach(remove);
        content(dest);
      } else if (operands.length >= 2) {
        operands.slice(0, -1).forEach(remove);
        content(operands[operands.length - 1]!);
      }
      break;
    }
    case "cp":
    case "install":
    case "rsync":
    case "ln": {
      const dest = optionValue(args, "-t", "--target-directory");
      if (dest !== null) content(dest);
      else if (operands.length >= 2) content(operands[operands.length - 1]!);
      break;
    }
    case "tee":
    case "truncate":
    case "touch":
    case "mkdir":
      operands.forEach(content);
      break;
    case "sed":
      if (args.some((a) => a === "-i" || a.startsWith("--in-place") || /^-[a-zA-Z]*i/.test(a))) {
        operands.forEach(content);
      }
      break;
    case "perl":
      if (args.some((a) => /^-[a-zA-Z]*i/.test(a))) operands.forEach(content);
      break;
    case "dd":
      for (const arg of args) if (arg.startsWith("of=") && arg.length > 3) content(arg.slice(3));
      break;
    case "patch": {
      const dir = optionValue(args, "-d", "--directory");
      if (dir !== null) content(dir);
      operands.forEach(content);
      break;
    }
    case "tar": {
      const dir = optionValue(args, "-C", "--directory");
      if (dir !== null) content(dir);
      break;
    }
    case "unzip": {
      const dir = optionValue(args, "-d");
      if (dir !== null) content(dir);
      break;
    }
    default:
      break;
  }
  return targets;
}

/** Apply the tracked `cd` prefix to a relative target. */
function underCwd(vcwd: string, path: string): string {
  if (!vcwd || path.startsWith("/") || path.startsWith("~")) return path;
  return vcwd === "~" ? `~/${path}` : join(vcwd, path);
}

function nextCwd(vcwd: string, args: string[]): string {
  const dir = operandsOf(args)[0];
  if (dir === undefined || dir === "~") return "~";
  if (dir === "-") return "";
  return underCwd(vcwd, dir);
}

function collect(command: string, vcwd: string, depth: number): WriteTarget[] {
  const tokens = tokenize(command);
  if (tokens === null) return [];
  const targets: WriteTarget[] = [];
  let cwd = vcwd;
  for (const segment of segments(tokens)) {
    const { redirects, argv } = splitSegment(segment);
    for (const path of redirects)
      targets.push({ path: underCwd(cwd, path), verb: "redirect", mode: "content" });
    const unwrapped = unwrap(argv);
    const head = unwrapped[0];
    if (head === undefined) continue;
    const verb = head.slice(head.lastIndexOf("/") + 1);
    const args = unwrapped.slice(1);
    if (verb === "cd" || verb === "pushd") {
      cwd = nextCwd(cwd, args);
      continue;
    }
    if (verb === "popd") {
      cwd = "";
      continue;
    }
    if (SHELLS.has(verb) && depth < 3) {
      const inner = optionValue(args, "-c");
      if (inner !== null) targets.push(...collect(inner, cwd, depth + 1));
      continue;
    }
    for (const target of verbTargets(verb, args)) {
      targets.push({ ...target, path: underCwd(cwd, target.path) });
    }
  }
  return targets;
}

/** Every path a bash command writes, with the verb and whether it removes or rewrites. */
export function writeTargets(command: unknown): WriteTarget[] {
  if (typeof command !== "string" || !command.trim()) return [];
  return collect(command, "", 0);
}
