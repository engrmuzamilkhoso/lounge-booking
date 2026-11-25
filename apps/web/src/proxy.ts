import { type NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from './lib/auth/session-cookie-names';

interface RefreshedTokens {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
}

const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Keeps the session alive. The access-token cookie expires together with the token; when it is
 * gone but the refresh token is still there, swap the refresh token for a new pair before the
 * page renders, so pages never see an expired session mid-visit.
 *
 * This is only an optimistic step: every protected page and the API still check the session.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  // Background prefetches must not rotate the token in parallel with the real navigation.
  const isPrefetch = request.headers.get('next-router-prefetch') !== null;

  if (hasAccessToken || refreshToken === undefined || isPrefetch) {
    return NextResponse.next();
  }

  const tokens = await refreshSession(refreshToken);
  if (tokens === null) {
    const response = NextResponse.next();
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  // Make the new access token visible to this request's rendering…
  request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
  const response = NextResponse.next({ request: { headers: request.headers } });

  // …and store both tokens in the browser for the next requests.
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...sessionCookieOptions(),
    maxAge: tokens.accessTokenExpiresIn,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...sessionCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
  return response;
}

async function refreshSession(refreshToken: string): Promise<RefreshedTokens | null> {
  const apiUrl = process.env.API_URL;
  if (apiUrl === undefined) {
    return null;
  }
  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { data: RefreshedTokens };
    return payload.data;
  } catch {
    return null;
  }
}

export const config = {
  // Pages and the session route only — not static files, images or Next.js internals.
  matcher: ['/((?!_next/static|_next/image|images/|favicon.ico|robots.txt|sitemap.xml).*)'],
};
