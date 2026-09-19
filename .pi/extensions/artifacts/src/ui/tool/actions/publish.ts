// publish — a file becomes a page, or a new version of one. The same file
//           path republishes to the same URL (Claude Code's rule).
// ask     — a questions page, then wait for the answers inside the call;
//           on timeout the page stays watched and a send wakes the session.

import { QUESTIONS_SCHEMA, declaredSchema } from "../../../domain/schemas";
import type { Island, SourceKind } from "../../../domain/types";
import type { ActionContext } from "../context";
import { questionsPage, readSourceFile } from "../files";
import {
  type OpenState,
  answersResult,
  openState,
  publishLine,
  text,
  type ToolResult,
} from "../format";

export async function publish(a: ActionContext): Promise<ToolResult> {
  const { params, host, config, ctx } = a;
  if (!params.file_path)
    throw new Error("publish needs file_path (an .html, .htm, or .md file inside the project)");
  const file = readSourceFile(ctx.cwd, params.file_path);
  const update = params.url ? await a.need() : undefined;
  const result = await host.publish({
    kind: file.kind,
    source: file.source,
    island: params.data as Island | undefined,
    title: params.title,
    description: params.description,
    icon: params.icon,
    update,
    slug: params.slug,
    sourcePath: file.path,
    note: params.note,
  });
  const open: OpenState = !result.created
    ? { kind: "live" }
    : openState(config.autoOpen ? await host.open(result.manifest.slug) : undefined);
  return text(publishLine(result, open, file.path), {
    action: a.action,
    slug: result.manifest.slug,
    title: result.manifest.title,
    url: result.url,
    version: result.version,
    summary: `${result.created ? "published" : "republished"} v${result.version}`,
  });
}

export async function ask(a: ActionContext): Promise<ToolResult> {
  const { params, host, config, ctx } = a;
  let kind: SourceKind;
  let source: string;
  let island: Island | undefined;
  let path: string;
  let sourcePath: string | undefined;
  if (params.questions?.length) {
    kind = "html";
    source = questionsPage(params.title?.trim() || "Questions");
    island = {
      schema: QUESTIONS_SCHEMA,
      intro: params.intro,
      questions: params.questions,
      assumptions: params.assumptions,
      answers: {},
    };
    path = "generated";
  } else if (params.file_path) {
    const file = readSourceFile(ctx.cwd, params.file_path);
    kind = file.kind;
    source = file.source;
    island = params.data as Island | undefined;
    path = file.path;
    sourcePath = file.path;
  } else {
    throw new Error(
      "ask needs questions (with title) or file_path whose island declares questions/v1",
    );
  }
  const update = params.url ? await a.need() : undefined;
  const result = await host.publish({
    kind,
    source,
    island,
    title: params.title,
    description: params.description,
    icon: params.icon,
    update,
    slug: params.slug,
    sourcePath,
    note: params.note ?? "ask",
  });
  if (declaredSchema(result.island) !== QUESTIONS_SCHEMA) {
    throw new Error(
      `ask needs a questions/v1 island; "${result.manifest.slug}" was published (v${result.version}) without one — republish it with questions or data`,
    );
  }
  const open: OpenState = !result.created
    ? { kind: "live" }
    : openState(config.autoOpen ? await host.open(result.manifest.slug) : undefined);
  const timeoutMs = Math.max(1, params.timeout ?? config.askTimeoutSeconds) * 1000;
  const outcome = await host.waitForPage(result.manifest.slug, timeoutMs, a.signal);
  const slug = result.manifest.slug;
  const base = {
    action: a.action,
    slug,
    title: result.manifest.title,
    url: result.url,
    version: result.version,
  };
  const header = publishLine(result, open, path);
  if (outcome.kind === "event") {
    return text(`${header}\n\n${answersResult(slug, outcome, host.url(slug, false))}`, {
      ...base,
      summary: `answered v${outcome.event.version} (reply ${outcome.event.response ?? 1})`,
    });
  }
  if (outcome.kind === "aborted") {
    return text(
      `${header}\n\nCancelled while waiting. The page stays published and watched; a send still wakes this session.`,
      { ...base, summary: "cancelled while waiting" },
    );
  }
  return text(
    `${header}\n\nNo answer within ${Math.round(timeoutMs / 1000)} s. The page stays up and watched: when the user sends, this session ` +
      `is woken with an artifact-feedback message carrying the answers. End your turn now with one line telling the user to answer on ` +
      `the page; do not re-ask these questions in the terminal, and do not proceed on guessed answers.`,
    { ...base, summary: "waiting for the page" },
  );
}
