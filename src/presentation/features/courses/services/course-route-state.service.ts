import type { CourseDetail } from "@/src/database";
import { buildCourseProgressSummary } from "@/src/presentation/features/progress/domain";

export type CourseResultCounters = {
  totalConcepts: number;
  mastered: number;
  progressing: number;
  needsWork: number;
  notStarted: number;
};

export type CourseRecentActivity = {
  id: string;
  title: string;
  score: number;
  iconName: string;
};

export type CourseRouteResults = {
  counters: CourseResultCounters;
  progress: number;
  recentActivities: CourseRecentActivity[];
};

export type RealCourseResultsState =
  | { status: "missing" }
  | { status: "ready"; courseTitle: string; results: CourseRouteResults };

export const emptyCourseResultCounters: CourseResultCounters = {
  totalConcepts: 0,
  mastered: 0,
  progressing: 0,
  needsWork: 0,
  notStarted: 0,
};

export function buildRealCourseResults(detail: Pick<CourseDetail, "course" | "concepts">): CourseRouteResults {
  const summary = buildCourseProgressSummary(detail.concepts);
  const { progress, recentActivities, ...counters } = summary;
  return { counters, progress, recentActivities };
}

export async function loadRealCourseResults(courseId: string): Promise<RealCourseResultsState> {
  const { coursesRepository } = await import("@/src/database");
  const detail = await coursesRepository.findDetailById(courseId);
  if (!detail) {
    return { status: "missing" };
  }
  return {
    status: "ready",
    courseTitle: detail.course.title,
    results: buildRealCourseResults(detail),
  };
}
