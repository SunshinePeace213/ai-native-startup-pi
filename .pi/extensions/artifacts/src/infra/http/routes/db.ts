// An artifact's database over HTTP, one body for both who reach it: the
// viewer shell, making the page's `db` calls for it (POST /a/<slug>/db), and a
// session's `artifact_data` tool (POST /api/artifacts/<slug>/db). Each route
// has authorised the sender before it comes here.
//
//   {op: "get", path}
//   {op: "query", path, query: {where: [[field, operator, value]…],
//                               orderBy: {field, direction}, limit, cursor}}
//   {op: "set" | "update", path, data, ifVersion?}
//   {op: "delete", path, ifVersion?}
//   {op: "str_replace", path, field, oldStr, newStr, replaceAll?, ifVersion?}
//   {op: "batch", writes: [a set, update, delete or str_replace …]}   all or nothing
//   {op: "acquire", path, holder, ttlMs?, data?}
//
// 200 answers {ok: true, …}: `doc` for a get, `docs` and `nextCursor` for a
// query, `path` and `version` for a write, `written` for a batch, the lease
// for an acquire. A refusal is {code, message} under the `db` capability's
// codes — 400 invalid_argument, 409 conflict with the `current` version, 413
// quota_exceeded, 403 revoked — and writes nothing. Every open view of the
// artifact is told which documents a write moved: {type: "db", paths}.

import type { Core, DbRequest } from "../../../app/core";
import type { DbWrite } from "../../../domain/db";
import type { EventHub } from "../events";
import { json } from "../respond";

const WRITES: readonly string[] = ["set", "update", "delete", "str_replace"];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** One write as the wire states it; a string says why it is none. */
function write(raw: unknown): DbWrite | string {
  if (!isObject(raw)) return "a write is an object with an op and a path";
  const { op, path, ifVersion } = raw;
  if (op === "set" || op === "update") return { op, path, data: raw.data, ifVersion };
  if (op === "delete") return { op, path, ifVersion };
  if (op === "str_replace") {
    return {
      op,
      path,
      field: raw.field,
      oldStr: raw.oldStr,
      newStr: raw.newStr,
      replaceAll: raw.replaceAll === true,
      ifVersion,
    };
  }
  return `a write's op is one of ${WRITES.join(", ")}`;
}

function request(body: Record<string, unknown>): DbRequest | string {
  const { op, path } = body;
  if (op === "get") return { op, path };
  if (op === "query") return { op, path, query: body.query };
  if (op === "acquire")
    return { op, path, holder: body.holder, ttlMs: body.ttlMs, data: body.data };
  if (op === "batch") {
    if (!Array.isArray(body.writes)) return "writes is a list of writes";
    const writes: DbWrite[] = [];
    for (const [entry, raw] of body.writes.entries()) {
      const one = write(raw);
      if (typeof one === "string") return `writes[${entry}]: ${one}`;
      writes.push(one);
    }
    return { op: "write", writes, batch: true };
  }
  if (typeof op !== "string" || !WRITES.includes(op))
    return `op is one of get, query, ${WRITES.join(", ")}, batch, acquire`;
  const one = write(body);
  return typeof one === "string" ? one : { op: "write", writes: [one], batch: false };
}

export function handleDb(
  slug: string,
  body: Record<string, unknown>,
  r: { core: Core; hub: EventHub },
): Response {
  const asked = request(body);
  if (typeof asked === "string") return json(400, { code: "invalid_argument", message: asked });
  const out = r.core.db(slug, asked);
  if (out.changed.length) r.hub.broadcastPage(slug, { type: "db", paths: out.changed });
  return json(out.status, out.body);
}
