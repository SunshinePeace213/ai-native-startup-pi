// The plain pages the shell host writes: the gallery, and what a browser
// sees without a token or for a slug that does not exist. They share the
// shell's stylesheet and theme, and run under the shell policy.

import { iconGlyph } from "../../../domain/icons";
import { galleryPath, pagePath } from "../../../domain/protocol";
import type { Manifest } from "../../../domain/types";
import { versionLabel } from "../../../domain/versioning";
import { escapeHtml } from "../respond";
import { shellDocument } from "./shell";

const plain = (title: string, body: string) =>
  shellDocument({ title, bodyClass: "plain", body: `<main class="sheet">${body}</main>` });

export const unauthorizedPage = () =>
  plain(
    "Artifact — link needed",
    `<h1>This artifact needs its link</h1>
<p>Open it from the footer badge in pi (its link carries the viewer token), or run <code>/artifacts</code> in pi and pick it there.</p>`,
  );

export const notFoundPage = () =>
  plain(
    "No such artifact",
    `<h1>No such artifact</h1><p><a href="${galleryPath()}">All artifacts</a></p>`,
  );

export function galleryPage(rows: Manifest[]): string {
  const sorted = [...rows].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const items = sorted.length
    ? sorted
        .map((m) => {
          const facts = [
            pagePath(m.slug),
            versionLabel(m),
            m.updatedAt.slice(0, 16).replace("T", " "),
            ...(m.description ? [m.description] : []),
          ];
          return (
            `<li><a href="${pagePath(m.slug)}">${iconGlyph(m.icon)} ${escapeHtml(m.title)}</a>${m.pinned ? " 📌" : ""}` +
            `<div class="muted">${facts.map(escapeHtml).join(" · ")}</div></li>`
          );
        })
        .join("")
    : `<li class="muted">No artifacts yet.</li>`;
  return plain("Artifacts", `<h1>Artifacts</h1><ul class="gallery">${items}</ul>`);
}
