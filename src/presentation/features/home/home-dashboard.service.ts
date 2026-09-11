import { coursesRepository, exercisesRepository, studySessionsRepository } from "@/src/database";
import { loadSubjectOverviews } from "@/src/presentation/features/subjects";
import type { HomeDashboard } from "./home-dashboard.types";

export async function loadHomeDashboard(): Promise<HomeDashboard> {
  const [subjects, activeSessions] = await Promise.all([
    loadSubjectOverviews(),
    studySessionsRepository.findActive(),
  ]);
  let activeSession: HomeDashboard["activeSession"] = null;

  for (const session of activeSessions) {
    const course = await coursesRepository.findById(session.courseId);
    if (!course || course.status === "archived") {
      continue;
    }

    const exercises = await exercisesRepository.findAllByCourse(session.courseId);
    activeSession = {
      id: session.id,
      courseId: session.courseId,
      courseTitle: course.title,
      currentExerciseIndex: session.currentExerciseIndex,
      totalExercises: exercises.length,
    };

    break;
  }

  return {
    recentSubjects: subjects.slice(0, 3).map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      iconName: item.iconName,
      chapterCount: item.chapterCount,
      progress: item.progress,
      mainWeakness: item.mainWeakness,
      updatedAt: item.updatedAt,
    })),
    activeSession,
  } satisfies HomeDashboard;
}
