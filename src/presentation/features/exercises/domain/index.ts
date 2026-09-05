export {
  checkMultipleChoiceAnswer,
  checkNumericAnswer,
  checkShortAnswer,
  checkTrueFalseAnswer,
  normalizeAnswer,
  validateExerciseAnswer,
} from "./answer-validation";
export type { AnswerValidationResult, AnswerValidationStatus } from "./answer-validation";
export { classifyMistake } from "./mistake-classification";
export type { MistakeType } from "./mistake-classification";
