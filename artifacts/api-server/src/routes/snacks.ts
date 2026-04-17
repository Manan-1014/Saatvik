import { Router, type IRouter } from "express";
import { eq, and, ilike, type SQL } from "drizzle-orm";
import { db, snacksTable, snackCategoriesTable, inventoryTable } from "@workspace/db";
import { CreateSnackBody, UpdateSnackBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function buildSnackSelect() {
  return {
    id: snacksTable.id,
    name: snacksTable.name,
    description: snacksTable.description,
    price: snacksTable.price,
    imageUrl: snacksTable.imageUrl,
    snackCategoryId: snacksTable.snackCategoryId,
    weight: snacksTable.weight,
    status: snacksTable.status,
    createdAt: snacksTable.createdAt,
    SnackCategory: {
      id: snackCategoriesTable.id,
      name: snackCategoriesTable.name,
      sortOrder: snackCategoriesTable.sortOrder,
      status: snackCategoriesTable.status,
    },
    Inventory: {
      snackId: inventoryTable.snackId,
      quantity: inventoryTable.quantity,
      updatedAt: inventoryTable.updatedAt,
    },
  };
}

async function fetchSnacksWithJoins(where?: SQL) {
  const base = db
    .select(buildSnackSelect())
    .from(snacksTable)
    .leftJoin(snackCategoriesTable, eq(snacksTable.snackCategoryId, snackCategoriesTable.id))
    .leftJoin(inventoryTable, eq(snacksTable.id, inventoryTable.snackId));
  const rows = where ? await base.where(where) : await base;
  return rows.map((s) => ({
    ...s,
    SnackCategory: s.SnackCategory?.id ? s.SnackCategory : undefined,
    Inventory: s.Inventory?.snackId ? s.Inventory : { snackId: s.id, quantity: 0 },
  }));
}

router.get("/snacks", async (req, res): Promise<void> => {
  const snack_category_id = req.query.snack_category_id as string;
  const search = req.query.search as string;

  const conditions: SQL[] = [eq(snacksTable.status, 1)];

  if (snack_category_id) {
    conditions.push(eq(snacksTable.snackCategoryId, parseInt(snack_category_id, 10)));
  }
  if (search) {
    conditions.push(ilike(snacksTable.name, `%${search}%`));
  }
  const snacks = await fetchSnacksWithJoins(and(...conditions));
  res.json(snacks);
});

router.get("/snacks/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const snacks = await fetchSnacksWithJoins(eq(snacksTable.id, id));
  const snack = snacks[0];
  if (!snack) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(snack);
});

router.get("/admin/snacks", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const snacks = await fetchSnacksWithJoins();
  res.json(snacks);
});

router.post("/admin/snacks", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateSnackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [s] = await db
    .insert(snacksTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price?.toString() as any,
      imageUrl: parsed.data.imageUrl,
      snackCategoryId: parsed.data.snackCategoryId,
      weight: parsed.data.weight,
      status: parsed.data.status ?? 1,
    })
    .returning();

  await db.insert(inventoryTable).values({ snackId: s.id, quantity: 0 });

  const [snack] = await fetchSnacksWithJoins(eq(snacksTable.id, s.id));
  res.status(201).json(snack);
});

router.put("/admin/snacks/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const parsed = UpdateSnackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db
    .update(snacksTable)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price?.toString() as any,
      imageUrl: parsed.data.imageUrl,
      snackCategoryId: parsed.data.snackCategoryId,
      weight: parsed.data.weight,
      status: parsed.data.status ?? 1,
    })
    .where(eq(snacksTable.id, id));

  const [snack] = await fetchSnacksWithJoins(eq(snacksTable.id, id));
  if (!snack) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(snack);
});

router.delete("/admin/snacks/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  await db.update(snacksTable).set({ status: 2 }).where(eq(snacksTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

router.patch("/admin/snacks/:id/toggle", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [current] = await db.select({ status: snacksTable.status }).from(snacksTable).where(eq(snacksTable.id, id));
  if (!current) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const newStatus = current.status === 1 ? 0 : 1;
  await db.update(snacksTable).set({ status: newStatus }).where(eq(snacksTable.id, id));

  const [snack] = await fetchSnacksWithJoins(eq(snacksTable.id, id));
  res.json(snack);
});

export default router;
