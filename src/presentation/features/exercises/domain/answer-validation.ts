import type { Exercise } from "@/src/db";
import { InvalidAnswerError } from "@/src/presentation/features/shared";

export type AnswerValidationStatus = "correct" | "incorrect" | "requires_ai_review";

export type AnswerValidationResult = {
  status: AnswerValidationStatus;
  isCorrect: boolean;
  normalizedAnswer: string;
  expectedAnswer: string;
};

const NUMERIC_TOLERANCE = 0.000001;

export function normalizeAnswer(value: unknown) {
  if (value === null || value === undefined) {
    throw new InvalidAnswerError();
  }
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*,\s*/g, ",");

  if (!normalized) {
    throw new InvalidAnswerError();
  }

  return normalized;
}

export function checkTrueFalseAnswer(expected: unknown, answer: unknown): AnswerValidationResult {
  const normalizedAnswer = normalizeAnswer(answer);
  const expectedAnswer = normalizeAnswer(expected);
  const aliases = new Map([
    ["vrai", "true"],
    ["true", "true"],
    ["1", "true"],
    ["oui", "true"],
    ["faux", "false"],
    ["false", "false"],
    ["0", "false"],
    ["non", "false"],
  ]);
  const answerValue = aliases.get(normalizedAnswer);
  const expectedValue = aliases.get(expectedAnswer);
  if (!answerValue || !expectedValue) {
    return { status: "incorrect", isCorrect: false, normalizedAnswer, expectedAnswer };
  }
  const isCorrect = answerValue === expectedValue;
  return { status: isCorrect ? "correct" : "incorrect", isCorrect, normalizedAnswer, expectedAnswer };
}

export function checkMultipleChoiceAnswer(expected: unknown, answer: unknown): AnswerValidationResult {
  const normalizedAnswer = normalizeAnswer(answer);
  const expectedAnswer = normalizeAnswer(expected);
  const isCorrect = normalizedAnswer === expectedAnswer;
  return { status: isCorrect ? "correct" : "incorrect", isCorrect, normalizedAnswer, expectedAnswer };
}

export function checkNumericAnswer(expected: unknown, answer: unknown, tolerance = NUMERIC_TOLERANCE): AnswerValidationResult {
  const normalizedAnswer = normalizeAnswer(answer).replace(",", ".");
  const expectedAnswer = normalizeAnswer(expected).replace(",", ".");
  const answerNumber = Number(normalizedAnswer);
  const expectedNumber = Number(expectedAnswer);
  if (!Number.isFinite(answerNumber) || !Number.isFinite(expectedNumber)) {
    return { status: "incorrect", isCorrect: false, normalizedAnswer, expectedAnswer };
  }
  const isCorrect = Math.abs(answerNumber - expectedNumber) <= tolerance;
  return { status: isCorrect ? "correct" : "incorrect", isCorrect, normalizedAnswer, expectedAnswer };
}

export function checkShortAnswer(expected: unknown, answer: unknown): AnswerValidationResult {
  const normalizedAnswer = normalizeAnswer(answer);
  const expectedAnswer = normalizeAnswer(expected);
  const isCorrect = normalizedAnswer === expectedAnswer;
  return { status: isCorrect ? "correct" : "incorrect", isCorrect, normalizedAnswer, expectedAnswer };
}

export function validateExerciseAnswer(exercise: Pick<Exercise, "type" | "expectedAnswer">, answer: unknown): AnswerValidationResult {
  switch (exercise.type) {
    case "true_false":
      return checkTrueFalseAnswer(exercise.expectedAnswer, answer);
    case "multiple_choice":
      return checkMultipleChoiceAnswer(exercise.expectedAnswer, answer);
    case "numeric":
      return checkNumericAnswer(exercise.expectedAnswer, answer);
    case "short_answer":
      return checkShortAnswer(exercise.expectedAnswer, answer);
    case "explanation": {
      const normalizedAnswer = normalizeAnswer(answer);
      return { status: "requires_ai_review", isCorrect: false, normalizedAnswer, expectedAnswer: normalizeAnswer(exercise.expectedAnswer) };
    }
    case "graph_reading":
      return checkShortAnswer(exercise.expectedAnswer, answer);
    default:
      return checkShortAnswer(exercise.expectedAnswer, answer);
  }
}
