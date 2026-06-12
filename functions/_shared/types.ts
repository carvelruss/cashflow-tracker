export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  SETUP_KEY?: string;
}

export interface JWTPayload {
  sub: string;      // user id
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthData {
  userId: string;
  email: string;
  username: string;
}

export type RequestContext<E = Env> = EventContext<E, string, { userId?: string; email?: string; username?: string }>;
