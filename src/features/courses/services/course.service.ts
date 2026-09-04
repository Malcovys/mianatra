import type { Course, CourseDetail, CourseStatus, CreateCourseInput, Subject, UpdateCourseInput } from "@/src/db";
import { CourseNotFoundError, SubjectNotFoundError } from "@/src/features/shared";

const courseStatuses: CourseStatus[] = ["draft", "processing", "ready", "archived"];

export type CourseInput = {
  subjectId: string;
  title: string;
  grade: string;
  status?: CourseStatus;
  summary?: string | null;
  lastReviewedAt?: string | null;
};

export type CoursePatch = Partial<Omit<CourseInput, "subjectId">>;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function assertCourseStatus(status: CourseStatus) {
  if (!courseStatuses.includes(status)) {
    throw new Error(`Invalid course status: ${status}`);
  }
}

function normalizeCourseInput(input: CourseInput, status: CourseStatus): CreateCourseInput {
  assertCourseStatus(status);
  return {
    subjectId: input.subjectId,
    title: normalizeText(input.title),
    grade: normalizeText(input.grade),
    status,
    summary: input.summary?.trim() || null,
    lastReviewedAt: input.lastReviewedAt ?? null,
  };
}

function normalizeCoursePatch(input: CoursePatch): UpdateCourseInput {
  if (input.status !== undefined) {
    assertCourseStatus(input.status);
  }
  return {
    ...(input.title !== undefined ? { title: normalizeText(input.title) } : {}),
    ...(input.grade !== undefined ? { grade: normalizeText(input.grade) } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.summary !== undefined ? { summary: input.summary?.trim() || null } : {}),
    ...(input.lastReviewedAt !== undefined ? { lastReviewedAt: input.lastReviewedAt } : {}),
  };
}

type CourseServiceDeps = {
  courses: {
    findAll: () => Promise<Course[]>;
    findAllBySubject: (subjectId: string) => Promise<Course[]>;
    findById: (id: string) => Promise<Course | null>;
    findDetailById: (id: string) => Promise<CourseDetail | null>;
    create: (input: CreateCourseInput) => Promise<Course>;
    update: (id: string, input: UpdateCourseInput) => Promise<Course>;
    archive: (id: string) => Promise<Course>;
    remove: (id: string) => Promise<void>;
  };
  subjects: {
    findById: (id: string) => Promise<Subject | null>;
  };
};

export function createCourseService(deps: CourseServiceDeps) {
  async function assertSubjectExists(subjectId: string) {
    const subject = await deps.subjects.findById(subjectId);
    if (!subject) {
      throw new SubjectNotFoundError();
    }
  }

  return {
    listCourses: () => deps.courses.findAll(),
    listCoursesBySubject: async (subjectId: string) => {
      await assertSubjectExists(subjectId);
      return deps.courses.findAllBySubject(subjectId);
    },
    getCourse: async (courseId: string) => {
      const course = await deps.courses.findById(courseId);
      if (!course) {
        throw new CourseNotFoundError();
      }
      return course;
    },
    getCourseDetail: async (courseId: string) => {
      const detail = await deps.courses.findDetailById(courseId);
      if (!detail) {
        throw new CourseNotFoundError();
      }
      return detail;
    },
    createDraftCourse: async (input: CourseInput) => {
      await assertSubjectExists(input.subjectId);
      return deps.courses.create(normalizeCourseInput(input, "draft"));
    },
    updateCourse: async (courseId: string, input: CoursePatch) => {
      const course = await deps.courses.findById(courseId);
      if (!course) {
        throw new CourseNotFoundError();
      }
      return deps.courses.update(courseId, normalizeCoursePatch(input));
    },
    renameCourse: async (courseId: string, title: string) => {
      const course = await deps.courses.findById(courseId);
      if (!course) {
        throw new CourseNotFoundError();
      }
      return deps.courses.update(courseId, { title: normalizeText(title) });
    },
    archiveCourse: async (courseId: string) => {
      const course = await deps.courses.findById(courseId);
      if (!course) {
        throw new CourseNotFoundError();
      }
      return deps.courses.archive(courseId);
    },
    deleteCourse: async (courseId: string) => {
      const course = await deps.courses.findById(courseId);
      if (!course) {
        throw new CourseNotFoundError();
      }
      await deps.courses.remove(courseId);
    },
  };
}

async function getDeps(): Promise<CourseServiceDeps> {
  const repositories = await import("@/src/db");
  return { courses: repositories.coursesRepository, subjects: repositories.subjectsRepository };
}

export async function listCourses() {
  return createCourseService(await getDeps()).listCourses();
}

export async function listCoursesBySubject(subjectId: string) {
  return createCourseService(await getDeps()).listCoursesBySubject(subjectId);
}

export async function getCourse(courseId: string) {
  return createCourseService(await getDeps()).getCourse(courseId);
}

export async function getCourseDetail(courseId: string) {
  return createCourseService(await getDeps()).getCourseDetail(courseId);
}

export async function createDraftCourse(input: CourseInput) {
  return createCourseService(await getDeps()).createDraftCourse(input);
}

export async function updateCourse(courseId: string, input: CoursePatch) {
  return createCourseService(await getDeps()).updateCourse(courseId, input);
}

export async function renameCourse(courseId: string, title: string) {
  return createCourseService(await getDeps()).renameCourse(courseId, title);
}

export async function archiveCourse(courseId: string) {
  return createCourseService(await getDeps()).archiveCourse(courseId);
}

export async function deleteCourse(courseId: string) {
  return createCourseService(await getDeps()).deleteCourse(courseId);
}

export const courseService = {
  archiveCourse,
  createDraftCourse,
  deleteCourse,
  getCourse,
  getCourseDetail,
  listCourses,
  listCoursesBySubject,
  renameCourse,
  updateCourse,
};

export {
  buildRealCourseResults,
  emptyCourseResultCounters,
  loadRealCourseResults
} from "./course-route-state.service";
export type { CourseRecentActivity, CourseResultCounters, CourseRouteResults, RealCourseResultsState } from "./course-route-state.service";

