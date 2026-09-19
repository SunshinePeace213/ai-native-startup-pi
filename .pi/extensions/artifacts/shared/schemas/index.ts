// The registry of interaction schemas a data island can declare, so the
// session validates what the page sends back instead of trusting it. An
// island without a known schema is returned to the model as untyped data.

import type { Island, Validation } from "../types";
import { QUESTIONS_SCHEMA, validateAnswers } from "./questions";

export {
  type Answer,
  type Assumption,
  type Question,
  type QuestionOption,
  type QuestionsIsland,
  QUESTIONS_SCHEMA,
  validateAnswers,
  validateQuestionsShape,
} from "./questions";
export type { Validation };

export const SCHEMAS = [QUESTIONS_SCHEMA] as const;

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
