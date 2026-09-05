import type { CreateSessionReportInput, Exercise, ExerciseAttempt, SessionReport, StudySession } from "@/src/database";
import { SessionNotFoundError } from "@/src/presentation/features/shared";

function buildSummary(correct: number, total: number) {
  if (total === 0) {
    return "Aucune réponse enregistrée pour cette séance.";
  }
  if (correct === total) {
    return "Toutes les réponses déterministes sont correctes.";
  }
  if (correct === 0) {
    return "Les réponses indiquent une reprise complète des notions.";
  }
  return "La séance montre des acquis partiels à consolider.";
}

function buildRecommendation(correct: number, total: number) {
  if (total === 0) {
    return "Relancer une séance avec des exercices ciblés.";
  }
  const score = total === 0 ? 0 : (correct / total) * 100;
  if (score >= 85) {
    return "Continuer avec une nouvelle série d'exercices.";
  }
  if (score >= 50) {
    return "Revoir les notions avec des erreurs récentes.";
  }
  return "Reprendre le cours avant une nouvelle tentative.";
}

type ReportServiceDeps = {
  attempts: {
    findAllBySession: (sessionId: string) => Promise<ExerciseAttempt[]>;
  };
  exercises: {
    findById: (id: string) => Promise<Exercise | null>;
  };
  reports: {
    findBySession: (sessionId: string) => Promise<SessionReport | null>;
    create: (input: CreateSessionReportInput) => Promise<SessionReport>;
    replaceForSession: (input: CreateSessionReportInput) => Promise<SessionReport>;
  };
  sessions: {
    findById: (id: string) => Promise<StudySession | null>;
  };
};

export function createReportService(deps: ReportServiceDeps) {
  return {
    getSessionReport: (sessionId: string) => deps.reports.findBySession(sessionId),
    buildSessionReport: async (sessionId: string) => {
      const session = await deps.sessions.findById(sessionId);
      if (!session) {
        throw new SessionNotFoundError();
      }
      const attempts = await deps.attempts.findAllBySession(sessionId);
      const totalAnswers = attempts.length;
      const correctAnswers = attempts.filter((attempt) => attempt.isCorrect).length;
      const conceptScores = new Map<string, { correct: number; total: number }>();
      for (const attempt of attempts) {
        const exercise = await deps.exercises.findById(attempt.exerciseId);
        if (!exercise) {
          continue;
        }
        const score = conceptScores.get(exercise.conceptId) ?? { correct: 0, total: 0 };
        score.total += 1;
        score.correct += attempt.isCorrect ? 1 : 0;
        conceptScores.set(exercise.conceptId, score);
      }
      const rankedConcepts = [...conceptScores.entries()].sort((left, right) => {
        const leftScore = left[1].total === 0 ? 0 : left[1].correct / left[1].total;
        const rightScore = right[1].total === 0 ? 0 : right[1].correct / right[1].total;
        return rightScore - leftScore;
      });
      const strongConceptId = rankedConcepts[0]?.[0] ?? null;
      const weakConceptId = rankedConcepts.at(-1)?.[0] ?? null;
      const reportInput = {
        sessionId,
        score: totalAnswers === 0 ? 0 : Math.round((correctAnswers / totalAnswers) * 100),
        correctAnswers,
        totalAnswers,
        strongConceptId: strongConceptId === weakConceptId ? null : strongConceptId,
        weakConceptId,
        summary: buildSummary(correctAnswers, totalAnswers),
        recommendation: buildRecommendation(correctAnswers, totalAnswers),
      };
      return (await deps.reports.findBySession(sessionId))
        ? deps.reports.replaceForSession(reportInput)
        : deps.reports.create(reportInput);
    },
  };
}

async function getDeps(): Promise<ReportServiceDeps> {
  const repositories = await import("@/src/database");
  return {
    attempts: repositories.attemptsRepository,
    exercises: repositories.exercisesRepository,
    reports: repositories.reportsRepository,
    sessions: repositories.studySessionsRepository,
  };
}

export async function getSessionReport(sessionId: string) {
  return createReportService(await getDeps()).getSessionReport(sessionId);
}

export async function buildSessionReport(sessionId: string) {
  return createReportService(await getDeps()).buildSessionReport(sessionId);
}

export const reportService = { buildSessionReport, getSessionReport };
