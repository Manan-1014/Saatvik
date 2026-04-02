import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  let [s] = await db.select().from(settingsTable).where(eq(settingsTable.status, 1)).limit(1);
  if (!s) {
    [s] = await db.insert(settingsTable).values({
      orderCutoffTime: "18:30:00",
      maintenanceMode: false,
      announcement: "Orders close today at 6:30 PM — Order now for fresh Jain meals!",
      businessName: "Saatvik Jain Aahar Gruh",
      contactNumber: "+91 98765 43210",
      status: 1,
    }).returning();
  }
  res.json({
    id: s.id,
    order_cutoff_time: s.orderCutoffTime,
    maintenance_mode: s.maintenanceMode,
    announcement: s.announcement,
    business_name: s.businessName,
    contact_number: s.contactNumber,
    status: s.status,
  });
});

router.put("/admin/settings", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  let [s] = await db.select().from(settingsTable).limit(1);
  if (!s) {
    [s] = await db.insert(settingsTable).values({ status: 1 }).returning();
  }
  const [updated] = await db.update(settingsTable).set({
    orderCutoffTime: parsed.data.order_cutoff_time ?? s.orderCutoffTime,
    maintenanceMode: parsed.data.maintenance_mode ?? s.maintenanceMode,
    announcement: parsed.data.announcement ?? s.announcement,
    businessName: parsed.data.business_name ?? s.businessName,
    contactNumber: parsed.data.contact_number ?? s.contactNumber,
  }).where(eq(settingsTable.id, s.id)).returning();
  res.json({
    id: updated.id,
    order_cutoff_time: updated.orderCutoffTime,
    maintenance_mode: updated.maintenanceMode,
    announcement: updated.announcement,
    business_name: updated.businessName,
    contact_number: updated.contactNumber,
    status: updated.status,
  });
});

export default router;
