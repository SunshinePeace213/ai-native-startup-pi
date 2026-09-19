// Text rules shared by every layer: the slug a title becomes, and what may
// reach a terminal. A title is authored by the model, sometimes from content
// it fetched, so before it is drawn into the footer every control character
// and escape sequence is removed — a title can never rewrite the status line.

const SLUG_MAX = 48;

export function slugify(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  return base || "artifact";
}

export { SLUG_MAX };

// C0 and C1 controls, DEL, and any ESC-introduced sequence (CSI, OSC, APC …).
// eslint-disable-next-line no-control-regex
const CONTROL_RE =
  /\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-_]|[\x00-\x1f\x7f-\x9f]/g;

/** Plain text safe to draw into a terminal line: no controls, no escapes, one line. */
export function terminalSafe(text: string, max = 40): string {
  const clean = text
    .replace(/[\t\n\r\f\v]+/g, " ")
    .replace(CONTROL_RE, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
