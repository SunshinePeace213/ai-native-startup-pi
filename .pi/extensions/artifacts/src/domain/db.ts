// An artifact's database, as Claude Code's `db` capability has it: JSON
// documents at slash-separated paths — `collection/doc`, nesting deeper as
// `collection/doc/subcollection/doc` — one store per artifact, read and
// written by its page in every open view and by the agent's `artifact_data`
// tool. The rules here are Claude Code's: the path grammar and its parity, a
// body that is a plain JSON object of at most 256 KiB and 32 levels, 5,000
// documents, a version on every document that each write moves on by one,
// `update` as a recursive merge in which `{"__delete__": true}` removes a
// field, queries over top-level fields with no index, and cooperative leases.
// Writes are last-writer-wins; a write pinned to a version the document has
// left writes nothing and says where the document is now. A batch is all or
// nothing.
//
// One viewer exists here and owns the page, so every access level passes and
// `data/users/me` is that viewer's own subtree, `data/users/owner`. Pure: the
// whole database is a value, and each operation answers the next value or the
// reason it refuses.

export type DbBody = Record<string, unknown>;

/** Who holds a document's lease, and until when. */
export interface DbLease {
  holder: string;
  expiresAt: string;
}

export interface DbRecord {
  data: DbBody;
  version: number;
  updatedAt: string;
  lease?: DbLease;
}

/** The whole database as it sits on disk: collection path → document id → record. */
export type DbFile = Record<string, Record<string, DbRecord>>;

/** One document as a read hands it back; one that is not there has no body and no version. */
export interface DbDocument {
  id: string;
  path: string;
  exists: boolean;
  data?: DbBody;
  version?: number;
  updatedAt?: string;
}

/**
 * Why an operation is refused. `conflict` is a pinned write that found the
 * document elsewhere: `current` is its version now, null when it is not there.
 * In a batch, `entry` is the index of the write that refused.
 */
export interface DbRefusal {
  code: "invalid_argument" | "quota_exceeded" | "conflict";
  message: string;
  path?: string;
  current?: number | null;
  entry?: number;
}

/** One write as it arrived: only `op` has been read, and the rules below decide what the rest may be. */
export type DbWrite =
  | { op: "set" | "update"; path: unknown; data: unknown; ifVersion?: unknown }
  | { op: "delete"; path: unknown; ifVersion?: unknown }
  | {
      op: "str_replace";
      path: unknown;
      field: unknown;
      oldStr: unknown;
      newStr: unknown;
      replaceAll?: boolean;
      ifVersion?: unknown;
    };

/** What one write left behind: the document's version now, or null when it is gone. */
export interface DbWritten {
  path: string;
  version: number | null;
}

export type WhereOp = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "not-in" | "array-contains";

export interface DbQuery {
  where: Array<{ field: string; op: WhereOp; value: unknown }>;
  orderBy?: { field: string; descending: boolean };
  limit?: number;
  cursor?: string;
}

export const MAX_SEGMENT_BYTES = 200;
export const MAX_PATH_BYTES = 1000;
export const MAX_SEGMENTS = 16;
export const MAX_DOC_BYTES = 256 * 1024;
export const MAX_DOC_DEPTH = 32;
export const MAX_DOCUMENTS = 5000;
export const MAX_FILTERS = 10;
export const MAX_IN_VALUES = 30;
export const MAX_LIMIT = 1000;
export const MAX_BATCH = 50;
export const DEFAULT_LEASE_MS = 30_000;
export const MIN_LEASE_MS = 1000;
export const MAX_LEASE_MS = 600_000;
/** The single viewer's id: what `data/users/me` names. */
export const OWNER_ID = "owner";
/** In an update, a field whose value is exactly this object is removed. */
export const DELETE_FIELD = "__delete__";

