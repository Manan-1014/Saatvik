import { Router, type IRouter } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, paymentsTable, ordersTable } from "@workspace/db";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order for an existing app order and records it in the
 * payments table with status "created".
 *
 * Body: { order_id: number }
 * Returns: { razorpay_order_id, amount, currency, key_id }
 */
router.post("/payments/create-order", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const { order_id } = req.body as { order_id: number };

  if (!order_id || typeof order_id !== "number") {
    res.status(400).json({ error: "order_id is required and must be a number" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, order_id))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (order.paymentStatus === "paid") {
    res.status(400).json({ error: "Order is already paid" });
    return;
  }

  // Amount in paise (Razorpay requires smallest currency unit)
  const amountInPaise = Math.round(parseFloat(order.total.toString()) * 100);

  let rzpOrder: { id: string };
  try {
    rzpOrder = (await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${order.id}`,
      notes: {
        app_order_id: String(order.id),
        user_id: String(req.user!.id),
      },
    })) as { id: string };
  } catch (err: any) {
    console.error("Razorpay order creation failed:", err);
    res.status(502).json({ error: "Failed to create payment order with Razorpay" });
    return;
  }

  await db.insert(paymentsTable).values({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: amountInPaise,
    currency: "INR",
    status: "created",
  });

  // Mark the app order as payment initiated
  await db
    .update(ordersTable)
    .set({ paymentStatus: "pending" })
    .where(eq(ordersTable.id, order.id));

  res.json({
    razorpay_order_id: rzpOrder.id,
    amount: amountInPaise,
    currency: "INR",
    key_id: process.env.RAZORPAY_KEY_ID,
  });
});

/**
 * POST /api/payments/verify
 *
 * Verifies the Razorpay payment signature after checkout completion.
 * Updates payment & order status accordingly.
 *
 * Body (success): { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Body (failure): { razorpay_order_id, error_code, error_description }
 */
router.post("/payments/verify", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    error_code,
    error_description,
  } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    error_code?: string;
    error_description?: string;
  };

  if (!razorpay_order_id) {
    res.status(400).json({ error: "razorpay_order_id is required" });
    return;
  }

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.razorpayOrderId, razorpay_order_id))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "Payment record not found" });
    return;
  }

  // ── Failure path ────────────────────────────────────────────────────────────
  if (!razorpay_payment_id || !razorpay_signature) {
    await db
      .update(paymentsTable)
      .set({
        status: "failed",
        errorCode: error_code ?? "UNKNOWN",
        errorDescription: error_description ?? "Payment was not completed",
        updatedAt: new Date(),
      })
      .where(eq(paymentsTable.id, payment.id));

    await db
      .update(ordersTable)
      .set({ paymentStatus: "failed" })
      .where(eq(ordersTable.id, payment.orderId));

    res.status(200).json({ success: false, message: "Payment failed and recorded" });
    return;
  }

  // ── Signature verification ───────────────────────────────────────────────
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generated !== razorpay_signature) {
    await db
      .update(paymentsTable)
      .set({
        status: "failed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        errorCode: "SIGNATURE_MISMATCH",
        errorDescription: "Payment signature verification failed",
        updatedAt: new Date(),
      })
      .where(eq(paymentsTable.id, payment.id));

    await db
      .update(ordersTable)
      .set({ paymentStatus: "failed" })
      .where(eq(ordersTable.id, payment.orderId));

    res.status(400).json({ error: "Payment signature verification failed" });
    return;
  }

  // ── Success ──────────────────────────────────────────────────────────────
  await db
    .update(paymentsTable)
    .set({
      status: "paid",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, payment.id));

  await db
    .update(ordersTable)
    .set({ paymentStatus: "paid" })
    .where(eq(ordersTable.id, payment.orderId));

  res.json({ success: true, message: "Payment verified and recorded" });
});

/**
 * GET /api/payments/order/:orderId
 *
 * Returns payment records for a given app order.
 * Accessible by the order owner or an admin.
 */
router.get("/payments/order/:orderId", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const orderId = parseInt(req.params.orderId as string, 10);

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const isOwner = order.userId === req.user!.id;
  const isAdmin = req.user!.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, orderId));

  res.json(payments);
});

export default router;
