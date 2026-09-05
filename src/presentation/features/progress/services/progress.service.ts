import type { Concept, ConceptProgress, Exercise, ExerciseAttempt, UpsertConceptProgressInput } from "@/src/database";
import { ExerciseNotFoundError } from "@/src/presentation/features/shared";
import { calculateConceptScore, calculateCourseProgress as calculateCourseProgressValue, determineConceptStatus } from "../domain";

type ProgressServiceDeps = {
  attempts: {
    findAllByExercise: (exerciseId: string) => Promise<ExerciseAttempt[]>;
    findAllByConcept: (conceptId: string) => Promise<ExerciseAttempt[]>;
  };
  concepts: {
    findAllByCourse: (courseId: string) => Promise<Concept[]>;
  };
  exercises: {
    findById: (id: string) => Promise<Exercise | null>;
  };
  progress: {
    findByConcept: (conceptId: string) => Promise<ConceptProgress | null>;
    findAllByCourse: (courseId: string) => Promise<ConceptProgress[]>;
    upsert: (conceptId: string, input: UpsertConceptProgressInput) => Promise<ConceptProgress>;
  };
};

export function createProgressService(deps: ProgressServiceDeps) {
  return {
    getConceptProgress: (conceptId: string) => deps.progress.findByConcept(conceptId),
    listCourseProgress: (courseId: string) => deps.progress.findAllByCourse(courseId),
    updateAfterAttempt: async (attempt: ExerciseAttempt) => {
      const exercise = await deps.exercises.findById(attempt.exerciseId);
      if (!exercise) {
        throw new ExerciseNotFoundError();
      }
      const conceptAttempts = await deps.attempts.findAllByConcept(exercise.conceptId);
      const attemptsCount = conceptAttempts.length;
      const correctCount = conceptAttempts.filter((row) => row.isCorrect).length;
      const usedHintCount = conceptAttempts.filter((row) => row.usedHint).length;
      const score = calculateConceptScore({ attemptsCount, correctCount, usedHintCount });
      return deps.progress.upsert(exercise.conceptId, {
        score,
        status: determineConceptStatus(attemptsCount, score),
        attemptsCount,
        correctCount,
        lastPracticedAt: attempt.createdAt,
      });
    },
    calculateCourseProgress: async (courseId: string) => {
      const concepts = await deps.concepts.findAllByCourse(courseId);
      const progressRows = await deps.progress.findAllByCourse(courseId);
      return calculateCourseProgressValue(
        concepts.map((concept) => ({
          ...concept,
          progress: progressRows.find((row) => row.conceptId === concept.id) ?? null,
        })),
      );
    },
    getWeakConcepts: async (courseId: string) => {
      const concepts = await deps.concepts.findAllByCourse(courseId);
      const progressRows = await deps.progress.findAllByCourse(courseId);
      return concepts.filter((concept) => {
        const progress = progressRows.find((row) => row.conceptId === concept.id);
        return progress?.status === "needs_reinforcement";
      });
    },
    getStrongConcepts: async (courseId: string) => {
      const concepts = await deps.concepts.findAllByCourse(courseId);
      const progressRows = await deps.progress.findAllByCourse(courseId);
      return concepts.filter((concept) => {
        const progress = progressRows.find((row) => row.conceptId === concept.id);
        return progress?.status === "mastered";
      });
    },
  };
}

async function getDeps(): Promise<ProgressServiceDeps> {
  const repositories = await import("@/src/database");
  return {
    attempts: repositories.attemptsRepository,
    concepts: repositories.conceptsRepository,
    exercises: repositories.exercisesRepository,
    progress: repositories.progressRepository,
  };
}

export async function getConceptProgress(conceptId: string) {
  return createProgressService(await getDeps()).getConceptProgress(conceptId);
}

export async function listCourseProgress(courseId: string) {
  return createProgressService(await getDeps()).listCourseProgress(courseId);
}

export async function updateAfterAttempt(attempt: ExerciseAttempt) {
  return createProgressService(await getDeps()).updateAfterAttempt(attempt);
}

export async function calculateCourseProgress(courseId: string) {
  return createProgressService(await getDeps()).calculateCourseProgress(courseId);
}

export async function getWeakConcepts(courseId: string) {
  return createProgressService(await getDeps()).getWeakConcepts(courseId);
}

export async function getStrongConcepts(courseId: string) {
  return createProgressService(await getDeps()).getStrongConcepts(courseId);
}

export const progressService = { calculateCourseProgress, getConceptProgress, getStrongConcepts, getWeakConcepts, listCourseProgress, updateAfterAttempt };
