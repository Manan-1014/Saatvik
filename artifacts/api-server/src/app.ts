import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Parse CORS_ORIGINS into an allowlist. Falls back to open (*) only when the
// var is not set — which should only happen in local dev without a .env.
const rawOrigins = process.env.CORS_ORIGINS;
const corsOrigins: string | string[] = rawOrigins
  ? rawOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : "*";

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
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
