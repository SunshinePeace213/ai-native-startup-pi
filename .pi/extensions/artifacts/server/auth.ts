// Who may do what: the capability token (query once, then cookie, or header),
// the Host check that defeats DNS rebinding, and the Origin check that keeps a
// cross-site page from driving the session. Every rule is a pure function of
// the request, the token, and the bound port.

import { COOKIE, HEADER } from "../shared/protocol";

/** Bound address; printed URLs say `localhost`, which every browser maps to loopback. */
export const BIND = "127.0.0.1";
export const DISPLAY = "localhost";
/** A year: the token is per project and long-lived, so the clean URL keeps working. */
const COOKIE_MAX_AGE = 365 * 24 * 3600;

export interface Auth {
  /** The header carries the token: the page's script and the session use this. */
  header(req: Request): boolean;
  /** Query, cookie, or header: what a browser GET may present. */
  any(req: Request, url: URL): boolean;
  ownHost(req: Request): boolean;
  ownOrigin(req: Request): boolean;
  /** Strips `?t=` from the address and sets the cookie in its place. */
  cookieRedirect(url: URL): Response;
}

function cookieValue(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function createAuth(token: string, port: number): Auth {
  const hosts = [`${BIND}:${port}`, `${DISPLAY}:${port}`, `[::1]:${port}`];
  const origins = hosts.map((h) => `http://${h}`);
  const header = (req: Request) => req.headers.get(HEADER) === token;
  return {
    header,
    any: (req, url) =>
      url.searchParams.get("t") === token || cookieValue(req, COOKIE) === token || header(req),
    ownHost: (req) => hosts.includes((req.headers.get("host") ?? "").toLowerCase()),
    ownOrigin: (req) => {
      const origin = req.headers.get("origin");
      if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
      return origins.includes(origin.toLowerCase());
    },
    cookieRedirect: (url) => {
      url.searchParams.delete("t");
      return new Response(null, {
        status: 303,
        headers: {
          location: url.pathname + (url.search || ""),
          "set-cookie": `${COOKIE}=${token}; Path=/; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
          "cache-control": "no-store",
        },
      });
    },
  };
}
