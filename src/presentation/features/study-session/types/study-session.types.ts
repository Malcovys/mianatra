import type { ExerciseCheckResult } from "@/src/presentation/features/exercises/utils/exercise-checker";
import type { RealSessionExercise } from "../utils/real-session-exercise";

export type SessionMode = "initial" | "targeted";

export type SessionAttempt = ExerciseCheckResult & {
  conceptName: string;
  usedHint: boolean;
};

export type SessionSummary = {
  score: number;
  correctAnswers: number;
  totalExercises: number;
  progress: number;
  strength: string;
  notionToImprove: string;
  nextRecommendation: string;
  attempts: SessionAttempt[];
  targetedExercises: RealSessionExercise[];
};
