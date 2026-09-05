import type { CoursePageAnalysis } from "../schemas/course-page-analysis.schema";
import type { AnalysisInconsistency, PageAnalysisResult } from "../types/multi-page-course-analysis.types";
import { normalizeAnalysisText } from "./analysis-text";

type FieldName = AnalysisInconsistency["field"];

function collectValues(pageResults: PageAnalysisResult[], field: FieldName) {
  const values = new Map<string, { value: string; pageIndexes: number[] }>();
  for (const result of pageResults) {
    if (result.status !== "success" || !result.analysis) {
      continue;
    }
    const value = readField(result.analysis, field);
    if (!value) {
      continue;
    }
    const key = normalizeAnalysisText(value);
    const existing = values.get(key);
    if (existing) {
      existing.pageIndexes.push(result.pageIndex);
    } else {
      values.set(key, { value, pageIndexes: [result.pageIndex] });
    }
  }
  return [...values.values()].map((entry) => ({
    value: entry.value,
    pageIndexes: [...new Set(entry.pageIndexes)].sort((left, right) => left - right),
  }));
}

function readField(analysis: CoursePageAnalysis, field: FieldName) {
  if (field === "title") {
    return analysis.detectedTitle.trim();
  }
  if (field === "subject") {
    return analysis.detectedSubject.trim();
  }
  return analysis.detectedLevel?.trim() || null;
}

export function detectAnalysisInconsistencies(
  pageResults: PageAnalysisResult[],
  selected: { title: string; subject: string; level: string | null },
): AnalysisInconsistency[] {
  const fields: { field: FieldName; selectedValue: string | null }[] = [
    { field: "title", selectedValue: selected.title },
    { field: "subject", selectedValue: selected.subject },
    { field: "level", selectedValue: selected.level },
  ];

  return fields.flatMap(({ field, selectedValue }) => {
    const values = collectValues(pageResults, field);
    return values.length >= 2 ? [{ field, values, selectedValue }] : [];
  });
}
