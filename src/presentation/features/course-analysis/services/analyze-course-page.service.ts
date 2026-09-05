import { z } from "zod";
import {
  AIAuthenticationError,
  AIJsonParseError,
  AIJsonTruncatedError,
  AIModelNotFoundError,
  AINetworkError,
  AIProviderUnavailableError,
  AIRequestInvalidError,
  AIRateLimitError,
  AISchemaValidationError,
  AITimeoutError,
  type AIService,
} from "@/src/services/ai";
import { buildCoursePageAnalysisPrompt } from "../prompts/course-page-analysis.prompt";
import {
  coursePageAnalysisInputSchema,
  coursePageAnalysisSchema,
  supportedCoursePageMimeTypes,
  type CoursePageAnalysis,
  type CoursePageAnalysisInput,
} from "../schemas/course-page-analysis.schema";
import {
  CoursePageAnalysisAIUnavailableError,
  CoursePageAnalysisImageError,
  CoursePageAnalysisInputError,
  CoursePageAnalysisJsonError,
  CoursePageAnalysisJsonTruncatedError,
  CoursePageAnalysisKeyInvalidError,
  CoursePageAnalysisKeyMissingError,
  CoursePageAnalysisModelError,
  CoursePageAnalysisProviderError,
  CoursePageAnalysisProviderRequestInvalidError,
  CoursePageAnalysisQuotaError,
  CoursePageAnalysisSchemaError,
  CoursePageAnalysisTimeoutError,
} from "../errors/course-page-analysis.errors";

export type AnalyzeCoursePageDependencies = {
  aiService: AIService | null | (() => Promise<AIService | null>);
};

function isMissingKeyError(error: unknown) {
  return error instanceof Error && error.name === "GeminiApiKeyMissingError";
}

function mapAnalysisError(error: unknown) {
  if (error instanceof z.ZodError) {
    return new CoursePageAnalysisSchemaError("AI output failed course page analysis schema validation.", error);
  }
  if (error instanceof AIJsonParseError) {
    return new CoursePageAnalysisJsonError(undefined, error);
  }
  if (error instanceof AIJsonTruncatedError) {
    return new CoursePageAnalysisJsonTruncatedError(undefined, error);
  }
  if (error instanceof AISchemaValidationError) {
    return new CoursePageAnalysisSchemaError(undefined, error);
  }
  if (error instanceof AITimeoutError) {
    return new CoursePageAnalysisTimeoutError(undefined, error);
  }
  if (error instanceof AIRateLimitError) {
    return new CoursePageAnalysisQuotaError(undefined, error);
  }
  if (error instanceof AIAuthenticationError) {
    return new CoursePageAnalysisKeyInvalidError(undefined, error);
  }
  if (error instanceof AIModelNotFoundError) {
    return new CoursePageAnalysisModelError(undefined, error);
  }
  if (error instanceof AIRequestInvalidError) {
    return new CoursePageAnalysisProviderRequestInvalidError(undefined, error);
  }
  if (isMissingKeyError(error)) {
    return new CoursePageAnalysisKeyMissingError(undefined, error);
  }
  if (error instanceof AINetworkError || error instanceof AIProviderUnavailableError) {
    return new CoursePageAnalysisProviderError(undefined, error);
  }
  return new CoursePageAnalysisProviderError(undefined, error);
}

async function resolveAIService(deps: AnalyzeCoursePageDependencies) {
  const service = typeof deps.aiService === "function" ? await deps.aiService() : deps.aiService;
  if (!service) {
    throw new CoursePageAnalysisAIUnavailableError();
  }
  return service;
}

function parseInput(input: CoursePageAnalysisInput) {
  const parsed = coursePageAnalysisInputSchema.safeParse(input);
  if (!parsed.success) {
    const mimeIssue = parsed.error.issues.some((issue) => issue.path[0] === "mimeType");
    const imageIssue = parsed.error.issues.some((issue) => issue.path[0] === "imageBase64");
    if (mimeIssue || imageIssue) {
      throw new CoursePageAnalysisImageError("Course page image must be non-empty base64 with a supported MIME type.", parsed.error);
    }
    throw new CoursePageAnalysisInputError(undefined, parsed.error);
  }
  if (!supportedCoursePageMimeTypes.includes(parsed.data.mimeType)) {
    throw new CoursePageAnalysisImageError();
  }
  return parsed.data;
}

export async function analyzeCoursePage(
  input: CoursePageAnalysisInput,
  dependencies: AnalyzeCoursePageDependencies,
): Promise<CoursePageAnalysis> {
  const parsed = parseInput(input);
  let aiService: AIService;
  try {
    aiService = await resolveAIService(dependencies);
  } catch (error) {
    throw isMissingKeyError(error) ? new CoursePageAnalysisKeyMissingError(undefined, error) : error;
  }
  const prompt = buildCoursePageAnalysisPrompt(parsed);

  try {
    return await aiService.generateStructuredFromImage(
      {
        prompt,
        imageBase64: parsed.imageBase64,
        mimeType: parsed.mimeType,
        context: null,
        options: {
          temperature: 0.1,
          maxOutputTokens: 1200,
          systemInstruction: "Tu es un assistant pedagogique. Analyse seulement l'image fournie et retourne du JSON strict.",
        },
      },
      coursePageAnalysisSchema,
    );
  } catch (error) {
    throw mapAnalysisError(error);
  }
}

export function createAnalyzeCoursePageService(dependencies: AnalyzeCoursePageDependencies) {
  return {
    analyzeCoursePage: (input: CoursePageAnalysisInput) => analyzeCoursePage(input, dependencies),
  };
}
