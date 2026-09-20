// The HTTP contract both processes and the browser agree on: names, paths,
// the slug rule, the two kinds of host, and the capabilities.
//
//   viewer   a cookie the browser carries on the shell host; it reads the
//            viewer shell and lets the shell act on a page's behalf
//   session  a header only the pi process sends; drives /api/*
//   cap      a digest of the viewer secret and the slug, carried in the frame
//            path (/_f/<cap>/<n>/): the frame needs no cookie, and every
//            relative URL in the page inherits it
//
// The shell host (localhost:<port>) serves the gallery, the viewer shell and
// the API. Each page is framed from an origin of its own,
// <slug>.localhost:<port>, which serves that page's files, what it uploaded
// and the runtime, and nothing else — so a slug is also a DNS label. The
// page's script holds no secret and reaches the server only through the
// shell, over postMessage.

/** The HttpOnly cookie the browser carries after its first tokened GET. */
export const VIEWER_COOKIE = "artifact_viewer";
/** The session token header, on every /api request. */
export const SESSION_HEADER = "x-artifact-token";
/** The session id header, on every /api request, for routing and logs. */
export const SESSION_ID_HEADER = "x-artifact-session";
/** Bound address; printed URLs say `localhost`, which every browser maps to loopback. */
export const BIND = "127.0.0.1";
export const DISPLAY = "localhost";
/** The viewer shell and the gallery live under this path: /a/<slug>. */
export const PREFIX = "/a";
/** The session-facing API lives under this path. */
export const API_PREFIX = "/api";
/** A page's files, on its frame host: /_f/<cap>/<version>/. */
export const FRAME_PREFIX = "/_f";
/** The page runtime and what it loads, on a frame host. */
export const RUNTIME_PREFIX = "/_rt";
/** What a page uploaded, on its frame host, whatever the version: /_blob/<id>. */
export const BLOB_PREFIX = "/_blob";

/** A slug is a DNS label: lowercase letters, digits, and inner hyphens, at most 63 characters. */
export const SLUG_PATTERN = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
export const SLUG_RE = new RegExp(`^${SLUG_PATTERN}$`);

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

/** The Host a page's frame is served from. */
export const frameHost = (slug: string, port: number) => `${slug}.${DISPLAY}:${port}`;
/** Where one version's document sits on its frame host; its supporting files resolve under it. */
export const framePath = (cap: string, version: number) => `${FRAME_PREFIX}/${cap}/${version}/`;

/** The slug a Host names when it is a frame host on this port; null for any other host. */
export function slugFromFrameHost(host: string, port: number): string | null {
  const suffix = `.${DISPLAY}:${port}`;
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  return SLUG_RE.test(label) ? label : null;
}

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
