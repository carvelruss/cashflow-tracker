import { success, error, parseBody, notFound, noContent, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

interface PeriodRow {
  id: string; user_id: string; name: string; start_date: string; end_date: string; status: string;
}

async function getPeriod(env: Env, id: string, userId: string) {
  return env.DB.prepare('SELECT * FROM budget_periods WHERE id = ? AND user_id = ?').bind(id, userId).first<PeriodRow>();
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data, params }) => {
  const userId = data.userId as string;
  const period = await getPeriod(env, params.id as string, userId);
  if (!period) return notFound('Budget period not found');
  return success(period);
};

export const onRequestPut: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const userId = data.userId as string;
  const id = params.id as string;
  const period = await getPeriod(env, id, userId);
  if (!period) return notFound('Budget period not found');

  const body = await parseBody<{ name?: string; start_date?: string; end_date?: string }>(request);
  if (!body) return error('Invalid request body');

  const name = body.name ?? period.name;
  const start = body.start_date ?? period.start_date;
  const end = body.end_date ?? period.end_date;
  if (start >= end) return error('start_date must be before end_date');

  await env.DB.prepare(
    'UPDATE budget_periods SET name = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?'
  ).bind(name, start, end, nowISO(), id).run();

  const updated = await env.DB.prepare('SELECT * FROM budget_periods WHERE id = ?').bind(id).first();
  return success(updated);
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, data, params }) => {
  const userId = data.userId as string;
  const id = params.id as string;
  const period = await getPeriod(env, id, userId);
  if (!period) return notFound('Budget period not found');

  await env.DB.prepare('DELETE FROM budget_periods WHERE id = ?').bind(id).run();
  return noContent();
};
