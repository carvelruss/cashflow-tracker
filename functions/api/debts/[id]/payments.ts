import { success, error, parseBody, notFound, generateId, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data, params }) => {
  const debt = await env.DB.prepare('SELECT id FROM debts WHERE id = ? AND user_id = ?')
    .bind(params.id, data.userId).first();
  if (!debt) return notFound('Debt not found');

  const payments = await env.DB.prepare(
    'SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY payment_date DESC'
  ).bind(params.id).all();
  return success(payments.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, data, params, request }) => {
  const debtId = params.id as string;
  const debt = await env.DB.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?')
    .bind(debtId, data.userId).first<{ id: string; remaining_balance: number }>();
  if (!debt) return notFound('Debt not found');

  const body = await parseBody<{ amount: number; payment_date: string; notes?: string }>(request);
  if (!body?.amount || !body?.payment_date) return error('amount and payment_date are required');
  if (body.amount <= 0) return error('Amount must be greater than 0');

  const id = generateId();
  const now = nowISO();
  const newBalance = Math.max(0, debt.remaining_balance - body.amount);

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO debt_payments (id, debt_id, amount, payment_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, debtId, body.amount, body.payment_date, body.notes ?? null, now),
    env.DB.prepare('UPDATE debts SET remaining_balance = ?, updated_at = ? WHERE id = ?')
      .bind(newBalance, now, debtId),
  ]);

  const created = await env.DB.prepare('SELECT * FROM debt_payments WHERE id = ?').bind(id).first();
  return success(created, 201);
};
