'use server';

import { RoleId } from '@booking/shared-types';
import { redirect } from 'next/navigation';
import { apiRequest } from '../api/server-api';
import type { CurrentUser } from '../auth/current-user';
import { safeReturnPath } from '../auth/safe-redirect';
import {
  clearSession,
  readRefreshToken,
  saveSession,
  type SessionTokens,
} from '../auth/session-cookies';
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
  resetPasswordSchema,
  type ResetPasswordValues,
  signInSchema,
  type SignInValues,
  signUpSchema,
  type SignUpValues,
} from '../validation/auth';
import { type ActionResult, apiFailure, validationFailure } from './action-result';

interface AuthSession extends SessionTokens {
  user: CurrentUser;
}

/** Staff go to the admin panel, customers to the services page (as Laravel did). */
function homeFor(user: CurrentUser): string {
  const isAdmin = user.roles.some((role) => role.id === RoleId.Admin);
  return isAdmin ? '/admin' : '/services';
}

export async function signInAction(
  values: SignInValues,
  returnTo: string | null,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  let session: AuthSession;
  try {
    session = await apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: parsed.data,
      authenticated: false,
    });
  } catch (error) {
    return apiFailure(error);
  }

  await saveSession(session);
  redirect(safeReturnPath(returnTo, homeFor(session.user)));
}

export async function signUpAction(
  values: SignUpValues,
  returnTo: string | null,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  let session: AuthSession;
  try {
    session = await apiRequest<AuthSession>('/auth/register', {
      method: 'POST',
      body: parsed.data,
      authenticated: false,
    });
  } catch (error) {
    return apiFailure(error);
  }

  await saveSession(session);
  redirect(safeReturnPath(returnTo, homeFor(session.user)));
}

/** Completes "Sign in with Google": the API verifies the ID token with Google. */
export async function googleSignInAction(
  idToken: string,
  returnTo: string | null,
): Promise<ActionResult> {
  let session: AuthSession & { isNewAccount: boolean };
  try {
    session = await apiRequest<AuthSession & { isNewAccount: boolean }>('/auth/google', {
      method: 'POST',
      body: { idToken },
      authenticated: false,
    });
  } catch (error) {
    return apiFailure(error);
  }

  await saveSession(session);
  // New Google accounts have no CNIC or contact number yet; ask for them first.
  if (session.isNewAccount) {
    redirect('/account?welcome=google');
  }
  redirect(safeReturnPath(returnTo, homeFor(session.user)));
}

export async function signOutAction(): Promise<void> {
  const refreshToken = await readRefreshToken();
  if (refreshToken !== undefined) {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        authenticated: false,
      });
    } catch {
      // Signing out locally must work even if the API cannot be reached.
    }
  }
  await clearSession();
  redirect('/');
}

export async function forgotPasswordAction(values: ForgotPasswordValues): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  try {
    await apiRequest('/auth/password/forgot', {
      method: 'POST',
      body: parsed.data,
      authenticated: false,
    });
  } catch (error) {
    return apiFailure(error);
  }
  return { ok: true, data: undefined };
}

export async function resetPasswordAction(
  resetToken: string,
  values: ResetPasswordValues,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  try {
    await apiRequest('/auth/password/reset', {
      method: 'POST',
      body: { resetToken, password: parsed.data.password },
      authenticated: false,
    });
  } catch (error) {
    return apiFailure(error);
  }
  return { ok: true, data: undefined };
}
