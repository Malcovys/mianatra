export type CoursePageAnalysisErrorCode =
  | "COURSE_ANALYSIS_AI_DISABLED"
  | "COURSE_ANALYSIS_KEY_MISSING"
  | "COURSE_ANALYSIS_INPUT_INVALID"
  | "COURSE_ANALYSIS_IMAGE_INVALID"
  | "COURSE_ANALYSIS_PROVIDER_REQUEST_INVALID"
  | "COURSE_ANALYSIS_PROVIDER_UNAVAILABLE"
  | "COURSE_ANALYSIS_TIMEOUT"
  | "COURSE_ANALYSIS_QUOTA_EXCEEDED"
  | "COURSE_ANALYSIS_KEY_INVALID"
  | "COURSE_ANALYSIS_MODEL_UNAVAILABLE"
  | "COURSE_ANALYSIS_JSON_INVALID"
  | "COURSE_ANALYSIS_JSON_TRUNCATED"
  | "COURSE_ANALYSIS_SCHEMA_INVALID";

export class CoursePageAnalysisError extends Error {
  constructor(
    public readonly code: CoursePageAnalysisErrorCode,
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
  }
}

export class CoursePageAnalysisAIUnavailableError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis AI is disabled.", cause?: unknown) {
    super("COURSE_ANALYSIS_AI_DISABLED", message, { cause });
  }
}

export class CoursePageAnalysisKeyMissingError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis requires a Gemini API key.", cause?: unknown) {
    super("COURSE_ANALYSIS_KEY_MISSING", message, { cause });
  }
}

export class CoursePageAnalysisInputError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis input is invalid.", cause?: unknown) {
    super("COURSE_ANALYSIS_INPUT_INVALID", message, { cause });
  }
}

export class CoursePageAnalysisImageError extends CoursePageAnalysisError {
  constructor(message = "Course page image input is invalid.", cause?: unknown) {
    super("COURSE_ANALYSIS_IMAGE_INVALID", message, { cause });
  }
}

export class CoursePageAnalysisProviderError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis provider is unavailable.", cause?: unknown) {
    super("COURSE_ANALYSIS_PROVIDER_UNAVAILABLE", message, { cause });
  }
}

export class CoursePageAnalysisProviderRequestInvalidError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis provider rejected the request.", cause?: unknown) {
    super("COURSE_ANALYSIS_PROVIDER_REQUEST_INVALID", message, { cause });
  }
}

export class CoursePageAnalysisTimeoutError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis timed out.", cause?: unknown) {
    super("COURSE_ANALYSIS_TIMEOUT", message, { cause });
  }
}

export class CoursePageAnalysisQuotaError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis quota was exceeded.", cause?: unknown) {
    super("COURSE_ANALYSIS_QUOTA_EXCEEDED", message, { cause });
  }
}

export class CoursePageAnalysisKeyInvalidError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis API key is invalid.", cause?: unknown) {
    super("COURSE_ANALYSIS_KEY_INVALID", message, { cause });
  }
}

export class CoursePageAnalysisModelError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis model is unavailable.", cause?: unknown) {
    super("COURSE_ANALYSIS_MODEL_UNAVAILABLE", message, { cause });
  }
}

export class CoursePageAnalysisJsonError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis response is not valid JSON.", cause?: unknown) {
    super("COURSE_ANALYSIS_JSON_INVALID", message, { cause });
  }
}

export class CoursePageAnalysisJsonTruncatedError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis response JSON is truncated.", cause?: unknown) {
    super("COURSE_ANALYSIS_JSON_TRUNCATED", message, { cause });
  }
}

export class CoursePageAnalysisSchemaError extends CoursePageAnalysisError {
  constructor(message = "Course page analysis response does not match the expected schema.", cause?: unknown) {
    super("COURSE_ANALYSIS_SCHEMA_INVALID", message, { cause });
  }
}
