import { asc, eq } from "drizzle-orm";
import { db } from "../client";
import { createId, nowIso } from "../helpers";
import { subjects } from "../schema";
import type { NewSubject, Subject } from "../types";
import { assertNonEmpty, firstOrThrow } from "./repository-utils";

export type CreateSubjectInput = Omit<NewSubject, "id" | "createdAt">;
export type UpdateSubjectInput = Partial<CreateSubjectInput>;

function validateSubjectInput(input: CreateSubjectInput) {
  assertNonEmpty(input.name, "name");
  assertNonEmpty(input.icon, "icon");
  assertNonEmpty(input.color, "color");
}

function validateSubjectPatch(input: UpdateSubjectInput) {
  if (input.name !== undefined) {
    assertNonEmpty(input.name, "name");
  }
  if (input.icon !== undefined) {
    assertNonEmpty(input.icon, "icon");
  }
  if (input.color !== undefined) {
    assertNonEmpty(input.color, "color");
  }
}

async function findAll(): Promise<Subject[]> {
  return db.select().from(subjects).orderBy(asc(subjects.name)).all();
}

async function findById(id: string): Promise<Subject | null> {
  return db.select().from(subjects).where(eq(subjects.id, id)).get() ?? null;
}

async function findByName(name: string): Promise<Subject | null> {
  return db.select().from(subjects).where(eq(subjects.name, name)).get() ?? null;
}

async function create(input: CreateSubjectInput): Promise<Subject> {
  validateSubjectInput(input);
  return firstOrThrow(
    db.insert(subjects).values({ id: createId(), createdAt: nowIso(), ...input }).returning().all(),
    "Unable to create subject.",
  );
}

async function update(id: string, input: UpdateSubjectInput): Promise<Subject> {
  validateSubjectPatch(input);
  return firstOrThrow(db.update(subjects).set(input).where(eq(subjects.id, id)).returning().all(), "Subject not found.");
}

async function remove(id: string): Promise<void> {
  db.delete(subjects).where(eq(subjects.id, id)).run();
}

export const subjectsRepository = {
  findAll,
  findById,
  findByName,
  create,
  update,
  remove,
};
