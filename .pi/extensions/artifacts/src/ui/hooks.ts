// The session lifecycle and the footer:
//
//   session_start     every session: health-check the port; attach to the
//                     running server or start one; open this session's event
//                     stream; fill the footer strip with this session's pages;
//                     once per conversation, queue a summary of replies that
//                     arrived on them while nobody was listening; ask the
//                     server to sweep
//   session_shutdown  close the stream; stop the server only when keepAlive
//                     is off. Idempotent: a second call finds no host.
//   alt+a             select a page from the strip (enter opens, c copies, x drops)
//   alt+1 … alt+5     open the nth page directly
//
// The strip is one status text: the soriza statusline (and pi's default
// footer) draws extension statuses bottom-left on the token line.

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { copyToClipboard } from "@earendil-works/pi-coding-agent";
import { type KeyId, matchesKey, truncateToWidth } from "@earendil-works/pi-tui";

import { FEEDBACK_TYPE } from "../domain/envelope";
import type { Config } from "../domain/types";
import type { Host } from "./host";
import { type Choice, Selector } from "./overlay";
import { type Paint, STRIP_KEY } from "./strip";

export const STORE_DIR = ".pi/artifacts";
export const SELECT_SHORTCUT = "alt+a" as const;
export const DIRECT_SHORTCUTS = ["alt+1", "alt+2", "alt+3", "alt+4", "alt+5"] as const;

export interface HookDeps {
  hostFor: (cwd: string, session: string) => Host;
  /** The host for a cwd, or undefined when this session never created one. */
  existingHost: (cwd: string) => Host | undefined;
  forgetHost: (cwd: string) => void;
  configFor: (cwd: string) => Config;
  /** Binds user notifications to the UI once a context with one appears. */
  bindNotify: (notify: (message: string, type: "info" | "warning" | "error") => void) => void;
}

const paintFor = (ctx: ExtensionContext): Paint => ({
  accent: (t) => ctx.ui.theme.fg("accent", t),
  dim: (t) => ctx.ui.theme.fg("dim", t),
  warn: (t) => ctx.ui.theme.fg("warning", t),
  selected: (t) => ctx.ui.theme.bg("selectedBg", ctx.ui.theme.bold(t)),
});

/** Draws the strip into the footer and keeps it there as badges change. */
export function bindStrip(host: Host, ctx: ExtensionContext): () => void {
  if (!ctx.hasUI) return () => {};
  const paint = paintFor(ctx);
  const draw = () => {
    const row = host.strip.render({ paint });
    ctx.ui.setStatus(STRIP_KEY, row || undefined);
  };
  draw();
  return host.strip.onChange(draw);
}

export function registerHooks(pi: ExtensionAPI, deps: HookDeps): void {
  const unbind = new Map<string, () => void>();

  pi.on("session_start", async (event, ctx) => {
    if (ctx.hasUI) deps.bindNotify((message, type) => ctx.ui.notify(message, type));
    const host = deps.hostFor(ctx.cwd, ctx.sessionManager.getSessionId());
    try {
      await host.start();
    } catch (e) {
      if (ctx.hasUI) ctx.ui.notify(`artifacts: ${(e as Error).message}`, "warning");
      return;
    }
    unbind.get(ctx.cwd)?.();
    unbind.set(ctx.cwd, bindStrip(host, ctx));
    void host.client.sweep().catch(() => {});
    // A reload replays session_start against the same conversation, which was
    // already told; the pending sends were also acknowledged by that first replay.
    if (event.reason === "reload") {
      await host.replayPending().catch(() => null);
      return;
    }
    const summary = await host.replayPending().catch(() => null);
    if (summary) {
      pi.sendMessage(
        { customType: FEEDBACK_TYPE, content: summary, display: true },
        { deliverAs: "nextTurn" },
      );
    }
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    const host = deps.existingHost(ctx.cwd);
    if (!host) return;
    unbind.get(ctx.cwd)?.();
    unbind.delete(ctx.cwd);
    if (ctx.hasUI) ctx.ui.setStatus(STRIP_KEY, undefined);
    await host.shutdown(!deps.configFor(ctx.cwd).keepAlive);
    deps.forgetHost(ctx.cwd);
  });

  const openBadge = async (ctx: ExtensionContext, host: Host, slug: string) => {
    const error = await host.open(slug);
    if (error) ctx.ui.notify(`Could not open the browser: ${error}`, "warning");
  };

  pi.registerShortcut(SELECT_SHORTCUT, {
    description: "Select an artifact page from the footer strip",
    handler: async (ctx) => {
      const host = deps.existingHost(ctx.cwd);
      const badges = host?.badges() ?? [];
      if (!host || !badges.length) {
        ctx.ui.notify("No artifact pages in this session yet.", "info");
        return;
      }
      const choice = await ctx.ui.custom<Choice>(
        (_tui, theme, _keys, done) =>
          new Selector({
            badges,
            paint: {
              accent: (t) => theme.fg("accent", t),
              dim: (t) => theme.fg("dim", t),
              warn: (t) => theme.fg("warning", t),
              selected: (t) => theme.bg("selectedBg", theme.bold(t)),
            },
            matches: (data, key) => matchesKey(data, key as KeyId),
            done,
            hint: (t) => theme.fg("dim", t),
            fit: (text, width) => truncateToWidth(text, width),
          }),
        { overlay: true, overlayOptions: { anchor: "bottom-left", width: "100%", offsetY: -1 } },
      );
      if (!choice) return;
      if (choice.action === "open") return openBadge(ctx, host, choice.slug);
      if (choice.action === "dismiss") return host.strip.remove(choice.slug);
      if (choice.action === "copy") {
        const badge = host.strip.get(choice.slug);
        if (!badge) return;
        try {
          await copyToClipboard(badge.url);
          ctx.ui.notify(`Copied the link to "${badge.title}".`, "info");
        } catch (e) {
          ctx.ui.notify(`Could not copy: ${(e as Error).message}`, "warning");
        }
      }
    },
  });

  DIRECT_SHORTCUTS.forEach((key, index) => {
    pi.registerShortcut(key, {
      description: `Open artifact page ${index + 1} from the footer strip`,
      handler: async (ctx) => {
        const host = deps.existingHost(ctx.cwd);
        const badge = host?.badges()[index];
        if (!host || !badge) return;
        await openBadge(ctx, host, badge.slug);
      },
    });
  });
}
