// The pages the server writes itself: the gallery, and what a browser sees
// without a token or for a slug that does not exist.

import { galleryPath, pagePath } from "../../../domain/protocol";
import type { Manifest } from "../../../domain/types";
import { versionLabel } from "../../../domain/versioning";
import { escapeHtml } from "../respond";

const PAGE_STYLE =
  "font:16px system-ui,-apple-system,sans-serif;max-width:640px;margin:80px auto;padding:0 24px;color:#1b1f24;line-height:1.5";

const shell = (title: string, body: string) =>
  `<!doctype html><meta charset="utf-8"><title>${escapeHtml(title)}</title><meta name="viewport" content="width=device-width, initial-scale=1">\n<body style="${PAGE_STYLE}">${body}</body>`;

export const unauthorizedPage = () =>
  shell(
    "Artifact — link needed",
    `<h1 style="font-size:1.4rem">This artifact needs its link</h1>
<p>Open it from the footer badge in pi (it carries a one-time token), or run <code>/artifacts</code> in pi and pick it there.</p>`,
  );

export const notFoundPage = () =>
  shell(
    "No such artifact",
    `<h1 style="font-size:1.4rem">No such artifact</h1><p><a href="${galleryPath()}">All artifacts</a></p>`,
  );

export function galleryPage(rows: Manifest[]): string {
  const sorted = [...rows].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const items = sorted.length
    ? sorted
        .map(
          (m) =>
            `<li style="padding:10px 0;border-top:1px solid #e3e6ea"><a href="${pagePath(m.slug)}" style="font-weight:600;color:#3b5bdb">${escapeHtml(m.icon ? `${m.icon} ` : "")}${escapeHtml(m.title)}</a>${m.pinned ? " 📌" : ""}` +
            `<div style="color:#5b6470;font-size:.9rem">${pagePath(m.slug)} · ${escapeHtml(versionLabel(m))} · ${escapeHtml(m.updatedAt.slice(0, 16).replace("T", " "))}${m.description ? ` · ${escapeHtml(m.description)}` : ""}</div></li>`,
        )
        .join("")
    : `<li style="color:#5b6470">No artifacts yet.</li>`;
  return shell(
    "Artifacts",
    `<h1 style="font-size:1.4rem">Artifacts</h1><ul style="list-style:none;padding:0;margin:0">${items}</ul>`,
  );
}
