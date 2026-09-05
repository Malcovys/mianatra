import { asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { recommendations } from "../schema";
import type { NewRecommendation, Recommendation } from "../types";
import { assertInteger, assertNonEmpty, assertNonNegative, firstOrThrow } from "./repository-utils";

export type CreateRecommendationInput = Omit<NewRecommendation, "id" | "completedAt" | "createdAt">;

function validateRecommendationInput(input: CreateRecommendationInput) {
  assertNonEmpty(input.type, "type");
  assertNonEmpty(input.title, "title");
  assertNonEmpty(input.description, "description");
  assertInteger(input.estimatedMinutes, "estimatedMinutes");
  assertInteger(input.priority, "priority");
  assertNonNegative(input.estimatedMinutes, "estimatedMinutes");
}

async function findAll(): Promise<Recommendation[]> {
  return db.select().from(recommendations).orderBy(asc(recommendations.priority), desc(recommendations.createdAt)).all();
}

async function findActive(): Promise<Recommendation[]> {
  return db
    .select()
    .from(recommendations)
    .where(isNull(recommendations.completedAt))
    .orderBy(asc(recommendations.priority), desc(recommendations.createdAt))
    .all();
}

async function findById(id: string): Promise<Recommendation | null> {
  return db.select().from(recommendations).where(eq(recommendations.id, id)).get() ?? null;
}

async function create(input: CreateRecommendationInput): Promise<Recommendation> {
  validateRecommendationInput(input);
  return firstOrThrow(
    db.insert(recommendations).values({ id: createId(), completedAt: null, createdAt: nowIso(), ...input }).returning().all(),
    "Unable to create recommendation.",
  );
}

async function complete(id: string): Promise<Recommendation> {
  return firstOrThrow(
    db.update(recommendations).set({ completedAt: nowIso() }).where(eq(recommendations.id, id)).returning().all(),
    "Recommendation not found.",
  );
}

async function remove(id: string): Promise<void> {
  db.delete(recommendations).where(eq(recommendations.id, id)).run();
}

export const recommendationsRepository = {
  findAll,
  findActive,
  findById,
  create,
  complete,
  remove,
};
