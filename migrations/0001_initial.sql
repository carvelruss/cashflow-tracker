-- Cashflow Tracker — Initial Schema
-- Cloudflare D1 (SQLite)

-- Users (single user application)
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email       TEXT UNIQUE NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Budget periods
CREATE TABLE IF NOT EXISTS budget_periods (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Income entries
CREATE TABLE IF NOT EXISTS income (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_period_id TEXT NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  source           TEXT NOT NULL,
  description      TEXT,
  amount           REAL NOT NULL CHECK (amount > 0),
  date_received    TEXT NOT NULL,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bills
CREATE TABLE IF NOT EXISTS bills (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_period_id TEXT NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  amount           REAL NOT NULL CHECK (amount > 0),
  due_date         TEXT NOT NULL,
  category         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_period_id TEXT NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  amount           REAL NOT NULL CHECK (amount > 0),
  date             TEXT NOT NULL,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_period_id  TEXT NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  creditor          TEXT NOT NULL,
  original_amount   REAL NOT NULL CHECK (original_amount > 0),
  remaining_balance REAL NOT NULL CHECK (remaining_balance >= 0),
  monthly_payment   REAL NOT NULL CHECK (monthly_payment >= 0),
  due_date          TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Debt payments
CREATE TABLE IF NOT EXISTS debt_payments (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  debt_id      TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount       REAL NOT NULL CHECK (amount > 0),
  payment_date TEXT NOT NULL,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_period_id TEXT NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  goal_name        TEXT NOT NULL,
  target_amount    REAL NOT NULL CHECK (target_amount > 0),
  current_amount   REAL NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date      TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Savings contributions
CREATE TABLE IF NOT EXISTS savings_contributions (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  savings_goal_id   TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount            REAL NOT NULL CHECK (amount > 0),
  contribution_date TEXT NOT NULL,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_periods_user_id   ON budget_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_periods_status    ON budget_periods(status);
CREATE INDEX IF NOT EXISTS idx_income_budget_period_id  ON income(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_income_date_received     ON income(date_received);
CREATE INDEX IF NOT EXISTS idx_bills_budget_period_id   ON bills(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_bills_status             ON bills(status);
CREATE INDEX IF NOT EXISTS idx_expenses_budget_period_id ON expenses(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date            ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category        ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_debts_budget_period_id   ON debts(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id    ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_budget_period_id ON savings_goals(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal_id  ON savings_contributions(savings_goal_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token    ON password_reset_tokens(token);
