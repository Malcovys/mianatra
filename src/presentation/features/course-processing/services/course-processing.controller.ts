import type { Concept, CourseAnalysis, CourseDetail, CoursePage, Exercise, RevisionSheet } from "@/src/db";
import type { AnalyzeCoursePagesInput, MultiPageCourseAnalysis, PageAnalysisResult } from "@/src/presentation/features/course-analysis";
import { AllCoursePagesAnalysisFailedError } from "@/src/presentation/features/course-analysis";
import { ExerciseGenerationInvalidOutputError } from "@/src/presentation/features/exercises";
import type { PreparedCoursePageImage } from "../utils/page-image";
import { logCourseProcessing } from "../utils/processing-log";

export type CourseProcessingStatus =
  | "idle"
  | "analyzing"
  | "persisting"
  | "generating_sheet"
  | "generating_exercises"
  | "completed"
  | "error";

export type CourseProcessingProgress = {
  currentPage: number;
  totalPages: number;
  percent: number;
  message: string;
  processedPages: number;
  currentPageIndex: number | null;
  attemptNumber: number | null;
  maxAttempts: number | null;
};

export type CourseProcessingResult = {
  analysis: MultiPageCourseAnalysis | null;
  persistedAnalysis: CourseAnalysis | null;
  concepts: Concept[];
  revisionSheet: RevisionSheet | null;
  exercises: Exercise[];
  warnings: string[];
};

export type CourseProcessingSnapshot = {
  status: CourseProcessingStatus;
  progress: CourseProcessingProgress;
  error: string | null;
  result: CourseProcessingResult;
  detail: CourseDetail | null;
  pendingAnalysis: MultiPageCourseAnalysis | null;
};

export type CourseProcessingDeps = {
  courses: {
    findDetailById: (courseId: string) => Promise<CourseDetail | null>;
  };
  pages: {
    findAllByCourse: (courseId: string) => Promise<CoursePage[]>;
    prepare: (page: CoursePage) => Promise<PreparedCoursePageImage>;
  };
  analysis: {
    analyzeCoursePages: (
      input: AnalyzeCoursePagesInput,
      callbacks: {
        onPageDone: (result: PageAnalysisResult) => void;
        onPageAttempt: (input: { pageIndex: number; attemptNumber: number; maxAttempts: number; retryReason?: string | null }) => void;
        onPageAttemptDone: (input: { pageIndex: number; attemptNumber: number; durationMs: number; errorCode: string | null; httpStatus: number | null }) => void;
      },
    ) => Promise<MultiPageCourseAnalysis>;
    persistCourseAnalysis: (input: {
      courseId: string;
      analysis: MultiPageCourseAnalysis;
      title?: string | null;
      subjectId?: string | null;
      grade?: string | null;
    }) => Promise<{ analysis: CourseAnalysis; concepts: Concept[] }>;
  };
  generation: {
    generateRevisionSheet: (courseId: string) => Promise<{ sheet: RevisionSheet }>;
    generateExercises: (courseId: string) => Promise<{ exercises: Exercise[] }>;
  };
};

const initialProgress: CourseProcessingProgress = {
  currentPage: 0,
  totalPages: 0,
  percent: 0,
  message: "Prêt",
  processedPages: 0,
  currentPageIndex: null,
  attemptNumber: null,
  maxAttempts: null,
};

function emptyResult(): CourseProcessingResult {
  return {
    analysis: null,
    persistedAnalysis: null,
    concepts: [],
    revisionSheet: null,
    exercises: [],
    warnings: [],
  };
}

function isDevelopment() {
  return typeof __DEV__ !== "undefined" ? __DEV__ : true;
}

