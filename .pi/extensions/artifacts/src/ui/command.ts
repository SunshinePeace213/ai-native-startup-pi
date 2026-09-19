// /artifacts — the user's own door to the pages:
//
//   /artifacts               list every page in the project; with a UI, pick one to open
//   /artifacts <slug>        open that page (a URL or path works too)
//   /artifacts pin <slug>    exempt it from retention; `unpin` reverses
//   /artifacts sweep         run the retention sweep now
//   /artifacts stop          end the server process; the next session start or publish restarts it

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { versionLabel } from "../domain/versioning";
import type { Host } from "./host";

export interface CommandDeps {
  hostFor: (cwd: string, session: string) => Host;
  forgetHost: (cwd: string) => void;
}

export function registerCommand(pi: ExtensionAPI, deps: CommandDeps): void {
  pi.registerCommand("artifacts", {
    description:
      "List this project's artifact pages and open one; pin/unpin, sweep, or stop the server",
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
      const sorted = [...all].sort((a, b) => Number(b.pinned) - Number(a.pinned));
      const rows = sorted.map(
        (m) =>
          `${m.slug} — ${m.title} (${versionLabel(m)}${m.pinned ? ", pinned" : ""}${m.owner === host.session ? ", mine" : ""}${m.pending.length ? `, ${m.pending.length} pending` : ""})`,
      );
      if (!ctx.hasUI) {
        ctx.ui.notify(rows.join("\n"), "info");
        return;
      }
      const picked = await ctx.ui.select("Artifacts — pick one to open", rows);
      if (!picked) return;
      await openOne(picked.split(" — ")[0] ?? "");
    },
  });
}
