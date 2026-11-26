'use server';

import { isNameLookupKey, nameLookups } from '../../admin/name-lookups';
import {
  nameSchema,
  type NameValues,
  permissionSchema,
  type PermissionValues,
} from '../../validation/admin';
import { type ActionResult, actionFailure, validationFailure } from '../action-result';
import { isValidId, saveRecord } from './save-record';

/** Saves a name-only record (nationality, status, booking source, FAQ category). */
export async function saveNameLookupAction(
  lookup: string,
  id: number | null,
  values: NameValues,
): Promise<ActionResult> {
  if (!isNameLookupKey(lookup) || !isValidId(id)) {
    return actionFailure('This record cannot be saved.');
  }
  const config = nameLookups[lookup];
  const parsed = nameSchema(config.maxLength).safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  return saveRecord({
    apiPath: config.apiPath,
    id,
    body: { name: parsed.data.name },
    redirectTo: config.basePath,
  });
}

export async function savePermissionAction(
  id: number | null,
  values: PermissionValues,
): Promise<ActionResult> {
  const parsed = permissionSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure('This record cannot be saved.');
  }
  return saveRecord({
    apiPath: '/admin/permissions',
    id,
    body: { title: parsed.data.title },
    redirectTo: '/admin/permissions',
  });
}
