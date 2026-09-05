import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { coursePages, courses } from "../schema";
import type { CoursePage, NewCoursePage, PageQualityStatus } from "../types";
import { assertInteger, assertNonEmpty, firstOrThrow } from "./repository-utils";

export type CreatePageInput = Omit<NewCoursePage, "id" | "courseId" | "createdAt" | "pageIndex">;

function validatePageInput(input: CreatePageInput) {
  assertNonEmpty(input.localUri, "localUri");
  assertNonEmpty(input.qualityStatus, "qualityStatus");
  assertInteger(input.rotation ?? 0, "rotation");
}

async function findAllByCourse(courseId: string): Promise<CoursePage[]> {
  return db.select().from(coursePages).where(eq(coursePages.courseId, courseId)).orderBy(asc(coursePages.pageIndex)).all();
}

async function createMany(courseId: string, pages: CreatePageInput[]): Promise<CoursePage[]> {
  pages.forEach(validatePageInput);
  return db.transaction((tx) => {
    const now = nowIso();
    const currentCount = tx.select().from(coursePages).where(eq(coursePages.courseId, courseId)).all().length;
    const inserted =
      pages.length === 0
        ? []
        : tx
            .insert(coursePages)
            .values(
              pages.map((page, index) => ({
                id: createId(),
                courseId,
                pageIndex: currentCount + index,
                rotation: page.rotation ?? 0,
                createdAt: now,
                ...page,
              })),
            )
            .returning()
            .all();

    tx.update(courses).set({ pageCount: currentCount + pages.length, updatedAt: now }).where(eq(courses.id, courseId)).run();
    return inserted;
  });
}

async function replaceOrder(courseId: string, orderedPageIds: string[]): Promise<CoursePage[]> {
  return db.transaction((tx) => {
    const existing = tx.select().from(coursePages).where(eq(coursePages.courseId, courseId)).all();
    const existingIds = new Set(existing.map((page) => page.id));
    const orderedIds = new Set(orderedPageIds);

    if (existing.length !== orderedPageIds.length || orderedPageIds.some((id) => !existingIds.has(id)) || orderedIds.size !== orderedPageIds.length) {
      throw new Error("orderedPageIds must contain every course page exactly once.");
    }

    orderedPageIds.forEach((id, pageIndex) => {
      tx.update(coursePages).set({ pageIndex: -pageIndex - 1 }).where(eq(coursePages.id, id)).run();
    });
    orderedPageIds.forEach((id, pageIndex) => {
      tx.update(coursePages).set({ pageIndex }).where(eq(coursePages.id, id)).run();
    });

    return tx.select().from(coursePages).where(eq(coursePages.courseId, courseId)).orderBy(asc(coursePages.pageIndex)).all();
  });
}

async function updateRotation(id: string, rotation: number): Promise<CoursePage> {
  assertInteger(rotation, "rotation");
  return firstOrThrow(
    db.update(coursePages).set({ rotation }).where(eq(coursePages.id, id)).returning().all(),
    "Course page not found.",
  );
}

async function updateQualityStatus(id: string, status: PageQualityStatus): Promise<CoursePage> {
  return firstOrThrow(
    db.update(coursePages).set({ qualityStatus: status }).where(eq(coursePages.id, id)).returning().all(),
    "Course page not found.",
  );
}

async function remove(id: string): Promise<void> {
  db.transaction((tx) => {
    const page = tx.select().from(coursePages).where(eq(coursePages.id, id)).get();
    if (!page) {
      return;
    }

    tx.delete(coursePages).where(eq(coursePages.id, id)).run();
    const remaining = tx.select().from(coursePages).where(eq(coursePages.courseId, page.courseId)).orderBy(asc(coursePages.pageIndex)).all();
    remaining.forEach((remainingPage, pageIndex) => {
      tx.update(coursePages).set({ pageIndex }).where(eq(coursePages.id, remainingPage.id)).run();
    });
    tx.update(courses).set({ pageCount: remaining.length, updatedAt: nowIso() }).where(eq(courses.id, page.courseId)).run();
  });
}

async function removeMany(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  db.delete(coursePages).where(inArray(coursePages.id, ids)).run();
}

export const pagesRepository = {
  findAllByCourse,
  createMany,
  replaceOrder,
  updateRotation,
  updateQualityStatus,
  remove,
  removeMany,
};
