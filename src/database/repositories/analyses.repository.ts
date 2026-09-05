import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { createId, serializeJson } from "../helpers";
import { conceptProgress, concepts, courseAnalyses, courses, exercises, recommendations, sessionReports, subjects } from "../schema";
import type { Concept, Course, CourseAnalysis, NewCourseAnalysis } from "../types";
import { assertNonEmpty, createTimedIdFields, firstOrThrow, touchFields } from "./repository-utils";
import type { JsonValue } from "../helpers";

export type CreateAnalysisInput = Omit<NewCourseAnalysis, "id" | "createdAt">;
export type PersistCourseAnalysisConceptInput = {
  name: string;
  description?: string | null;
};
export type PersistCourseAnalysisInput = {
  courseId: string;
  subjectId: string;
  title: string;
  grade: string;
  summary: string | null;
  analysis: JsonValue;
  concepts: PersistCourseAnalysisConceptInput[];
  validatedByUser: boolean;
};

function validateAnalysisInput(input: CreateAnalysisInput) {
  assertNonEmpty(input.courseId, "courseId");
  assertNonEmpty(input.detectedTitle, "detectedTitle");
  assertNonEmpty(input.detectedSubject, "detectedSubject");
  assertNonEmpty(input.rawJson, "rawJson");
}

async function findLatestByCourse(courseId: string): Promise<CourseAnalysis | null> {
  return (
    db.select().from(courseAnalyses).where(eq(courseAnalyses.courseId, courseId)).orderBy(desc(courseAnalyses.createdAt), desc(courseAnalyses.id)).get() ??
    null
  );
}

async function findAllByCourse(courseId: string): Promise<CourseAnalysis[]> {
  return db.select().from(courseAnalyses).where(eq(courseAnalyses.courseId, courseId)).orderBy(desc(courseAnalyses.createdAt), desc(courseAnalyses.id)).all();
}

async function create(input: CreateAnalysisInput): Promise<CourseAnalysis> {
  validateAnalysisInput(input);
  return firstOrThrow(
    db.insert(courseAnalyses).values({ ...createTimedIdFields(), ...input }).returning().all(),
    "Unable to create course analysis.",
  );
}

function assertConceptInput(input: PersistCourseAnalysisConceptInput) {
  assertNonEmpty(input.name, "concept.name");
}

function assertPersistInput(input: PersistCourseAnalysisInput) {
  assertNonEmpty(input.courseId, "courseId");
  assertNonEmpty(input.subjectId, "subjectId");
  assertNonEmpty(input.title, "title");
  assertNonEmpty(input.grade, "grade");
  if (input.concepts.length === 0) {
    throw new Error("concepts must not be empty.");
  }
  input.concepts.forEach(assertConceptInput);
}

function assertConceptsCanBeReplaced(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  conceptIds: string[],
) {
  if (conceptIds.length === 0) {
    return;
  }
  const exerciseRefs = tx.select().from(exercises).where(inArray(exercises.conceptId, conceptIds)).all().length;
  const progressRefs = tx.select().from(conceptProgress).where(inArray(conceptProgress.conceptId, conceptIds)).all().length;
  const recommendationRefs = tx.select().from(recommendations).where(inArray(recommendations.conceptId, conceptIds)).all().length;
  const strongReportRefs = tx.select().from(sessionReports).where(inArray(sessionReports.strongConceptId, conceptIds)).all().length;
  const weakReportRefs = tx.select().from(sessionReports).where(inArray(sessionReports.weakConceptId, conceptIds)).all().length;

  if (exerciseRefs + progressRefs + recommendationRefs + strongReportRefs + weakReportRefs > 0) {
    throw new Error("COURSE_CONCEPTS_REFERENCED");
  }
}

async function persistForCourse(input: PersistCourseAnalysisInput): Promise<{
  course: Course;
  analysis: CourseAnalysis;
  concepts: Concept[];
}> {
  assertPersistInput(input);
  return db.transaction((tx) => {
    const existingCourse = tx.select().from(courses).where(eq(courses.id, input.courseId)).get();
    if (!existingCourse) {
      throw new Error("COURSE_NOT_FOUND");
    }
    const existingSubject = tx.select().from(subjects).where(eq(subjects.id, input.subjectId)).get();
    if (!existingSubject) {
      throw new Error("SUBJECT_NOT_FOUND");
    }
    const existingConcepts = tx.select().from(concepts).where(eq(concepts.courseId, input.courseId)).all();
    assertConceptsCanBeReplaced(tx, existingConcepts.map((concept) => concept.id));

    const analysis = firstOrThrow(
      tx
        .insert(courseAnalyses)
        .values({
          id: createId(),
          courseId: input.courseId,
          detectedTitle: input.title,
          detectedSubject: existingSubject.name,
          detectedLevel: input.grade,
          rawJson: serializeJson(input.analysis),
          confidence: typeof input.analysis === "object" && input.analysis !== null && !Array.isArray(input.analysis) && typeof input.analysis.confidence === "number"
            ? input.analysis.confidence
            : null,
          validatedByUser: input.validatedByUser,
          createdAt: createTimedIdFields().createdAt,
        })
        .returning()
        .all(),
      "Unable to create course analysis.",
    );

    tx.delete(concepts).where(eq(concepts.courseId, input.courseId)).run();
    const now = createTimedIdFields().createdAt;
    const createdConcepts = tx
      .insert(concepts)
      .values(
        input.concepts.map((concept, orderIndex) => ({
          id: createId(),
          courseId: input.courseId,
          name: concept.name,
          description: concept.description ?? null,
          orderIndex,
          createdAt: now,
        })),
      )
      .returning()
      .all();

    const course = firstOrThrow(
      tx
        .update(courses)
        .set({
          subjectId: input.subjectId,
          title: input.title,
          grade: input.grade,
          summary: input.summary,
          status: "ready",
          ...touchFields(),
        })
        .where(eq(courses.id, input.courseId))
        .returning()
        .all(),
      "Course not found.",
    );

    return { course, analysis, concepts: createdConcepts };
  });
}

export const analysesRepository = {
  findLatestByCourse,
  findAllByCourse,
  create,
  persistForCourse,
};
