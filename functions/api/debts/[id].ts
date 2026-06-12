import { success, error, parseBody, notFound, noContent, nowISO } from '../../_shared/response';
import type { Env } from '../../_shared/types';

interface DebtRow {
  id: string; user_id: string; name: string; creditor: string;
  original_amount: number; remaining_balance: number; monthly_payment: number;
  due_date: string | null; notes: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data, params }) => {
  const debt = await env.DB.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first<DebtRow>();
  if (!debt) return notFound('Debt not found');

  const payments = await env.DB.prepare('SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY payment_date DESC')
    .bind(params.id).all();

  return success({ ...debt, payments: payments.results });
};

export const onRequestPut: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const id = params.id as string;
  const row = await env.DB.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?')
    .bind(id, data.userId).first<DebtRow>();
  if (!row) return notFound('Debt not found');

  const body = await parseBody<Partial<DebtRow>>(request);
  if (!body) return error('Invalid request body');

  await env.DB.prepare(
    'UPDATE debts SET name = ?, creditor = ?, original_amount = ?, remaining_balance = ?, monthly_payment = ?, due_date = ?, notes = ?, updated_at = ? WHERE id = ?'
  ).bind(
    body.name ?? row.name, body.creditor ?? row.creditor,
    body.original_amount ?? row.original_amount, body.remaining_balance ?? row.remaining_balance,
    body.monthly_payment ?? row.monthly_payment, body.due_date ?? row.due_date,
    body.notes ?? row.notes, nowISO(), id
  ).run();

  return success(await env.DB.prepare('SELECT * FROM debts WHERE id = ?').bind(id).first());
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, data, params }) => {
  const row = await env.DB.prepare('SELECT id FROM debts WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first();
  if (!row) return notFound('Debt not found');
  await env.DB.prepare('DELETE FROM debts WHERE id = ?').bind(params.id).run();
  return noContent();
};
