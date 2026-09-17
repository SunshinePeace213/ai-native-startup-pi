// Theme switching UI. `/theme` (or alt+t) opens a list where every row shows
// the theme's name and a swatch painted in *that theme's own* colours, so the
// palettes can be compared before committing; moving the cursor previews the
// highlighted theme on the whole screen as an in-memory instance (nothing
// persisted), Enter applies it by name (Pi saves it to settings.json), Esc
// restores the original instance. `/theme <name>` and alt+. / alt+, apply
// directly. Every successful switch reports through `applied`; only the ones
// with no visible trigger of their own also raise a notification — cycling is
// silent, since the swatch widget `applied` flashes already names the theme.

import type { ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import {
  type Component,
  Container,
  getKeybindings,
  Text,
  truncateToWidth,
} from "@earendil-works/pi-tui";
import { CATALOG } from "./catalog";
import { showThemeStatus, swatch } from "./status";

export type Applied = (ctx: ExtensionContext) => void | Promise<void>;

const MAX_VISIBLE = 12;

/** Pi's two built-in themes; they ship inside the Pi package, not in a themes folder. */
const BUILT_IN = new Set(["dark", "light"]);

/**
 * The order the picker lists and the shortcuts cycle: the themes as Pi lists
 * them (alphabetical), except that the built-ins `dark` and `light` go last.
 */
export function orderThemes<T extends { name: string }>(themes: T[]): T[] {
  return [
    ...themes.filter((t) => !BUILT_IN.has(t.name)),
    ...themes.filter((t) => BUILT_IN.has(t.name)),
  ];
}

async function applyByName(
  ctx: ExtensionContext,
  name: string,
  applied: Applied,
  notify = true,
): Promise<boolean> {
  const result = ctx.ui.setTheme(name);
  if (!result.success) {
    ctx.ui.notify(`Theme "${name}" not found — /theme lists the available ones`, "error");
    return false;
  }
  await applied(ctx);
  if (notify) ctx.ui.notify(`Theme: ${name}`, "info");
  return true;
}

interface Row {
  name: string;
  theme: Theme | undefined;
  description: string;
}

class ThemeList implements Component {
  private index: number;
  onChange?: (row: Row) => void;
  onSelect?: (row: Row) => void;
  onCancel?: () => void;

  constructor(
    private readonly rows: Row[],
    private readonly ui: Theme,
    initial: number,
  ) {
    this.index = Math.max(0, Math.min(initial, rows.length - 1));
  }

  invalidate(): void {}

  handleInput(data: string): void {
    const kb = getKeybindings();
    const count = this.rows.length;
    if (kb.matches(data, "tui.select.up")) {
      this.index = (this.index - 1 + count) % count;
      this.onChange?.(this.rows[this.index]!);
    } else if (kb.matches(data, "tui.select.down")) {
      this.index = (this.index + 1) % count;
      this.onChange?.(this.rows[this.index]!);
    } else if (kb.matches(data, "tui.select.confirm")) {
      this.onSelect?.(this.rows[this.index]!);
    } else if (kb.matches(data, "tui.select.cancel")) {
      this.onCancel?.();
    }
  }

  render(width: number): string[] {
    const ui = this.ui;
    const visible = Math.min(MAX_VISIBLE, this.rows.length);
    const start = Math.max(
      0,
      Math.min(this.index - Math.floor(visible / 2), this.rows.length - visible),
    );
    const nameWidth = Math.max(...this.rows.map((r) => r.name.length));
    const lines = this.rows.slice(start, start + visible).map((row, i) => {
      const selected = start + i === this.index;
      const own = row.theme ?? ui;
      const padded = row.name.padEnd(nameWidth);
      const name = selected ? ui.bold(ui.fg("accent", padded)) : own.fg("accent", padded);
      const prefix = selected ? ui.fg("accent", "→ ") : "  ";
      return truncateToWidth(
        `${prefix}${name}  ${swatch(own)}  ${ui.fg("dim", row.description)}`,
        width,
      );
    });
    if (this.rows.length > visible)
      lines.push(ui.fg("dim", `  ${this.index + 1}/${this.rows.length}`));
    return lines;
  }
}

export async function openPicker(ctx: ExtensionContext, applied: Applied): Promise<void> {
  if (!ctx.hasUI) return;
  const themes = orderThemes(ctx.ui.getAllThemes());
  if (themes.length === 0) {
    ctx.ui.notify("No themes are available in this mode", "warning");
    return;
  }
  const original = ctx.ui.theme;
  const rows: Row[] = themes.map((t) => ({
    name: t.name,
    theme: ctx.ui.getTheme(t.name),
    description: CATALOG.get(t.name)?.description ?? (BUILT_IN.has(t.name) ? "built-in" : "custom"),
  }));
  const initial = rows.findIndex((r) => r.name === original.name);

  const chosen = await ctx.ui.custom<string | null>((tui, theme, _keybindings, done) => {
    const accent = (s: string) => theme.fg("accent", s);
    const container = new Container();
    container.addChild(new DynamicBorder(accent));
    container.addChild(new Text(accent(theme.bold("Theme")), 1, 0));
    const list = new ThemeList(rows, theme, initial);
    list.onChange = (row) => {
      if (row.theme) ctx.ui.setTheme(row.theme);
    };
    list.onSelect = (row) => done(row.name);
    list.onCancel = () => done(null);
    container.addChild(list);
    container.addChild(
      new Text(theme.fg("dim", "↑↓ preview · enter apply · esc keep current"), 1, 0),
    );
    container.addChild(new DynamicBorder(accent));
    return {
      render: (width: number) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => {
        list.handleInput(data);
        tui.requestRender();
      },
    };
  });

  if (chosen) {
    await applyByName(ctx, chosen, applied);
    return;
  }
  ctx.ui.setTheme(original);
  showThemeStatus(ctx);
}

export async function themeCommand(
  args: string,
  ctx: ExtensionContext,
  applied: Applied,
): Promise<void> {
  if (!ctx.hasUI) return;
  const wanted = args.trim();
  if (wanted) {
    await applyByName(ctx, wanted, applied);
    return;
  }
  await openPicker(ctx, applied);
}

/**
 * The shortcuts walk the theme files only; Pi's built-ins are skipped so that
 * cycling never snaps the terminal background to its default. With no theme
 * files at all the built-ins are cycled instead of doing nothing. Starting
 * from a skipped theme, forward lands on the first file and backward on the
 * last. No notification: the swatch widget is the feedback.
 */
export async function cycleTheme(
  ctx: ExtensionContext,
  direction: 1 | -1,
  applied: Applied,
): Promise<void> {
  if (!ctx.hasUI) return;
  const all = orderThemes(ctx.ui.getAllThemes());
  if (all.length === 0) {
    ctx.ui.notify("No themes are available in this mode", "warning");
    return;
  }
  const files = all.filter((t) => !BUILT_IN.has(t.name));
  const themes = files.length > 0 ? files : all;
  const current = themes.findIndex((t) => t.name === ctx.ui.theme.name);
  const next =
    current === -1
      ? direction === 1
        ? 0
        : themes.length - 1
      : (current + direction + themes.length) % themes.length;
  await applyByName(ctx, themes[next]!.name, applied, false);
}