const SEGMENT_RE = /^[A-Za-z0-9_\-.~:@+]+$/;
/** Firestore's reserved names; refusing them also keeps `__proto__` out of every lookup. */
const RESERVED_RE = /^__.*__$/;
const FIELD_RE = /^[^./[\]"'\\\p{Cc}\p{Cf}]+$/u;
const OP_ALIASES: Record<string, WhereOp> = {
  eq: "==",
  ne: "!=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
};
const OPS: readonly string[] = ["==", "!=", "<", "<=", ">", ">=", "in", "not-in", "array-contains"];

const isPlain = (value: unknown): value is DbBody =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const utf8Bytes = (text: string) => new TextEncoder().encode(text).length;
const invalid = (message: string): DbRefusal => ({ code: "invalid_argument", message });

export const isDbRefusal = (result: object): result is DbRefusal =>
  "code" in result && "message" in result;

// ---- paths ------------------------------------------------------------------

/** Why a path is refused, or null when it is one: the grammar, and the parity its kind needs. */
export function dbPathProblem(path: unknown, kind: "document" | "collection"): string | null {
  if (typeof path !== "string" || !path) return `a ${kind} path is a non-empty string`;
  if (path.length > MAX_PATH_BYTES) return `a path is at most ${MAX_PATH_BYTES} bytes`;
  const segments = path.split("/");
  if (segments.length > MAX_SEGMENTS)
    return `${JSON.stringify(path)} has ${segments.length} segments; a path has at most ${MAX_SEGMENTS}`;
  for (const segment of segments) {
    const name = JSON.stringify(segment);
    if (!segment) return `${JSON.stringify(path)} has an empty segment`;
    if (segment === "." || segment === "..") return `${name} is not a path segment`;
    if (!SEGMENT_RE.test(segment))
      return `${name} is not a path segment: letters, digits and _ - . ~ : @ + only`;
    if (segment.length > MAX_SEGMENT_BYTES)
      return `a path segment is at most ${MAX_SEGMENT_BYTES} bytes`;
    if (RESERVED_RE.test(segment)) return `${name} is a reserved name`;
  }
  const even = segments.length % 2 === 0;
  if (kind === "document" && !even)
    return `${JSON.stringify(path)} has ${segments.length} segments; a document path has an even number (collection/doc)`;
  if (kind === "collection" && even)
    return `${JSON.stringify(path)} has ${segments.length} segments; a collection path has an odd number (collection, or collection/doc/collection)`;
  return null;
}

/** `data/users/me/…` is the viewer's own subtree, and there is one viewer. */
export function resolveDbPath(path: string): string {
  const segments = path.split("/");
  if (segments[0] !== "data" || segments[1] !== "users" || segments[2] !== "me") return path;
  return ["data", "users", OWNER_ID, ...segments.slice(3)].join("/");
}

function splitDocPath(path: string): { collection: string; id: string } {
  const at = path.lastIndexOf("/");
  return { collection: path.slice(0, at), id: path.slice(at + 1) };
}

const docsOf = (file: DbFile, collection: string): Record<string, DbRecord> =>
  Object.hasOwn(file, collection) ? (file[collection] as Record<string, DbRecord>) : {};

function recordAt(file: DbFile, collection: string, id: string): DbRecord | null {
  const docs = docsOf(file, collection);
  return Object.hasOwn(docs, id) ? (docs[id] as DbRecord) : null;
}

const documentOf = (path: string, id: string, record: DbRecord | null): DbDocument =>
  record
    ? {
        id,
        path,
        exists: true,
        data: record.data,
        version: record.version,
        updatedAt: record.updatedAt,
      }
    : { id, path, exists: false };

const countDocuments = (file: DbFile): number =>
  Object.values(file).reduce((sum, docs) => sum + Object.keys(docs).length, 0);

const full = (): DbRefusal => ({
  code: "quota_exceeded",
  message: `this artifact's database holds ${MAX_DOCUMENTS} documents, its limit; delete some before creating more`,
});

// ---- bodies -----------------------------------------------------------------

const isDeleteSentinel = (value: unknown): boolean =>
  isPlain(value) && Object.keys(value).length === 1 && value[DELETE_FIELD] === true;

function nestingProblem(
  value: unknown,
  depth: number,
  inArray: boolean,
  sentinels: boolean,
): string | null {
  if (typeof value !== "object" || value === null) return null;
  if (depth > MAX_DOC_DEPTH) return `a document nests at most ${MAX_DOC_DEPTH} levels deep`;
  const array = Array.isArray(value);
  for (const [key, child] of Object.entries(value)) {
    if (!array && key === "__proto__") return `"__proto__" is a reserved field name`;
    if (isDeleteSentinel(child)) {
      if (!sentinels)
        return `{"${DELETE_FIELD}": true} removes a field in an update; a set writes the whole document, so leave the field out`;
      if (array || inArray)
        return `{"${DELETE_FIELD}": true} cannot sit inside an array; an array is replaced whole`;
      continue;
    }
    const problem = nestingProblem(child, depth + 1, array || inArray, sentinels);
    if (problem) return problem;
  }
  return null;
}

/** Why a body is refused, or null: a plain JSON object, within the size and depth a document may have. */
export function bodyProblem(data: unknown, sentinels: boolean): string | null {
  if (!isPlain(data)) return "a document is a JSON object, not an array or a scalar";
  const nesting = nestingProblem(data, 1, false, sentinels);
  if (nesting) return nesting;
  const bytes = utf8Bytes(JSON.stringify(data));
  return bytes > MAX_DOC_BYTES
    ? `the document is ${(bytes / 1024).toFixed(0)} KiB; at most ${MAX_DOC_BYTES / 1024} KiB`
    : null;
}

/** An update: nested objects merge, anything else — arrays included — replaces the field, the sentinel removes it. */
export function mergeBody(current: DbBody, patch: DbBody): DbBody {
  const out: DbBody = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (isDeleteSentinel(value)) delete out[key];
    else if (isPlain(value)) {
      const under = Object.hasOwn(out, key) && isPlain(out[key]) ? (out[key] as DbBody) : {};
      out[key] = mergeBody(under, value);
    } else out[key] = value;
  }
  return out;
}

