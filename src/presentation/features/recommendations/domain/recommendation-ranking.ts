import type { Recommendation, RecommendationType } from "@/src/db";

export type RecommendationDraft = {
  courseId: string | null;
  conceptId: string | null;
  type: RecommendationType;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: number;
};

export type RecommendationContext = {
  interruptedSessions?: { courseId: string; courseTitle: string }[];
  weakConcepts?: { courseId: string; conceptId: string; conceptName: string }[];
  staleCourses?: { courseId: string; title: string }[];
  recentCourses?: { courseId: string; title: string }[];
  canCreateNewCourse?: boolean;
};

export function buildRecommendations(context: RecommendationContext): RecommendationDraft[] {
  const drafts: RecommendationDraft[] = [];
  for (const session of context.interruptedSessions ?? []) {
    drafts.push({
      courseId: session.courseId,
      conceptId: null,
      type: "resume",
      title: `Reprendre ${session.courseTitle}`,
      description: "Une séance est en cours sur ce cours.",
      estimatedMinutes: 10,
      priority: 1,
    });
  }
  for (const concept of context.weakConcepts ?? []) {
    drafts.push({
      courseId: concept.courseId,
      conceptId: concept.conceptId,
      type: "targeted",
      title: `Renforcer ${concept.conceptName}`,
      description: "Cette notion demande une révision ciblée.",
      estimatedMinutes: 15,
      priority: 2,
    });
  }
  for (const course of context.staleCourses ?? []) {
    drafts.push({
      courseId: course.courseId,
      conceptId: null,
      type: "targeted",
      title: `Réviser ${course.title}`,
      description: "Ce cours n'a pas été revu récemment.",
      estimatedMinutes: 12,
      priority: 3,
    });
  }
  for (const course of context.recentCourses ?? []) {
    drafts.push({
      courseId: course.courseId,
      conceptId: null,
      type: "targeted",
      title: `Commencer ${course.title}`,
      description: "Ce cours récent peut être travaillé maintenant.",
      estimatedMinutes: 10,
      priority: 4,
    });
  }
  if (context.canCreateNewCourse) {
    drafts.push({
      courseId: null,
      conceptId: null,
      type: "new_course",
      title: "Ajouter un nouveau cours",
      description: "Créer un cours pour enrichir les révisions.",
      estimatedMinutes: 5,
      priority: 5,
    });
  }
  return drafts;
}

export function rankRecommendations<T extends Pick<Recommendation | RecommendationDraft, "priority"> & { createdAt?: string }>(recommendations: T[]) {
  return [...recommendations].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }
    return String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""));
  });
}
