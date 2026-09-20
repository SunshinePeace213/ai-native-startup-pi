// The viewer shell: the page the server writes around every artifact. The
// artifact itself is framed from its own origin; the shell draws everything
// else — the header (gallery link, title menu, version picker, theme,
// session dot, comments), the floating comments button and its panel, the
// Send bar, the "page changed" banner, and the prompt that asks before a page
// saves a file — so none of it lives in the page's document and none of it
// can be forged by the page's script.
//
// The markup is static and carries no inline script or style (the shell
// policy forbids both); src/shell/shell.js brings it to life from the boot
// block. Everything that comes from a manifest is escaped.

import { galleryPath } from "../../../domain/protocol";
import { iconGlyph } from "../../../domain/icons";
import type { ViewerState } from "../../../domain/types";
import { escapeHtml } from "../respond";

export const SHELL_SCRIPT = "/a/_shell.js";
export const SHELL_STYLES = "/a/_shell.css";

/** JSON safe to place inside a <script> data block. */
const blockJson = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

function favicon(icon: string | undefined): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${iconGlyph(icon)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Every page the shell host writes: the shell's stylesheet, its script (which stamps the theme), a tab icon. */
export function shellDocument(options: {
  title: string;
  icon?: string;
  bodyClass: string;
  body: string;
}): string {
  return [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeHtml(options.title)}</title>`,
    `<link rel="icon" href="${favicon(options.icon)}">`,
    `<link rel="stylesheet" href="${SHELL_STYLES}">`,
    `<script src="${SHELL_SCRIPT}"></script>`,
    "</head>",
    `<body class="${options.bodyClass}">`,
    options.body,
    "</body>",
    "</html>",
  ].join("\n");
}

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICON_GALLERY = svg(
  `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`,
);
const ICON_CHEVRON = svg(`<path d="m6 9 6 6 6-6"/>`);
const ICON_COMMENTS = svg(
  `<path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12Z"/><path d="M8.5 10.5h7M8.5 14h4.5"/>`,
);

export interface ViewerInput {
  state: ViewerState;
  /** The version the address pins, or null to follow the latest. */
  pinned: number | null;
  /** `<frame origin>/_f/<cap>/`; the shell script completes it with a version. */
  frameBase: string;
  /** The origin the frame's messages carry: its own, or "null" when it is sandboxed out of one. */
  frameOrigin: string;
  sandbox: string;
}

export function viewerPage(input: ViewerInput): string {
  const { state } = input;
  const title = escapeHtml(state.title);
  const boot = {
    slug: state.slug,
    pinned: input.pinned,
    frameBase: input.frameBase,
    frameOrigin: input.frameOrigin,
    state,
  };
  const body = `<header class="bar">
<a class="bar-icon" href="${galleryPath()}" title="All artifacts" aria-label="All artifacts">${ICON_GALLERY}</a>
<div class="menu">
<button type="button" id="title-button" class="bar-title" aria-haspopup="menu" aria-expanded="false" aria-controls="title-menu"><span id="title-text" class="bar-title-text">${title}</span>${ICON_CHEVRON}</button>
<div id="title-menu" class="menu-list" role="menu" hidden>
<button type="button" role="menuitem" data-action="rename">Rename</button>
<button type="button" role="menuitem" data-action="duplicate">Duplicate</button>
<button type="button" role="menuitem" data-action="refresh">Refresh</button>
<button type="button" role="menuitem" data-action="pin" id="pin-item">Pin</button>
<a role="menuitem" href="${galleryPath()}">All artifacts</a>
<button type="button" role="menuitem" data-action="delete" class="danger">Delete</button>
</div>
</div>
<div class="bar-tools">
<select id="version-picker" class="bar-select" aria-label="Version"></select>
<select id="theme-picker" class="bar-select" aria-label="Theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
<span id="session-dot" class="dot" role="img" aria-label="Session"></span>
<button type="button" id="comments-toggle" class="bar-icon" title="Comments" aria-label="Comments" aria-controls="comments-panel" aria-expanded="false">${ICON_COMMENTS}</button>
</div>
</header>
<main id="stage" class="stage">
<iframe id="frame" class="frame" title="${title}" sandbox="${input.sandbox}" data-base="${escapeHtml(input.frameBase)}"></iframe>
<div id="banner" class="banner" role="status" hidden><span id="banner-text"></span><button type="button" id="banner-action"></button><button type="button" id="banner-close" aria-label="Dismiss">✕</button></div>
<section id="comments-panel" class="panel" aria-label="Comments" hidden>
<h2>Comments</h2>
<div id="threads"></div>
<form id="composer" class="thread">
<textarea id="comment-text" class="field" rows="2" placeholder="Leave a comment for the agent…" aria-label="Comment"></textarea>
<input id="comment-anchor" class="field" type="text" placeholder="About (optional): a heading, a question id…" aria-label="About">
<div class="row"><label><input id="comment-to-agent" type="checkbox" checked> send to agent (wakes the session)</label><button type="submit" class="button primary">Post</button></div>
</form>
</section>
<button type="button" id="fab" class="fab" title="Comments" aria-label="Comments" aria-controls="comments-panel" aria-expanded="false">💬<span id="fab-count" class="fab-count" hidden>0</span></button>
</main>
<footer id="send-bar" class="send-bar" hidden><span id="send-status" class="send-status" role="status"></span><span id="send-version" class="muted"></span><button type="button" id="send-button" class="button primary" disabled>Send to agent</button></footer>
<dialog id="rename-dialog" class="dialog" aria-labelledby="rename-heading">
<form id="rename-form">
<h2 id="rename-heading">Rename</h2>
<input id="rename-input" class="field" type="text" maxlength="200" aria-label="Title">
<div class="row end"><button type="button" class="button" data-close>Cancel</button><button type="submit" class="button primary">Rename</button></div>
</form>
</dialog>
<dialog id="delete-dialog" class="dialog" aria-labelledby="delete-heading">
<h2 id="delete-heading">Delete this artifact?</h2>
<p>Its folder moves to the Trash and this address stops working.</p>
<div class="row end"><button type="button" class="button" data-close>Cancel</button><button type="button" id="delete-confirm" class="button danger">Delete</button></div>
</dialog>
<dialog id="save-dialog" class="dialog" aria-labelledby="save-heading">
<h2 id="save-heading">Save this file?</h2>
<p>The page offers <strong id="save-name"></strong> <span id="save-size"></span>. It is saved only if you accept.</p>
<div class="row end"><button type="button" class="button" data-close>Don't save</button><button type="button" id="save-confirm" class="button primary">Save</button></div>
</dialog>
<script type="application/json" id="viewer-boot">${blockJson(boot)}</script>`;
  return shellDocument({ title: state.title, icon: state.icon, bodyClass: "viewer", body });
}
