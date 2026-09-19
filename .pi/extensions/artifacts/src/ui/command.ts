// /artifacts — the user's own door to the pages:
//
//   /artifacts               the gallery: search, tabs, enter attaches a page to this
//                            session, o opens, c copies, p pins, w toggles wakes, d deletes;
//                            without a UI, the list as text
//   /artifacts <slug>        open that page (a URL or path works too)
//   /artifacts pin <slug>    exempt it from retention; `unpin` reverses
//   /artifacts sweep         run the retention sweep now
//   /artifacts stop          end the server process; the next session start or publish restarts it
//   /artifacts restart       end it and start a fresh one now; pages and held replies are on disk

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { copyToClipboard } from "@earendil-works/pi-coding-agent";
import { type KeyId, matchesKey } from "@earendil-works/pi-tui";

import type { Manifest } from "../domain/types";
import { versionLabel } from "../domain/versioning";
import { Gallery, type GalleryAction } from "./gallery";
import type { Host } from "./host";

/** What a key in the gallery does; resolves to the line shown under the list. */
async function act(host: Host, action: GalleryAction, m: Manifest): Promise<string | void> {
  if (action === "attach") {
    await host.attach(m.slug);
    return;
  }
  if (action === "open") {
    const error = await host.open(m.slug);
    return error ? `Could not open the browser: ${error}` : `Opened "${m.title}".`;
  }
  if (action === "copy") {
    await copyToClipboard(host.url(m.slug));
    return `Copied the link to "${m.title}".`;
  }
  if (action === "pin") {
    await host.client.pin(m.slug, !m.pinned);
    return `${m.pinned ? "Unpinned" : "Pinned"} "${m.title}".`;
  }
  if (action === "watch") {
    const next = await host.client.watch(m.slug, !m.watched);
    if (next.watched) host.remember(next);
    return next.watched
      ? `"${m.title}" wakes this session again.`
      : `"${m.title}" no longer wakes a session; its sends are still stored.`;
  }
  const dest = await host.client.remove(m.slug);
  host.forget(m.slug);
  return `Moved "${m.title}" to ${dest}.`;
}

export interface CommandDeps {
  hostFor: (cwd: string, session: string) => Host;
  forgetHost: (cwd: string) => void;
}

export function registerCommand(pi: ExtensionAPI, deps: CommandDeps): void {
  pi.registerCommand("artifacts", {
    description:
      "Browse this project's artifact pages and attach one; pin/unpin, sweep, stop or restart the server",
    handler: async (args, ctx) => {
      const host = deps.hostFor(ctx.cwd, ctx.sessionManager.getSessionId());
      const [verb, rest] = (args ?? "").trim().split(/\s+/, 2) as [
        string | undefined,
        string | undefined,
      ];
      if (verb === "stop") {
        await host.shutdown(true);
        deps.forgetHost(ctx.cwd);
        ctx.ui.notify(
          "Artifact server stopped; the next session start or publish starts it again.",
          "info",
        );
        return;
      }
      if (verb === "restart") {
        try {
          const endpoint = await host.restart();
          ctx.ui.notify(`Artifact server restarted on ${endpoint.origin}.`, "info");
        } catch (e) {
          ctx.ui.notify(`artifacts: ${(e as Error).message}`, "warning");
        }
        return;
      }
      try {
        await host.start();
      } catch (e) {
        ctx.ui.notify(`artifacts: ${(e as Error).message}`, "warning");
        return;
      }
      if (verb === "sweep") {
        const swept = await host.client.sweep();
        ctx.ui.notify(
          `Swept ${swept.artifacts.length} expired artifact(s) and ${swept.logs.length} log folder(s).`,
          "info",
        );
        return;
      }
      if (verb === "pin" || verb === "unpin") {
        const slug = await host.resolveSlug(rest);
        if (!slug) return ctx.ui.notify(`No artifact matches "${rest ?? ""}".`, "warning");
        const m = await host.client.pin(slug, verb === "pin");
        ctx.ui.notify(`${verb === "pin" ? "Pinned" : "Unpinned"} "${m.title}".`, "info");
        return;
      }
      const all = await host.client.list();
      if (!all.length) {
        ctx.ui.notify("No artifacts yet — ask the agent to publish one.", "info");
        return;
      }
      const openOne = async (slug: string) => {
        const error = await host.open(slug);
        if (error) ctx.ui.notify(`Could not open the browser: ${error}`, "warning");
      };
      if (verb) {
        const slug = await host.resolveSlug(verb);
        if (!slug) return ctx.ui.notify(`No artifact matches "${verb}".`, "warning");
        return openOne(slug);
      }
      if (!ctx.hasUI) {
        const sorted = [...all].sort((a, b) => Number(b.pinned) - Number(a.pinned));
        const rows = sorted.map(
          (m) =>
            `${m.slug} — ${m.title} (${versionLabel(m)}${m.pinned ? ", pinned" : ""}${m.owner === host.session ? ", mine" : ""}${m.pending.length ? `, ${m.pending.length} pending` : ""})`,
        );
        ctx.ui.notify(rows.join("\n"), "info");
        return;
      }
      const attached = await ctx.ui.custom<string | null>((tui, theme, _keys, done) => {
        let picked: string | null = null;
        const gallery = new Gallery({
          session: host.session,
          load: () => host.client.list(),
          act: async (action, m) => {
            const notice = await act(host, action, m);
            if (action === "attach") picked = m.title;
            return notice;
          },
          done: () => done(picked),
          requestRender: () => tui.requestRender(),
          paint: {
            accent: (t) => theme.fg("accent", t),
            dim: (t) => theme.fg("dim", t),
            warn: (t) => theme.fg("warning", t),
            bold: (t) => theme.bold(t),
            selected: (t) => theme.bg("selectedBg", t),
          },
          matches: (data, key) => matchesKey(data, key as KeyId),
        });
        void gallery.refresh();
        return gallery;
      });
      if (attached) ctx.ui.notify(`Attached "${attached}" to this session.`, "info");
    },
  });
}
