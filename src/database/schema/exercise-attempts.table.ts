import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { exercises } from "./exercises.table";
import { studySessions } from "./study-sessions.table";

export const exerciseAttempts = sqliteTable(
  "exercise_attempts",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => studySessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userAnswer: text("user_answer").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    usedHint: integer("used_hint", { mode: "boolean" }).notNull(),
    mistakeType: text("mistake_type"),
    responseTimeMs: integer("response_time_ms"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_exercise_attempts_session_id").on(table.sessionId),
    index("idx_exercise_attempts_exercise_id").on(table.exerciseId),
  ],
);
