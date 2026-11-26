import 'server-only';
import { RoleId } from '@booking/shared-types';
import { cache } from 'react';
import { apiRequest } from '../api/server-api';
import { type CurrentUser, requireUser } from '../auth/current-user';

export interface AdminAccess {
  user: CurrentUser;
  permissions: ReadonlySet<string>;
}

/**
 * The signed-in user's permission keys (e.g. `booking_access`), cached for one request.
 * They only decide what the panel shows; the API checks every request itself.
 */
export const getMyPermissions = cache(async (): Promise<ReadonlySet<string>> => {
  const permissions = await apiRequest<string[]>('/me/permissions');
  return new Set(permissions);
});

/** Staff = anyone with a role other than "customer". */
export function isStaff(user: CurrentUser): boolean {
  return user.roles.some((role) => role.id !== RoleId.Customer);
}

/** For admin pages: sends visitors to sign in and returns the user with their permissions. */
export async function getAdminAccess(returnTo: string): Promise<AdminAccess> {
  const user = await requireUser(returnTo);
  const permissions = await getMyPermissions();
  return { user, permissions };
}

/**
 * The CRUD permission keys Laravel used for a resource (`<prefix>_access`, `_show`, `_create`,
 * `_edit`, `_delete`), resolved for the current user.
 */
export interface ResourcePermissions {
  canList: boolean;
  canShow: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function resourcePermissions(
  permissions: ReadonlySet<string>,
  prefix: string,
): ResourcePermissions {
  return {
    canList: permissions.has(`${prefix}_access`),
    canShow: permissions.has(`${prefix}_show`),
    canCreate: permissions.has(`${prefix}_create`),
    canEdit: permissions.has(`${prefix}_edit`),
    canDelete: permissions.has(`${prefix}_delete`),
  };
}
