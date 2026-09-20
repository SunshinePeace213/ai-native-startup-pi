// The tool's parameters: Claude Code's Artifact tool shape (action, file_path,
// files, root, capabilities, url, path, paths, scope, type, intent, title,
// description, icon, label, force, pin, data, schema, thread_id, text) plus what `ask` needs —
// questions in ask_user_question's shape with ids, required flags,
// dependencies, and assumptions.

import { StringEnum } from "@earendil-works/pi-ai";
import { type Static, Type } from "typebox";

import { SERVED_CAPABILITIES } from "../../domain/capabilities";
import { MAX_FILE_ENTRIES } from "../../domain/files";
import { SCHEMAS } from "../../domain/schemas";
import { MAX_LABEL } from "../../domain/types";

export const ACTIONS = [
  "publish",
  "ask",
  "read",
  "read_page_data",
  "verify",
  "open",
  "list",
  "status",
  "watch",
  "unwatch",
  "pin",
  "unpin",
  "comments",
  "reply",
  "resolve",
  "delete",
  "quickstart",
] as const;
export type Action = (typeof ACTIONS)[number];

/** Claude Code's intents for a quickstart: what is about to be made. */
export const INTENTS = ["document", "slides", "design", "other"] as const;

const optionSchema = Type.Object({
  label: Type.String({
    description: "1–5 words; the question's `recommended` index marks the recommended one",
  }),
  description: Type.Optional(Type.String({ description: "What choosing it means or costs" })),
  preview: Type.Optional(
    Type.String({
      description: "Monospace preview shown beside the option: a mockup, snippet, or config",
    }),
  ),
});

const questionSchema = Type.Object({
  id: Type.String({ description: 'Stable key the answer comes back under, e.g. "tiering"' }),
  question: Type.String({ description: "The complete question, ending in a question mark" }),
  header: Type.Optional(
    Type.String({ description: "Short chip shown above the question, ≤16 chars" }),
  ),
  options: Type.Optional(
    Type.Array(optionSchema, { description: "2–6 choices; omit for a free-text question" }),
  ),
  multiSelect: Type.Optional(Type.Boolean({ description: "Allow several selections" })),
  required: Type.Optional(
    Type.Boolean({ description: "Default true; the page cannot send until answered" }),
  ),
  recommended: Type.Optional(Type.Integer({ description: "Index of the recommended option" })),
  dependsOn: Type.Optional(
    Type.Record(Type.String(), Type.Union([Type.String(), Type.Array(Type.String())]), {
      description: "Show only when the named question's selection includes one of these labels",
    }),
  ),
  whyItMatters: Type.Optional(
    Type.String({ description: "One line on what the answer changes downstream" }),
  ),
  allowText: Type.Optional(
    Type.Boolean({ description: "Offer a free-text field beside the options (default true)" }),
  ),
});

const assumptionSchema = Type.Object({
  id: Type.String(),
  text: Type.String({ description: '"I will do X unless you change it"' }),
  default: Type.Optional(StringEnum(["confirm", "override"] as const)),
});

const CONTENT_TYPE =
  "A bare media type (text/csv, model/gltf-binary); needed only when the published extension is not a common web one";

/** Claude Code's two shapes: a map of published path → source, or a list published at its own spelling. */
const filesSchema = Type.Union(
  [
    Type.Record(
      Type.String(),
      Type.Union([
        Type.String({ description: "The source file's path" }),
        Type.Object({
          from: Type.String({ description: "The source file's path" }),
          contentType: Type.Optional(Type.String({ description: CONTENT_TYPE })),
        }),
        Type.Null({ description: "Removes this published path" }),
      ]),
    ),
    Type.Array(
      Type.Object({
        path: Type.String({
          description: "The source file's path, which is also the path it is published at",
        }),
        contentType: Type.Optional(Type.String({ description: CONTENT_TYPE })),
      }),
      { maxItems: MAX_FILE_ENTRIES },
    ),
  ],
  {
    description:
      'publish/ask: supporting files served beside the page, as {"published/path": "source/path" | {from, contentType} | null}. ' +
      "The key is what the page references: relative, no leading slash, no `..`. On a republish a path you pass is added or replaced, " +
      "a path you leave out is kept, and null removes one. A plain list publishes each file at its own spelling",
  },
);

export const SCOPES = ["files", "types"] as const;

