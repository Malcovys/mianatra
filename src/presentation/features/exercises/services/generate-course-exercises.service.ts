import type { Concept, Course, CourseAnalysis, Exercise, Subject } from "@/src/db";
import type { AIStructuredResult, AIService } from "@/src/services/ai/ai.service";
import { AIJsonParseError, AIJsonTruncatedError, AISchemaValidationError } from "@/src/services/ai/ai.errors";
import type { AITextResponse } from "@/src/services/ai";
import { buildCourseExercisesPrompt } from "../prompts/course-exercises.prompt";
import { exerciseGenerationSchema, type GeneratedExercise } from "../schemas/generated-exercises.schema";
import {
  ExerciseGenerationAINotConfiguredError,
  ExerciseGenerationAnalysisNotFoundError,
  ExerciseGenerationConceptsNotFoundError,
  ExerciseGenerationCourseNotFoundError,
  ExerciseGenerationCourseNotReadyError,
  ExerciseGenerationInvalidOutputError,
  ExerciseGenerationPersistenceFailedError,
} from "../errors/exercise-generation.errors";

export type ExerciseCourseData = {
  course: Course;
  subject: Subject | null;
  concepts: Concept[];
  latestAnalysis: CourseAnalysis | null;
};

type AITextGenerator = Pick<AIService, "generateStructured"> & Partial<Pick<AIService, "generateStructuredWithMetadata">>;

type ExerciseGenerationLogPayload = Record<string, unknown>;

type ExerciseGenerationLogger = (event: string, payload: ExerciseGenerationLogPayload) => void;

export type GenerateCourseExercisesOptions = {
  count?: number;
};

export type PersistGeneratedExerciseInput = {
  courseId: string;
  conceptId: string;
  type: GeneratedExercise["type"];
  question: string;
  expectedAnswer: string;
  optionsJson: string | null;
  hint: string | null;
  explanation: string;
  difficulty: number;
  generatedFromWeakness: boolean;
};

export type GenerateCourseExercisesDependencies = {
  aiService: AITextGenerator | null | (() => Promise<AITextGenerator | null>);
  courses: {
    findDetailById: (courseId: string) => Promise<ExerciseCourseData | null>;
  };
  exercises: {
    findAllByCourse: (courseId: string) => Promise<Exercise[]>;
    createMany: (inputs: PersistGeneratedExerciseInput[]) => Promise<Exercise[]>;
  };
  logger?: ExerciseGenerationLogger;
};

export type GenerateCourseExercisesResult = {
  exercises: Exercise[];
  requestedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  warnings: string[];
};

type AcceptedExercise = {
  input: PersistGeneratedExerciseInput;
  normalizedQuestion: string;
};

type ExerciseRejectionReason =
  | "duplicate_question"
  | "existing_question_duplicate"
  | "concept_not_found"
  | "invalid_multiple_choice"
  | "invalid_true_false"
  | "invalid_difficulty"
  | "invalid_answer"
  | "invalid_type";

type ExerciseValidationRejection = {
  exerciseIndex: number;
  reason: ExerciseRejectionReason;
  conceptReference?: string;
  issuePaths: string[];
  zodCodes: string[];
  expectedTypes: string[];
  receivedType: string;
  exerciseType?: GeneratedExercise["type"];
};

type ExerciseValidationResult = {
  accepted: AcceptedExercise | null;
  rejection: ExerciseValidationRejection | null;
};

function clampRequestedCount(value: number | undefined) {
  if (value === undefined) {
    return 5;
  }
  if (!Number.isInteger(value) || value < 3 || value > 5) {
    throw new ExerciseGenerationInvalidOutputError();
  }
  return value;
}

function nowMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function safeLog(logger: ExerciseGenerationLogger | undefined, event: string, payload: ExerciseGenerationLogPayload) {
  logger?.(event, payload);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeKey(value: string) {
  return normalizeText(value)
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeQuestion(value: string) {
  return normalizeKey(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function normalizeBooleanAnswer(value: string) {
  const normalized = normalizeKey(value);
  if (["vrai", "true", "1", "oui"].includes(normalized)) {
    return "vrai";
  }
  if (["faux", "false", "0", "non"].includes(normalized)) {
    return "faux";
  }
  return null;
}

async function resolveAIService(dependencies: GenerateCourseExercisesDependencies) {
  const service = typeof dependencies.aiService === "function" ? await dependencies.aiService() : dependencies.aiService;
  if (!service) {
    throw new ExerciseGenerationAINotConfiguredError();
  }
  return service;
}

function assertCourseData(courseId: string, data: ExerciseCourseData | null) {
  if (!courseId.trim() || !data) {
    throw new ExerciseGenerationCourseNotFoundError();
  }
  if (data.course.status !== "ready" || !data.subject || !data.course.grade.trim() || !data.course.summary?.trim()) {
    throw new ExerciseGenerationCourseNotReadyError();
  }
  if (!data.latestAnalysis) {
    throw new ExerciseGenerationAnalysisNotFoundError();
  }
  if (data.concepts.length === 0) {
    throw new ExerciseGenerationConceptsNotFoundError();
  }
}

function uniqueValues(values: string[]) {
  return [...new Set(values)].sort();
}

function countByReason(rejections: ExerciseValidationRejection[]) {
  return rejections.reduce<Record<string, number>>((acc, rejection) => {
    acc[rejection.reason] = (acc[rejection.reason] ?? 0) + 1;
    return acc;
  }, {});
}

const allowedExerciseTypes = ["multiple_choice", "true_false", "short_answer", "numeric"] as const;

function shortConceptReference(value: string) {
  return normalizeText(value).slice(0, 80);
}

function valueType(value: unknown) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}

function safeExerciseType(value: unknown): GeneratedExercise["type"] | undefined {
  return typeof value === "string" && allowedExerciseTypes.includes(value as GeneratedExercise["type"])
    ? value as GeneratedExercise["type"]
    : undefined;
}

function rejection(input: {
  exerciseIndex: number;
  reason: ExerciseRejectionReason;
  issuePaths: string[];
  zodCodes: string[];
  expectedTypes: string[];
  receivedValue: unknown;
  exerciseType?: unknown;
  conceptReference?: string;
}): ExerciseValidationRejection {
  return {
    exerciseIndex: input.exerciseIndex,
    reason: input.reason,
    issuePaths: input.issuePaths,
    zodCodes: input.zodCodes,
    expectedTypes: input.expectedTypes,
    receivedType: valueType(input.receivedValue),
    exerciseType: safeExerciseType(input.exerciseType),
    conceptReference: input.conceptReference,
  };
}

function diagnosticsForZod(error: AISchemaValidationError) {
  const cause = error.cause;
  if (cause && typeof cause === "object" && "issues" in cause && Array.isArray(cause.issues)) {
    const issues = cause.issues.filter((issue: unknown) => typeof issue === "object" && issue !== null) as {
      path?: (string | number)[];
      code?: string;
    }[];
    return {
      errorCode: "EXERCISE_GENERATION_SCHEMA_INVALID",
      issueCount: issues.length,
      issuePaths: issues.map((issue) => issue.path?.join(".") ?? ""),
      zodCodes: issues.map((issue) => issue.code ?? "unknown"),
      issues: issues.map((issue) => ({
        path: issue.path?.join(".") ?? "",
        code: issue.code ?? "unknown",
        message: "message" in issue && typeof issue.message === "string" ? issue.message : "",
      })),
    };
  }
  return {
    errorCode: "EXERCISE_GENERATION_SCHEMA_INVALID",
    issueCount: typeof error.details.issueCount === "number" ? error.details.issueCount : undefined,
    issuePaths: typeof error.details.path === "string" ? [error.details.path] : [],
    zodCodes: typeof error.details.code === "string" ? [error.details.code] : [],
    issues: [{
      path: typeof error.details.path === "string" ? error.details.path : "",
      code: typeof error.details.code === "string" ? error.details.code : "unknown",
      message: typeof error.details.message === "string" ? error.details.message : "",
    }],
  };
}

function invalidOutput(
  diagnostics: {
    errorCode: string;
    generatedCount?: number;
    acceptedCount?: number;
    rejectedCount?: number;
    rejectionReasons?: string[];
    rejectionReasonCounts?: Record<string, number>;
    unknownConceptReferences?: string[];
    duplicateQuestionCount?: number;
    issueCount?: number;
    issuePaths?: string[];
    zodCodes?: string[];
    issues?: { path: string; code: string; message: string }[];
    acceptedTypes?: string[];
    rejectedExercises?: Omit<ExerciseValidationRejection, "conceptReference">[];
  },
  cause?: unknown,
) {
  return new ExerciseGenerationInvalidOutputError(cause, diagnostics);
}

function validateExerciseForPersistence(
  exercise: GeneratedExercise,
  exerciseIndex: number,
  course: Course,
  conceptsByName: Map<string, Concept>,
  seenQuestions: Set<string>,
  existingQuestions: Set<string>,
): ExerciseValidationResult {
  const normalizedQuestion = normalizeQuestion(exercise.question);
  if (!normalizedQuestion || !normalizeText(exercise.expectedAnswer)) {
    return { accepted: null, rejection: rejection({ exerciseIndex, reason: "invalid_answer", issuePaths: ["expectedAnswer"], zodCodes: ["custom"], expectedTypes: ["non_empty_string"], receivedValue: exercise.expectedAnswer, exerciseType: exercise.type }) };
  }
  if (existingQuestions.has(normalizedQuestion)) {
    return { accepted: null, rejection: rejection({ exerciseIndex, reason: "existing_question_duplicate", issuePaths: ["question"], zodCodes: ["duplicate"], expectedTypes: ["unique_question"], receivedValue: "string", exerciseType: exercise.type }) };
  }
  if (seenQuestions.has(normalizedQuestion)) {
    return { accepted: null, rejection: rejection({ exerciseIndex, reason: "duplicate_question", issuePaths: ["question"], zodCodes: ["duplicate"], expectedTypes: ["unique_question"], receivedValue: "string", exerciseType: exercise.type }) };
  }

  if (exercise.difficulty < 1 || exercise.difficulty > 3) {
    return { accepted: null, rejection: rejection({ exerciseIndex, reason: "invalid_difficulty", issuePaths: ["difficulty"], zodCodes: ["too_big"], expectedTypes: ["integer_1_to_3"], receivedValue: exercise.difficulty, exerciseType: exercise.type }) };
  }

  const concept = conceptsByName.get(normalizeKey(exercise.conceptReference));
  if (!concept) {
    return { accepted: null, rejection: rejection({ exerciseIndex, reason: "concept_not_found", issuePaths: ["conceptReference"], zodCodes: ["not_found"], expectedTypes: ["known_concept_reference"], receivedValue: exercise.conceptReference, exerciseType: exercise.type, conceptReference: shortConceptReference(exercise.conceptReference) }) };
  }

  if (exercise.type === "multiple_choice") {
    const options = exercise.options ?? [];
    const distinctOptions = new Set(options.map(normalizeKey));
    if (distinctOptions.size < 2 || !distinctOptions.has(normalizeKey(exercise.expectedAnswer))) {
      return { accepted: null, rejection: rejection({ exerciseIndex, reason: "invalid_multiple_choice", issuePaths: ["options"], zodCodes: ["invalid_multiple_choice"], expectedTypes: ["array_with_expected_answer"], receivedValue: exercise.options, exerciseType: exercise.type }) };
    }
  }

  if (exercise.type !== "multiple_choice" && exercise.options !== null) {
    return { accepted: null, rejection: rejection({ exerciseIndex, reason: "invalid_type", issuePaths: ["options"], zodCodes: ["invalid_type"], expectedTypes: ["null"], receivedValue: exercise.options, exerciseType: exercise.type }) };
  }

  if (exercise.type === "true_false" && !normalizeBooleanAnswer(exercise.expectedAnswer)) {
    return { accepted: null, rejection: rejection({ exerciseIndex, reason: "invalid_true_false", issuePaths: ["expectedAnswer"], zodCodes: ["invalid_value"], expectedTypes: ["boolean_answer"], receivedValue: exercise.expectedAnswer, exerciseType: exercise.type }) };
  }

  seenQuestions.add(normalizedQuestion);
  return {
    accepted: {
      normalizedQuestion,
      input: {
        courseId: course.id,
        conceptId: concept.id,
        type: exercise.type,
        question: normalizeText(exercise.question),
        expectedAnswer: normalizeText(exercise.expectedAnswer),
        optionsJson: exercise.options ? JSON.stringify(exercise.options.map(normalizeText)) : null,
        hint: exercise.hint ? normalizeText(exercise.hint) : null,
        explanation: normalizeText(exercise.explanation),
        difficulty: exercise.difficulty,
        generatedFromWeakness: exercise.generatedFromWeakness,
      },
    },
    rejection: null,
  };
}

function prepareExercisesForPersistence(
  generated: GeneratedExercise[],
  data: ExerciseCourseData & { subject: Subject; latestAnalysis: CourseAnalysis },
  existingExercises: Exercise[],
) {
  const conceptsByName = new Map(data.concepts.map((concept) => [normalizeKey(concept.name), concept]));
  const existingQuestions = new Set(existingExercises.map((exercise) => normalizeQuestion(exercise.question)));
  const seenQuestions = new Set<string>();
  const warnings: string[] = [];
  const accepted: AcceptedExercise[] = [];
  const rejections: ExerciseValidationRejection[] = [];

  for (const [exerciseIndex, exercise] of generated.entries()) {
    const result = validateExerciseForPersistence(exercise, exerciseIndex, data.course, conceptsByName, seenQuestions, existingQuestions);
    if (result.accepted) {
      accepted.push(result.accepted);
    }
    if (result.rejection) {
      rejections.push(result.rejection);
      warnings.push(`${result.rejection.reason} rejeté`);
    }
  }

  const diagnostics = {
    errorCode: "EXERCISE_GENERATION_BUSINESS_INVALID",
    generatedCount: generated.length,
    acceptedCount: accepted.length,
    rejectedCount: rejections.length,
    rejectionReasons: uniqueValues(rejections.map((rejection) => rejection.reason)),
    rejectionReasonCounts: countByReason(rejections),
    unknownConceptReferences: uniqueValues(rejections.map((rejection) => rejection.conceptReference).filter((value): value is string => Boolean(value))),
    duplicateQuestionCount: rejections.filter((rejection) => rejection.reason === "duplicate_question" || rejection.reason === "existing_question_duplicate").length,
    acceptedTypes: uniqueValues(accepted.map((exercise) => exercise.input.type)),
    rejectedExercises: rejections.map(({ conceptReference: _conceptReference, ...safeRejection }) => safeRejection),
  };

  if (accepted.length < 3) {
    throw invalidOutput({ ...diagnostics, errorCode: "EXERCISE_GENERATION_TOO_FEW_ACCEPTED" });
  }

  const acceptedConceptIds = new Set(accepted.map((exercise) => exercise.input.conceptId));
  if (data.concepts.length > 1 && acceptedConceptIds.size < 2) {
    throw invalidOutput({ ...diagnostics, errorCode: "EXERCISE_GENERATION_TOO_FEW_CONCEPTS_COVERED" });
  }

  return {
    inputs: accepted.map((exercise) => exercise.input),
    warnings,
    diagnostics,
    acceptedTypes: diagnostics.acceptedTypes,
  };
}

async function generateStructuredExercises(
  aiService: AITextGenerator,
  input: Parameters<AITextGenerator["generateStructured"]>[0],
): Promise<AIStructuredResult<{ exercises: GeneratedExercise[] }>> {
  if (aiService.generateStructuredWithMetadata) {
    return aiService.generateStructuredWithMetadata(input, exerciseGenerationSchema);
  }
  const data = await aiService.generateStructured(input, exerciseGenerationSchema);
  return {
    data,
    response: {
      text: "",
      provider: "unknown",
      model: "unknown",
      requestId: "unknown",
      durationMs: 0,
      finishReason: null,
      tokenUsage: null,
      diagnostics: null,
    },
  };
}

function logProviderDone(logger: ExerciseGenerationLogger | undefined, response: AITextResponse) {
  safeLog(logger, "exercise-generation-provider-done", {
    durationMs: response.durationMs,
    candidateCount: response.diagnostics?.candidateCount ?? null,
    partCount: response.diagnostics?.partCount ?? null,
    thoughtPartCount: response.diagnostics?.thoughtPartCount ?? null,
    responseTextLength: response.diagnostics?.responseTextLength ?? response.text.length,
    finishReason: response.finishReason,
    inputTokenCount: response.tokenUsage?.promptTokens ?? null,
    outputTokenCount: response.tokenUsage?.outputTokens ?? response.diagnostics?.outputTokenCount ?? null,
  });
}

function logProviderDoneFromError(logger: ExerciseGenerationLogger | undefined, error: AIJsonParseError | AIJsonTruncatedError | AISchemaValidationError) {
  safeLog(logger, "exercise-generation-provider-done", {
    durationMs: error.details.durationMs ?? null,
    candidateCount: error.details.candidateCount ?? null,
    partCount: error.details.partCount ?? null,
    thoughtPartCount: error.details.thoughtPartCount ?? null,
    responseTextLength: error.details.responseTextLength ?? null,
    finishReason: error.details.finishReason ?? null,
    inputTokenCount: error.details.inputTokenCount ?? null,
    outputTokenCount: error.details.outputTokenCount ?? null,
  });
}

export async function generateCourseExercises(
  courseId: string,
  options: GenerateCourseExercisesOptions,
  dependencies: GenerateCourseExercisesDependencies,
): Promise<GenerateCourseExercisesResult> {
  const startedAt = nowMs();
  let stage: "provider" | "json" | "schema" | "business_validation" | "persistence" = "provider";
  const requestedCount = clampRequestedCount(options.count);
  const data = await dependencies.courses.findDetailById(courseId);
  assertCourseData(courseId, data);

  const courseData = data as ExerciseCourseData & {
    subject: Subject;
    latestAnalysis: CourseAnalysis;
  };
  const aiService = await resolveAIService(dependencies);
  const existingExercises = await dependencies.exercises.findAllByCourse(courseData.course.id);

  safeLog(dependencies.logger, "exercise-generation-start", {
    courseId,
    requestedCount,
    courseConceptCount: courseData.concepts.length,
    existingExerciseCount: existingExercises.length,
    model: "unknown",
  });

  let generated: GeneratedExercise[];
  try {
    const output = await generateStructuredExercises(aiService, {
      prompt: buildCourseExercisesPrompt({
        course: courseData.course,
        subject: courseData.subject,
        analysis: courseData.latestAnalysis,
        concepts: courseData.concepts,
        requestedCount,
      }),
      options: { temperature: 0.35, maxOutputTokens: 2200 },
    });
    logProviderDone(dependencies.logger, output.response);
    generated = output.data.exercises;
  } catch (error) {
    if (error instanceof AIJsonParseError || error instanceof AIJsonTruncatedError) {
      stage = "json";
      logProviderDoneFromError(dependencies.logger, error);
      safeLog(dependencies.logger, "exercise-generation-json-invalid", {
        responseTextLength: error.details.responseTextLength ?? null,
        startsWithCodeFence: error.details.startsWithCodeFence ?? null,
        firstNonWhitespaceCharacter: error.details.firstNonWhitespaceCharacter ?? null,
        lastNonWhitespaceCharacter: error.details.lastNonWhitespaceCharacter ?? null,
        looksTruncated: error instanceof AIJsonTruncatedError || error.details.looksTruncated === true,
      });
      const wrapped = invalidOutput({ errorCode: "EXERCISE_GENERATION_JSON_INVALID" }, error);
      safeLog(dependencies.logger, "exercise-generation-failed", {
        courseId,
        stage,
        errorCode: wrapped.diagnostics.errorCode,
        durationMs: Math.round(nowMs() - startedAt),
      });
      throw wrapped;
    }
    if (error instanceof AISchemaValidationError) {
      stage = "schema";
      logProviderDoneFromError(dependencies.logger, error);
      const diagnostics = diagnosticsForZod(error);
      safeLog(dependencies.logger, "exercise-generation-schema-invalid", {
        issueCount: diagnostics.issueCount,
        issues: diagnostics.issues,
      });
      const wrapped = invalidOutput(diagnostics, error);
      safeLog(dependencies.logger, "exercise-generation-failed", {
        courseId,
        stage,
        errorCode: wrapped.diagnostics.errorCode,
        durationMs: Math.round(nowMs() - startedAt),
      });
      throw wrapped;
    }
    safeLog(dependencies.logger, "exercise-generation-failed", {
      courseId,
      stage,
      errorCode: error instanceof Error ? error.name : "UNKNOWN_PROVIDER_ERROR",
      durationMs: Math.round(nowMs() - startedAt),
    });
    throw error;
  }

  let prepared: ReturnType<typeof prepareExercisesForPersistence>;
  try {
    stage = "business_validation";
    prepared = prepareExercisesForPersistence(generated, courseData, existingExercises);
    safeLog(dependencies.logger, "exercise-generation-validation-summary", {
      generatedCount: generated.length,
      acceptedCount: prepared.inputs.length,
      rejectedCount: generated.length - prepared.inputs.length,
      rejectionReasons: prepared.diagnostics.rejectionReasonCounts,
      unknownConceptReferences: prepared.diagnostics.unknownConceptReferences,
      duplicateQuestionCount: prepared.diagnostics.duplicateQuestionCount,
      acceptedTypes: prepared.acceptedTypes,
      rejectedExercises: prepared.diagnostics.rejectedExercises,
    });
  } catch (error) {
    if (error instanceof ExerciseGenerationInvalidOutputError) {
      safeLog(dependencies.logger, "exercise-generation-validation-summary", {
        generatedCount: error.diagnostics.generatedCount ?? generated.length,
        acceptedCount: error.diagnostics.acceptedCount ?? 0,
        rejectedCount: error.diagnostics.rejectedCount ?? generated.length,
        rejectionReasons: error.diagnostics.rejectionReasonCounts ?? {},
        unknownConceptReferences: error.diagnostics.unknownConceptReferences ?? [],
        duplicateQuestionCount: error.diagnostics.duplicateQuestionCount ?? 0,
        acceptedTypes: error.diagnostics.acceptedTypes ?? [],
        rejectedExercises: error.diagnostics.rejectedExercises ?? [],
      });
      safeLog(dependencies.logger, "exercise-generation-failed", {
        courseId,
        stage,
        errorCode: error.diagnostics.errorCode,
        durationMs: Math.round(nowMs() - startedAt),
      });
    }
    throw error;
  }

  stage = "persistence";
  const persistenceStartedAt = nowMs();
  safeLog(dependencies.logger, "exercise-generation-persistence-start", {
    courseId,
    exerciseCount: prepared.inputs.length,
    durationMs: 0,
    rollback: false,
    errorCode: null,
  });
  try {
    const created = await dependencies.exercises.createMany(prepared.inputs);
    safeLog(dependencies.logger, "exercise-generation-persistence-done", {
      courseId,
      exerciseCount: created.length,
      durationMs: Math.round(nowMs() - persistenceStartedAt),
      rollback: false,
      errorCode: null,
    });
    return {
      exercises: created,
      requestedCount,
      acceptedCount: created.length,
      rejectedCount: generated.length - prepared.inputs.length,
      warnings: prepared.warnings,
    };
  } catch (error) {
    const wrapped = new ExerciseGenerationPersistenceFailedError(error);
    safeLog(dependencies.logger, "exercise-generation-persistence-failed", {
      courseId,
      exerciseCount: prepared.inputs.length,
      durationMs: Math.round(nowMs() - persistenceStartedAt),
      rollback: true,
      errorCode: wrapped.code,
    });
    safeLog(dependencies.logger, "exercise-generation-failed", {
      courseId,
      stage,
      errorCode: wrapped.code,
      durationMs: Math.round(nowMs() - startedAt),
    });
    throw wrapped;
  }
}

export function createGenerateCourseExercisesService(dependencies: GenerateCourseExercisesDependencies) {
  return {
    generateCourseExercises: (courseId: string, options: GenerateCourseExercisesOptions = {}) =>
      generateCourseExercises(courseId, options, dependencies),
  };
}
