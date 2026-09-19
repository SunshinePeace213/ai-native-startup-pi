// The ExtensionContext an event handler receives, reduced to what tests observe:
// the cwd, whether a UI exists, the status text the extension sets, and the
// dialogs it opens. A dialog with no scripted answer throws, so an extension
// that starts asking something new fails loudly instead of passing by silence.

import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

export interface FakeCtx {
  ctx: ExtensionCommandContext;
  status: Map<string, string | undefined>;
  notifications: Array<{ message: string; type: string }>;
  dialogs: Array<{ kind: "confirm" | "select"; title: string; detail: string | string[] }>;
  /** Whether an extension has replaced the editor. */
  customEditor: () => boolean;
}

export function createCtx(options: {
  cwd: string;
  hasUI?: boolean;
  trusted?: boolean;
  idle?: boolean;
  /** Scripted answers for dialogs the extension may open. */
  confirm?: (title: string, message: string) => boolean;
  select?: (title: string, choices: string[]) => string | undefined;
  /** The id ctx.sessionManager.getSessionId() reports. */
  session?: string;
}): FakeCtx {
  const status = new Map<string, string | undefined>();
  const notifications: Array<{ message: string; type: string }> = [];
  const dialogs: FakeCtx["dialogs"] = [];
  let editorFactory: unknown;
  const ctx = {
    cwd: options.cwd,
    hasUI: options.hasUI ?? true,
    isProjectTrusted: () => options.trusted ?? true,
    isIdle: () => options.idle ?? true,
    waitForIdle: async () => {},
    sessionManager: { getSessionId: () => options.session ?? "session-fake" },
    ui: {
      // A theme that paints nothing, so status text can be asserted as plain strings.
      theme: {
        fg: (_color: string, text: string) => text,
        bg: (_color: string, text: string) => text,
        bold: (text: string) => text,
      },
      notify(message: string, type: string) {
        notifications.push({ message, type });
      },
      setStatus(key: string, text: string | undefined) {
        status.set(key, text);
      },
      setEditorComponent(factory: unknown) {
        editorFactory = factory;
      },
      async confirm(title: string, message: string) {
        dialogs.push({ kind: "confirm", title, detail: message });
        if (!options.confirm) throw new Error("fake-ctx: ui.confirm is not scripted");
        return options.confirm(title, message);
      },
      async select(title: string, choices: string[]) {
        dialogs.push({ kind: "select", title, detail: choices });
        if (!options.select) throw new Error("fake-ctx: ui.select is not scripted");
        return options.select(title, choices);
      },
    },
  } as unknown as ExtensionCommandContext;
  return { ctx, status, notifications, dialogs, customEditor: () => editorFactory !== undefined };
}
