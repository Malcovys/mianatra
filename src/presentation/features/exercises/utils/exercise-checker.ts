import type { RealSessionExercise } from "@/src/presentation/features/study-session/utils/real-session-exercise";
import { normalizeAnswer } from "./answer-normalizer";

export type ExerciseCheckResult = {
  exerciseId: string;
  answer: string;
  normalizedAnswer: string;
  isCorrect: boolean;
  expectedAnswer: string;
};

export function checkExerciseAnswer(
  exercise: RealSessionExercise,
  answer: string,
): ExerciseCheckResult {
  const normalizedAnswer = normalizeAnswer(answer);
  const acceptedAnswers = [exercise.expectedAnswer, ...(exercise.acceptedAnswers ?? [])].map(
    normalizeAnswer,
  );

  return {
    exerciseId: exercise.id,
    answer,
    normalizedAnswer,
    isCorrect: acceptedAnswers.includes(normalizedAnswer),
    expectedAnswer: exercise.expectedAnswer,
  };
}
