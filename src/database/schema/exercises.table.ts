import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { concepts } from "./concepts.table";
import { courses } from "./courses.table";

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    conceptId: text("concept_id").notNull().references(() => concepts.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    type: text("type", {
      enum: ["multiple_choice", "short_answer", "true_false", "numeric", "explanation", "graph_reading"],
    }).notNull(),
    question: text("question").notNull(),
    expectedAnswer: text("expected_answer").notNull(),
    optionsJson: text("options_json"),
    hint: text("hint"),
    explanation: text("explanation").notNull(),
    difficulty: integer("difficulty").notNull(),
    generatedFromWeakness: integer("generated_from_weakness", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_exercises_course_id").on(table.courseId),
    index("idx_exercises_concept_id").on(table.conceptId),
    index("idx_exercises_difficulty").on(table.difficulty),
  ],
);
