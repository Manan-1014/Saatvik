#!/usr/bin/env node
/**
 * Enforces pnpm for installs (see root package.json "packageManager").
 * npm/yarn will fail fast with a clear message.
 */
const ua = process.env.npm_config_user_agent ?? "";
if (!ua.includes("pnpm")) {
  console.error("");
  console.error("This workspace must use pnpm (see package.json packageManager).");
  console.error("  Run:  pnpm install");
  console.error("");
  process.exit(1);
}
