# Cashflow Tracker — Claude Context

## Project Overview
Full-stack personal finance web app built with:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: JWT + PBKDF2 password hashing
- **Deployment**: Cloudflare Pages

## Features Implemented
- Authentication (login, logout, setup, password reset)
- Budget periods (open/close)
- Income tracking
- Bills tracking (with toggle paid/unpaid)
- Expense tracking
- Debt tracking + payment history
- Savings goals + contributions
- Analytics (cashflow charts, summary)
- Dark/light mode
- Responsive layout (desktop sidebar + mobile bottom nav)

## Task History

### 1. Initial Build — Complete Cashflow Tracker Application
- Built entire full-stack app from scratch
- All Pages Functions under `functions/api/` with shared utilities in `functions/_shared/`
- Database schema in `migrations/0001_initial.sql`
- Full React SPA with pages: Dashboard, Income, Bills, Expenses, Debt, Savings, Analytics, Budget Periods, Login, Setup, Reset Password

### 2. Fix `_shared` Import Paths in Pages Functions
- **Problem**: All `_shared` imports had one extra `../` level, causing esbuild to fail
- **Fix**: Corrected relative depths — `functions/api/` → `../_shared/`, `functions/api/X/` → `../../_shared/`, `functions/api/X/[id]/` → `../../../_shared/`
- Also updated `wrangler.toml` with real D1 `database_id`

### 3. Fix Dev Server Refresh Loop (Vite + Wrangler)
- **Problem**: Running `wrangler pages dev` against static `dist/` injected a live-reload script causing constant page refreshes
- **Fix**: Run Vite (port 5173) and Wrangler (port 8788) separately — Wrangler proxies to Vite so it only handles Pages Functions; Vite handles frontend with HMR

### 4. Fix Infinite Redirect Loop on Login Page
- **Problem**: `src/lib/api.ts` 401 handler unconditionally redirected to `/login`, even when `AuthContext` called `/api/auth/me` from the login page, causing a full-page reload loop
- **Fix**: Only redirect to `/login` when not already on a public route (`/login`, `/setup`, `/reset-password`)

### 5. Fix Dev Workflow — Serve from `dist/` Instead of `--proxy` Mode
- **Problem**: `wrangler.toml` sets `pages_build_output_dir=dist`, so Wrangler always fell back to `dist/index.html` for SPA routing even in `--proxy` mode, serving stale built JS
- **Fix**: Simplified workflow — build with `npm run build`, then `wrangler pages dev dist`. Must rebuild `dist/` after any frontend changes.
- Updated `SETUP.md` and `package.json` accordingly

## Dev Workflow
```bash
# Build frontend first
npm run build

# Serve locally (Wrangler handles Pages Functions + serves dist/)
wrangler pages dev dist
```
Access at: `http://localhost:8788`

## Key Files
- `src/lib/api.ts` — Axios-based API client with JWT auth + 401 redirect logic
- `src/context/AuthContext.tsx` — Auth state, login/logout, me() check
- `functions/_shared/auth.ts` — JWT verify + PBKDF2 helpers
- `functions/_shared/response.ts` — Typed JSON response helpers
- `wrangler.toml` — Pages config, D1 binding, build output dir
- `migrations/0001_initial.sql` — Full DB schema
