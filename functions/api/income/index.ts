import { success, error, parseBody, generateId, nowISO } from '../../_shared/response';
import type { Env } from '../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const url = new URL(request.url);
  const periodId = url.searchParams.get('period_id');
  const search = url.searchParams.get('search') || '';

  if (!periodId) return error('period_id is required');

  let query = 'SELECT * FROM income WHERE user_id = ? AND budget_period_id = ?';
  const bindings: unknown[] = [userId, periodId];

  if (search) {
    query += ' AND (source LIKE ? OR description LIKE ?)';
    bindings.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY date_received DESC, created_at DESC';

  const rows = await env.DB.prepare(query).bind(...bindings).all();
  return success(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const body = await parseBody<{
    budget_period_id: string; source: string; description?: string;
    amount: number; date_received: string; notes?: string;
  }>(request);

  if (!body?.budget_period_id || !body?.source || !body?.amount || !body?.date_received)
    return error('budget_period_id, source, amount, and date_received are required');
  if (body.amount <= 0) return error('Amount must be greater than 0');

  const period = await env.DB.prepare('SELECT id FROM budget_periods WHERE id = ? AND user_id = ?')
    .bind(body.budget_period_id, userId).first();
  if (!period) return error('Budget period not found', 404);

  const id = generateId();
  const now = nowISO();
  await env.DB.prepare(
    'INSERT INTO income (id, user_id, budget_period_id, source, description, amount, date_received, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, body.budget_period_id, body.source, body.description ?? null, body.amount, body.date_received, body.notes ?? null, now, now).run();

  const created = await env.DB.prepare('SELECT * FROM income WHERE id = ?').bind(id).first();
  return success(created, 201);
};
