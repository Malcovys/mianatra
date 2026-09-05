import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { buildCourseGradeFilters, loadCoursesList } from "../services/courses-list-view.service";
import type { CourseListItem } from "../types/course-list.types";

export type CoursesListStatus = "loading" | "ready" | "error";

export function useCoursesList() {
  const loadIdRef = useRef(0);
  const [items, setItems] = useState<CourseListItem[]>([]);
  const [status, setStatus] = useState<CoursesListStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    const loadId = loadIdRef.current + 1;
    loadIdRef.current = loadId;
    setStatus("loading");
    setErrorMessage(null);

    void loadCoursesList()
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
        setErrorMessage("Impossible de charger tes cours.");
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
    grades: buildCourseGradeFilters(items),
    status,
    errorMessage,
    reload,
  };
}
