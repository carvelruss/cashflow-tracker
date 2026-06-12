import { success, error, parseBody, notFound, noContent, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

interface ExpenseRow {
  id: string; user_id: string; name: string; category: string;
  amount: number; date: string; notes: string | null;
}

export const onRequestPut: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const id = params.id as string;
  const row = await env.DB.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
    .bind(id, data.userId).first<ExpenseRow>();
  if (!row) return notFound('Expense not found');

  const body = await parseBody<Partial<ExpenseRow>>(request);
  if (!body) return error('Invalid request body');
  const amount = body.amount ?? row.amount;
  if (amount <= 0) return error('Amount must be greater than 0');

  await env.DB.prepare(
    'UPDATE expenses SET name = ?, category = ?, amount = ?, date = ?, notes = ?, updated_at = ? WHERE id = ?'
  ).bind(body.name ?? row.name, body.category ?? row.category, amount, body.date ?? row.date, body.notes ?? row.notes, nowISO(), id).run();

  return success(await env.DB.prepare('SELECT * FROM expenses WHERE id = ?').bind(id).first());
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, data, params }) => {
  const row = await env.DB.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first();
  if (!row) return notFound('Expense not found');
  await env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(params.id).run();
  return noContent();
};
