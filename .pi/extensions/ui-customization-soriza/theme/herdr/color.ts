// Colour arithmetic for deriving a Herdr palette from a Pi theme: hex ⇄ RGB,
// the xterm 256-colour table (Pi themes may name a colour by index), WCAG
// relative luminance and contrast, linear mixing, and the two contrast
// fitters the palette uses to keep borders quiet and labels legible.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX = /^#[0-9a-f]{6}$/i;

export function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

export function toRgb(hex: string): Rgb {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const channel = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** The xterm 256-colour table as hex: 16 system colours, the 6×6×6 cube, the grey ramp. */
export function xterm256(index: number): string | undefined {
  if (!Number.isInteger(index) || index < 0 || index > 255) return undefined;
  if (index < 16) return SYSTEM[index];
  if (index < 232) {
    const i = index - 16;
    const level = (n: number) => (n === 0 ? 0 : 55 + n * 40);
    return toHex({
      r: level(Math.floor(i / 36)),
      g: level(Math.floor(i / 6) % 6),
      b: level(i % 6),
    });
  }
  const grey = 8 + (index - 232) * 10;
  return toHex({ r: grey, g: grey, b: grey });
}

const SYSTEM = [
  "#000000",
  "#800000",
  "#008000",
  "#808000",
  "#000080",
  "#800080",
  "#008080",
  "#c0c0c0",
  "#808080",
  "#ff0000",
  "#00ff00",
  "#ffff00",
  "#0000ff",
  "#ff00ff",
  "#00ffff",
  "#ffffff",
];

/** WCAG 2 relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const { r, g, b } = toRgb(hex);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2 contrast ratio, 1 (identical) to 21 (black on white). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `from` moved `t` of the way (0–1) toward `to`, per channel. */
export function mix(from: string, to: string, t: number): string {
  const a = toRgb(from);
  const b = toRgb(to);
  const k = Math.max(0, Math.min(1, t));
  return toHex({ r: a.r + (b.r - a.r) * k, g: a.g + (b.g - a.g) * k, b: a.b + (b.b - a.b) * k });
}

/**
 * The colour on the line from `bg` to `colour` whose contrast against `bg` is
 * closest to `target` without falling below it. A colour that already sits at
 * or under the target is returned unchanged — this only ever dims.
 */
export function dimToContrast(bg: string, colour: string, target: number): string {
  if (contrast(colour, bg) <= target) return colour;
  return search((t) => mix(bg, colour, t), bg, target);
}

/**
 * The colour on the line from `colour` to `toward` whose contrast against `bg`
 * first reaches `target`. A colour already at or above the target is returned
 * unchanged — this only ever brightens. If even `toward` cannot reach the
 * target, `toward` is returned.
 */
export function raiseToContrast(
  bg: string,
  colour: string,
  toward: string,
  target: number,
): string {
  if (contrast(colour, bg) >= target) return colour;
  if (contrast(toward, bg) < target) return toward;
  return search((t) => mix(colour, toward, t), bg, target);
}

/** `colour` dimmed toward `bg` or brightened toward `toward` until its contrast against `bg` sits at `target`. */
export function fitContrast(bg: string, colour: string, toward: string, target: number): string {
  return contrast(colour, bg) > target
    ? dimToContrast(bg, colour, target)
    : raiseToContrast(bg, colour, toward, target);
}

/** Smallest t (to 1/1024) for which `at(t)` reaches `target` contrast against `bg`. */
function search(at: (t: number) => string, bg: string, target: number): string {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 10; i += 1) {
    const mid = (lo + hi) / 2;
    if (contrast(at(mid), bg) >= target) hi = mid;
    else lo = mid;
  }
  return at(hi);
}
