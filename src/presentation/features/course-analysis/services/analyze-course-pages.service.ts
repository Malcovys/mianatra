import { z } from "zod";
import { AIError } from "@/src/services/ai";
import {
  CoursePageAnalysisError,
  CoursePageAnalysisImageError,
  CoursePageAnalysisInputError,
  CoursePageAnalysisJsonError,
  CoursePageAnalysisJsonTruncatedError,
  CoursePageAnalysisKeyInvalidError,
  CoursePageAnalysisKeyMissingError,
  CoursePageAnalysisModelError,
  CoursePageAnalysisProviderError,
  CoursePageAnalysisQuotaError,
  CoursePageAnalysisSchemaError,
  CoursePageAnalysisTimeoutError,
} from "../errors/course-page-analysis.errors";
import { mergeCoursePageAnalyses } from "../domain/merge-course-page-analyses";
import { analyzeCoursePagesInputSchema, multiPageCourseAnalysisSchema, type AnalyzeCoursePagesInput, type MultiPageCourseAnalysis } from "../schemas/multi-page-course-analysis.schema";
import type { CoursePageAnalysisInput } from "../schemas/course-page-analysis.schema";
import type { AnalyzeSinglePage, PageAnalysisResult } from "../types/multi-page-course-analysis.types";

export type AnalyzeCoursePagesDependencies = {
  analyzeSinglePage: AnalyzeSinglePage;
  onPageDone?: (result: PageAnalysisResult) => void;
  onPageAttempt?: (input: { pageIndex: number; attemptNumber: number; maxAttempts: number; retryReason?: string | null }) => void;
  onPageAttemptDone?: (input: {
    pageIndex: number;
    attemptNumber: number;
    durationMs: number;
    errorCode: string | null;
    httpStatus: number | null;
  }) => void;
};

export class NoCoursePagesProvidedError extends Error {
  readonly code = "NO_COURSE_PAGES_PROVIDED";

  constructor(message = "At least one prepared page is required.") {
    super(message);
    this.name = "NoCoursePagesProvidedError";
  }
}

export class DuplicatePageIndexError extends Error {
  readonly code = "DUPLICATE_PAGE_INDEX";

  constructor(message = "Course page indexes must be unique.") {
    super(message);
    this.name = "DuplicatePageIndexError";
  }
}

export class AllCoursePagesAnalysisFailedError extends Error {
  readonly code = "ALL_COURSE_PAGES_ANALYSIS_FAILED";
  readonly pageCount: number;
  readonly pageErrorCodes: { pageIndex: number; errorCode: string | null }[];

  constructor(pageResults: PageAnalysisResult[]) {
    super("All course pages failed analysis.");
    this.name = "AllCoursePagesAnalysisFailedError";
    this.pageCount = pageResults.length;
    this.pageErrorCodes = pageResults.map((result) => ({ pageIndex: result.pageIndex, errorCode: result.errorCode }));
  }
}

function parseInput(input: AnalyzeCoursePagesInput) {
  const parsed = analyzeCoursePagesInputSchema.safeParse(input);
  if (!parsed.success) {
    if (input.pages?.length === 0) {
      throw new NoCoursePagesProvidedError();
    }
    const duplicateIssue = parsed.error.issues.some((issue) => issue.message.includes("pageIndex"));
    if (duplicateIssue) {
      throw new DuplicatePageIndexError();
    }
    const imageIssue = parsed.error.issues.some((issue) => issue.path.includes("imageBase64") || issue.path.includes("mimeType"));
    if (imageIssue) {
      throw new CoursePageAnalysisImageError("Prepared page image is invalid.", parsed.error);
    }
    throw new CoursePageAnalysisInputError("Multi-page analysis input is invalid.", parsed.error);
  }
  return {
    ...parsed.data,
    courseId: parsed.data.courseId ?? null,
    knownSubject: parsed.data.knownSubject ?? null,
    knownGrade: parsed.data.knownGrade ?? null,
    additionalInstructions: parsed.data.additionalInstructions ?? null,
    pages: [...parsed.data.pages].sort((left, right) => left.pageIndex - right.pageIndex),
  };
}

