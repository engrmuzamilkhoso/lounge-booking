'use server';

import { revalidatePath } from 'next/cache';
import { apiRequest } from '../../api/server-api';
import { adminResources, isAdminResource } from '../../admin/resources';
import { type ActionResult, actionFailure, apiFailure } from '../action-result';

/** Deletes one admin record (soft delete in the API). The API checks the `_delete` permission. */
export async function deleteRecordAction(resource: string, id: number): Promise<ActionResult> {
  if (!isAdminResource(resource) || !Number.isInteger(id) || id <= 0) {
    return actionFailure('This record cannot be deleted.');
  }
  const { apiPath, listPath } = adminResources[resource];
  try {
    await apiRequest<null>(`${apiPath}/${id}`, { method: 'DELETE' });
  } catch (error) {
    return apiFailure(error);
  }
  revalidatePath(listPath);
  return { ok: true, data: undefined };
}
