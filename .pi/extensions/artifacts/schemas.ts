// Interaction schemas: the contracts a data island can declare so the session
// can validate what the page sends back instead of trusting it. One schema is
// registered — `questions/v1`, the shape of ask_user_question plus ids,
// required flags, dependencies, and assumptions — and an island without a
// known schema is returned to the model as untyped data.

import type { Island, Validation } from "./types";

export interface QuestionOption {
  label: string;
  description?: string;
  preview?: string;
}

export interface Question {
  id: string;
  question: string;
  header?: string;
  options?: QuestionOption[];
  multiSelect?: boolean;
  required?: boolean;
  /** Index into options of the recommended choice. */
  recommended?: number;
  /** Shown only when the named question's selection includes one of the labels. */
  dependsOn?: Record<string, string | string[]>;
  whyItMatters?: string;
  /** Whether the page offers a free-text field beside the options (default true). */
  allowText?: boolean;
}

export interface Assumption {
  id: string;
  text: string;
  default?: "confirm" | "override";
}

export interface Answer {
  selected?: string[];
  text?: string;
}

export interface QuestionsIsland extends Island {
  schema: "questions/v1";
  round?: number;
  intro?: string;
  questions: Question[];
  assumptions?: Assumption[];
  answers?: Record<string, Answer>;
  /** A page-level action the send carried, e.g. "start". */
  action?: string;
}

export type { Validation };

export const QUESTIONS_SCHEMA = "questions/v1";
export const SCHEMAS = [QUESTIONS_SCHEMA] as const;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Structural check of a questions island as the author wrote it. */
export function validateQuestionsShape(island: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(island)) return ["island is not an object"];
  if (island.schema !== QUESTIONS_SCHEMA) errors.push(`schema must be "${QUESTIONS_SCHEMA}"`);
  if (!Array.isArray(island.questions) || island.questions.length === 0) {
    errors.push("questions must be a non-empty array");
    return errors;
  }
  const ids = new Set<string>();
  island.questions.forEach((q, k) => {
    if (!isRecord(q)) return void errors.push(`questions[${k}] is not an object`);
    if (typeof q.id !== "string" || !q.id.trim()) errors.push(`questions[${k}].id is required`);
    else if (ids.has(q.id)) errors.push(`questions[${k}].id "${q.id}" is duplicated`);
    else ids.add(q.id);
    if (typeof q.question !== "string" || !q.question.trim()) {
      errors.push(`questions[${k}].question is required`);
    }
    if (q.options !== undefined) {
      if (!Array.isArray(q.options)) errors.push(`questions[${k}].options must be an array`);
      else {
        const labels = new Set<string>();
        q.options.forEach((o, j) => {
          if (!isRecord(o) || typeof o.label !== "string" || !o.label.trim()) {
            errors.push(`questions[${k}].options[${j}].label is required`);
          } else if (labels.has(o.label)) {
            errors.push(`questions[${k}].options[${j}].label "${o.label}" is duplicated`);
          } else labels.add(o.label);
        });
        if (
          typeof q.recommended === "number" &&
          (q.recommended < 0 || q.recommended >= q.options.length)
        ) {
          errors.push(`questions[${k}].recommended is out of range`);
        }
      }
    } else if (q.allowText === false) {
      errors.push(`questions[${k}] has no options and allowText=false, so it cannot be answered`);
    }
  });
  if (island.assumptions !== undefined) {
    if (!Array.isArray(island.assumptions)) errors.push("assumptions must be an array");
    else
      island.assumptions.forEach((a, k) => {
        if (!isRecord(a) || typeof a.id !== "string" || typeof a.text !== "string") {
          errors.push(`assumptions[${k}] needs id and text`);
        } else if (ids.has(a.id))
          errors.push(`assumptions[${k}].id "${a.id}" collides with a question`);
        else ids.add(a.id);
      });
  }
  if (island.answers !== undefined && !isRecord(island.answers))
    errors.push("answers must be an object");
  return errors;
}

function visible(q: Question, answers: Record<string, Answer>): boolean {
  if (!q.dependsOn) return true;
  return Object.entries(q.dependsOn).every(([parent, wanted]) => {
    const selected = answers[parent]?.selected ?? [];
    const labels = Array.isArray(wanted) ? wanted : [wanted];
    return labels.some((l) => selected.includes(l));
  });
}

/** Validates the answers a page sent against the questions it was given. */
export function validateAnswers(island: unknown): Validation {
  const shape = validateQuestionsShape(island);
  if (shape.length) return { ok: false, errors: shape, unanswered: [], answered: 0, total: 0 };
  const q = island as QuestionsIsland;
  const answers = q.answers ?? {};
  const errors: string[] = [];
  const known = new Set<string>([
    ...q.questions.map((x) => x.id),
    ...(q.assumptions ?? []).map((a) => a.id),
  ]);
  for (const id of Object.keys(answers)) {
    if (!known.has(id)) errors.push(`answers.${id} names no question or assumption`);
  }
  const unanswered: string[] = [];
  let answered = 0;
  let total = 0;
  for (const question of q.questions) {
    if (!visible(question, answers)) continue;
    total += 1;
    const a = answers[question.id];
    if (!isRecord(a)) {
      if (question.required !== false) unanswered.push(question.id);
      continue;
    }
    const selected = Array.isArray(a.selected) ? a.selected : [];
    const text = typeof a.text === "string" ? a.text.trim() : "";
    if (a.selected !== undefined && !Array.isArray(a.selected)) {
      errors.push(`answers.${question.id}.selected must be an array`);
    }
    if (a.text !== undefined && typeof a.text !== "string") {
      errors.push(`answers.${question.id}.text must be a string`);
    }
    const labels = new Set((question.options ?? []).map((o) => o.label));
    for (const s of selected) {
      if (typeof s !== "string" || !labels.has(s)) {
        errors.push(`answers.${question.id} selects "${String(s)}", which is not an option`);
      }
    }
    if (!question.multiSelect && selected.length > 1) {
      errors.push(
        `answers.${question.id} selects ${selected.length} options on a single-select question`,
      );
    }
    if (text && question.allowText === false) {
      errors.push(`answers.${question.id} carries text but the question does not allow it`);
    }
    if (selected.length || text) answered += 1;
    else if (question.required !== false) unanswered.push(question.id);
  }
  for (const a of q.assumptions ?? []) {
    const v = answers[a.id];
    if (v === undefined) continue;
    const s = isRecord(v) && Array.isArray(v.selected) ? v.selected : [];
    if (s.length && !s.every((x) => x === "confirm" || x === "override")) {
      errors.push(`answers.${a.id} for an assumption must select "confirm" or "override"`);
    }
  }
  return { ok: errors.length === 0, errors, unanswered, answered, total };
}

/** The schema the island declares, when it is one this extension knows. */
export function declaredSchema(island: Island | null): string | null {
  if (!island || typeof island.schema !== "string") return null;
  return (SCHEMAS as readonly string[]).includes(island.schema) ? island.schema : null;
}

/** Runs the right validator for the island's schema; null when it has none. */
export function validateIsland(island: Island | null): Validation | null {
  if (!island) return null;
  if (declaredSchema(island) === QUESTIONS_SCHEMA) return validateAnswers(island);
  return null;
}
