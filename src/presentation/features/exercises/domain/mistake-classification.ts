import type { AnswerValidationResult } from "./answer-validation";

export type MistakeType =
  | "concept_not_understood"
  | "forgotten_formula"
  | "calculation_error"
  | "instruction_misread"
  | "missing_step"
  | "concept_confusion"
  | "incomplete_answer";

export function classifyMistake(result: AnswerValidationResult, answer: unknown): MistakeType | null {
  if (result.isCorrect || result.status === "requires_ai_review") {
    return null;
  }

  const rawAnswer = String(answer ?? "").trim();
  if (!rawAnswer) {
    return "incomplete_answer";
  }

  const expectedNumber = Number(result.expectedAnswer.replace(",", "."));
  const answerNumber = Number(result.normalizedAnswer.replace(",", "."));
  if (Number.isFinite(expectedNumber) && Number.isFinite(answerNumber)) {
    return "calculation_error";
  }

  return null;
}
