import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { concepts } from "./concepts.table";

export const conceptProgress = sqliteTable(
  "concept_progress",
  {
    conceptId: text("concept_id")
      .primaryKey()
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade", onUpdate: "cascade" }),
    score: real("score").notNull(),
    status: text("status", {
      enum: ["not_started", "to_discover", "in_progress", "needs_reinforcement", "mastered"],
    }).notNull(),
    attemptsCount: integer("attempts_count").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    lastPracticedAt: text("last_practiced_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [check("chk_concept_progress_score_range", sql`${table.score} >= 0 AND ${table.score} <= 100`)],
);
