import { verifyPassword, createJWT } from '../../../_shared/auth';
import { success, error, parseBody } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

interface LoginBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  password_salt: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await parseBody<LoginBody>(request);
  if (!body?.email || !body?.password) return error('Email and password are required');

  const user = await env.DB.prepare(
    'SELECT id, email, username, password_hash, password_salt FROM users WHERE email = ?'
  ).bind(body.email.toLowerCase()).first<UserRow>();

  if (!user) return error('Invalid email or password', 401);

  const valid = await verifyPassword(body.password, user.password_hash, user.password_salt);
  if (!valid) return error('Invalid email or password', 401);

  const expiresIn = body.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
  const token = await createJWT({ sub: user.id, email: user.email, username: user.username }, env.JWT_SECRET, expiresIn);

  const cookieMaxAge = body.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  const cookieValue = `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${cookieMaxAge}; Path=/`;

  return success(
    { user: { id: user.id, email: user.email, username: user.username } },
    200,
    { 'Set-Cookie': cookieValue }
  );
};

