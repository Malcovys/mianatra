export type PersistCourseAnalysisErrorCode =
  | "PERSIST_COURSE_ANALYSIS_COURSE_NOT_FOUND"
  | "PERSIST_COURSE_ANALYSIS_SUBJECT_NOT_FOUND"
  | "PERSIST_COURSE_ANALYSIS_INVALID"
  | "PERSIST_COURSE_ANALYSIS_NO_CONCEPTS"
  | "PERSIST_COURSE_ANALYSIS_CONCEPTS_REFERENCED"
  | "PERSIST_COURSE_ANALYSIS_FAILED";

export class PersistCourseAnalysisError extends Error {
  constructor(
    public readonly code: PersistCourseAnalysisErrorCode,
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
  }
}

export class PersistCourseAnalysisCourseNotFoundError extends PersistCourseAnalysisError {
  constructor(message = "Course not found.", cause?: unknown) {
    super("PERSIST_COURSE_ANALYSIS_COURSE_NOT_FOUND", message, { cause });
  }
}

export class PersistCourseAnalysisSubjectNotFoundError extends PersistCourseAnalysisError {
  constructor(message = "Subject not found.", cause?: unknown) {
    super("PERSIST_COURSE_ANALYSIS_SUBJECT_NOT_FOUND", message, { cause });
  }
}

export class PersistCourseAnalysisInvalidError extends PersistCourseAnalysisError {
  constructor(message = "Course analysis is invalid.", cause?: unknown) {
    super("PERSIST_COURSE_ANALYSIS_INVALID", message, { cause });
  }
}

export class PersistCourseAnalysisNoConceptsError extends PersistCourseAnalysisError {
  constructor(message = "Course analysis must contain at least one concept.", cause?: unknown) {
    super("PERSIST_COURSE_ANALYSIS_NO_CONCEPTS", message, { cause });
  }
}

export class PersistCourseAnalysisConceptsReferencedError extends PersistCourseAnalysisError {
  constructor(message = "Course concepts are already referenced and cannot be replaced.", cause?: unknown) {
    super("PERSIST_COURSE_ANALYSIS_CONCEPTS_REFERENCED", message, { cause });
  }
}

export class PersistCourseAnalysisFailedError extends PersistCourseAnalysisError {
  constructor(message = "Course analysis persistence failed.", cause?: unknown) {
    super("PERSIST_COURSE_ANALYSIS_FAILED", message, { cause });
  }
}
