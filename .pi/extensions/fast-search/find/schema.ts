// The find tool's parameters: Pi's built-in shape (pattern, path, limit) kept
// intact, plus the fd options worth having directly — entry type, extension,
// exclusions, regex patterns, recency, depth, and the hidden and ignore toggles.

import { StringEnum } from "@earendil-works/pi-ai";
import { type Static, Type } from "typebox";

export const FIND_TYPES = ["any", "file", "dir", "symlink"] as const;
export type FindType = (typeof FIND_TYPES)[number];

export const findSchema = Type.Object({
  pattern: Type.String({
    description:
      "Glob matched against the entry name, e.g. '*.ts' or 'README*'; a glob with '/' such as 'src/**/*.spec.ts' matches the whole path. '*' lists everything under path.",
  }),
  path: Type.Optional(
    Type.String({ description: "Directory to search in (default: current directory)" }),
  ),
  type: Type.Optional(
    StringEnum(FIND_TYPES, {
      description: "Only 'file', 'dir', or 'symlink' entries (default: 'any')",
    }),
  ),
  extension: Type.Optional(
    Type.String({ description: "Only files with this extension, without the dot, e.g. 'ts'" }),
  ),
  exclude: Type.Optional(
    Type.String({ description: "Skip entries matching this glob, e.g. 'dist' or '*.test.ts'" }),
  ),
  regex: Type.Optional(
    Type.Boolean({ description: "Treat pattern as a regex instead of a glob (default: false)" }),
  ),
  ignoreCase: Type.Optional(
    Type.Boolean({ description: "Case-insensitive name matching (default: false)" }),
  ),
  hidden: Type.Optional(
    Type.Boolean({
      description:
        "Include hidden files and directories (default: true); .git/ is skipped either way",
    }),
  ),
  noIgnore: Type.Optional(
    Type.Boolean({
      description:
        "Also list paths excluded by .gitignore/.ignore, e.g. node_modules or .venv (default: false)",
    }),
  ),
  maxDepth: Type.Optional(
    Type.Number({ description: "Descend at most this many directory levels below path" }),
  ),
  changedWithin: Type.Optional(
    Type.String({
      description:
        "Only entries modified within this window, e.g. '2h', '1d', '2weeks', or since a date '2026-09-01'",
    }),
  ),
  limit: Type.Optional(Type.Number({ description: "Maximum number of results (default: 1000)" })),
});

export type FindInput = Static<typeof findSchema>;

export const FIND_DEFAULT_LIMIT = 1000;
