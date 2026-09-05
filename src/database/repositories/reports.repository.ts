import { eq } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { sessionReports, studySessions } from "../schema";
import type { NewSessionReport, SessionReport } from "../types";
import { assertInteger, assertNonEmpty, assertNonNegative, firstOrThrow } from "./repository-utils";

export type CreateSessionReportInput = Omit<NewSessionReport, "id" | "createdAt">;

function validateReportInput(input: CreateSessionReportInput) {
  assertNonEmpty(input.sessionId, "sessionId");
  assertInteger(input.correctAnswers, "correctAnswers");
  assertInteger(input.totalAnswers, "totalAnswers");
  assertNonNegative(input.correctAnswers, "correctAnswers");
  assertNonNegative(input.totalAnswers, "totalAnswers");
  if (input.correctAnswers > input.totalAnswers) {
    throw new Error("correctAnswers must be lower than or equal to totalAnswers.");
  }
  assertNonEmpty(input.summary, "summary");
  assertNonEmpty(input.recommendation, "recommendation");
}

async function assertSessionExists(sessionId: string) {
  const session = db.select().from(studySessions).where(eq(studySessions.id, sessionId)).get();
  if (!session) {
    throw new Error("Session report must be linked to an existing session.");
  }
}

async function findBySession(sessionId: string): Promise<SessionReport | null> {
  return db.select().from(sessionReports).where(eq(sessionReports.sessionId, sessionId)).get() ?? null;
}

async function create(input: CreateSessionReportInput): Promise<SessionReport> {
  validateReportInput(input);
  await assertSessionExists(input.sessionId);
  return firstOrThrow(
    db.insert(sessionReports).values({ id: createId(), createdAt: nowIso(), ...input }).returning().all(),
    "Unable to create session report.",
  );
}

async function replaceForSession(input: CreateSessionReportInput): Promise<SessionReport> {
  validateReportInput(input);
  await assertSessionExists(input.sessionId);
  return db.transaction((tx) => {
    tx.delete(sessionReports).where(eq(sessionReports.sessionId, input.sessionId)).run();
    return firstOrThrow(
      tx.insert(sessionReports).values({ id: createId(), createdAt: nowIso(), ...input }).returning().all(),
      "Unable to replace session report.",
    );
  });
}

export const reportsRepository = {
  findBySession,
  create,
  replaceForSession,
};
