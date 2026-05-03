import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Temporary debug route — remove after confirming routing works end-to-end
router.get("/ping", (_req, res) => {
  res.json({
    ok: true,
    node: process.version,
    env: process.env.NODE_ENV,
    dbSet: !!process.env.DATABASE_URL,
    portSet: !!process.env.PORT,
  });
});

export default router;
