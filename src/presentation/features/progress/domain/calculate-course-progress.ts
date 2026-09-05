import type { ConceptProgress } from "@/src/db";
import { buildCourseProgressSummary, type ProgressConceptInput } from "./course-progress-summary";

export function calculateCourseProgress(concepts: readonly ProgressConceptInput[] | readonly Pick<ConceptProgress, "score">[]) {
  if (concepts.length === 0) {
    return 0;
  }
  if ("progress" in concepts[0] || "name" in concepts[0]) {
    return buildCourseProgressSummary(concepts as readonly ProgressConceptInput[]).progress;
  }
  const total = (concepts as readonly Pick<ConceptProgress, "score">[]).reduce((sum, row) => {
    const score = Number.isFinite(row.score) ? row.score : 0;
    return sum + Math.max(0, Math.min(100, score));
  }, 0);
  return Math.round(total / concepts.length);
}
