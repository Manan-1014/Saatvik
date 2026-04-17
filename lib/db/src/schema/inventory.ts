import { pgTable, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { snacksTable } from "./snacks";

export const inventoryTable = pgTable("inventory", {
  snackId: integer("snack_id").primaryKey().references(() => snacksTable.id),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ updatedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventoryTable.$inferSelect;
