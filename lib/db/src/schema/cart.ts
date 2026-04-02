import { pgTable, serial, integer, smallint, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const cartTable = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  status: smallint("status").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const cartItemsTable = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => cartTable.id),
  productId: integer("product_id").references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  status: smallint("status").default(1),
});

export const insertCartSchema = createInsertSchema(cartTable).omit({ id: true, createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItemsTable).omit({ id: true });
export type InsertCart = z.infer<typeof insertCartSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Cart = typeof cartTable.$inferSelect;
export type CartItem = typeof cartItemsTable.$inferSelect;
