import { success, error, parseBody, notFound, noContent, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

interface GoalRow {
  id: string; user_id: string; goal_name: string; target_amount: number;
  current_amount: number; target_date: string | null; notes: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data, params }) => {
  const goal = await env.DB.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first<GoalRow>();
  if (!goal) return notFound('Savings goal not found');

  const contribs = await env.DB.prepare(
    'SELECT * FROM savings_contributions WHERE savings_goal_id = ? ORDER BY contribution_date DESC'
  ).bind(params.id).all();

  return success({ ...goal, contributions: contribs.results });
};

export const onRequestPut: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const id = params.id as string;
  const row = await env.DB.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?')
    .bind(id, data.userId).first<GoalRow>();
  if (!row) return notFound('Savings goal not found');

  const body = await parseBody<Partial<GoalRow>>(request);
  if (!body) return error('Invalid request body');

  await env.DB.prepare(
    'UPDATE savings_goals SET goal_name = ?, target_amount = ?, current_amount = ?, target_date = ?, notes = ?, updated_at = ? WHERE id = ?'
  ).bind(
    body.goal_name ?? row.goal_name, body.target_amount ?? row.target_amount,
    body.current_amount ?? row.current_amount, body.target_date ?? row.target_date,
    body.notes ?? row.notes, nowISO(), id
  ).run();

  return success(await env.DB.prepare('SELECT * FROM savings_goals WHERE id = ?').bind(id).first());
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, data, params }) => {
  const row = await env.DB.prepare('SELECT id FROM savings_goals WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first();
  if (!row) return notFound('Savings goal not found');
  await env.DB.prepare('DELETE FROM savings_goals WHERE id = ?').bind(params.id).run();
  return noContent();
};
