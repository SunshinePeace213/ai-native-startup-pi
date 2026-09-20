// Response builders and the body reader every route shares.

export const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });

export const html = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...headers,
    },
  });

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/** The bytes a base64 string carries; null for anything that is not base64, which a lenient decoder would half-read. */
export function fromBase64(value: unknown): Uint8Array | null {
  if (typeof value !== "string" || value.length % 4 !== 0 || !BASE64_RE.test(value)) return null;
  return new Uint8Array(Buffer.from(value, "base64"));
}

/** A JSON object body under `limit` bytes, or the error response to send instead. */
export async function readJsonBody(
  req: Request,
  limit: number,
): Promise<Record<string, unknown> | Response> {
  const length = Number(req.headers.get("content-length") ?? "0");
  if (length > limit) return json(413, { error: "body too large" });
  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > limit) return json(413, { error: "body too large" });
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return json(400, { error: "body is not JSON" });
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return json(400, { error: "body must be an object" });
  }
  return parsed as Record<string, unknown>;
}
