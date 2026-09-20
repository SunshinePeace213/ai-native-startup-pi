// The content policies, sent as HTTP headers and never as <meta>: the stored
// document stays exactly what Claude Code stores.
//
// A page gets Claude Code's allowlist: inline script and eval, four script
// CDNs, inline style and Google Fonts, data/blob images, and fetch to its own
// origin only — which serves nothing but its own files. Only the shell may
// frame it. The shell runs no inline script or style, and frames only pages.
//
// Under `sandbox` isolation a page shares the shell's host, so its policy
// also sandboxes the document itself: opened outside the shell's iframe it
// still gets an opaque origin, never the shell's.

import { BIND, DISPLAY } from "../../domain/protocol";
import type { Isolation } from "../../domain/types";

/** What the shell's iframe allows a page: no downloads, no top navigation. */
const SANDBOX = [
  "allow-scripts",
  "allow-same-origin",
  "allow-forms",
  "allow-modals",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
];

/** The iframe's sandbox tokens; a page keeps its origin only when it has one of its own. */
export const frameSandbox = (isolation: Isolation): string =>
  SANDBOX.filter((token) => isolation === "origin" || token !== "allow-same-origin").join(" ");

const shellOrigins = (port: number) => `http://${DISPLAY}:${port} http://${BIND}:${port}`;

export function frameCsp(port: number, isolation: Isolation): string {
  const policy =
    "default-src 'none'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://cdn.tailwindcss.com https://code.jquery.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; " +
    `base-uri 'none'; form-action 'none'; frame-ancestors ${shellOrigins(port)}`;
  return isolation === "origin" ? policy : `${policy}; sandbox ${frameSandbox(isolation)}`;
}

/**
 * An uploaded SVG is an image and only that: sanitised when it was stored,
 * and — should it ever be opened as a document — run under a policy that
 * executes nothing, loads nothing and has no origin.
 */
export const IMAGE_CSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

export function shellCsp(port: number, isolation: Isolation): string {
  const frames = isolation === "origin" ? `http://*.${DISPLAY}:${port}` : "'self'";
  return (
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
    `connect-src 'self'; frame-src ${frames}; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
  );
}
