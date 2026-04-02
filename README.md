# Expert-Coder (Saatvik Jain Aahar Gruh) - Local Setup

This repo is a `pnpm` workspace containing:
- `@workspace/api-server` (Express API)
- `@workspace/tiffin-web` (Vite + React frontend)
- `@workspace/db` (Drizzle schema + `drizzle-kit` push)

The frontend calls the backend using absolute `/api/*` URLs, so in local dev the Vite server proxies `/api` to the API server automatically.

## Prerequisites

- Node.js (modern LTS recommended)
- `pnpm` (recommended via `corepack`)
- PostgreSQL database

```bash
corepack enable
pnpm --version
```

## Quick Start (single command)

### 1) Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values — at minimum set `DATABASE_URL` and `SESSION_SECRET`:

```dotenv
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/DB_NAME
SESSION_SECRET=change-me-to-a-long-random-string
API_PORT=3001
WEB_PORT=3000
BASE_PATH=/
```

### 2) Run

```bash
pnpm dev
```

That single command will:
1. Validate `.env` exists (exits with a clear error if not)
2. Install all workspace dependencies (`pnpm install`)
3. Push the DB schema via Drizzle (`drizzle-kit push`)
4. Seed the database (admin user + menu items)
5. Start the API server and web frontend in parallel (via `concurrently`)

Once running:
| Service      | URL                                      |
|--------------|------------------------------------------|
| Web App      | http://localhost:3000/                   |
| API Health   | http://localhost:3001/api/healthz        |

Default admin credentials:
- Email: `admin@saatvik.com`
- Password: `admin123`

---

## Manual Steps (advanced)

If you need to run steps individually:

```bash
# 1. Install dependencies
pnpm install

# 2. Push DB schema
DATABASE_URL="..." pnpm --filter @workspace/db push

# 3. Seed data
DATABASE_URL="..." pnpm --filter @workspace/scripts exec tsx ../artifacts/api-server/seed.mjs

# 4a. Start API server
PORT=3001 DATABASE_URL="..." SESSION_SECRET="..." pnpm --filter @workspace/api-server dev

# 4b. Start web frontend (separate terminal)
PORT=3000 BASE_PATH="/" API_SERVER_URL="http://localhost:3001" pnpm --filter @workspace/tiffin-web dev
```

## Notes

- If you change `BASE_PATH`, make sure you open the correct URL path (Vite base path).
- In production, configure your reverse proxy (nginx/caddy/etc.) to forward `/api/*` to the API server.
