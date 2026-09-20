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
//   down              on an empty prompt: focus moves into the strip, onto the
//                     newest pill (the Selector's keys: ←/→, enter opens, c
//                     copies, x dismisses)
//   alt+a             open the newest page. Claude Code's ctrl+] is not bound
//                     here: it is pi's default for the editor's
//                     jump-to-character (tui.editor.jumpForward), and an
//                     extension shortcut would outrank it and be reported as a
//                     conflict among pi's startup diagnostics.
//
// The strip is one status text, `⧉` and the focus mark included; the soriza
// statusline gives it the token line, and pi's default footer shows it with
// the other statuses. A status is painted text pi keeps as it was handed over,
// so the row is drawn again whenever the theme's paint changes (alt+= / alt+-,
// the picker and its preview, a reloaded theme file) — the editor's frame is
// the signal, pi having no theme event.

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { copyToClipboard } from "@earendil-works/pi-coding-agent";
import { type KeyId, matchesKey } from "@earendil-works/pi-tui";

import { FEEDBACK_TYPE } from "../domain/envelope";
import { STORE_DIR } from "../domain/protocol";
import type { Config } from "../domain/types";
import type { Host } from "./host";
import { ArtifactEditor } from "./editor";
import { type Choice, Selector } from "./selector";
import { type Paint, paintSignature, STRIP_KEY } from "./strip";

export { STORE_DIR };

const OPEN_SHORTCUTS = ["alt+a"] as const;

export interface HookDeps {
  hostFor: (cwd: string, session: string) => Host;
  /** The host for a cwd, or undefined when this session never created one. */
  existingHost: (cwd: string) => Host | undefined;
  forgetHost: (cwd: string) => void;
  configFor: (cwd: string) => Config;
  /** Binds user notifications to the UI once a context with one appears. */
  bindNotify: (notify: (message: string, type: "info" | "warning" | "error") => void) => void;
}

// A theme has no accent background, so the selected pill is the accent in
// reverse video: the accent fills the cells and the terminal's own background
// becomes the text — the pair the theme already made readable, swapped.
const paintFor = (ctx: ExtensionContext): Paint => ({
  accent: (t) => ctx.ui.theme.fg("accent", t),
  dim: (t) => ctx.ui.theme.fg("dim", t),
  warn: (t) => ctx.ui.theme.fg("warning", t),
  selected: (t) => ctx.ui.theme.inverse(ctx.ui.theme.fg("accent", ctx.ui.theme.bold(t))),
});

/** The strip's hold on the footer: drawn until `dispose`, repainted on `repaint`. */
export interface StripBinding {
  /** Draws the row again when the theme it was painted in is no longer the one in force. */
  repaint: () => void;
  dispose: () => void;
}

/**
 * Draws the strip into the footer and keeps it there as badges change — and as
 * the theme changes: a status is a painted string pi stores as given, so a row
 * drawn under the old theme would keep its colours through a switch. `repaint`,
 * called from the editor's frame, redraws it the moment the paint differs.
 */
export function bindStrip(host: Host, ctx: ExtensionContext): StripBinding {
  if (!ctx.hasUI) return { repaint: () => {}, dispose: () => {} };
  const paint = paintFor(ctx);
  let signature = paintSignature(paint);
  const draw = () => {
    signature = paintSignature(paint);
    ctx.ui.setStatus(STRIP_KEY, host.strip.render(paint) || undefined);
  };
  draw();
  const off = host.strip.onChange(draw);
  return {
    repaint: () => {
      if (paintSignature(paint) === signature) return;
      draw();
    },
    dispose: off,
  };
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
    const strip = bindStrip(host, ctx);
    unbind.set(ctx.cwd, strip.dispose);
    if (ctx.hasUI) {
      const selector = new Selector(host.strip, (data, key) => matchesKey(data, key as KeyId));
      ctx.ui.setEditorComponent(
        (tui, theme, keybindings) =>
          new ArtifactEditor(
            tui,
            theme,
            keybindings,
            selector,
            (choice) => void act(ctx, host, choice),
            strip.repaint,
          ),
      );
    }
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
    if (ctx.hasUI) {
      ctx.ui.setStatus(STRIP_KEY, undefined);
      ctx.ui.setEditorComponent(undefined);
    }
    await host.shutdown(!deps.configFor(ctx.cwd).keepAlive);
    deps.forgetHost(ctx.cwd);
  });

  for (const key of OPEN_SHORTCUTS) {
    pi.registerShortcut(key, {
      description: "Open the newest artifact page",
      handler: async (ctx) => {
        const host = deps.existingHost(ctx.cwd);
        const badge = host?.badges().at(-1);
        if (!host || !badge) {
          ctx.ui.notify("No artifact pages in this session yet.", "info");
          return;
        }
        await act(ctx, host, { action: "open", slug: badge.slug });
      },
    });
  }
}

/** What a choice made in the footer does. */
async function act(ctx: ExtensionContext, host: Host, choice: Choice): Promise<void> {
  if (choice.action === "dismiss") return host.strip.remove(choice.slug);
  if (choice.action === "open") {
    const error = await host.open(choice.slug);
    if (error) ctx.ui.notify(`Could not open the browser: ${error}`, "warning");
    return;
  }
  const badge = host.strip.get(choice.slug);
  if (!badge) return;
  try {
    await copyToClipboard(badge.url);
    ctx.ui.notify(`Copied the link to "${badge.title}".`, "info");
  } catch (e) {
    ctx.ui.notify(`Could not copy: ${(e as Error).message}`, "warning");
  }
}
