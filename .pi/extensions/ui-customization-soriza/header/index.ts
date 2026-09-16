// The S/Z header: Pi's startup header replaced by the monogram (S in `accent`,
// Z in `muted`, so every theme recolours it) and a centred `owner/repo · branch`
// line. Installed in TUI mode only (setHeader is a no-op elsewhere); the repo
// line is probed asynchronously and re-probed after each agent run so a branch
// switch shows up. `restore` hands the built-in header back.

import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { TuiHandle } from "../tui";
import { monogram } from "./logo";
import { equalRepo, probeRepo, type RepoInfo } from "./repo";

export interface HeaderFeature {
  install(ctx: ExtensionContext): void;
  /** Re-probe the repository; redraws only when slug or branch changed. */
  refresh(ctx: ExtensionContext): Promise<void>;
  restore(ctx: ExtensionContext): void;
}

function center(line: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - visibleWidth(line)) / 2));
  return truncateToWidth(" ".repeat(pad) + line, width);
}

function repoLine(theme: Theme, repo: RepoInfo): string {
  const slug = theme.bold(theme.fg("text", repo.slug));
  if (!repo.branch) return slug;
  return `${slug}${theme.fg("dim", " · ")}${theme.fg("success", repo.branch)}`;
}

export function createHeader(pi: ExtensionAPI, tui: TuiHandle): HeaderFeature {
  let repo: RepoInfo | undefined;

  return {
    install(ctx) {
      ctx.ui.setHeader((mounted, theme) => {
        tui.bind(mounted);
        return {
          render(width: number): string[] {
            const logo = monogram({
              s: (text) => theme.fg("accent", text),
              z: (text) => theme.fg("muted", text),
            });
            const lines = ["", ...logo.map((l) => center(l, width)), ""];
            if (repo) lines.push(center(repoLine(theme, repo), width), "");
            return lines;
          },
          invalidate() {},
          dispose() {
            tui.unbind(mounted);
          },
        };
      });
    },

    async refresh(ctx) {
      const next = await probeRepo(ctx.cwd, (command, args, options) =>
        pi.exec(command, args, options),
      );
      if (repo && equalRepo(repo, next)) return;
      repo = next;
      tui.requestRender();
    },

    restore(ctx) {
      ctx.ui.setHeader(undefined);
    },
  };
}
