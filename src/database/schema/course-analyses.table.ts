import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { courses } from "./courses.table";

export const courseAnalyses = sqliteTable(
  "course_analyses",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    detectedTitle: text("detected_title").notNull(),
    detectedSubject: text("detected_subject").notNull(),
    detectedLevel: text("detected_level"),
    rawJson: text("raw_json").notNull(),
    confidence: real("confidence"),
    validatedByUser: integer("validated_by_user", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_course_analyses_course_id").on(table.courseId)],
);
