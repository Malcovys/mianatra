import { asc, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { conceptProgress, concepts, courseAnalyses, coursePages, courses, revisionSheets, subjects } from "../schema";
import type { Course, CoursePage, CourseStatus, NewCourse, NewCoursePage, Subject } from "../types";
import { assertNonEmpty, firstOrThrow } from "./repository-utils";

export type CreateCourseInput = Omit<NewCourse, "id" | "createdAt" | "updatedAt" | "pageCount"> & {
  pageCount?: number;
};
export type UpdateCourseInput = Partial<Omit<CreateCourseInput, "subjectId">>;
export type CreateCoursePageForCourseInput = Omit<NewCoursePage, "id" | "courseId" | "createdAt" | "pageIndex">;
export type CreateCourseWithPagesInput = CreateCourseInput & {
  pages: CreateCoursePageForCourseInput[];
};

export type CourseDetail = {
  course: Course;
  subject: Subject | null;
  pages: CoursePage[];
  concepts: (typeof concepts.$inferSelect & { progress: typeof conceptProgress.$inferSelect | null })[];
  latestAnalysis: typeof courseAnalyses.$inferSelect | null;
  latestRevisionSheet: typeof revisionSheets.$inferSelect | null;
};

function validateCourseInput(input: CreateCourseInput) {
  assertNonEmpty(input.subjectId, "subjectId");
  assertNonEmpty(input.title, "title");
  assertNonEmpty(input.grade, "grade");
  assertNonEmpty(input.status, "status");
}

function validateCoursePatch(input: UpdateCourseInput) {
  if (input.title !== undefined) {
    assertNonEmpty(input.title, "title");
  }
  if (input.grade !== undefined) {
    assertNonEmpty(input.grade, "grade");
  }
  if (input.status !== undefined) {
    assertNonEmpty(input.status, "status");
  }
}

async function findAll(): Promise<Course[]> {
  return db.select().from(courses).orderBy(desc(courses.updatedAt)).all();
}

async function findAllBySubject(subjectId: string): Promise<Course[]> {
  return db.select().from(courses).where(eq(courses.subjectId, subjectId)).orderBy(desc(courses.updatedAt)).all();
}

async function findById(id: string): Promise<Course | null> {
  return db.select().from(courses).where(eq(courses.id, id)).get() ?? null;
}

async function findDetailById(id: string): Promise<CourseDetail | null> {
  const course = await findById(id);

  if (!course) {
    return null;
  }

  const subject = db.select().from(subjects).where(eq(subjects.id, course.subjectId)).get() ?? null;
  const pages = db.select().from(coursePages).where(eq(coursePages.courseId, id)).orderBy(asc(coursePages.pageIndex)).all();
  const courseConcepts = db.select().from(concepts).where(eq(concepts.courseId, id)).orderBy(asc(concepts.orderIndex)).all();
  const progressRows = db.select().from(conceptProgress).all();
  const latestAnalysis =
    db.select().from(courseAnalyses).where(eq(courseAnalyses.courseId, id)).orderBy(desc(courseAnalyses.createdAt), desc(courseAnalyses.id)).get() ??
    null;
  const latestRevisionSheet =
    db
      .select()
      .from(revisionSheets)
      .where(eq(revisionSheets.courseId, id))
      .orderBy(desc(revisionSheets.version), desc(revisionSheets.createdAt))
      .get() ?? null;

  return {
    course,
    subject,
    pages,
    concepts: courseConcepts.map((concept) => ({
      ...concept,
      progress: progressRows.find((row) => row.conceptId === concept.id) ?? null,
    })),
    latestAnalysis,
    latestRevisionSheet,
  };
}

async function create(input: CreateCourseInput): Promise<Course> {
  validateCourseInput(input);
  const now = nowIso();
  return firstOrThrow(
    db
      .insert(courses)
      .values({ id: createId(), createdAt: now, updatedAt: now, pageCount: input.pageCount ?? 0, ...input })
      .returning()
      .all(),
    "Unable to create course.",
  );
}

async function update(id: string, input: UpdateCourseInput): Promise<Course> {
  validateCoursePatch(input);
  return firstOrThrow(
    db.update(courses).set({ ...input, updatedAt: nowIso() }).where(eq(courses.id, id)).returning().all(),
    "Course not found.",
  );
}

async function archive(id: string): Promise<Course> {
  return update(id, { status: "archived" satisfies CourseStatus });
}

async function remove(id: string): Promise<void> {
  db.delete(courses).where(eq(courses.id, id)).run();
}

async function createWithPages(input: CreateCourseWithPagesInput): Promise<{ course: Course; pages: CoursePage[] }> {
  validateCourseInput(input);
  return db.transaction((tx) => {
    const now = nowIso();
    const courseId = createId();
    const { pages: pageInputs, ...courseInput } = input;
    const course = firstOrThrow(
      tx
        .insert(courses)
        .values({ id: courseId, createdAt: now, updatedAt: now, pageCount: pageInputs.length, ...courseInput })
        .returning()
        .all(),
      "Unable to create course.",
    );
    const pages =
      pageInputs.length === 0
        ? []
        : tx
            .insert(coursePages)
            .values(
              pageInputs.map((page, pageIndex) => ({
                id: createId(),
                courseId,
                pageIndex,
                rotation: 0,
                createdAt: now,
                ...page,
              })),
            )
            .returning()
            .all();

    return { course, pages };
  });
}

export const coursesRepository = {
  findAll,
  findAllBySubject,
  findById,
  findDetailById,
  create,
  update,
  archive,
  remove,
  createWithPages,
};
