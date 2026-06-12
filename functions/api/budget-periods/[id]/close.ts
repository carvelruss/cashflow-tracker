import { success, notFound, error, nowISO } from '../../../../_shared/response';
import type { Env } from '../../../../_shared/types';

export const onRequestPost: PagesFunction<Env> = async ({ env, data, params }) => {
  const userId = data.userId as string;
  const id = params.id as string;

  const period = await env.DB.prepare(
    'SELECT id, status FROM budget_periods WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first<{ id: string; status: string }>();

  if (!period) return notFound('Budget period not found');
  if (period.status === 'closed') return error('Budget period is already closed');

  await env.DB.prepare(
    'UPDATE budget_periods SET status = ?, updated_at = ? WHERE id = ?'
  ).bind('closed', nowISO(), id).run();

  const updated = await env.DB.prepare('SELECT * FROM budget_periods WHERE id = ?').bind(id).first();
  return success(updated);
};
