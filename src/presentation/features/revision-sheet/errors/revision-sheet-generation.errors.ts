export type RevisionSheetGenerationErrorCode =
  | "REVISION_SHEET_COURSE_NOT_FOUND"
  | "REVISION_SHEET_COURSE_NOT_READY"
  | "REVISION_SHEET_ANALYSIS_NOT_FOUND"
  | "REVISION_SHEET_CONCEPTS_NOT_FOUND"
  | "REVISION_SHEET_AI_NOT_CONFIGURED"
  | "REVISION_SHEET_INVALID_OUTPUT"
  | "REVISION_SHEET_PERSISTENCE_FAILED";

export class RevisionSheetGenerationError extends Error {
  constructor(
    public readonly code: RevisionSheetGenerationErrorCode,
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
  }
}

export class RevisionSheetCourseNotFoundError extends RevisionSheetGenerationError {
  constructor(cause?: unknown) {
    super("REVISION_SHEET_COURSE_NOT_FOUND", "Course not found.", { cause });
  }
}

export class RevisionSheetCourseNotReadyError extends RevisionSheetGenerationError {
  constructor(cause?: unknown) {
    super("REVISION_SHEET_COURSE_NOT_READY", "Course is not ready.", { cause });
  }
}

export class RevisionSheetAnalysisNotFoundError extends RevisionSheetGenerationError {
  constructor(cause?: unknown) {
    super("REVISION_SHEET_ANALYSIS_NOT_FOUND", "Course analysis not found.", { cause });
  }
}

export class RevisionSheetConceptsNotFoundError extends RevisionSheetGenerationError {
  constructor(cause?: unknown) {
    super("REVISION_SHEET_CONCEPTS_NOT_FOUND", "Course concepts not found.", { cause });
  }
}

export class RevisionSheetAINotConfiguredError extends RevisionSheetGenerationError {
  constructor(cause?: unknown) {
    super("REVISION_SHEET_AI_NOT_CONFIGURED", "AI service is not configured.", { cause });
  }
}

export class RevisionSheetInvalidOutputError extends RevisionSheetGenerationError {
  constructor(cause?: unknown) {
    super("REVISION_SHEET_INVALID_OUTPUT", "Revision sheet output is invalid.", { cause });
  }
}

export class RevisionSheetPersistenceFailedError extends RevisionSheetGenerationError {
  constructor(cause?: unknown) {
    super("REVISION_SHEET_PERSISTENCE_FAILED", "Revision sheet persistence failed.", { cause });
  }
}
