import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { studySessions } from "../schema";
import type { NewStudySession, StudySession } from "../types";
import { assertInteger, assertNonEmpty, assertNonNegative, firstOrThrow } from "./repository-utils";

export type CreateStudySessionInput = Omit<
  NewStudySession,
  "id" | "status" | "currentExerciseIndex" | "startedAt" | "completedAt" | "durationSeconds" | "createdAt"
>;

function validateSessionInput(input: CreateStudySessionInput) {
  assertNonEmpty(input.courseId, "courseId");
  assertNonEmpty(input.type, "type");
}

async function findById(id: string): Promise<StudySession | null> {
  return db.select().from(studySessions).where(eq(studySessions.id, id)).get() ?? null;
}

async function findActiveByCourse(courseId: string): Promise<StudySession | null> {
  return (
    db
      .select()
      .from(studySessions)
      .where(and(eq(studySessions.courseId, courseId), eq(studySessions.status, "active")))
      .get() ?? null
  );
}

async function findActive(): Promise<StudySession[]> {
  return db.select().from(studySessions).where(eq(studySessions.status, "active")).all();
}

async function findAll(): Promise<StudySession[]> {
  return db.select().from(studySessions).all();
}

async function create(input: CreateStudySessionInput): Promise<StudySession> {
  validateSessionInput(input);
  return db.transaction((tx) => {
    const active = tx
      .select()
      .from(studySessions)
      .where(and(eq(studySessions.courseId, input.courseId), eq(studySessions.status, "active")))
      .get();

    if (active) {
      throw new Error("An active session already exists for this course.");
    }

    const now = nowIso();
    return firstOrThrow(
      tx
        .insert(studySessions)
        .values({
          id: createId(),
          courseId: input.courseId,
          type: input.type,
          status: "active",
          currentExerciseIndex: 0,
          startedAt: now,
          completedAt: null,
          durationSeconds: 0,
          createdAt: now,
        })
        .returning()
        .all(),
      "Unable to create study session.",
    );
  });
}

async function updateCurrentExerciseIndex(id: string, index: number): Promise<StudySession> {
  assertInteger(index, "currentExerciseIndex");
  assertNonNegative(index, "currentExerciseIndex");
  return firstOrThrow(
    db.update(studySessions).set({ currentExerciseIndex: index }).where(eq(studySessions.id, id)).returning().all(),
    "Study session not found.",
  );
}

async function complete(id: string, durationSeconds: number): Promise<StudySession> {
  assertInteger(durationSeconds, "durationSeconds");
  assertNonNegative(durationSeconds, "durationSeconds");
  return firstOrThrow(
    db
      .update(studySessions)
      .set({ status: "completed", completedAt: nowIso(), durationSeconds })
      .where(eq(studySessions.id, id))
      .returning()
      .all(),
    "Study session not found.",
  );
}

async function abandon(id: string, durationSeconds: number): Promise<StudySession> {
  assertInteger(durationSeconds, "durationSeconds");
  assertNonNegative(durationSeconds, "durationSeconds");
  return firstOrThrow(
    db
      .update(studySessions)
      .set({ status: "abandoned", completedAt: nowIso(), durationSeconds })
      .where(eq(studySessions.id, id))
      .returning()
      .all(),
    "Study session not found.",
  );
}

export const studySessionsRepository = {
  findById,
  findAll,
  findActive,
  findActiveByCourse,
  create,
  updateCurrentExerciseIndex,
  complete,
  abandon,
};
