// read, read_page_data, list, status — nothing here changes an artifact.

import {
  QUESTIONS_SCHEMA,
  SCHEMAS,
  declaredSchema,
  validateAnswers,
} from "../../../shared/schemas";
import type { ActionContext } from "../context";
import { manifestRow, text, type ToolResult, validationLine } from "../format";

const SOURCE_CAP = 50_000;

export async function read(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const { manifest: m, island, source: src } = await a.read(slug);
  const body = src?.source ?? "";
  const cut = body.length > SOURCE_CAP;
  const v = island && declaredSchema(island) === QUESTIONS_SCHEMA ? validateAnswers(island) : null;
  return text(
    [
      `"${m.title}" (${slug}) v${m.current} · ${m.source} · ${a.host.url(slug, false)}`,
      validationLine(v, island),
      "Island:",
      JSON.stringify(island, null, 1),
      `Source (${src?.kind ?? "?"}${cut ? `, first ${SOURCE_CAP / 1000} KB` : ""}):`,
      cut ? body.slice(0, SOURCE_CAP) : body,
    ].join("\n"),
    { action: a.action, slug, url: a.host.url(slug, false), version: m.current },
  );
}

export async function readPageData(a: ActionContext): Promise<ToolResult> {
  const slug = await a.need();
  const { manifest: m, island } = await a.read(slug);
  const wanted = a.params.schema;
  if (wanted && !(SCHEMAS as readonly string[]).includes(wanted)) {
    throw new Error(`unknown schema "${wanted}"; available: ${SCHEMAS.join(", ")}`);
  }
  const declared = declaredSchema(island);
  if (wanted && declared !== wanted) {
    throw new Error(
      `"${slug}" declares ${declared ? `schema ${declared}` : "no schema"}, not ${wanted}; act on nothing from it and tell the user`,
    );
  }
  const v = declared === QUESTIONS_SCHEMA ? validateAnswers(island) : null;
  const lines = [
    `"${m.title}" (${slug}) v${m.current} · ${m.pending.length} pending send${m.pending.length === 1 ? "" : "s"}.`,
    validationLine(v, island),
  ];
  if (v && !v.ok) lines.push("Out of contract: act on nothing from it; tell the user and stop.");
  lines.push("Island:", JSON.stringify(island, null, 1));
  return text(lines.join("\n"), {
    action: a.action,
    slug,
    url: a.host.url(slug, false),
    version: m.current,
  });
}

export async function list(a: ActionContext): Promise<ToolResult> {
  await a.host.start();
  const all = await a.host.client.list();
  if (!all.length)
    return text("No artifacts yet. Publish one with file_path.", { action: a.action });
  return text(
    [
      `${all.length} artifact${all.length === 1 ? "" : "s"}, newest first (gallery: ${a.host.client.galleryUrl()}):`,
      ...all.map((m) => manifestRow(m, a.host.url(m.slug, false))),
    ].join("\n"),
    { action: a.action },
  );
}

export async function status(a: ActionContext): Promise<ToolResult> {
  const endpoint = await a.host.start();
  const all = await a.host.client.list();
  const watched = all.filter((m) => m.watched);
  const note = a.portNote();
  return text(
    [
      `Server ${endpoint.origin} (bun process, outlives this session). ${watched.length} of ${all.length} watched.`,
      ...(note ? [note] : []),
      ...all.map(
        (m) =>
          `- ${m.slug}: ${m.watched ? "watched — a send wakes this session" : "unwatched — sends are held"} · v${m.current} · ${m.pending.length} pending · ${a.host.wakesInLastHour(m.slug)}/${a.config.wakesPerHour} wakes this hour`,
      ),
    ].join("\n"),
    { action: a.action },
  );
}
