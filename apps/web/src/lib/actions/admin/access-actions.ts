'use server';

import {
  createUserSchema,
  type CreateUserValues,
  roleSchema,
  type RoleValues,
  updateUserSchema,
  type UpdateUserValues,
} from '../../validation/admin';
import { type ActionResult, actionFailure, validationFailure } from '../action-result';
import { isValidId, saveRecord } from './save-record';

function toIds(values: string[]): number[] {
  return values.map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

function optional(value: string): string | undefined {
  return value === '' ? undefined : value;
}

export async function saveRoleAction(id: number | null, values: RoleValues): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure('This record cannot be saved.');
  }
  return saveRecord({
    apiPath: '/admin/roles',
    id,
    body: { title: parsed.data.title, permissionIds: toIds(parsed.data.permissionIds) },
    redirectTo: '/admin/roles',
  });
}

export async function createUserAction(values: CreateUserValues): Promise<ActionResult> {
  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  const user = parsed.data;
  return saveRecord({
    apiPath: '/admin/users',
    id: null,
    body: {
      firstName: user.firstName,
      lastName: optional(user.lastName),
      email: user.email,
      password: user.password,
      cnic: optional(user.cnic),
      contact: optional(user.contact),
      roleIds: toIds(user.roleIds),
    },
    redirectTo: '/admin/users',
  });
}

export async function updateUserAction(
  id: number,
  values: UpdateUserValues,
): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure('This record cannot be saved.');
  }
  const user = parsed.data;
  return saveRecord({
    apiPath: '/admin/users',
    id,
    body: {
      firstName: user.firstName,
      lastName: optional(user.lastName),
      email: user.email,
      // Left empty: the current password stays.
      password: optional(user.password),
      cnic: optional(user.cnic),
      contact: optional(user.contact),
      roleIds: toIds(user.roleIds),
    },
    redirectTo: '/admin/users',
  });
}
