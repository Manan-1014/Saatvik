import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartTable, cartItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { AddToCartBody, UpdateCartItemBody } from "@workspace/api-zod";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

async function getOrCreateCart(userId: number) {
  let [cart] = await db.select().from(cartTable).where(and(eq(cartTable.userId, userId), eq(cartTable.status, 1))).limit(1);
  if (!cart) {
    [cart] = await db.insert(cartTable).values({ userId, status: 1 }).returning();
  }
  return cart;
}

async function buildCartResponse(cartId: number, userId: number) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      cart_id: cartItemsTable.cartId,
      product_id: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      status: cartItemsTable.status,
      product: {
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        price: productsTable.price,
        image_url: productsTable.imageUrl,
        category_id: productsTable.categoryId,
        category_name: categoriesTable.name,
        is_special: productsTable.isSpecial,
        stock: productsTable.stock,
        status: productsTable.status,
        created_at: productsTable.createdAt,
      }
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(eq(cartItemsTable.cartId, cartId), eq(cartItemsTable.status, 1)));

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.product?.price || "0") * item.quantity), 0);
  return { id: cartId, user_id: userId, items, subtotal: subtotal.toFixed(2) };
}

router.get("/cart", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const cart = await getOrCreateCart(req.user!.id);
  res.json(await buildCartResponse(cart.id, req.user!.id));
});

router.post("/cart/items", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const cart = await getOrCreateCart(req.user!.id);
  const existing = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.productId, parsed.data.product_id), eq(cartItemsTable.status, 1)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(cartItemsTable).set({ quantity: existing[0].quantity + parsed.data.quantity }).where(eq(cartItemsTable.id, existing[0].id));
  } else {
    await db.insert(cartItemsTable).values({ cartId: cart.id, productId: parsed.data.product_id, quantity: parsed.data.quantity, status: 1 });
  }
  res.json(await buildCartResponse(cart.id, req.user!.id));
});

router.put("/cart/items/:itemId", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(rawId, 10);
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const cart = await getOrCreateCart(req.user!.id);
  if (parsed.data.quantity <= 0) {
    await db.update(cartItemsTable).set({ status: 2 }).where(eq(cartItemsTable.id, itemId));
  } else {
    await db.update(cartItemsTable).set({ quantity: parsed.data.quantity }).where(eq(cartItemsTable.id, itemId));
  }
  res.json(await buildCartResponse(cart.id, req.user!.id));
});

router.delete("/cart/items/:itemId", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(rawId, 10);
  const cart = await getOrCreateCart(req.user!.id);
  await db.update(cartItemsTable).set({ status: 2 }).where(eq(cartItemsTable.id, itemId));
  res.json(await buildCartResponse(cart.id, req.user!.id));
});

router.delete("/cart/clear", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const cart = await getOrCreateCart(req.user!.id);
  await db.update(cartItemsTable).set({ status: 2 }).where(eq(cartItemsTable.cartId, cart.id));
  res.json({ success: true, message: "Cart cleared" });
});

export default router;
