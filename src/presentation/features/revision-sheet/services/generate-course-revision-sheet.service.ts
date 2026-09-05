import type { Concept, Course, CourseAnalysis, RevisionSheet, Subject } from "@/src/db";
import type { AIService } from "@/src/services/ai/ai.service";
import { AISchemaValidationError } from "@/src/services/ai/ai.errors";
import { buildRevisionSheetPrompt } from "../prompts/revision-sheet.prompt";
import { generatedRevisionSheetSchema, type GeneratedRevisionSheet } from "../schemas/generated-revision-sheet.schema";
import {
  RevisionSheetAINotConfiguredError,
  RevisionSheetAnalysisNotFoundError,
  RevisionSheetConceptsNotFoundError,
  RevisionSheetCourseNotFoundError,
  RevisionSheetCourseNotReadyError,
  RevisionSheetInvalidOutputError,
  RevisionSheetPersistenceFailedError,
} from "../errors/revision-sheet-generation.errors";

export type RevisionSheetCourseData = {
  course: Course;
  subject: Subject | null;
  concepts: Concept[];
  latestAnalysis: CourseAnalysis | null;
};

type AITextGenerator = Pick<AIService, "generateStructured">;

export type GenerateCourseRevisionSheetDependencies = {
  aiService: AITextGenerator | null | (() => Promise<AITextGenerator | null>);
  courses: {
    findDetailById: (courseId: string) => Promise<RevisionSheetCourseData | null>;
  };
  revisionSheets: {
    createVersion: (input: {
      courseId: string;
      title: string;
      summary: string;
      contentJson: string;
    }) => Promise<RevisionSheet>;
  };
};

export type GenerateCourseRevisionSheetResult = {
  sheet: RevisionSheet;
  version: number;
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeKey(value: string) {
  return normalizeText(value)
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function resolveAIService(dependencies: GenerateCourseRevisionSheetDependencies) {
  const service = typeof dependencies.aiService === "function" ? await dependencies.aiService() : dependencies.aiService;
  if (!service) {
    throw new RevisionSheetAINotConfiguredError();
  }
  return service;
}

function assertCourseData(courseId: string, data: RevisionSheetCourseData | null) {
  if (!courseId.trim() || !data) {
    throw new RevisionSheetCourseNotFoundError();
  }
  if (data.course.status !== "ready" || !data.subject || !data.course.grade.trim() || !data.course.summary?.trim()) {
    throw new RevisionSheetCourseNotReadyError();
  }
  if (!data.latestAnalysis) {
    throw new RevisionSheetAnalysisNotFoundError();
  }
  if (data.concepts.length === 0) {
    throw new RevisionSheetConceptsNotFoundError();
  }
}

function assertConceptCoherence(sheet: GeneratedRevisionSheet, concepts: Concept[]) {
  const conceptNames = new Set(concepts.map((concept) => normalizeKey(concept.name)));
  const unknownConcepts = sheet.keyConcepts.filter((concept) => !conceptNames.has(normalizeKey(concept)));
  if (unknownConcepts.length > 0) {
    throw new RevisionSheetInvalidOutputError();
  }
}

export async function generateCourseRevisionSheet(
  courseId: string,
  dependencies: GenerateCourseRevisionSheetDependencies,
): Promise<GenerateCourseRevisionSheetResult> {
  const data = await dependencies.courses.findDetailById(courseId);
  assertCourseData(courseId, data);

  const courseData = data as RevisionSheetCourseData & {
    subject: Subject;
    latestAnalysis: CourseAnalysis;
  };
  const aiService = await resolveAIService(dependencies);

  let generated: GeneratedRevisionSheet;
  try {
    generated = await aiService.generateStructured(
      {
        prompt: buildRevisionSheetPrompt({
          course: courseData.course,
          subject: courseData.subject,
          analysis: courseData.latestAnalysis,
          concepts: courseData.concepts,
        }),
        options: { temperature: 0.2, maxOutputTokens: 1400 },
      },
      generatedRevisionSheetSchema,
    );
    assertConceptCoherence(generated, courseData.concepts);
  } catch (error) {
    if (error instanceof RevisionSheetInvalidOutputError) {
      throw error;
    }
    if (error instanceof AISchemaValidationError) {
      throw new RevisionSheetInvalidOutputError(error);
    }
    throw error;
  }

  try {
    const sheet = await dependencies.revisionSheets.createVersion({
      courseId: courseData.course.id,
      title: generated.title,
      summary: generated.summary,
      contentJson: JSON.stringify(generated),
    });
    return { sheet, version: sheet.version };
  } catch (error) {
    throw new RevisionSheetPersistenceFailedError(error);
  }
}

export function createGenerateCourseRevisionSheetService(dependencies: GenerateCourseRevisionSheetDependencies) {
  return {
    generateCourseRevisionSheet: (courseId: string) => generateCourseRevisionSheet(courseId, dependencies),
  };
}
