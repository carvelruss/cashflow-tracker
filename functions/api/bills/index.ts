import { success, error, parseBody, generateId, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const url = new URL(request.url);
  const periodId = url.searchParams.get('period_id');
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  const status = url.searchParams.get('status') || '';

  if (!periodId) return error('period_id is required');

  let query = 'SELECT * FROM bills WHERE user_id = ? AND budget_period_id = ?';
  const bindings: unknown[] = [userId, periodId];

  if (search) { query += ' AND name LIKE ?'; bindings.push(`%${search}%`); }
  if (category) { query += ' AND category = ?'; bindings.push(category); }
  if (status) { query += ' AND status = ?'; bindings.push(status); }
  query += ' ORDER BY due_date ASC, created_at DESC';

  const rows = await env.DB.prepare(query).bind(...bindings).all();
  return success(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const body = await parseBody<{
    budget_period_id: string; name: string; amount: number;
    due_date: string; category: string; notes?: string;
  }>(request);

  if (!body?.budget_period_id || !body?.name || !body?.amount || !body?.due_date || !body?.category)
    return error('budget_period_id, name, amount, due_date, and category are required');
  if (body.amount <= 0) return error('Amount must be greater than 0');

  const period = await env.DB.prepare('SELECT id FROM budget_periods WHERE id = ? AND user_id = ?')
    .bind(body.budget_period_id, userId).first();
  if (!period) return error('Budget period not found', 404);

  const id = generateId();
  const now = nowISO();
  await env.DB.prepare(
    'INSERT INTO bills (id, user_id, budget_period_id, name, amount, due_date, category, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, body.budget_period_id, body.name, body.amount, body.due_date, body.category, 'unpaid', body.notes ?? null, now, now).run();

  const created = await env.DB.prepare('SELECT * FROM bills WHERE id = ?').bind(id).first();
  return success(created, 201);
};
