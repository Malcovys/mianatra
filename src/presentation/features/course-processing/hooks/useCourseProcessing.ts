import { useCallback, useEffect, useState } from "react";
import { createCourseProcessingController, type CourseProcessingSnapshot } from "../services/course-processing.controller";
import { createDefaultCourseProcessingDeps } from "../services/course-processing.default";

const idleSnapshot: CourseProcessingSnapshot = {
  status: "idle",
  progress: {
    currentPage: 0,
    totalPages: 0,
    percent: 0,
    message: "Prêt",
    processedPages: 0,
    currentPageIndex: null,
    attemptNumber: null,
    maxAttempts: null,
  },
  error: null,
  result: {
    analysis: null,
    persistedAnalysis: null,
    concepts: [],
    revisionSheet: null,
    exercises: [],
    warnings: [],
  },
  detail: null,
  pendingAnalysis: null,
};

export function useCourseProcessing(courseId: string | undefined) {
  const [snapshot, setSnapshot] = useState<CourseProcessingSnapshot>(idleSnapshot);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [hasLoadedDetail, setHasLoadedDetail] = useState(false);
  const [controller, setController] = useState<ReturnType<typeof createCourseProcessingController> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setController(null);
    setHasLoadedDetail(false);
    if (!courseId) {
      setSnapshot(idleSnapshot);
      return;
    }
    createDefaultCourseProcessingDeps().then((deps) => {
      if (cancelled) {
        return;
      }
      setController(createCourseProcessingController(courseId, deps));
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (!controller) {
      return undefined;
    }
    return controller.subscribe(setSnapshot);
  }, [controller]);

  const refreshDetail = useCallback(async () => {
    if (!controller) {
      return;
    }
    setIsLoadingDetail(true);
    try {
      const detail = await controller.refreshDetail();
      setSnapshot((current) => ({ ...current, detail }));
    } finally {
      setHasLoadedDetail(true);
      setIsLoadingDetail(false);
    }
  }, [controller]);

  useEffect(() => {
    void refreshDetail();
  }, [refreshDetail]);

  return {
    ...snapshot,
    hasLoadedDetail,
    isLoadingDetail,
    startProcessing: useCallback(() => controller?.startProcessing(), [controller]),
    confirmAndContinue: useCallback(() => controller?.confirmAndContinue(), [controller]),
    generateAssetsFromPersisted: useCallback(() => controller?.generateAssetsFromPersisted(), [controller]),
    retry: useCallback(() => controller?.retry(), [controller]),
    refreshDetail,
  };
}
