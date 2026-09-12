// The ExtensionContext an event handler receives, reduced to what tests observe:
// the cwd, whether a UI exists, and the status text the extension sets.

import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

export interface FakeCtx {
  ctx: ExtensionCommandContext;
  status: Map<string, string | undefined>;
  notifications: Array<{ message: string; type: string }>;
}

export function createCtx(options: {
  cwd: string;
  hasUI?: boolean;
  trusted?: boolean;
  idle?: boolean;
}): FakeCtx {
  const status = new Map<string, string | undefined>();
  const notifications: Array<{ message: string; type: string }> = [];
  const ctx = {
    cwd: options.cwd,
    hasUI: options.hasUI ?? true,
    isProjectTrusted: () => options.trusted ?? true,
    isIdle: () => options.idle ?? true,
    waitForIdle: async () => {},
    ui: {
      notify(message: string, type: string) {
        notifications.push({ message, type });
      },
      setStatus(key: string, text: string | undefined) {
        status.set(key, text);
      },
    },
  } as unknown as ExtensionCommandContext;
  return { ctx, status, notifications };
}
