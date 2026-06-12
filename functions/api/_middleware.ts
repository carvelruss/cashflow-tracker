import { verifyJWT, getTokenFromRequest } from '../_shared/auth';
import { unauthorized } from '../_shared/response';
import type { Env } from '../_shared/types';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/setup',
  '/api/auth/reset-password',
  '/api/auth/reset-password-confirm',
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env, data } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  const token = getTokenFromRequest(request);
  if (!token) return unauthorized();

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return unauthorized('Invalid or expired session');

  data.userId = payload.sub;
  data.email = payload.email;
  data.username = payload.username;

  return next();
};
