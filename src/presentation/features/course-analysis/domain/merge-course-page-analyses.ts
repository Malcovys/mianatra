import type { CoursePageAnalysis } from "../schemas/course-page-analysis.schema";
import { multiPageCourseAnalysisSchema, type MultiPageCourseAnalysis } from "../schemas/multi-page-course-analysis.schema";
import type { PageAnalysisResult } from "../types/multi-page-course-analysis.types";
import { normalizeAnalysisText } from "./analysis-text";
import { detectAnalysisInconsistencies } from "./detect-analysis-inconsistencies";

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function preferLongest(current: string | null, candidate: string | null) {
  const cleanCandidate = candidate ? cleanText(candidate) : null;
  if (!cleanCandidate) {
    return current;
  }
  if (!current || cleanCandidate.length > current.length) {
    return cleanCandidate;
  }
  return current;
}

function chooseFrequentValue(
  successfulResults: (PageAnalysisResult & { analysis: CoursePageAnalysis })[],
  read: (analysis: CoursePageAnalysis) => string | null,
) {
  const entries = new Map<string, { value: string; count: number; firstPageIndex: number }>();
  for (const result of successfulResults) {
    const value = read(result.analysis);
    const cleaned = value ? cleanText(value) : "";
    if (!cleaned) {
      continue;
    }
    const key = normalizeAnalysisText(cleaned);
    const existing = entries.get(key);
    if (existing) {
      existing.count += 1;
      existing.value = preferLongest(existing.value, cleaned) ?? existing.value;
    } else {
      entries.set(key, { value: cleaned, count: 1, firstPageIndex: result.pageIndex });
    }
  }
  return [...entries.values()].sort((left, right) => right.count - left.count || left.firstPageIndex - right.firstPageIndex)[0]?.value ?? null;
}

function mergeList(successfulResults: (PageAnalysisResult & { analysis: CoursePageAnalysis })[], read: (analysis: CoursePageAnalysis) => string[]) {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const result of successfulResults) {
    for (const value of read(result.analysis)) {
      const cleaned = cleanText(value);
      if (!cleaned) {
        continue;
      }
      const key = normalizeAnalysisText(cleaned);
      if (!seen.has(key)) {
        seen.add(key);
        values.push(cleaned);
      }
    }
  }
  return values;
}

function mergeConcepts(successfulResults: (PageAnalysisResult & { analysis: CoursePageAnalysis })[]) {
  const concepts = new Map<string, { name: string; description: string | null; sourcePageIndexes: number[] }>();
  for (const result of successfulResults) {
    for (const concept of result.analysis.concepts) {
      const name = cleanText(concept.name);
      if (!name) {
        continue;
      }
      const key = normalizeAnalysisText(name);
      const existing = concepts.get(key);
      if (existing) {
        existing.description = preferLongest(existing.description, concept.description);
        existing.sourcePageIndexes = [...new Set([...existing.sourcePageIndexes, result.pageIndex])].sort((left, right) => left - right);
      } else {
        concepts.set(key, {
          name,
          description: concept.description ? cleanText(concept.description) : null,
          sourcePageIndexes: [result.pageIndex],
        });
      }
    }
  }
  return [...concepts.values()];
}

function mergeSummary(successfulResults: (PageAnalysisResult & { analysis: CoursePageAnalysis })[]) {
  const seen = new Set<string>();
  const sentences: string[] = [];
  for (const result of successfulResults) {
    const parts = result.analysis.partialSummary
      .split(/(?<=[.!?])\s+/)
      .map(cleanText)
      .filter(Boolean);
    for (const sentence of parts) {
      const key = normalizeAnalysisText(sentence);
      if (!seen.has(key)) {
        seen.add(key);
        sentences.push(sentence);
      }
    }
  }
  return sentences.join(" ");
}

function mergeConfidence(successfulResults: (PageAnalysisResult & { analysis: CoursePageAnalysis })[]) {
  const values = successfulResults.map((result) => result.analysis.confidence).filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.min(1, Math.max(0, Number(average.toFixed(4))));
}

function buildWarnings(pageResults: PageAnalysisResult[], inconsistencies: ReturnType<typeof detectAnalysisInconsistencies>) {
  const warnings: string[] = [];
  for (const result of pageResults) {
    if (result.status === "success" && result.analysis) {
      for (const warning of result.analysis.warnings) {
        const cleaned = cleanText(warning);
        if (cleaned) {
          warnings.push(`Page ${result.pageIndex}: ${cleaned}`);
        }
      }
    }
    if (result.status === "failed") {
      warnings.push(`Page ${result.pageIndex}: analyse echouee (${result.errorCode ?? "UNKNOWN"}).`);
    }
  }
  for (const inconsistency of inconsistencies) {
    warnings.push(`Incoherence ${inconsistency.field}: plusieurs valeurs detectees.`);
  }
  return mergeRawStrings(warnings);
}

function mergeRawStrings(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const cleaned = cleanText(value);
    const key = normalizeAnalysisText(cleaned);
    if (cleaned && !seen.has(key)) {
      seen.add(key);
      output.push(cleaned);
    }
  }
  return output;
}

export function mergeCoursePageAnalyses(pageResults: PageAnalysisResult[]): MultiPageCourseAnalysis {
  const successfulResults = pageResults.filter(
    (result): result is PageAnalysisResult & { analysis: CoursePageAnalysis } => result.status === "success" && result.analysis !== null,
  );
  const title = chooseFrequentValue(successfulResults, (analysis) => analysis.detectedTitle) ?? "Cours analyse";
  const subject = chooseFrequentValue(successfulResults, (analysis) => analysis.detectedSubject) ?? "Matiere inconnue";
  const level = chooseFrequentValue(successfulResults, (analysis) => analysis.detectedLevel);
  const inconsistencies = detectAnalysisInconsistencies(pageResults, { title, subject, level });
  const output = {
    detectedTitle: title,
    detectedSubject: subject,
    detectedLevel: level,
    concepts: mergeConcepts(successfulResults),
    definitions: mergeList(successfulResults, (analysis) => analysis.definitions),
    formulas: mergeList(successfulResults, (analysis) => analysis.formulas),
    examples: mergeList(successfulResults, (analysis) => analysis.examples),
    dates: mergeList(successfulResults, (analysis) => analysis.dates),
    keywords: mergeList(successfulResults, (analysis) => analysis.keywords),
    summary: mergeSummary(successfulResults),
    warnings: buildWarnings(pageResults, inconsistencies),
    confidence: mergeConfidence(successfulResults),
    successfulPageCount: successfulResults.length,
    failedPageCount: pageResults.length - successfulResults.length,
    pageResults,
    inconsistencies,
  };
  return multiPageCourseAnalysisSchema.parse(output);
}
