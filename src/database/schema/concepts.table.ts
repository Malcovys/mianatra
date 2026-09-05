import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { courses } from "./courses.table";

export const concepts = sqliteTable(
  "concepts",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_concepts_course_order_index").on(table.courseId, table.orderIndex),
    index("idx_concepts_course_id").on(table.courseId),
  ],
);
