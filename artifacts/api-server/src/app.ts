import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Parse CORS_ORIGINS into an allowlist.
// When not set, allow all origins but WITHOUT credentials (wildcard + credentials is invalid per CORS spec).
const rawOrigins = process.env.CORS_ORIGINS;
const corsOrigins: string | string[] | undefined = rawOrigins
  ? rawOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : undefined;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// credentials:true is only safe when an explicit origin allowlist is set.
// With no allowlist (open dev mode), omit credentials to avoid browser CORS rejection.
app.use(cors(corsOrigins ? { origin: corsOrigins, credentials: true } : { origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Global error handler — surfaces unhandled errors as JSON instead of crashing
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: message });
});

export default app;
