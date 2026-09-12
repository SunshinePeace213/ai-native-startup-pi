// The ExtensionContext an event handler receives, reduced to what tests observe:
// the cwd, whether a UI exists, and the status text the extension sets.

import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export interface FakeCtx {
  ctx: ExtensionContext;
  status: Map<string, string | undefined>;
}

export function createCtx(options: { cwd: string; hasUI?: boolean }): FakeCtx {
  const status = new Map<string, string | undefined>();
  const ctx = {
    cwd: options.cwd,
    hasUI: options.hasUI ?? true,
    ui: {
      setStatus(key: string, text: string | undefined) {
        status.set(key, text);
      },
    },
  } as unknown as ExtensionContext;
  return { ctx, status };
}
