// Who may do what. Two capabilities, never one:
//
//   session   the token in .server/token, presented in a header by the pi
//             process only; it drives /api/*
//   viewer    the token in .server/viewer, presented once in ?t= and then
//             carried by an HttpOnly cookie; it reads pages and lets a page
//             respond on itself
//
// A page's own POST is authorised by the cookie (the script never sees it),
// the page's Origin, and a custom header naming the slug — which forces a
// CORS preflight that any other origin fails. The Host check defeats DNS
// rebinding. Both secrets are re-read from disk when a request presents a
// value that does not match, so a rotation never orphans a running server.

import { BIND, DISPLAY, PAGE_HEADER, SESSION_HEADER, VIEWER_COOKIE } from "../../domain/protocol";
import { fileStamp, readToken, readViewer, tokenPath, viewerPath } from "../store/control";

/** A year: the viewer token is per project and long-lived, so the clean URL keeps working. */
const COOKIE_MAX_AGE = 365 * 24 * 3600;

export interface Auth {
  session(req: Request): boolean;
  viewer(req: Request, url: URL): boolean;
  /** The page at `slug` posting to itself. */
  page(req: Request, slug: string): boolean;
  ownHost(req: Request): boolean;
  ownOrigin(req: Request): boolean;
  /** Strips `?t=` from the address and sets the cookie in its place. */
  cookieRedirect(url: URL): Response;
  /** The current secrets, for the record and the health digest. */
  token(): string;
  viewerToken(): string;
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

/** A secret read from a control file, re-read when the file changed. */
class Secret {
  private value: string;
  private stamp: number;

  constructor(
    private readonly path: string,
    private readonly read: () => string | null,
    initial: string,
  ) {
    this.value = initial;
    this.stamp = fileStamp(path);
  }

  current(): string {
    return this.value;
  }

  /** True when `presented` is the secret, after a refresh if the file moved on. */
  matches(presented: string | null): boolean {
    if (presented === null || presented === "") return false;
    if (presented === this.value) return true;
    const stamp = fileStamp(this.path);
    if (stamp === this.stamp) return false;
    const fresh = this.read();
    if (fresh) {
      this.value = fresh;
      this.stamp = stamp;
    }
    return presented === this.value;
  }
}

export interface AuthOptions {
  root: string;
  port: number;
  token: string;
  viewer: string;
}

export function createAuth(options: AuthOptions): Auth {
  const hosts = [`${BIND}:${options.port}`, `${DISPLAY}:${options.port}`];
  const origins = hosts.map((h) => `http://${h}`);
  const session = new Secret(tokenPath(options.root), () => readToken(options.root), options.token);
  const viewer = new Secret(
    viewerPath(options.root),
    () => readViewer(options.root),
    options.viewer,
  );
  const ownOrigin = (req: Request) => {
    const origin = req.headers.get("origin");
    if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
    return origins.includes(origin.toLowerCase());
  };
  return {
    session: (req) => session.matches(req.headers.get(SESSION_HEADER)),
    viewer: (req, url) =>
      viewer.matches(url.searchParams.get("t")) || viewer.matches(cookieValue(req, VIEWER_COOKIE)),
    page: (req, slug) =>
      viewer.matches(cookieValue(req, VIEWER_COOKIE)) &&
      req.headers.get(PAGE_HEADER) === slug &&
      ownOrigin(req),
    ownHost: (req) => hosts.includes((req.headers.get("host") ?? "").toLowerCase()),
    ownOrigin,
    cookieRedirect: (url) => {
      url.searchParams.delete("t");
      return new Response(null, {
        status: 303,
        headers: {
          location: url.pathname + (url.search || ""),
          "set-cookie": `${VIEWER_COOKIE}=${viewer.current()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
          "cache-control": "no-store",
        },
      });
    },
    token: () => session.current(),
    viewerToken: () => viewer.current(),
  };
}
