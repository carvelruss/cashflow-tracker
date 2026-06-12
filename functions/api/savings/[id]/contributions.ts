import { success, error, parseBody, notFound, generateId, nowISO } from '../../../../_shared/response';
import type { Env } from '../../../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data, params }) => {
  const goal = await env.DB.prepare('SELECT id FROM savings_goals WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first();
  if (!goal) return notFound('Savings goal not found');

  const rows = await env.DB.prepare(
    'SELECT * FROM savings_contributions WHERE savings_goal_id = ? ORDER BY contribution_date DESC'
  ).bind(params.id).all();
  return success(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const goalId = params.id as string;
  const goal = await env.DB.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?')
    .bind(goalId, data.userId).first<{ id: string; current_amount: number }>();
  if (!goal) return notFound('Savings goal not found');

  const body = await parseBody<{ amount: number; contribution_date: string; notes?: string }>(request);
  if (!body?.amount || !body?.contribution_date) return error('amount and contribution_date are required');
  if (body.amount <= 0) return error('Amount must be greater than 0');

  const id = generateId();
  const now = nowISO();
  const newAmount = goal.current_amount + body.amount;

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO savings_contributions (id, savings_goal_id, amount, contribution_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, goalId, body.amount, body.contribution_date, body.notes ?? null, now),
    env.DB.prepare('UPDATE savings_goals SET current_amount = ?, updated_at = ? WHERE id = ?')
      .bind(newAmount, now, goalId),
  ]);

  const created = await env.DB.prepare('SELECT * FROM savings_contributions WHERE id = ?').bind(id).first();
  return success(created, 201);
};
