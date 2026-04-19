import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartTable, cartItemsTable, productsTable, deliveryAreasTable, usersTable, settingsTable, snacksTable } from "@workspace/db";
import { CreateOrderBody, UpdateOrderStatusBody, AdminListOrdersQueryParams } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

async function buildOrderResponse(order: any) {
  const items = await db
    .select({
      id: orderItemsTable.id,
      order_id: orderItemsTable.orderId,
      product_id: orderItemsTable.productId,
      snack_id: orderItemsTable.snackId,
      quantity: orderItemsTable.quantity,
      price: orderItemsTable.price,
      product_name: sql<string>`COALESCE(${productsTable.name}, ${snacksTable.name})`.as("product_name"),
    })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .leftJoin(snacksTable, eq(orderItemsTable.snackId, snacksTable.id))
    .where(eq(orderItemsTable.orderId, order.id));
  return { ...order, items };
}

router.post("/orders", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.payment_method === "razorpay") {
    res.status(400).json({
      error:
        "Razorpay checkout must use POST /api/payment/create-order first; the app order is created only after payment succeeds.",
    });
    return;
  }

  // Check maintenance mode & cutoff
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.status, 1)).limit(1);
  if (settings?.maintenanceMode) {
    res.status(400).json({ error: "Ordering is temporarily disabled for maintenance" });
    return;
  }

  // Check delivery area is active
  const [area] = await db.select().from(deliveryAreasTable).where(eq(deliveryAreasTable.id, parsed.data.delivery_area_id)).limit(1);
  if (!area || area.status !== 1) {
    res.status(400).json({ error: "Selected delivery area is not available" });
    return;
  }

  // Get cart items
  const [cart] = await db.select().from(cartTable).where(and(eq(cartTable.userId, req.user!.id), eq(cartTable.status, 1))).limit(1);
  if (!cart) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }
  const cartItems = await db.select().from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .leftJoin(snacksTable, eq(cartItemsTable.snackId, snacksTable.id))
    .where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.status, 1)));
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const subtotal = cartItems.reduce((sum, row) => sum + (parseFloat(row.products?.price || row.snacks?.price || "0") * row.cart_items.quantity), 0);
  const deliveryCharge = parseFloat(area.deliveryCharge.toString());
  const total = subtotal + deliveryCharge;

  // Determine delivery date
  let deliveryDate = new Date();
  if (settings?.orderCutoffTime) {
    const now = new Date();
    const [h, m] = settings.orderCutoffTime.split(":").map(Number);
    const cutoff = new Date();
    cutoff.setHours(h, m, 0, 0);
    if (now > cutoff) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }
  }

  const [order] = await db.insert(ordersTable).values({
    userId: req.user!.id,
    deliveryAreaId: parsed.data.delivery_area_id,
    deliveryCharge: deliveryCharge.toFixed(2),
    subtotal: subtotal.toFixed(2),
    total: total.toFixed(2),
    status: "pending",
    paymentMethod: parsed.data.payment_method,
    paymentStatus: "SUCCESS",
    deliveryDate: deliveryDate.toISOString().split("T")[0],
  }).returning();

  // Create order items
  for (const row of cartItems) {
    if (row.products || row.snacks) {
      await db.insert(orderItemsTable).values({
        orderId: order.id,
        productId: row.cart_items.productId || null,
        snackId: row.cart_items.snackId || null,
        quantity: row.cart_items.quantity,
        price: row.products?.price || row.snacks?.price || "0",
      });
    }
  }

  // Clear cart
  await db.update(cartItemsTable).set({ status: 2 }).where(eq(cartItemsTable.cartId, cart.id));

  const fullOrder = await getOrderWithMeta(order.id);
  res.status(201).json(fullOrder);
});

async function getOrderWithMeta(orderId: number) {
  const [order] = await db
    .select({
      id: ordersTable.id,
      user_id: ordersTable.userId,
      customer_name: usersTable.name,
      customer_phone: usersTable.phone,
      delivery_area_id: ordersTable.deliveryAreaId,
      delivery_area_name: deliveryAreasTable.name,
      delivery_charge: ordersTable.deliveryCharge,
      subtotal: ordersTable.subtotal,
      total: ordersTable.total,
      status: ordersTable.status,
      payment_method: ordersTable.paymentMethod,
      payment_status: ordersTable.paymentStatus,
      razorpay_payment_id: ordersTable.razorpayPaymentId,
      razorpay_order_id: ordersTable.razorpayOrderId,
      order_time: ordersTable.orderTime,
      delivery_date: ordersTable.deliveryDate,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .leftJoin(deliveryAreasTable, eq(ordersTable.deliveryAreaId, deliveryAreasTable.id))
    .where(eq(ordersTable.id, orderId));
  if (!order) return null;
  return buildOrderResponse(order);
}

router.get("/orders/my", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const orders = await db
    .select({
      id: ordersTable.id,
      user_id: ordersTable.userId,
      customer_name: usersTable.name,
      customer_phone: usersTable.phone,
      delivery_area_id: ordersTable.deliveryAreaId,
      delivery_area_name: deliveryAreasTable.name,
      delivery_charge: ordersTable.deliveryCharge,
      subtotal: ordersTable.subtotal,
      total: ordersTable.total,
      status: ordersTable.status,
      payment_method: ordersTable.paymentMethod,
      payment_status: ordersTable.paymentStatus,
      razorpay_payment_id: ordersTable.razorpayPaymentId,
      razorpay_order_id: ordersTable.razorpayOrderId,
      order_time: ordersTable.orderTime,
      delivery_date: ordersTable.deliveryDate,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .leftJoin(deliveryAreasTable, eq(ordersTable.deliveryAreaId, deliveryAreasTable.id))
    .where(eq(ordersTable.userId, req.user!.id));
  const result = await Promise.all(orders.map(buildOrderResponse));
  res.json(result);
});

router.get("/orders/track/:orderId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const orderId = parseInt(rawId, 10);
  const order = await getOrderWithMeta(orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({
    id: order.id,
    status: order.status,
    order_time: order.order_time,
    delivery_date: order.delivery_date,
    delivery_area_name: order.delivery_area_name,
    items: order.items,
    total: order.total,
  });
});

router.get("/admin/orders", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const q = AdminListOrdersQueryParams.safeParse(req.query);
  let query = db
    .select({
      id: ordersTable.id,
      user_id: ordersTable.userId,
      customer_name: usersTable.name,
      customer_phone: usersTable.phone,
      delivery_area_id: ordersTable.deliveryAreaId,
      delivery_area_name: deliveryAreasTable.name,
      delivery_charge: ordersTable.deliveryCharge,
      subtotal: ordersTable.subtotal,
      total: ordersTable.total,
      status: ordersTable.status,
      payment_method: ordersTable.paymentMethod,
      payment_status: ordersTable.paymentStatus,
      razorpay_payment_id: ordersTable.razorpayPaymentId,
      razorpay_order_id: ordersTable.razorpayOrderId,
      order_time: ordersTable.orderTime,
      delivery_date: ordersTable.deliveryDate,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .leftJoin(deliveryAreasTable, eq(ordersTable.deliveryAreaId, deliveryAreasTable.id));

  const orders = q.success && q.data.status
    ? await query.where(eq(ordersTable.status, q.data.status))
    : await query;
  const result = await Promise.all(orders.map(buildOrderResponse));
  res.json(result);
});

router.patch("/admin/orders/:id/status", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.update(ordersTable).set({ status: parsed.data.status }).where(eq(ordersTable.id, id));
  const order = await getOrderWithMeta(id);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(order);
});

export default router;
