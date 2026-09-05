import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { courses } from "./courses.table";

export const coursePages = sqliteTable(
  "course_pages",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    localUri: text("local_uri").notNull(),
    thumbnailUri: text("thumbnail_uri"),
    pageIndex: integer("page_index").notNull(),
    rotation: integer("rotation").notNull().default(0),
    qualityStatus: text("quality_status", { enum: ["good", "blurry", "unreadable"] }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_course_pages_course_page_index").on(table.courseId, table.pageIndex),
    index("idx_course_pages_course_id").on(table.courseId),
  ],
);
