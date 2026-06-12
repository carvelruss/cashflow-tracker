# Cashflow Tracker — Setup & Deployment Guide

A personal cashflow and budget tracking application built with React + TypeScript + Vite,
deployed on Cloudflare Pages with Cloudflare D1 (SQLite) as the database.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18 + TypeScript + Tailwind CSS    |
| Charts     | Recharts                                |
| Forms      | React Hook Form + Zod                   |
| Icons      | Lucide React                            |
| Backend    | Cloudflare Pages Functions (Workers)    |
| Database   | Cloudflare D1 (SQLite)                  |
| Auth       | JWT in httpOnly cookie + PBKDF2 hashing |
| Deploy     | Cloudflare Pages                        |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) v3+
  ```
  npm install -g wrangler
  wrangler login
  ```
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)

---

## Quick Start (Local Development)

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Cloudflare D1 database
```bash
npm run db:create
# Note the database_id from the output — you'll need it
```

### 3. Update wrangler.toml
Replace `YOUR_D1_DATABASE_ID` in `wrangler.toml` with your actual database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "cashflow-tracker-db"
database_id = "abc123-your-actual-id-here"
```

### 4. Run the database migration
```bash
# Local only (for development)
npm run db:migrate:local
```

### 5. Configure local environment variables
The `.dev.vars` file is already created with development defaults.
Edit it to set a proper `JWT_SECRET`:
```
JWT_SECRET=your-long-random-secret-at-least-32-characters
SETUP_KEY=your-optional-setup-key
```

### 6. Build and start the dev server

```bash
npm run build         # compile frontend into dist/
npm run dev:wrangler  # serve dist/ + run Pages Functions + D1
```

Open http://localhost:8788 in your browser.

> When you change frontend code, run `npm run build` again and refresh the browser.
> Function changes (files under `functions/`) are picked up automatically by Wrangler.

### 7. Create your account
Navigate to http://localhost:8788/setup to create your account.

---

## Production Deployment

### 1. Run the remote database migration
```bash
npm run db:migrate:remote
```

### 2. Set production secrets
```bash
# Required: JWT signing secret (use a strong, random 32+ char string)
wrangler secret put JWT_SECRET

# Optional: Protect the /setup endpoint during deployment
wrangler secret put SETUP_KEY
```

### 3. Deploy to Cloudflare Pages
```bash
npm run deploy
```

Or connect your GitHub repository to Cloudflare Pages for automatic deploys:
1. Go to https://dash.cloudflare.com → Pages → Create a project
2. Connect your Git repository
3. Set build command: `npm run build`
4. Set build output directory: `dist`
5. Add environment variables in the dashboard under Settings → Environment Variables

### 4. Create your account
After deployment, visit `https://your-app.pages.dev/setup` to create your account.

If you set `SETUP_KEY`, you'll need to provide it during setup (or include it in the
`X-Setup-Key` header when calling the API directly).

---

## Environment Variables

| Variable     | Required | Description                                        |
|--------------|----------|----------------------------------------------------|
| `JWT_SECRET` | Yes      | Secret key for signing JWT tokens. Min 32 chars.   |
| `SETUP_KEY`  | No       | Key required to access the `/api/auth/setup` endpoint. If not set, anyone can create the first account. |

Set secrets with:
```bash
wrangler secret put JWT_SECRET
wrangler secret put SETUP_KEY
```

Set non-secret variables in the Cloudflare Pages dashboard under:
Settings → Environment Variables → Add variable.

---

## Database Schema

The application uses 9 tables in Cloudflare D1 (SQLite):

| Table                    | Description                                 |
|--------------------------|---------------------------------------------|
| `users`                  | Single application user                     |
| `password_reset_tokens`  | Temporary tokens for password resets        |
| `budget_periods`         | Monthly/custom budget periods               |
| `income`                 | Income entries per period                   |
| `bills`                  | Recurring/one-time bills                    |
| `expenses`               | Expense transactions                        |
| `debts`                  | Tracked debts with remaining balance        |
| `debt_payments`          | Payment history for debts                   |
| `savings_goals`          | Savings goals with target amounts           |
| `savings_contributions`  | Contributions to savings goals              |

Migration file: `migrations/0001_initial.sql`

---

## API Endpoints

All endpoints are under `/api/`. Protected endpoints require a valid auth cookie.

### Authentication (Public)
```
GET  /api/auth/setup              — Check if account is created
POST /api/auth/setup              — Create account (first time only)
POST /api/auth/login              — Login, sets auth_token cookie
POST /api/auth/logout             — Logout, clears cookie
GET  /api/auth/me                 — Get current user (protected)
POST /api/auth/reset-password     — Request password reset token
POST /api/auth/reset-password-confirm — Apply reset token + new password
```

### Budget Periods (Protected)
```
GET    /api/budget-periods        — List all periods
POST   /api/budget-periods        — Create a period
GET    /api/budget-periods/:id    — Get single period
PUT    /api/budget-periods/:id    — Update period
DELETE /api/budget-periods/:id    — Delete period (cascades all data)
POST   /api/budget-periods/:id/close — Mark period as closed
```

