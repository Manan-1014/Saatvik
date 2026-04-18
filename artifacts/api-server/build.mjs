import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

// Some tooling may use `require` to resolve dependencies during the build
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

/** npm packages to load from node_modules at runtime; keep @workspace/* bundled (compiled TS). */
function npmExternalsFromPackageJson() {
  const pkgPath = path.join(artifactDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const names = new Set();
  for (const section of [pkg.dependencies, pkg.devDependencies]) {
    if (!section) continue;
    for (const name of Object.keys(section)) {
      if (name.startsWith("@workspace/")) continue;
      if (name.startsWith("@types/")) continue;
      if (name === "esbuild" || name === "tsx") continue;
      names.add(name);
    }
  }
  for (const extra of [
    "pino-file",
    // Transitive deps used by bundled @workspace/* packages (keep out of dist for size)
    "zod",
    "drizzle-zod",
    "pg",
  ]) {
    names.add(extra);
  }
  return [...names];
}

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: [
      ...npmExternalsFromPackageJson(),
      "*.node",
    ],
    sourcemap: "linked",
    // Make sure packages that are cjs only (e.g. express) but are bundled continue to work in our esm output file
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
