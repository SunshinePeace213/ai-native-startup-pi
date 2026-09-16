// ui-customization-soriza — Pi's chrome, in three features that share one TUI
// handle (tui.ts):
//
//   header/      the S/Z monogram and `owner/repo · branch` startup header
//   theme/       /theme picker, alt+t, alt+= / alt+- cycling, the 🎨 status with
//                its swatch, the swatch flash, terminal colour sync (OSC 10/11)
//   statusline/  the emoji footer: where · session · subscription quota ·
//                extension statuses, with /statusline to switch modes
//
// This file only wires Pi's lifecycle events and registrations to them; each
// feature guards TUI-only work itself. `deps` exists for tests to inject a
// fetch and a clock; Pi calls the default export with the API alone.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createHeader } from "./header";
import { createStatusline, type StatuslineDeps } from "./statusline";
import { createThemeFeature, cycleKeys, SWATCH_MS } from "./theme";
import { createTuiHandle } from "./tui";

export { cycleKeys, SWATCH_MS };

export default function uiCustomizationSoriza(pi: ExtensionAPI, deps: StatuslineDeps = {}) {
  const tui = createTuiHandle();
  const header = createHeader(pi, tui);
  const theme = createThemeFeature(pi, tui);
  const statusline = createStatusline(pi, tui, deps);

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode === "tui") header.install(ctx);
    theme.start(ctx);
    await Promise.all([
      ctx.mode === "tui" ? header.refresh(ctx) : undefined,
      statusline.start(ctx),
    ]);
  });

  pi.on("turn_end", async (_event, ctx) => {
    await statusline.afterTurn(ctx);
  });

  pi.on("agent_end", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    theme.afterAgent(ctx);
    await Promise.all([header.refresh(ctx), statusline.afterAgent(ctx)]);
  });

  pi.on("model_select", async (_event, ctx) => {
    await statusline.onModelSelect(ctx);
  });

  pi.on("after_provider_response", (event, ctx) => {
    statusline.onProviderResponse(event.headers, ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    theme.shutdown(ctx);
    statusline.shutdown(ctx);
    if (ctx.mode === "tui") header.restore(ctx);
  });

  theme.register();
  statusline.register();
}
