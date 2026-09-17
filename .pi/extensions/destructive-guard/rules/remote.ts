// Code the agent did not read before running it, and the interpreter escape
// hatch around every other rule: `python -c "shutil.rmtree(...)"` is `rm -rf`
// wearing a different coat, and a script the agent just wrote is unread by
// the human. sudo is an escalation on its own, whatever follows it.

import type { RefineInput, Refinement, Rule } from "../types";
import { ALLOW, PIPE, SEG, re, verb, withVerb } from "./_shared";

const SHELL = "(?:sh|bash|zsh|dash|ksh|fish)";

function refineSudo(input: RefineInput): Refinement | undefined {
  const escalated = input.segments.filter(
    (segment) =>
      segment.wrappers.includes("sudo") ||
      segment.wrappers.includes("doas") ||
      segment.verb === "su",
  );
  if (!escalated.length) return ALLOW;
  const verbs = [...new Set(escalated.map((segment) => segment.verb))];
  return { tier: "ask", detail: `runs as root: ${verbs.join(", ")}`, targets: verbs };
}

function refineInterpreter(input: RefineInput): Refinement | undefined {
  const segments = withVerb(
    input,
    "python",
    "python3",
    "python2",
    "node",
    "bun",
    "deno",
    "perl",
    "ruby",
    "php",
    "osascript",
  );
  if (!segments.length) return ALLOW;
  const inline = segments.filter((segment) =>
    segment.args.some(
      (arg) => /^-(?:c|e|p|E|r|[a-zA-Z]*e)$/.test(arg) || arg === "--eval" || arg === "eval",
    ),
  );
  if (!inline.length) return ALLOW;
  return {
    tier: "ask",
    detail: `inline ${inline.map((s) => s.verb).join(", ")} code deletes or overwrites paths`,
  };
}

export const REMOTE_RULES: Rule[] = [
  {
    id: "pipe-to-shell",
    family: "remote-exec",
    tier: "ask",
    pattern: re(
      `(?:${verb("(?:curl|wget|fetch)")}${PIPE}\\|\\s*(?:sudo\\s+)?${SHELL}\\b` +
        `|${verb(SHELL)}${PIPE}<\\(\\s*(?:curl|wget)\\b` +
        `|${verb("(?:sh|bash|zsh|dash|ksh|eval|source)")}${PIPE}\\$\\(\\s*(?:curl|wget)\\b` +
        `|${verb("(?:python3?|node|ruby|perl)")}${PIPE}<\\(\\s*(?:curl|wget)\\b` +
        `|${verb("(?:curl|wget)")}${PIPE}\\|\\s*(?:sudo\\s+)?(?:python3?|node|ruby|perl)\\b)`,
    ),
    title: "piping a download straight into an interpreter",
    why: "executing remote content unread runs whatever the server sends — a wrong or compromised URL runs arbitrary code with your privileges.",
    fix: "Download to a file, read it, then run it; approve only if you trust the source.",
  },
  {
    id: "obfuscated-exec",
    family: "remote-exec",
    tier: "deny",
    pattern: re(
      `(?:${verb("base64")}${PIPE}(?:-d\\b|--decode\\b|-D\\b)|${verb("xxd")}${PIPE}(?:-r\\b|--revert\\b)|${verb("(?:openssl)")}${PIPE}\\benc\\b${PIPE}-d\\b)` +
        `${PIPE}\\|\\s*(?:sudo\\s+)?(?:${SHELL}|python3?|node|perl|ruby)\\b`,
    ),
    title: "decode-then-execute",
    why: "decoding a blob straight into a shell hides what will run and has no legitimate agent use.",
    fix: "Write the readable source with the write tool first, then run that file.",
  },
  {
    id: "interpreter-delete",
    family: "remote-exec",
    tier: "ask",
    pattern: re(
      `${verb("(?:python3?|python2|node|bun|deno|perl|ruby|php|osascript)")}${SEG}` +
        "(?:rmtree|os\\.remove|os\\.unlink|os\\.rmdir|os\\.removedirs|shutil\\.move|pathlib[^;&|\\n]*?\\.unlink|\\.rmdir\\(" +
        "|\\.(?:rm|rmdir|unlink|rmSync|rmdirSync|unlinkSync|rmdirSync|removeSync|emptyDirSync|remove|emptyDir)\\(|rimraf|del\\(|Deno\\.remove" +
        "|\\bunlink\\b|File::Path|remove_tree|FileUtils\\.rm|FileUtils\\.remove|\\brm_rf?\\b|\\brmdir\\b|do shell script)",
    ),
    title: "inline interpreter code that deletes paths",
    why: "shutil.rmtree, fs.rmSync, unlink, FileUtils.rm_rf are rm -rf by another name, and the guard cannot read where they point.",
    fix: "Use the shell rm so the target is visible, or write a script file the user can read first.",
    refine: refineInterpreter,
  },
  {
    id: "sudo",
    family: "remote-exec",
    tier: "ask",
    pattern: re(`(?:${verb("(?:sudo|doas)")}|${verb("su")}(?:\\s|$))`),
    title: "privilege escalation",
    why: "whatever follows sudo runs as root, past every ownership and permission check the OS would otherwise apply.",
    fix: 'Run it without sudo if the target is yours; approve only if root is really needed. Add "sudo" to allow in .pi/destructive-guard.json to stop being asked.',
    refine: refineSudo,
  },
];
