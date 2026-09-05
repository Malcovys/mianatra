import { eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { nowIso } from "../helpers";
import { conceptProgress, concepts } from "../schema";
import type { ConceptProgress, ConceptProgressStatus } from "../types";
import { assertInteger, assertNonEmpty, assertNonNegative, firstOrThrow } from "./repository-utils";

export type UpsertConceptProgressInput = {
  score: number;
  status: ConceptProgressStatus;
  attemptsCount: number;
  correctCount: number;
  lastPracticedAt?: string | null;
};

function validateProgressInput(input: UpsertConceptProgressInput) {
  if (input.score < 0 || input.score > 100) {
    throw new Error("score must be between 0 and 100.");
  }
  assertNonEmpty(input.status, "status");
  assertInteger(input.attemptsCount, "attemptsCount");
  assertInteger(input.correctCount, "correctCount");
  assertNonNegative(input.attemptsCount, "attemptsCount");
  assertNonNegative(input.correctCount, "correctCount");
  if (input.correctCount > input.attemptsCount) {
    throw new Error("correctCount must be lower than or equal to attemptsCount.");
  }
}

async function findByConcept(conceptId: string): Promise<ConceptProgress | null> {
  return db.select().from(conceptProgress).where(eq(conceptProgress.conceptId, conceptId)).get() ?? null;
}

async function findAll(): Promise<ConceptProgress[]> {
  return db.select().from(conceptProgress).all();
}

async function findAllByCourse(courseId: string): Promise<ConceptProgress[]> {
  const courseConcepts = db.select().from(concepts).where(eq(concepts.courseId, courseId)).all();
  const conceptIds = courseConcepts.map((concept) => concept.id);

  if (conceptIds.length === 0) {
    return [];
  }

  return db.select().from(conceptProgress).where(inArray(conceptProgress.conceptId, conceptIds)).all();
}

async function upsert(conceptId: string, input: UpsertConceptProgressInput): Promise<ConceptProgress> {
  assertNonEmpty(conceptId, "conceptId");
  validateProgressInput(input);
  const existing = await findByConcept(conceptId);
  const updatedAt = nowIso();

  if (!existing) {
    return firstOrThrow(
      db.insert(conceptProgress).values({ conceptId, updatedAt, ...input }).returning().all(),
      "Unable to create concept progress.",
    );
  }

  return firstOrThrow(
    db.update(conceptProgress).set({ ...input, updatedAt }).where(eq(conceptProgress.conceptId, conceptId)).returning().all(),
    "Concept progress not found.",
  );
}

async function remove(conceptId: string): Promise<void> {
  db.delete(conceptProgress).where(eq(conceptProgress.conceptId, conceptId)).run();
}

export const progressRepository = {
  findByConcept,
  findAll,
  findAllByCourse,
  upsert,
  remove,
};

export { validateProgressInput };