### Income / Bills / Expenses (Protected)
```
GET    /api/income?period_id=...  — List (supports ?search=)
POST   /api/income                — Create
PUT    /api/income/:id            — Update
DELETE /api/income/:id            — Delete

GET    /api/bills?period_id=...   — List (supports ?search=, ?category=, ?status=)
POST   /api/bills                 — Create
PUT    /api/bills/:id             — Update
DELETE /api/bills/:id             — Delete
POST   /api/bills/:id/toggle      — Toggle paid/unpaid

GET    /api/expenses?period_id=...— List (supports ?search=, ?category=)
POST   /api/expenses              — Create
PUT    /api/expenses/:id          — Update
DELETE /api/expenses/:id          — Delete
```

### Debts & Savings (Protected)
```
GET    /api/debts?period_id=...   — List debts
POST   /api/debts                 — Create debt
PUT    /api/debts/:id             — Update debt
DELETE /api/debts/:id             — Delete debt (cascades payments)
GET    /api/debts/:id/payments    — List payments
POST   /api/debts/:id/payments    — Record payment (auto-reduces balance)

GET    /api/savings?period_id=... — List savings goals
POST   /api/savings               — Create goal
PUT    /api/savings/:id           — Update goal
DELETE /api/savings/:id           — Delete goal (cascades contributions)
GET    /api/savings/:id/contributions — List contributions
POST   /api/savings/:id/contributions — Add contribution (auto-increases amount)
```

### Analytics (Protected)
```
GET /api/analytics/summary?period_id=... — Full period summary
GET /api/analytics/cashflow              — Last 12 periods cashflow trend
```

---

## Project Structure

```
cashflow-tracker/
├── dist/                     # Production build output
├── functions/                # Cloudflare Pages Functions (API)
│   ├── _shared/              # Shared utilities (not routed)
│   │   ├── auth.ts           # JWT + PBKDF2 password hashing
│   │   ├── response.ts       # Response helpers
│   │   └── types.ts          # Shared TypeScript interfaces
│   └── api/
│       ├── _middleware.ts    # Auth guard for all /api/* routes
│       ├── auth/             # Login, logout, setup, reset-password
│       ├── budget-periods/   # CRUD + close
│       ├── income/           # CRUD
│       ├── bills/            # CRUD + toggle
│       ├── expenses/         # CRUD
│       ├── debts/            # CRUD + payments
│       ├── savings/          # CRUD + contributions
│       └── analytics/        # Summary + cashflow data
├── migrations/
│   └── 0001_initial.sql      # Database schema
├── public/                   # Static assets
├── src/                      # React frontend
│   ├── components/
│   │   ├── ui/               # Reusable: Button, Input, Modal, Card, Badge…
│   │   ├── layout/           # AppLayout, Sidebar, Header, MobileNav
│   │   ├── income/           # IncomeForm
│   │   ├── bills/            # BillForm
│   │   ├── expenses/         # ExpenseForm
│   │   ├── debt/             # DebtForm, PaymentForm
│   │   └── savings/          # SavingsForm, ContributionForm
│   ├── context/              # AuthContext, BudgetPeriodContext
│   ├── lib/                  # api.ts (typed API client)
│   ├── pages/                # LoginPage, DashboardPage, all module pages…
│   ├── types/                # TypeScript interfaces
│   └── utils/                # currency.ts, date.ts, cn.ts
├── .dev.vars                 # Local environment variables (gitignored)
├── .env.example              # Environment variable documentation
├── wrangler.toml             # Cloudflare configuration
└── package.json
```

---

## Security Notes

1. **Password hashing**: Uses PBKDF2 with SHA-256, 100,000 iterations, random 16-byte salt.
2. **JWT tokens**: HMAC-SHA256 signed, stored in httpOnly + Secure + SameSite=Strict cookies.
3. **Single-user**: The setup endpoint creates exactly one account. Subsequent calls return 409.
4. **Password reset**: For personal use, the reset token is returned in the API response. In a
   multi-user production environment, replace this with an email delivery service.
5. **SETUP_KEY**: Set this to prevent unauthorized account creation during initial deployment.
6. **D1 isolation**: All queries are parameterized, preventing SQL injection.
7. **Auth middleware**: All `/api/*` routes except public endpoints are protected by JWT validation.

---

## Features Summary

| Module          | Features                                                         |
|-----------------|------------------------------------------------------------------|
| Authentication  | Login, logout, remember me, password reset                       |
| Budget Periods  | Create, edit, delete, close; auto-select active period           |
| Income          | CRUD, search by source                                           |
| Bills           | CRUD, mark paid/unpaid toggle, overdue/due-soon indicators, filter by category/status |
| Expenses        | CRUD, search, filter by category, spending breakdown by category |
| Debt            | CRUD, record payments (auto-reduces balance), progress tracking  |
| Savings         | CRUD, add contributions (auto-increases amount), progress bars   |
| Analytics       | Budget vs actual chart, spending breakdown pie, cashflow trend   |
| UI              | Dark/light mode, responsive, mobile sidebar, Philippine Peso ₱   |

---

## Updating Dependencies

```bash
npm update
npm run build  # Verify build still works
```