function userMessage(error: unknown) {
  if (error instanceof AllCoursePagesAnalysisFailedError) {
    const codes = new Set(error.pageErrorCodes.map((item) => item.errorCode).filter(Boolean));
    if (codes.has("COURSE_ANALYSIS_KEY_MISSING")) {
      return "Configure ta clé Gemini avant de lancer l'analyse.";
    }
    if (codes.has("COURSE_ANALYSIS_KEY_INVALID")) {
      return "La clé Gemini configurée est invalide.";
    }
    if (codes.has("COURSE_ANALYSIS_MODEL_UNAVAILABLE")) {
      return "Le modèle IA configuré n'est pas disponible.";
    }
    if (codes.has("COURSE_ANALYSIS_QUOTA_EXCEEDED")) {
      return "Quota Gemini dépassé. Réessaie plus tard.";
    }
    if (codes.has("COURSE_ANALYSIS_TIMEOUT")) {
      return "La demande IA a expiré. Réessaie.";
    }
    if (
      codes.has("COURSE_ANALYSIS_PROVIDER_UNAVAILABLE") ||
      codes.has("COURSE_ANALYSIS_PROVIDER_REQUEST_INVALID") ||
      codes.has("COURSE_ANALYSIS_JSON_INVALID") ||
      codes.has("COURSE_ANALYSIS_JSON_TRUNCATED") ||
      codes.has("COURSE_ANALYSIS_SCHEMA_INVALID")
    ) {
      return "L'analyse IA a échoué. Réessaie avec une image plus nette ou relance plus tard.";
    }
    return "Toutes les pages sont illisibles ou n'ont pas pu être analysées.";
  }
  if (error instanceof Error && error.name.includes("GeminiApiKeyMissing")) {
    return "Configure ta clé Gemini avant de lancer l'analyse.";
  }
  if (error instanceof Error && error.name.includes("GeminiApiKeyInvalid")) {
    return "La clé Gemini configurée est invalide.";
  }
  if (error instanceof Error && "code" in error && typeof error.code === "string") {
    if (error instanceof ExerciseGenerationInvalidOutputError) {
      const diagnostics = error.diagnostics;
      if (diagnostics.errorCode === "EXERCISE_GENERATION_JSON_INVALID") {
        return "La réponse IA des exercices n'est pas un JSON valide.";
      }
      if (diagnostics.errorCode === "EXERCISE_GENERATION_SCHEMA_INVALID") {
        return "La structure des exercices générés est invalide.";
      }
      if (diagnostics.unknownConceptReferences && diagnostics.unknownConceptReferences.length > 0) {
        return "Certains exercices ciblent des notions inconnues.";
      }
      if (diagnostics.rejectionReasons?.includes("invalid_multiple_choice")) {
        return "Certains QCM générés sont incohérents.";
      }
      if (diagnostics.errorCode === "EXERCISE_GENERATION_TOO_FEW_ACCEPTED") {
        if (isDevelopment() && typeof diagnostics.acceptedCount === "number" && typeof diagnostics.generatedCount === "number") {
          return `${diagnostics.acceptedCount} exercice(s) valide(s) sur ${diagnostics.generatedCount} généré(s).`;
        }
        return "Moins de trois exercices valides générés.";
      }
    }
    if (error.code.includes("RATE_LIMIT") || error.code.includes("QUOTA")) {
      return "Quota Gemini dépassé. Réessaie plus tard.";
    }
    if (error.code.includes("TIMEOUT")) {
      return "La demande IA a expiré. Réessaie.";
    }
    if (error.code.includes("NO_COURSE_PAGES") || error.code.includes("IMAGE")) {
      return "Ce cours n'a pas encore de pages exploitables.";
    }
    if (error.code.includes("INVALID")) {
      return "La sortie IA est invalide. Réessaie.";
    }
    if (error.code.includes("PERSISTENCE") || error.code.includes("FAILED")) {
      return "Impossible d'enregistrer le résultat.";
    }
  }
  if (error instanceof Error && error.message === "COURSE_WITHOUT_PAGES") {
    return "Ce cours ne contient aucune page à analyser.";
  }
  if (error instanceof Error && error.message === "COURSE_NOT_FOUND") {
    return "Cours introuvable.";
  }
  return "Une erreur est survenue pendant le traitement.";
}

