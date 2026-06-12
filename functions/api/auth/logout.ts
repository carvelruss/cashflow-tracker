import type { Env } from '../../_shared/types';

export const onRequestPost: PagesFunction<Env> = async () => {
  const expiredCookie = 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': expiredCookie,
    },
  });
};
