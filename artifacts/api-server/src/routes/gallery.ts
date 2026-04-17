import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, galleryItemsTable } from "@workspace/db";
import { CreateGalleryItemBody, UpdateGalleryItemBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/gallery", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(galleryItemsTable)
    .where(eq(galleryItemsTable.status, 1))
    .orderBy(asc(galleryItemsTable.sortOrder), asc(galleryItemsTable.id));
  res.json(items);
});

router.get("/admin/gallery", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const items = await db.select().from(galleryItemsTable).orderBy(asc(galleryItemsTable.sortOrder), asc(galleryItemsTable.id));
  res.json(items);
});

router.post("/admin/gallery", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateGalleryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(galleryItemsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl,
      sortOrder: parsed.data.sortOrder ?? 0,
      status: parsed.data.status ?? 1,
    })
    .returning();
  res.status(201).json(row);
});

router.put("/admin/gallery/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const parsed = UpdateGalleryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(galleryItemsTable)
    .set({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl,
      sortOrder: parsed.data.sortOrder ?? 0,
      status: parsed.data.status ?? 1,
    })
    .where(eq(galleryItemsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/admin/gallery/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  await db.update(galleryItemsTable).set({ status: 2 }).where(eq(galleryItemsTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
