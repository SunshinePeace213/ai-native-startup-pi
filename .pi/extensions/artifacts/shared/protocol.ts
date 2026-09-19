// The HTTP contract both processes and the page agree on: names, paths, and
// the slug rule. No runtime API; the session imports this and never server/.

/** The cookie the browser carries after its first tokened GET. */
export const COOKIE = "artifact_token";
/** The header every POST and every /api request carries. */
export const HEADER = "x-artifact-token";
/** Pages live under this path: /a/<slug>. */
export const PREFIX = "/a";
/** The session-facing API lives under this path. */
export const API_PREFIX = "/api";

/** A slug: lowercase letters, digits, and hyphens, starting with a letter or digit. */
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const pagePath = (slug: string) => `${PREFIX}/${slug}`;
export const galleryPath = () => `${PREFIX}/`;

/** The page URL, with the token that sets the cookie on first open. */
export const pageUrl = (origin: string, slug: string, token?: string) =>
  `${origin}${pagePath(slug)}${token ? `?t=${encodeURIComponent(token)}` : ""}`;
export const galleryUrl = (origin: string, token: string) =>
  `${origin}${galleryPath()}?t=${encodeURIComponent(token)}`;

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
