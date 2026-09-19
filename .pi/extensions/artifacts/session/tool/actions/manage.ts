// open — the browser, on an existing page.
// delete — after the user confirms in the terminal; the folder goes to the trash.

import type { ActionContext } from "../context";
import { text, type ToolResult } from "../format";

export async function open(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const error = await a.host.open(slug);
  const url = a.host.url(slug);
  return text(
    error ? `Could not open the browser (${error}); give the user ${url}` : `Opened ${url}`,
    {
      action: a.action,
      slug,
      url,
    },
  );
}

export async function remove(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const { manifest: m } = await a.read(slug);
  if (!a.ctx.hasUI) {
    throw new Error(
      "delete needs the user's confirmation in the terminal; nobody can answer here, so nothing was deleted",
    );
  }
  const versions = `${m.versions.length} version${m.versions.length === 1 ? "" : "s"}`;
  const ok = await a.ctx.ui.confirm(
    "Delete artifact",
    `Move "${m.title}" (${slug}, ${versions}) to the trash? Its URL stops working.`,
  );
  if (!ok) return text(`The user declined; "${slug}" stays published.`, { action: a.action, slug });
  const dest = await a.host.client.remove(slug);
  return text(`Deleted "${m.title}"; its folder was moved to ${dest}. The URL no longer works.`, {
    action: a.action,
    slug,
  });
}
