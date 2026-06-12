import { success, error } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

interface UserRow {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const userId = data.userId as string;
  const user = await env.DB.prepare(
    'SELECT id, email, username, created_at FROM users WHERE id = ?'
  ).bind(userId).first<UserRow>();

  if (!user) return error('User not found', 404);
  return success(user);
};