// ---- reads ------------------------------------------------------------------

export function readDocument(file: DbFile, rawPath: unknown): DbDocument | DbRefusal {
  const problem = dbPathProblem(rawPath, "document");
  if (problem) return invalid(problem);
  const path = resolveDbPath(rawPath as string);
  const { collection, id } = splitDocPath(path);
  return documentOf(path, id, recordAt(file, collection, id));
}

/** Reads a query as a page or a session states it; a string says which rule it breaks. */
export function parseQuery(raw: unknown): DbQuery | string {
  if (raw === undefined || raw === null) return { where: [] };
  if (!isPlain(raw)) return "a query is an object of where, orderBy, limit and cursor";
  const clauses = raw.where ?? [];
  if (!Array.isArray(clauses)) return "where is a list of [field, operator, value] triples";
  if (clauses.length > MAX_FILTERS) return `a query takes at most ${MAX_FILTERS} filters`;
  const where: DbQuery["where"] = [];
  for (const clause of clauses) {
    if (!Array.isArray(clause) || clause.length !== 3)
      return "each filter is a [field, operator, value] triple";
    const [field, stated, value] = clause as [unknown, unknown, unknown];
    if (typeof field !== "string" || !field) return "a filter's field is a top-level field name";
    const name = String(stated);
    const op = Object.hasOwn(OP_ALIASES, name) ? OP_ALIASES[name] : OPS.find((o) => o === name);
    if (!op) return `${JSON.stringify(stated)} is not an operator; use one of ${OPS.join(" ")}`;
    if (
      (op === "in" || op === "not-in") &&
      (!Array.isArray(value) || !value.length || value.length > MAX_IN_VALUES)
    )
      return `${op} takes a list of 1 to ${MAX_IN_VALUES} values`;
    where.push({ field, op: op as WhereOp, value });
  }
  const query: DbQuery = { where };
  if (raw.orderBy !== undefined && raw.orderBy !== null) {
    const order = raw.orderBy;
    if (!isPlain(order) || typeof order.field !== "string" || !order.field)
      return "orderBy names one top-level field";
    const direction = order.direction ?? "asc";
    if (direction !== "asc" && direction !== "desc") return 'a direction is "asc" or "desc"';
    query.orderBy = { field: order.field, descending: direction === "desc" };
  }
  if (raw.limit !== undefined && raw.limit !== null) {
    const limit = raw.limit;
    if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
      return `limit is an integer from 1 to ${MAX_LIMIT}`;
    query.limit = limit;
  }
  if (raw.cursor !== undefined && raw.cursor !== null) {
    if (typeof raw.cursor !== "string") return "cursor is the next_cursor of an earlier result";
    query.cursor = raw.cursor;
  }
  return query;
}

