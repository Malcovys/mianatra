import type { ExerciseAttempt } from "@/src/database";
import { ExerciseNotFoundError } from "@/src/presentation/features/shared";
import { calculateConceptScore, calculateCourseProgress as calculateCourseProgressValue, determineConceptStatus } from "../domain";

export async function getConceptProgress(conceptId: string) {
  const { progressRepository } = await import("@/src/database");
  return progressRepository.findByConcept(conceptId);
}

export async function listCourseProgress(courseId: string) {
  const { progressRepository } = await import("@/src/database");
  return progressRepository.findAllByCourse(courseId);
}

export async function updateAfterAttempt(attempt: ExerciseAttempt) {
  const { attemptsRepository, exercisesRepository, progressRepository } = await import("@/src/database");
  const exercise = await exercisesRepository.findById(attempt.exerciseId);
  if (!exercise) throw new ExerciseNotFoundError();

  const conceptAttempts = await attemptsRepository.findAllByConcept(exercise.conceptId);
  const attemptsCount = conceptAttempts.length;
  const correctCount = conceptAttempts.filter((row) => row.isCorrect).length;
  const usedHintCount = conceptAttempts.filter((row) => row.usedHint).length;
  const score = calculateConceptScore({ attemptsCount, correctCount, usedHintCount });
  return progressRepository.upsert(exercise.conceptId, {
    score,
    status: determineConceptStatus(attemptsCount, score),
    attemptsCount,
    correctCount,
    lastPracticedAt: attempt.createdAt,
  });
}

export async function calculateCourseProgress(courseId: string) {
  const { conceptsRepository, progressRepository } = await import("@/src/database");
  const [concepts, progressRows] = await Promise.all([
    conceptsRepository.findAllByCourse(courseId),
    progressRepository.findAllByCourse(courseId),
  ]);
  return calculateCourseProgressValue(
    concepts.map((concept) => ({
      ...concept,
      progress: progressRows.find((row) => row.conceptId === concept.id) ?? null,
    })),
  );
}

export async function getWeakConcepts(courseId: string) {
  const { conceptsRepository, progressRepository } = await import("@/src/database");
  const [concepts, progressRows] = await Promise.all([
    conceptsRepository.findAllByCourse(courseId),
    progressRepository.findAllByCourse(courseId),
  ]);
  return concepts.filter((concept) => progressRows.find((row) => row.conceptId === concept.id)?.status === "needs_reinforcement");
}

export async function getStrongConcepts(courseId: string) {
  const { conceptsRepository, progressRepository } = await import("@/src/database");
  const [concepts, progressRows] = await Promise.all([
    conceptsRepository.findAllByCourse(courseId),
    progressRepository.findAllByCourse(courseId),
  ]);
  return concepts.filter((concept) => progressRows.find((row) => row.conceptId === concept.id)?.status === "mastered");
}
