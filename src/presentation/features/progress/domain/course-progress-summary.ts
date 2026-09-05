import type { ConceptProgress, ConceptProgressStatus } from "@/src/db";

export type ProgressConceptInput = {
  id: string;
  name: string;
  progress?: Pick<ConceptProgress, "score" | "status" | "attemptsCount" | "lastPracticedAt" | "updatedAt"> | null;
};

export type ProgressRecentActivity = {
  id: string;
  title: string;
  score: number;
  iconName: string;
};

export type CourseProgressSummary = {
  totalConcepts: number;
  mastered: number;
  progressing: number;
  needsWork: number;
  notStarted: number;
  progress: number;
  recentActivities: ProgressRecentActivity[];
};

export const emptyCourseProgressSummary: CourseProgressSummary = {
  totalConcepts: 0,
  mastered: 0,
  progressing: 0,
  needsWork: 0,
  notStarted: 0,
  progress: 0,
  recentActivities: [],
};

function clampScore(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Number(value)));
}

export function toProgressBucket(status: ConceptProgressStatus | null | undefined): keyof Pick<CourseProgressSummary, "mastered" | "progressing" | "needsWork" | "notStarted"> {
  if (status === "mastered") {
    return "mastered";
  }
  if (status === "needs_reinforcement") {
    return "needsWork";
  }
  if (status === "to_discover" || status === "in_progress") {
    return "progressing";
  }
  return "notStarted";
}

function activityIcon(status: ConceptProgressStatus) {
  if (status === "mastered") {
    return "check-circle";
  }
  if (status === "needs_reinforcement") {
    return "exclamation-circle";
  }
  return "chart-line";
}

export function buildCourseProgressSummary(concepts: readonly ProgressConceptInput[]): CourseProgressSummary {
  if (concepts.length === 0) {
    return { ...emptyCourseProgressSummary };
  }

  const summary: CourseProgressSummary = {
    ...emptyCourseProgressSummary,
    totalConcepts: concepts.length,
  };

  let totalScore = 0;
  const recentActivities = [];

  for (const concept of concepts) {
    const progress = concept.progress ?? null;
    const bucket = toProgressBucket(progress?.status);
    summary[bucket] += 1;
    totalScore += clampScore(progress?.score);

    if (progress && progress.attemptsCount > 0) {
      recentActivities.push({
        id: concept.id,
        title: concept.name,
        score: Math.round(clampScore(progress.score)),
        iconName: activityIcon(progress.status),
        sortDate: String(progress.lastPracticedAt ?? progress.updatedAt),
      });
    }
  }

  summary.progress = Math.round(totalScore / concepts.length);
  summary.recentActivities = recentActivities
    .sort((left, right) => right.sortDate.localeCompare(left.sortDate))
    .slice(0, 3)
    .map(({ sortDate: _sortDate, ...activity }) => activity);

  return summary;
}
