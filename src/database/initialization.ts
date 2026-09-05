import { expoDb } from "./client";

export function prepareDatabaseForMigrations() {
  expoDb.execSync("PRAGMA foreign_keys = OFF");
}

export function initializeDatabaseConnection() {
  expoDb.execSync("PRAGMA foreign_keys = ON");
  expoDb.execSync("PRAGMA journal_mode = WAL");
}
