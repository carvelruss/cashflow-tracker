import { hashPassword } from '../../_shared/auth';
import { json, success, error, parseBody, generateId, nowISO } from '../../_shared/response';
import type { Env } from '../../_shared/types';

interface SetupBody {
  email: string;
  username: string;
  password: string;
  setupKey?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const row = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  return success({ isSetup: (row?.count ?? 0) > 0 });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const existing = await env.DB.prepare('SELECT id FROM users LIMIT 1').first();
  if (existing) return error('Application is already set up. Only one user is allowed.', 409);

  if (env.SETUP_KEY) {
    const key = request.headers.get('X-Setup-Key') || '';
    const body = await request.clone().json().catch(() => ({} as SetupBody));
    const providedKey = (body as SetupBody).setupKey || key;
    if (providedKey !== env.SETUP_KEY) return error('Invalid setup key', 403);
  }

  const body = await parseBody<SetupBody>(request);
  if (!body) return error('Invalid request body');

  const { email, username, password } = body;
  if (!email || !username || !password) return error('email, username, and password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Invalid email address');
  if (username.length < 3) return error('Username must be at least 3 characters');
  if (password.length < 8) return error('Password must be at least 8 characters');

  const { hash, salt } = await hashPassword(password);
  const id = generateId();
  const now = nowISO();

  await env.DB.prepare(
    'INSERT INTO users (id, email, username, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email.toLowerCase(), username, hash, salt, now, now).run();

  return success({ message: 'Account created successfully. You can now log in.' }, 201);
};
