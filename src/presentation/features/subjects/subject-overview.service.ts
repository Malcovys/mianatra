import type { Course, CourseDetail, Subject } from "@/src/database";
import type { CourseListItem } from "@/src/presentation/features/courses";
import { buildRealCourseResults } from "@/src/presentation/features/courses/services/course-route-state.service";
import { buildCourseProgressSummary } from "@/src/presentation/features/progress/domain";
import type { SubjectDetailView, SubjectOverviewItem } from "./subject-overview.types";


function latestDate(values: (string | null | undefined)[]) {
  return values.filter((value): value is string => Boolean(value)).sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function uniqueSortedGrades(courses: readonly Course[]) {
  return Array.from(new Set(courses.map((course) => course.grade.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mainWeakness(details: readonly CourseDetail[]) {
  const weaknesses = details
    .flatMap((detail) =>
      detail.concepts
        .filter((concept) => concept.progress?.status === "needs_reinforcement")
        .map((concept) => ({
          name: concept.name,
          score: concept.progress?.score ?? 0,
          updatedAt: String(concept.progress?.lastPracticedAt ?? concept.progress?.updatedAt ?? ""),
        })),
    )
    .sort((left, right) => left.score - right.score || right.updatedAt.localeCompare(left.updatedAt));

  return weaknesses[0]?.name ?? null;
}

function toCourseListItem(detail: CourseDetail): CourseListItem {
  const results = buildRealCourseResults(detail);
  return {
    id: detail.course.id,
    title: detail.course.title,
    subject: detail.subject?.name?.trim() || "Matière inconnue",
    subjectColor: detail.subject?.color?.trim() || null,
    iconName: detail.subject?.icon?.trim() || "book-open",
    grade: detail.course.grade,
    pageCount: detail.course.pageCount,
    progress: results.progress,
    masteredCount: results.counters.mastered,
    progressingCount: results.counters.progressing,
    needsWorkCount: results.counters.needsWork,
    notStartedCount: results.counters.notStarted,
    status: detail.course.status as CourseListItem["status"],
    lastReviewedAt: detail.course.lastReviewedAt,
    updatedAt: detail.course.updatedAt,
  };
}

function buildSubjectOverview(subject: Subject, courses: readonly Course[], details: readonly CourseDetail[]): SubjectOverviewItem {
  const summary = buildCourseProgressSummary(details.flatMap((detail) => detail.concepts));

  return {
    id: subject.id,
    name: subject.name,
    color: subject.color.trim() || null,
    iconName: subject.icon.trim() || null,
    chapterCount: courses.length,
    progress: clampProgress(summary.progress),
    masteredCount: summary.mastered,
    progressingCount: summary.progressing,
    needsWorkCount: summary.needsWork,
    notStartedCount: summary.notStarted,
    mainWeakness: mainWeakness(details),
    lastReviewedAt: latestDate(courses.map((course) => course.lastReviewedAt)),
    updatedAt: latestDate(courses.map((course) => course.updatedAt)) ?? subject.createdAt,
    grades: uniqueSortedGrades(courses),
  };
}

export function buildSubjectGradeFilters(items: readonly Pick<SubjectOverviewItem, "grades">[]) {
  const grades = items.flatMap((item) => item.grades);
  return ["Tous", ...Array.from(new Set(grades)).sort((left, right) => left.localeCompare(right))];
}

async function loadNonArchivedCourseDetails(courses: Course[], findDetailById: (id: string) => Promise<CourseDetail | null>) {
    const activeCourses = courses.filter((course) => course.status !== "archived");
    const details = await Promise.all(activeCourses.map((course) => findDetailById(course.id)));
    return {
      activeCourses,
      detailsByCourseId: new Map(details.filter((detail): detail is CourseDetail => detail !== null).map((detail) => [detail.course.id, detail])),
    };
  }

export async function loadSubjectOverviews(): Promise<SubjectOverviewItem[]> {
  const { subjectsRepository, coursesRepository } = await import("@/src/database");
  const [subjects, allCourses] = await Promise.all([subjectsRepository.findAll(), coursesRepository.findAll()]);
  const { activeCourses, detailsByCourseId } = await loadNonArchivedCourseDetails(allCourses, coursesRepository.findDetailById);

  return subjects
    .map((subject) => {
      const subjectCourses = activeCourses.filter((course) => course.subjectId === subject.id);
      if (subjectCourses.length === 0) return null;
      const details = subjectCourses
        .map((course) => detailsByCourseId.get(course.id))
        .filter((detail): detail is CourseDetail => detail !== undefined);
      return buildSubjectOverview(subject, subjectCourses, details);
    })
    .filter((item): item is SubjectOverviewItem => item !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function loadSubjectDetail(subjectId: string): Promise<SubjectDetailView | null> {
  const { subjectsRepository, coursesRepository } = await import("@/src/database");
  const subject = await subjectsRepository.findById(subjectId);
  if (!subject) return null;

  const allSubjectCourses = await coursesRepository.findAllBySubject(subjectId);
  const { activeCourses, detailsByCourseId } = await loadNonArchivedCourseDetails(
    allSubjectCourses,
    coursesRepository.findDetailById,
  );
  const details = activeCourses
    .map((course) => detailsByCourseId.get(course.id))
    .filter((detail): detail is CourseDetail => detail !== undefined);

  return {
    subject: buildSubjectOverview(subject, activeCourses, details),
    chapters: details.map(toCourseListItem).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}
