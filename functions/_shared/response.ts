const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json<T>(data: T, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function success<T>(data: T, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return json({ success: true, data }, status, extraHeaders);
}

export function error(message: string, status = 400, details?: unknown): Response {
  return json({ success: false, error: message, details }, status);
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden'): Response {
  return error(message, 403);
}

export function notFound(message = 'Not found'): Response {
  return error(message, 404);
}

export function methodNotAllowed(): Response {
  return error('Method not allowed', 405);
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function nowISO(): string {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}
