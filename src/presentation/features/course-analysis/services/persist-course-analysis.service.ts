import type { Course, CourseAnalysis, Concept, Subject } from "@/src/db";
import { multiPageCourseAnalysisSchema, type MultiPageCourseAnalysis } from "../schemas/multi-page-course-analysis.schema";
import {
  PersistCourseAnalysisConceptsReferencedError,
  PersistCourseAnalysisCourseNotFoundError,
  PersistCourseAnalysisFailedError,
  PersistCourseAnalysisInvalidError,
  PersistCourseAnalysisNoConceptsError,
  PersistCourseAnalysisSubjectNotFoundError,
} from "../errors/persist-course-analysis.errors";

export type PersistCourseAnalysisConceptInput = {
  name: string;
  description?: string | null;
};

export type PersistCourseAnalysisInput = {
  courseId: string;
  analysis: MultiPageCourseAnalysis;
  title?: string | null;
  subjectId?: string | null;
  grade?: string | null;
  concepts?: PersistCourseAnalysisConceptInput[] | null;
};

export type PersistedCourseAnalysis = {
  course: Course;
  analysis: CourseAnalysis;
  concepts: Concept[];
  successfulPageCount: number;
  failedPageCount: number;
  warnings: string[];
  inconsistencies: MultiPageCourseAnalysis["inconsistencies"];
};

type PersistCourseAnalysisRepositoryInput = {
  courseId: string;
  subjectId: string;
  title: string;
  grade: string;
  summary: string | null;
  analysis: MultiPageCourseAnalysis;
  concepts: PersistCourseAnalysisConceptInput[];
  validatedByUser: boolean;
};

type PersistCourseAnalysisDeps = {
  courses: {
    findById: (courseId: string) => Promise<Course | null>;
  };
  subjects: {
    findById: (subjectId: string) => Promise<Subject | null>;
  };
  analyses: {
    persistForCourse: (input: PersistCourseAnalysisRepositoryInput) => Promise<{
      course: Course;
      analysis: CourseAnalysis;
      concepts: Concept[];
    }>;
  };
};

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value: string | null | undefined) {
  const cleaned = value ? cleanText(value) : "";
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeConcepts(concepts: PersistCourseAnalysisConceptInput[]) {
  const seen = new Set<string>();
  const output: PersistCourseAnalysisConceptInput[] = [];
  for (const concept of concepts) {
    const name = cleanText(concept.name);
    if (!name) {
      continue;
    }
    const key = name.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push({
        name,
        description: normalizeOptionalText(concept.description),
      });
    }
  }
  return output;
}

function hasExplicitCorrections(input: PersistCourseAnalysisInput) {
  return (
    normalizeOptionalText(input.title) !== null ||
    normalizeOptionalText(input.subjectId) !== null ||
    normalizeOptionalText(input.grade) !== null ||
    input.concepts !== undefined && input.concepts !== null
  );
}

function mapPersistenceError(error: unknown) {
  if (!(error instanceof Error)) {
    return new PersistCourseAnalysisFailedError(undefined, error);
  }
  if (error.message === "COURSE_NOT_FOUND") {
    return new PersistCourseAnalysisCourseNotFoundError(undefined, error);
  }
  if (error.message === "SUBJECT_NOT_FOUND") {
    return new PersistCourseAnalysisSubjectNotFoundError(undefined, error);
  }
  if (error.message === "COURSE_CONCEPTS_REFERENCED") {
    return new PersistCourseAnalysisConceptsReferencedError(undefined, error);
  }
  return new PersistCourseAnalysisFailedError(undefined, error);
}

export async function persistCourseAnalysis(
  input: PersistCourseAnalysisInput,
  dependencies: PersistCourseAnalysisDeps,
): Promise<PersistedCourseAnalysis> {
  const courseId = normalizeOptionalText(input.courseId);
  if (!courseId) {
    throw new PersistCourseAnalysisInvalidError("courseId must not be empty.");
  }
  const analysisResult = multiPageCourseAnalysisSchema.safeParse(input.analysis);
  if (!analysisResult.success) {
    throw new PersistCourseAnalysisInvalidError("Multi-page analysis is invalid.", analysisResult.error);
  }
  const analysis = analysisResult.data;
  const course = await dependencies.courses.findById(courseId);
  if (!course) {
    throw new PersistCourseAnalysisCourseNotFoundError();
  }
  const title = normalizeOptionalText(input.title) ?? analysis.detectedTitle;
  const subjectId = normalizeOptionalText(input.subjectId) ?? course.subjectId;
  const grade = normalizeOptionalText(input.grade) ?? analysis.detectedLevel ?? course.grade;
  if (!title || !grade) {
    throw new PersistCourseAnalysisInvalidError("Title and grade must not be empty.");
  }
  const subject = await dependencies.subjects.findById(subjectId);
  if (!subject) {
    throw new PersistCourseAnalysisSubjectNotFoundError();
  }
  const finalConcepts = normalizeConcepts(input.concepts ?? analysis.concepts);
  if (finalConcepts.length === 0) {
    throw new PersistCourseAnalysisNoConceptsError();
  }

  try {
    const persisted = await dependencies.analyses.persistForCourse({
      courseId,
      subjectId,
      title,
      grade,
      summary: normalizeOptionalText(analysis.summary),
      analysis,
      concepts: finalConcepts,
      validatedByUser: hasExplicitCorrections(input),
    });
    return {
      ...persisted,
      successfulPageCount: analysis.successfulPageCount,
      failedPageCount: analysis.failedPageCount,
      warnings: analysis.warnings,
      inconsistencies: analysis.inconsistencies,
    };
  } catch (error) {
    if (error instanceof PersistCourseAnalysisCourseNotFoundError || error instanceof PersistCourseAnalysisSubjectNotFoundError) {
      throw error;
    }
    throw mapPersistenceError(error);
  }
}

export function createPersistCourseAnalysisService(dependencies: PersistCourseAnalysisDeps) {
  return {
    persistCourseAnalysis: (input: PersistCourseAnalysisInput) => persistCourseAnalysis(input, dependencies),
  };
}
