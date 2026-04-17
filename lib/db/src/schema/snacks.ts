import { pgTable, serial, integer, varchar, text, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { snackCategoriesTable } from "./snackCategories";

export const snacksTable = pgTable("snacks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  snackCategoryId: integer("snack_category_id").references(() => snackCategoriesTable.id),
  weight: varchar("weight", { length: 20 }), // e.g. "200g", "500g" format as per UI
  status: integer("status").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertSnackSchema = createInsertSchema(snacksTable).omit({ id: true, createdAt: true });
export type InsertSnack = z.infer<typeof insertSnackSchema>;
export type Snack = typeof snacksTable.$inferSelect;
