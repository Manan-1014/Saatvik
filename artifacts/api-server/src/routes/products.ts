import { Router, type IRouter } from "express";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { ListProductsQueryParams, CreateProductBody, UpdateProductBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

const withCategory = async (where: any) => {
  return db
    .select({
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
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(where);
};

router.get("/products", async (req, res): Promise<void> => {
  const q = ListProductsQueryParams.safeParse(req.query);
  const conditions: any[] = [eq(productsTable.status, 1)];
  if (q.success && q.data.category_id) {
    conditions.push(eq(productsTable.categoryId, q.data.category_id));
  }
  if (q.success && q.data.search) {
    conditions.push(ilike(productsTable.name, `%${q.data.search}%`));
  }
  const products = await withCategory(and(...conditions));
  res.json(products);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [product] = await withCategory(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(product);
});

router.get("/admin/products", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const products = await withCategory(undefined);
  res.json(products);
});

router.post("/admin/products", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db.insert(productsTable).values({
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    imageUrl: parsed.data.image_url,
    categoryId: parsed.data.category_id,
    isSpecial: parsed.data.is_special ?? false,
    stock: parsed.data.stock ?? 0,
    status: parsed.data.status ?? 1,
  }).returning();
  const [product] = await withCategory(eq(productsTable.id, p.id));
  res.status(201).json(product);
});

router.put("/admin/products/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.update(productsTable).set({
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    imageUrl: parsed.data.image_url,
    categoryId: parsed.data.category_id,
    isSpecial: parsed.data.is_special ?? false,
    stock: parsed.data.stock ?? 0,
    status: parsed.data.status ?? 1,
  }).where(eq(productsTable.id, id));
  const [product] = await withCategory(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(product);
});

router.delete("/admin/products/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  await db.update(productsTable).set({ status: 2 }).where(eq(productsTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

router.patch("/admin/products/:id/toggle", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [current] = await db.select({ status: productsTable.status }).from(productsTable).where(eq(productsTable.id, id));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = current.status === 1 ? 0 : 1;
  await db.update(productsTable).set({ status: newStatus }).where(eq(productsTable.id, id));
  const [product] = await withCategory(eq(productsTable.id, id));
  res.json(product);
});

export default router;
