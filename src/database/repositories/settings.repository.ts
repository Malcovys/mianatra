import { eq } from "drizzle-orm";
import { db } from "../client";
import { nowIso } from "../helpers";
import { appSettings } from "../schema";
import type { AppSetting } from "../types";
import { assertNonEmpty, firstOrThrow } from "./repository-utils";

async function get(key: string): Promise<string | null> {
  assertNonEmpty(key, "key");
  return db.select().from(appSettings).where(eq(appSettings.key, key)).get()?.value ?? null;
}

async function set(key: string, value: string): Promise<AppSetting> {
  assertNonEmpty(key, "key");
  const existing = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
  const updatedAt = nowIso();

  if (!existing) {
    return firstOrThrow(
      db.insert(appSettings).values({ key, value, updatedAt }).returning().all(),
      "Unable to create setting.",
    );
  }

  return firstOrThrow(
    db.update(appSettings).set({ value, updatedAt }).where(eq(appSettings.key, key)).returning().all(),
    "Setting not found.",
  );
}

async function remove(key: string): Promise<void> {
  db.delete(appSettings).where(eq(appSettings.key, key)).run();
}

async function has(key: string): Promise<boolean> {
  return (await get(key)) !== null;
}

export const settingsRepository = {
  get,
  set,
  remove,
  has,
};
