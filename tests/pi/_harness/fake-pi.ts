// A stand-in for Pi's ExtensionAPI that records what an extension registers and
// what it sends. Everything the extension under test does not use throws
// `not stubbed`, so an extension that starts calling a new API fails loudly here
// instead of passing by silence — the same shape Pi's own createExtensionRuntime
// uses for unbound actions.

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export type Handler = (event: unknown, ctx: ExtensionContext) => Promise<unknown> | unknown;
export type ExecCall = { command: string; args: string[]; options?: unknown };
export type SentMessage = { message: Record<string, unknown>; options?: Record<string, unknown> };
export type ExecResult = { stdout: string; stderr: string; code: number; killed?: boolean };
export type ExecScript = (call: ExecCall) => Promise<ExecResult> | ExecResult;

export interface FakePi {
  pi: ExtensionAPI;
  handlers: Map<string, Handler[]>;
  sent: SentMessage[];
  execCalls: ExecCall[];
  commands: Map<string, Parameters<ExtensionAPI["registerCommand"]>[1]>;
  entries: Array<{ customType: string; data: unknown }>;
  /** Fire one event through every handler registered for it; the first defined result wins. */
  emit(event: string, payload: Record<string, unknown>, ctx: ExtensionContext): Promise<unknown>;
}

const notStubbed = (name: string) => () => {
  throw new Error(`fake-pi: ${name} is not stubbed — the extension started using it`);
};

export function createFakePi(
  exec: ExecScript,
  options: { flags?: Record<string, unknown>; activeTools?: string[] } = {},
): FakePi {
  const handlers = new Map<string, Handler[]>();
  const sent: SentMessage[] = [];
  const execCalls: ExecCall[] = [];
  const commands = new Map<string, Parameters<ExtensionAPI["registerCommand"]>[1]>();
  const entries: Array<{ customType: string; data: unknown }> = [];
  const flags: Record<string, unknown> = { ...options.flags };

  const stub: Record<string, unknown> = {
    on(event: string, handler: Handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    async exec(command: string, args: string[], options?: unknown) {
      const call = { command, args, options };
      execCalls.push(call);
      return exec(call);
    },
    sendMessage(message: Record<string, unknown>, options?: Record<string, unknown>) {
      sent.push({ message, options });
    },
    registerCommand(name: string, command: Parameters<ExtensionAPI["registerCommand"]>[1]) {
      commands.set(name, command);
    },
    registerFlag(name: string, flag: { default?: unknown }) {
      if (!(name in flags)) flags[name] = flag.default;
    },
    getFlag: (name: string) => flags[name],
    getActiveTools: () => options.activeTools ?? ["read", "write", "edit", "bash"],
    appendEntry(customType: string, data: unknown) {
      entries.push({ customType, data });
    },
  };
  const pi = new Proxy(stub, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop === "then") return undefined;
      return notStubbed(prop);
    },
  }) as unknown as ExtensionAPI;

  return {
    pi,
    handlers,
    sent,
    execCalls,
    commands,
    entries,
    async emit(event, payload, ctx) {
      for (const handler of handlers.get(event) ?? []) {
        const result = await handler({ type: event, ...payload }, ctx);
        if (result !== undefined) return result;
      }
      return undefined;
    },
  };
}
