// The version rule. A version is an agent publish: v1 is the first, v(n+1)
// the next republish. What the page sends back is a response to the version
// it was viewing — r1, r2 … under that version — and never a version of its
// own. The current island a reader sees is the version's island with the
// newest response laid over it.

import type { Island, Manifest, ResponseRecord } from "./types";

export const nextVersion = (m: Manifest | null): number => (m ? m.current + 1 : 1);

/** A response to `base` is stale when the artifact has moved past it. */
export const isStale = (base: number, current: number): boolean => base !== current;

export const nextResponse = (m: Manifest, version: number): number =>
  m.responses.filter((r) => r.version === version).length + 1;

export const responseName = (version: number, r: number): string => `v${version}-r${r}`;

/** The newest response to the current version, or null when the page has not answered it. */
export function latestResponse(m: Manifest, version = m.current): ResponseRecord | null {
  const mine = m.responses.filter((r) => r.version === version);
  return mine.length ? (mine[mine.length - 1] ?? null) : null;
}

/** The island a reader or the model sees: the response wins over the version. */
export function mergedIsland(version: Island | null, response: Island | null): Island | null {
  if (!response) return version;
  if (!version) return response;
  return { ...version, ...response };
}

/** How the version state reads: "v2" or "v2 · 1 reply". */
export function versionLabel(m: Manifest): string {
  const replies = m.responses.filter((r) => r.version === m.current).length;
  return replies
    ? `v${m.current} · ${replies} ${replies === 1 ? "reply" : "replies"}`
    : `v${m.current}`;
}
