export class BusinessError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class SubjectNotFoundError extends BusinessError {
  constructor(cause?: unknown) {
    super("SUBJECT_NOT_FOUND", "Subject not found.", { cause });
  }
}

export class SubjectInUseError extends BusinessError {
  constructor(cause?: unknown) {
    super("SUBJECT_IN_USE", "Subject is linked to at least one course.", { cause });
  }
}

export class CourseNotFoundError extends BusinessError {
  constructor(cause?: unknown) {
    super("COURSE_NOT_FOUND", "Course not found.", { cause });
  }
}

export class CourseHasNoPagesError extends BusinessError {
  constructor(cause?: unknown) {
    super("COURSE_HAS_NO_PAGES", "Course has no pages to compile.", { cause });
  }
}

export class ExerciseNotFoundError extends BusinessError {
  constructor(cause?: unknown) {
    super("EXERCISE_NOT_FOUND", "Exercise not found.", { cause });
  }
}

export class SessionNotFoundError extends BusinessError {
  constructor(cause?: unknown) {
    super("SESSION_NOT_FOUND", "Study session not found.", { cause });
  }
}

export class SessionAlreadyCompletedError extends BusinessError {
  constructor(cause?: unknown) {
    super("SESSION_ALREADY_COMPLETED", "Study session is already completed.", { cause });
  }
}

export class InvalidSessionStateError extends BusinessError {
  constructor(message = "Invalid study session state.", cause?: unknown) {
    super("INVALID_SESSION_STATE", message, { cause });
  }
}

export class InvalidAnswerError extends BusinessError {
  constructor(cause?: unknown) {
    super("INVALID_ANSWER", "Answer is missing or invalid.", { cause });
  }
}

export class DuplicateSubjectNameError extends BusinessError {
  constructor(cause?: unknown) {
    super("DUPLICATE_SUBJECT_NAME", "Subject name already exists.", { cause });
  }
}
