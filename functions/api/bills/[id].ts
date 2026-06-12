import { success, error, parseBody, notFound, noContent, nowISO } from '../../_shared/response';
import type { Env } from '../../_shared/types';

interface BillRow {
  id: string; user_id: string; name: string; amount: number;
  due_date: string; category: string; status: string; notes: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data, params }) => {
  const row = await env.DB.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first<BillRow>();
  if (!row) return notFound('Bill not found');
  return success(row);
};

export const onRequestPut: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const id = params.id as string;
  const row = await env.DB.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?')
    .bind(id, data.userId).first<BillRow>();
  if (!row) return notFound('Bill not found');

  const body = await parseBody<Partial<BillRow>>(request);
  if (!body) return error('Invalid request body');

  const amount = body.amount ?? row.amount;
  if (amount <= 0) return error('Amount must be greater than 0');

  await env.DB.prepare(
    'UPDATE bills SET name = ?, amount = ?, due_date = ?, category = ?, status = ?, notes = ?, updated_at = ? WHERE id = ?'
  ).bind(
    body.name ?? row.name, amount,
    body.due_date ?? row.due_date, body.category ?? row.category,
    body.status ?? row.status, body.notes ?? row.notes, nowISO(), id
  ).run();

  return success(await env.DB.prepare('SELECT * FROM bills WHERE id = ?').bind(id).first());
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, data, params }) => {
  const row = await env.DB.prepare('SELECT id FROM bills WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first();
  if (!row) return notFound('Bill not found');
  await env.DB.prepare('DELETE FROM bills WHERE id = ?').bind(params.id).run();
  return noContent();
};
