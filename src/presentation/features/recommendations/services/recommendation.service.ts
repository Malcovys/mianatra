import { buildRecommendations, rankRecommendations, type RecommendationContext, type RecommendationDraft } from "../domain";

function sameRecommendation(left: Pick<RecommendationDraft, "courseId" | "conceptId" | "type">, right: Pick<RecommendationDraft, "courseId" | "conceptId" | "type">) {
  return left.type === right.type && left.courseId === right.courseId && left.conceptId === right.conceptId;
}

async function buildRecommendationContext(): Promise<RecommendationContext> {
    const { coursesRepository, studySessionsRepository } = await import("@/src/database");
    const courses = await coursesRepository.findAll();
    const activeSessions = await studySessionsRepository.findActive();
    const interruptedSessions = activeSessions
      .map((session) => {
        const course = courses.find((row) => row.id === session.courseId);
        return course ? { courseId: course.id, courseTitle: course.title } : null;
      })
      .filter((value): value is { courseId: string; courseTitle: string } => value !== null);
    const weakConcepts: { courseId: string; conceptId: string; conceptName: string }[] = [];
    for (const course of courses) {
      const detail = await coursesRepository.findDetailById(course.id);
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

export async function getActiveRecommendations() {
  const { recommendationsRepository } = await import("@/src/database");
  return rankRecommendations(await recommendationsRepository.findActive());
}

export async function getPrimaryRecommendation() {
  const { recommendationsRepository } = await import("@/src/database");
  return rankRecommendations(await recommendationsRepository.findActive())[0] ?? null;
}

export async function completeRecommendation(id: string) {
  const { recommendationsRepository } = await import("@/src/database");
  return recommendationsRepository.complete(id);
}

export async function refreshRecommendations() {
  const { recommendationsRepository } = await import("@/src/database");
  const activeRecommendations = await recommendationsRepository.findActive();
  const drafts = rankRecommendations(buildRecommendations(await buildRecommendationContext()));
  const createdRecommendations = [];

  for (const draft of drafts) {
    if (activeRecommendations.some((recommendation) => sameRecommendation(recommendation, draft))) {
      continue;
    }
    createdRecommendations.push(await recommendationsRepository.create(draft));
  }

  return rankRecommendations([...activeRecommendations, ...createdRecommendations]);
}
