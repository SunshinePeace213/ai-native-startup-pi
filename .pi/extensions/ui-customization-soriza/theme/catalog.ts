// The bundled themes: a one-line description for the picker and the terminal's
// own background/foreground to set alongside the theme. Theme files live in
// .pi/themes/ (disler's set, colours untouched, plus deep-purple in the same
// style); this table only carries what a theme file cannot express.

export interface TerminalColors {
  bg: string;
  fg: string;
}

export interface CatalogEntry {
  description: string;
  terminal: TerminalColors;
}

export const CATALOG: ReadonlyMap<string, CatalogEntry> = new Map<string, CatalogEntry>([
  [
    "tokyo-night",
    {
      description: "Neon blue and violet on deep navy",
      terminal: { bg: "#1a1b26", fg: "#ffffff" },
    },
  ],
  [
    "midnight-ocean",
    { description: "Cyan and teal over abyssal blue", terminal: { bg: "#0a192f", fg: "#e6f1ff" } },
  ],
  [
    "deep-purple",
    {
      description: "Lavender and magenta on near-black violet",
      terminal: { bg: "#17112a", fg: "#ffffff" },
    },
  ],
  [
    "catppuccin-mocha",
    { description: "Soft pastels on warm charcoal", terminal: { bg: "#1e1e2e", fg: "#ffffff" } },
  ],
  ["nord", { description: "Arctic blues and frost", terminal: { bg: "#1a1d23", fg: "#ffffff" } }],
  [
    "rose-pine",
    {
      description: "Rose, gold and iris on dusky purple",
      terminal: { bg: "#1a1726", fg: "#ffffff" },
    },
  ],
  [
    "gruvbox",
    { description: "Retro warm earth tones", terminal: { bg: "#221f1c", fg: "#ffffff" } },
  ],
  [
    "dracula",
    { description: "Vivid purple, pink and cyan", terminal: { bg: "#1a1b26", fg: "#ffffff" } },
  ],
  [
    "everforest",
    { description: "Forest greens and warm neutrals", terminal: { bg: "#191f1d", fg: "#ffffff" } },
  ],
  [
    "synthwave",
    { description: "Eighties neon on purple dusk", terminal: { bg: "#262335", fg: "#ffffff" } },
  ],
  [
    "cyberpunk",
    {
      description: "Electric cyan and magenta on black",
      terminal: { bg: "#0a0a14", fg: "#ffffff" },
    },
  ],
  [
    "ocean-breeze",
    { description: "Sea blues and aqua on deep teal", terminal: { bg: "#0d1b2a", fg: "#ffffff" } },
  ],
]);
