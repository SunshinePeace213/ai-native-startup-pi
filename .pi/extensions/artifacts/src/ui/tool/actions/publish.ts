// publish — a file becomes a page, or a new version of one. The same file
//           path republishes to the same URL (Claude Code's rule); `force`
//           overwrites a version this session has not read, `pin` also pins,
//           `files` publishes supporting files beside the page, and
//           `capabilities` declares what the page may use at run time. With
//           `type` it makes a new artifact from one of the project's types,
//           whose page stays read-only: that artifact is then published with
//           url and files alone.
// ask     — a questions page, then wait for the answers inside the call;
//           on timeout the page stays watched and a send wakes the session.

import { QUESTIONS_SCHEMA, declaredSchema } from "../../../domain/schemas";
import type { Capabilities, Island, SourceKind } from "../../../domain/types";
import type { Published } from "../../host";
import { loadType } from "../artifact-types";
import type { ActionContext } from "../context";
import { questionsPage, readPublishFiles, readSourceFile } from "../files";
import {
  type OpenState,
  answersResult,
  openState,
  publishLine,
  text,
  type ToolResult,
} from "../format";

/** `pin: true` rides on a publish; a pin that fails never fails the publish, and the result says so. */
async function pinLine(a: ActionContext, result: Published): Promise<string> {
  if (a.params.pin !== true) return "";
  try {
    await a.host.client.pin(result.manifest.slug, true);
    return "\nPinned: it is exempt from the retention sweep.";
  } catch (e) {
    return `\nPublished, but not pinned (${(e as Error).message}); action "pin" tries again.`;
  }
}

/** What every publish passes on as the model gave it. */
const common = (a: ActionContext) => ({
  island: a.params.data as Island | undefined,
  description: a.params.description,
  icon: a.params.icon,
  label: a.params.label,
  capabilities: a.params.capabilities as Capabilities | undefined,
});

/** The result of a publish, as every kind of publish reports it. */
async function published(a: ActionContext, result: Published, from: string): Promise<ToolResult> {
  const open: OpenState = !result.created
    ? { kind: "live" }
    : openState(a.config.autoOpen ? await a.host.open(result.manifest.slug) : undefined);
  return text(publishLine(result, open, from) + (await pinLine(a, result)), {
    action: a.action,
    slug: result.manifest.slug,
    title: result.manifest.title,
    url: result.url,
    version: result.version,
    summary: `${result.created ? "published" : "republished"} v${result.version}`,
  });
}

/**
 * A new artifact from one of the project's types: the type's page and files
 * are its first version and stay read-only; files of the artifact's own may
 * come with it, and the rest follow by publishing `files` to its url.
 */
async function publishFromType(a: ActionContext, name: string): Promise<ToolResult> {
  const { params, host, ctx } = a;
  if (params.file_path)
    throw new Error(
      "a type brings its own page; drop file_path, and give the artifact its own content with files",
    );
  if (params.url)
    throw new Error(
      "a type makes a new artifact; drop url — or drop type, to publish files to the one that exists",
    );
  if (!params.title?.trim())
    throw new Error("publish with type needs title: it names the new artifact");
  const made = loadType(ctx.cwd, name);
  const own = readPublishFiles(ctx.cwd, params.files, params.root) ?? {};
  const taken = Object.keys(own).filter((path) => Object.hasOwn(made.files, path));
  if (taken.length) {
    throw new Error(
      `${taken.join(", ")} ${taken.length === 1 ? "is" : "are"} the type's own (read_only_path); publish the artifact's files at other paths`,
    );
  }
  const result = await host.publish({
    ...common(a),
    kind: "html",
    source: made.source,
    title: params.title,
    slug: params.slug,
    type: { name, paths: Object.keys(made.files) },
    files: { ...made.files, ...own },
  });
  return published(a, result, `type ${name}`);
}

export async function publish(a: ActionContext): Promise<ToolResult> {
  const { params, host, ctx } = a;
  if (params.type !== undefined) return publishFromType(a, params.type);
  if (!params.file_path) {
    // No page of its own to send: only an artifact made from a type is published this way, and the server says so.
    if (!params.url || !params.files) {
      throw new Error(
        "publish needs file_path (an .html, .htm, or .md file inside the project); an artifact made from a type takes url and files instead",
      );
    }
    const files = readPublishFiles(ctx.cwd, params.files, params.root);
    const update = await a.need();
    const result = await host.publish(
      { ...common(a), update, files },
      { force: params.force === true },
    );
    return published(a, result, "its files");
  }
  const file = readSourceFile(ctx.cwd, params.file_path);
  const files = readPublishFiles(ctx.cwd, params.files, params.root);
  const update = params.url ? await a.need() : undefined;
  const result = await host.publish(
    {
      ...common(a),
      kind: file.kind,
      source: file.source,
      title: params.title,
      update,
      slug: params.slug,
      sourcePath: file.path,
      files,
    },
    { force: params.force === true },
  );
  return published(a, result, file.path);
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
  const files = readPublishFiles(ctx.cwd, params.files, params.root);
  const update = params.url ? await a.need() : undefined;
  const result = await host.publish(
    {
      kind,
      source,
      island,
      title: params.title,
      description: params.description,
      icon: params.icon,
      update,
      slug: params.slug,
      sourcePath,
      label: params.label ?? "ask",
      files,
      capabilities: params.capabilities as Capabilities | undefined,
    },
    { force: params.force === true },
  );
  if (declaredSchema(result.island) !== QUESTIONS_SCHEMA) {
    throw new Error(
      `ask needs a questions/v1 island; "${result.manifest.slug}" was published (v${result.version}) without one — republish it with questions or data`,
    );
  }
  const open: OpenState = !result.created
    ? { kind: "live" }
    : openState(config.autoOpen ? await host.open(result.manifest.slug) : undefined);
  const header = publishLine(result, open, path) + (await pinLine(a, result));
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
