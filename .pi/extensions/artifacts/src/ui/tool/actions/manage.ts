// open   — the browser, on an existing page.
// watch / unwatch — whether a send from the page wakes this session; watching
//          from another session adopts the artifact. Sends are stored either way.
// pin / unpin — exempt from retention, first in the gallery.
// delete — after the user confirms in the terminal; the folder goes to the trash.

import type { ActionContext } from "../context";
import { text, type ToolResult } from "../format";

export async function open(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const error = await a.host.open(slug);
  const url = a.host.url(slug, false);
  return text(
    error
      ? `Could not open the browser (${error}); the footer strip shows the page — tell the user to click it or press alt+a. URL for reference: ${url}`
      : `Opened the page in the browser; do not paste its URL, the footer strip shows it.`,
    { action: a.action, slug, url, summary: error ? "browser failed" : "opened" },
  );
}

export async function watch(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const m = await a.host.client.watch(slug, true);
  a.host.remember(m);
  const pending = m.pending.length
    ? ` ${m.pending.length} pending event(s) are on disk; read_page_data shows the current island.`
    : "";
  return text(
    `Watching "${m.title}": this session now owns it, so a send or a comment sent to the agent wakes it.${pending}`,
    { action: a.action, slug, title: m.title, summary: "watching" },
  );
}

export async function unwatch(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const m = await a.host.client.watch(slug, false);
  return text(
    `Stopped watching "${m.title}": nothing from that page wakes a session until watch is called again; read_page_data still reads it.`,
    { action: a.action, slug, title: m.title, summary: "unwatched" },
  );
}

export async function pin(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const m = await a.host.client.pin(slug, true);
  return text(
    `Pinned "${m.title}": it is exempt from the ${a.config.retentionDays}-day retention and listed first.`,
    {
      action: a.action,
      slug,
      title: m.title,
      summary: "pinned",
    },
  );
}

export async function unpin(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const m = await a.host.client.pin(slug, false);
  return text(
    `Unpinned "${m.title}": it expires ${a.config.retentionDays} days after its last activity like any other page.`,
    {
      action: a.action,
      slug,
      title: m.title,
      summary: "unpinned",
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
  if (!ok)
    return text(`The user declined; "${slug}" stays published.`, {
      action: a.action,
      slug,
      summary: "declined",
    });
  const dest = await a.host.client.remove(slug);
  a.host.forget(slug);
  return text(`Deleted "${m.title}"; its folder was moved to ${dest}. The URL no longer works.`, {
    action: a.action,
    slug,
    title: m.title,
    summary: "moved to trash",
  });
}
