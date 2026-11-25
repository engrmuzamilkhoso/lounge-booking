/**
 * Session cookie settings shared by Server Actions and the proxy (which cannot import
 * `server-only` modules that use `next/headers`).
 */
export const ACCESS_TOKEN_COOKIE = 'majestic_access';
export const REFRESH_TOKEN_COOKIE = 'majestic_refresh';

export function sessionCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
} {
  return {
    // Not readable from browser JavaScript, so an XSS bug cannot steal the session.
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}
