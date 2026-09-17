// normalize / segments / agentClaim / options — the shell reader behind every rule.
//
// N1  quotes: syntactic ' and " vanish so `rm -'r'f x` reads `rm -rf x`; an operator
//     inside quotes becomes a space so `"a|b"` is never a pipe; backslash-newline joins
// N2  segments split on every unquoted separator — ; && || | & newline ( ) { } $( ` —
//     so a multi-line payload is every line, and a verb glued to a bracket is a verb
// N3  wrappers peel: sudo (with -u user), env (with VAR=x and -i), nohup, timeout N,
//     nice -n N, ionice, xargs (marks operandsUnknown), leading assignments, /bin/ paths,
//     and a \rm alias bypass all yield the real verb
// N4  a `sh -c "…"`, `bash -lc "…"`, or `eval "…"` body is parsed into further segments,
//     three levels deep and no further
// N5  a comment runs to its line end and is not a segment; a `# why:` (or `# reason:`)
//     line — or a plain leading comment — is the agent's claim; no comment is undefined
// N6  options(): `-rf` splits into -r and -f, `--recursive` stays whole, `--` ends
//     options, `-` alone is an operand, operand order is kept
// N7  an unterminated quote does not throw: the rest of the text is one word

import { describe, expect, test } from "bun:test";

import { agentClaim, normalize, options, segments } from "@ext/destructive-guard/normalize";

describe("N1 normalize", () => {
  test("drops syntactic quotes and keeps the words", () => {
    expect(normalize("rm -'r'f \"x y\"")).toBe("rm -rf x y");
  });
  test("a quoted operator is a space, never syntax", () => {
    expect(normalize('echo "a|b;c>d"')).toBe("echo a b c d");
  });
  test("an opposite-type quote inside a span is literal", () => {
    expect(normalize("echo 'a\"b'")).toBe('echo a"b');
  });
  test("backslash-newline joins the line", () => {
    expect(normalize("rm \\\n-rf x")).toBe("rm  -rf x");
  });
});

describe("N2 segments split", () => {
  const verbs = (command: string) => segments(command).map((s) => s.verb);
  test.each([
    ["semicolon", "cd /; rm -rf *", ["cd", "rm"]],
    ["and / or", "make || rm -rf build && echo ok", ["make", "rm", "echo"]],
    ["pipe", "find . | xargs rm", ["find", "rm"]],
    ["background", "sleep 1 & rm x", ["sleep", "rm"]],
    ["newline", "echo one\nrm -rf /\necho two", ["echo", "rm", "echo"]],
    ["subshell brackets glued", "(rm -rf x)", ["rm"]],
    ["group braces glued", "{rm -rf x;}", ["rm"]],
    ["command substitution", "echo $(rm -rf x)", ["echo", "rm"]],
    ["backticks", "echo `rm -rf x`", ["echo", "rm"]],
  ])("%s", (_name, command, expected) => {
    expect(verbs(command)).toEqual(expected);
  });
  test("a quoted separator does not split", () => {
    expect(verbs("echo 'a; rm -rf x'")).toEqual(["echo"]);
  });
});

describe("N3 wrappers peel to the real verb", () => {
  test.each([
    ["sudo", "sudo rm -rf x", "rm", ["sudo"]],
    ["sudo -u user -E", "sudo -u root -E rm -rf x", "rm", ["sudo"]],
    ["doas", "doas rm x", "rm", ["doas"]],
    ["env with assignment and -i", "env -i FOO=1 rm x", "rm", ["env"]],
    ["nohup", "nohup rm x", "rm", ["nohup"]],
    ["timeout N", "timeout 10 rm x", "rm", ["timeout"]],
    ["timeout -s KILL N", "timeout -s KILL 10 rm x", "rm", ["timeout"]],
    ["nice -n", "nice -n 10 rm x", "rm", ["nice"]],
    ["ionice", "ionice -c 3 rm x", "rm", ["ionice"]],
    ["leading assignment", "FOO=bar rm x", "rm", []],
    ["absolute path", "/bin/rm x", "rm", []],
    ["backslash alias bypass", "\\rm x", "rm", []],
    ["command builtin", "command rm x", "rm", ["command"]],
    ["stacked", "sudo env X=1 nohup timeout 5 rm x", "rm", ["sudo", "env", "nohup", "timeout"]],
  ])("%s", (_name, command, verb, wrappers) => {
    const [segment] = segments(command);
    expect(segment?.verb).toBe(verb);
    expect(segment?.wrappers).toEqual(wrappers);
    expect(segment?.operandsUnknown).toBe(false);
  });
  test("xargs marks the operands as unreadable", () => {
    const [, segment] = segments("ls | xargs -0 -I {} rm -rf {}");
    expect(segment?.verb).toBe("rm");
    expect(segment?.operandsUnknown).toBe(true);
  });
  test("a wrapper with nothing after it is no segment", () => {
    expect(segments("sudo")).toEqual([]);
  });
});

describe("N4 nested shell bodies", () => {
  test.each([
    ["sh -c", "sh -c 'rm -rf /'"],
    ["bash -lc glued", "bash -lc 'rm -rf /'"],
    ["eval", 'eval "rm -rf /"'],
    ["sudo bash -c", "sudo bash -c 'rm -rf /'"],
  ])("%s yields the inner rm", (_name, command) => {
    const inner = segments(command).find((s) => s.verb === "rm");
    expect(inner?.args).toEqual(["-rf", "/"]);
  });
  test("nesting stops at three levels", () => {
    const four = 'sh -c \'sh -c "sh -c \\"sh -c \\\\\\"rm -rf /\\\\\\"\\""\'';
    expect(segments(four).some((s) => s.verb === "rm")).toBe(false);
  });
});

describe("N5 comments and the agent's claim", () => {
  test("a comment is not a segment", () => {
    expect(segments("# rm -rf /\nls").map((s) => s.verb)).toEqual(["ls"]);
  });
  test.each([
    ["# why:", "# why: clearing stale build\nrm -rf build", "clearing stale build"],
    ["# reason:", "# reason: regen\nrm -rf build", "regen"],
    ["plain leading comment", "# starting over\nrm -rf build", "starting over"],
    ["why after other lines", "cd x\n# why: reset\nrm -rf y", "reset"],
    ["no comment", "rm -rf build", undefined],
    ["a later plain comment is not a claim", "rm -rf build # cleanup", undefined],
  ])("%s", (_name, command, claim) => {
    expect(agentClaim(command)).toBe(claim);
  });
});

describe("N6 options", () => {
  test("clusters split, long flags stay whole, -- ends options", () => {
    const { flags, operands } = options(["-rf", "--recursive", "--", "-x", "a", "-"]);
    expect([...flags].sort()).toEqual(["--recursive", "-f", "-r"]);
    expect(operands).toEqual(["-x", "a", "-"]);
  });
  test("a --flag=value keeps only the flag", () => {
    expect(options(["--interactive=never", "x"]).flags.has("--interactive")).toBe(true);
  });
});

describe("N7 malformed input", () => {
  test("an unterminated quote is the rest of the text as one word", () => {
    expect(segments("rm -rf 'x y")[0]?.args).toEqual(["-rf", "x y"]);
    expect(normalize("rm 'x")).toBe("rm x");
  });
  test("empty and non-string input yield nothing", () => {
    expect(segments("")).toEqual([]);
    expect(segments("   \n ")).toEqual([]);
  });
});
