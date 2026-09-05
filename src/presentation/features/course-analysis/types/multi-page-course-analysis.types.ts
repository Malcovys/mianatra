import type { CoursePageAnalysis, CoursePageAnalysisInput } from "../schemas/course-page-analysis.schema";

export type AnalyzeSinglePage = (input: CoursePageAnalysisInput) => Promise<CoursePageAnalysis>;

export type PageAnalysisStatus = "success" | "failed";

export type PageAnalysisResult = {
  pageId: string | null;
  pageIndex: number;
  status: PageAnalysisStatus;
  analysis: CoursePageAnalysis | null;
  errorCode: string | null;
  errorMessage: string | null;
  attemptsCount: number;
};

export type AnalysisInconsistency = {
  field: "title" | "subject" | "level";
  values: {
    value: string;
    pageIndexes: number[];
  }[];
  selectedValue: string | null;
};