export function createCourseProcessingController(courseId: string, deps: CourseProcessingDeps) {
  let snapshot: CourseProcessingSnapshot = {
    status: "idle",
    progress: initialProgress,
    error: null,
    result: emptyResult(),
    detail: null,
    pendingAnalysis: null,
  };
  const listeners = new Set<(snapshot: CourseProcessingSnapshot) => void>();
  let lastFailedAction: "analysis" | "sheet" | "exercises" | null = null;
  let activeProcessing: Promise<MultiPageCourseAnalysis> | null = null;
  let activeExerciseGeneration: Promise<CourseProcessingResult> | null = null;

  function emit(next: Partial<CourseProcessingSnapshot>) {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener(snapshot));
  }

  function setProgress(progress: Partial<CourseProcessingProgress>) {
    emit({ progress: { ...snapshot.progress, ...progress } });
  }

  async function refreshDetail() {
    const detail = await deps.courses.findDetailById(courseId);
    emit({ detail });
    return detail;
  }

  async function startProcessing() {
    if (activeProcessing) {
      return activeProcessing;
    }

    lastFailedAction = null;
    const processing = (async () => {
      emit({
        status: "analyzing",
        error: null,
        pendingAnalysis: null,
        progress: { ...initialProgress, percent: 0, message: "Préparation des pages" },
      });

      const preparedPages: PreparedCoursePageImage[] = [];
      try {
        const detail = await refreshDetail();
        if (!detail) {
          throw new Error("COURSE_NOT_FOUND");
        }
        const pages = await deps.pages.findAllByCourse(courseId);
        if (pages.length === 0) {
          throw new Error("COURSE_WITHOUT_PAGES");
        }
        setProgress({ totalPages: pages.length, message: "Lecture des pages" });
        for (const page of pages) {
          const prepared = await deps.pages.prepare(page);
          preparedPages.push(prepared);
          if (prepared.metrics) {
            logCourseProcessing("page-prepared", {
              courseId,
              pageIndex: prepared.pageIndex,
              width: prepared.metrics.width,
              height: prepared.metrics.height,
              originalFileSizeBytes: prepared.metrics.originalFileSizeBytes,
              optimizedFileSizeBytes: prepared.metrics.optimizedFileSizeBytes,
              base64Length: prepared.metrics.base64Length,
              preparationDurationMs: prepared.metrics.preparationDurationMs,
              mimeType: prepared.metrics.mimeType,
            });
          }
        }
        let completedPages = 0;
        const analysis = await deps.analysis.analyzeCoursePages(
          {
            courseId,
            pages: preparedPages.map((page) => ({
              pageId: page.pageId,
              pageIndex: page.pageIndex,
              imageBase64: page.imageBase64,
              mimeType: page.mimeType,
            })),
            knownSubject: detail.subject?.name ?? null,
            knownGrade: detail.course.grade,
          },
          {
            onPageAttempt: (attempt) => {
              logCourseProcessing("page-analysis-attempt", {
                courseId,
                pageIndex: attempt.pageIndex,
                attemptNumber: attempt.attemptNumber,
                maxAttempts: attempt.maxAttempts,
                retryReason: attempt.retryReason,
              });
              setProgress({
                currentPage: completedPages,
                processedPages: completedPages,
                currentPageIndex: attempt.pageIndex,
                attemptNumber: attempt.attemptNumber,
                maxAttempts: attempt.maxAttempts,
                totalPages: pages.length,
                percent: Math.round((completedPages / pages.length) * 40),
                message: `Page ${attempt.pageIndex + 1}/${pages.length} - tentative ${attempt.attemptNumber}/${attempt.maxAttempts}`,
              });
            },
            onPageAttemptDone: (attempt) => {
              logCourseProcessing("page-analysis-attempt-done", {
                courseId,
                pageIndex: attempt.pageIndex,
                attemptNumber: attempt.attemptNumber,
                durationMs: attempt.durationMs,
                errorCode: attempt.errorCode,
                httpStatus: attempt.httpStatus,
              });
            },
            onPageDone: () => {
              completedPages = Math.min(pages.length, completedPages + 1);
              setProgress({
                currentPage: completedPages,
                processedPages: completedPages,
                totalPages: pages.length,
                percent: Math.round((completedPages / pages.length) * 40),
                currentPageIndex: null,
                attemptNumber: null,
                maxAttempts: null,
                message: `Analyse des pages ${completedPages}/${pages.length}`,
              });
            },
          },
        );
        const warnings = analysis.warnings.length > 0 || analysis.failedPageCount > 0
          ? [...analysis.warnings, ...(analysis.failedPageCount > 0 ? [`${analysis.failedPageCount} page(s) non analysée(s).`] : [])]
          : [];
        emit({
          status: "idle",
          pendingAnalysis: analysis,
          result: { ...snapshot.result, analysis, warnings },
          progress: {
            ...snapshot.progress,
            currentPage: pages.length,
            processedPages: pages.length,
            totalPages: pages.length,
            percent: 45,
            currentPageIndex: null,
            attemptNumber: null,
            maxAttempts: null,
            message: "Analyse prête à confirmer",
          },
        });
        return analysis;
      } catch (error) {
        lastFailedAction = "analysis";
        emit({ status: "error", error: userMessage(error) });
        throw error;
      } finally {
        await Promise.all(preparedPages.map((page) => page.cleanup?.().catch(() => undefined)));
      }
    })();

    activeProcessing = processing;
    try {
      return await processing;
    } finally {
      activeProcessing = null;
    }
  }

  async function confirmAndContinue() {
    if (!snapshot.pendingAnalysis) {
      return null;
    }
    try {
      emit({ status: "persisting", error: null, progress: { ...snapshot.progress, percent: 55, message: "Enregistrement de l'analyse" } });
      const detail = snapshot.detail ?? await refreshDetail();
      const persisted = await deps.analysis.persistCourseAnalysis({
        courseId,
        analysis: snapshot.pendingAnalysis,
        title: snapshot.pendingAnalysis.detectedTitle,
        subjectId: detail?.course.subjectId ?? null,
        grade: snapshot.pendingAnalysis.detectedLevel ?? detail?.course.grade ?? null,
      });

      emit({
        status: "generating_sheet",
        pendingAnalysis: null,
        result: {
          ...snapshot.result,
          persistedAnalysis: persisted.analysis,
          concepts: persisted.concepts,
        },
        progress: { ...snapshot.progress, percent: 70, message: "Génération de la fiche" },
      });
      const revisionSheet = await deps.generation.generateRevisionSheet(courseId);

      emit({
        status: "generating_exercises",
        result: { ...snapshot.result, revisionSheet: revisionSheet.sheet },
        progress: { ...snapshot.progress, percent: 85, message: "Génération des exercices" },
      });
      const exercises = await generateExercisesOnly();

      emit({
        status: "completed",
        pendingAnalysis: null,
        result: { ...snapshot.result, exercises: exercises.exercises },
        progress: { ...snapshot.progress, percent: 100, message: "Cours prêt à réviser" },
      });
      await refreshDetail();
      return snapshot.result;
    } catch (error) {
      lastFailedAction = snapshot.result.revisionSheet ? "exercises" : "sheet";
      emit({ status: "error", error: userMessage(error) });
      throw error;
    }
  }

  async function generateAssetsFromPersisted() {
    try {
      const detail = snapshot.detail ?? await refreshDetail();
      if (!detail?.latestAnalysis) {
        throw new Error("ANALYSIS_NOT_FOUND");
      }

      let revisionSheet = snapshot.result.revisionSheet ?? detail.latestRevisionSheet;
      if (!revisionSheet) {
        emit({ status: "generating_sheet", error: null, progress: { ...snapshot.progress, percent: 70, message: "Génération de la fiche" } });
        revisionSheet = (await deps.generation.generateRevisionSheet(courseId)).sheet;
      }

      emit({
        status: "generating_exercises",
        result: { ...snapshot.result, revisionSheet },
        progress: { ...snapshot.progress, percent: 85, message: "Génération des exercices" },
      });
      const exercises = await generateExercisesOnly();
      emit({
        status: "completed",
        result: { ...snapshot.result, revisionSheet, exercises: exercises.exercises },
        progress: { ...snapshot.progress, percent: 100, message: "Cours prêt à réviser" },
      });
      await refreshDetail();
      return snapshot.result;
    } catch (error) {
      lastFailedAction = snapshot.result.revisionSheet || snapshot.detail?.latestRevisionSheet ? "exercises" : "sheet";
      emit({ status: "error", error: userMessage(error) });
      throw error;
    }
  }

  async function generateExercisesOnly() {
    if (activeExerciseGeneration) {
      return activeExerciseGeneration;
    }
    const running = (async () => {
      const exercises = await deps.generation.generateExercises(courseId);
      return { ...snapshot.result, exercises: exercises.exercises };
    })();
    activeExerciseGeneration = running;
    try {
      return await running;
    } finally {
      activeExerciseGeneration = null;
    }
  }

  async function retry() {
    if (lastFailedAction === "sheet" && snapshot.pendingAnalysis) {
      return confirmAndContinue();
    }
    if (lastFailedAction === "sheet") {
      return generateAssetsFromPersisted();
    }
    if (lastFailedAction === "exercises") {
      try {
        emit({ status: "generating_exercises", error: null, progress: { ...snapshot.progress, percent: 85, message: "Génération des exercices" } });
        const result = await generateExercisesOnly();
        emit({
          status: "completed",
          pendingAnalysis: null,
          result,
          progress: { ...snapshot.progress, percent: 100, message: "Cours prêt à réviser" },
        });
        await refreshDetail();
        return snapshot.result;
      } catch (error) {
        lastFailedAction = "exercises";
        emit({ status: "error", error: userMessage(error) });
        throw error;
      }
    }
    return startProcessing();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: (snapshot: CourseProcessingSnapshot) => void) => {
      listeners.add(listener);
      listener(snapshot);
      return () => {
        listeners.delete(listener);
      };
    },
    refreshDetail,
    startProcessing,
    confirmAndContinue,
    generateAssetsFromPersisted,
    retry,
  };
}
