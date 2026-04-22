import { Router, type IRouter } from "express";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeMenuDate(raw?: string): string {
  if (!raw) return todayIsoDate();
  // Keep accepted format strict to avoid timezone surprises.
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  return ok ? raw : todayIsoDate();
}

function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

const withCategory = async (where: any) => {
  return db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      image_url: productsTable.imageUrl,
      category_id: productsTable.categoryId,
      menu_date: productsTable.menuDate,
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
  const conditions: any[] = [eq(productsTable.status, 1)];
  const rawCategoryId = Array.isArray(req.query.category_id) ? req.query.category_id[0] : req.query.category_id;
  const rawSearch = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
  const rawMenuDate = Array.isArray(req.query.menu_date) ? req.query.menu_date[0] : req.query.menu_date;
  const menuDate = normalizeMenuDate(typeof rawMenuDate === "string" ? rawMenuDate : undefined);
  conditions.push(eq(productsTable.menuDate, menuDate));
  const categoryId = rawCategoryId ? parseInt(String(rawCategoryId), 10) : NaN;
  if (!Number.isNaN(categoryId)) {
    conditions.push(eq(productsTable.categoryId, categoryId));
  }
  if (typeof rawSearch === "string" && rawSearch.trim().length > 0) {
    conditions.push(ilike(productsTable.name, `%${rawSearch.trim()}%`));
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

router.get("/admin/products", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const rawMenuDate = Array.isArray(req.query.menu_date) ? req.query.menu_date[0] : req.query.menu_date;
  const menuDate = normalizeMenuDate(typeof rawMenuDate === "string" ? rawMenuDate : undefined);
  const products = await withCategory(eq(productsTable.menuDate, menuDate));
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
    menuDate: toIsoDateOnly(parsed.data.menu_date),
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
    menuDate: toIsoDateOnly(parsed.data.menu_date),
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
