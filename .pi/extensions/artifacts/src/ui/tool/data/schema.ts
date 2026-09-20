// The `artifact_data` tool's parameters: Claude Code's ArtifactData shape, name
// for name — action, url, collection, doc_id, data, file_path, if_version,
// field, old_str, new_str, replace_all, query, out_dir, writes. `as_level` is
// not among them: one viewer exists here, and every access level is theirs.

import { StringEnum } from "@earendil-works/pi-ai";
import { type Static, Type } from "typebox";

import { MAX_BATCH, MAX_FILTERS, MAX_LIMIT } from "../../../domain/db";

export const DATA_ACTIONS = [
  "get",
  "list",
  "query",
  "set",
  "update",
  "delete",
  "str_replace",
  "batch",
] as const;
export type DataAction = (typeof DATA_ACTIONS)[number];

const COLLECTION =
  'Database collection path: an odd number (1–15) of "/"-separated segments (letters, digits, _ - . ~ : @ + per segment). ' +
  'Paths alternate collection/document, so "boards/b1/columns" is a collection and, with doc_id "c2", names the document ' +
  '"boards/b1/columns/c2". "data/users/me" is the user\'s own collection';
const DOC_ID = "Document id: one path segment";
const IF_VERSION =
  "The document's `version` as you last read it: the write applies only while the document is still at that version; " +
  "otherwise nothing is written and the refusal names the current version. Omit it only for a document you have not read";
const DATA = "The document fields to write, as a JSON object — exactly one of data or file_path";
const FILE_PATH =
  "A local JSON file inside the project whose top-level object is sent as the document, in place of data";

const writeSchema = Type.Object({
  op: StringEnum(["set", "update", "delete"] as const),
  collection: Type.String({ description: COLLECTION }),
  doc_id: Type.String({ description: DOC_ID }),
  data: Type.Optional(Type.Object({}, { additionalProperties: true, description: DATA })),
  file_path: Type.Optional(Type.String({ description: FILE_PATH })),
  if_version: Type.Optional(Type.Integer({ minimum: 1, description: IF_VERSION })),
});

const querySchema = Type.Object(
  {
    where: Type.Optional(
      Type.Array(Type.Array(Type.Any()), {
        maxItems: MAX_FILTERS,
        description:
          "query: [field, operator, value] triples over top-level fields; operators eq, ne, lt, lte, gt, gte, in, not-in, " +
          "array-contains (or ==, !=, <, <=, >, >=)",
      }),
    ),
    order_by: Type.Optional(
      Type.Object({
        field: Type.String(),
        direction: Type.Optional(StringEnum(["asc", "desc"] as const)),
      }),
    ),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_LIMIT })),
    cursor: Type.Optional(Type.String({ description: "A prior result's next_cursor" })),
  },
  {
    description:
      "list and query: `limit` and `cursor` page through a collection; `where` and `order_by` filter and order a query only",
  },
);

export const dataSchema = Type.Object({
  action: StringEnum(DATA_ACTIONS, {
    description:
      "Reads: get (collection + doc_id), list (a page of a collection), query (collection + query). Writes: set (replace) or " +
      "update (merge) with collection, doc_id and data or file_path; str_replace with collection, doc_id, field, old_str, " +
      "new_str; delete with collection + doc_id; batch with writes",
  }),
  url: Type.Optional(Type.String({ description: "The artifact's URL or slug. Required" })),
  collection: Type.Optional(
    Type.String({ description: `${COLLECTION}. Required for every action except batch` }),
  ),
  doc_id: Type.Optional(
    Type.String({
      description: `${DOC_ID}. Required for get, set, update, str_replace and delete; not accepted with list or query`,
    }),
  ),
  data: Type.Optional(
    Type.Object(
      {},
      {
        additionalProperties: true,
        description: `set and update: ${DATA}. In an update, a field given as {"__delete__": true} is removed instead`,
      },
    ),
  ),
  file_path: Type.Optional(Type.String({ description: `set and update: ${FILE_PATH}` })),
  if_version: Type.Optional(
    Type.Integer({
      minimum: 1,
      description: `set, update, str_replace and delete (a batch pins each entry instead): ${IF_VERSION}`,
    }),
  ),
  field: Type.Optional(
    Type.String({
      description:
        "str_replace: the top-level string field to edit — one plain key, no dots, slashes, brackets or quotes",
    }),
  ),
  old_str: Type.Optional(
    Type.String({
      description:
        "str_replace: the exact text to replace; it must occur exactly once in the field, or nothing is written",
    }),
  ),
  new_str: Type.Optional(
    Type.String({ description: "str_replace: the replacement text; empty deletes old_str" }),
  ),
  replace_all: Type.Optional(
    Type.Boolean({
      description: "str_replace: replace every occurrence of old_str, which must still occur",
    }),
  ),
  query: Type.Optional(querySchema),
  out_dir: Type.Optional(
    Type.String({
      description:
        "get, list and query: a directory inside the project; each document is written as pretty-printed JSON to " +
        "<out_dir>/<collection path>/<doc_id>.json and the result lists the files instead of their contents",
    }),
  ),
  writes: Type.Optional(
    Type.Array(writeSchema, {
      minItems: 1,
      maxItems: MAX_BATCH,
      description:
        `batch: 1–${MAX_BATCH} set, update or delete writes applied together, all or nothing; each document is addressed ` +
        "at most once, and each entry carries its own if_version",
    }),
  ),
});

export type DataParams = Static<typeof dataSchema>;
