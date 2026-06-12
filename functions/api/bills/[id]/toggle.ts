import { success, notFound, nowISO } from '../../../../_shared/response';
import type { Env } from '../../../../_shared/types';

export const onRequestPost: PagesFunction<Env> = async ({ env, data, params }) => {
  const id = params.id as string;
  const bill = await env.DB.prepare('SELECT id, status FROM bills WHERE id = ? AND user_id = ?')
    .bind(id, data.userId).first<{ id: string; status: string }>();
  if (!bill) return notFound('Bill not found');

  const newStatus = bill.status === 'paid' ? 'unpaid' : 'paid';
  await env.DB.prepare('UPDATE bills SET status = ?, updated_at = ? WHERE id = ?')
    .bind(newStatus, nowISO(), id).run();

  return success(await env.DB.prepare('SELECT * FROM bills WHERE id = ?').bind(id).first());
};
