import {
  coursesRepository,
  subjectsRepository,
  type CourseStatus,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "@/src/database";
import { CourseNotFoundError, SubjectNotFoundError } from "@/src/presentation/features/shared";

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

export async function listCourses() {
  return coursesRepository.findAll();
}

export async function listCoursesBySubject(subjectId: string) {
  if (!(await subjectsRepository.findById(subjectId))) throw new SubjectNotFoundError();
  return coursesRepository.findAllBySubject(subjectId);
}

export async function getCourse(courseId: string) {
  const course = await coursesRepository.findById(courseId);
  if (!course) throw new CourseNotFoundError();
  return course;
}

export async function getCourseDetail(courseId: string) {
  const detail = await coursesRepository.findDetailById(courseId);
  if (!detail) throw new CourseNotFoundError();
  return detail;
}

export async function createDraftCourse(input: CourseInput) {
  if (!(await subjectsRepository.findById(input.subjectId))) throw new SubjectNotFoundError();
  return coursesRepository.create(normalizeCourseInput(input, "draft"));
}

export async function updateCourse(courseId: string, input: CoursePatch) {
  if (!(await coursesRepository.findById(courseId))) throw new CourseNotFoundError();
  return coursesRepository.update(courseId, normalizeCoursePatch(input));
}

export async function renameCourse(courseId: string, title: string) {
  if (!(await coursesRepository.findById(courseId))) throw new CourseNotFoundError();
  return coursesRepository.update(courseId, { title: normalizeText(title) });
}

export async function archiveCourse(courseId: string) {
  if (!(await coursesRepository.findById(courseId))) throw new CourseNotFoundError();
  return coursesRepository.archive(courseId);
}

export async function deleteCourse(courseId: string) {
  if (!(await coursesRepository.findById(courseId))) throw new CourseNotFoundError();
  await coursesRepository.remove(courseId);
}

export {
  buildRealCourseResults,
  emptyCourseResultCounters,
  loadRealCourseResults
} from "./course-route-state.service";
export type { CourseRecentActivity, CourseResultCounters, CourseRouteResults, RealCourseResultsState } from "./course-route-state.service";

