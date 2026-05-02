import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In production (static hosting), there is no dev-server proxy, so all /api
// calls must be prefixed with the absolute backend URL.
// VITE_API_SERVER_URL is baked in at build time via the Render env var.
// In dev it is left unset, so the Vite proxy handles /api/* transparently.
setBaseUrl(import.meta.env.VITE_API_SERVER_URL ?? "");

createRoot(document.getElementById("root")!).render(<App />);
