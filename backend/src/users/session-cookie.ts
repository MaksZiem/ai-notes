import type { CookieOptions } from 'express';

export const SESSION_COOKIE = 'notes_session';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function readSessionToken(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      const value = rest.join('=');
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

export function clearSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function sessionCookieOptions(): CookieOptions {
  return { ...clearSessionCookieOptions(), maxAge: SESSION_MAX_AGE_MS };
}
