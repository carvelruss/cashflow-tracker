import { success, error, parseBody, generateId, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const url = new URL(request.url);
  const periodId = url.searchParams.get('period_id');
  if (!periodId) return error('period_id is required');

  const rows = await env.DB.prepare(
    'SELECT * FROM savings_goals WHERE user_id = ? AND budget_period_id = ? ORDER BY created_at DESC'
  ).bind(userId, periodId).all();
  return success(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const body = await parseBody<{
    budget_period_id: string; goal_name: string; target_amount: number;
    current_amount?: number; target_date?: string; notes?: string;
  }>(request);

  if (!body?.budget_period_id || !body?.goal_name || !body?.target_amount)
    return error('budget_period_id, goal_name, and target_amount are required');
  if (body.target_amount <= 0) return error('target_amount must be greater than 0');
  if ((body.current_amount ?? 0) < 0) return error('current_amount cannot be negative');

  const period = await env.DB.prepare('SELECT id FROM budget_periods WHERE id = ? AND user_id = ?')
    .bind(body.budget_period_id, userId).first();
  if (!period) return error('Budget period not found', 404);

  const id = generateId();
  const now = nowISO();
  await env.DB.prepare(
    'INSERT INTO savings_goals (id, user_id, budget_period_id, goal_name, target_amount, current_amount, target_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, body.budget_period_id, body.goal_name, body.target_amount, body.current_amount ?? 0, body.target_date ?? null, body.notes ?? null, now, now).run();

  const created = await env.DB.prepare('SELECT * FROM savings_goals WHERE id = ?').bind(id).first();
  return success(created, 201);
};
