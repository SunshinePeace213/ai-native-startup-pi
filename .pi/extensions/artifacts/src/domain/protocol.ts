// The HTTP contract both processes and the page agree on: names, paths, the
// slug rule, and the two capabilities.
//
//   viewer   a cookie the browser carries; reads pages and sends on its own page
//   session  a header only the pi process sends; drives /api/*
//
// The page's script holds no secret: its POSTs are authorised by the HttpOnly
// viewer cookie, the page's own Origin, and a custom header naming the slug
// (which forces a preflight any other origin fails).

/** The HttpOnly cookie the browser carries after its first tokened GET. */
export const VIEWER_COOKIE = "artifact_viewer";
/** The session token header, on every /api request. */
export const SESSION_HEADER = "x-artifact-token";
/** The session id header, on every /api request, for routing and logs. */
export const SESSION_ID_HEADER = "x-artifact-session";
/** The page names itself on every POST it makes. */
export const PAGE_HEADER = "x-artifact-page";
/** Bound address; printed URLs say `localhost`, which every browser maps to loopback. */
export const BIND = "127.0.0.1";
export const DISPLAY = "localhost";
/** Pages live under this path: /a/<slug>. */
export const PREFIX = "/a";
/** The session-facing API lives under this path. */
export const API_PREFIX = "/api";

/** A slug: lowercase letters, digits, and hyphens, starting with a letter or digit. */
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** The store, relative to the project: where artifacts live and where pages are authored. */
export const STORE_DIR = ".pi/artifacts";
/** Inside an artifact's folder: the server's files, beside the page the agent authors. */
export const STORE_SUBDIR = ".store";

/** The artifact is its folder: a page authored at <STORE_DIR>/<slug>/<file> publishes to that slug. */
export function slugForSourcePath(sourcePath: string): string | null {
  const parts = sourcePath.split("\\").join("/").split("/");
  const [pi, artifacts] = STORE_DIR.split("/");
  if (parts.length !== 4 || parts[0] !== pi || parts[1] !== artifacts) return null;
  return SLUG_RE.test(parts[2] as string) ? (parts[2] as string) : null;
}

export const pagePath = (slug: string) => `${PREFIX}/${slug}`;
export const galleryPath = () => `${PREFIX}/`;

/** The page URL, with the viewer token that sets the cookie on first open. */
export const pageUrl = (origin: string, slug: string, viewer?: string) =>
  `${origin}${pagePath(slug)}${viewer ? `?t=${encodeURIComponent(viewer)}` : ""}`;
export const galleryUrl = (origin: string, viewer: string) =>
  `${origin}${galleryPath()}?t=${encodeURIComponent(viewer)}`;

/**
 * Reads a slug out of what the model or the user passed: a slug, a path, or
 * a page URL from this host. Null when the shape is not a slug at all.
 */
export function slugFromRef(ref: string): string | null {
  let candidate = ref.trim();
  if (/^https?:\/\//i.test(candidate)) {
    try {
      candidate = new URL(candidate).pathname;
    } catch {
      return null;
    }
  }
  candidate = candidate.replace(/^\/+/, "");
  const prefix = PREFIX.slice(1) + "/";
  if (candidate.startsWith(prefix)) candidate = candidate.slice(prefix.length);
  candidate = candidate.split(/[/?#]/)[0] ?? "";
  return SLUG_RE.test(candidate) ? candidate : null;
}
