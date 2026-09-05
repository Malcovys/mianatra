import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const subjects = sqliteTable(
  "subjects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    color: text("color").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("uniq_subjects_name").on(table.name)],
);
