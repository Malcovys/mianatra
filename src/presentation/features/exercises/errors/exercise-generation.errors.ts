export type ExerciseGenerationErrorCode =
  | "EXERCISE_GENERATION_COURSE_NOT_FOUND"
  | "EXERCISE_GENERATION_COURSE_NOT_READY"
  | "EXERCISE_GENERATION_ANALYSIS_NOT_FOUND"
  | "EXERCISE_GENERATION_CONCEPTS_NOT_FOUND"
  | "EXERCISE_GENERATION_AI_NOT_CONFIGURED"
  | "EXERCISE_GENERATION_INVALID_OUTPUT"
  | "EXERCISE_GENERATION_CONCEPT_NOT_FOUND"
  | "EXERCISE_GENERATION_PERSISTENCE_FAILED";

export type ExerciseGenerationDiagnostics = {
  errorCode: string;
  issueCount?: number;
  issuePaths?: string[];
  zodCodes?: string[];
  generatedCount?: number;
  acceptedCount?: number;
  rejectedCount?: number;
  rejectionReasons?: string[];
  rejectionReasonCounts?: Record<string, number>;
  unknownConceptReferences?: string[];
  duplicateQuestionCount?: number;
  acceptedTypes?: string[];
  rejectedExercises?: {
    exerciseIndex: number;
    reason: string;
    issuePaths: string[];
    zodCodes: string[];
    expectedTypes: string[];
    receivedType: string;
    exerciseType?: string;
  }[];
};

export class ExerciseGenerationError extends Error {
  constructor(
    public readonly code: ExerciseGenerationErrorCode,
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
  }
}

export class ExerciseGenerationCourseNotFoundError extends ExerciseGenerationError {
  constructor(cause?: unknown) {
    super("EXERCISE_GENERATION_COURSE_NOT_FOUND", "Course not found.", { cause });
  }
}

export class ExerciseGenerationCourseNotReadyError extends ExerciseGenerationError {
  constructor(cause?: unknown) {
    super("EXERCISE_GENERATION_COURSE_NOT_READY", "Course is not ready.", { cause });
  }
}

export class ExerciseGenerationAnalysisNotFoundError extends ExerciseGenerationError {
  constructor(cause?: unknown) {
    super("EXERCISE_GENERATION_ANALYSIS_NOT_FOUND", "Course analysis not found.", { cause });
  }
}

export class ExerciseGenerationConceptsNotFoundError extends ExerciseGenerationError {
  constructor(cause?: unknown) {
    super("EXERCISE_GENERATION_CONCEPTS_NOT_FOUND", "Course concepts not found.", { cause });
  }
}

export class ExerciseGenerationAINotConfiguredError extends ExerciseGenerationError {
  constructor(cause?: unknown) {
    super("EXERCISE_GENERATION_AI_NOT_CONFIGURED", "AI service is not configured.", { cause });
  }
}

export class ExerciseGenerationInvalidOutputError extends ExerciseGenerationError {
  readonly diagnostics: ExerciseGenerationDiagnostics;

  constructor(cause?: unknown, diagnostics: ExerciseGenerationDiagnostics = { errorCode: "EXERCISE_GENERATION_INVALID_OUTPUT" }) {
    super("EXERCISE_GENERATION_INVALID_OUTPUT", "Generated exercises output is invalid.", { cause });
    this.diagnostics = diagnostics;
  }
}

export class ExerciseGenerationConceptNotFoundError extends ExerciseGenerationError {
  constructor(cause?: unknown) {
    super("EXERCISE_GENERATION_CONCEPT_NOT_FOUND", "Generated exercise concept was not found.", { cause });
  }
}

export class ExerciseGenerationPersistenceFailedError extends ExerciseGenerationError {
  constructor(cause?: unknown) {
    super("EXERCISE_GENERATION_PERSISTENCE_FAILED", "Exercise persistence failed.", { cause });
  }
}
