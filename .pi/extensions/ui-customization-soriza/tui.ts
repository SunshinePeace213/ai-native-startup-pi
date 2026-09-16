// The TUI handle the features share. Pi hands `tui` only to component
// factories (setHeader / setFooter), so whichever component mounts first binds
// it here; the theme feature then writes OSC sequences through it and every
// feature can request a redraw. Unbound, writes fall through to stdout and
// redraw requests are dropped — the state outside TUI mode.

export interface TuiLike {
  requestRender(): void;
  terminal: { write(data: string): void };
}

export interface TuiHandle {
  bind(tui: TuiLike): void;
  unbind(tui: TuiLike): void;
  requestRender(): void;
  write(data: string): void;
}

export function createTuiHandle(
  fallbackWrite: (data: string) => void = (d) => process.stdout.write(d),
): TuiHandle {
  let bound: TuiLike | undefined;
  return {
    bind(tui) {
      bound = tui;
    },
    unbind(tui) {
      if (bound === tui) bound = undefined;
    },
    requestRender() {
      bound?.requestRender();
    },
    write(data) {
      (bound ? (d: string) => bound!.terminal.write(d) : fallbackWrite)(data);
    },
  };
}
