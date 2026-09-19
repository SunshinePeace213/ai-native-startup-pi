// shared/schemas — what the session trusts from a page, and what it refuses.
//
// Q1  validateQuestionsShape: an island needs the schema name and a non-empty
//     questions list; each question an id and a question; ids unique across
//     questions and assumptions; option labels unique; `recommended` in range;
//     a question with no options and allowText=false is unanswerable
// Q2  validateAnswers: a selection must name an option of its question; a
//     single-select takes one; text is refused where allowText=false; an
//     answer for an unknown id is refused; an assumption answers confirm or
//     override only
// Q3  required questions with no selection and no text are reported as
//     unanswered; optional ones are not; a hidden dependent question counts
//     for nothing until its parent's selection shows it
// Q4  declaredSchema names only registered schemas; validateIsland returns
//     null for an untyped island and the questions validation otherwise

import { describe, expect, test } from "bun:test";

import {
  declaredSchema,
  validateAnswers,
  validateIsland,
  validateQuestionsShape,
} from "@ext/artifacts/shared/schemas";

const base = {
  schema: "questions/v1",
  questions: [
    {
      id: "tiering",
      question: "Which model?",
      options: [{ label: "Usage" }, { label: "Seat" }],
      recommended: 0,
    },
    {
      id: "region",
      question: "Where?",
      options: [{ label: "EU" }, { label: "US" }],
      dependsOn: { tiering: "Usage" },
    },
    { id: "notes", question: "Anything else?", required: false },
    { id: "strict", question: "Pick one", options: [{ label: "A" }], allowText: false },
  ],
  assumptions: [{ id: "stripe", text: "Stripe stays" }],
  answers: {},
};

describe("questions/v1", () => {
  test("Q1 the shape the author writes is checked", () => {
    expect(validateQuestionsShape(base)).toEqual([]);
    const rows: Array<[string, unknown, RegExp]> = [
      ["not an object", "x", /not an object/],
      ["wrong schema", { ...base, schema: "other" }, /schema must be/],
      ["no questions", { ...base, questions: [] }, /non-empty/],
      ["question without id", { ...base, questions: [{ question: "?" }] }, /id is required/],
      ["question without text", { ...base, questions: [{ id: "a" }] }, /question is required/],
      [
        "duplicate id",
        { ...base, questions: [...base.questions, { id: "tiering", question: "?" }] },
        /duplicated/,
      ],
      [
        "assumption id collides",
        { ...base, assumptions: [{ id: "notes", text: "x" }] },
        /collides/,
      ],
      [
        "duplicate option",
        {
          ...base,
          questions: [{ id: "a", question: "?", options: [{ label: "X" }, { label: "X" }] }],
        },
        /duplicated/,
      ],
      [
        "recommended out of range",
        {
          ...base,
          questions: [{ id: "a", question: "?", options: [{ label: "X" }], recommended: 3 }],
        },
        /out of range/,
      ],
      [
        "unanswerable",
        { ...base, questions: [{ id: "a", question: "?", allowText: false }] },
        /cannot be answered/,
      ],
    ];
    for (const [name, island, expected] of rows) {
      expect(validateQuestionsShape(island).join(" | "), name).toMatch(expected);
    }
  });

  test("Q2 answers are refused when they name what the page never offered", () => {
    const answers = (a: Record<string, unknown>) => validateAnswers({ ...base, answers: a });
    expect(answers({ tiering: { selected: ["Free"] } }).errors.join()).toMatch(/not an option/);
    expect(answers({ tiering: { selected: ["Usage", "Seat"] } }).errors.join()).toMatch(
      /single-select/,
    );
    expect(answers({ strict: { selected: ["A"], text: "but" } }).errors.join()).toMatch(
      /does not allow/,
    );
    expect(answers({ ghost: { selected: [] } }).errors.join()).toMatch(/names no question/);
    expect(answers({ stripe: { selected: ["maybe"] } }).errors.join()).toMatch(/confirm.*override/);
    expect(answers({ tiering: { selected: "Usage" } }).errors.join()).toMatch(/must be an array/);
    const ok = answers({
      tiering: { selected: ["Seat"] },
      strict: { selected: ["A"] },
      stripe: { selected: ["override"], text: "Paddle" },
    });
    expect(ok.ok).toBe(true);
    expect(ok.errors).toEqual([]);
  });

  test("Q3 required and hidden questions are counted correctly", () => {
    const empty = validateAnswers(base);
    expect(empty.ok).toBe(true);
    expect(empty.unanswered).toEqual(["tiering", "strict"]);
    expect(empty.total).toBe(3); // region is hidden until tiering = Usage
    const shown = validateAnswers({ ...base, answers: { tiering: { selected: ["Usage"] } } });
    expect(shown.unanswered).toEqual(["region", "strict"]);
    expect(shown.total).toBe(4);
    expect(shown.answered).toBe(1);
    const textOnly = validateAnswers({ ...base, answers: { tiering: { text: "neither" } } });
    expect(textOnly.unanswered).toEqual(["strict"]);
  });

  test("Q4 only registered schemas are recognised", () => {
    expect(declaredSchema({ schema: "questions/v1" })).toBe("questions/v1");
    expect(declaredSchema({ schema: "workshop/v9" })).toBeNull();
    expect(declaredSchema({ mood: "ok" })).toBeNull();
    expect(declaredSchema(null)).toBeNull();
    expect(validateIsland({ mood: "ok" })).toBeNull();
    expect(validateIsland(base)?.total).toBe(3);
  });
});
