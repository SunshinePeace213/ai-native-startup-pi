// watch, unwatch — whether a send from the page wakes a session. Sends are
// stored either way; unwatch only silences delivery.

import type { ActionContext } from "../context";
import { text, type ToolResult } from "../format";

export async function watch(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const m = await a.host.client.watch(slug, true);
  const pending = m.pending.length
    ? ` ${m.pending.length} pending send(s) are on disk; read_page_data shows the current island.`
    : "";
  return text(
    `Watching "${m.title}": a send or a comment sent to the agent wakes this session.${pending}`,
    {
      action: a.action,
      slug,
    },
  );
}

export async function unwatch(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const m = await a.host.client.watch(slug, false);
  return text(
    `Stopped watching "${m.title}": nothing from that page wakes this session until watch is called again; read_page_data still reads it.`,
    { action: a.action, slug },
  );
}