function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.hasOwn(b, key) &&
        same((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

/** Firestore's order across types: null, booleans, numbers, strings, arrays, objects. */
const rank = (value: unknown): number =>
  value === null
    ? 0
    : typeof value === "boolean"
      ? 1
      : typeof value === "number"
        ? 2
        : typeof value === "string"
          ? 3
          : Array.isArray(value)
            ? 4
            : 5;

function compareValues(a: unknown, b: unknown): number {
  const types = rank(a) - rank(b);
  if (types) return types;
  if (typeof a === "number" || typeof a === "boolean") return Number(a) - Number(b);
  const [x, y] = typeof a === "string" ? [a, b as string] : [JSON.stringify(a), JSON.stringify(b)];
  return x < y ? -1 : x > y ? 1 : 0;
}

function matches(data: DbBody, filter: DbQuery["where"][number]): boolean {
  if (!Object.hasOwn(data, filter.field)) return false;
  const value = data[filter.field];
  const wanted = filter.value;
  switch (filter.op) {
    case "==":
      return same(value, wanted);
    case "!=":
      return !same(value, wanted);
    case "in":
      return (wanted as unknown[]).some((one) => same(value, one));
    case "not-in":
      return !(wanted as unknown[]).some((one) => same(value, one));
    case "array-contains":
      return Array.isArray(value) && value.some((one) => same(one, wanted));
    default: {
      // A range only ever matches a value of the filter's own type.
      if (rank(value) !== rank(wanted)) return false;
      const order = compareValues(value, wanted);
      if (filter.op === "<") return order < 0;
      if (filter.op === "<=") return order <= 0;
      return filter.op === ">" ? order > 0 : order >= 0;
    }
  }
}

/** Where a row sits in its query's order: its id, and the ordered field's value when it has one. */
type Position = [id: string] | [id: string, value: unknown];

function readCursor(cursor: string): Position | null {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(cursor));
    const ok =
      Array.isArray(parsed) &&
      (parsed.length === 1 || parsed.length === 2) &&
      typeof parsed[0] === "string";
    return ok ? (parsed as Position) : null;
  } catch {
    return null;
  }
}

export interface QueryResult {
  docs: DbDocument[];
  /** Where the next page starts; null when this one reached the end. */
  nextCursor: string | null;
}

/**
 * One collection, filtered, ordered and cut to a page. Without `orderBy` the
 * order is the document id's; with it, a document missing the field sorts last.
 */
