import { generateSecureToken } from '../../_shared/auth';
import { success, error, parseBody, generateId, nowISO } from '../../_shared/response';
import type { Env } from '../../_shared/types';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await parseBody<{ email: string }>(request);
  if (!body?.email) return error('Email is required');

  const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?')
    .bind(body.email.toLowerCase())
    .first<{ id: string; email: string }>();

  // Always return success to prevent email enumeration
  if (!user) {
    return success({ message: 'If that email exists, a reset token has been generated.' });
  }

  // Invalidate old tokens
  await env.DB.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(user.id).run();

  const token = generateSecureToken(32);
  const id = generateId();
  const now = nowISO();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

  await env.DB.prepare(
    'INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, user.id, token, expiresAt, now).run();

  // For a personal-use app: return the token directly.
  // In production, send this via email instead.
  return success({
    message: 'Password reset token generated.',
    token,
    note: 'Use this token with the /api/auth/reset-password-confirm endpoint. In production, this would be sent via email.',
  });
};
