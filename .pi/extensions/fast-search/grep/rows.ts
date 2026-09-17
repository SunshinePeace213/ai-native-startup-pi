// One ripgrep `--json` event → one output row, in the shape Pi's built-in grep
// prints: `path:line: text` for a match, `path-line- text` for a context line.
// Everything else (begin, end, summary) is skipped. Long lines are cut to the
// same length the built-in uses so a minified file cannot flood the result.

import { truncateLine } from "@earendil-works/pi-coding-agent";

import { tidyPath } from "../output";

export type Row = { kind: "match" | "context"; text: string; cut: boolean };

interface RgEvent {
  type?: string;
  data?: {
    path?: { text?: string };
    lines?: { text?: string };
    line_number?: number;
  };
}

export function parseRow(line: string): Row | null {
  if (!line.trim()) return null;
  let event: RgEvent;
  try {
    event = JSON.parse(line) as RgEvent;
  } catch {
    return null;
  }
  if (event.type !== "match" && event.type !== "context") return null;
  const path = event.data?.path?.text;
  const number = event.data?.line_number;
  if (typeof path !== "string" || typeof number !== "number") return null;
  const raw = (event.data?.lines?.text ?? "").replace(/\r?\n$/, "").replace(/\r/g, "");
  const { text, wasTruncated } = truncateLine(raw);
  const separator = event.type === "match" ? ":" : "-";
  return {
    kind: event.type,
    text: `${tidyPath(path)}${separator}${number}${separator} ${text}`,
    cut: wasTruncated,
  };
}
