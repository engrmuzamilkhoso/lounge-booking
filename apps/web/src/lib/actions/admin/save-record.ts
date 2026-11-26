import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiRequest } from '../../api/server-api';
import { type ActionResult, apiFailure } from '../action-result';

interface SaveRecordOptions {
  /** e.g. "/admin/cards" */
  apiPath: string;
  /** null creates a record, a number updates that record. */
  id: number | null;
  body: unknown;
  /** Admin page to show afterwards (usually the list). */
  redirectTo: string;
}

/**
 * Shared final step of every admin create/edit action: POST or PATCH to the API, refresh the
 * list, and go back to it with a confirmation. Validation errors from the API come back as
 * field errors for the form.
 */
export async function saveRecord({
  apiPath,
  id,
  body,
  redirectTo,
}: SaveRecordOptions): Promise<ActionResult> {
  try {
    if (id === null) {
      await apiRequest<unknown>(apiPath, { method: 'POST', body });
    } else {
      await apiRequest<unknown>(`${apiPath}/${id}`, { method: 'PATCH', body });
    }
  } catch (error) {
    return apiFailure(error);
  }
  revalidatePath(redirectTo);
  const separator = redirectTo.includes('?') ? '&' : '?';
  redirect(`${redirectTo}${separator}notice=${id === null ? 'created' : 'updated'}`);
}

/** Record ids passed from forms are re-checked before being put into an API path. */
export function isValidId(id: number | null): boolean {
  return id === null || (Number.isInteger(id) && id > 0);
}
