export {
  checkMultipleChoiceAnswer,
  checkNumericAnswer,
  checkShortAnswer,
  checkTrueFalseAnswer,
  classifyMistake,
  normalizeAnswer,
  validateExerciseAnswer,
} from "./domain";
export type { AnswerValidationResult, AnswerValidationStatus, MistakeType } from "./domain";
export { generateCourseExercises, createGenerateCourseExercisesService } from "./services/generate-course-exercises.service";
export type {
  ExerciseCourseData,
  GenerateCourseExercisesDependencies,
  GenerateCourseExercisesOptions,
  GenerateCourseExercisesResult,
  PersistGeneratedExerciseInput,
} from "./services/generate-course-exercises.service";
export { exerciseGenerationSchema, generatedExerciseSchema, generatedExercisesSchema, generatedExerciseTypes } from "./schemas/generated-exercises.schema";
export type { GeneratedExercise, GeneratedExercisesOutput } from "./schemas/generated-exercises.schema";
export { buildCourseExercisesPrompt } from "./prompts/course-exercises.prompt";
export {
  ExerciseGenerationAINotConfiguredError,
  ExerciseGenerationAnalysisNotFoundError,
  ExerciseGenerationConceptNotFoundError,
  ExerciseGenerationConceptsNotFoundError,
  ExerciseGenerationCourseNotFoundError,
  ExerciseGenerationCourseNotReadyError,
  ExerciseGenerationError,
  ExerciseGenerationInvalidOutputError,
  ExerciseGenerationPersistenceFailedError,
} from "./errors/exercise-generation.errors";
export type { ExerciseGenerationErrorCode } from "./errors/exercise-generation.errors";
