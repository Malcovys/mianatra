import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { dbRelations } from "./schema";

const expoDb = openDatabaseSync("mianatra.db");
expoDb.execSync("PRAGMA journal_mode = WAL");

export const db = drizzle(expoDb, { relations: dbRelations });
export { expoDb };
