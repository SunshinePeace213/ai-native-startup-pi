// The grep tool's parameters: Pi's built-in shape (pattern, path, glob,
// ignoreCase, literal, context, limit) kept intact so resumed sessions and the
// built-in renderer still fit, plus the ripgrep options that make it worth
// calling directly — file types, word/multiline/invert, files/count modes, and
// the hidden and ignore toggles.

import { StringEnum } from "@earendil-works/pi-ai";
import { type Static, Type } from "typebox";

export const GREP_MODES = ["matches", "files", "count"] as const;
export type GrepMode = (typeof GREP_MODES)[number];

export const grepSchema = Type.Object({
  pattern: Type.String({
    description: "Regex in ripgrep (Rust) syntax, or a plain string when literal=true",
  }),
  path: Type.Optional(
    Type.String({ description: "Directory or file to search (default: current directory)" }),
  ),
  glob: Type.Optional(
    Type.String({
      description:
        "Only search files matching this glob, e.g. '*.ts', 'src/**/*.spec.ts', or '*.{ts,tsx}'",
    }),
  ),
  type: Type.Optional(
    Type.String({
      description: "Only search a ripgrep file type, e.g. 'ts', 'py', 'md', 'json', 'yaml', 'sh'",
    }),
  ),
  exclude: Type.Optional(
    Type.String({ description: "Skip files matching this glob, e.g. '*.test.ts' or 'dist/**'" }),
  ),
  ignoreCase: Type.Optional(Type.Boolean({ description: "Case-insensitive (default: false)" })),
  literal: Type.Optional(
    Type.Boolean({
      description: "Treat pattern as a literal string, not a regex (default: false)",
    }),
  ),
  wordMatch: Type.Optional(
    Type.Boolean({ description: "Match only at word boundaries (default: false)" }),
  ),
  multiline: Type.Optional(
    Type.Boolean({
      description: "Let the pattern span lines; use (?s) for '.' to cross them (default: false)",
    }),
  ),
  invert: Type.Optional(
    Type.Boolean({ description: "Return the lines that do NOT match (default: false)" }),
  ),
  context: Type.Optional(
    Type.Number({ description: "Lines of context before and after each match (default: 0)" }),
  ),
  mode: Type.Optional(
    StringEnum(GREP_MODES, {
      description:
        "'matches' returns matching lines (default); 'files' only the paths that match; 'count' per-file match counts",
    }),
  ),
  hidden: Type.Optional(
    Type.Boolean({
      description:
        "Search hidden files and directories (default: true); .git/ is skipped either way",
    }),
  ),
  noIgnore: Type.Optional(
    Type.Boolean({
      description:
        "Also search paths excluded by .gitignore/.ignore, e.g. node_modules or .venv (default: false)",
    }),
  ),
  maxDepth: Type.Optional(
    Type.Number({ description: "Descend at most this many directory levels below path" }),
  ),
  limit: Type.Optional(
    Type.Number({
      description: "Maximum matches (or files, or counted files) to return (default: 100)",
    }),
  ),
});

export type GrepInput = Static<typeof grepSchema>;

export const GREP_DEFAULT_LIMIT = 100;
