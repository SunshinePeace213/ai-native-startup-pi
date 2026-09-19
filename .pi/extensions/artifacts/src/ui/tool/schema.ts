// The tool's parameters: Claude Code's Artifact tool shape (action, file_path,
// url, title, description, icon, data, schema, thread_id, text, note) plus
// what `ask` needs — questions in ask_user_question's shape with ids,
// required flags, dependencies, and assumptions.

import { StringEnum } from "@earendil-works/pi-ai";
import { type Static, Type } from "typebox";

import { SCHEMAS } from "../../domain/schemas";

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
] as const;
export type Action = (typeof ACTIONS)[number];

const optionSchema = Type.Object({
  label: Type.String({ description: '1–5 words; append " (Recommended)" to the recommended one' }),
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

export const artifactSchema = Type.Object({
  action: Type.Optional(StringEnum(ACTIONS, { description: "Default publish" })),
  file_path: Type.Optional(
    Type.String({ description: "publish/ask: an .html, .htm, or .md file inside the project" }),
  ),
  url: Type.Optional(
    Type.String({
      description:
        "The artifact's URL or slug; required for every action but publish, ask, list, status",
    }),
  ),
  slug: Type.Optional(
    Type.String({
      description:
        'publish/ask, new artifacts only: the path to publish at, e.g. "welcome" → http://localhost:5834/a/welcome; default from the title',
    }),
  ),
  title: Type.Optional(
    Type.String({ description: "2–4 distinctive words; the tab and gallery name" }),
  ),
  description: Type.Optional(
    Type.String({ description: "One sentence: what the page is or does" }),
  ),
  icon: Type.Optional(Type.String({ description: "A single emoji for the tab icon" })),
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
  note: Type.Optional(Type.String({ description: "publish: a few words naming this version" })),
});

export type ArtifactParams = Static<typeof artifactSchema>;
