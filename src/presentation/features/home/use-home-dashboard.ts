import { loadSubjectOverviews } from "@/src/presentation/features/subjects";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import type { HomeDashboard } from "./home-dashboard.types";

export type HomeDashboardStatus = "loading" | "ready" | "error";

export function useHomeDashboard() {
  const loadIdRef = useRef(0);
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [status, setStatus] = useState<HomeDashboardStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reload = useCallback(() => {
    const loadId = loadIdRef.current + 1;
    loadIdRef.current = loadId;
    setStatus("loading");
    setErrorMessage(null);

    void loadHomeDashboard()
      .then((nextDashboard) => {
        if (loadIdRef.current !== loadId) {
          return;
        }
        setDashboard(nextDashboard);
        setStatus("ready");
      })
      .catch((error) => {
        console.error('[useHomeDashboard]: ', error);
        if (loadIdRef.current !== loadId) {
          return;
        }
        setErrorMessage("Impossible de charger ton accueil.");
        setStatus("error");
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        loadIdRef.current += 1;
      };
    }, [reload]),
  );

  return {
    dashboard,
    status,
    errorMessage,
    reload,
  };
}


export async function loadHomeDashboard() {
  const { coursesRepository, exercisesRepository, studySessionsRepository } = await import("@/src/database");
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
