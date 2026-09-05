import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { buildSubjectGradeFilters, loadSubjectOverviews } from "./subject-overview.service";
import type { SubjectOverviewItem } from "./subject-overview.types";

export type SubjectsOverviewStatus = "loading" | "ready" | "error";

export function useSubjectsOverview() {
  const [subjects, setSubjects] = useState<SubjectOverviewItem[]>([]);
  const [status, setStatus] = useState<SubjectsOverviewStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    setStatus("loading");
    setErrorMessage(null);

    void loadSubjectOverviews()
      .then((loadedSubjects) => {
        setSubjects(loadedSubjects);
        setStatus("ready");
      })
      .catch(() => {
        setErrorMessage("Impossible de charger tes matières.");
        setStatus("error");
      });
  }, []);

  useFocusEffect(reload);

  return {
    subjects,
    grades: buildSubjectGradeFilters(subjects),
    status,
    errorMessage,
    reload,
  };
}
