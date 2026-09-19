// Names both sides of the HTTP contract share. The pi side imports this and
// never server.ts, so nothing that references Bun is loaded inside pi.

/** The cookie the browser carries after its first tokened GET. */
export const COOKIE = "artifact_token";
/** The header every POST and every /api request carries. */
export const HEADER = "x-artifact-token";
/** Pages live under this path: /a/<slug>. */
export const PREFIX = "/a";
