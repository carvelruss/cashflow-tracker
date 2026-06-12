import { success, error, parseBody, notFound, noContent, nowISO } from '../../_shared/response';
import type { Env } from '../../_shared/types';

interface IncomeRow {
  id: string; user_id: string; source: string; description: string | null;
  amount: number; date_received: string; notes: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data, params }) => {
  const row = await env.DB.prepare('SELECT * FROM income WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first<IncomeRow>();
  if (!row) return notFound('Income entry not found');
  return success(row);
};

export const onRequestPut: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const id = params.id as string;
  const row = await env.DB.prepare('SELECT * FROM income WHERE id = ? AND user_id = ?')
    .bind(id, data.userId).first<IncomeRow>();
  if (!row) return notFound('Income entry not found');

  const body = await parseBody<Partial<IncomeRow>>(request);
  if (!body) return error('Invalid request body');

  const amount = body.amount ?? row.amount;
  if (amount <= 0) return error('Amount must be greater than 0');

  await env.DB.prepare(
    'UPDATE income SET source = ?, description = ?, amount = ?, date_received = ?, notes = ?, updated_at = ? WHERE id = ?'
  ).bind(
    body.source ?? row.source,
    body.description ?? row.description,
    amount,
    body.date_received ?? row.date_received,
    body.notes ?? row.notes,
    nowISO(), id
  ).run();

  return success(await env.DB.prepare('SELECT * FROM income WHERE id = ?').bind(id).first());
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, data, params }) => {
  const row = await env.DB.prepare('SELECT id FROM income WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first();
  if (!row) return notFound('Income entry not found');
  await env.DB.prepare('DELETE FROM income WHERE id = ?').bind(params.id).run();
  return noContent();
};
