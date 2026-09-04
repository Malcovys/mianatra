import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { buildSubjectGradeFilters, loadSubjectOverviews } from "./subject-overview.service";
import type { SubjectOverviewItem } from "./subject-overview.types";

export type SubjectsOverviewStatus = "loading" | "ready" | "error";

export function useSubjectsOverview() {
  const loadIdRef = useRef(0);
  const [items, setItems] = useState<SubjectOverviewItem[]>([]);
  const [status, setStatus] = useState<SubjectsOverviewStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    const loadId = loadIdRef.current + 1;
    loadIdRef.current = loadId;
    setStatus("loading");
    setErrorMessage(null);

    void loadSubjectOverviews()
      .then((nextItems) => {
        if (loadIdRef.current !== loadId) {
          return;
        }
        setItems(nextItems);
        setStatus("ready");
      })
      .catch(() => {
        if (loadIdRef.current !== loadId) {
          return;
        }
        setErrorMessage("Impossible de charger tes matières.");
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
    items,
    grades: buildSubjectGradeFilters(items),
    status,
    errorMessage,
    reload,
  };
}
