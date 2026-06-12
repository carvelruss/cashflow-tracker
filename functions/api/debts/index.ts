import { success, error, parseBody, generateId, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const url = new URL(request.url);
  const periodId = url.searchParams.get('period_id');
  if (!periodId) return error('period_id is required');

  const rows = await env.DB.prepare(
    'SELECT * FROM debts WHERE user_id = ? AND budget_period_id = ? ORDER BY created_at DESC'
  ).bind(userId, periodId).all();
  return success(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const body = await parseBody<{
    budget_period_id: string; name: string; creditor: string;
    original_amount: number; remaining_balance: number; monthly_payment: number;
    due_date?: string; notes?: string;
  }>(request);

  if (!body?.budget_period_id || !body?.name || !body?.creditor || !body?.original_amount)
    return error('budget_period_id, name, creditor, and original_amount are required');
  if (body.original_amount <= 0) return error('original_amount must be greater than 0');
  if ((body.remaining_balance ?? body.original_amount) < 0) return error('remaining_balance cannot be negative');
  if ((body.monthly_payment ?? 0) < 0) return error('monthly_payment cannot be negative');

  const period = await env.DB.prepare('SELECT id FROM budget_periods WHERE id = ? AND user_id = ?')
    .bind(body.budget_period_id, userId).first();
  if (!period) return error('Budget period not found', 404);

  const id = generateId();
  const now = nowISO();
  const remaining = body.remaining_balance ?? body.original_amount;
  const monthly = body.monthly_payment ?? 0;

  await env.DB.prepare(
    'INSERT INTO debts (id, user_id, budget_period_id, name, creditor, original_amount, remaining_balance, monthly_payment, due_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, body.budget_period_id, body.name, body.creditor, body.original_amount, remaining, monthly, body.due_date ?? null, body.notes ?? null, now, now).run();

  const created = await env.DB.prepare('SELECT * FROM debts WHERE id = ?').bind(id).first();
  return success(created, 201);
};