function errorCode(error: unknown) {
  if (error instanceof CoursePageAnalysisError) {
    return error.code;
  }
  if (error instanceof Error && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "COURSE_PAGE_ANALYSIS_UNKNOWN";
}

function safeErrorMessage(error: unknown) {
  if (error instanceof CoursePageAnalysisError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return "UnknownError";
}

function isTemporary(error: unknown) {
  if (error instanceof CoursePageAnalysisProviderError) {
    const cause = error.cause;
    if (cause instanceof AIError && cause.httpStatus !== null && cause.httpStatus < 500) {
      return false;
    }
    if (cause instanceof AIError && cause.httpStatus !== null && cause.httpStatus >= 500) {
      return true;
    }
  }
  return (
    error instanceof CoursePageAnalysisTimeoutError ||
    error instanceof CoursePageAnalysisProviderError
  );
}

function shouldRetry(error: unknown, attemptsCount: number) {
  if (attemptsCount >= 2) {
    return false;
  }
  if (
    error instanceof CoursePageAnalysisKeyMissingError ||
    error instanceof CoursePageAnalysisKeyInvalidError ||
    error instanceof CoursePageAnalysisQuotaError ||
    error instanceof CoursePageAnalysisModelError ||
    error instanceof CoursePageAnalysisImageError ||
    error instanceof CoursePageAnalysisInputError ||
    error instanceof CoursePageAnalysisJsonError ||
    error instanceof CoursePageAnalysisJsonTruncatedError ||
    error instanceof CoursePageAnalysisSchemaError
  ) {
    return false;
  }
  return isTemporary(error);
}

function nowMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function httpStatus(error: unknown) {
  if (error instanceof CoursePageAnalysisError && error.cause instanceof AIError) {
    return error.cause.httpStatus;
  }
  return error instanceof AIError ? error.httpStatus : null;
}

async function delayRetry() {
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function analyzePage(
  input: CoursePageAnalysisInput,
  pageId: string | null,
  dependencies: AnalyzeCoursePagesDependencies,
): Promise<PageAnalysisResult> {
  let attemptsCount = 0;
  let lastError: unknown = null;
  while (attemptsCount < 2) {
    attemptsCount += 1;
    dependencies.onPageAttempt?.({
      pageIndex: input.pageIndex,
      attemptNumber: attemptsCount,
      maxAttempts: 2,
      retryReason: lastError ? errorCode(lastError) : null,
    });
    const startedAt = nowMs();
    try {
      const analysis = await dependencies.analyzeSinglePage(input);
      dependencies.onPageAttemptDone?.({
        pageIndex: input.pageIndex,
        attemptNumber: attemptsCount,
        durationMs: Math.round(nowMs() - startedAt),
        errorCode: null,
        httpStatus: null,
      });
      return {
        pageId,
        pageIndex: input.pageIndex,
        status: "success",
        analysis,
        errorCode: null,
        errorMessage: null,
        attemptsCount,
      };
    } catch (error) {
      lastError = error;
      dependencies.onPageAttemptDone?.({
        pageIndex: input.pageIndex,
        attemptNumber: attemptsCount,
        durationMs: Math.round(nowMs() - startedAt),
        errorCode: errorCode(error),
        httpStatus: httpStatus(error),
      });
      if (!shouldRetry(error, attemptsCount)) {
        break;
      }
      await delayRetry();
    }
  }
  return {
    pageId,
    pageIndex: input.pageIndex,
    status: "failed",
    analysis: null,
    errorCode: errorCode(lastError),
    errorMessage: safeErrorMessage(lastError),
    attemptsCount,
  };
}

export async function analyzeCoursePages(
  input: AnalyzeCoursePagesInput,
  dependencies: AnalyzeCoursePagesDependencies,
): Promise<MultiPageCourseAnalysis> {
  const parsed = parseInput(input);
  const pageResults: PageAnalysisResult[] = [];

  for (const page of parsed.pages) {
    const pageInput: CoursePageAnalysisInput = {
      courseId: parsed.courseId,
      pageIndex: page.pageIndex,
      imageBase64: page.imageBase64,
      mimeType: page.mimeType,
      knownSubject: parsed.knownSubject,
      knownGrade: parsed.knownGrade,
      additionalInstructions: parsed.additionalInstructions,
    };
    const result = await analyzePage(pageInput, page.pageId ?? null, dependencies);
    pageResults.push(result);
    dependencies.onPageDone?.(result);
  }

  if (pageResults.every((result) => result.status === "failed")) {
    throw new AllCoursePagesAnalysisFailedError(pageResults);
  }

  try {
    return multiPageCourseAnalysisSchema.parse(mergeCoursePageAnalyses(pageResults));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new CoursePageAnalysisSchemaError("Merged course analysis output is invalid.", error);
    }
    throw error;
  }
}

export function createAnalyzeCoursePagesService(dependencies: AnalyzeCoursePagesDependencies) {
  return {
    analyzeCoursePages: (input: AnalyzeCoursePagesInput) => analyzeCoursePages(input, dependencies),
  };
}
