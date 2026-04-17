import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, inventoryTable, inventoryTransactionsTable, snacksTable } from "@workspace/db";
import { CreateInventoryTransactionBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/inventory", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryTable);
  res.json(items);
});

router.get("/admin/inventory/transactions", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const snack_id = req.query.snack_id as string;
  let baseQuery = db
    .select({
      id: inventoryTransactionsTable.id,
      snackId: inventoryTransactionsTable.snackId,
      type: inventoryTransactionsTable.type,
      quantity: inventoryTransactionsTable.quantity,
      note: inventoryTransactionsTable.note,
      createdAt: inventoryTransactionsTable.createdAt,
      Snack: {
        id: snacksTable.id,
        name: snacksTable.name,
      }
    })
    .from(inventoryTransactionsTable)
    .leftJoin(snacksTable, eq(inventoryTransactionsTable.snackId, snacksTable.id));
    
  if (snack_id) {
     baseQuery = baseQuery.where(eq(inventoryTransactionsTable.snackId, parseInt(snack_id, 10))) as any;
  }

  const items = await baseQuery;
  const format = items.map(i => ({ ...i, Snack: i.Snack?.id ? i.Snack : undefined }));
  
  res.json(format);
});

router.post("/admin/inventory/transactions", authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateInventoryTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  const { snackId, type, quantity, note } = parsed.data;

  if (quantity <= 0) {
    res.status(400).json({ error: "quantity must be a positive number" });
    return;
  }

  const [currentInv] = await db.select().from(inventoryTable).where(eq(inventoryTable.snackId, snackId));
  let projected = currentInv ? currentInv.quantity : 0;
  if (type === "ADD") projected += quantity;
  else if (type === "SALE") projected -= quantity;
  else if (type === "ADJUSTMENT") projected += quantity;
  if (projected < 0) {
    res.status(400).json({ error: "Resulting stock cannot be negative" });
    return;
  }

  await db.transaction(async (tx) => {
    // 1. Log transaction
    const [transaction] = await tx.insert(inventoryTransactionsTable).values({
      snackId: snackId,
      type: type,
      quantity: quantity,
      note: note
    }).returning();
    
    // 2. Fetch current inventory to update
    const [currentInv] = await tx.select().from(inventoryTable).where(eq(inventoryTable.snackId, snackId));
    let newQuantity = currentInv ? currentInv.quantity : 0;
    
    if (type === "ADD") {
      newQuantity += quantity;
    } else if (type === "SALE") {
      newQuantity -= quantity;
    } else if (type === "ADJUSTMENT") {
      newQuantity += quantity; 
    }
    
    // 3. Upsert inventory
    await tx.insert(inventoryTable)
      .values({ snackId: snackId, quantity: newQuantity })
      .onConflictDoUpdate({
        target: inventoryTable.snackId,
        set: { quantity: newQuantity, updatedAt: sql`NOW()` }
      });
      
    res.status(201).json(transaction);
  });
});

export default router;
