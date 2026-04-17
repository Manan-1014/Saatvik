import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, snackCategoriesTable } from "@workspace/db";
import { CreateSnackCategoryBody, UpdateSnackCategoryBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/snack-categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(snackCategoriesTable)
    .where(eq(snackCategoriesTable.status, 1))
    .orderBy(asc(snackCategoriesTable.sortOrder), asc(snackCategoriesTable.id));
  res.json(rows);
});

router.get("/admin/snack-categories", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(snackCategoriesTable)
    .orderBy(asc(snackCategoriesTable.sortOrder), asc(snackCategoriesTable.id));
  res.json(rows);
});

router.post("/admin/snack-categories", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateSnackCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(snackCategoriesTable)
    .values({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
      status: parsed.data.status ?? 1,
    })
    .returning();
  res.status(201).json(row);
});

router.put("/admin/snack-categories/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const parsed = UpdateSnackCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(snackCategoriesTable)
    .set({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
      status: parsed.data.status ?? 1,
    })
    .where(eq(snackCategoriesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/admin/snack-categories/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  await db.update(snackCategoriesTable).set({ status: 2 }).where(eq(snackCategoriesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
