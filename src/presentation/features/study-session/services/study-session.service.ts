import type { Course, CreateAttemptInput, Exercise, ExerciseAttempt, StudySession, StudySessionType, SubmitAttemptWithProgressInput } from "@/src/database";
import { classifyMistake, validateExerciseAnswer } from "@/src/presentation/features/exercises";
import { calculateConceptScore, determineConceptStatus } from "@/src/presentation/features/progress";
import {
    CourseNotFoundError,
    ExerciseNotFoundError,
    InvalidAnswerError,
    InvalidSessionStateError,
    SessionAlreadyCompletedError,
    SessionNotFoundError,
} from "@/src/presentation/features/shared";

export type StartSessionInput = {
  courseId: string;
  type: StudySessionType;
  exerciseIds?: string[];
  strategy?: "all_course_exercises" | "provided_exercises";
};

export type SubmitAnswerInput = {
  sessionId: string;
  exerciseId: string;
  answer: unknown;
  usedHint?: boolean;
  responseTimeMs?: number | null;
};

function durationSecondsFrom(startedAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

type StudySessionServiceDeps = {
  attempts: {
    create: (input: CreateAttemptInput) => Promise<ExerciseAttempt>;
    findAllByExercise: (exerciseId: string) => Promise<ExerciseAttempt[]>;
    findAllByConcept: (conceptId: string) => Promise<ExerciseAttempt[]>;
    findAllBySession: (sessionId: string) => Promise<ExerciseAttempt[]>;
    submitWithProgress: (input: SubmitAttemptWithProgressInput) => Promise<{ attempt: ExerciseAttempt }>;
  };
  courses: {
    findById: (id: string) => Promise<Course | null>;
  };
  exercises: {
    findAllByCourse: (courseId: string) => Promise<Exercise[]>;
    findById: (id: string) => Promise<Exercise | null>;
  };
  sessions: {
    findById: (id: string) => Promise<StudySession | null>;
    findActiveByCourse: (courseId: string) => Promise<StudySession | null>;
    create: (input: { courseId: string; type: StudySessionType }) => Promise<StudySession>;
    updateCurrentExerciseIndex: (id: string, index: number) => Promise<StudySession>;
    complete: (id: string, durationSeconds: number) => Promise<StudySession>;
    abandon: (id: string, durationSeconds: number) => Promise<StudySession>;
  };
};

function createStudySessionService(deps: StudySessionServiceDeps) {
  async function getSessionOrThrow(sessionId: string) {
    const session = await deps.sessions.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError();
    }
    return session;
  }

  async function listSessionExercises(courseId: string, providedIds?: string[]) {
    const exercises = await deps.exercises.findAllByCourse(courseId);
    if (providedIds === undefined) {
      return exercises;
    }
    const provided = new Set(providedIds);
    const selected = exercises.filter((exercise) => provided.has(exercise.id));
    if (selected.length !== provided.size) {
      throw new ExerciseNotFoundError();
    }
    return selected;
  }

  return {
    startSession: async (input: StartSessionInput) => {
      const course = await deps.courses.findById(input.courseId);
      if (!course) {
        throw new CourseNotFoundError();
      }
      const activeSession = await deps.sessions.findActiveByCourse(input.courseId);
      if (activeSession) {
        return activeSession;
      }
      if (input.strategy === "provided_exercises" && (!input.exerciseIds || input.exerciseIds.length === 0)) {
        throw new InvalidSessionStateError("A provided exercise strategy requires explicit exercises.");
      }
      await listSessionExercises(input.courseId, input.exerciseIds);
      return deps.sessions.create({ courseId: input.courseId, type: input.type });
    },
    getSession: getSessionOrThrow,
    getActiveSession: (courseId: string) => deps.sessions.findActiveByCourse(courseId),
    resumeSession: async (courseId: string) => {
      const session = await deps.sessions.findActiveByCourse(courseId);
      if (!session) {
        throw new SessionNotFoundError();
      }
      return session;
    },
    submitAnswer: async (input: SubmitAnswerInput) => {
      const session = await getSessionOrThrow(input.sessionId);
      if (session.status === "completed") {
        throw new SessionAlreadyCompletedError();
      }
      if (session.status !== "active") {
        throw new InvalidSessionStateError("Only active sessions can receive answers.");
      }
      const exercise = await deps.exercises.findById(input.exerciseId);
      if (!exercise || exercise.courseId !== session.courseId) {
        throw new ExerciseNotFoundError();
      }
      const sessionAttempts = await deps.attempts.findAllBySession(session.id);
      if (sessionAttempts.some((attempt) => attempt.exerciseId === exercise.id)) {
        throw new InvalidSessionStateError("This exercise already has a finalized attempt.");
      }
      const sessionExercises = await deps.exercises.findAllByCourse(session.courseId);
      const exerciseIndex = sessionExercises.findIndex((sessionExercise) => sessionExercise.id === exercise.id);
      if (exerciseIndex < 0 || exerciseIndex !== session.currentExerciseIndex) {
        throw new InvalidSessionStateError("Submitted exercise does not match the current session exercise.");
      }
      const validation = validateExerciseAnswer(exercise, input.answer);
      if (!validation.normalizedAnswer) {
        throw new InvalidAnswerError();
      }
      const existingAttempts = await deps.attempts.findAllByConcept(exercise.conceptId);
      const attemptsCount = existingAttempts.length + 1;
      const correctCount = existingAttempts.filter((row) => row.isCorrect).length + (validation.isCorrect ? 1 : 0);
      const usedHintCount = existingAttempts.filter((row) => row.usedHint).length + (input.usedHint ? 1 : 0);
      const score = calculateConceptScore({ attemptsCount, correctCount, usedHintCount });
      const result = await deps.attempts.submitWithProgress({
        attempt: {
          sessionId: session.id,
          exerciseId: exercise.id,
          userAnswer: validation.normalizedAnswer,
          isCorrect: validation.isCorrect,
          usedHint: input.usedHint ?? false,
          mistakeType: classifyMistake(validation, input.answer),
          responseTimeMs: input.responseTimeMs ?? null,
        },
        progress: {
          conceptId: exercise.conceptId,
          input: {
            score,
            status: determineConceptStatus(attemptsCount, score),
            attemptsCount,
            correctCount,
          },
        },
        sessionIndex: {
          sessionId: session.id,
          currentExerciseIndex: Math.min(session.currentExerciseIndex + 1, Math.max(sessionExercises.length - 1, 0)),
        },
      });
      return { attempt: result.attempt, validation };
    },
    moveToNextExercise: async (sessionId: string) => {
      const session = await getSessionOrThrow(sessionId);
      if (session.status === "completed") {
        throw new SessionAlreadyCompletedError();
      }
      if (session.status !== "active") {
        throw new InvalidSessionStateError("Only active sessions can move to the next exercise.");
      }
      return deps.sessions.updateCurrentExerciseIndex(sessionId, session.currentExerciseIndex + 1);
    },
    completeSession: async (sessionId: string) => {
      const session = await getSessionOrThrow(sessionId);
      if (session.status === "completed") {
        throw new SessionAlreadyCompletedError();
      }
      return deps.sessions.complete(sessionId, durationSecondsFrom(session.startedAt));
    },
    abandonSession: async (sessionId: string) => {
      const session = await getSessionOrThrow(sessionId);
      if (session.status === "completed") {
        throw new SessionAlreadyCompletedError();
      }
      return deps.sessions.abandon(sessionId, durationSecondsFrom(session.startedAt));
    },
  };
}

