import { Router, type IRouter } from "express";
import { db, contactMessagesTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.insert(contactMessagesTable).values({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email,
    message: parsed.data.message,
    status: 1,
  });
  res.status(201).json({ success: true, message: "Message sent" });
});

router.get("/admin/contact", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const messages = await db.select().from(contactMessagesTable).orderBy(contactMessagesTable.createdAt);
  res.json(messages);
});

export default router;
