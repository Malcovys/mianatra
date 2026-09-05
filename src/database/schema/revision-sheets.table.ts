import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { courses } from "./courses.table";

export const revisionSheets = sqliteTable(
  "revision_sheets",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    contentJson: text("content_json").notNull(),
    version: integer("version").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_revision_sheets_course_version").on(table.courseId, table.version),
    index("idx_revision_sheets_course_id").on(table.courseId),
  ],
);
