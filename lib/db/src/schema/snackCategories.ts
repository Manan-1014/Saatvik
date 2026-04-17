import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const snackCategoriesTable = pgTable("snack_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  status: integer("status").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertSnackCategorySchema = createInsertSchema(snackCategoriesTable).omit({ id: true, createdAt: true });
export type InsertSnackCategory = z.infer<typeof insertSnackCategorySchema>;
export type SnackCategoryRow = typeof snackCategoriesTable.$inferSelect;
