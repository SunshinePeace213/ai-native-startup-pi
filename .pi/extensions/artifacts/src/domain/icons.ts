// The icon rule, as Claude Code has it: an artifact's icon is one short
// generic word — `chart`, `camera` — never an emoji and never a brand. The
// word is what is stored; the viewer shell maps the words it knows to a glyph
// for its tab icon, and any other word to a neutral one.

export const ICON_RE = /^[a-z][a-z0-9-]{1,23}$/;

export const ICON_RULE =
  "icon is one short generic word in lowercase letters, digits or hyphens, 2–24 characters (chart, camera, map) — never an emoji";

const NEUTRAL = "📄";

const GLYPHS: Record<string, string> = {
  book: "📖",
  bug: "🐛",
  calendar: "📅",
  camera: "📷",
  chart: "📊",
  chat: "💬",
  check: "✅",
  checklist: "☑️",
  clock: "🕒",
  code: "💻",
  compass: "🧭",
  dashboard: "📈",
  database: "🗄️",
  diagram: "🗂️",
  document: "📄",
  flask: "🧪",
  folder: "📁",
  game: "🎮",
  globe: "🌐",
  idea: "💡",
  image: "🖼️",
  key: "🔑",
  list: "📋",
  lock: "🔒",
  mail: "✉️",
  map: "🗺️",
  money: "💰",
  music: "🎵",
  note: "📝",
  palette: "🎨",
  plan: "🧭",
  question: "❓",
  recipe: "🍳",
  report: "📑",
  rocket: "🚀",
  search: "🔎",
  table: "🧮",
  tool: "🛠️",
  weather: "⛅",
};

/** The glyph the shell draws for a stored icon word. */
export const iconGlyph = (icon: string | undefined): string =>
  icon !== undefined && Object.hasOwn(GLYPHS, icon) ? (GLYPHS[icon] as string) : NEUTRAL;
