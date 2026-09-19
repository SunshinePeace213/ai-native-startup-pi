// comments, reply, resolve — the threads viewers leave on a page. Only a
// thread the user sent to the agent accepts a reply; a terminal reply never
// reaches the page.

import { threadSummary } from "../../feedback";
import type { ActionContext } from "../context";
import { text, type ToolResult } from "../format";

const REPLY_MAX = 4096;

export async function comments(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const threads = await a.host.client.comments(slug);
  if (!threads.length) {
    return text("No comment threads yet. Viewers add them from the page's 💬 panel.", {
      action: a.action,
      slug,
    });
  }
  return text(
    [
      `${threads.length} thread${threads.length === 1 ? "" : "s"} on "${slug}" (only threads marked "sent to agent" accept reply):`,
      ...threads.map(threadSummary),
    ].join("\n"),
    { action: a.action, slug },
  );
}

export async function reply(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  if (!a.params.thread_id) throw new Error("reply needs thread_id");
  const body = a.params.text?.trim();
  if (!body) throw new Error("reply needs text");
  if (body.length > REPLY_MAX) throw new Error(`reply text is over ${REPLY_MAX} characters`);
  const thread = await a.host.client.reply(slug, a.params.thread_id, body);
  return text(`Replied on ${thread.id}; the page shows it.\n${threadSummary(thread)}`, {
    action: a.action,
    slug,
  });
}

export async function resolve(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  if (!a.params.thread_id) throw new Error("resolve needs thread_id");
  const thread = await a.host.client.resolve(slug, a.params.thread_id);
  return text(`Resolved ${thread.id}.`, { action: a.action, slug });
}
