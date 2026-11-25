import { RoleId } from '@booking/shared-types';
import { NextResponse } from 'next/server';
import { displayName, getCurrentUser } from '@/lib/auth/current-user';

export interface SessionSummary {
  user: { name: string; email: string; avatarUrl: string | null; isStaff: boolean } | null;
}

/**
 * Who is signed in, for the header's account menu. Lets public pages stay prerendered while
 * the menu loads the session in the browser. Returns no tokens.
 */
export async function GET(): Promise<NextResponse<SessionSummary>> {
  const user = await getCurrentUser();
  if (user === null) {
    return NextResponse.json({ user: null });
  }
  const isStaff = user.roles.some((role) => role.id !== RoleId.Customer);
  return NextResponse.json({
    user: { name: displayName(user), email: user.email, avatarUrl: user.avatarUrl, isStaff },
  });
}
