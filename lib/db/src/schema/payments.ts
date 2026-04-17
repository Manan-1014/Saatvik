import { pgTable, serial, integer, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

/**
 * Tracks every Razorpay payment attempt linked to an app order.
 *
 * Status lifecycle:
 *   created   → Razorpay order created, awaiting user action
 *   attempted → User opened checkout but did not complete
 *   paid      → Signature verified, payment captured
 *   failed    → Payment failed or signature mismatch
 */
export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),

  // IDs from Razorpay
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }).notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  razorpaySignature: text("razorpay_signature"),

  // Amount in paise (₹1 = 100 paise)
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),

  status: varchar("status", { length: 20 }).notNull().default("created"),

  errorCode: varchar("error_code", { length: 100 }),
  errorDescription: text("error_description"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
