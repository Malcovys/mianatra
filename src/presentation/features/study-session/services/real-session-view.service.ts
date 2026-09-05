import type { Concept, ExerciseAttempt, SessionReport, StudySession } from "@/src/database";
import { buildSessionReport } from "@/src/presentation/features/reports";
import { SessionNotFoundError } from "@/src/presentation/features/shared";
import { toSessionExercise, type RealSessionExercise } from "../utils/real-session-exercise";
import { completeSession, startSession, submitAnswer } from "./study-session.service";

export type RealSessionView =
  | { status: "missing" }
  | { status: "empty"; session: StudySession }
  | { status: "completed"; session: StudySession; exercises: RealSessionExercise[]; attempts: ExerciseAttempt[] }
  | {
      status: "ready";
      session: StudySession;
      exercises: RealSessionExercise[];
      attempts: ExerciseAttempt[];
      currentExercise: RealSessionExercise;
      currentIndex: number;
    };

export type RealCorrectionView =
  | { status: "missing" }
  | {
      status: "ready";
      session: StudySession;
      attempt: ExerciseAttempt;
      exercise: RealSessionExercise;
      isLastExercise: boolean;
    };

export type RealReportView =
  | { status: "missing" }
  | {
      status: "ready";
      session: StudySession;
      report: SessionReport;
      durationSeconds: number;
      strongConceptName: string;
      weakConceptName: string;
    };

export async function startRealCourseSession(courseId: string) {
  const { exercisesRepository } = await import("@/src/database");
  const exercises = await exercisesRepository.findAllByCourse(courseId);
  if (exercises.length === 0) {
    return null;
  }
  return startSession({
    courseId,
    type: "initial",
    exerciseIds: exercises.map((exercise) => exercise.id),
    strategy: "provided_exercises",
  });
}

export async function countRealCourseExercises(courseId: string) {
  const { exercisesRepository } = await import("@/src/database");
  return (await exercisesRepository.findAllByCourse(courseId)).length;
}

export async function loadRealSessionView(sessionId: string): Promise<RealSessionView> {
  const { attemptsRepository, conceptsRepository, exercisesRepository, studySessionsRepository } = await import("@/src/database");
  const session = await studySessionsRepository.findById(sessionId);
  if (!session) {
    return { status: "missing" };
  }

  const exercises = await exercisesRepository.findAllByCourse(session.courseId);
  if (exercises.length === 0) {
    return { status: "empty", session };
  }

  const conceptIds = [...new Set(exercises.map((exercise) => exercise.conceptId))];
  const conceptPairs = await Promise.all(
    conceptIds.map(async (conceptId) => [conceptId, (await conceptsRepository.findById(conceptId))?.name ?? "Notion"] as const),
  );
  const conceptNames = new Map(conceptPairs);
  const mappedExercises = exercises.map((exercise) => toSessionExercise(exercise, conceptNames.get(exercise.conceptId) ?? "Notion"));
  const attempts = await attemptsRepository.findAllBySession(session.id);
  const attemptedExerciseIds = new Set(attempts.map((attempt) => attempt.exerciseId));

  if (session.status === "completed") {
    return { status: "completed", session, exercises: mappedExercises, attempts };
  }

  let currentIndex = Math.min(session.currentExerciseIndex, mappedExercises.length - 1);
  while (currentIndex < mappedExercises.length && attemptedExerciseIds.has(mappedExercises[currentIndex].id)) {
    currentIndex += 1;
  }

  if (currentIndex >= mappedExercises.length) {
    return { status: "completed", session, exercises: mappedExercises, attempts };
  }

  const updatedSession =
    currentIndex !== session.currentExerciseIndex
      ? await studySessionsRepository.updateCurrentExerciseIndex(session.id, currentIndex)
      : session;

  return {
    status: "ready",
    session: updatedSession,
    exercises: mappedExercises,
    attempts,
    currentExercise: mappedExercises[currentIndex],
    currentIndex,
  };
}

export async function submitRealSessionAnswer(input: {
  sessionId: string;
  exerciseId: string;
  answer: string;
  usedHint: boolean;
}) {
  return submitAnswer({
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    answer: input.answer,
    usedHint: input.usedHint,
  });
}

export async function loadRealCorrectionView(sessionId: string, attemptId: string): Promise<RealCorrectionView> {
  const { attemptsRepository, conceptsRepository, exercisesRepository, studySessionsRepository } = await import("@/src/database");
  const session = await studySessionsRepository.findById(sessionId);
  if (!session) {
    return { status: "missing" };
  }
  const attempts = await attemptsRepository.findAllBySession(sessionId);
  const attempt = attempts.find((item) => item.id === attemptId);
  if (!attempt) {
    return { status: "missing" };
  }
  const exercise = await exercisesRepository.findById(attempt.exerciseId);
  if (!exercise) {
    return { status: "missing" };
  }
  const allExercises = await exercisesRepository.findAllByCourse(session.courseId);
  const concept = await conceptsRepository.findById(exercise.conceptId);
  return {
    status: "ready",
    session,
    attempt,
    exercise: toSessionExercise(exercise, concept?.name ?? "Notion"),
    isLastExercise: allExercises.findIndex((item) => item.id === exercise.id) >= allExercises.length - 1,
  };
}

export async function completeRealSessionAndBuildReport(sessionId: string) {
  const { studySessionsRepository } = await import("@/src/database");
  const session = await studySessionsRepository.findById(sessionId);
  if (!session) {
    throw new SessionNotFoundError();
  }
  if (session.status !== "completed") {
    await completeSession(sessionId);
  }
  return buildSessionReport(sessionId);
}

async function conceptName(conceptId: string | null, concepts: Map<string, Concept>) {
  return conceptId ? concepts.get(conceptId)?.name ?? "Notion" : "Aucune";
}

export async function loadRealReportView(sessionId: string): Promise<RealReportView> {
  const { conceptsRepository, studySessionsRepository } = await import("@/src/database");
  const session = await studySessionsRepository.findById(sessionId);
  if (!session) {
    return { status: "missing" };
  }
  const report = await buildSessionReport(sessionId);
  const conceptIds = [report.strongConceptId, report.weakConceptId].filter((value): value is string => Boolean(value));
  const conceptRows = await Promise.all(conceptIds.map((conceptId) => conceptsRepository.findById(conceptId)));
  const concepts = new Map(conceptRows.filter((concept): concept is Concept => concept !== null).map((concept) => [concept.id, concept]));
  return {
    status: "ready",
    session,
    report,
    durationSeconds: session.durationSeconds,
    strongConceptName: await conceptName(report.strongConceptId, concepts),
    weakConceptName: await conceptName(report.weakConceptId, concepts),
  };
}