export function runQuery(
  file: DbFile,
  rawCollection: unknown,
  rawQuery: unknown,
): QueryResult | DbRefusal {
  const problem = dbPathProblem(rawCollection, "collection");
  if (problem) return invalid(problem);
  const query = parseQuery(rawQuery);
  if (typeof query === "string") return invalid(query);
  const collection = resolveDbPath(rawCollection as string);
  const order = query.orderBy;
  const position = (id: string, data: DbBody): Position =>
    order && Object.hasOwn(data, order.field) ? [id, data[order.field]] : [id];
  const compare = (a: Position, b: Position): number => {
    if (a.length !== b.length) return a.length === 2 ? -1 : 1;
    const direction = order?.descending && a.length === 2 ? -1 : 1;
    const byValue = a.length === 2 ? compareValues(a[1], b[1]) : 0;
    return direction * (byValue || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  };
  let rows = Object.entries(docsOf(file, collection))
    .filter(([, record]) => query.where.every((filter) => matches(record.data, filter)))
    .map(([id, record]) => ({ id, record, at: position(id, record.data) }))
    .sort((a, b) => compare(a.at, b.at));
  if (query.cursor !== undefined) {
    const after = readCursor(query.cursor);
    if (!after) return invalid("cursor is not the next_cursor of an earlier result");
    rows = rows.filter((row) => compare(row.at, after) > 0);
  }
  const page = query.limit === undefined ? rows : rows.slice(0, query.limit);
  const last = page.at(-1);
  return {
    docs: page.map((row) => documentOf(`${collection}/${row.id}`, row.id, row.record)),
    nextCursor:
      last && page.length < rows.length ? encodeURIComponent(JSON.stringify(last.at)) : null,
  };
}

// ---- writes -----------------------------------------------------------------

function replaced(
  record: DbRecord,
  write: Extract<DbWrite, { op: "str_replace" }>,
  path: string,
): DbBody | string {
  const { field, oldStr, newStr } = write;
  if (typeof field !== "string" || !FIELD_RE.test(field) || utf8Bytes(field) > MAX_SEGMENT_BYTES)
    return "field is one plain top-level key: no dots, slashes, brackets, quotes or backslashes";
  if (RESERVED_RE.test(field)) return `${JSON.stringify(field)} is a reserved name`;
  if (typeof oldStr !== "string" || !oldStr) return "old_str is the exact text to replace";
  if (typeof newStr !== "string") return "new_str is the replacement text; it may be empty";
  const text = Object.hasOwn(record.data, field) ? record.data[field] : undefined;
  if (typeof text !== "string") return `${path} has no string field ${JSON.stringify(field)}`;
  const found = text.split(oldStr).length - 1;
  if (!found) return `old_str does not occur in ${JSON.stringify(field)}; nothing was written`;
  if (found > 1 && !write.replaceAll)
    return `old_str occurs ${found} times in ${JSON.stringify(field)}, so it is not unique; nothing was written — give more of the surrounding text, or pass replace_all`;
  return { ...record.data, [field]: text.split(oldStr).join(newStr) };
}

/**
 * Applies writes as one step: every one lands, or the first that cannot names
 * itself and nothing lands. Each moves its document's version on by one; a
 * created document starts at 1. Deleting what is not there is no change.
 */
export function applyWrites(
  file: DbFile,
  writes: DbWrite[],
  at: string,
): { file: DbFile; written: DbWritten[]; changed: string[] } | DbRefusal {
  if (!writes.length || writes.length > MAX_BATCH)
    return invalid(`a batch holds 1 to ${MAX_BATCH} writes`);
  const next: DbFile = { ...file };
  const written: DbWritten[] = [];
  const changed: string[] = [];
  const addressed = new Set<string>();
  let total = countDocuments(file);
  for (const [entry, write] of writes.entries()) {
    const refuse = (refusal: DbRefusal): DbRefusal => ({ ...refusal, entry });
    const pathProblem = dbPathProblem(write.path, "document");
    if (pathProblem) return refuse(invalid(pathProblem));
    const path = resolveDbPath(write.path as string);
    if (addressed.has(path))
      return refuse(invalid(`${path} is written twice; a batch addresses a document at most once`));
    addressed.add(path);
    const { collection, id } = splitDocPath(path);
    const record = recordAt(next, collection, id);
    const pin = write.ifVersion;
    if (pin !== undefined) {
      if (typeof pin !== "number" || !Number.isInteger(pin) || pin < 1)
        return refuse(invalid("if_version is the version you last read: an integer of at least 1"));
      if (record?.version !== pin) {
        return refuse({
          code: "conflict",
          message: record
            ? `${path} is at version ${record.version}, not ${pin}: it changed since you read it; nothing was written — read it again and redo the write`
            : `${path} does not exist, so it is not at version ${pin}; nothing was written`,
          path,
          current: record?.version ?? null,
        });
      }
    }
    if (write.op === "delete") {
      written.push({ path, version: null });
      if (!record) continue;
      const rest = { ...docsOf(next, collection) };
      delete rest[id];
      if (Object.keys(rest).length) next[collection] = rest;
      else delete next[collection];
      total -= 1;
      changed.push(path);
      continue;
    }
    let data: DbBody;
    if (write.op === "str_replace") {
      if (!record) return refuse(invalid(`${path} does not exist; str_replace edits a field`));
      const edited = replaced(record, write, path);
      if (typeof edited === "string") return refuse(invalid(edited));
      data = edited;
    } else {
      const problem = bodyProblem(write.data, write.op === "update");
      if (problem) return refuse(invalid(problem));
      if (write.op === "update" && !record)
        return refuse(
          invalid(`${path} does not exist; update merges into a document, set creates one`),
        );
      data =
        write.op === "update" && record
          ? mergeBody(record.data, write.data as DbBody)
          : (write.data as DbBody);
    }
    if (write.op !== "set") {
      // What an edit leaves must still be a document: a merge can outgrow the limits its patch met.
      const problem = bodyProblem(data, false);
      if (problem) return refuse(invalid(problem));
    }
    if (!record) {
      if (total >= MAX_DOCUMENTS) return refuse(full());
      total += 1;
    }
    const version = (record?.version ?? 0) + 1;
    // A lease is the callers' own arrangement, not part of the body: a write leaves it standing.
    next[collection] = {
      ...docsOf(next, collection),
      [id]: { data, version, updatedAt: at, ...(record?.lease ? { lease: record.lease } : {}) },
    };
    written.push({ path, version });
    changed.push(path);
  }
  return { file: next, written, changed };
}

// ---- leases -----------------------------------------------------------------

export interface LeaseResult {
  acquired: boolean;
  version?: number;
  expiresAt?: string;
  holder?: string;
}

/**
 * Set-if-not-busy on one document: granted when nobody else holds a lease that
 * is still running, and to its own holder again as a renewal. A grant creates
 * the document when it is not there and merges `data` into its body; only a
 * grant that changes the body moves the version on. Busy is an answer, never
 * a refusal, and tells when the lease in force ends but not who holds it.
 */
export function acquireLease(
  file: DbFile,
  rawPath: unknown,
  options: { holder: unknown; ttlMs?: unknown; data?: unknown },
  now: Date,
): { file: DbFile; result: LeaseResult; changed: string[] } | DbRefusal {
  const pathProblem = dbPathProblem(rawPath, "document");
  if (pathProblem) return invalid(pathProblem);
  const { holder, data } = options;
  if (typeof holder !== "string" || !holder || utf8Bytes(holder) > MAX_SEGMENT_BYTES)
    return invalid(`holder is a stable string of at most ${MAX_SEGMENT_BYTES} bytes`);
  if (data !== undefined) {
    const problem = bodyProblem(data, true);
    if (problem) return invalid(problem);
  }
  const path = resolveDbPath(rawPath as string);
  const { collection, id } = splitDocPath(path);
  const record = recordAt(file, collection, id);
  const held = record?.lease;
  if (held && held.holder !== holder && Date.parse(held.expiresAt) > now.getTime())
    return { file, result: { acquired: false, expiresAt: held.expiresAt }, changed: [] };
  if (!record && countDocuments(file) >= MAX_DOCUMENTS) return full();
  const asked = typeof options.ttlMs === "number" && options.ttlMs > 0 ? options.ttlMs : 0;
  const ttl = Math.min(MAX_LEASE_MS, Math.max(MIN_LEASE_MS, asked || DEFAULT_LEASE_MS));
  const expiresAt = new Date(now.getTime() + ttl).toISOString();
  const body = data === undefined ? record?.data : mergeBody(record?.data ?? {}, data as DbBody);
  if (body !== undefined && data !== undefined) {
    const problem = bodyProblem(body, false);
    if (problem) return invalid(problem);
  }
  const moved = !record || data !== undefined;
  const version = (record?.version ?? 0) + (moved ? 1 : 0);
  const next: DbRecord = {
    data: body ?? {},
    version,
    updatedAt: moved ? now.toISOString() : (record as DbRecord).updatedAt,
    lease: { holder, expiresAt },
  };
  return {
    file: { ...file, [collection]: { ...docsOf(file, collection), [id]: next } },
    result: { acquired: true, version, expiresAt, holder },
    changed: moved ? [path] : [],
  };
}
