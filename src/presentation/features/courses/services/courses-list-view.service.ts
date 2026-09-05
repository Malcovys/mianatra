import type { Course, CourseDetail } from "@/src/db";
import { buildRealCourseResults } from "./course-route-state.service";
import type { CourseListItem } from "../types/course-list.types";

type CoursesListViewDeps = {
  courses: {
    findAll: () => Promise<Course[]>;
    findDetailById: (id: string) => Promise<CourseDetail | null>;
  };
};

function subjectName(detail: CourseDetail) {
  return detail.subject?.name?.trim() || "Matière inconnue";
}

function subjectIcon(detail: CourseDetail) {
  return detail.subject?.icon?.trim() || "book-open";
}

function subjectColor(detail: CourseDetail) {
  return detail.subject?.color?.trim() || null;
}

function toCourseListItem(detail: CourseDetail): CourseListItem | null {
  if (detail.course.status === "archived") {
    return null;
  }

  const results = buildRealCourseResults(detail);
  return {
    id: detail.course.id,
    title: detail.course.title,
    subject: subjectName(detail),
    subjectColor: subjectColor(detail),
    iconName: subjectIcon(detail),
    grade: detail.course.grade,
    pageCount: detail.course.pageCount,
    progress: results.progress,
    masteredCount: results.counters.mastered,
    progressingCount: results.counters.progressing,
    needsWorkCount: results.counters.needsWork,
    notStartedCount: results.counters.notStarted,
    status: detail.course.status,
    lastReviewedAt: detail.course.lastReviewedAt,
    updatedAt: detail.course.updatedAt,
  };
}

export function buildCourseGradeFilters(items: readonly Pick<CourseListItem, "grade">[]) {
  const grades = items
    .map((item) => item.grade.trim())
    .filter((grade) => grade.length > 0);
  return ["Tous", ...Array.from(new Set(grades)).sort((left, right) => left.localeCompare(right))];
}

export function createCoursesListViewService(dependencies: CoursesListViewDeps) {
  return {
    loadCoursesList: async (): Promise<CourseListItem[]> => {
      const courses = (await dependencies.courses.findAll()).filter((course) => course.status !== "archived");
      const details = await Promise.all(courses.map((course) => dependencies.courses.findDetailById(course.id)));
      return details
        .map((detail) => (detail ? toCourseListItem(detail) : null))
        .filter((item): item is CourseListItem => item !== null)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
  };
}

export async function loadCoursesList() {
  const { coursesRepository } = await import("@/src/db");
  return createCoursesListViewService({ courses: coursesRepository }).loadCoursesList();
}
