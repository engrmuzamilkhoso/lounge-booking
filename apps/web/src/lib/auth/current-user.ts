import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { ApiError } from '../api/api-error';
import { apiRequest } from '../api/server-api';
import { readAccessToken } from './session-cookies';

export interface CurrentUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  cnic: string | null;
  contact: string | null;
  roles: { id: number; title: string | null }[];
}

/**
 * The signed-in user, or null. Cached for the duration of one request, so layouts and pages
 * can both call it without a second API round trip.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const accessToken = await readAccessToken();
  if (accessToken === undefined) {
    return null;
  }
  try {
    return await apiRequest<CurrentUser>('/me');
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      return null;
    }
    throw error;
  }
});

/** For pages that need a signed-in user: sends visitors to sign in and back afterwards. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export function displayName(user: Pick<CurrentUser, 'firstName' | 'lastName' | 'email'>): string {
  const fullName = [user.firstName, user.lastName]
    .filter((part) => part !== null && part !== '')
    .join(' ');
  return fullName === '' ? user.email : fullName;
}
