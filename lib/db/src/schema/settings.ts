import { pgTable, serial, time, boolean, text, varchar, smallint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  orderCutoffTime: time("order_cutoff_time"),
  maintenanceMode: boolean("maintenance_mode").default(false),
  announcement: text("announcement"),
  businessName: varchar("business_name", { length: 100 }),
  contactNumber: varchar("contact_number", { length: 15 }),
  status: smallint("status").default(1),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
