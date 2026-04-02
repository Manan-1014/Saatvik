import { pgTable, serial, varchar, decimal, smallint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliveryAreasTable = pgTable("delivery_areas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).notNull(),
  status: smallint("status").default(1),
});

export const insertDeliveryAreaSchema = createInsertSchema(deliveryAreasTable).omit({ id: true });
export type InsertDeliveryArea = z.infer<typeof insertDeliveryAreaSchema>;
export type DeliveryArea = typeof deliveryAreasTable.$inferSelect;
