import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { subjects } from "./subjects.table";

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict", onUpdate: "cascade" }),
    title: text("title").notNull(),
    grade: text("grade").notNull(),
    status: text("status", { enum: ["draft", "processing", "ready", "archived"] }).notNull(),
    summary: text("summary"),
    pageCount: integer("page_count").notNull().default(0),
    lastReviewedAt: text("last_reviewed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_courses_subject_id").on(table.subjectId),
    index("idx_courses_status").on(table.status),
  ],
);
