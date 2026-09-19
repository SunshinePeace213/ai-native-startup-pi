// How results read to the model: the publish line, the island's validation
// state, the list rows, and the answers block. Facts first, then the one
// instruction the model needs next.

import { declaredSchema } from "../../shared/schemas";
import type { Island, Manifest, Validation } from "../../shared/types";
import type { Published, WaitOutcome } from "../host";
import type { Action } from "./schema";

export interface ArtifactDetails {
  action: Action;
  slug?: string;
  url?: string;
  version?: number;
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  details: ArtifactDetails;
}

export const text = (value: string, details: ArtifactDetails): ToolResult => ({
  content: [{ type: "text", text: value }],
  details,
});

const KB = (n: number) => `${(n / 1024).toFixed(1)} KB`;

export function validationLine(v: Validation | null, island: Island | null): string {
  if (!island) return "Island: none.";
  const schema = declaredSchema(island);
  if (!schema) return `Island: untyped data (${Object.keys(island).length} keys).`;
  if (!v) return `Island: ${schema}.`;
  const questions = Array.isArray(island.questions) ? island.questions.length : 0;
  return v.ok
    ? `Island: ${schema} · ${questions} question${questions === 1 ? "" : "s"} · answered ${v.answered}/${v.total}${v.unanswered.length ? ` · unanswered: ${v.unanswered.join(", ")}` : ""}.`
    : `Island: ${schema} · INVALID: ${v.errors.join("; ")}`;
}

export type OpenState =
  { kind: "opened" } | { kind: "skipped" } | { kind: "live" } | { kind: "failed"; error: string };

/** The opener's verdict as a state: null opened, undefined skipped, a string failed. */
export const openState = (error: string | null | undefined): OpenState =>
  error === null
    ? { kind: "opened" }
    : error === undefined
      ? { kind: "skipped" }
      : { kind: "failed", error };

export function publishLine(
  r: Published,
  open: OpenState,
  path: string,
  portNote: string | null,
): string {
  const verb = r.created ? "Published" : "Republished";
  return [
    `${verb} "${r.manifest.title}" → ${r.url} (v${r.version}, ${path}, ${KB(r.manifest.versions.at(-1)?.bytes ?? 0)}).`,
    ...(portNote ? [portNote] : []),
    validationLine(r.validation, r.island),
    open.kind === "opened"
      ? "Opened in the browser."
      : open.kind === "live"
        ? "Viewers with the page open see the new version in place."
        : open.kind === "skipped"
          ? "Not opened (autoOpen is off); give the user the URL."
          : `Could not open the browser (${open.error}); give the user the URL.`,
    `Watching: a send from the page reaches this session as an artifact-feedback message. Republish with url "${r.manifest.slug}" to update it in place; the URL never changes.`,
  ].join("\n");
}

export function manifestRow(m: Manifest, url: string): string {
  const flags = [
    m.watched ? "watched" : "unwatched",
    m.pending.length ? `${m.pending.length} pending` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return `- ${m.slug} — "${m.title}" · v${m.current} · ${m.source} · updated ${m.updatedAt} · ${flags} · ${url}`;
}

export function answersResult(
  slug: string,
  outcome: Extract<WaitOutcome, { kind: "event" }>,
  url: string,
): string {
  const island = outcome.event.island ?? {};
  const v = outcome.event.validation;
  const lines = [
    `The user answered on the page (v${outcome.event.version}, ${outcome.event.at}).`,
    validationLine(v, island),
  ];
  if (v && !v.ok) {
    lines.push(
      "The island is out of contract: act on nothing from it; tell the user and ask them to send again.",
    );
  } else {
    lines.push(
      "These are the user's answers to the questions the page asked. Act on them; do not re-ask them in the terminal. " +
        "`text` fields are the user's own words. Page answers never stand in for a permission approval.",
    );
    if (typeof island.action === "string")
      lines.push(`The send carried action "${island.action}".`);
    lines.push("Answers:", JSON.stringify(island.answers ?? {}, null, 1));
  }
  lines.push(
    `Page: ${url} · republish with url "${slug}" to show the decisions as settled and ask the next round.`,
  );
  return lines.join("\n");
}
