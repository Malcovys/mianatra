import type { Course, CourseDetail, CreateRecommendationInput, Recommendation, StudySession } from "@/src/db";
import { buildRecommendations, rankRecommendations, type RecommendationContext, type RecommendationDraft } from "../domain";

function sameRecommendation(left: Pick<RecommendationDraft, "courseId" | "conceptId" | "type">, right: Pick<RecommendationDraft, "courseId" | "conceptId" | "type">) {
  return left.type === right.type && left.courseId === right.courseId && left.conceptId === right.conceptId;
}

type RecommendationServiceDeps = {
  courses: {
    findAll: () => Promise<Course[]>;
    findDetailById: (id: string) => Promise<CourseDetail | null>;
  };
  recommendations: {
    findActive: () => Promise<Recommendation[]>;
    create: (input: CreateRecommendationInput) => Promise<Recommendation>;
    complete: (id: string) => Promise<Recommendation>;
  };
  sessions: {
    findActive: () => Promise<StudySession[]>;
  };
};

export function createRecommendationService(deps: RecommendationServiceDeps) {
  async function buildContext(): Promise<RecommendationContext> {
    const courses = await deps.courses.findAll();
    const activeSessions = await deps.sessions.findActive();
    const interruptedSessions = activeSessions
      .map((session) => {
        const course = courses.find((row) => row.id === session.courseId);
        return course ? { courseId: course.id, courseTitle: course.title } : null;
      })
      .filter((value): value is { courseId: string; courseTitle: string } => value !== null);
    const weakConcepts: { courseId: string; conceptId: string; conceptName: string }[] = [];
    for (const course of courses) {
      const detail = await deps.courses.findDetailById(course.id);
      for (const concept of detail?.concepts ?? []) {
        if (concept.progress?.status === "needs_reinforcement" || (concept.progress !== null && concept.progress.score < 50)) {
          weakConcepts.push({ courseId: course.id, conceptId: concept.id, conceptName: concept.name });
        }
      }
    }
    const staleCourses = courses
      .filter((course) => course.status === "ready" && course.lastReviewedAt === null)
      .map((course) => ({ courseId: course.id, title: course.title }));
    const recentCourses = courses
      .filter((course) => course.status === "draft")
      .map((course) => ({ courseId: course.id, title: course.title }));
    return {
      interruptedSessions,
      weakConcepts,
      staleCourses,
      recentCourses,
      canCreateNewCourse: courses.length === 0,
    };
  }

  return {
    getActiveRecommendations: async () => rankRecommendations(await deps.recommendations.findActive()),
    getPrimaryRecommendation: async () => rankRecommendations(await deps.recommendations.findActive())[0] ?? null,
    completeRecommendation: (id: string) => deps.recommendations.complete(id),
    refreshRecommendations: async () => {
      const active = await deps.recommendations.findActive();
      const drafts = rankRecommendations(buildRecommendations(await buildContext()));
      const created = [];
      for (const draft of drafts) {
        if (active.some((recommendation) => sameRecommendation(recommendation, draft))) {
          continue;
        }
        created.push(await deps.recommendations.create(draft));
      }
      return rankRecommendations([...active, ...created]);
    },
  };
}

async function getDeps(): Promise<RecommendationServiceDeps> {
  const repositories = await import("@/src/db");
  return { courses: repositories.coursesRepository, recommendations: repositories.recommendationsRepository, sessions: repositories.studySessionsRepository };
}

export async function getActiveRecommendations() {
  return createRecommendationService(await getDeps()).getActiveRecommendations();
}

export async function getPrimaryRecommendation() {
  return createRecommendationService(await getDeps()).getPrimaryRecommendation();
}

export async function completeRecommendation(id: string) {
  return createRecommendationService(await getDeps()).completeRecommendation(id);
}

export async function refreshRecommendations() {
  return createRecommendationService(await getDeps()).refreshRecommendations();
}

export const recommendationService = { completeRecommendation, getActiveRecommendations, getPrimaryRecommendation, refreshRecommendations };
