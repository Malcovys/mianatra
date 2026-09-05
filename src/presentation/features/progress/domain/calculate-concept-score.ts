export type ConceptScoreInput = {
  attemptsCount: number;
  correctCount: number;
  usedHintCount?: number;
};

export function calculateConceptScore(input: ConceptScoreInput) {
  if (input.attemptsCount <= 0) {
    return 0;
  }
  const accuracy = input.correctCount / input.attemptsCount;
  const hintPenalty = Math.min(input.usedHintCount ?? 0, input.attemptsCount) * 3;
  return Math.max(0, Math.min(100, Math.round(accuracy * 100 - hintPenalty)));
}
