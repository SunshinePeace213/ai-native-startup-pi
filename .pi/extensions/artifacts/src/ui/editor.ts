// The editor that shares its focus with the footer, as Claude Code's prompt
// does: `down` on an empty prompt moves into the artifact strip, and the
// Selector owns the keys until it hands focus back. `down` on an empty editor
// does nothing otherwise (pi-tui uses it only while browsing history), and
// because this is the editor's own handleInput an open picker never sees it.
//
// It is also the strip's frame: pi has no theme-change event, but every switch
// (alt+= / alt+-, the picker, a live preview, a theme file reloaded) invalidates
// the screen and redraws this editor, so `onFrame` is where the footer row is
// repainted in the theme that is now current.

import { CustomEditor } from "@earendil-works/pi-coding-agent";
import { matchesKey } from "@earendil-works/pi-tui";

import type { Choice, Selector } from "./selector";

type EditorArgs = ConstructorParameters<typeof CustomEditor>;

export class ArtifactEditor extends CustomEditor {
  constructor(
    tui: EditorArgs[0],
    theme: EditorArgs[1],
    keybindings: EditorArgs[2],
    private readonly selector: Selector,
    private readonly choose: (choice: Choice) => void,
    /** Called before each draw, while the theme in force is the one about to paint. */
    private readonly onFrame: () => void = () => {},
  ) {
    super(tui, theme, keybindings);
  }

  override render(width: number): string[] {
    // Guarded: pi-tui may draw before the subclass fields are assigned.
    this.onFrame?.();
    return super.render(width);
  }

  override handleInput(data: string): void {
    if (this.selector.active) {
      const result = this.selector.handleInput(data);
      if (result.kind === "handled") {
        if (result.choice) this.choose(result.choice);
        return;
      }
      if (!result.passthrough) return;
    } else if (matchesKey(data, "down") && this.getText() === "" && this.selector.enter()) {
      return;
    }
    super.handleInput(data);
  }
}
