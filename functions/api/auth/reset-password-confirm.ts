import { hashPassword } from '../../../_shared/auth';
import { success, error, parseBody, nowISO } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

interface ResetBody {
  token: string;
  password: string;
}

interface TokenRow {
  id: string;
  user_id: string;
  expires_at: string;
  used_at: string | null;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await parseBody<ResetBody>(request);
  if (!body?.token || !body?.password) return error('Token and new password are required');
  if (body.password.length < 8) return error('Password must be at least 8 characters');

  const tokenRow = await env.DB.prepare(
    'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?'
  ).bind(body.token).first<TokenRow>();

  if (!tokenRow) return error('Invalid or expired reset token', 400);
  if (tokenRow.used_at) return error('This reset token has already been used', 400);

  const expiresAt = new Date(tokenRow.expires_at.replace(' ', 'T') + 'Z').getTime();
  if (expiresAt < Date.now()) return error('Reset token has expired', 400);

  const { hash, salt } = await hashPassword(body.password);
  const now = nowISO();

  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?')
      .bind(hash, salt, now, tokenRow.user_id),
    env.DB.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?')
      .bind(now, tokenRow.id),
  ]);

  return success({ message: 'Password reset successfully. You can now log in with your new password.' });
};
