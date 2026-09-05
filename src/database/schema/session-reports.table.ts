import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { concepts } from "./concepts.table";
import { studySessions } from "./study-sessions.table";

export const sessionReports = sqliteTable(
  "session_reports",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => studySessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    score: real("score").notNull(),
    correctAnswers: integer("correct_answers").notNull(),
    totalAnswers: integer("total_answers").notNull(),
    strongConceptId: text("strong_concept_id").references(() => concepts.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    weakConceptId: text("weak_concept_id").references(() => concepts.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    summary: text("summary").notNull(),
    recommendation: text("recommendation").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("uniq_session_reports_session_id").on(table.sessionId)],
);
