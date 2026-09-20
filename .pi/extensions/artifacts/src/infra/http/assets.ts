// The static files the server hands a browser: the viewer shell's script and
// stylesheet, the page runtime, and mermaid from node_modules. Each is read
// once, on first request — a server older than its source is replaced by the
// launcher, so a cached copy is never stale.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const own = (path: string) => () => fileURLToPath(new URL(`../../${path}`, import.meta.url));

const ASSETS = {
  "shell.js": { path: own("shell/shell.js"), type: "text/javascript; charset=utf-8" },
  "shell.css": { path: own("shell/shell.css"), type: "text/css; charset=utf-8" },
  "claude.js": { path: own("page/claude.js"), type: "text/javascript; charset=utf-8" },
  "mermaid.js": {
    path: () => createRequire(import.meta.url).resolve("mermaid/dist/mermaid.min.js"),
    type: "text/javascript; charset=utf-8",
  },
} as const;

export type AssetName = keyof typeof ASSETS;

const cache = new Map<AssetName, Buffer>();

/** The file as a response; 404 when it is not installed (mermaid is a dependency, not a source file). */
export function asset(name: AssetName): Response {
  let body = cache.get(name);
  if (!body) {
    try {
      body = readFileSync(ASSETS[name].path());
    } catch {
      return new Response(`${name} is not available`, { status: 404 });
    }
    cache.set(name, body);
  }
  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "content-type": ASSETS[name].type,
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}