async function getDeps(): Promise<StudySessionServiceDeps> {
  const repositories = await import("@/src/database");
  return {
    attempts: repositories.attemptsRepository,
    courses: repositories.coursesRepository,
    exercises: repositories.exercisesRepository,
    sessions: repositories.studySessionsRepository,
  };
}

export async function startSession(input: StartSessionInput) {
  return createStudySessionService(await getDeps()).startSession(input);
}

export async function getSession(sessionId: string) {
  return createStudySessionService(await getDeps()).getSession(sessionId);
}

export async function getActiveSession(courseId: string) {
  return createStudySessionService(await getDeps()).getActiveSession(courseId);
}

export async function resumeSession(courseId: string) {
  return createStudySessionService(await getDeps()).resumeSession(courseId);
}

export async function submitAnswer(input: SubmitAnswerInput) {
  return createStudySessionService(await getDeps()).submitAnswer(input);
}

export async function moveToNextExercise(sessionId: string) {
  return createStudySessionService(await getDeps()).moveToNextExercise(sessionId);
}

export async function completeSession(sessionId: string) {
  return createStudySessionService(await getDeps()).completeSession(sessionId);
}

export async function abandonSession(sessionId: string) {
  return createStudySessionService(await getDeps()).abandonSession(sessionId);
}

const studySessionService = {
  abandonSession,
  completeSession,
  getActiveSession,
  getSession,
  moveToNextExercise,
  resumeSession,
  startSession,
  submitAnswer,
};
