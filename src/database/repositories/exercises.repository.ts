import { asc, eq } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { exercises } from "../schema";
import type { Exercise, NewExercise } from "../types";
import { assertInteger, assertNonEmpty } from "./repository-utils";

export type CreateExerciseInput = Omit<NewExercise, "id" | "createdAt">;

function validateExerciseInput(input: CreateExerciseInput) {
  assertNonEmpty(input.courseId, "courseId");
  assertNonEmpty(input.conceptId, "conceptId");
  assertNonEmpty(input.type, "type");
  assertNonEmpty(input.question, "question");
  assertNonEmpty(input.expectedAnswer, "expectedAnswer");
  assertNonEmpty(input.explanation, "explanation");
  assertInteger(input.difficulty, "difficulty");
  if (input.difficulty < 1 || input.difficulty > 5) {
    throw new Error("difficulty must be between 1 and 5.");
  }
}

async function findById(id: string): Promise<Exercise | null> {
  return db.select().from(exercises).where(eq(exercises.id, id)).get() ?? null;
}

async function findAllByCourse(courseId: string): Promise<Exercise[]> {
  return db.select().from(exercises).where(eq(exercises.courseId, courseId)).orderBy(asc(exercises.createdAt), asc(exercises.id)).all();
}

async function findAllByConcept(conceptId: string): Promise<Exercise[]> {
  return db.select().from(exercises).where(eq(exercises.conceptId, conceptId)).all();
}

async function createMany(inputs: CreateExerciseInput[]): Promise<Exercise[]> {
  inputs.forEach(validateExerciseInput);
  if (inputs.length === 0) {
    return [];
  }

  return db.transaction((tx) => {
    const now = nowIso();
    return tx
      .insert(exercises)
      .values(inputs.map((input) => ({ id: createId(), createdAt: now, ...input })))
      .returning()
      .all();
  });
}

export const exercisesRepository = {
  findById,
  findAllByCourse,
  findAllByConcept,
  createMany,
};
