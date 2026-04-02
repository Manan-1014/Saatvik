import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveryAreasTable } from "@workspace/db";
import { CreateDeliveryAreaBody, UpdateDeliveryAreaBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/delivery-areas", async (_req, res): Promise<void> => {
  const areas = await db.select().from(deliveryAreasTable).where(eq(deliveryAreasTable.status, 1));
  res.json(areas.map(a => ({ ...a, delivery_charge: a.deliveryCharge })));
});

router.get("/admin/delivery-areas", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const areas = await db.select().from(deliveryAreasTable);
  res.json(areas.map(a => ({ ...a, delivery_charge: a.deliveryCharge })));
});

router.post("/admin/delivery-areas", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateDeliveryAreaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [area] = await db.insert(deliveryAreasTable).values({
    name: parsed.data.name,
    deliveryCharge: parsed.data.delivery_charge,
    status: parsed.data.status ?? 1,
  }).returning();
  res.status(201).json({ ...area, delivery_charge: area.deliveryCharge });
});

router.put("/admin/delivery-areas/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const parsed = UpdateDeliveryAreaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [area] = await db.update(deliveryAreasTable).set({
    name: parsed.data.name,
    deliveryCharge: parsed.data.delivery_charge,
    status: parsed.data.status ?? 1,
  }).where(eq(deliveryAreasTable.id, id)).returning();
  if (!area) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...area, delivery_charge: area.deliveryCharge });
});

router.delete("/admin/delivery-areas/:id", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  await db.update(deliveryAreasTable).set({ status: 2 }).where(eq(deliveryAreasTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

router.patch("/admin/delivery-areas/:id/toggle", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [current] = await db.select({ status: deliveryAreasTable.status }).from(deliveryAreasTable).where(eq(deliveryAreasTable.id, id));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = current.status === 1 ? 0 : 1;
  const [area] = await db.update(deliveryAreasTable).set({ status: newStatus }).where(eq(deliveryAreasTable.id, id)).returning();
  res.json({ ...area, delivery_charge: area.deliveryCharge });
});

export default router;
