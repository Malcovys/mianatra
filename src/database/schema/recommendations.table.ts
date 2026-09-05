import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { concepts } from "./concepts.table";
import { courses } from "./courses.table";

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    conceptId: text("concept_id").references(() => concepts.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    type: text("type", { enum: ["resume", "targeted", "new_course"] }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    priority: integer("priority").notNull(),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_recommendations_course_id").on(table.courseId),
    index("idx_recommendations_concept_id").on(table.conceptId),
    index("idx_recommendations_type").on(table.type),
  ],
);