export const artifactSchema = Type.Object({
  action: Type.Optional(StringEnum(ACTIONS, { description: "Default publish" })),
  file_path: Type.Optional(
    Type.String({
      description:
        "publish/ask: an .html, .htm, or .md file inside the project; by default .pi/artifacts/<slug>/<slug>.html, where the folder names the slug",
    }),
  ),
  files: Type.Optional(filesSchema),
  root: Type.Optional(
    Type.String({
      description:
        "publish/ask, with files: the directory relative `files` sources resolve against, inside the project; it never changes a published path",
    }),
  ),
  capabilities: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.Object({}, { additionalProperties: true }), Type.Literal(true)]),
      {
        description:
          `publish/ask: what the page may use at run time, as {name: config}, the config an object or true — served here: ${SERVED_CAPABILITIES.join(", ")}. ` +
          "Omit it on a republish to keep the artifact's declaration, pass {} to clear it; a non-empty object is the whole declaration, " +
          "so anything not restated is revoked",
      },
    ),
  ),
  url: Type.Optional(
    Type.String({
      description:
        "The artifact's URL or slug; required for every action but publish, ask, list, status, quickstart",
    }),
  ),
  path: Type.Optional(
    Type.String({
      description:
        'read: one supporting file by its published path, exactly as a "files" listing prints it; a small text file comes back inline, anything else by size and type',
    }),
  ),
  paths: Type.Optional(
    Type.Array(Type.String(), {
      maxItems: 256,
      description: "read: several published paths in place of path",
    }),
  ),
  scope: Type.Optional(
    StringEnum(SCOPES, {
      description:
        "list: `files`, with url, lists that artifact's supporting files; `types` lists the artifact types this project has",
    }),
  ),
  type: Type.Optional(
    Type.String({
      description:
        "publish, new artifacts only: the name of an artifact type from this project (.pi/artifact-types/<name>); with `title` and no " +
        "file_path it makes an artifact whose page and files are the type's, read-only — fill it afterwards by publishing `files` to its url",
    }),
  ),
  intent: Type.Optional(
    StringEnum(INTENTS, {
      description:
        "quickstart (required): what is being made — document, slides, design, or other for anything else or when unsure",
    }),
  ),
  slug: Type.Optional(
    Type.String({
      description:
        'publish/ask, new artifacts only: the path to publish at, e.g. "welcome" → http://localhost:5834/a/welcome; default from the title',
    }),
  ),
  title: Type.Optional(
    Type.String({
      description:
        "2–4 distinctive words, used only when the file does not name itself: an HTML page's <title> and a Markdown file's own name win",
    }),
  ),
  description: Type.Optional(
    Type.String({ description: "One sentence: what the page is or does" }),
  ),
  icon: Type.Optional(
    Type.String({
      description:
        "One short generic word for the tab icon — chart, calendar, recipe, code, map; never an emoji or a brand. Pass it on the first publish; omitted later, the artifact keeps it",
    }),
  ),
  data: Type.Optional(
    Type.Object(
      {},
      { additionalProperties: true, description: "The data island, overriding one in the file" },
    ),
  ),
  questions: Type.Optional(
    Type.Array(questionSchema, {
      description: "ask: the questions, rendered by the built-in form",
    }),
  ),
  assumptions: Type.Optional(
    Type.Array(assumptionSchema, {
      description: "ask: assumptions the user confirms or overrides",
    }),
  ),
  intro: Type.Optional(Type.String({ description: "ask: a paragraph above the questions" })),
  schema: Type.Optional(
    Type.String({
      description: `read_page_data: validate against this schema (${SCHEMAS.join(", ")})`,
    }),
  ),
  timeout: Type.Optional(
    Type.Number({ description: "ask: seconds to wait for the answers (default from config)" }),
  ),
  thread_id: Type.Optional(Type.String({ description: "reply/resolve: the comment thread" })),
  text: Type.Optional(Type.String({ description: "reply: plain text, ≤4096 characters" })),
  acknowledge_duplicate: Type.Optional(
    Type.Boolean({
      description:
        "reply: post although your reply already stands last on the thread; only for a follow-up that adds something new",
    }),
  ),
  label: Type.Optional(
    Type.String({
      description: `publish: a few words naming this version, at most ${MAX_LABEL} characters`,
    }),
  ),
  force: Type.Optional(
    Type.Boolean({
      description:
        "publish: overwrite a newer version this session has not read. A last resort, only when the user said to discard that version; otherwise read it and merge",
    }),
  ),
  pin: Type.Optional(
    Type.Boolean({ description: "publish: also pin the artifact; only when the user asked" }),
  ),
});

export type ArtifactParams = Static<typeof artifactSchema>;
