// Who may do what, and on which host. Three capabilities, never one:
//
//   session   the token in .server/token, presented in a header by the pi
//             process only; it drives /api/*
//   viewer    the token in .server/viewer, presented once in ?t= and then
//             carried by an HttpOnly cookie on the shell host; it reads the
//             viewer shell and lets the shell act on a page's behalf
//   cap       HMAC(viewer, slug), in the path of a page's frame; the frame
//             carries no cookie, so third-party-cookie blocking cannot break it
//
// A shell POST is authorised by the cookie and an Origin that is the shell
// host's own. A page's script runs on its frame origin (or an opaque one),
// so nothing it sends can pass: its Origin is never the shell's. The Host
// check defeats DNS rebinding and tells the shell host from a frame host.
// Both secrets are re-read from disk when a request presents a value that
// does not match, so a rotation never orphans a running server.

import { createHmac } from "node:crypto";

import {
  BIND,
  DISPLAY,
  SESSION_HEADER,
  slugFromFrameHost,
  VIEWER_COOKIE,
} from "../../domain/protocol";
import { fileStamp, readToken, readViewer, tokenPath, viewerPath } from "../store/control";

/** A year: the viewer token is per project and long-lived, so the clean URL keeps working. */
const COOKIE_MAX_AGE = 365 * 24 * 3600;
const CAP_LENGTH = 32;

/** Which of this server's hosts a request names. */
export type RequestHost = { kind: "shell" } | { kind: "frame"; slug: string };

export interface Auth {
  session(req: Request): boolean;
  viewer(req: Request, url: URL): boolean;
  /** The viewer shell acting on a page's behalf: the cookie and the shell host's own Origin. */
  shell(req: Request): boolean;
  /** The shell host, a page's frame host, or null for a Host that is not this server's. */
  host(req: Request): RequestHost | null;
  /** The path capability of a slug's frame. */
  cap(slug: string): string;
  capMatches(slug: string, presented: string): boolean;
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

  /** Re-reads the file when it moved on; true when the secret changed. */
  refresh(): boolean {
    const stamp = fileStamp(this.path);
    if (stamp === this.stamp) return false;
    const fresh = this.read();
    if (!fresh) return false;
    this.stamp = stamp;
    if (fresh === this.value) return false;
    this.value = fresh;
    return true;
  }

  /** True when `presented` is the secret, after a refresh if the file moved on. */
  matches(presented: string | null): boolean {
    if (presented === null || presented === "") return false;
    if (presented === this.value) return true;
    return this.refresh() && presented === this.value;
  }
}

export interface AuthOptions {
  root: string;
  port: number;
  token: string;
  viewer: string;
}

export function createAuth(options: AuthOptions): Auth {
  const shellHosts = [`${BIND}:${options.port}`, `${DISPLAY}:${options.port}`];
  const shellOrigins = shellHosts.map((h) => `http://${h}`);
  const session = new Secret(tokenPath(options.root), () => readToken(options.root), options.token);
  const viewer = new Secret(
    viewerPath(options.root),
    () => readViewer(options.root),
    options.viewer,
  );
  const cap = (slug: string) =>
    createHmac("sha256", viewer.current()).update(slug).digest("hex").slice(0, CAP_LENGTH);
  return {
    session: (req) => session.matches(req.headers.get(SESSION_HEADER)),
    viewer: (req, url) =>
      viewer.matches(url.searchParams.get("t")) || viewer.matches(cookieValue(req, VIEWER_COOKIE)),
    shell: (req) =>
      viewer.matches(cookieValue(req, VIEWER_COOKIE)) &&
      shellOrigins.includes((req.headers.get("origin") ?? "").toLowerCase()),
    host: (req) => {
      const host = (req.headers.get("host") ?? "").toLowerCase();
      if (shellHosts.includes(host)) return { kind: "shell" };
      const slug = slugFromFrameHost(host, options.port);
      return slug ? { kind: "frame", slug } : null;
    },
    cap,
    capMatches: (slug, presented) =>
      presented === cap(slug) || (viewer.refresh() && presented === cap(slug)),
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
