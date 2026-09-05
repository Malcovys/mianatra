import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { revisionSheets } from "../schema";
import type { NewRevisionSheet, RevisionSheet } from "../types";
import { assertNonEmpty, firstOrThrow } from "./repository-utils";

export type CreateRevisionSheetVersionInput = Omit<NewRevisionSheet, "id" | "createdAt" | "updatedAt" | "version">;

function validateRevisionSheetInput(input: CreateRevisionSheetVersionInput) {
  assertNonEmpty(input.courseId, "courseId");
  assertNonEmpty(input.title, "title");
  assertNonEmpty(input.summary, "summary");
  assertNonEmpty(input.contentJson, "contentJson");
}

async function findLatestByCourse(courseId: string): Promise<RevisionSheet | null> {
  return (
    db
      .select()
      .from(revisionSheets)
      .where(eq(revisionSheets.courseId, courseId))
      .orderBy(desc(revisionSheets.version), desc(revisionSheets.createdAt))
      .get() ?? null
  );
}

async function findAllVersionsByCourse(courseId: string): Promise<RevisionSheet[]> {
  return db
    .select()
    .from(revisionSheets)
    .where(eq(revisionSheets.courseId, courseId))
    .orderBy(desc(revisionSheets.version), desc(revisionSheets.createdAt))
    .all();
}

async function createVersion(input: CreateRevisionSheetVersionInput): Promise<RevisionSheet> {
  validateRevisionSheetInput(input);
  return db.transaction((tx) => {
    const latest = tx
      .select()
      .from(revisionSheets)
      .where(eq(revisionSheets.courseId, input.courseId))
      .orderBy(desc(revisionSheets.version), desc(revisionSheets.createdAt))
      .get();
    const now = nowIso();
    const version = (latest?.version ?? 0) + 1;

    return firstOrThrow(
      tx.insert(revisionSheets).values({ id: createId(), createdAt: now, updatedAt: now, version, ...input }).returning().all(),
      "Unable to create revision sheet version.",
    );
  });
}

export const revisionSheetsRepository = {
  findLatestByCourse,
  findAllVersionsByCourse,
  createVersion,
};
