import { success, error, parseBody, generateId, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

interface PeriodRow {
  id: string; name: string; start_date: string; end_date: string; status: string; created_at: string; updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const userId = data.userId as string;
  const rows = await env.DB.prepare(
    'SELECT id, name, start_date, end_date, status, created_at, updated_at FROM budget_periods WHERE user_id = ? ORDER BY start_date DESC'
  ).bind(userId).all<PeriodRow>();
  return success(rows.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const body = await parseBody<{ name: string; start_date: string; end_date: string }>(request);
  if (!body?.name || !body?.start_date || !body?.end_date) return error('name, start_date, and end_date are required');
  if (body.start_date >= body.end_date) return error('start_date must be before end_date');

  const id = generateId();
  const now = nowISO();
  await env.DB.prepare(
    'INSERT INTO budget_periods (id, user_id, name, start_date, end_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, body.name, body.start_date, body.end_date, 'active', now, now).run();

  const created = await env.DB.prepare('SELECT * FROM budget_periods WHERE id = ?').bind(id).first<PeriodRow>();
  return success(created, 201);
};
