export type SessionAnswerExercise = {
  type: string;
  options?: string[];
};

export type AnswerControlKind = "multiple_choice" | "true_false" | "short_answer" | "numeric" | "unsupported";

export function getAnswerControlKind(type: string): AnswerControlKind {
  if (type === "multiple_choice" || type === "multiple-choice") {
    return "multiple_choice";
  }
  if (type === "true_false" || type === "true-false") {
    return "true_false";
  }
  if (type === "short_answer" || type === "short-answer") {
    return "short_answer";
  }
  if (type === "numeric") {
    return "numeric";
  }
  return "unsupported";
}

export function isNumericAnswerUsable(answer: string) {
  const normalized = answer.trim().replace(",", ".");
  return normalized.length > 0 && Number.isFinite(Number(normalized));
}

export function canSubmitExerciseAnswer(exercise: SessionAnswerExercise, answer: string, isSubmitting = false) {
  if (isSubmitting) {
    return false;
  }

  const kind = getAnswerControlKind(exercise.type);
  if (kind === "multiple_choice" || kind === "true_false" || kind === "short_answer") {
    return answer.trim().length > 0;
  }
  if (kind === "numeric") {
    return isNumericAnswerUsable(answer);
  }
  return false;
}
