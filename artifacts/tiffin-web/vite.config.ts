import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// PORT and BASE_PATH are required for `dev` / `preview`, but not for `build`.
// Fall back to safe defaults so `vite build` works without env vars.
const port = Number(process.env.PORT ?? "3000");
const basePath = process.env.BASE_PATH ?? "/";
const apiServerUrl = process.env.API_SERVER_URL;

if (apiServerUrl) {
  // eslint-disable-next-line no-console -- dev-only wiring hint for /api 502 debugging
  console.info(`[vite] API proxy: /api -> ${apiServerUrl}`);
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    ...(apiServerUrl
      ? {
          proxy: {
            "/api": {
              target: apiServerUrl,
              changeOrigin: true,
              configure(proxy) {
                proxy.on("error", (err: NodeJS.ErrnoException) => {
                  // eslint-disable-next-line no-console -- surfaces ECONNREFUSED when API is down / wrong port
                  console.error(`[vite proxy] /api -> ${apiServerUrl} failed:`, err.code ?? err.message);
                });
              },
            },
          },
        }
      : {}),
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
