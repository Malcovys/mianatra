import type { ConceptProgressStatus } from "@/src/db";

export function determineConceptStatus(attemptsCount: number, score: number): ConceptProgressStatus {
  if (attemptsCount === 0) {
    return "not_started";
  }
  if (attemptsCount === 1) {
    return "to_discover";
  }
  if (score < 50) {
    return "needs_reinforcement";
  }
  if (score >= 85) {
    return "mastered";
  }
  return "in_progress";
}
