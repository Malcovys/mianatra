import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { conceptProgress, concepts, exercises, recommendations, sessionReports } from "../schema";
import type { Concept, NewConcept } from "../types";
import { assertInteger, assertNonEmpty } from "./repository-utils";

export type ReplaceConceptInput = Omit<NewConcept, "id" | "courseId" | "createdAt" | "orderIndex"> & {
  id?: string;
};

function validateConceptInput(input: ReplaceConceptInput) {
  assertNonEmpty(input.name, "name");
}

async function findById(id: string): Promise<Concept | null> {
  return db.select().from(concepts).where(eq(concepts.id, id)).get() ?? null;
}

async function findAllByCourse(courseId: string): Promise<Concept[]> {
  return db.select().from(concepts).where(eq(concepts.courseId, courseId)).orderBy(asc(concepts.orderIndex)).all();
}

function assertConceptsCanBeReplaced(conceptIds: string[]) {
  if (conceptIds.length === 0) {
    return;
  }

  const exerciseRefs = db.select().from(exercises).where(inArray(exercises.conceptId, conceptIds)).all().length;
  const progressRefs = db.select().from(conceptProgress).where(inArray(conceptProgress.conceptId, conceptIds)).all().length;
  const recommendationRefs = db.select().from(recommendations).where(inArray(recommendations.conceptId, conceptIds)).all().length;
  const strongReportRefs = db.select().from(sessionReports).where(inArray(sessionReports.strongConceptId, conceptIds)).all().length;
  const weakReportRefs = db.select().from(sessionReports).where(inArray(sessionReports.weakConceptId, conceptIds)).all().length;

  if (exerciseRefs + progressRefs + recommendationRefs + strongReportRefs + weakReportRefs > 0) {
    throw new Error(
      "Cannot replace course concepts because at least one concept is referenced by exercises, progress, recommendations, or reports.",
    );
  }
}

async function replaceAllForCourse(courseId: string, nextConcepts: ReplaceConceptInput[]): Promise<Concept[]> {
  nextConcepts.forEach((concept, orderIndex) => {
    validateConceptInput(concept);
    assertInteger(orderIndex, "orderIndex");
  });

  return db.transaction((tx) => {
    const existing = tx.select().from(concepts).where(eq(concepts.courseId, courseId)).all();
    assertConceptsCanBeReplaced(existing.map((concept) => concept.id));
    tx.delete(concepts).where(eq(concepts.courseId, courseId)).run();

    if (nextConcepts.length === 0) {
      return [];
    }

    return tx
      .insert(concepts)
      .values(
        nextConcepts.map((concept, orderIndex) => ({
          id: concept.id ?? createId(),
          courseId,
          name: concept.name,
          description: concept.description ?? null,
          orderIndex,
          createdAt: nowIso(),
        })),
      )
      .returning()
      .all();
  });
}

export const conceptsRepository = {
  findById,
  findAllByCourse,
  replaceAllForCourse,
};
