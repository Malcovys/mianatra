import * as repositories from "@/src/database";
import { createConfiguredMobileAIService } from "@/src/presentation/features/ai-settings";
import { analyzeCoursePage, analyzeCoursePages, persistCourseAnalysis, type AnalyzeCoursePagesInput } from "@/src/presentation/features/course-analysis";
import { generateCourseExercises } from "@/src/presentation/features/exercises";
import { generateCourseRevisionSheet } from "@/src/presentation/features/revision-sheet";
import { prepareCoursePageImage } from "../utils/page-image";
import type { CourseProcessingDeps } from "./course-processing.controller";

function logExerciseGeneration(event: string, payload: Record<string, unknown>) {
  console.info("[exercise-generation]", event, payload);
}

export async function createDefaultCourseProcessingDeps(): Promise<CourseProcessingDeps> {
  return {
    courses: repositories.coursesRepository,
    pages: {
      findAllByCourse: repositories.pagesRepository.findAllByCourse,
      prepare: prepareCoursePageImage,
    },
    analysis: {
      analyzeCoursePages: (input: AnalyzeCoursePagesInput, callbacks) =>
        analyzeCoursePages(input, {
          analyzeSinglePage: (pageInput) => analyzeCoursePage(pageInput, { aiService: createConfiguredMobileAIService }),
          onPageDone: callbacks.onPageDone,
          onPageAttempt: callbacks.onPageAttempt,
          onPageAttemptDone: callbacks.onPageAttemptDone,
        }),
      persistCourseAnalysis: (input) =>
        persistCourseAnalysis(input, {
          courses: repositories.coursesRepository,
          subjects: repositories.subjectsRepository,
          analyses: repositories.analysesRepository,
        }),
    },
    generation: {
      generateRevisionSheet: async (courseId) => ({
        sheet: (await generateCourseRevisionSheet(courseId, {
          aiService: createConfiguredMobileAIService,
          courses: repositories.coursesRepository,
          revisionSheets: repositories.revisionSheetsRepository,
        })).sheet,
      }),
      generateExercises: async (courseId) => ({
        exercises: (await generateCourseExercises(courseId, { count: 5 }, {
          aiService: createConfiguredMobileAIService,
          courses: repositories.coursesRepository,
          exercises: repositories.exercisesRepository,
          logger: logExerciseGeneration,
        })).exercises,
      }),
    },
  };
}
