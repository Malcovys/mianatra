import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { courses } from "./courses.table";

export const studySessions = sqliteTable(
  "study_sessions",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: text("type", { enum: ["initial", "targeted", "retry"] }).notNull(),
    status: text("status", { enum: ["active", "completed", "abandoned"] }).notNull(),
    currentExerciseIndex: integer("current_exercise_index").notNull().default(0),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_study_sessions_course_id").on(table.courseId),
    index("idx_study_sessions_status").on(table.status),
  ],
);
