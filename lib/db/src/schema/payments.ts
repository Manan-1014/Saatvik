import { pgTable, serial, integer, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { usersTable } from "./users";
import { deliveryAreasTable } from "./deliveryAreas";

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
  /** Set after payment succeeds and an app order row is created; null while checkout is in progress */
  orderId: integer("order_id").references(() => ordersTable.id),
  /** Owner of the checkout — required when orderId is null */
  userId: integer("user_id").references(() => usersTable.id),
  deliveryAreaId: integer("delivery_area_id").references(() => deliveryAreasTable.id),
  /** JSON: cart lines + totals at create-order time (server-built) for post-payment order creation */
  checkoutSnapshot: text("checkout_snapshot"),

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
