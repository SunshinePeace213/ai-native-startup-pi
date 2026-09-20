// /artifacts — the user's own door to the pages:
//
//   /artifacts               the panel, as Claude Code draws its own: search, tabs, enter
//                            attaches a page to this session, x dismisses it from the footer,
//                            c copies its URL, ctrl+r renames, d deletes, p pins (o opens and
//                            w toggles wakes, unadvertised); without a UI, the list as text
//   /artifacts status        the panel on its Status tab: the server, its store, who is
//                            connected, this session's settings; without a UI, the same rows
//                            as text. It opens even when the server cannot be reached, and
//                            says why
//   /artifacts <slug>        open that page (a URL or path works too)
//   /artifacts pin <slug>    exempt it from retention; `unpin` reverses
//   /artifacts sweep         run the retention sweep now
//   /artifacts stop          end the server process; the next session start or publish restarts it
//   /artifacts restart       end it and start a fresh one now; pages and held replies are on disk

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { copyToClipboard } from "@earendil-works/pi-coding-agent";
import { homedir } from "node:os";
import { join, relative } from "node:path";

import { logDate } from "../domain/retention";
import type { Manifest } from "../domain/types";
import { versionLabel } from "../domain/versioning";
import { LOG_DIR } from "../infra/log/logger";
import { codeChangedAt } from "../infra/process/launch";
import {
  Gallery,
  type GalleryAction,
  type StatusFacts,
  statusReport,
  statusText,
  unreachableReport,
} from "./gallery";
import type { Host } from "./host";

/** What a key in the panel does to the server and to this session; the panel words the outcome. */
async function act(
  host: Host,
  action: GalleryAction,
  m: Manifest,
  title?: string,
): Promise<Manifest | void> {
  switch (action) {
    case "attach":
      await host.attach(m.slug);
      return;
    case "open": {
      const error = await host.open(m.slug);
      if (error) throw new Error(error);
      return;
    }
    case "copy":
      // The tokened address: pasted into a browser that has no cookie yet, it still opens.
      return copyToClipboard(host.url(m.slug));
    case "dismiss":
      return host.strip.remove(m.slug);
    case "pin":
      return host.client.pin(m.slug, !m.pinned);
    case "watch": {
      const next = await host.client.watch(m.slug, !m.watched);
      if (next.watched) host.remember(next);
      return next;
    }
    case "rename": {
      const renamed = await host.client.rename(m.slug, title ?? m.title);
      if (host.strip.get(m.slug)) host.remember(renamed);
      return renamed;
    }
    case "delete":
      await host.client.remove(m.slug);
      host.forget(m.slug);
  }
}

/** What the Status tab reports: the server's word, this session's settings, and the age of the source. */
async function statusFacts(host: Host, cwd: string): Promise<StatusFacts> {
  const [server, mine] = await Promise.all([host.client.status(), host.mine()]);
  return {
    server,
    mine: mine.length,
    session: host.session,
    config: host.config,
    codeChangedAt: codeChangedAt(),
    logs: `${join(relative(cwd, server.root), LOG_DIR, logDate(new Date()))}/`,
    home: homedir(),
  };
}

export interface CommandDeps {
  hostFor: (cwd: string, session: string) => Host;
  forgetHost: (cwd: string) => void;
}

export function registerCommand(pi: ExtensionAPI, deps: CommandDeps): void {
  pi.registerCommand("artifacts", {
    description:
      "Browse this project's artifact pages: attach, rename, pin or delete one; `status` shows the server; pin/unpin <slug>, sweep, stop, restart",
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
      const status = verb === "status";
      try {
        await host.start();
      } catch (e) {
        // The Status tab is where a server that cannot be reached is explained; every other door needs it.
        if (!status) {
          ctx.ui.notify(`artifacts: ${(e as Error).message}`, "warning");
          return;
        }
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
      if (verb && !status) {
        const slug = await host.resolveSlug(verb);
        if (!slug) return ctx.ui.notify(`No artifact matches "${verb}".`, "warning");
        const error = await host.open(slug);
        if (error) ctx.ui.notify(`Could not open the browser: ${error}`, "warning");
        return;
      }
      if (!ctx.hasUI && status) {
        const report = await statusFacts(host, ctx.cwd).then(
          (facts) => statusReport(facts, new Date()),
          (e: Error) => unreachableReport(e.message),
        );
        ctx.ui.notify(statusText(report), report.rows.some((r) => r.warn) ? "warning" : "info");
        return;
      }
      if (!ctx.hasUI) {
        const all = await host.client.list();
        if (!all.length) {
          ctx.ui.notify("No artifacts yet. Publish one with the artifact tool.", "info");
          return;
        }
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
          tab: status ? "status" : "all",
          load: () => host.client.list(),
          status: () => statusFacts(host, ctx.cwd),
          attached: (slug) => host.strip.get(slug) !== undefined,
          url: (slug) => host.url(slug, false),
          act: async (action, m, title) => {
            const result = await act(host, action, m, title);
            if (action === "attach") picked = m.title;
            return result;
          },
          done: () => done(picked),
          requestRender: () => tui.requestRender(),
          paint: {
            accent: (t) => theme.fg("accent", t),
            dim: (t) => theme.fg("dim", t),
            warn: (t) => theme.fg("warning", t),
            bold: (t) => theme.bold(t),
            italic: (t) => theme.italic(t),
            // Claude Code's current tab: reverse video, bold.
            selected: (t) => theme.inverse(theme.bold(t)),
          },
          terminalRows: () => tui.terminal.rows,
        });
        void gallery.refresh();
        return gallery;
      });
      if (attached) ctx.ui.notify(`Attached "${attached}" to this session.`, "info");
    },
  });
}
