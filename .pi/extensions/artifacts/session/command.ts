// /artifacts — the user's own door to the pages:
//
//   /artifacts           list; with a UI, pick one to open
//   /artifacts <slug>    open that page (a URL or path works too)
//   /artifacts stop      end the server process; the next publish restarts it

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { Host } from "./host";

export interface CommandDeps {
  hostFor: (cwd: string) => Host;
  forgetHost: (cwd: string) => void;
}

export function registerCommand(pi: ExtensionAPI, deps: CommandDeps): void {
  pi.registerCommand("artifacts", {
    description: "List this project's artifact pages and open one; `stop` ends the server",
    handler: async (args, ctx) => {
      const host = deps.hostFor(ctx.cwd);
      const wanted = args?.trim();
      if (wanted === "stop") {
        await host.shutdown(true);
        deps.forgetHost(ctx.cwd);
        ctx.ui.notify("Artifact server stopped; the next publish starts it again.", "info");
        return;
      }
      let all;
      try {
        await host.start();
        all = await host.client.list();
      } catch (e) {
        ctx.ui.notify(`artifacts: ${(e as Error).message}`, "warning");
        return;
      }
      if (!all.length) {
        ctx.ui.notify("No artifacts yet — ask the agent to publish one.", "info");
        return;
      }
      const openOne = async (slug: string) => {
        const error = await host.open(slug);
        ctx.ui.notify(
          error ? `Could not open the browser: ${error}` : `Opened ${host.url(slug, false)}`,
          error ? "warning" : "info",
        );
      };
      if (wanted) {
        const slug = await host.resolveSlug(wanted);
        if (!slug) return ctx.ui.notify(`No artifact matches "${wanted}".`, "warning");
        return openOne(slug);
      }
      const rows = all.map(
        (m) =>
          `${m.slug} — ${m.title} (v${m.current}${m.pending.length ? `, ${m.pending.length} pending` : ""})`,
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
