// A mounted footer on pi's real alternate-screen renderer over a scripted
// terminal, so a test can click a cell and read which URL pi opened. Shared by
// the statusline contracts, which own the footer, and the artifacts contracts,
// whose strip is drawn on it.

import {
  type Component,
  Container,
  ScrollView,
  stripTerminalSequences,
  type Terminal,
  TuiAltScreen,
  visibleWidth,
  VStack,
} from "@earendil-works/pi-tui";

export interface Fullscreen {
  /** Every URL pi's renderer opened, in order. */
  opened: string[];
  /** A plain left click — press and release on one cell — in the middle of `text` on the footer. */
  click(text: string): void;
  /** A left press in `from`, dragged to `to` and released there. */
  drag(from: string, to: string): void;
  /** Whether pi's own text selection holds a range. */
  selecting(): boolean;
  stop(): void;
}

/**
 * The footer on pi's fullscreen screen: the real alternate-screen renderer on a
 * scripted terminal, laid out as pi's interactive mode lays it out — a
 * scrolling transcript above a dock whose last entry is the container the
 * footer sits in — with the URL opener recorded instead of run.
 */
export function mountFullscreen(footer: Component, columns = 300, rows = 30): Fullscreen {
  let input: (data: string) => void = () => {};
  const terminal: Terminal = {
    start(onInput) {
      input = onInput;
    },
    stop() {},
    drainInput: async () => {},
    write() {},
    columns,
    rows,
    kittyProtocolActive: false,
    moveBy() {},
    hideCursor() {},
    showCursor() {},
    clearLine() {},
    clearFromCursor() {},
    clearScreen() {},
    setTitle() {},
    setProgress() {},
  };
  const opened: string[] = [];
  const tui = new TuiAltScreen(terminal, false, undefined, {
    openUrl: (url) => void opened.push(url),
    copyOnSelect: false,
  });
  const transcript = new Container();
  const editor = new Container();
  editor.addChild({
    render: (width) => ["─".repeat(width), "", "─".repeat(width)],
    invalidate() {},
  });
  const footerContainer = new Container();
  footerContainer.addChild(footer);
  for (const mounted of [transcript, editor, footerContainer]) tui.addChild(mounted);
  tui.setLayoutRoot(
    new VStack([
      {
        component: new ScrollView(transcript, { follow: "end", primary: true }),
        basis: 0,
        grow: 1,
        shrink: 1,
        minSize: 1,
      },
      {
        component: new VStack([
          { component: editor, shrink: 1, minSize: 3 },
          { component: footerContainer, shrink: 1, minSize: 1 },
        ]),
        basis: "auto",
        grow: 0,
        shrink: 1,
        minSize: 1,
      },
    ]),
  );
  tui.start();

  /** The middle cell of `text`; the footer is docked against the bottom row. */
  const cell = (text: string) => {
    const lines = footer.render(columns).map(stripTerminalSequences);
    const at = lines.findIndex((line) => line.includes(text));
    if (at < 0) throw new Error(`"${text}" is not on the footer`);
    const line = lines[at]!;
    const x = visibleWidth(line.slice(0, line.indexOf(text))) + Math.floor(visibleWidth(text) / 2);
    return `${x + 1};${rows - lines.length + at + 1}`;
  };
  const LEFT = 0;
  const MOTION = 32;
  return {
    opened,
    click(text) {
      tui.renderNow();
      input(`\x1b[<${LEFT};${cell(text)}M`);
      input(`\x1b[<${LEFT};${cell(text)}m`);
    },
    drag(from, to) {
      tui.renderNow();
      input(`\x1b[<${LEFT};${cell(from)}M`);
      input(`\x1b[<${LEFT + MOTION};${cell(to)}M`);
      input(`\x1b[<${LEFT};${cell(to)}m`);
    },
    selecting: () => tui.hasActiveSelection(),
    stop: () => tui.stop(),
  };
}
