import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { conceptProgress, exerciseAttempts, exercises, studySessions } from "../schema";
import type { ConceptProgress, ExerciseAttempt, NewExerciseAttempt, StudySession } from "../types";
import { assertInteger, assertNonEmpty, assertNonNegative, firstOrThrow } from "./repository-utils";
import { type UpsertConceptProgressInput, validateProgressInput } from "./progress.repository";

export type CreateAttemptInput = Omit<NewExerciseAttempt, "id" | "createdAt">;
export type SubmitAttemptWithProgressInput = {
  attempt: CreateAttemptInput;
  progress: {
    conceptId: string;
    input: UpsertConceptProgressInput;
  };
  sessionIndex?: {
    sessionId: string;
    currentExerciseIndex: number;
  };
};

function validateAttemptInput(input: CreateAttemptInput) {
  assertNonEmpty(input.exerciseId, "exerciseId");
  assertNonEmpty(input.sessionId, "sessionId");
  assertNonEmpty(input.userAnswer, "userAnswer");
  if (typeof input.isCorrect !== "boolean") {
    throw new Error("isCorrect must be a boolean.");
  }
  if (typeof input.usedHint !== "boolean") {
    throw new Error("usedHint must be a boolean.");
  }
  if (input.responseTimeMs !== null && input.responseTimeMs !== undefined && input.responseTimeMs <= 0) {
    throw new Error("responseTimeMs must be positive or null.");
  }
}

async function create(input: CreateAttemptInput): Promise<ExerciseAttempt> {
  validateAttemptInput(input);
  return firstOrThrow(
    db.insert(exerciseAttempts).values({ id: createId(), createdAt: nowIso(), ...input }).returning().all(),
    "Unable to create exercise attempt.",
  );
}

function validateSessionIndex(input: SubmitAttemptWithProgressInput["sessionIndex"]) {
  if (!input) {
    return;
  }
  assertNonEmpty(input.sessionId, "sessionId");
  assertInteger(input.currentExerciseIndex, "currentExerciseIndex");
  assertNonNegative(input.currentExerciseIndex, "currentExerciseIndex");
}

async function submitWithProgress(input: SubmitAttemptWithProgressInput): Promise<{
  attempt: ExerciseAttempt;
  progress: ConceptProgress;
  session: StudySession | null;
}> {
  validateAttemptInput(input.attempt);
  assertNonEmpty(input.progress.conceptId, "conceptId");
  validateProgressInput(input.progress.input);
  validateSessionIndex(input.sessionIndex);

  return db.transaction((tx) => {
    const now = nowIso();
    const attempt = firstOrThrow(
      tx.insert(exerciseAttempts).values({ id: createId(), createdAt: now, ...input.attempt }).returning().all(),
      "Unable to create exercise attempt.",
    );
    const progressInput = { ...input.progress.input, lastPracticedAt: attempt.createdAt };
    const existingProgress =
      tx.select().from(conceptProgress).where(eq(conceptProgress.conceptId, input.progress.conceptId)).get() ?? null;
    const progress = existingProgress
      ? firstOrThrow(
          tx
            .update(conceptProgress)
            .set({ ...progressInput, updatedAt: now })
            .where(eq(conceptProgress.conceptId, input.progress.conceptId))
            .returning()
            .all(),
          "Concept progress not found.",
        )
      : firstOrThrow(
          tx
            .insert(conceptProgress)
            .values({ conceptId: input.progress.conceptId, updatedAt: now, ...progressInput })
            .returning()
            .all(),
          "Unable to create concept progress.",
        );
    const session = input.sessionIndex
      ? firstOrThrow(
          tx
            .update(studySessions)
            .set({ currentExerciseIndex: input.sessionIndex.currentExerciseIndex })
            .where(eq(studySessions.id, input.sessionIndex.sessionId))
            .returning()
            .all(),
          "Study session not found.",
        )
      : null;

    return { attempt, progress, session };
  });
}

async function findAllBySession(sessionId: string): Promise<ExerciseAttempt[]> {
  return db.select().from(exerciseAttempts).where(eq(exerciseAttempts.sessionId, sessionId)).orderBy(desc(exerciseAttempts.createdAt)).all();
}

async function findAllByExercise(exerciseId: string): Promise<ExerciseAttempt[]> {
  return db.select().from(exerciseAttempts).where(eq(exerciseAttempts.exerciseId, exerciseId)).orderBy(desc(exerciseAttempts.createdAt)).all();
}

async function findAllByConcept(conceptId: string): Promise<ExerciseAttempt[]> {
  return db
    .select({
      id: exerciseAttempts.id,
      sessionId: exerciseAttempts.sessionId,
      exerciseId: exerciseAttempts.exerciseId,
      userAnswer: exerciseAttempts.userAnswer,
      isCorrect: exerciseAttempts.isCorrect,
      usedHint: exerciseAttempts.usedHint,
      mistakeType: exerciseAttempts.mistakeType,
      responseTimeMs: exerciseAttempts.responseTimeMs,
      createdAt: exerciseAttempts.createdAt,
    })
    .from(exerciseAttempts)
    .innerJoin(exercises, eq(exerciseAttempts.exerciseId, exercises.id))
    .where(eq(exercises.conceptId, conceptId))
    .orderBy(desc(exerciseAttempts.createdAt))
    .all();
}

export const attemptsRepository = {
  create,
  submitWithProgress,
  findAllBySession,
  findAllByExercise,
  findAllByConcept,
};
